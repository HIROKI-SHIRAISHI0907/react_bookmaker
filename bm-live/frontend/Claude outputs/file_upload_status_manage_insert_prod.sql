-- =====================================================================
-- file_upload_status_manage（soccer_bm）本番への登録
--   ローカル DB にだけ入っていた 2 件を、本番に同じ ID で入れる。
--   S3（aws-s3-upload-check-csv）には既に次の zip がある:
--     id=1  uploaded/season/20261019/1/season_20261019084900.zip       … 判定前（B015 の処理待ち）
--     id=2  error/season/20261019/2/season_20261019084900_error.zip    … バリデーションエラー（履歴）
--
--   ・同じ ID が既にあれば入れない（ON CONFLICT DO NOTHING）。入れた件数を最後に確認する。
--   ・ID の採番（BIGSERIAL のシーケンス）を、入れた ID の続きにそろえる
--     （そろえないと、次に画面で受け付けたときに id=1 が重複してエラーになる）。
--   ・id=2 の履歴が不要なら、2 つ目の INSERT を消して流す。
-- =====================================================================
BEGIN;

-- 事前確認（同じ ID・同じ S3 キーの行が無いこと）
SELECT id, status, s3_key
  FROM file_upload_status_manage
 WHERE id IN (1, 2)
    OR s3_key IN ('uploaded/season/20261019/1/season_20261019084900.zip',
                  'error/season/20261019/2/season_20261019084900_error.zip');

-- id=1 判定前（PENDING）
INSERT INTO file_upload_status_manage (
    id, master_name, file_name, csv_file_name, file_size, status, message,
    total_count, insert_count, update_count, delete_count, hide_count, show_count, error_count,
    error_detail, error_phase, login_user, started_at, finished_at, s3_bucket, s3_key,
    register_id, register_time, update_id, update_time
) VALUES (
    1, 'season', 'season_20261019084900.zip', 'season_20261019084900.csv', 1020, 'PENDING',
    '判定前です。（バリデーションを通りました。バッチサービスで反映します）',
    1, 0, 0, 0, 0, 0, 0,
    NULL, NULL, 'pepw9cj8@gmail.com',
    TIMESTAMPTZ '2026-10-19 10:05:23.699298+09', NULL,
    'aws-s3-upload-check-csv', 'uploaded/season/20261019/1/season_20261019084900.zip',
    'pepw9cj8@gmail.com', TIMESTAMPTZ '2026-10-19 10:05:23.699298+09',
    'pepw9cj8@gmail.com', TIMESTAMPTZ '2026-10-19 10:05:26.745212+09'
)
ON CONFLICT (id) DO NOTHING;

-- id=2 異常終了（バリデーションエラー・履歴）
INSERT INTO file_upload_status_manage (
    id, master_name, file_name, csv_file_name, file_size, status, message,
    total_count, insert_count, update_count, delete_count, hide_count, show_count, error_count,
    error_detail, error_phase, login_user, started_at, finished_at, s3_bucket, s3_key,
    register_id, register_time, update_id, update_time
) VALUES (
    2, 'season', 'season_20261019084900.zip', 'season_20261019084900.csv', 1019, 'ERROR',
    'バリデーションエラーのため受け付けませんでした。（エラー 1 件' || chr(10)
        || '）エラー内容を書き足したファイルを状況管理画面からダウンロードできます。',
    1, 0, 0, 0, 0, 0, 1,
    CAST('[{"key": "サンプル国 / サンプルリーグ", "rowNo": 2, "message": "処理区分が不正です。（1:登録 2:更新 3:削除 4:非表示 5:再表示）", "operation": ""}]' AS jsonb),
    'VALIDATION', 'pepw9cj8@gmail.com',
    TIMESTAMPTZ '2026-10-19 10:08:38.251007+09', TIMESTAMPTZ '2026-10-19 10:08:39.023357+09',
    'aws-s3-upload-check-csv', 'error/season/20261019/2/season_20261019084900_error.zip',
    'pepw9cj8@gmail.com', TIMESTAMPTZ '2026-10-19 10:08:38.251007+09',
    'pepw9cj8@gmail.com', TIMESTAMPTZ '2026-10-19 10:08:39.023357+09'
)
ON CONFLICT (id) DO NOTHING;

-- 採番を今の最大 ID の続きにそろえる
SELECT setval(
    pg_get_serial_sequence('file_upload_status_manage', 'id'),
    (SELECT COALESCE(MAX(id), 1) FROM file_upload_status_manage),
    true
);

-- 結果の確認（id=1 が PENDING、id=2 が ERROR で 2 行出ること。B015 の対象は 1 件）
SELECT id, master_name, status, error_phase, s3_key, started_at
  FROM file_upload_status_manage
 ORDER BY id;

SELECT COUNT(*) AS b015_targets
  FROM file_upload_status_manage
 WHERE status = 'PENDING'
    OR (status = 'PROCESSING' AND update_time < CURRENT_TIMESTAMP - make_interval(mins => 60));

-- 問題なければ COMMIT（おかしければ ROLLBACK;）
COMMIT;
