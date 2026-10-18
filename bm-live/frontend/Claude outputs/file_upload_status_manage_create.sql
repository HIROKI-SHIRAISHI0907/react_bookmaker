-- ============================================================
-- soccer_bm: file_upload_status_manage（ファイルアップロード状況管理）を作る
--   CSV アップロード画面（シーズン / チーム / 試合予定 / リアルタイム）からのアップロード 1 回ごとに 1 行。
--   受付時に status = RECEIVED で登録し、処理が終わったら結果（件数・エラー行）で更新する。
--   反映とは別のトランザクションで記録するので、反映を取り消した場合も記録は残る。
--   login_user はログイン中のユーザー（JWT の sub＝メールアドレス）。未ログインのアップロードは受け付けない。
--   register_id / update_id にも同じログインユーザーを入れる。
--   アップロードされた zip は S3（aws-s3-upload-check-csv）の success/ か error/ に保管し、その場所を s3_bucket / s3_key に入れる。
--
--   status:
--     RECEIVED   受付（処理中。結果の記録に失敗した場合もこのまま残る）
--     SUCCESS    反映済
--     ROW_ERROR  行エラー（どの行も反映していない）
--     FILE_ERROR ファイルエラー（ファイル名・zip の中身・CSV が読めない・データなし）
--     DB_ERROR   DB エラー（反映を取り消した）
--
--   既にテーブルがある場合は何もしない。
-- ============================================================
BEGIN;

CREATE TABLE IF NOT EXISTS file_upload_status_manage (
  id              BIGSERIAL     NOT NULL,
  master_name     VARCHAR(20)   NOT NULL,
  file_name       VARCHAR(255)  NOT NULL,
  csv_file_name   VARCHAR(255),
  file_size       BIGINT        NOT NULL DEFAULT 0,
  status          VARCHAR(20)   NOT NULL,
  message         TEXT,
  total_count     INTEGER       NOT NULL DEFAULT 0,
  insert_count    INTEGER       NOT NULL DEFAULT 0,
  update_count    INTEGER       NOT NULL DEFAULT 0,
  delete_count    INTEGER       NOT NULL DEFAULT 0,
  hide_count      INTEGER       NOT NULL DEFAULT 0,
  show_count      INTEGER       NOT NULL DEFAULT 0,
  error_count     INTEGER       NOT NULL DEFAULT 0,
  error_detail    JSONB,
  login_user      VARCHAR(255)  NOT NULL,
  started_at      TIMESTAMP(0) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at     TIMESTAMP(0) WITH TIME ZONE,
  s3_bucket       VARCHAR(255),
  s3_key          VARCHAR(1024),
  register_id     VARCHAR(100)  NOT NULL,
  register_time   TIMESTAMP(0) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_id       VARCHAR(100)  NOT NULL,
  update_time     TIMESTAMP(0) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_file_upload_status_manage PRIMARY KEY (id),
  CONSTRAINT ck_file_upload_status_manage_master CHECK (master_name IN ('season', 'team', 'future', 'realtime')),
  CONSTRAINT ck_file_upload_status_manage_status CHECK (status IN ('RECEIVED', 'SUCCESS', 'ROW_ERROR', 'FILE_ERROR', 'DB_ERROR'))
);

CREATE INDEX IF NOT EXISTS idx_file_upload_status_manage_started
    ON file_upload_status_manage (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_upload_status_manage_master_started
    ON file_upload_status_manage (master_name, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_upload_status_manage_login_user
    ON file_upload_status_manage (login_user, started_at DESC);

COMMENT ON TABLE  file_upload_status_manage IS 'ファイルアップロード状況管理（CSVアップロード 1 回ごとの受付と結果）';
COMMENT ON COLUMN file_upload_status_manage.id            IS 'ID';
COMMENT ON COLUMN file_upload_status_manage.master_name   IS '種類 season:シーズン team:チーム future:試合予定 realtime:リアルタイム';
COMMENT ON COLUMN file_upload_status_manage.file_name     IS 'アップロードした zip の名前';
COMMENT ON COLUMN file_upload_status_manage.csv_file_name IS 'zip の中の CSV の名前（zip と同じ名前）';
COMMENT ON COLUMN file_upload_status_manage.file_size     IS 'zip のサイズ（バイト）';
COMMENT ON COLUMN file_upload_status_manage.status        IS '状態 RECEIVED:受付 SUCCESS:反映済 ROW_ERROR:行エラー FILE_ERROR:ファイルエラー DB_ERROR:DBエラー';
COMMENT ON COLUMN file_upload_status_manage.message       IS '結果メッセージ';
COMMENT ON COLUMN file_upload_status_manage.total_count   IS 'CSV の行数（見出し・空行を除く）';
COMMENT ON COLUMN file_upload_status_manage.insert_count  IS '登録件数';
COMMENT ON COLUMN file_upload_status_manage.update_count  IS '更新件数';
COMMENT ON COLUMN file_upload_status_manage.delete_count  IS '削除件数';
COMMENT ON COLUMN file_upload_status_manage.hide_count    IS '非表示件数';
COMMENT ON COLUMN file_upload_status_manage.show_count    IS '再表示件数';
COMMENT ON COLUMN file_upload_status_manage.error_count   IS 'エラー行数';
COMMENT ON COLUMN file_upload_status_manage.error_detail  IS 'エラー行（[{rowNo, operation, key, message}]。最大 1000 行）';
COMMENT ON COLUMN file_upload_status_manage.login_user    IS 'アップロードしたログインユーザー（メールアドレス。JWT の sub）';
COMMENT ON COLUMN file_upload_status_manage.started_at    IS '受付日時';
COMMENT ON COLUMN file_upload_status_manage.finished_at   IS '終了日時';
COMMENT ON COLUMN file_upload_status_manage.s3_bucket     IS 'zip を保管した S3 バケット（aws-s3-upload-check-csv）';
COMMENT ON COLUMN file_upload_status_manage.s3_key        IS 'zip を保管した S3 キー（反映済は success/、それ以外は error/）';

-- 確認
SELECT column_name, data_type FROM information_schema.columns
 WHERE table_schema = current_schema() AND table_name = 'file_upload_status_manage'
 ORDER BY ordinal_position;

COMMIT;
