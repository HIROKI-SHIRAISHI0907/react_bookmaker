import json
import os
from datetime import datetime
from zoneinfo import ZoneInfo

import boto3
from botocore.exceptions import ClientError

s3 = boto3.client("s3")
ecs = boto3.client("ecs")

JST = ZoneInfo(os.getenv("TIMEZONE", "Asia/Tokyo"))


def build_dated_s3_key(now_jst: datetime, prefix_env: str, default_prefix: str, suffix_env: str, default_suffix: str) -> str:
    prefix = os.getenv(prefix_env, default_prefix)
    suffix = os.getenv(suffix_env, default_suffix)
    date_str = now_jst.strftime("%Y-%m-%d")
    return f"{prefix}{date_str}{suffix}"


def build_today_s3_key(now_jst: datetime) -> str:
    return build_dated_s3_key(
        now_jst=now_jst,
        prefix_env="S3_KEY_PREFIX",
        default_prefix="ecs_slots_",
        suffix_env="S3_KEY_SUFFIX",
        default_suffix=".json",
    )


def build_today_delay_postpone_key(now_jst: datetime) -> str:
    return build_dated_s3_key(
        now_jst=now_jst,
        prefix_env="DELAY_S3_KEY_PREFIX",
        default_prefix="delay_postpone_",
        suffix_env="DELAY_S3_KEY_SUFFIX",
        default_suffix=".json",
    )


def load_json_or_none(bucket: str, key: str, label: str) -> dict | None:
    try:
        response = s3.get_object(Bucket=bucket, Key=key)
        body = response["Body"].read().decode("utf-8")
        data = json.loads(body)

        print(f"Loaded {label} JSON from s3://{bucket}/{key}")
        return data

    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code", "")
        status_code = e.response.get("ResponseMetadata", {}).get("HTTPStatusCode")

        if error_code in ("NoSuchKey", "404", "NotFound") or status_code == 404:
            print(f"{label} JSON not found: s3://{bucket}/{key}")
            return None

        raise


def load_today_json(now_jst: datetime) -> dict | None:
    bucket = os.environ["S3_BUCKET"]
    key = build_today_s3_key(now_jst)
    return load_json_or_none(bucket, key, "ecs_slots")


def load_today_delay_postpone_json(now_jst: datetime) -> dict | None:
    bucket = os.getenv("DELAY_S3_BUCKET", "aws-s3-delay-postpone-csv")
    key = build_today_delay_postpone_key(now_jst)
    return load_json_or_none(bucket, key, "delay_postpone")


def parse_iso_datetime(value) -> datetime | None:
    if value is None:
        return None

    if isinstance(value, datetime):
        dt = value
    else:
        s = str(value).strip()
        if not s:
            return None

        # Z 対応
        if s.endswith("Z"):
            s = s[:-1] + "+00:00"

        try:
            dt = datetime.fromisoformat(s)
        except ValueError:
            # 念のため代表フォーマットも拾う
            for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S"):
                try:
                    dt = datetime.strptime(s, fmt)
                    break
                except ValueError:
                    dt = None
            if dt is None:
                return None

    if dt.tzinfo is None:
        return dt.replace(tzinfo=JST)

    return dt.astimezone(JST)


def is_in_window(now_jst: datetime, start_value, end_value) -> bool:
    start = parse_iso_datetime(start_value)
    end = parse_iso_datetime(end_value)

    if start is None or end is None:
        return False

    return start <= now_jst < end


def is_in_stop_window(now_jst: datetime, data: dict):
    intervals = data.get("ecs_stop_intervals", [])
    for interval in intervals:
        start = interval.get("start")
        end = interval.get("end")
        if is_in_window(now_jst, start, end):
            return True, interval

    return False, None


def find_first_datetime_value(record: dict, candidate_keys: list[str]) -> str | None:
    for key in candidate_keys:
        value = record.get(key)
        if value is not None and str(value).strip():
            return value
    return None


def normalize_text(value) -> str:
    if value is None:
        return ""
    return str(value).strip()


def classify_delay_record(section_name: str, record: dict) -> str | None:
    """
    戻り値:
      - FORCE_RUN: ECSを動かすべき時間帯
      - STOP: ECSを止めてよい時間帯
      - None: 判定対象外
    """
    status_type = normalize_text(
        record.get("status_type")
        or record.get("status")
        or record.get("raw_status_text")
        or record.get("status_text")
    )
    carry_over_label = normalize_text(record.get("carry_over_label"))

    # carry_over セクション、または「〇〇日延期分」は強制稼働
    if section_name == "carry_over_postponed_games":
        return "FORCE_RUN"

    if carry_over_label:
        return "FORCE_RUN"

    if "延期分" in status_type:
        return "FORCE_RUN"

    # 遅延は今日その時間帯に稼働が必要になりやすいので強制稼働
    if "遅延" in status_type:
        return "FORCE_RUN"

    # 単純な「延期」は、その日の試合がなくなった扱いなので停止
    if "延期" in status_type and "延期分" not in status_type:
        return "STOP"

    return None


def build_override_interval(section_name: str, record: dict) -> dict | None:
    """
    delay_postpone.json の各行から ECS 判定用の時間帯を抽出する。
    使う候補キーは広めに取る。
    """
    start_value = find_first_datetime_value(
        record,
        ["busy_start", "slot_start", "start", "scheduled_start", "kickoff_at"],
    )
    end_value = find_first_datetime_value(
        record,
        ["busy_end", "slot_end", "end", "scheduled_end"],
    )

    start_dt = parse_iso_datetime(start_value)
    end_dt = parse_iso_datetime(end_value)

    if start_dt is None or end_dt is None:
        print(
            "Skip delay override row because start/end not found or invalid. "
            f"section={section_name}, category={record.get('category')}, home={record.get('home')}, away={record.get('away')}"
        )
        return None

    if not start_dt < end_dt:
        print(
            "Skip delay override row because interval is invalid. "
            f"section={section_name}, start={start_value}, end={end_value}"
        )
        return None

    action = classify_delay_record(section_name, record)
    if action is None:
        return None

    return {
        "action": action,
        "start": start_dt.isoformat(),
        "end": end_dt.isoformat(),
        "section": section_name,
        "status_type": normalize_text(record.get("status_type") or record.get("status")),
        "carry_over_label": normalize_text(record.get("carry_over_label")),
        "category": normalize_text(record.get("category")),
        "home": normalize_text(record.get("home")),
        "away": normalize_text(record.get("away")),
        "mid": normalize_text(record.get("mid")),
        "url": normalize_text(record.get("url")),
    }


def extract_delay_postpone_overrides(delay_data: dict | None) -> dict:
    result = {
        "force_run_intervals": [],
        "extra_stop_intervals": [],
    }

    if not delay_data:
        return result

    target_sections = [
        "matched_delay_postpone_games",
        "carry_over_postponed_games",
    ]

    for section_name in target_sections:
        rows = delay_data.get(section_name, [])
        if not isinstance(rows, list):
            continue

        for row in rows:
            if not isinstance(row, dict):
                continue

            interval = build_override_interval(section_name, row)
            if interval is None:
                continue

            if interval["action"] == "FORCE_RUN":
                result["force_run_intervals"].append(interval)
            elif interval["action"] == "STOP":
                result["extra_stop_intervals"].append(interval)

    print(
        "Extracted delay overrides: "
        f"force_run={len(result['force_run_intervals'])}, "
        f"extra_stop={len(result['extra_stop_intervals'])}"
    )
    return result

def get_ecs_family(task_definition: str) -> str:
    """
    ECS_TASK_DEFINITION は "bm-batch" のように family 名のみの場合と、
    "bm-batch:17" のようにリビジョン付きの場合の両方があり得るため、
    family 名部分だけを取り出す。
    """
    return task_definition.split(":", 1)[0]


def has_running_task(cluster: str, family: str) -> tuple[bool, list[str]]:
    """
    同じタスク定義family(=このスクレイパー)のタスクが、
    現在desired status=RUNNINGで存在するかを確認する。

    desiredStatus="RUNNING" は「起動が指示された状態」のタスクを返すため、
    PROVISIONING/PENDING/RUNNINGいずれの状態のタスクも含まれる。
    起動直後でまだ完全にRUNNINGになっていないタスクも
    重複起動防止の対象にできる。
    """
    task_arns: list[str] = []
    paginator = ecs.get_paginator("list_tasks")
    for page in paginator.paginate(cluster=cluster, family=family, desiredStatus="RUNNING"):
        task_arns.extend(page.get("taskArns", []))
    return (len(task_arns) > 0), task_arns

def find_matching_interval(now_jst: datetime, intervals: list[dict]):
    for interval in intervals:
        if is_in_window(now_jst, interval.get("start"), interval.get("end")):
            return True, interval
    return False, None

def run_ecs_task():
    cluster = os.environ["ECS_CLUSTER"]
    task_definition = os.environ["ECS_TASK_DEFINITION"]
    launch_type = os.getenv("ECS_LAUNCH_TYPE", "FARGATE")
    subnets = [x.strip() for x in os.getenv("ECS_SUBNETS", "").split(",") if x.strip()]
    security_groups = [x.strip() for x in os.getenv("ECS_SECURITY_GROUPS", "").split(",") if x.strip()]
    assign_public_ip = os.getenv("ECS_ASSIGN_PUBLIC_IP", "DISABLED")

    container_name = os.getenv("ECS_CONTAINER_NAME", "")
    batch_mode = os.getenv("BATCH_MODE", "")
    bm_job = os.getenv("BM_JOB", "")

    overrides = {}
    if container_name and (batch_mode or bm_job):
        envs = []
        if batch_mode:
            envs.append({"name": "BATCH_MODE", "value": batch_mode})
        if bm_job:
            envs.append({"name": "BM_JOB", "value": bm_job})

        overrides = {
            "containerOverrides": [
                {
                    "name": container_name,
                    "environment": envs
                }
            ]
        }

    params = {
        "cluster": cluster,
        "taskDefinition": task_definition,
        "count": 1,
        "launchType": launch_type
    }

    if launch_type.upper() == "FARGATE":
        params["networkConfiguration"] = {
            "awsvpcConfiguration": {
                "subnets": subnets,
                "securityGroups": security_groups,
                "assignPublicIp": assign_public_ip
            }
        }

    if overrides:
        params["overrides"] = overrides

    response = ecs.run_task(**params)
    print("run_task response:", json.dumps(response, default=str))

    failures = response.get("failures", [])
    tasks = response.get("tasks", [])

    if failures:
        raise Exception(f"ECS RunTask failed: {failures}")

    return tasks

def lambda_handler(event, context):
    now_jst = datetime.now(JST)
    print(f"Current JST time: {now_jst.isoformat()}")

    # 0. 前回起動したECSタスクがまだ稼働中なら、今回は起動しない（多重起動防止）
    cluster = os.environ["ECS_CLUSTER"]
    task_definition = os.environ["ECS_TASK_DEFINITION"]
    family = get_ecs_family(task_definition)
    try:
        running, task_arns = has_running_task(cluster, family)
    except Exception as e:
        # list_tasks自体に失敗した場合は、安全側（多重起動防止を優先）に倒して起動しない
        print(f"Failed to check running ECS tasks. Skip ECS run. reason={e}")
        return {
            "executed": False,
            "reason": "LIST_TASKS_FAILED",
            "message": str(e)
        }

    if running:
        print(f"Skip ECS run because a task is already running. family={family} task_arns={task_arns}")
        return {
            "executed": False,
            "reason": "ALREADY_RUNNING",
            "running_task_arns": task_arns
        }

    # 1. まず従来の ecs_slots JSON を読む
    try:
        data = load_today_json(now_jst)
    except Exception as e:
        print(f"Failed to load ecs_slots JSON. Skip ECS run. reason={e}")
        return {
            "executed": False,
            "reason": "JSON_LOAD_FAILED",
            "message": str(e)
        }

    # 2. delay_postpone JSON を読む（無ければ無視、異常系は安全側で起動しない）
    try:
        delay_data = load_today_delay_postpone_json(now_jst)
    except Exception as e:
        print(f"Failed to load delay_postpone JSON. Skip ECS run. reason={e}")
        return {
            "executed": False,
            "reason": "DELAY_JSON_LOAD_FAILED",
            "message": str(e)
        }

    overrides = extract_delay_postpone_overrides(delay_data)

    force_run_matched, force_run_interval = find_matching_interval(
        now_jst, overrides["force_run_intervals"]
    )
    extra_stop_matched, extra_stop_interval = find_matching_interval(
        now_jst, overrides["extra_stop_intervals"]
    )

    # 3. ecs_slots JSON が存在しない場合
    #    ただし delay_postpone の強制停止時間帯なら起動しない
    if data is None:
        if extra_stop_matched and not force_run_matched:
            print(f"Skip ECS run by delay_postpone STOP override. matched interval={extra_stop_interval}")
            return {
                "executed": False,
                "reason": "DELAY_POSTPONE_STOP_WINDOW",
                "matched_interval": extra_stop_interval
            }

        print("Today ecs_slots JSON does not exist.")
        print("Run ECS task because no base stop schedule exists.")
        tasks = run_ecs_task()
        return {
            "executed": True,
            "reason": "JSON_NOT_FOUND_RUN_ECS",
            "task_count": len(tasks),
            "task_arns": [t.get("taskArn") for t in tasks],
            "delay_override_applied": force_run_matched or extra_stop_matched,
            "delay_force_run_interval": force_run_interval,
            "delay_extra_stop_interval": extra_stop_interval,
        }

    # 4. 通常停止時間帯を確認
    base_stop_matched, base_interval = is_in_stop_window(now_jst, data)

    # 優先順位:
    #   FORCE_RUN > EXTRA_STOP > BASE_STOP
    if force_run_matched:
        print(f"Run ECS by delay_postpone FORCE_RUN override. matched interval={force_run_interval}")
        tasks = run_ecs_task()
        return {
            "executed": True,
            "reason": "DELAY_POSTPONE_FORCE_RUN",
            "task_count": len(tasks),
            "task_arns": [t.get("taskArn") for t in tasks],
            "matched_interval": force_run_interval,
            "base_stop_matched": base_stop_matched,
            "base_matched_interval": base_interval,
        }

    if extra_stop_matched:
        print(f"Skip ECS run by delay_postpone STOP override. matched interval={extra_stop_interval}")
        return {
            "executed": False,
            "reason": "DELAY_POSTPONE_STOP_WINDOW",
            "matched_interval": extra_stop_interval,
            "base_stop_matched": base_stop_matched,
            "base_matched_interval": base_interval,
        }

    if base_stop_matched:
        print(f"Skip ECS run. matched base ecs_stop_interval={base_interval}")
        return {
            "executed": False,
            "reason": "STOP_WINDOW",
            "matched_interval": base_interval
        }

    tasks = run_ecs_task()
    return {
        "executed": True,
        "reason": "OUTSIDE_STOP_WINDOW",
        "task_count": len(tasks),
        "task_arns": [t.get("taskArn") for t in tasks],
        "delay_override_loaded": delay_data is not None,
        "delay_force_run_count": len(overrides["force_run_intervals"]),
        "delay_extra_stop_count": len(overrides["extra_stop_intervals"]),
    }