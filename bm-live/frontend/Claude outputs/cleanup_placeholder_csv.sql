-- =====================================================================
-- 仮のカテゴリ（XXX: YYY - ラウンド 0）で作られてしまった統計 CSV の後始末  ※ soccer_bm
--   psql にそのまま全部貼って流せる形。途中で止めたり書き換えたりしなくてよい。
--
--   ・件数の確認 → 削除 → 削除件数の確認 を 1 トランザクションで行う。
--     想定と違えばエラーにして全部戻す（何も消えない）。
--   ・想定件数は下の v_expected（S3 の XXX-YYY-ラウンド0/ の件数 = 149）。違う件数で消したいときだけ書き換える。
--     0 にすると件数チェックをしない。
--
--   S3 の CSV はこの SQL では消せないので、別途:
--     aws s3 rm "s3://aws-s3-stat-csv/XXX-YYY-ラウンド0/" --recursive
--   （data_team_list.txt・seqList.txt は次の B011 で実在する CSV に合わせて自動で直る）
-- =====================================================================

\echo '--- 削除前: 仮のカテゴリの csv_detail_manage ---'
SELECT COUNT(*) AS target_rows,
       COUNT(DISTINCT csv_id) AS csv_ids,
       MIN(register_time) AS first_registered,
       MAX(register_time) AS last_registered
  FROM csv_detail_manage
 WHERE csv_id LIKE 'XXX-YYY-%'
    OR data_category LIKE 'XXX:%';

BEGIN;

DO $$
DECLARE
  v_expected  integer := 149;   -- 想定件数（0 ならチェックしない）
  v_target    integer;
  v_deleted   integer;
BEGIN
  SELECT COUNT(*) INTO v_target
    FROM csv_detail_manage
   WHERE csv_id LIKE 'XXX-YYY-%'
      OR data_category LIKE 'XXX:%';

  IF v_target = 0 THEN
    RAISE NOTICE '対象 0 件（もう消えています）。何もしません';
    RETURN;
  END IF;

  IF v_expected > 0 AND v_target <> v_expected THEN
    RAISE EXCEPTION '対象が % 件で、想定（% 件）と違います。中身を確認して v_expected を直してから流してください', v_target, v_expected;
  END IF;

  DELETE FROM csv_detail_manage
   WHERE csv_id LIKE 'XXX-YYY-%'
      OR data_category LIKE 'XXX:%';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  IF v_deleted <> v_target THEN
    RAISE EXCEPTION '削除件数（%）が対象件数（%）と違います。全部戻します', v_deleted, v_target;
  END IF;

  RAISE NOTICE 'csv_detail_manage から % 件削除しました', v_deleted;
END
$$;

COMMIT;

\echo '--- 削除後: 0 件になっていること ---'
SELECT COUNT(*) AS remaining_rows
  FROM csv_detail_manage
 WHERE csv_id LIKE 'XXX-YYY-%'
    OR data_category LIKE 'XXX:%';

\echo '--- 参考: 仮のカテゴリのまま終了済まで来ている試合（カテゴリが直るまで CSV にならない） ---'
SELECT DISTINCT ON (s.home_team_name, s.away_team_name, s.match_id)
       s.match_id, s.home_team_name, s.away_team_name, s.data_category, s.record_time
  FROM static_data s
 WHERE s.data_category LIKE 'XXX:%'
   AND BTRIM(s.times) = '終了済'
 ORDER BY s.home_team_name, s.away_team_name, s.match_id, s.record_time DESC;
