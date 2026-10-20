-- =====================================================================
-- バグ 2: B015 の「判定中（PROCESSING）」が CHECK 制約で弾かれる
--
--   file_upload_status_manage_status_chk      : RECEIVED / PENDING / SUCCESS / ERROR だけ
--     → B015 が使う PROCESSING を足す
--   file_upload_status_manage_error_phase_chk : VALIDATION / STORE / DB_CHECK / APPLY だけ
--     → B015 が異常終了で入れる DB（DB チェック・反映のエラー、判定中のまま止まったもの）を足す
--       （直さないと、PROCESSING を通しても次の異常終了の UPDATE で同じエラーになる）
--
--   今残っている id=1 は UPDATE が失敗したので PENDING のまま。流したあと B015 を起動すれば処理される。
-- =====================================================================
BEGIN;

ALTER TABLE file_upload_status_manage DROP CONSTRAINT IF EXISTS file_upload_status_manage_status_chk;
ALTER TABLE file_upload_status_manage
  ADD CONSTRAINT file_upload_status_manage_status_chk
  CHECK (status IN ('RECEIVED', 'PENDING', 'PROCESSING', 'SUCCESS', 'ERROR'));

ALTER TABLE file_upload_status_manage DROP CONSTRAINT IF EXISTS file_upload_status_manage_error_phase_chk;
ALTER TABLE file_upload_status_manage
  ADD CONSTRAINT file_upload_status_manage_error_phase_chk
  CHECK (error_phase IS NULL OR error_phase IN ('VALIDATION', 'STORE', 'DB', 'DB_CHECK', 'APPLY'));

COMMENT ON COLUMN file_upload_status_manage.status IS
  '状態 RECEIVED:受付 PENDING:判定前 PROCESSING:判定中(B015) SUCCESS:正常終了 ERROR:異常終了';
COMMENT ON COLUMN file_upload_status_manage.error_phase IS
  '異常終了の段階 VALIDATION:受付時のチェック STORE:S3 の保管・取り出し DB:B015 の DB チェック・反映（DB_CHECK・APPLY は旧定義）';

-- 確認（2 つの制約が新しい定義になっていること、id=1 が PENDING のままであること）
SELECT conname, pg_get_constraintdef(oid)
  FROM pg_constraint
 WHERE conrelid = 'file_upload_status_manage'::regclass
   AND contype = 'c'
 ORDER BY conname;

SELECT id, status, error_phase, s3_key FROM file_upload_status_manage ORDER BY id;

COMMIT;
