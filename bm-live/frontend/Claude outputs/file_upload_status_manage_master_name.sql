-- =====================================================================
-- file_upload_status_manage.master_name に dataCategory（データカテゴリ統一）を足す  ※ soccer_bm
--
--   master_name に CHECK 制約があると、データカテゴリ統一 CSV の受付（INSERT）で弾かれる。
--   master_name を見ている CHECK 制約を消して、5 種類を許す制約を作り直す（制約が無かった場合も新しく付く）。
--   流し方: そのまま全部流す（何度流しても同じ）。
-- =====================================================================
-- ⓪ 今の制約（確認用）
SELECT conname, pg_get_constraintdef(oid) AS def
  FROM pg_constraint
 WHERE conrelid = 'file_upload_status_manage'::regclass AND contype = 'c'
 ORDER BY conname;

BEGIN;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT conname
      FROM pg_constraint
     WHERE conrelid = 'file_upload_status_manage'::regclass
       AND contype = 'c'
       AND pg_get_constraintdef(oid) LIKE '%master_name%'
  LOOP
    EXECUTE format('ALTER TABLE file_upload_status_manage DROP CONSTRAINT %I', r.conname);
    RAISE NOTICE '消した制約: %', r.conname;
  END LOOP;
END
$$;

ALTER TABLE file_upload_status_manage
  ADD CONSTRAINT file_upload_status_manage_master_name_chk
  CHECK (master_name IN ('season', 'team', 'future', 'realtime', 'dataCategory'));

COMMENT ON COLUMN file_upload_status_manage.master_name IS
  '種類 season:シーズン team:チーム future:試合予定 realtime:リアルタイム（非表示・再表示） dataCategory:データカテゴリ統一';

COMMIT;

-- ① 流した後の確認
SELECT conname, pg_get_constraintdef(oid) AS def
  FROM pg_constraint
 WHERE conrelid = 'file_upload_status_manage'::regclass AND contype = 'c'
 ORDER BY conname;
