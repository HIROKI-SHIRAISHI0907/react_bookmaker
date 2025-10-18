// srv/routes/overview.ts
import { Router } from "express";
import { prismaStats } from "../db";

const overviewRouter = Router();

/**
 * GET /api/overview/:country/:league/:team
 *  - 月ごとの順位, 勝点, 勝/分/負, 試合数
 *  - Home/Away: クリーンシート, 合計/前半/後半 得点, 勝数, 負数, 先制回数
 */
overviewRouter.get("/:country/:league/:team", async (req, res) => {
  const country = safeDecode(req.params.country);
  const league = safeDecode(req.params.league);
  const teamSlug = req.params.team;

  if (!country || !league || !teamSlug) {
    return res.status(400).json({ message: "country, league, team are required" });
  }

  try {
    // スラッグ→日本語名（/team/<english>/<hash> から english を厳密一致）
    const teamRow = await prismaStats.$queryRaw<{ team: string }[]>`
      SELECT team
      FROM country_league_master
      WHERE country = ${country}
        AND league  = ${league}
        AND split_part(NULLIF(link,''), '/', 3) = ${teamSlug}
      LIMIT 1
    `;
    const teamJa = teamRow[0]?.team ?? teamSlug;

    const rows = await prismaStats.$queryRawUnsafe<any[]>(
      `
      WITH base AS (
        SELECT
          o.game_year::int  AS year,
          o.game_month::int AS month,

          -- ランク（その月の最良＝最小順位）
          MIN(NULLIF(BTRIM(o.rank), '')::int) AS rank,

          -- トータル
          SUM(COALESCE(NULLIF(BTRIM(o.winning_points), '')::int, 0)) AS winning_points,
          SUM(COALESCE(NULLIF(BTRIM(o.games), '' )::int, 0))                                            AS games_raw,
          SUM(COALESCE(NULLIF(BTRIM(o.win),   '' )::int, 0))                                             AS wins,
          SUM(COALESCE(NULLIF(BTRIM(o.draw),  '' )::int, 0))                                             AS draws,
          SUM(COALESCE(NULLIF(BTRIM(o.lose),  '' )::int, 0))                                             AS loses,

          -- トータル得点/CS（home+away）
          SUM(COALESCE(NULLIF(BTRIM(o.home_sum_score),  '')::int, 0)
            + COALESCE(NULLIF(BTRIM(o.away_sum_score),  '')::int, 0))                                    AS goals_for,
          SUM(COALESCE(NULLIF(BTRIM(o.home_clean_sheet), '')::int, 0)
            + COALESCE(NULLIF(BTRIM(o.away_clean_sheet), '')::int, 0))                                  AS clean_sheets,

          -- Home/Away 明細（得点：合計/前半/後半、クリーンシート、勝/負、先制）
          SUM(COALESCE(NULLIF(BTRIM(o.home_sum_score),  '')::int, 0))                                    AS home_goals_for,
          SUM(COALESCE(NULLIF(BTRIM(o.home_1st_half_score), '')::int, 0))                                AS home_goals_1st,
          SUM(COALESCE(NULLIF(BTRIM(o.home_2nd_half_score), '')::int, 0))                                AS home_goals_2nd,
          SUM(COALESCE(NULLIF(BTRIM(o.home_clean_sheet), '')::int, 0))                                   AS home_clean_sheets,
          SUM(COALESCE(NULLIF(BTRIM(o.home_win_count), '')::int, 0))                                     AS home_wins,
          SUM(COALESCE(NULLIF(BTRIM(o.home_lose_count), '')::int, 0))                                    AS home_loses,
          SUM(COALESCE(NULLIF(BTRIM(o.home_first_goal_count), '')::int, 0))                              AS home_first_goals,

          SUM(COALESCE(NULLIF(BTRIM(o.away_sum_score),  '')::int, 0))                                    AS away_goals_for,
          SUM(COALESCE(NULLIF(BTRIM(o.away_1st_half_score), '')::int, 0))                                AS away_goals_1st,
          SUM(COALESCE(NULLIF(BTRIM(o.away_2nd_half_score), '')::int, 0))                                AS away_goals_2nd,
          SUM(COALESCE(NULLIF(BTRIM(o.away_clean_sheet), '')::int, 0))                                   AS away_clean_sheets,
          SUM(COALESCE(NULLIF(BTRIM(o.away_win_count), '')::int, 0))                                     AS away_wins,
          SUM(COALESCE(NULLIF(BTRIM(o.away_lose_count), '')::int, 0))                                    AS away_loses,
          SUM(COALESCE(NULLIF(BTRIM(o.away_first_goal_count), '')::int, 0))                              AS away_first_goals

        FROM public.surface_overview o
        WHERE o.country = $1
          AND o.league  = $2
          AND o.team    = $3
        GROUP BY o.game_year, o.game_month
      )
      SELECT
        year, month, rank,
        winning_points,
        -- games: games_raw が無い（=0）の場合は wins+draws+loses を使用
        CASE WHEN SUM(games_raw) OVER () IS NULL OR games_raw = 0
          THEN (wins + draws + loses)
          ELSE games_raw
        END AS games,
        wins, draws, loses,
        goals_for, clean_sheets,
        home_goals_for, home_goals_1st, home_goals_2nd, home_clean_sheets, home_wins, home_loses, home_first_goals,
        away_goals_for, away_goals_1st, away_goals_2nd, away_clean_sheets, away_wins, away_loses, away_first_goals
      FROM base
      ORDER BY year ASC, month ASC
      `,
      country,
      league,
      teamJa
    );

    const items = rows.map((r) => ({
      year: Number(r.year),
      month: Number(r.month),
      ym: `${r.year}-${String(r.month).padStart(2, "0")}`,
      label: `${String(r.month).padStart(2, "0")}月`,

      // ランク/基本
      rank: r.rank == null ? null : Number(r.rank),
      winningPoints: Number(r.winning_points ?? 0),
      games: Number(r.games ?? 0),
      win: Number(r.wins ?? 0),
      draw: Number(r.draws ?? 0),
      lose: Number(r.loses ?? 0),

      // トータル
      goalsFor: Number(r.goals_for ?? 0),
      cleanSheets: Number(r.clean_sheets ?? 0),

      // Home
      homeGoalsFor: Number(r.home_goals_for ?? 0),
      homeGoals1st: Number(r.home_goals_1st ?? 0),
      homeGoals2nd: Number(r.home_goals_2nd ?? 0),
      homeCleanSheets: Number(r.home_clean_sheets ?? 0),
      homeWins: Number(r.home_wins ?? 0),
      homeLoses: Number(r.home_loses ?? 0),
      homeFirstGoals: Number(r.home_first_goals ?? 0),

      // Away
      awayGoalsFor: Number(r.away_goals_for ?? 0),
      awayGoals1st: Number(r.away_goals_1st ?? 0),
      awayGoals2nd: Number(r.away_goals_2nd ?? 0),
      awayCleanSheets: Number(r.away_clean_sheets ?? 0),
      awayWins: Number(r.away_wins ?? 0),
      awayLoses: Number(r.away_loses ?? 0),
      awayFirstGoals: Number(r.away_first_goals ?? 0),
    }));

    return res.json({ items });
  } catch (e: any) {
    console.error("[GET /api/overview/:country/:league/:team] error", {
      params: req.params,
      err: e?.message,
    });
    return res.status(500).json({ message: "server error", detail: e?.message ?? String(e) });
  }
});

export default overviewRouter;

function safeDecode(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
