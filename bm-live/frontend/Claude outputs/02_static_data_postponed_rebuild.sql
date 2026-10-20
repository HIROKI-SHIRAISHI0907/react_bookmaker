-- =====================================================================
-- バグ 1: 延期の試合のデータ退避（PostponedDataPurgeRepository.backupStaticData）が失敗する
--
--   INSERT INTO static_data_postponed SELECT s.*, CURRENT_TIMESTAMP, CAST(? AS text) FROM static_data s ...
--   → 「INSERT has more expressions than target columns」
--
--   原因: static_data に後から列が増えたのに、static_data_postponed が古い列のまま。
--         s.*（static_data の全列）＋ purged_at ＋ purge_reason の数が、退避先の列数より多い。
--         SELECT * で入れているので、列の「数」だけでなく「並び順」も static_data と同じでないといけない。
--
--   対応: static_data_postponed を「static_data と同じ列・同じ順番 ＋ purged_at ＋ purge_reason」で作り直す。
--         今の行は同じ名前の列だけ移す（増えた列は NULL）。古いテーブルは static_data_postponed_bk に残す。
--
--   流し方: ① の SELECT で差分を見てから、そのまま最後まで流す。
--           確認して問題なければ、後日 DROP TABLE static_data_postponed_bk; を流す。
-- =====================================================================

-- ① 差分の確認（static_data にあって退避先に無い列 / 退避先にあって static_data に無い列）
SELECT 'static_data だけ' AS side, a.column_name, a.ordinal_position
  FROM information_schema.columns a
 WHERE a.table_schema = current_schema() AND a.table_name = 'static_data'
   AND NOT EXISTS (SELECT 1 FROM information_schema.columns b
                    WHERE b.table_schema = a.table_schema AND b.table_name = 'static_data_postponed'
                      AND b.column_name = a.column_name)
UNION ALL
SELECT 'static_data_postponed だけ', b.column_name, b.ordinal_position
  FROM information_schema.columns b
 WHERE b.table_schema = current_schema() AND b.table_name = 'static_data_postponed'
   AND b.column_name NOT IN ('purged_at', 'purge_reason')
   AND NOT EXISTS (SELECT 1 FROM information_schema.columns a
                    WHERE a.table_schema = b.table_schema AND a.table_name = 'static_data'
                      AND a.column_name = b.column_name)
ORDER BY 1, 3;

-- ② 作り直し
BEGIN;

DO $$
DECLARE
  v_cols text;
  v_cnt  bigint;
BEGIN
  IF to_regclass('static_data_postponed_bk') IS NOT NULL THEN
    RAISE EXCEPTION 'static_data_postponed_bk が既にあります（前回の残り）。中身を確認して消してから流してください';
  END IF;

  -- static_data と同じ列・同じ順番（型・NOT NULL・既定値も同じ）＋ 退避の 2 列
  EXECUTE 'CREATE TABLE static_data_postponed_new (LIKE static_data INCLUDING DEFAULTS)';
  EXECUTE 'ALTER TABLE static_data_postponed_new ADD COLUMN purged_at timestamp without time zone';
  EXECUTE 'ALTER TABLE static_data_postponed_new ADD COLUMN purge_reason text';

  -- 今の行を、同じ名前の列だけ移す
  SELECT string_agg(format('%I', n.column_name), ', ' ORDER BY n.ordinal_position)
    INTO v_cols
    FROM information_schema.columns n
   WHERE n.table_schema = current_schema() AND n.table_name = 'static_data_postponed_new'
     AND EXISTS (SELECT 1 FROM information_schema.columns o
                  WHERE o.table_schema = n.table_schema AND o.table_name = 'static_data_postponed'
                    AND o.column_name = n.column_name);

  EXECUTE format('INSERT INTO static_data_postponed_new (%s) SELECT %s FROM static_data_postponed', v_cols, v_cols);
  GET DIAGNOSTICS v_cnt = ROW_COUNT;
  RAISE NOTICE '移した行: % 件', v_cnt;

  EXECUTE 'ALTER TABLE static_data_postponed RENAME TO static_data_postponed_bk';
  EXECUTE 'ALTER INDEX IF EXISTS idx_static_data_postponed_match_id RENAME TO idx_static_data_postponed_bk_match_id';
  EXECUTE 'ALTER TABLE static_data_postponed_new RENAME TO static_data_postponed';
  EXECUTE 'CREATE INDEX idx_static_data_postponed_match_id ON static_data_postponed (match_id)';
END
$$;

-- ③ 確認
--   列数: static_data の列数 + 2 になっていること
SELECT (SELECT COUNT(*) FROM information_schema.columns
         WHERE table_schema = current_schema() AND table_name = 'static_data')           AS static_data_cols,
       (SELECT COUNT(*) FROM information_schema.columns
         WHERE table_schema = current_schema() AND table_name = 'static_data_postponed') AS postponed_cols;

--   件数: 古いテーブルと同じであること
SELECT (SELECT COUNT(*) FROM static_data_postponed_bk) AS before_rows,
       (SELECT COUNT(*) FROM static_data_postponed)    AS after_rows;

--   エラーになっていた INSERT の形が通ること（0 件で試す）
INSERT INTO static_data_postponed
SELECT s.*, CURRENT_TIMESTAMP, CAST('CHECK' AS text) FROM static_data s WHERE false;

COMMIT;
