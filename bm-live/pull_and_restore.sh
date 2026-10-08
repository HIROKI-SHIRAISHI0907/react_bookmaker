#!/usr/bin/env bash
# S3 の最新ダンプ（dump_soccer_bm_all_to_s3.sh が置いたもの）を取ってきて、ローカルの docker の db に流し込む
#  bm-live フォルダで実行:  ./pull_and_restore.sh                 … LATEST のダンプ
#                           ./pull_and_restore.sh 20261008T130000Z … フォルダを指定
#                           SKIP_DOWNLOAD=1 ./pull_and_restore.sh 20261008T130000Z … db/dumps/<フォルダ> に手で置いた場合
#  ※ ローカルの DB はダンプと同じ名前の DB を作り直す（ローカルだけにあるデータは消える）。データは pg_data ボリュームに残る。
set -euo pipefail
cd "$(dirname "$0")"

AWS_REGION="${AWS_REGION:-ap-northeast-1}"
S3_BUCKET="${S3_BUCKET:-csv-save}"
S3_PREFIX="${S3_PREFIX:-db_dump}"
SKIP_DOWNLOAD="${SKIP_DOWNLOAD:-0}"

STAMP="${1:-}"
if [[ "$SKIP_DOWNLOAD" != "1" ]]; then
  command -v aws >/dev/null 2>&1 || { echo "aws CLI が必要です（または S3 から手でダウンロードして SKIP_DOWNLOAD=1）"; exit 1; }
  if [[ -z "$STAMP" ]]; then
    STAMP="$(aws s3 cp "s3://${S3_BUCKET}/${S3_PREFIX}/LATEST" - --region "$AWS_REGION" | tr -d '[:space:]')"
  fi
  echo "== S3 → db/dumps/${STAMP}/"
  mkdir -p "db/dumps/${STAMP}"
  aws s3 cp "s3://${S3_BUCKET}/${S3_PREFIX}/${STAMP}/" "db/dumps/${STAMP}/" --recursive --region "$AWS_REGION"
fi
[[ -z "$STAMP" ]] && { echo "フォルダ名を指定してください"; exit 1; }
[[ -d "db/dumps/${STAMP}" ]] || { echo "db/dumps/${STAMP} がありません"; exit 1; }
cat "db/dumps/${STAMP}/manifest.txt" 2>/dev/null || true

docker compose up -d db
docker compose run --rm dbrestore "/dumps/${STAMP}"
