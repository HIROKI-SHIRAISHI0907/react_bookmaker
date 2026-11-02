# -*- coding: utf-8 -*-
"""
cup-schedule-runner（大会の日程・出場選手の取得を起動する Lambda）

EventBridge Scheduler から 1 時間ごとに呼ぶ（例: cron(10 * * * ? *)）。S3 とECS の API だけを使うので、何もしない回はすぐ終わる。

やること
  1) 日程の取得（日程スクレイパー bm-cup-schedule-batch を起動）
     次のどれかのときだけ起動する（無駄に起動しない）:
       - 日程（b026_cup_schedule.json）がまだ無い
       - 大会・出場チーム（b026_cup_competition.json）が日程より新しい（web で登録・変更した）
       - 日程を取ってから SCHEDULE_REFRESH_HOURS 時間たった（延期・組み合わせの決定を拾うため）
     ただし、出場チームが 0 / 同じタスクが動いている / 前回の起動から RELAUNCH_MIN_HOURS 時間たっていない
     （スクレイパーが失敗し続けても毎時起動しないため）ときは起動しない。
  2) 出場選手の取得（B016 の試合詳細スクレイピングへ依頼）
     日程の試合のうち、「試合日の翌日 DETAIL_HOUR_JST 時」を過ぎ、試合日の翌日から LOOKBACK_DAYS 日以内で、
     まだ依頼していない試合を aws-s3-detail-data-csv の b016_game_detail_path_cup.json に書く。
     → S3 のイベント通知で bm-detail-data-trigger が B016 スクレイパー（bm-detail-data-batch）を
       INPUT_JSON_KEY=b016_game_detail_path_cup.json で起動する → B016（登録）が match_detail_* に登録する。
     依頼した試合は b026_cup_detail_request.json に {試合ID: 依頼日時} で残す（同じ試合を二度依頼しない）。
     web の「取り直す」は値を RETRY にする → 期間を過ぎていても、もう一度依頼する。
     延期（status=postponed）の試合は依頼しない。
     b016_game_detail_path_cup.json が RETRIGGER_MINUTES 分たっても残っている（B016 が動いていて起動されなかった）
     ときは、同じ中身で置き直して、もう一度 S3 のイベントを起こす。

環境変数（カッコ内は既定値）
  CUP_BUCKET               (aws-s3-cup-schedule-json)
  COMPETITION_KEY          (b026_cup_competition.json)
  SCHEDULE_KEY             (b026_cup_schedule.json)
  REQUEST_KEY              (b026_cup_detail_request.json)
  LAUNCH_KEY               (b026_cup_schedule_launch.json)  日程スクレイパーを起動した日時
  DETAIL_BUCKET            (aws-s3-detail-data-csv)
  DETAIL_INPUT_KEY         (b016_game_detail_path_cup.json)  ※ S3 通知の prefix「b016_game_detail_path」に合う名前にする
  DETAIL_HOUR_JST          (6)
  LOOKBACK_DAYS            (3)
  RETRIGGER_MINUTES        (60)
  RETRIGGER_MAX            (3)    同じ中身で置き直す最大回数
  RETRIGGER_KEY            (b026_cup_detail_retrigger.json)
  SCHEDULE_REFRESH_HOURS   (72)
  RELAUNCH_MIN_HOURS       (6)
  REQUEST_KEEP_DAYS        (120)  依頼済みの一覧から消すまでの日数
  SCRAPER_CLUSTER          (bm-cup-schedule-cluster)
  SCRAPER_TASK_DEFINITION  (bm-cup-schedule-batch)
  SCRAPER_CONTAINER_NAME   (bm-cup-schedule-scraper)
  SUBNETS / SECURITY_GROUPS  カンマ区切り（日程スクレイパーを起動するのに必須）
  ASSIGN_PUBLIC_IP         (ENABLED)
  DRY_RUN                  (0)  1 なら S3 に書かず・ECS も起動せず、やることだけログに出す

event で上書きできるもの（手動実行用）
  {"forceSchedule": true}  日程スクレイパーを条件なしで起動する（動いていれば起動しない）
  {"skipSchedule": true}   日程の取得をしない
  {"skipDetail": true}     出場選手の依頼をしない
"""

import datetime
import json
import os
from typing import Any, Dict, List, Optional, Tuple
from zoneinfo import ZoneInfo

import boto3
from botocore.exceptions import ClientError

JST = ZoneInfo("Asia/Tokyo")


def env(name: str, default: str) -> str:
    v = os.getenv(name, "").strip()
    return v if v else default


CUP_BUCKET = env("CUP_BUCKET", "aws-s3-cup-schedule-json")
COMPETITION_KEY = env("COMPETITION_KEY", "b026_cup_competition.json")
SCHEDULE_KEY = env("SCHEDULE_KEY", "b026_cup_schedule.json")
REQUEST_KEY = env("REQUEST_KEY", "b026_cup_detail_request.json")
LAUNCH_KEY = env("LAUNCH_KEY", "b026_cup_schedule_launch.json")
DETAIL_BUCKET = env("DETAIL_BUCKET", "aws-s3-detail-data-csv")
DETAIL_INPUT_KEY = env("DETAIL_INPUT_KEY", "b016_game_detail_path_cup.json")
DETAIL_HOUR_JST = int(env("DETAIL_HOUR_JST", "6"))
LOOKBACK_DAYS = int(env("LOOKBACK_DAYS", "3"))
RETRIGGER_MINUTES = int(env("RETRIGGER_MINUTES", "60"))
RETRIGGER_MAX = int(env("RETRIGGER_MAX", "3"))
RETRIGGER_KEY = env("RETRIGGER_KEY", "b026_cup_detail_retrigger.json")
SCHEDULE_REFRESH_HOURS = int(env("SCHEDULE_REFRESH_HOURS", "72"))
RELAUNCH_MIN_HOURS = int(env("RELAUNCH_MIN_HOURS", "6"))
REQUEST_KEEP_DAYS = int(env("REQUEST_KEEP_DAYS", "120"))
SCRAPER_CLUSTER = env("SCRAPER_CLUSTER", "bm-cup-schedule-cluster")
SCRAPER_TASK_DEFINITION = env("SCRAPER_TASK_DEFINITION", "bm-cup-schedule-batch")
SCRAPER_CONTAINER_NAME = env("SCRAPER_CONTAINER_NAME", "bm-cup-schedule-scraper")
SUBNETS = [s.strip() for s in os.getenv("SUBNETS", "").split(",") if s.strip()]
SECURITY_GROUPS = [s.strip() for s in os.getenv("SECURITY_GROUPS", "").split(",") if s.strip()]
ASSIGN_PUBLIC_IP = env("ASSIGN_PUBLIC_IP", "ENABLED")
DRY_RUN = env("DRY_RUN", "0") == "1"

RETRY = "RETRY"
FMT = "%Y-%m-%d %H:%M:%S"

s3 = boto3.client("s3")
ecs = boto3.client("ecs")


def log(msg: str, **kw) -> None:
    print(json.dumps({"msg": msg, **kw}, ensure_ascii=False, default=str), flush=True)


def now_jst() -> datetime.datetime:
    return datetime.datetime.now(JST)


# =========================
# S3
# =========================
def head(bucket: str, key: str) -> Optional[Dict[str, Any]]:
    try:
        return s3.head_object(Bucket=bucket, Key=key)
    except ClientError as e:
        code = e.response.get("Error", {}).get("Code", "")
        if code in ("404", "NoSuchKey", "NotFound"):
            return None
        if code in ("403", "AccessDenied", "Forbidden"):
            # s3:ListBucket が無いと、無いファイルも 403 になる
            log("head_object が 403 でした（ファイルが無い、または s3:ListBucket の権限なし）", bucket=bucket, key=key)
            return None
        raise


def get_json(bucket: str, key: str) -> Tuple[Optional[Any], Optional[str]]:
    """(中身, ETag)。無ければ (None, None)"""
    try:
        res = s3.get_object(Bucket=bucket, Key=key)
    except ClientError as e:
        if e.response.get("Error", {}).get("Code", "") in ("NoSuchKey", "404", "NotFound"):
            return None, None
        raise
    body = res["Body"].read().decode("utf-8-sig")
    return (json.loads(body) if body.strip() else None), res.get("ETag")


def put_json(bucket: str, key: str, obj: Any, if_match: Optional[str] = None, create_only: bool = False) -> None:
    if DRY_RUN:
        log("DRY_RUN: S3 に書きません", bucket=bucket, key=key)
        return
    kw: Dict[str, Any] = {}
    if if_match:
        kw["IfMatch"] = if_match
    elif create_only:
        kw["IfNoneMatch"] = "*"
    s3.put_object(Bucket=bucket, Key=key, ContentType="application/json; charset=UTF-8",
                  Body=json.dumps(obj, ensure_ascii=False, indent=2).encode("utf-8"), **kw)


def is_precondition_failed(e: Exception) -> bool:
    return isinstance(e, ClientError) and e.response.get("Error", {}).get("Code", "") in (
        "PreconditionFailed", "412", "ConditionalRequestConflict")


# =========================
# 1) 日程の取得
# =========================
def family_of(task_definition: str) -> str:
    return task_definition.split("/")[-1].split(":")[0]


def scraper_running() -> List[str]:
    res = ecs.list_tasks(cluster=SCRAPER_CLUSTER, family=family_of(SCRAPER_TASK_DEFINITION),
                         desiredStatus="RUNNING", maxResults=10)
    return res.get("taskArns", [])


def run_schedule_scraper(reason: str) -> str:
    if not SUBNETS or not SECURITY_GROUPS:
        raise RuntimeError("SUBNETS / SECURITY_GROUPS が設定されていません")
    res = ecs.run_task(
        cluster=SCRAPER_CLUSTER,
        taskDefinition=SCRAPER_TASK_DEFINITION,
        launchType="FARGATE",
        platformVersion="LATEST",
        count=1,
        networkConfiguration={"awsvpcConfiguration": {
            "subnets": SUBNETS, "securityGroups": SECURITY_GROUPS, "assignPublicIp": ASSIGN_PUBLIC_IP}},
        overrides={"containerOverrides": [{
            "name": SCRAPER_CONTAINER_NAME,
            "environment": [{"name": "CUP_BUCKET", "value": CUP_BUCKET},
                            {"name": "COMPETITION_KEY", "value": COMPETITION_KEY},
                            {"name": "SCHEDULE_KEY", "value": SCHEDULE_KEY}],
        }]},
        tags=[{"key": "batchCode", "value": "B026"}, {"key": "trigger", "value": reason[:200]}],
        startedBy="lambda-cup-schedule",
    )
    failures = res.get("failures") or []
    tasks = res.get("tasks") or []
    if failures or not tasks:
        raise RuntimeError(f"RunTask に失敗しました: {failures}")
    return tasks[0]["taskArn"]


def step_schedule(comp: Dict[str, Any], comp_head: Dict[str, Any], force: bool) -> Dict[str, Any]:
    team_count = sum(len(c.get("teams") or []) for c in comp.get("competitions") or [])
    if team_count == 0:
        return {"status": "NO_TEAMS"}

    now = now_jst()
    sched_head = head(CUP_BUCKET, SCHEDULE_KEY)
    reason = ""
    if force:
        reason = "force"
    elif sched_head is None:
        reason = "日程がまだ無い"
    elif comp_head["LastModified"] > sched_head["LastModified"]:
        reason = "大会・出場チームが日程より新しい"
    elif now - sched_head["LastModified"].astimezone(JST) >= datetime.timedelta(hours=SCHEDULE_REFRESH_HOURS):
        reason = f"日程を取ってから {SCHEDULE_REFRESH_HOURS} 時間たった"
    if not reason:
        return {"status": "UP_TO_DATE", "scheduleAt": sched_head["LastModified"].astimezone(JST).strftime(FMT)}

    # 前回の起動から RELAUNCH_MIN_HOURS 時間たっていなければ起動しない（失敗し続けても毎時起動しない）
    launch, _ = get_json(CUP_BUCKET, LAUNCH_KEY)
    last = (launch or {}).get("launchedAt")
    if last and not force:
        try:
            last_dt = datetime.datetime.strptime(last, FMT).replace(tzinfo=JST)
            # 日程が前回の起動より後に出力されていれば（成功していれば）待たない
            done_after = sched_head is not None and sched_head["LastModified"].astimezone(JST) >= last_dt
            if not done_after and now - last_dt < datetime.timedelta(hours=RELAUNCH_MIN_HOURS):
                return {"status": "WAIT_RELAUNCH", "reason": reason, "lastLaunchedAt": last}
        except ValueError:
            pass

    running = scraper_running()
    if running:
        return {"status": "SKIPPED_RUNNING", "reason": reason, "running": running}
    if DRY_RUN:
        return {"status": "DRY_RUN", "reason": reason}
    task_arn = run_schedule_scraper(reason)
    put_json(CUP_BUCKET, LAUNCH_KEY, {"launchedAt": now.strftime(FMT), "reason": reason, "taskArn": task_arn})
    log("日程スクレイパーを起動しました", reason=reason, taskArn=task_arn)
    return {"status": "STARTED", "reason": reason, "taskArn": task_arn}


# =========================
# 2) 出場選手の取得を依頼
# =========================
def parse_date(s: Any) -> Optional[datetime.date]:
    try:
        return datetime.date.fromisoformat(str(s)[:10])
    except ValueError:
        return None


def category_of(m: Dict[str, Any]) -> str:
    region = (m.get("region") or "").strip()
    name = (m.get("competitionName") or "").strip()
    cat = f"{region}: {name}" if region else name
    rnd = (m.get("round") or "").strip()
    return f"{cat} - {rnd}" if rnd else cat


def due_matches(schedule: Dict[str, Any], requests: Dict[str, str], now: datetime.datetime) -> List[Dict[str, Any]]:
    out = []
    for m in schedule.get("matches") or []:
        mid = (m.get("mid") or "").strip()
        url = (m.get("url") or "").strip()
        d = parse_date(m.get("date"))
        if not mid or not url or d is None:
            continue
        if (m.get("status") or "") == "postponed":
            continue
        req = requests.get(mid)
        if req is not None and req != RETRY:
            continue  # 依頼済み
        start = datetime.datetime.combine(d + datetime.timedelta(days=1), datetime.time(DETAIL_HOUR_JST), tzinfo=JST)
        end = datetime.datetime.combine(d + datetime.timedelta(days=1 + LOOKBACK_DAYS), datetime.time(23, 59, 59), tzinfo=JST)
        if now < start:
            continue
        if now > end and req != RETRY:
            continue  # 期間を過ぎた（web の「取り直す」で依頼できる）
        out.append(m)
    return out


def prune_requests(requests: Dict[str, str], now: datetime.datetime) -> Dict[str, str]:
    keep_from = now - datetime.timedelta(days=REQUEST_KEEP_DAYS)
    out = {}
    for mid, v in requests.items():
        if v == RETRY:
            out[mid] = v
            continue
        try:
            if datetime.datetime.strptime(v, FMT).replace(tzinfo=JST) >= keep_from:
                out[mid] = v
        except (TypeError, ValueError):
            pass
    return out


def step_detail() -> Dict[str, Any]:
    schedule, _ = get_json(CUP_BUCKET, SCHEDULE_KEY)
    if not schedule:
        return {"status": "NO_SCHEDULE"}
    now = now_jst()

    for attempt in range(3):
        requests, req_etag = get_json(CUP_BUCKET, REQUEST_KEY)
        requests = dict(requests or {})
        due = due_matches(schedule, requests, now)
        if not due:
            return step_retrigger()

        # B016 の入力 JSON（前回の分が残っていれば足す）
        current, cur_etag = get_json(DETAIL_BUCKET, DETAIL_INPUT_KEY)
        items: List[Dict[str, Any]] = [x for x in (current or []) if isinstance(x, dict) and x.get("url")] \
            if isinstance(current, list) else []
        have = {x.get("mid") for x in items}
        for m in due:
            if m["mid"] in have:
                continue
            items.append({"url": m["url"], "date": str(m.get("date"))[:10], "home": m.get("home") or "",
                          "away": m.get("away") or "", "category": category_of(m), "mid": m["mid"]})

        stamp = now.strftime(FMT)
        for m in due:
            requests[m["mid"]] = stamp
        requests = prune_requests(requests, now)
        try:
            # 先に依頼済みの一覧を書く（web の「取り直す」と同時に書いてもどちらかが消えないよう ETag 付き）
            put_json(CUP_BUCKET, REQUEST_KEY, requests, if_match=req_etag, create_only=req_etag is None)
        except ClientError as e:
            if is_precondition_failed(e) and attempt < 2:
                log("依頼済みの一覧が書き換わっていたので読み直します")
                continue
            raise
        put_json(DETAIL_BUCKET, DETAIL_INPUT_KEY, items)
        log("出場選手の取得を依頼しました（B016 の入力 JSON を置きました）",
            bucket=DETAIL_BUCKET, key=DETAIL_INPUT_KEY, added=[m["mid"] for m in due], total=len(items))
        return {"status": "REQUESTED", "added": [m["mid"] for m in due], "total": len(items)}
    return {"status": "CONFLICT"}


def step_retrigger() -> Dict[str, Any]:
    """
    入力 JSON が残っていたら（B016 が動いていて起動されなかった）、置き直して S3 のイベントを起こす。
    同じ中身で RETRIGGER_MAX 回置き直しても消えない（スクレイパーが消せない＝s3:DeleteObject が無い等）ときはやめる
    （同じ試合を何度も取らないため）。回数は RETRIGGER_KEY に {ETag: 回数} で残す。
    """
    h = head(DETAIL_BUCKET, DETAIL_INPUT_KEY)
    if h is None:
        return {"status": "NOTHING_DUE"}
    age = now_jst() - h["LastModified"].astimezone(JST)
    if age < datetime.timedelta(minutes=RETRIGGER_MINUTES):
        return {"status": "PENDING", "ageMinutes": int(age.total_seconds() // 60)}
    current, etag = get_json(DETAIL_BUCKET, DETAIL_INPUT_KEY)
    if not current:
        return {"status": "NOTHING_DUE"}
    state, _ = get_json(CUP_BUCKET, RETRIGGER_KEY)
    count = int((state or {}).get(etag or "", 0))
    if count >= RETRIGGER_MAX:
        log("B016 の入力 JSON が消えません。置き直しをやめます（bm-detail-data-batch のタスクロールに s3:DeleteObject があるか、"
            "スクレイパーのログを確認してください）", bucket=DETAIL_BUCKET, key=DETAIL_INPUT_KEY, retriggered=count)
        return {"status": "GAVE_UP", "retriggered": count}
    put_json(DETAIL_BUCKET, DETAIL_INPUT_KEY, current)
    put_json(CUP_BUCKET, RETRIGGER_KEY, {etag or "": count + 1})
    log("B016 の入力 JSON が残っていたので置き直しました（S3 のイベントを起こす）",
        bucket=DETAIL_BUCKET, key=DETAIL_INPUT_KEY, ageMinutes=int(age.total_seconds() // 60), retriggered=count + 1)
    return {"status": "RETRIGGERED", "retriggered": count + 1}


# =========================
# ハンドラー
# =========================
def lambda_handler(event, context):
    event = event if isinstance(event, dict) else {}
    log("event", event=event, dryRun=DRY_RUN)
    result: Dict[str, Any] = {}

    comp_head = head(CUP_BUCKET, COMPETITION_KEY)
    comp = None
    if comp_head is not None:
        comp, _ = get_json(CUP_BUCKET, COMPETITION_KEY)
    if not comp or not comp.get("competitions"):
        log("大会が登録されていません（何もしません）", bucket=CUP_BUCKET, key=COMPETITION_KEY)
        return {"schedule": {"status": "NO_COMPETITION"}, "detail": {"status": "SKIPPED"}}

    if event.get("skipSchedule"):
        result["schedule"] = {"status": "SKIPPED"}
    else:
        try:
            result["schedule"] = step_schedule(comp, comp_head, bool(event.get("forceSchedule")))
        except Exception as e:
            log("日程スクレイパーを起動できませんでした", error=f"{type(e).__name__}: {e}")
            result["schedule"] = {"status": "ERROR", "error": str(e)}

    if event.get("skipDetail"):
        result["detail"] = {"status": "SKIPPED"}
    else:
        try:
            result["detail"] = step_detail()
        except Exception as e:
            log("出場選手の取得を依頼できませんでした", error=f"{type(e).__name__}: {e}")
            result["detail"] = {"status": "ERROR", "error": str(e)}

    log("result", result=result)
    return result
