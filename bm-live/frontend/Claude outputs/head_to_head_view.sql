-- =====================================================================
-- 対戦成績（同じ 2 チームの過去の対戦）VIEW  ※ soccer_bm
--
--   元データ: surface_overview_match（1 試合 = チームごとに 2 行。全シーズン・全大会の集計済みの試合）
--
--   head_to_head_match   … 試合ごとの対戦結果（team 視点）。team・opponent を指定すると 1 試合 1 行になる
--   head_to_head_summary … team × opponent の通算成績（ホーム / アウェーを問わず全シーズン。ホーム時・アウェー時の内訳つき）
--
--   ・チーム名は NFKC 正規化・前後空白除去したキー（team_key / opponent_key）で引く。
--   ・相手側の行しか無い試合も、相手側の行を反転して入れる（得点・失点、勝敗、H/A、先制を入れ替え。勝ち点は NULL）。
--   ・result は PK 決着なら PK の勝敗（surface_overview_match と同じ）。PK 決着は pk_flg で分かる。
--
--   流し方: そのまま流す（何度流しても同じ。VIEW を作り直すだけでデータは変えない）。
-- =====================================================================
BEGIN;

DROP VIEW IF EXISTS head_to_head_summary;
DROP VIEW IF EXISTS head_to_head_match;

CREATE VIEW head_to_head_match AS
WITH base AS (
    -- そのチームの行
    SELECT
        s.season, s.country, s.league, s.round_no, s.data_category, s.match_id, s.match_time,
        s.team, s.opponent, s.ha, s.result, s.pk_flg, s.points,
        s.goals_for, s.goals_against,
        s.goals_for_1st, s.goals_for_2nd, s.goals_against_1st, s.goals_against_2nd,
        s.pk_goals_for, s.pk_goals_against, s.first_goal,
        'SELF'::text AS source
    FROM surface_overview_match s
    UNION ALL
    -- 相手側の行しか無い試合（相手の行を反転する）
    SELECT
        o.season, o.country, o.league, o.round_no, o.data_category, o.match_id, o.match_time,
        o.opponent AS team, o.team AS opponent,
        CASE o.ha WHEN 'H' THEN 'A' ELSE 'H' END AS ha,
        CASE o.result WHEN 'W' THEN 'L' WHEN 'L' THEN 'W' ELSE 'D' END AS result,
        o.pk_flg, NULL::SMALLINT AS points,
        o.goals_against AS goals_for, o.goals_for AS goals_against,
        o.goals_against_1st AS goals_for_1st, o.goals_against_2nd AS goals_for_2nd,
        o.goals_for_1st AS goals_against_1st, o.goals_for_2nd AS goals_against_2nd,
        o.pk_goals_against AS pk_goals_for, o.pk_goals_for AS pk_goals_against,
        CASE o.first_goal WHEN 'T' THEN 'O' WHEN 'O' THEN 'T' ELSE o.first_goal END AS first_goal,
        'MIRROR'::text AS source
    FROM surface_overview_match o
    WHERE NOT EXISTS (
        SELECT 1
        FROM surface_overview_match x
        WHERE x.season   = o.season
          AND x.country  = o.country
          AND x.league   = o.league
          AND x.round_no = o.round_no
          AND normalize(BTRIM(x.team), NFKC)     = normalize(BTRIM(o.opponent), NFKC)
          AND normalize(BTRIM(x.opponent), NFKC) = normalize(BTRIM(o.team), NFKC)
    )
)
SELECT
    normalize(BTRIM(b.team), NFKC)      AS team_key,
    normalize(BTRIM(b.opponent), NFKC)  AS opponent_key,
    b.team,
    b.opponent,
    b.season,
    b.country,
    b.league,
    b.round_no,
    b.data_category,
    b.match_id,
    b.match_time,
    b.ha,
    CASE b.ha WHEN 'H' THEN b.team ELSE b.opponent END              AS home_team_name,
    CASE b.ha WHEN 'H' THEN b.opponent ELSE b.team END              AS away_team_name,
    CASE b.ha WHEN 'H' THEN b.goals_for ELSE b.goals_against END    AS home_score,
    CASE b.ha WHEN 'H' THEN b.goals_against ELSE b.goals_for END    AS away_score,
    b.result,
    b.pk_flg,
    b.pk_goals_for,
    b.pk_goals_against,
    b.points,
    b.goals_for,
    b.goals_against,
    b.goals_for_1st,
    b.goals_for_2nd,
    b.goals_against_1st,
    b.goals_against_2nd,
    b.first_goal,
    b.source
FROM base b;

COMMENT ON VIEW head_to_head_match IS
  '対戦成績（試合ごと・team 視点）。surface_overview_match から作る。相手側の行しか無い試合は反転して入れる（source=MIRROR）';

CREATE VIEW head_to_head_summary AS
SELECT
    m.team_key,
    m.opponent_key,
    MAX(m.team)                                                        AS team,
    MAX(m.opponent)                                                    AS opponent,
    COUNT(*)                                                           AS matches,
    COUNT(*) FILTER (WHERE m.result = 'W')                             AS wins,
    COUNT(*) FILTER (WHERE m.result = 'D')                             AS draws,
    COUNT(*) FILTER (WHERE m.result = 'L')                             AS losses,
    COUNT(*) FILTER (WHERE m.pk_flg AND m.result = 'W')                AS pk_wins,
    COUNT(*) FILTER (WHERE m.pk_flg AND m.result = 'L')                AS pk_losses,
    COALESCE(SUM(m.goals_for), 0)                                      AS goals_for,
    COALESCE(SUM(m.goals_against), 0)                                  AS goals_against,
    COUNT(*) FILTER (WHERE m.goals_against = 0)                        AS clean_sheets,
    COUNT(*) FILTER (WHERE m.goals_for = 0)                            AS failed_to_score,
    COUNT(*) FILTER (WHERE m.goals_for > 0 AND m.goals_against > 0)    AS both_scored,
    COUNT(*) FILTER (WHERE m.first_goal = 'T')                         AS scored_first,
    COUNT(*) FILTER (WHERE m.first_goal = 'O')                         AS conceded_first,
    -- ホーム時（team がホーム）
    COUNT(*) FILTER (WHERE m.ha = 'H')                                 AS home_matches,
    COUNT(*) FILTER (WHERE m.ha = 'H' AND m.result = 'W')              AS home_wins,
    COUNT(*) FILTER (WHERE m.ha = 'H' AND m.result = 'D')              AS home_draws,
    COUNT(*) FILTER (WHERE m.ha = 'H' AND m.result = 'L')              AS home_losses,
    COALESCE(SUM(m.goals_for)     FILTER (WHERE m.ha = 'H'), 0)        AS home_goals_for,
    COALESCE(SUM(m.goals_against) FILTER (WHERE m.ha = 'H'), 0)        AS home_goals_against,
    -- アウェー時（team がアウェー）
    COUNT(*) FILTER (WHERE m.ha = 'A')                                 AS away_matches,
    COUNT(*) FILTER (WHERE m.ha = 'A' AND m.result = 'W')              AS away_wins,
    COUNT(*) FILTER (WHERE m.ha = 'A' AND m.result = 'D')              AS away_draws,
    COUNT(*) FILTER (WHERE m.ha = 'A' AND m.result = 'L')              AS away_losses,
    COALESCE(SUM(m.goals_for)     FILTER (WHERE m.ha = 'A'), 0)        AS away_goals_for,
    COALESCE(SUM(m.goals_against) FILTER (WHERE m.ha = 'A'), 0)        AS away_goals_against,
    COUNT(DISTINCT m.season)                                           AS seasons,
    MIN(m.match_time)                                                  AS first_match_time,
    MAX(m.match_time)                                                  AS last_match_time
FROM head_to_head_match m
GROUP BY m.team_key, m.opponent_key;

COMMENT ON VIEW head_to_head_summary IS
  '対戦成績の通算（team × opponent。ホーム/アウェーを問わず全シーズン。ホーム時・アウェー時の内訳つき）';

-- 引くときに使う索引（チーム名の正規化キー）
CREATE INDEX IF NOT EXISTS idx_surface_overview_match_h2h
    ON surface_overview_match ((normalize(BTRIM(team), NFKC)), (normalize(BTRIM(opponent), NFKC)));

COMMIT;

-- 確認（例）
-- SELECT * FROM head_to_head_summary
--  WHERE team_key = normalize('鹿島アントラーズ', NFKC) AND opponent_key = normalize('浦和レッズ', NFKC);
-- SELECT season, round_no, match_time, home_team_name, home_score, away_score, away_team_name, result, pk_flg
--   FROM head_to_head_match
--  WHERE team_key = normalize('鹿島アントラーズ', NFKC) AND opponent_key = normalize('浦和レッズ', NFKC)
--  ORDER BY match_time DESC NULLS LAST;
