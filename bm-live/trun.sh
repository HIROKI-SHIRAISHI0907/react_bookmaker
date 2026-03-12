#!/usr/bin/env bash
set -euo pipefail

psql -h localhost -p 54320 -U postgres -d soccer_bm -X -v ON_ERROR_STOP=1 <<'SQL'

-- 1) data / csv_seq_manage 以外を TRUNCATE（ID採番もリセット、FKも含めて消す）
DO $$
DECLARE
  trunc_list text;
BEGIN
  SELECT string_agg(format('%I.%I', schemaname, tablename), ', ')
    INTO trunc_list
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename NOT IN ('data', 'csv_seq_manage');

  IF trunc_list IS NULL THEN
    RAISE NOTICE 'TRUNCATE対象テーブルがありません。';
  ELSE
    RAISE NOTICE 'TRUNCATE実行: %', trunc_list;
    EXECUTE 'TRUNCATE TABLE ' || trunc_list || ' RESTART IDENTITY CASCADE';
  END IF;
END

$$;

-- 2) インデックス再構築（貼り直し）
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT IN ('data', 'csv_seq_manage')
    ORDER BY 1, 2
  LOOP
    RAISE NOTICE 'REINDEX TABLE %.%', r.schemaname, r.tablename;
    EXECUTE format('REINDEX TABLE %I.%I', r.schemaname, r.tablename);
  END LOOP;
END

$$;

-- 3) 統計情報更新（推奨）
VACUUM (ANALYZE);

SQL
