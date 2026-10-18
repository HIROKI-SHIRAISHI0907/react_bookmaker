#!/usr/bin/env bash
# ローカル（Mac 等）から、EC2 上の dump_soccer_bm_all.sh を SSM Run Command で実行する。
#  EC2 が停止中なら 起動 → SSM Online 待ち → 実行 → 停止 まで自動で行う。
#  （元から起動していた EC2 は止めない）
#
#   ./dump_soccer_all.sh
#   DBS="soccer_bm soccer_bm_master" ./dump_soccer_all.sh  … DB を指定（EC2 側にそのまま渡す）
#   DOWNLOAD=1 ./dump_soccer_all.sh                        … 終わったら S3 の LATEST をローカルに取得
#   KEEP_RUNNING=1 ./dump_soccer_all.sh                    … 終わっても EC2 を止めない
#   FORCE_STOP=1 ./dump_soccer_all.sh                      … 元から起動していても最後に止める
#
#  EC2 側に渡す環境変数: DBS / EXCLUDE_TABLE_DATA / NO_UPLOAD / KEEP_DIR / S3_BUCKET / S3_PREFIX
#  前提: ローカルに aws CLI v2・jq。
#        ローカルの IAM に ec2:DescribeInstances / StartInstances / StopInstances、
#        ssm:SendCommand / GetCommandInvocation / DescribeInstanceInformation。
set -euo pipefail

export AWS_REGION="${AWS_REGION:-ap-northeast-1}"
INSTANCE_ID="${INSTANCE_ID:-i-0a52e9645e63dafa1}"
INSTANCE_NAME="${INSTANCE_NAME:-}"                # INSTANCE_ID を空にして Name タグで探す場合
REMOTE_DIR="${REMOTE_DIR:-/home/ssm-user}"        # EC2 上でシェルを置いている場所
REMOTE_SCRIPT="${REMOTE_SCRIPT:-dump_soccer_bm_all.sh}"
REMOTE_USER="${REMOTE_USER:-}"                    # 既定は root（SSM 標準）。指定すると sudo -u で実行
TIMEOUT_SEC="${TIMEOUT_SEC:-3600}"                # EC2 側の実行タイムアウト
POLL_SEC="${POLL_SEC:-10}"
SSM_WAIT_SEC="${SSM_WAIT_SEC:-600}"               # 起動後 SSM が Online になるまで待つ最大秒数
KEEP_RUNNING="${KEEP_RUNNING:-0}"
FORCE_STOP="${FORCE_STOP:-0}"
WAIT_STOP="${WAIT_STOP:-1}"                       # 1 なら stopped になるまで待ってから終了
DOWNLOAD="${DOWNLOAD:-0}"
LOCAL_DIR="${LOCAL_DIR:-$HOME/db_dump}"
PASS_ENVS="DBS EXCLUDE_TABLE_DATA NO_UPLOAD KEEP_DIR S3_BUCKET S3_PREFIX"

command -v aws >/dev/null 2>&1 || { echo "aws not found（brew install awscli）"; exit 1; }
command -v jq  >/dev/null 2>&1 || { echo "jq not found（brew install jq）"; exit 1; }

log() { echo "[$(date '+%H:%M:%S')] $*"; }

# --- 対象インスタンス ---
if [[ -z "$INSTANCE_ID" ]]; then
  [[ -z "$INSTANCE_NAME" ]] && { echo "ERROR: INSTANCE_ID か INSTANCE_NAME を指定してください"; exit 1; }
  INSTANCE_ID="$(aws ec2 describe-instances --region "$AWS_REGION" \
    --filters "Name=tag:Name,Values=${INSTANCE_NAME}" "Name=instance-state-name,Values=pending,running,stopping,stopped" \
    --query 'Reservations[].Instances[].InstanceId' --output text | awk '{print $1}')"
  [[ -z "$INSTANCE_ID" || "$INSTANCE_ID" == "None" ]] && { echo "ERROR: インスタンスが見つかりません: Name=${INSTANCE_NAME}"; exit 1; }
fi

ec2_state() {
  aws ec2 describe-instances --region "$AWS_REGION" --instance-ids "$INSTANCE_ID" \
    --query 'Reservations[0].Instances[0].State.Name' --output text
}
ssm_ping() {
  aws ssm describe-instance-information --region "$AWS_REGION" \
    --filters "Key=InstanceIds,Values=${INSTANCE_ID}" \
    --query 'InstanceInformationList[0].PingStatus' --output text 2>/dev/null || echo None
}

# --- 終了時の停止処理（失敗・Ctrl+C でも走る）---
STARTED_BY_US=0
cleanup() {
  local rc=$?
  set +e
  if [[ "$KEEP_RUNNING" != "1" && ( "$STARTED_BY_US" == "1" || "$FORCE_STOP" == "1" ) ]]; then
    log "EC2 を停止します: $INSTANCE_ID"
    aws ec2 stop-instances --region "$AWS_REGION" --instance-ids "$INSTANCE_ID" >/dev/null
    if [[ "$WAIT_STOP" == "1" ]]; then
      aws ec2 wait instance-stopped --region "$AWS_REGION" --instance-ids "$INSTANCE_ID" \
        && log "EC2 停止完了" || log "WARN: 停止完了を確認できませんでした（コンソールで確認してください）"
    fi
  elif [[ "$STARTED_BY_US" == "1" ]]; then
    log "KEEP_RUNNING=1 のため EC2 は起動したままです: $INSTANCE_ID"
  fi
  exit "$rc"
}
trap cleanup EXIT
trap 'exit 130' INT TERM

# --- 起動 ---
STATE="$(ec2_state)"
log "Instance   : $INSTANCE_ID (state=$STATE)"
case "$STATE" in
  running) ;;
  pending)
    STARTED_BY_US=1
    aws ec2 wait instance-running --region "$AWS_REGION" --instance-ids "$INSTANCE_ID" ;;
  stopping|stopped)
    STARTED_BY_US=1
    if [[ "$STATE" == "stopping" ]]; then
      log "停止処理中のため stopped まで待ちます"
      aws ec2 wait instance-stopped --region "$AWS_REGION" --instance-ids "$INSTANCE_ID"
    fi
    log "EC2 を起動します"
    aws ec2 start-instances --region "$AWS_REGION" --instance-ids "$INSTANCE_ID" >/dev/null
    aws ec2 wait instance-running --region "$AWS_REGION" --instance-ids "$INSTANCE_ID"
    log "EC2 running" ;;
  *)
    echo "ERROR: 実行できない状態です: $STATE"; exit 1 ;;
esac

# --- SSM Online 待ち ---
waited=0
while [[ "$(ssm_ping)" != "Online" ]]; do
  if (( waited >= SSM_WAIT_SEC )); then
    echo "ERROR: ${SSM_WAIT_SEC} 秒待っても SSM が Online になりません"; exit 1
  fi
  (( waited == 0 )) && printf "[%s] SSM Online 待ち" "$(date '+%H:%M:%S')"
  printf "."
  sleep "$POLL_SEC"; waited=$(( waited + POLL_SEC ))
done
(( waited > 0 )) && echo " OK"
log "SSM Online"

# --- EC2 上で実行するコマンドを組み立て ---
env_part=""
for v in $PASS_ENVS; do
  if [[ -n "${!v:-}" ]]; then env_part="${env_part} ${v}=$(printf %q "${!v}")"; fi
done
inner="cd $(printf %q "$REMOTE_DIR") && env${env_part} bash ./$(printf %q "$REMOTE_SCRIPT") </dev/null"
if [[ -n "$REMOTE_USER" ]]; then
  REMOTE_CMD="sudo -u ${REMOTE_USER} -H bash -c $(printf %q "$inner")"
else
  REMOTE_CMD="$inner"
fi
log "Remote cmd : $REMOTE_CMD"

PARAMS="$(jq -n --arg c "$REMOTE_CMD" --arg t "$TIMEOUT_SEC" '{commands:[$c], executionTimeout:[$t]}')"

CMD_ID="$(aws ssm send-command --region "$AWS_REGION" \
  --instance-ids "$INSTANCE_ID" \
  --document-name AWS-RunShellScript \
  --comment "dump_soccer_bm_all (from local)" \
  --parameters "$PARAMS" \
  --query Command.CommandId --output text)"
log "CommandId  : $CMD_ID"

# --- 完了待ち ---
printf "[%s] Running" "$(date '+%H:%M:%S')"
while :; do
  sleep "$POLL_SEC"
  status="$(aws ssm get-command-invocation --region "$AWS_REGION" \
    --command-id "$CMD_ID" --instance-id "$INSTANCE_ID" \
    --query Status --output text 2>/dev/null || echo Pending)"
  case "$status" in
    Pending|InProgress|Delayed) printf "." ;;
    *) break ;;
  esac
done
echo " $status"

RESULT="$(aws ssm get-command-invocation --region "$AWS_REGION" \
  --command-id "$CMD_ID" --instance-id "$INSTANCE_ID" --output json)"
echo "----- stdout -----"
echo "$RESULT" | jq -r '.StandardOutputContent'
STDERR="$(echo "$RESULT" | jq -r '.StandardErrorContent')"
if [[ -n "$STDERR" ]]; then
  echo "----- stderr -----"
  echo "$STDERR"
fi
CODE="$(echo "$RESULT" | jq -r '.ResponseCode')"
[[ "$status" != "Success" ]] && { echo "ERROR: status=${status} exit=${CODE}"; exit 1; }

# --- 任意: 最新ダンプをローカルに取得 ---
if [[ "$DOWNLOAD" == "1" && "${NO_UPLOAD:-0}" != "1" ]]; then
  BUCKET="${S3_BUCKET:-csv-save}"
  PREFIX="${S3_PREFIX:-db_dump}"
  LATEST="$(aws s3 cp "s3://${BUCKET}/${PREFIX}/LATEST" - --region "$AWS_REGION" | tr -d '\r\n')"
  mkdir -p "$LOCAL_DIR/$LATEST"
  aws s3 cp "s3://${BUCKET}/${PREFIX}/${LATEST}/" "$LOCAL_DIR/$LATEST/" --recursive --region "$AWS_REGION"
  log "Downloaded : $LOCAL_DIR/$LATEST"
fi
log "Dump done."
