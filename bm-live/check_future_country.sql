-- soccer_bm_master で実行: これからの試合（今〜36時間後）の game_team_category の形を確認
SELECT game_team_category,
       (game_team_category ~ '^\s*[^:]+:\s*\S')        AS has_country,
       (game_team_category ~* '^\s*(XXX|YYY)\s*[:-]')  AS placeholder,
       COUNT(*) AS matches,
       MIN(future_time) AS first_kickoff
FROM future_master
WHERE future_time > CURRENT_TIMESTAMP
  AND future_time <= CURRENT_TIMESTAMP + INTERVAL '36 hours'
GROUP BY game_team_category
ORDER BY matches DESC
LIMIT 50;

