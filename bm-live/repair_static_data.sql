-- ============================================================
-- static_data の取得失敗行・混ざった行の確認と修復（soccer_bm）
--  1〜3 は確認だけ。4 の修復は BEGIN〜COMMIT を手で実行（まずローカルで試す）。
--  修復前に static_data_bk_20261009 にバックアップを取る。
-- ============================================================

-- 1. チーム名が空の行（取得に失敗した行。data_category は XXX: YYY になっている）
SELECT COUNT(*) AS blank_team_rows,
       COUNT(*) FILTER (WHERE data_category ~* '^\s*XXX\s*:') AS xxx_rows,
       MIN(record_time) AS first_time, MAX(record_time) AS last_time
FROM static_data
WHERE BTRIM(COALESCE(home_team_name, '')) = '' OR BTRIM(COALESCE(away_team_name, '')) = '';

-- 2. match_id と game_link の mid= が違う行（別の試合の行に書き換えられたもの）
SELECT seq_key, match_id,
       SUBSTRING(game_link FROM '[?&]mid=([A-Za-z0-9]+)') AS link_mid,
       data_category, times, home_team_name, away_team_name, record_time
FROM static_data
WHERE game_link ~ '[?&]mid='
  AND NULLIF(BTRIM(match_id), '') IS NOT NULL
  AND SUBSTRING(game_link FROM '[?&]mid=([A-Za-z0-9]+)') <> BTRIM(match_id)
ORDER BY record_time DESC
LIMIT 200;

-- 2'. そのうちチーム名がある行（削除せず match_id を直す対象）
SELECT COUNT(*) AS mismatched_with_team
FROM static_data
WHERE game_link ~ '[?&]mid='
  AND NULLIF(BTRIM(match_id), '') IS NOT NULL
  AND SUBSTRING(game_link FROM '[?&]mid=([A-Za-z0-9]+)') <> BTRIM(match_id)
  AND BTRIM(COALESCE(home_team_name, '')) <> '' AND BTRIM(COALESCE(away_team_name, '')) <> '';

-- 3. チーム名はあるのに XXX: YYY のカテゴリの行（country_league_master にチームが無いもの）
SELECT home_team_name, away_team_name, COUNT(*) AS rows, MAX(record_time) AS last_time
FROM static_data
WHERE data_category ~* '^\s*XXX\s*:'
  AND BTRIM(COALESCE(home_team_name, '')) <> '' AND BTRIM(COALESCE(away_team_name, '')) <> ''
GROUP BY home_team_name, away_team_name
ORDER BY last_time DESC;

-- ============================================================
-- 4. 修復（手で実行）
-- ============================================================
/*
BEGIN;

CREATE TABLE IF NOT EXISTS static_data_bk_20261009 AS
SELECT * FROM static_data
WHERE BTRIM(COALESCE(home_team_name, '')) = '' OR BTRIM(COALESCE(away_team_name, '')) = ''
   OR (game_link ~ '[?&]mid=' AND NULLIF(BTRIM(match_id), '') IS NOT NULL
       AND SUBSTRING(game_link FROM '[?&]mid=([A-Za-z0-9]+)') <> BTRIM(match_id));

-- 4-1. チーム名が空の行は削除（統計に使えない。チーム名も国・リーグも無い）
DELETE FROM static_data
WHERE BTRIM(COALESCE(home_team_name, '')) = '' OR BTRIM(COALESCE(away_team_name, '')) = '';

-- 4-2. チーム名がある行で match_id が違うものは mid= に合わせる（seq_key はそのまま。件数は 2' で確認）
UPDATE static_data
SET match_id = SUBSTRING(game_link FROM '[?&]mid=([A-Za-z0-9]+)'),
    update_id = 'REPAIR_20261009', update_time = CURRENT_TIMESTAMP
WHERE game_link ~ '[?&]mid='
  AND NULLIF(BTRIM(match_id), '') IS NOT NULL
  AND SUBSTRING(game_link FROM '[?&]mid=([A-Za-z0-9]+)') <> BTRIM(match_id);

-- 確認してから
COMMIT;   -- やめるなら ROLLBACK;
*/
-- ※ 削除した行は CSV_export_manage / analyze_error_match などの集計にも入っている可能性がある。
--   該当試合の集計は、各 BM を再実行すると作り直される（UPSERT）。

