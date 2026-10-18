-- ============================================================
-- soccer_bm: file_upload_status_manage の upload_user を login_user（ログインユーザー）に変える
--   前回の作成用 SQL（upload_user VARCHAR(100)）で既にテーブルを作った場合だけ流す。
--   まだ作っていなければ、file_upload_status_manage_create.sql（login_user 入り）を流せばよい。
--
--   列の名前を変えるだけなので、列の位置（error_detail の後・started_at の前）は変わらない。
--   既に login_user になっていれば何もしない。
-- ============================================================
BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_schema = current_schema() AND table_name = 'file_upload_status_manage' AND column_name = 'upload_user') THEN
    ALTER TABLE file_upload_status_manage RENAME COLUMN upload_user TO login_user;
    ALTER TABLE file_upload_status_manage ALTER COLUMN login_user TYPE VARCHAR(255);
    UPDATE file_upload_status_manage SET login_user = 'UNKNOWN' WHERE login_user IS NULL OR BTRIM(login_user) = '';
    ALTER TABLE file_upload_status_manage ALTER COLUMN login_user SET NOT NULL;
    RAISE NOTICE 'upload_user を login_user に変えました。';
  ELSE
    RAISE NOTICE 'upload_user がありません（既に login_user か、テーブルが新しい定義）。何もしません。';
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_file_upload_status_manage_login_user
    ON file_upload_status_manage (login_user, started_at DESC);

COMMENT ON COLUMN file_upload_status_manage.login_user IS 'アップロードしたログインユーザー（メールアドレス。JWT の sub）';

-- 確認
SELECT ordinal_position, column_name, data_type, is_nullable
  FROM information_schema.columns
 WHERE table_schema = current_schema() AND table_name = 'file_upload_status_manage'
 ORDER BY ordinal_position;

COMMIT;
