#!/bin/bash
# /dumps/<フォルダ>/*.dump をローカルの db に流し込む（dbrestore サービスから呼ばれる）
#  <db>.dump ごとに、ローカルの <db> を作り直して pg_restore する。
set -euo pipefail
DIR="${1:?ダンプのフォルダを指定してください}"
: "${LOCAL_PASSWORD:?.env の POSTGRES_PASSWORD が空です}"
LOCAL_HOST="${LOCAL_HOST:-db}"; LOCAL_PORT="${LOCAL_PORT:-5432}"; LOCAL_USER="${LOCAL_USER:-postgres}"
export PGPASSWORD="$LOCAL_PASSWORD"
lp() { psql -h "$LOCAL_HOST" -p "$LOCAL_PORT" -U "$LOCAL_USER" -v ON_ERROR_STOP=1 -q "$@"; }

shopt -s nullglob
files=("$DIR"/*.dump)
(( ${#files[@]} )) || { echo "$DIR に .dump がありません"; exit 1; }
echo "== ローカル: $(lp -d postgres -tAc 'SHOW server_version') / pg_restore: $(pg_restore --version)"

for f in "${files[@]}"; do
  db="$(basename "$f" .dump)"
  echo "== [${db}] 作り直して復元 ← ${f}"
  lp -d postgres \
    -c "DROP DATABASE IF EXISTS \"${db}\" WITH (FORCE)" \
    -c "CREATE DATABASE \"${db}\"" \
    -c "ALTER DATABASE \"${db}\" SET timezone TO 'Asia/Tokyo'"
  # バージョン差（例: transaction_timeout）や RDS 固有の拡張の警告は出ても続ける
  pg_restore -h "$LOCAL_HOST" -p "$LOCAL_PORT" -U "$LOCAL_USER" -d "$db" --no-owner --no-privileges -j 4 "$f" \
    || echo "   (pg_restore の警告あり。上のメッセージを確認してください)"
  echo "   tables=$(lp -d "$db" -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'") views=$(lp -d "$db" -tAc "SELECT count(*) FROM information_schema.views WHERE table_schema='public'")"
done
echo "== 完了"
