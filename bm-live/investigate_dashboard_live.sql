-- ============================================================
-- pgAdmin 用（psql のコマンド無し版）
--  pgAdmin は最後の SELECT の結果しか表示しないので、見たいセクション（-- 0. 〜 -- 6.）の SELECT を
--  選択してから実行（F5）してください。
--  「今」を変えたいときは 'now' を '2026-10-08 23:00:00' のように、
--  対象を変えたいときは '(XXX|YYY|ウガンダ|タンザニア)' を一括置換してください。
-- ============================================================

-- ------------------------------------------------------------
-- 0. 時刻の確認（画面の判定に使う境界とデータの鮮度）
-- ------------------------------------------------------------
WITH p AS (
  SELECT CASE WHEN 'now' = 'now' THEN (now() AT TIME ZONE 'Asia/Tokyo')::timestamp(0)
              ELSE 'now'::timestamp END AS now_jst
)
SELECT now_jst,
       date_trunc('day', now_jst)                              AS today_start,
       now_jst - interval '4 hours'                            AS live_from,
       LEAST(date_trunc('day', now_jst), now_jst - interval '4 hours') AS since,
       (SELECT MAX(record_time) FROM static_data)              AS latest_record_in_db,
       now_jst - (SELECT MAX(record_time) FROM static_data)    AS data_age
FROM p;

-- ------------------------------------------------------------
-- 1. Repository（findLatestSince）＋ Service（snapshot）の判定を SQL で再現
--    decision: LIVE = ライブに出る / FINISHED_TODAY = 数字カード用 / NOT_LIVE = 延期・中止など / STALE = 4時間より前で止まっている
--    country / league は Java の splitCategory と同じ分け方（「国: リーグ - ラウンド N」）
-- ------------------------------------------------------------
WITH p AS (
  SELECT CASE WHEN 'now' = 'now' THEN (now() AT TIME ZONE 'Asia/Tokyo')::timestamp(0)
              ELSE 'now'::timestamp END AS now_jst
), b AS (
  SELECT now_jst, date_trunc('day', now_jst) AS today_start, now_jst - interval '4 hours' AS live_from,
         LEAST(date_trunc('day', now_jst), now_jst - interval '4 hours') AS since
  FROM p
), recent AS (
  SELECT d.*,
         COALESCE(NULLIF(BTRIM(d.match_id), ''), d.home_team_name || '|' || d.away_team_name) AS match_key,
         NULLIF(SUBSTRING(d.seq_key FROM '([0-9]+)$'), '')::BIGINT AS seq_no
  FROM static_data d, b
  WHERE d.record_time >= b.since AND d.record_time <= b.now_jst
    AND d.home_team_name IS NOT NULL AND d.away_team_name IS NOT NULL
), latest AS (
  SELECT DISTINCT ON (match_key) *
  FROM recent
  ORDER BY match_key, seq_no DESC NULLS LAST, record_time DESC
), cnt AS (
  SELECT match_key, COUNT(*) AS rows_in_window,
         COUNT(DISTINCT data_category) AS categories,
         COUNT(DISTINCT home_team_name || '|' || away_team_name) AS team_pairs,
         MIN(record_time) AS first_record
  FROM recent GROUP BY match_key
)
SELECT
  CASE WHEN BTRIM(l.times) = '終了済' THEN 'FINISHED_TODAY'
       WHEN BTRIM(COALESCE(l.times, '')) = '' OR l.times ~ '(延期|中止|中断|キャンセル|ペナルティ)' THEN 'NOT_LIVE'
       WHEN l.record_time < b.live_from THEN 'STALE'
       ELSE 'LIVE' END                                         AS decision,
  l.match_key,
  l.seq_key,
  l.data_category,
  NULLIF(BTRIM(split_part(l.data_category, ':', 1)), '')       AS country,
  NULLIF(BTRIM(split_part(split_part(l.data_category, ':', 2), ' - ', 1)), '') AS league,
  BTRIM(l.times)                                               AS times,
  '[' || l.home_team_name || ']'                               AS home,   -- [] で空文字・空白が見える
  '[' || l.away_team_name || ']'                               AS away,
  l.home_score || '-' || l.away_score                          AS score,
  l.home_rank || ' / ' || l.away_rank                          AS ranks,
  l.record_time,
  b.now_jst - l.record_time                                    AS since_last_record,
  c.rows_in_window, c.categories, c.team_pairs,
  (BTRIM(l.home_team_name) = '' OR BTRIM(l.away_team_name) = '') AS blank_team,
  (NULLIF(BTRIM(l.match_id), '') IS NULL)                      AS no_match_id
FROM latest l
JOIN cnt c USING (match_key)
CROSS JOIN b
ORDER BY decision, country, league, l.data_category;

-- ------------------------------------------------------------
-- 2. 対象の試合（pattern に一致）の全行（時系列）
--    どの行から XXX / 空のチーム名になったか、試合が止まっていないか、match_id・リンク
-- ------------------------------------------------------------
WITH p AS (
  SELECT CASE WHEN 'now' = 'now' THEN (now() AT TIME ZONE 'Asia/Tokyo')::timestamp(0)
              ELSE 'now'::timestamp END AS now_jst
), m AS (
  -- pattern に一致する行がある試合（match_id 単位。match_id が空ならその行だけ）
  SELECT DISTINCT COALESCE(NULLIF(BTRIM(match_id), ''), seq_key) AS k
  FROM static_data, p
  WHERE record_time >= p.now_jst - interval '1 day' AND record_time <= p.now_jst
    AND (data_category ~ '(XXX|YYY|ウガンダ|タンザニア)' OR home_team_name ~ '(XXX|YYY|ウガンダ|タンザニア)' OR away_team_name ~ '(XXX|YYY|ウガンダ|タンザニア)')
)
SELECT
  COALESCE(NULLIF(BTRIM(d.match_id), ''), d.seq_key)          AS k,
  NULLIF(SUBSTRING(d.seq_key FROM '([0-9]+)$'), '')::BIGINT   AS seq_no,
  d.seq_key, d.data_category, BTRIM(d.times) AS times,
  '[' || d.home_team_name || ']' AS home, '[' || d.away_team_name || ']' AS away,
  d.home_score || '-' || d.away_score AS score,
  d.record_time, d.game_link, d.add_manual_flg, d.logic_flg, d.register_id, d.register_time
FROM static_data d
JOIN m ON m.k = COALESCE(NULLIF(BTRIM(d.match_id), ''), d.seq_key)
ORDER BY k, seq_no NULLS LAST, d.record_time;

-- ------------------------------------------------------------
-- 3. 取得に失敗していそうな行（直近1日）：XXX/YYY・チーム名が空/NULL・match_id が空
-- ------------------------------------------------------------
WITH p AS (
  SELECT CASE WHEN 'now' = 'now' THEN (now() AT TIME ZONE 'Asia/Tokyo')::timestamp(0)
              ELSE 'now'::timestamp END AS now_jst
)
SELECT
  COUNT(*)                                                                         AS rows_1day,
  COUNT(*) FILTER (WHERE data_category ~* '^\s*(XXX|YYY)\s*:')                     AS placeholder_category,
  COUNT(*) FILTER (WHERE data_category IS NULL OR data_category !~ '^\s*[^:]+:\s*\S') AS bad_category_format,
  COUNT(*) FILTER (WHERE home_team_name IS NULL OR away_team_name IS NULL)          AS null_team,
  COUNT(*) FILTER (WHERE BTRIM(home_team_name) = '' OR BTRIM(away_team_name) = '')  AS blank_team,
  COUNT(*) FILTER (WHERE NULLIF(BTRIM(match_id), '') IS NULL)                       AS no_match_id
FROM static_data, p
WHERE record_time >= p.now_jst - interval '1 day' AND record_time <= p.now_jst;

-- ------------------------------------------------------------
-- 4. 同じ match_key に違うカテゴリ・チーム名が混ざっている試合（取得失敗の行が正常な行を隠していないか）
-- ------------------------------------------------------------
WITH p AS (
  SELECT CASE WHEN 'now' = 'now' THEN (now() AT TIME ZONE 'Asia/Tokyo')::timestamp(0)
              ELSE 'now'::timestamp END AS now_jst
)
SELECT COALESCE(NULLIF(BTRIM(match_id), ''), home_team_name || '|' || away_team_name) AS match_key,
       COUNT(*) AS rows,
       ARRAY_AGG(DISTINCT data_category) AS categories,
       ARRAY_AGG(DISTINCT '[' || home_team_name || '] vs [' || away_team_name || ']') AS team_pairs
FROM static_data, p
WHERE record_time >= p.now_jst - interval '1 day' AND record_time <= p.now_jst
GROUP BY 1
HAVING COUNT(DISTINCT data_category) > 1
    OR COUNT(DISTINCT COALESCE(home_team_name, '<null>') || '|' || COALESCE(away_team_name, '<null>')) > 1
ORDER BY rows DESC
LIMIT 50;

-- ------------------------------------------------------------
-- 5. 予想（バー・ゴール見込み）の元データがあるか
--    dashboard_team_rate に（国・リーグ・チーム・H/A）の行が無いと、リーグ平均か既定値で計算される
--    （＝ ウガンダ / タンザニアのバーが「データなしの推定」かどうか）
-- ------------------------------------------------------------
WITH p AS (
  SELECT CASE WHEN 'now' = 'now' THEN (now() AT TIME ZONE 'Asia/Tokyo')::timestamp(0)
              ELSE 'now'::timestamp END AS now_jst
), latest AS (
  SELECT DISTINCT ON (COALESCE(NULLIF(BTRIM(match_id), ''), home_team_name || '|' || away_team_name))
         data_category, home_team_name, away_team_name, times
  FROM static_data, p
  WHERE record_time >= p.now_jst - interval '4 hours' AND record_time <= p.now_jst
  ORDER BY COALESCE(NULLIF(BTRIM(match_id), ''), home_team_name || '|' || away_team_name),
           NULLIF(SUBSTRING(seq_key FROM '([0-9]+)$'), '')::BIGINT DESC NULLS LAST
), s AS (
  SELECT BTRIM(split_part(data_category, ':', 1)) AS country,
         BTRIM(split_part(split_part(data_category, ':', 2), ' - ', 1)) AS league,
         BTRIM(home_team_name) AS home, BTRIM(away_team_name) AS away, times
  FROM latest
)
SELECT s.country, s.league, s.home, s.away, s.times,
       h.match_count AS home_H_matches, h.avg_goals_for AS home_H_gf, h.avg_goals_against AS home_H_ga,
       a.match_count AS away_A_matches, a.avg_goals_for AS away_A_gf, a.avg_goals_against AS away_A_ga,
       (SELECT COUNT(*) FROM dashboard_team_rate r WHERE r.country = s.country AND r.league = s.league) AS league_rows,
       CASE WHEN h.team IS NOT NULL AND a.team IS NOT NULL THEN 'チーム成績あり'
            WHEN EXISTS (SELECT 1 FROM dashboard_team_rate r WHERE r.country = s.country AND r.league = s.league) THEN 'リーグ平均で推定'
            ELSE '成績なし（既定値で推定）' END AS forecast_basis
FROM s
LEFT JOIN dashboard_team_rate h ON h.country = s.country AND h.league = s.league AND h.team = s.home AND h.ha = 'H'
LEFT JOIN dashboard_team_rate a ON a.country = s.country AND a.league = s.league AND a.team = s.away AND a.ha = 'A'
ORDER BY forecast_basis, s.country, s.league;

-- ------------------------------------------------------------
-- 6. 国・リーグの名前の候補（ウガンダ / タンザニアのリーグが surface_overview_match・マスタでどう書かれているか）
-- ------------------------------------------------------------
SELECT country, league, season, COUNT(*) AS rows, COUNT(DISTINCT team) AS teams
FROM surface_overview_match
WHERE country ~ '(XXX|YYY|ウガンダ|タンザニア)' OR league ~ '(XXX|YYY|ウガンダ|タンザニア)'
GROUP BY country, league, season
ORDER BY country, league, season;
