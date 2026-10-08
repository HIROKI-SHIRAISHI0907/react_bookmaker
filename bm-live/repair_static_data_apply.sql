-- ============================================================
-- static_data の修復（チーム名が空の行を削除・match_id を game_link の mid= に合わせる）
--  お試し（最後に ROLLBACK。何も変わらない）:
--    docker compose exec -T db psql -U postgres -d soccer_bm -v ON_ERROR_STOP=1 < repair_static_data_apply.sql
--  本当に反映（最後に COMMIT）:
--    docker compose exec -T db psql -U postgres -d soccer_bm -v ON_ERROR_STOP=1 -v commit=1 < repair_static_data_apply.sql
-- ============================================================
BEGIN;

\echo '== 修復前'
SELECT COUNT(*) AS total_rows,
       COUNT(*) FILTER (WHERE BTRIM(COALESCE(home_team_name, '')) = '' OR BTRIM(COALESCE(away_team_name, '')) = '') AS blank_team_rows,
       COUNT(*) FILTER (WHERE game_link ~ '[?&]mid=' AND NULLIF(BTRIM(match_id), '') IS NOT NULL
                          AND SUBSTRING(game_link FROM '[?&]mid=([A-Za-z0-9]+)') <> BTRIM(match_id)) AS mismatched_rows
FROM static_data;

-- バックアップ（同じ日に2回流しても重複しないよう、無い行だけ足す）
CREATE TABLE IF NOT EXISTS static_data_bk_20261009 AS SELECT * FROM static_data WHERE FALSE;
INSERT INTO static_data_bk_20261009
SELECT s.* FROM static_data s
WHERE (BTRIM(COALESCE(s.home_team_name, '')) = '' OR BTRIM(COALESCE(s.away_team_name, '')) = ''
       OR (s.game_link ~ '[?&]mid=' AND NULLIF(BTRIM(s.match_id), '') IS NOT NULL
           AND SUBSTRING(s.game_link FROM '[?&]mid=([A-Za-z0-9]+)') <> BTRIM(s.match_id)))
  AND NOT EXISTS (SELECT 1 FROM static_data_bk_20261009 b WHERE b.seq_key = s.seq_key);

-- 1. チーム名が空の行を削除
DELETE FROM static_data
WHERE BTRIM(COALESCE(home_team_name, '')) = '' OR BTRIM(COALESCE(away_team_name, '')) = '';

-- 2. チーム名がある行で match_id が違うものは mid= に合わせる
UPDATE static_data
SET match_id = SUBSTRING(game_link FROM '[?&]mid=([A-Za-z0-9]+)'),
    update_id = 'REPAIR_20261009', update_time = CURRENT_TIMESTAMP
WHERE game_link ~ '[?&]mid='
  AND NULLIF(BTRIM(match_id), '') IS NOT NULL
  AND SUBSTRING(game_link FROM '[?&]mid=([A-Za-z0-9]+)') <> BTRIM(match_id);

\echo '== 修復後'
SELECT COUNT(*) AS total_rows,
       COUNT(*) FILTER (WHERE BTRIM(COALESCE(home_team_name, '')) = '' OR BTRIM(COALESCE(away_team_name, '')) = '') AS blank_team_rows,
       COUNT(*) FILTER (WHERE game_link ~ '[?&]mid=' AND NULLIF(BTRIM(match_id), '') IS NOT NULL
                          AND SUBSTRING(game_link FROM '[?&]mid=([A-Za-z0-9]+)') <> BTRIM(match_id)) AS mismatched_rows,
       (SELECT COUNT(*) FROM static_data_bk_20261009) AS backup_rows
FROM static_data;

\if :{?commit}
\echo '== COMMIT（反映しました）'
COMMIT;
\else
\echo '== ROLLBACK（お試し。何も変わっていません。反映するには -v commit=1）'
ROLLBACK;
\endif
