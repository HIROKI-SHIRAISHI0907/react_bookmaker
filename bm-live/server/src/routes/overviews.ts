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

/**
 * GET /api/overview/:country/:league/match/:seq
 *  - 指定seqの試合情報 + その月の surface_overview 集計（home/away の2チーム分）
 * 返却:
 * {
 *   match: { ... },
 *   surfaces: [ {team, games, win, draw, lose, winning_points, rank, ...}, ... ]
 * }
 */
overviewRouter.get("/:country/:league/match/:seq", async (req, res) => {
  const country = safeDecode(req.params.country);
  const league = safeDecode(req.params.league);
  const seq = Number(req.params.seq);

  if (!country || !league || !Number.isFinite(seq)) {
    return res.status(400).json({ message: "country, league, valid seq are required" });
  }

  try {
    // 1) 試合情報を取得（★テーブル名/カラム名は実DBに置換してください）
    // 例: future_matches (あなたの upcomings の元テーブル)
    const matchRows = await prismaStats.$queryRawUnsafe<any[]>(
      `
      SELECT
        m.seq::int,
        m.round_no,
        m.future_time,
        m.game_year::int,
        m.game_month::int,
        m.home_team,
        m.away_team,
        m.link
      FROM public.future_matches m
      WHERE m.seq = $1
        AND m.country = $2
        AND m.league  = $3
      LIMIT 1
      `,
      seq,
      country,
      league
    );

    if (matchRows.length === 0) {
      return res.status(404).json({ message: "match not found", seq, country, league });
    }

    const m = matchRows[0];
    const match = {
      seq: Number(m.seq),
      round_no: m.round_no == null ? null : Number(m.round_no),
      future_time: String(m.future_time),
      game_year: Number(m.game_year),
      game_month: Number(m.game_month),
      home_team: String(m.home_team),
      away_team: String(m.away_team),
      link: m.link ?? null,
    };

    // 2) surface_overview から当該 月/年 の home/away 2チームのスナップショットを取る
    const surfaceRows = await prismaStats.$queryRawUnsafe<any[]>(
      `
      WITH base AS (
        SELECT
          team,
          SUM(COALESCE(NULLIF(BTRIM(games), '' )::int, 0)) AS games,
          SUM(COALESCE(NULLIF(BTRIM(win),   '' )::int, 0)) AS win,
          SUM(COALESCE(NULLIF(BTRIM(draw),  '' )::int, 0)) AS draw,
          SUM(COALESCE(NULLIF(BTRIM(lose),  '' )::int, 0)) AS lose,
          SUM(COALESCE(NULLIF(BTRIM(winning_points), '' )::int, 0)) AS winning_points,
          MIN(NULLIF(BTRIM(rank), '' )::int) AS rank,
          MAX(consecutive_win_disp) AS consecutive_win_disp,
          MAX(consecutive_lose_disp) AS consecutive_lose_disp,
          MAX(unbeaten_streak_disp) AS unbeaten_streak_disp,
          MAX(consecutive_score_count_disp) AS consecutive_score_count_disp,
          MAX(first_win_disp) AS first_win_disp,
          MAX(lose_streak_disp) AS lose_streak_disp,
          MAX(promote_disp) AS promote_disp,
          MAX(descend_disp) AS descend_disp,
          MAX(home_adversity_disp) AS home_adversity_disp,
          MAX(away_adversity_disp) AS away_adversity_disp
        FROM public.surface_overview
        WHERE country = $1
          AND league  = $2
          AND game_year  = $3
          AND game_month = $4
          AND team IN ($5, $6)
        GROUP BY team
      )
      SELECT * FROM base
      ORDER BY team ASC
      `,
      country,
      league,
      match.game_year,
      match.game_month,
      match.home_team,
      match.away_team
    );

    const surfaces = surfaceRows.map((r) => ({
      team: String(r.team),
      games: r.games == null ? null : Number(r.games),
      win: r.win == null ? null : Number(r.win),
      draw: r.draw == null ? null : Number(r.draw),
      lose: r.lose == null ? null : Number(r.lose),
      winning_points: r.winning_points == null ? null : Number(r.winning_points),
      rank: r.rank == null ? null : Number(r.rank),

      consecutive_win_disp: r.consecutive_win_disp ?? null,
      consecutive_lose_disp: r.consecutive_lose_disp ?? null,
      unbeaten_streak_disp: r.unbeaten_streak_disp ?? null,
      consecutive_score_count_disp: r.consecutive_score_count_disp ?? null,
      first_win_disp: r.first_win_disp ?? null,
      lose_streak_disp: r.lose_streak_disp ?? null,
      promote_disp: r.promote_disp ?? null,
      descend_disp: r.descend_disp ?? null,
      home_adversity_disp: r.home_adversity_disp ?? null,
      away_adversity_disp: r.away_adversity_disp ?? null,
    }));

    // 念のため home/away の順序に並べ替え
    const ordered = [match.home_team, match.away_team].map((nm) => surfaces.find((s) => s.team === nm)).filter(Boolean) as typeof surfaces;

    return res.json({ match, surfaces: ordered });
  } catch (e: any) {
    console.error("[GET /api/overview/:country/:league/match/:seq] error", {
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
