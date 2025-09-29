#!/bin/sh
set -e

# docker-entrypoint により環境変数は渡ってくる
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<'SQL'
DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'soccer_bm') THEN
      PERFORM dblink_exec('dbname=' || current_database(), 'SELECT 1'); -- noop
   END IF;
END
$$;
SQL

# CREATE DATABASE IF NOT EXISTS は無いので、bash + psql 判定で作成
db_exists() { psql -U "$POSTGRES_USER" -tc "SELECT 1 FROM pg_database WHERE datname = '$1'" | grep -q 1; }

if ! db_exists soccer_bm; then
  createdb -U "$POSTGRES_USER" soccer_bm
fi

if ! db_exists soccer_bm_user; then
  createdb -U "$POSTGRES_USER" soccer_bm_user
fi

# 拡張が必要ならここに追記（例: pgcrypto など）
for DBNAME in soccer_bm soccer_bm_user; do
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$DBNAME" <<'SQL'
CREATE EXTENSION IF NOT EXISTS pgcrypto;
SQL
done