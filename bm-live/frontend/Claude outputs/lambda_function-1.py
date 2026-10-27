# lambda_function.py
"""
b025_fin_season_all_data.json（web A021 が出力する「国-リーグ → シーズン終了日時」）を読み、
JOB_TYPE に応じて ECS を起動する。

  JOB_TYPE=FIN（シーズン終了処理）
    終了日（JST の日付）から FIN_DAYS(=4) 日たった国リーグがあれば、
    bookmakers-batch を BM_JOB=B013 で起動する（データ削除・バックアップ・統計CSV削除）。
    B013 は終了日時から3日（72時間）たったリーグを処理するので、日付で数えて4日目に起動すると空振りしない。
    B013 は処理し終えたリーグに b025_fin_season_all_data.json 上で "(season=READFIN)" を付けるので、
    付いているリーグは対象外。

  JOB_TYPE=SEASON / TEAM / ALLLEAGUE（次シーズン情報の取得）
    終了日（JST の日付）から STALE_DAYS(=45) 日たった国リーグがあれば、スクレイパーを起動する。
    スクレイパーは b025_fin_season_data.json を読んで動くので、
      - b025 に載っていない（B013 未実行）国リーグ
      - その JOB の READFIN マーカーが付いている（取得済み）国リーグ
    は対象外にする（毎日むだに起動しない）。

event 例:
  {"JOB_TYPE": "FIN"}
  {"JOB_TYPE": "SEASON", "TRIGGERED_BY_UI": "FALSE"}
"""
import os
import json
import logging
from datetime import datetime, timezone, date
from zoneinfo import ZoneInfo

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# =========================================================
# AWS クライアント
# =========================================================
AWS_REGION = os.getenv("AWS_REGION", "ap-northeast-1")
TIMEZONE   = os.getenv("TIMEZONE", "Asia/Tokyo")

s3  = boto3.client("s3",  region_name=AWS_REGION)
ecs = boto3.client("ecs", region_name=AWS_REGION)

JST = ZoneInfo(TIMEZONE)

# =========================================================
# 環境変数（共通）
# =========================================================
BUCKET_NAME    = os.getenv("BUCKET_NAME", "aws-s3-next-season-info-csv")
ALL_DATA_KEY   = os.getenv("ALL_DATA_KEY", "b025_fin_season_all_data.json")   # 全リーグの終了日時（web が出力）
FIN_DATA_KEY   = os.getenv("OBJECT_KEY",   "b025_fin_season_data.json")       # 終了処理済みリーグ（B013 が出力）
FIN_DAYS       = int(os.getenv("FIN_DAYS", "4"))
STALE_DAYS     = int(os.getenv("STALE_DAYS", "45"))
# 45日を過ぎても Flashscore が次シーズンを出さない（リーグ廃止・名前変更など）リーグを、毎日起動し続けないための上限。0 は無制限
STALE_MAX_DAYS = int(os.getenv("STALE_MAX_DAYS", "180"))

ECS_LAUNCH_TYPE      = os.getenv("ECS_LAUNCH_TYPE", "FARGATE")
ECS_ASSIGN_PUBLIC_IP = os.getenv("ECS_ASSIGN_PUBLIC_IP", "ENABLED")
ECS_SECURITY_GROUPS  = [x.strip() for x in os.getenv("ECS_SECURITY_GROUPS", "").split(",") if x.strip()]
ECS_SUBNETS          = [x.strip() for x in os.getenv("ECS_SUBNETS", "").split(",") if x.strip()]

SEASON_READFIN_MARKER = "(season=READFIN)"
TEAM_READFIN_MARKER   = "(team=READFIN)"

# =========================================================
# JOB定義
#   mode=FIN   : 終了日 + FIN_DAYS 日で bookmakers-batch（B013）
#   mode=STALE : 終了日 + STALE_DAYS 日でスクレイパー
#   readfin_markers: このマーカーが全部付いていれば取得済みとして対象外
# =========================================================
JOB_RULES = {
    "FIN": {
        "mode": "FIN",
        "cluster": "arn:aws:ecs:ap-northeast-1:287190274071:cluster/batch-backend",
        "default_task_definition": "bookmakers-batch",
        "default_container_name":  "bookmakers-batch",
        "bm_job": "B013",
    },
    "SEASON": {
        "mode": "STALE",
        "cluster": "arn:aws:ecs:ap-northeast-1:287190274071:cluster/season-cluster",
        "default_task_definition": "season-batch",
        "default_container_name":  "season-scraper",
        "readfin_markers": [SEASON_READFIN_MARKER],
    },
    "TEAM": {
        "mode": "STALE",
        "cluster": "arn:aws:ecs:ap-northeast-1:287190274071:cluster/team-cluster",
        "default_task_definition": "team-batch",
        "default_container_name":  "team-scraper",
        "readfin_markers": [TEAM_READFIN_MARKER],
    },
    "ALLLEAGUE": {
        "mode": "STALE",
        "cluster": "arn:aws:ecs:ap-northeast-1:287190274071:cluster/all-league-cluster",
        "default_task_definition": "all-league-batch",
        "default_container_name":  "all-league-scraper",
        "readfin_markers": [SEASON_READFIN_MARKER, TEAM_READFIN_MARKER],
    },
}


# =========================================================
# 汎用ヘルパー
# =========================================================
def _to_bool(val, default: bool = False) -> bool:
    """
    "TRUE"/"FALSE"/"true"/"false"/True/False/1/0 を bool に変換
    """
    if val is None:
        return default
    if isinstance(val, bool):
        return val
    if isinstance(val, (int, float)):
        return bool(val)
    s = str(val).strip().upper()
    if s in ("TRUE", "1", "YES", "Y"):
        return True
    if s in ("FALSE", "0", "NO", "N", ""):
        return False
    return default


def get_env_or_default(name: str, default: str = "") -> str:
    value = os.getenv(name, "").strip()
    return value if value else default


def resolve_job_type(event: dict) -> str:
    """
    event または環境変数から JOB_TYPE を取得する。
    デフォルトは SEASON。
    """
    return str(
        (event or {}).get("JOB_TYPE")
        or os.getenv("JOB_TYPE", "SEASON")
    ).strip().upper()


def resolve_triggered_by_ui(event: dict) -> bool:
    """
    event → 環境変数 → default(False) の優先順で TRIGGERED_BY_UI を判定
    """
    if event and "TRIGGERED_BY_UI" in event:
        return _to_bool(event["TRIGGERED_BY_UI"], default=False)
    if event and "triggered_by_ui" in event:
        return _to_bool(event["triggered_by_ui"], default=False)
    return _to_bool(os.getenv("TRIGGERED_BY_UI"), default=False)


def resolve_task_definition(event: dict, job_type: str, rule: dict) -> str:
    event_value = str((event or {}).get("ECS_TASK_DEFINITION", "")).strip()
    if event_value:
        return event_value

    env_value = get_env_or_default(f"JOB_{job_type}_TASK_DEFINITION")
    if env_value:
        return env_value

    env_fallback = get_env_or_default("ECS_TASK_DEFINITION")
    if env_fallback and rule.get("mode") != "FIN":
        # 共通の ECS_TASK_DEFINITION はスクレイパー用なので、FIN（bookmakers-batch）には使わない
        return env_fallback

    return rule.get("default_task_definition", "").strip()


def resolve_container_name(event: dict, job_type: str, rule: dict) -> str:
    event_value = str((event or {}).get("ECS_CONTAINER_NAME", "")).strip()
    if event_value:
        return event_value

    env_value = get_env_or_default(f"JOB_{job_type}_CONTAINER_NAME")
    if env_value:
        return env_value

    env_fallback = get_env_or_default("ECS_CONTAINER_NAME")
    if env_fallback and rule.get("mode") != "FIN":
        return env_fallback

    return rule.get("default_container_name", "").strip()


# =========================================================
# S3 読み込み
# =========================================================
def load_json_dict_safe(bucket: str, key: str):
    """
    S3 から {キー: 値} の JSON を読み込む。
    ファイルが無い場合は {}、読めなかった場合は None を返す（例外にしない）。
    """
    try:
        resp = s3.get_object(Bucket=bucket, Key=key)
        body = resp["Body"].read().decode("utf-8")
        data = json.loads(body)
        if not isinstance(data, dict):
            logger.warning("Unexpected format (not dict): s3://%s/%s", bucket, key)
            return None
        logger.info("Loaded %d entries from s3://%s/%s", len(data), bucket, key)
        return data
    except ClientError as e:
        code = e.response.get("Error", {}).get("Code", "Unknown")
        if code in ("NoSuchKey", "404"):
            logger.info("Not found: s3://%s/%s", bucket, key)
            return {}
        logger.warning("Failed to get object from S3 (Code=%s): s3://%s/%s", code, bucket, key)
        return None
    except json.JSONDecodeError as e:
        logger.warning("Failed to parse JSON s3://%s/%s: %s", bucket, key, e)
        return None
    except Exception as e:
        logger.warning("Unexpected error while loading s3://%s/%s: %s", bucket, key, e)
        return None


# =========================================================
# 日時パース
# =========================================================
def parse_finished_at(value: str) -> datetime:
    """
    "2026-07-21 12:00:00+00" / "2027-06-06 23:59:59+09" / "2026-07-21T23:59:59+09:00"
    のような文字列を datetime に変換する。
    末尾の "(season=READFIN)" / "(team=READFIN)" 等のマーカーは無視する。
    タイムゾーンが無い場合は UTC とみなす。
    """
    if value is None:
        raise ValueError("empty datetime string")

    v = str(value).strip()

    # (xxx=YYY) 形式のマーカーを全部除去
    while "(" in v and ")" in v:
        lp = v.rfind("(")
        rp = v.find(")", lp)
        if lp < 0 or rp < 0 or rp < lp:
            break
        v = (v[:lp] + v[rp + 1:]).strip()

    v = v.strip()
    if not v:
        raise ValueError("empty datetime after strip")

    v = v.replace(" ", "T")

    # "+00" / "+09" / "-03" を "+0000" 形式に補正
    if len(v) >= 3 and (v[-3] in ("+", "-")) and v[-2:].isdigit():
        v = v + "00"

    dt = datetime.fromisoformat(v)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def days_since_end(end_at: datetime, today_jst: date) -> int:
    """終了日（JST の日付）から今日（JST）まで何日たったか。終了日当日は 0。"""
    return (today_jst - end_at.astimezone(JST).date()).days


# =========================================================
# 対象の抽出
# =========================================================
def find_fin_targets(all_data: dict, fin_data: dict, today_jst: date) -> list:
    """
    終了日から FIN_DAYS 日たち、まだ B013 が終了処理していない国リーグを返す。
    次のどちらかなら処理済みとみなす。
      - b025_fin_season_all_data.json の値に "(season=READFIN)" が付いている（B013 が付ける）
      - b025_fin_season_data.json に同じ国リーグが同じ（以降の）終了日で載っている（B013 が書く）
    2つ目は、マーカーの書き込みに失敗した・web と同時に書いて消えた場合の保険。
    （B013 は終了日を NULL にするので、マーカーが消えると B013 を何度起動しても付け直されない）
    """
    targets = []
    for key, end_str in all_data.items():
        if SEASON_READFIN_MARKER in str(end_str or ""):
            logger.info("FIN already done: %s (%s)", key, end_str)
            continue

        try:
            end_at = parse_finished_at(end_str)
        except Exception as e:
            logger.warning("Skip %s: invalid datetime %r (%s)", key, end_str, e)
            continue

        days = days_since_end(end_at, today_jst)
        if days < FIN_DAYS:
            logger.info("FIN not yet: %s (end=%s, %d days)", key, end_str, days)
            continue

        done_str = fin_data.get(key)
        if done_str:
            try:
                done_at = parse_finished_at(done_str)
                if done_at.astimezone(JST).date() >= end_at.astimezone(JST).date():
                    logger.info("FIN already done (in %s): %s (%s)", FIN_DATA_KEY, key, done_str)
                    continue
            except Exception:
                # b025 側の日付が読めない場合は未処理として扱う
                pass

        targets.append({"key": key, "finished_at": str(end_str), "elapsed_days": days})
        logger.info("FIN target: %s (end=%s, %d days)", key, end_str, days)
    return targets


def find_stale_targets(all_data: dict, fin_data: dict, today_jst: date, markers: list) -> list:
    """
    終了日から STALE_DAYS 日たち、B013 は処理済み（b025 に載っている）で、
    この JOB の READFIN マーカーがまだ付いていない国リーグを返す。
    """
    targets = []
    for key, end_str in all_data.items():
        try:
            end_at = parse_finished_at(end_str)
        except Exception as e:
            logger.warning("Skip %s: invalid datetime %r (%s)", key, end_str, e)
            continue

        days = days_since_end(end_at, today_jst)
        if days < STALE_DAYS:
            logger.info("fresh: %s (end=%s, %d days) < %d days", key, end_str, days, STALE_DAYS)
            continue
        if STALE_MAX_DAYS > 0 and days > STALE_MAX_DAYS:
            logger.warning("Give up %s: %d days > STALE_MAX_DAYS(%d). 次シーズンが取れていません。リーグ名・パスを確認してください。",
                           key, days, STALE_MAX_DAYS)
            continue

        done_str = fin_data.get(key)
        if not done_str:
            logger.info("Skip %s: not in %s yet (B013 not done)", key, FIN_DATA_KEY)
            continue

        if markers and all(m in str(done_str) for m in markers):
            logger.info("Skip %s: already READFIN (%s)", key, done_str)
            continue

        targets.append({"key": key, "finished_at": str(end_str), "elapsed_days": days})
        logger.info("STALE target: %s (end=%s, %d days)", key, end_str, days)
    return targets


# =========================================================
# ECS
# =========================================================
def get_task_family(task_definition: str) -> str:
    name = task_definition.rsplit("/", 1)[-1]
    return name.rsplit(":", 1)[0]


def is_same_job_running(cluster: str, task_definition: str, container_name: str, bm_job: str = "") -> bool:
    """
    同じタスク定義ファミリーのタスクが PENDING/RUNNING なら True。
    bm_job を指定した場合は、コンテナの環境変数 BM_JOB が同じタスクだけを見る
    （bookmakers-batch は他の BM_JOB でも同じタスク定義を使うため）。
    """
    family = get_task_family(task_definition)
    arns = []
    for status in ("RUNNING", "PENDING"):
        paginator = ecs.get_paginator("list_tasks")
        for page in paginator.paginate(cluster=cluster, family=family, desiredStatus=status):
            arns.extend(page.get("taskArns", []))

    if not arns:
        return False
    if not bm_job:
        return True

    for i in range(0, len(arns), 100):
        resp = ecs.describe_tasks(cluster=cluster, tasks=arns[i:i + 100])
        for task in resp.get("tasks", []):
            for co in task.get("overrides", {}).get("containerOverrides", []):
                if container_name and co.get("name") != container_name:
                    continue
                for env in co.get("environment", []):
                    if env.get("name") == "BM_JOB" and env.get("value") == bm_job:
                        return True
    return False


def run_ecs_task(cluster_name: str,
                 task_definition: str,
                 container_name: str,
                 envs: list) -> dict:
    params = {
        "cluster": cluster_name,
        "taskDefinition": task_definition,
        "count": 1,
        "launchType": ECS_LAUNCH_TYPE,
        "overrides": {
            "containerOverrides": [
                {
                    "name": container_name,
                    "environment": envs,
                }
            ]
        }
    }

    if ECS_LAUNCH_TYPE.upper() == "FARGATE":
        params["networkConfiguration"] = {
            "awsvpcConfiguration": {
                "subnets":        ECS_SUBNETS,
                "securityGroups": ECS_SECURITY_GROUPS,
                "assignPublicIp": ECS_ASSIGN_PUBLIC_IP,
            }
        }

    logger.info("run_task params: %s", json.dumps(params, ensure_ascii=False, default=str))

    try:
        response = ecs.run_task(**params)
    except ClientError as e:
        logger.error("ECS RunTask failed: %s", e)
        return {"skipped": False, "error": str(e), "taskArns": [], "failures": []}

    failures  = response.get("failures", [])
    tasks     = response.get("tasks", [])
    task_arns = [t.get("taskArn") for t in tasks]

    logger.info("ECS RunTask response: taskArns=%s failures=%s", task_arns, failures)
    return {"skipped": False, "taskArns": task_arns, "failures": failures}


# =========================================================
# Lambda Handler
# =========================================================
def lambda_handler(event, context):
    """
    処理概要:
      1. b025_fin_season_all_data.json（全リーグの終了日時）と
         b025_fin_season_data.json（B013 が処理したリーグ）を読む。
      2. JOB_TYPE=FIN   : 終了日 + FIN_DAYS 日たち (season=READFIN) が無いリーグ → bookmakers-batch（B013）を起動。
         それ以外       : 終了日 + STALE_DAYS 日たった未取得リーグ → スクレイパーを起動。
      3. 対象が0件、または同じ JOB が実行中なら何もしない。
    """
    event = event or {}
    now_jst   = datetime.now(JST)
    today_jst = now_jst.date()

    logger.info("Current JST time: %s", now_jst.isoformat())
    logger.info("Event: %s", json.dumps(event, ensure_ascii=False, default=str))

    # 0) 設定解決
    job_type        = resolve_job_type(event)
    triggered_by_ui = resolve_triggered_by_ui(event)

    rule = JOB_RULES.get(job_type)
    if not rule:
        logger.warning("Unknown JOB_TYPE: %s", job_type)
        return {"executed": False, "reason": f"UNKNOWN_JOB_TYPE:{job_type}"}

    mode            = rule["mode"]
    cluster_name    = rule.get("cluster", "")
    task_definition = resolve_task_definition(event, job_type, rule)
    container_name  = resolve_container_name(event, job_type, rule)

    logger.info(
        "Config: job_type=%s mode=%s triggered_by_ui=%s bucket=%s all=%s fin=%s fin_days=%s stale_days=%s",
        job_type, mode, triggered_by_ui, BUCKET_NAME, ALL_DATA_KEY, FIN_DATA_KEY, FIN_DAYS, STALE_DAYS
    )
    logger.info("ECS: cluster=%s task_definition=%s container=%s",
                cluster_name, task_definition, container_name)

    # 1) JSON 読み込み
    all_data = load_json_dict_safe(BUCKET_NAME, ALL_DATA_KEY)
    if not all_data:
        logger.info("%s is empty or not readable. abort.", ALL_DATA_KEY)
        return {"statusCode": 200, "aborted": True, "reason": f"{ALL_DATA_KEY} empty or not readable"}

    fin_data = load_json_dict_safe(BUCKET_NAME, FIN_DATA_KEY)
    if fin_data is None:
        # 「無い」は {}。None は読めなかった（権限・壊れている）ので、誤起動しないよう止める
        logger.info("%s is not readable. abort.", FIN_DATA_KEY)
        return {"statusCode": 200, "aborted": True, "reason": f"{FIN_DATA_KEY} not readable"}

    # 2) 対象の抽出
    if mode == "FIN":
        targets = find_fin_targets(all_data, fin_data, today_jst)
    else:
        targets = find_stale_targets(all_data, fin_data, today_jst, rule.get("readfin_markers", []))

    if not targets:
        logger.info("No targets (job_type=%s). nothing to do.", job_type)
        return {"statusCode": 200, "executed": False, "job_type": job_type,
                "target_count": 0, "total": len(all_data)}

    # 3) 事前チェック
    if not cluster_name:
        return {"executed": False, "job_type": job_type, "reason": f"CLUSTER_NOT_SET:{job_type}"}
    if not task_definition:
        return {"executed": False, "job_type": job_type, "cluster": cluster_name,
                "reason": f"TASK_DEFINITION_NOT_SET:{job_type}"}
    if not container_name:
        return {"executed": False, "job_type": job_type, "cluster": cluster_name,
                "task_definition": task_definition, "reason": f"CONTAINER_NAME_NOT_SET:{job_type}"}

    bm_job = rule.get("bm_job", "")
    try:
        if is_same_job_running(cluster_name, task_definition, container_name, bm_job):
            logger.info("Same job is already running (job_type=%s bm_job=%s). skip.", job_type, bm_job)
            return {"statusCode": 200, "executed": False, "job_type": job_type,
                    "reason": "ALREADY_RUNNING", "targets": targets}
    except ClientError as e:
        logger.warning("Failed to check running tasks. skip. reason=%s", e)
        return {"statusCode": 200, "executed": False, "job_type": job_type,
                "reason": "ECS_LIST_TASKS_FAILED", "message": str(e)}

    # 4) ECS RunTask
    if mode == "FIN":
        envs = [
            {"name": "BATCH_MODE", "value": "worker"},
            {"name": "BM_JOB",     "value": bm_job},
        ]
    else:
        envs = [
            {"name": "TRIGGERED_BY_UI",    "value": "true" if triggered_by_ui else "false"},
            {"name": "STALE_LEAGUES_JSON", "value": json.dumps(targets, ensure_ascii=False)},
        ]

    logger.info("Found %d targets. Triggering ECS task (%s)...", len(targets), job_type)
    result = run_ecs_task(cluster_name, task_definition, container_name, envs)

    return {
        "statusCode": 200,
        "executed": not result.get("error") and not result.get("failures"),
        "job_type": job_type,
        "mode": mode,
        "triggered_by_ui": triggered_by_ui,
        "cluster": cluster_name,
        "task_definition": task_definition,
        "container_name": container_name,
        "target_count": len(targets),
        "total": len(all_data),
        "targets": targets,
        "ecs_result": result,
    }
