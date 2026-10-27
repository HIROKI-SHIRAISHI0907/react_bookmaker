import json
import os
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import boto3
from botocore.exceptions import ClientError

AWS_REGION = os.getenv("AWS_REGION", "ap-northeast-1")
TIMEZONE = os.getenv("TIMEZONE", "Asia/Tokyo")

s3 = boto3.client("s3", region_name=AWS_REGION)
ecs = boto3.client("ecs", region_name=AWS_REGION)

JST = ZoneInfo(TIMEZONE)

# =========================================================
# 共通設定（Lambda環境変数）
# =========================================================
ECS_LAUNCH_TYPE = os.getenv("ECS_LAUNCH_TYPE", "FARGATE")
ECS_ASSIGN_PUBLIC_IP = os.getenv("ECS_ASSIGN_PUBLIC_IP", "ENABLED")

ECS_SECURITY_GROUPS = [
    x.strip()
    for x in os.getenv("ECS_SECURITY_GROUPS", "").split(",")
    if x.strip()
]

ECS_SUBNETS = [
    x.strip()
    for x in os.getenv("ECS_SUBNETS", "").split(",")
    if x.strip()
]

DEFAULT_BATCH_MODE = os.getenv("BATCH_MODE", "worker")

# =========================================================
# B094設定
# =========================================================

# ecs_slots_YYYY-MM-DD.json が存在するS3バケット
ECS_SLOTS_BUCKET = os.getenv("ECS_SLOTS_BUCKET", "")

# ecs_slotsファイルが配置されているパス
# ルート直下の場合は空文字
ECS_SLOTS_PREFIX = os.getenv("ECS_SLOTS_PREFIX", "")

# Lambdaの実行間隔（分）
#
# 例：
# EventBridgeが3分間隔なら 3
# EventBridgeが5分間隔なら 5
#
# 境界値を取りこぼさないため、
# 実際の実行間隔以上を設定してください。
B094_CHECK_INTERVAL_MINUTES = int(
    os.getenv("B094_CHECK_INTERVAL_MINUTES", "5")
)


# =========================================================
# 汎用
# =========================================================

def get_env_or_default(name: str, default: str = "") -> str:
    value = os.getenv(name, "").strip()
    return value if value else default


def split_env_list(name: str, default: str = "") -> list:
    """カンマ区切りの環境変数をリストにする（空要素は除く）"""
    return [
        x.strip()
        for x in get_env_or_default(name, default).split(",")
        if x.strip()
    ]


def scraper_guard(bm_job: str, default_family: str) -> dict:
    """
    スクレイパー(ECSタスク)が実行中の間は、そのJOBをスキップするための設定。

    環境変数で上書き可能:
      JOB_{bm_job}_SCRAPER_FAMILY   : スクレイパーのタスク定義ファミリー（空で無効）
      JOB_{bm_job}_SCRAPER_CLUSTER  : スクレイパーのクラスター（空なら全クラスターを検索）
      JOB_{bm_job}_QUIET_MINUTES    : 最新CSV更新からN分以内はスキップ（0で無効）
    """
    return {
        "skip_if_running_tasks": [
            {
                "cluster": get_env_or_default(
                    f"JOB_{bm_job}_SCRAPER_CLUSTER", ""
                ),
                "family": get_env_or_default(
                    f"JOB_{bm_job}_SCRAPER_FAMILY", default_family
                ),
            },
        ],
        "quiet_minutes": int(
            get_env_or_default(f"JOB_{bm_job}_QUIET_MINUTES", "0")
        ),
    }


# =========================================================
# BM_JOBごとの設定
# =========================================================
JOB_RULES = {
    "B002": {
        "cluster": "arn:aws:ecs:ap-northeast-1:287190274071:cluster/batch-backend",
        "check_type": "csv_exists_outside_json",
        "bucket": "aws-s3-team-member-csv",
        "default_task_definition": "bookmakers-batch",
        "default_container_name": "bookmakers-batch",
        **scraper_guard("B002", "team-member-batch"),
    },

    "B003": {
        "cluster": "arn:aws:ecs:ap-northeast-1:287190274071:cluster/batch-backend",
        "check_type": "csv_exists_outside_json",
        "bucket": "aws-s3-season-csv",
        "default_task_definition": "bookmakers-batch",
        "default_container_name": "bookmakers-batch",
        **scraper_guard("B003", "season-batch"),
    },

    "B004": {
        "cluster": "arn:aws:ecs:ap-northeast-1:287190274071:cluster/batch-backend",
        "check_type": "csv_exists_outside_json",
        "bucket": "aws-s3-team-csv",
        "default_task_definition": "bookmakers-batch",
        "default_container_name": "bookmakers-batch",
        **scraper_guard("B004", "team-batch"),
    },

    "B005": {
        "cluster": "arn:aws:ecs:ap-northeast-1:287190274071:cluster/batch-backend",
        "check_type": "csv_exists_outside_json",
        "bucket": "aws-s3-future-csv",
        "default_task_definition": "bookmakers-batch",
        "default_container_name": "bookmakers-batch",
        **scraper_guard("B005", "future-batch"),
    },

    "B008": {
        "cluster": "arn:aws:ecs:ap-northeast-1:287190274071:cluster/stats-backend",
        "check_type": "csv_exists_outside_json",
        "bucket": "aws-s3-outputs-csv",
        "default_task_definition": "bookmakers-batch",
        "default_container_name": "bookmakers-batch",
    },

    "B010": {
        "cluster": "arn:aws:ecs:ap-northeast-1:287190274071:cluster/batch-backend",
        "check_type": "csv_exists_outside_json",
        "bucket": "aws-s3-outputs-fin-csv",
        "default_task_definition": "bookmakers-batch",
        "default_container_name": "bookmakers-batch",
        **scraper_guard("B010", "bm-fin-batch"),
    },

    "B014": {
        "cluster": "arn:aws:ecs:ap-northeast-1:287190274071:cluster/batch-backend",
        "check_type": "csv_exists_outside_json",
        "bucket": "aws-s3-geografic-csv",
        "default_task_definition": "bookmakers-batch",
        "default_container_name": "bookmakers-batch",
        **scraper_guard("B014", "geografic-batch"),   # 既定は無効。環境変数 JOB_B014_SCRAPER_FAMILY で指定可
    },

    # =====================================================
    # B015（ファイルアップロード反映）
    #
    # aws-s3-upload-check-csv の uploaded/ 配下に .zip が1件以上あれば実行する。
    #   - uploaded/ フォルダだけ（中身が空）・フォルダ用の空オブジェクトだけ → スキップ
    #   - error/ ・ success/ の zip は数えない
    # 同じ BM_JOB=B015 の bookmakers-batch タスクが実行中ならスキップする
    # （zip は B015 が処理し終わるまで uploaded/ に残るため、
    #   実行中に次の Lambda が来ても二重に起動しない）。
    #
    # 環境変数で上書き可能:
    #   JOB_B015_UPLOAD_BUCKET   : 既定 aws-s3-upload-check-csv
    #   JOB_B015_UPLOAD_PREFIX   : 既定 uploaded/
    # =====================================================
    "B015": {
        "cluster": "arn:aws:ecs:ap-northeast-1:287190274071:cluster/batch-backend",
        "check_type": "zip_exists_under_prefix",
        "bucket": get_env_or_default("JOB_B015_UPLOAD_BUCKET", "aws-s3-upload-check-csv"),
        "prefix": get_env_or_default("JOB_B015_UPLOAD_PREFIX", "uploaded/"),
        "default_task_definition": "bookmakers-batch",
        "default_container_name": "bookmakers-batch",
        "skip_if_same_job_running": True,
    },

    # =====================================================
    # B016（試合詳細データ登録 bm_b016）
    #
    # aws-s3-detail-data-csv に b016_game_detail_path.json 以外のファイルがあれば実行する。
    #   - b016_game_detail_path.json（スクレイパーの入力。B012 が毎日上書き）は数えない
    #   - _done/（取得済みの目印）・_skipped/（試合IDが分からず飛ばしたURLの一覧）は
    #     登録後もずっと残るので数えない（数えると毎回「対象あり」になる）
    #   - フォルダ用の空オブジェクト（キーが / で終わるもの）は数えない
    #   → 実際に対象になるのは <試合日>/<ホーム>_vs_<アウェー>_<試合ID>/ の CSV・manifest
    # 同じ BM_JOB=B016 の bookmakers-batch タスクが実行中ならスキップする（二重起動しない）。
    # スクレイパー（bm-detail-data-batch）の実行中は止めない
    # （B016 は manifest がそろったフォルダだけを登録するので、取得途中の試合は次回に回る）。
    #
    # 環境変数で上書き可能:
    #   JOB_B016_BUCKET            : 既定 aws-s3-detail-data-csv
    #   JOB_B016_EXCLUDE_KEYS      : 既定 b016_game_detail_path.json（カンマ区切り）
    #   JOB_B016_EXCLUDE_PREFIXES  : 既定 _done/,_skipped/（カンマ区切り）
    # =====================================================
    "B016": {
        "cluster": "arn:aws:ecs:ap-northeast-1:287190274071:cluster/batch-backend",
        "check_type": "objects_exist_except",
        "bucket": get_env_or_default("JOB_B016_BUCKET", "aws-s3-detail-data-csv"),
        "exclude_keys": split_env_list("JOB_B016_EXCLUDE_KEYS", "b016_game_detail_path.json"),
        "exclude_prefixes": split_env_list("JOB_B016_EXCLUDE_PREFIXES", "_done/,_skipped/"),
        "default_task_definition": "bookmakers-batch",
        "default_container_name": "bookmakers-batch",
        "skip_if_same_job_running": True,
    },

    # =====================================================
    # B094
    # =====================================================
    "B094": {
        "cluster": "arn:aws:ecs:ap-northeast-1:287190274071:cluster/batch-backend",
        "check_type": "ecs_slot_boundary",
        "default_task_definition": "bookmakers-batch",
        "default_container_name": "bookmakers-batch",
    },

    "B096": {
        "cluster": "arn:aws:ecs:ap-northeast-1:287190274071:cluster/batch-backend",
        "check_type": "unnotified_mail_exists",
        "bucket": "aws-s3-mail",
        "default_task_definition": "bookmakers-batch",
        "default_container_name": "bookmakers-batch",
    },
}


def resolve_bm_job(event: dict) -> str:
    return str(
        (event or {}).get("BM_JOB")
        or os.getenv("BM_JOB", "")
    ).strip()


def resolve_batch_mode() -> str:
    return os.getenv("BATCH_MODE", "worker").strip()


def resolve_task_definition(event: dict, bm_job: str, rule: dict) -> str:
    event_value = str((event or {}).get("ECS_TASK_DEFINITION", "")).strip()
    if event_value:
        return event_value

    env_value = get_env_or_default(f"JOB_{bm_job}_TASK_DEFINITION")
    if env_value:
        return env_value

    env_fallback = get_env_or_default("ECS_TASK_DEFINITION")
    if env_fallback:
        return env_fallback

    return rule.get("default_task_definition", "").strip()


def resolve_container_name(event: dict, bm_job: str, rule: dict) -> str:
    event_value = str((event or {}).get("ECS_CONTAINER_NAME", "")).strip()
    if event_value:
        return event_value

    env_value = get_env_or_default(f"JOB_{bm_job}_CONTAINER_NAME")
    if env_value:
        return env_value

    env_fallback = get_env_or_default("ECS_CONTAINER_NAME")
    if env_fallback:
        return env_fallback

    return rule.get("default_container_name", "").strip()


# =========================================================
# S3 存在確認
# =========================================================

def object_exists(bucket: str, key: str) -> bool:
    try:
        s3.head_object(Bucket=bucket, Key=key)
        return True

    except ClientError as e:
        code = e.response.get("Error", {}).get("Code", "")
        if code in ("404", "NoSuchKey", "NotFound"):
            return False
        raise


def unnotified_mail_exists(bucket: str):
    paginator = s3.get_paginator("list_objects_v2")

    for page in paginator.paginate(Bucket=bucket):
        for obj in page.get("Contents", []):
            key = obj.get("Key", "")

            if not key or not key.lower().endswith(".json"):
                continue

            try:
                response = s3.get_object(Bucket=bucket, Key=key)
                content = response["Body"].read().decode("utf-8")

                if not content.strip():
                    continue

                data = json.loads(content)

                if not isinstance(data, dict):
                    continue

                for mail_process_key, value in data.items():
                    if value == "":
                        return True, key, mail_process_key

            except (json.JSONDecodeError, UnicodeDecodeError) as e:
                print(
                    f"Skip invalid JSON. "
                    f"bucket={bucket}, key={key}, error={e}"
                )
                continue

    return False, None, None


def object_exists_by_prefix_suffix(bucket: str, prefix: str, suffix: str):
    paginator = s3.get_paginator("list_objects_v2")

    for page in paginator.paginate(Bucket=bucket, Prefix=prefix):
        for obj in page.get("Contents", []):
            key = obj.get("Key", "")
            if key and key.endswith(suffix):
                return True, key

    return False, None


def objects_exist_except(bucket: str, exclude_keys: list, exclude_prefixes: list):
    """
    バケット内に、除外するキー・除外するプレフィックス以外のオブジェクトが1件以上あるか。

    - フォルダ用の空オブジェクト（キーが / で終わるもの）は数えない
    - exclude_keys      : 完全一致で除外（例: b016_game_detail_path.json）
    - exclude_prefixes  : 先頭一致で除外（例: _done/, _skipped/）

    例: 2026-10-24/ナポリ_vs_ローマ_SzXZwanC/match_ナポリ_vs_ローマ_SzXZwanC.csv → (True, key)
        b016_game_detail_path.json と _done/SzXZwanC.json だけ → (False, None)
    """
    exclude_key_set = set(exclude_keys or [])
    prefixes = tuple(exclude_prefixes or [])

    paginator = s3.get_paginator("list_objects_v2")

    for page in paginator.paginate(Bucket=bucket):
        for obj in page.get("Contents", []):
            key = obj.get("Key", "")

            if not key or key.endswith("/"):
                continue
            if key in exclude_key_set:
                continue
            if prefixes and key.startswith(prefixes):
                continue
            return True, key

    return False, None


def zip_exists_under_prefix(bucket: str, prefix: str):
    """
    prefix 配下（サブフォルダも含む）に .zip が1件以上あるか。

    - フォルダ用の空オブジェクト（キーが / で終わるもの）は数えない
    - 0バイトのオブジェクトも数えない
    - 拡張子は大文字・小文字を区別しない（.ZIP も対象）

    例: uploaded/season/20261019/1/season_20261019084900.zip → (True, key)
        uploaded/ だけ → (False, None)
    """
    paginator = s3.get_paginator("list_objects_v2")

    for page in paginator.paginate(Bucket=bucket, Prefix=prefix):
        for obj in page.get("Contents", []):
            key = obj.get("Key", "")

            if not key or key.endswith("/"):
                continue
            if int(obj.get("Size", 0) or 0) <= 0:
                continue
            if key.lower().endswith(".zip"):
                return True, key

    return False, None


def csv_exists_outside_json(bucket: str):
    paginator = s3.get_paginator("list_objects_v2")

    for page in paginator.paginate(Bucket=bucket):
        for obj in page.get("Contents", []):
            key = obj.get("Key", "")

            if not key or key.endswith("/"):
                continue
            if key.startswith("json/"):
                continue
            if key.lower().endswith(".csv"):
                return True, key

    return False, None


def latest_csv_outside_json(bucket: str):
    """
    json/ 以外のCSVのうち、更新時刻が一番新しいものを返す。
    list_objects_v2 の LastModified を使うので追加のAPI呼び出しはない。
    """
    paginator = s3.get_paginator("list_objects_v2")

    latest_key = None
    latest_time = None

    for page in paginator.paginate(Bucket=bucket):
        for obj in page.get("Contents", []):
            key = obj.get("Key", "")

            if not key or key.endswith("/"):
                continue
            if key.startswith("json/"):
                continue
            if not key.lower().endswith(".csv"):
                continue

            last_modified = obj.get("LastModified")  # UTC aware datetime
            if latest_time is None or last_modified > latest_time:
                latest_time = last_modified
                latest_key = key

    return latest_key, latest_time


# =========================================================
# スクレイパー実行中チェック
# =========================================================

def list_all_clusters():
    paginator = ecs.get_paginator("list_clusters")
    clusters = []
    for page in paginator.paginate():
        clusters.extend(page.get("clusterArns", []))
    return clusters


def is_ecs_task_running(cluster: str, family: str):
    """
    family のタスクが RUNNING/PENDING なら (True, task_arn) を返す。
    cluster が空なら全クラスターを検索する。
    """
    clusters = [cluster] if cluster else list_all_clusters()

    for c in clusters:
        # desiredStatus="RUNNING" は PENDING（起動中）も含む
        response = ecs.list_tasks(
            cluster=c,
            family=family,
            desiredStatus="RUNNING",
            maxResults=1,
        )
        task_arns = response.get("taskArns", [])
        if task_arns:
            return True, task_arns[0]

    return False, None


def is_bm_job_task_running(cluster: str, family: str, container_name: str, bm_job: str):
    """
    family（例: bookmakers-batch）のタスクのうち、
    コンテナの環境変数 BM_JOB が bm_job のものが RUNNING/PENDING なら (True, task_arn) を返す。

    bookmakers-batch は全バッチ共通のタスク定義なので、family だけでは判定できない。
    Lambda・web（EcsBatchTaskRunner）どちらから起動しても
    containerOverrides に BM_JOB が入るので、それで見分ける。
    """
    paginator = ecs.get_paginator("list_tasks")

    for page in paginator.paginate(
        cluster=cluster,
        family=family,
        desiredStatus="RUNNING",
    ):
        task_arns = page.get("taskArns", [])
        if not task_arns:
            continue

        # describe_tasks は1回100件まで
        for i in range(0, len(task_arns), 100):
            response = ecs.describe_tasks(
                cluster=cluster,
                tasks=task_arns[i:i + 100],
            )

            for task in response.get("tasks", []):
                overrides = task.get("overrides", {}) or {}

                for co in overrides.get("containerOverrides", []) or []:
                    if container_name and co.get("name") != container_name:
                        continue

                    for env in co.get("environment", []) or []:
                        if env.get("name") == "BM_JOB" and env.get("value") == bm_job:
                            return True, task.get("taskArn")

    return False, None


def check_same_job_running(bm_job: str, rule: dict):
    """
    同じ BM_JOB のタスク（bookmakers-batch）が実行中なら (True, reason) を返す。
    rule に skip_if_same_job_running が無ければ何もしない。
    """
    if not rule.get("skip_if_same_job_running"):
        return False, None

    family = resolve_task_definition({}, bm_job, rule).split(":")[0]
    container_name = resolve_container_name({}, bm_job, rule)
    running, task_arn = is_bm_job_task_running(
        rule.get("cluster", ""), family, container_name, bm_job
    )

    print(
        f"Same job check. bm_job={bm_job}, family={family}, "
        f"running={running}, task={task_arn}"
    )

    if running:
        return True, f"SAME_JOB_RUNNING:{bm_job}:{task_arn}"

    return False, None


def check_scraping_in_progress(bucket: str, rule: dict, now_jst: datetime):
    """
    スクレイピング中なら (True, reason) を返す。
    """
    # -----------------------------------------------------
    # スクレイパーのECSタスクが実行中か
    # -----------------------------------------------------
    for target in rule.get("skip_if_running_tasks", []):
        cluster = (target.get("cluster") or "").strip()
        family = (target.get("family") or "").strip()

        if not family:
            continue

        running, task_arn = is_ecs_task_running(cluster, family)

        print(
            f"Scraper check. family={family}, "
            f"cluster={cluster or 'ALL'}, "
            f"running={running}, task={task_arn}"
        )

        if running:
            return True, f"SCRAPER_TASK_RUNNING:{family}:{task_arn}"

    # -----------------------------------------------------
    # 直近で書き込みがあったか（予備判定）
    # -----------------------------------------------------
    quiet_minutes = int(rule.get("quiet_minutes", 0) or 0)

    if quiet_minutes > 0:
        key, last_modified = latest_csv_outside_json(bucket)

        if last_modified is not None:
            elapsed = now_jst - last_modified

            print(
                f"Latest CSV. bucket={bucket}, key={key}, "
                f"last_modified={last_modified.astimezone(JST).isoformat()}, "
                f"elapsed_sec={int(elapsed.total_seconds())}"
            )

            if elapsed < timedelta(minutes=quiet_minutes):
                return (
                    True,
                    f"SCRAPER_WRITING:{bucket}/{key}:"
                    f"last_modified={last_modified.astimezone(JST).isoformat()}",
                )

    return False, None


# =========================================================
# B094
# ecs_slots JSON取得
# =========================================================

def get_ecs_slots(now_jst: datetime):
    """
    日本時間の日付を使って ecs_slots_YYYY-MM-DD.json をS3から取得する。
    """
    if not ECS_SLOTS_BUCKET:
        raise Exception("ECS_SLOTS_BUCKET_NOT_SET")

    date_str = now_jst.strftime("%Y-%m-%d")
    file_name = f"ecs_slots_{date_str}.json"

    if ECS_SLOTS_PREFIX:
        key = f"{ECS_SLOTS_PREFIX.rstrip('/')}/{file_name}"
    else:
        key = file_name

    print(f"B094 ecs_slots load. bucket={ECS_SLOTS_BUCKET}, key={key}")

    try:
        response = s3.get_object(Bucket=ECS_SLOTS_BUCKET, Key=key)
        content = response["Body"].read().decode("utf-8")
        return json.loads(content), key

    except ClientError as e:
        code = e.response.get("Error", {}).get("Code", "")
        if code in ("404", "NoSuchKey", "NotFound"):
            print(
                f"B094 ecs_slots not found. "
                f"bucket={ECS_SLOTS_BUCKET}, key={key}"
            )
            return None, key
        raise


# =========================================================
# B094
# start / end取得
# =========================================================

def get_ecs_slot_boundaries(ecs_slots: dict):
    """
    ecs_stop_intervalsから start / end を取得する。
    """
    boundaries = []

    for interval in ecs_slots.get("ecs_stop_intervals", []):
        start_str = interval.get("start")
        end_str = interval.get("end")

        if start_str:
            boundaries.append({
                "type": "start",
                "time": datetime.fromisoformat(start_str),
                "value": start_str,
            })

        if end_str:
            boundaries.append({
                "type": "end",
                "time": datetime.fromisoformat(end_str),
                "value": end_str,
            })

    boundaries.sort(key=lambda x: x["time"])
    return boundaries


# =========================================================
# B094
# 境界値チェック
# =========================================================

def check_b094_boundary(now_jst: datetime):
    """
    Lambdaの実行間隔を考慮して、
    前回チェック時刻～現在時刻の間に start または end の境界値が存在するか確認する。

    例：
        実行間隔 = 3分
        前回 15:27 / 現在 15:30 / 境界 15:30 → B094実行
    """
    ecs_slots, key = get_ecs_slots(now_jst)

    if ecs_slots is None:
        return False, f"ECS_SLOTS_NOT_FOUND:{key}"

    boundaries = get_ecs_slot_boundaries(ecs_slots)

    if not boundaries:
        return False, "NO_ECS_STOP_INTERVALS"

    previous_check_time = now_jst - timedelta(
        minutes=B094_CHECK_INTERVAL_MINUTES
    )

    print(
        f"B094 boundary check. "
        f"previous={previous_check_time.isoformat()}, "
        f"current={now_jst.isoformat()}"
    )

    for boundary in boundaries:
        boundary_time = boundary["time"]

        # タイムゾーンがない場合はJSTとして扱う
        if boundary_time.tzinfo is None:
            boundary_time = boundary_time.replace(tzinfo=JST)
        else:
            boundary_time = boundary_time.astimezone(JST)

        # 前回チェック以降に境界を通過したか
        if previous_check_time < boundary_time <= now_jst:
            reason = (
                f"B094_BOUNDARY:{boundary['type']}:{boundary['value']}"
            )
            print(f"B094 boundary reached. {reason}")
            return True, reason

    return False, "B094_NO_BOUNDARY_REACHED"


# =========================================================
# BM_JOB 実行可否判定
# =========================================================

def should_run_job(bm_job: str, now_jst: datetime):
    rule = JOB_RULES.get(bm_job)

    if not rule:
        return False, f"UNKNOWN_JOB:{bm_job}", {}

    check_type = rule.get("check_type", "")

    # =====================================================
    # B094
    # =====================================================
    if bm_job == "B094":
        can_run, reason = check_b094_boundary(now_jst)
        return can_run, reason, rule

    # =====================================================
    # 通常JOB
    # =====================================================
    if not check_type:
        return True, "NO_CHECK_TYPE:ALWAYS_RUN", rule

    bucket = rule.get("bucket", "")

    if check_type == "csv_exists_outside_json":

        # スクレイピング中ならスキップ
        # （skip_if_running_tasks / quiet_minutes を設定したJOBのみ）
        if rule.get("skip_if_running_tasks") or rule.get("quiet_minutes"):
            in_progress, skip_reason = check_scraping_in_progress(
                bucket, rule, now_jst
            )
            if in_progress:
                return False, skip_reason, rule

        found, key = csv_exists_outside_json(bucket)

        if found:
            return True, f"FOUND:{bucket}/{key}", rule

        return False, f"NO_CSV_OUTSIDE_JSON:{bucket}", rule

    if check_type == "zip_exists_under_prefix":
        prefix = rule.get("prefix", "")

        found, key = zip_exists_under_prefix(bucket, prefix)

        if not found:
            # uploaded/ が無い・uploaded/ だけで中身が空・zip 以外しか無い
            return False, f"NO_ZIP_UNDER_PREFIX:{bucket}/{prefix}", rule

        # 同じ BM_JOB のタスクが実行中ならスキップ（二重起動しない）
        running, running_reason = check_same_job_running(bm_job, rule)
        if running:
            return False, running_reason, rule

        return True, f"FOUND:{bucket}/{key}", rule

    if check_type == "objects_exist_except":
        exclude_keys = rule.get("exclude_keys", [])
        exclude_prefixes = rule.get("exclude_prefixes", [])

        found, key = objects_exist_except(bucket, exclude_keys, exclude_prefixes)

        if not found:
            # 除外するファイル（入力JSON・_done/・_skipped/）しか無い
            return (
                False,
                f"NO_OBJECTS_EXCEPT:{bucket}:exclude={exclude_keys + exclude_prefixes}",
                rule,
            )

        # 同じ BM_JOB のタスクが実行中ならスキップ（二重起動しない）
        running, running_reason = check_same_job_running(bm_job, rule)
        if running:
            return False, running_reason, rule

        return True, f"FOUND:{bucket}/{key}", rule

    if check_type == "object_exists":
        key = rule["key"]

        if object_exists(bucket, key):
            return True, f"FOUND:{bucket}/{key}", rule

        return False, f"NOT_FOUND:{bucket}/{key}", rule

    if check_type == "object_exists_by_prefix_suffix":
        prefix = rule["prefix"]
        suffix = rule["suffix"]

        found, key = object_exists_by_prefix_suffix(bucket, prefix, suffix)

        if found:
            return True, f"FOUND:{bucket}/{key}", rule

        return (
            False,
            f"NOT_FOUND_PREFIX_SUFFIX:{bucket}/{prefix}*{suffix}",
            rule,
        )

    if check_type == "unnotified_mail_exists":
        found, json_key, mail_process_key = unnotified_mail_exists(bucket)

        if found:
            return (
                True,
                f"UNNOTIFIED_FOUND:{bucket}/{json_key}:{mail_process_key}",
                rule,
            )

        return False, f"NO_UNNOTIFIED_MAIL:{bucket}", rule

    return False, f"UNSUPPORTED_CHECK_TYPE:{check_type}", rule


# =========================================================
# ECS 実行
# =========================================================

def run_ecs_task(
    cluster_name: str,
    task_definition: str,
    container_name: str,
    bm_job: str,
    batch_mode: str,
):
    envs = [
        {"name": "BATCH_MODE", "value": batch_mode},
        {"name": "BM_JOB", "value": bm_job},
    ]

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
        },
    }

    if ECS_LAUNCH_TYPE.upper() == "FARGATE":
        params["networkConfiguration"] = {
            "awsvpcConfiguration": {
                "subnets": ECS_SUBNETS,
                "securityGroups": ECS_SECURITY_GROUPS,
                "assignPublicIp": ECS_ASSIGN_PUBLIC_IP,
            }
        }

    print(
        "run_task params:",
        json.dumps(params, ensure_ascii=False, default=str),
    )

    response = ecs.run_task(**params)

    print(
        "run_task response:",
        json.dumps(response, ensure_ascii=False, default=str),
    )

    failures = response.get("failures", [])
    tasks = response.get("tasks", [])

    if failures:
        raise Exception(f"ECS RunTask failed: {failures}")

    return tasks


# =========================================================
# Lambda Handler
# =========================================================

def lambda_handler(event, context):
    event = event or {}

    # 現在の日本時間
    now_jst = datetime.now(JST)

    print(f"Current JST time: {now_jst.isoformat()}")
    print("event:", json.dumps(event, ensure_ascii=False, default=str))

    # BM_JOB
    bm_job = resolve_bm_job(event)

    if not bm_job:
        return {"executed": False, "reason": "BM_JOB_NOT_SET"}

    # BATCH_MODE
    batch_mode = resolve_batch_mode()

    # 実行可否判定
    can_run, reason, rule = should_run_job(bm_job, now_jst)

    # ECS設定
    task_definition = (
        resolve_task_definition(event, bm_job, rule) if rule else ""
    )
    container_name = (
        resolve_container_name(event, bm_job, rule) if rule else ""
    )
    cluster_name = rule.get("cluster") if rule else ""

    # 実行しない
    if not can_run:
        print(f"Skip ECS run. bm_job={bm_job}, reason={reason}")

        return {
            "executed": False,
            "bm_job": bm_job,
            "batch_mode": batch_mode,
            "cluster": cluster_name,
            "task_definition": task_definition,
            "container_name": container_name,
            "reason": reason,
        }

    # Clusterチェック
    if not cluster_name:
        return {
            "executed": False,
            "bm_job": bm_job,
            "batch_mode": batch_mode,
            "reason": f"CLUSTER_NOT_SET:{bm_job}",
        }

    # Task Definitionチェック
    if not task_definition:
        return {
            "executed": False,
            "bm_job": bm_job,
            "batch_mode": batch_mode,
            "cluster": cluster_name,
            "reason": f"TASK_DEFINITION_NOT_SET:{bm_job}",
        }

    # Containerチェック
    if not container_name:
        return {
            "executed": False,
            "bm_job": bm_job,
            "batch_mode": batch_mode,
            "cluster": cluster_name,
            "task_definition": task_definition,
            "reason": f"CONTAINER_NAME_NOT_SET:{bm_job}",
        }

    # =====================================================
    # ECS起動
    # =====================================================
    tasks = run_ecs_task(
        cluster_name=cluster_name,
        task_definition=task_definition,
        container_name=container_name,
        bm_job=bm_job,
        batch_mode=batch_mode,
    )

    return {
        "executed": True,
        "bm_job": bm_job,
        "batch_mode": batch_mode,
        "cluster": cluster_name,
        "task_definition": task_definition,
        "container_name": container_name,
        "task_count": len(tasks),
        "task_arns": [t.get("taskArn") for t in tasks],
        "reason": reason,
    }
