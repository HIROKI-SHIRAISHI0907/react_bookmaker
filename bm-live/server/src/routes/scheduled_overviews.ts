// src/routes/scheduled_overviews.ts
import { Router } from "express";
import { prismaStats } from "../db";

export type SurfaceSnapshot = {
  team: string;
  game_year: number | null;
  game_month: number | null;
  rank: number | null;
  games: number | null;
  win: number | null;
  draw: number | null;
  lose: number | null;
  winning_points: number | null;

  // 既存
  goals_for: number | null;
  clean_sheets: number | null;
  first_half_score: number | null;
  second_half_score: number | null;

  // ▼ 新規: 役割で home/away を自動切替して返す
  first_goal_count?: number | null; // 先制回数
  win_behind_count?: number | null; // 逆転勝利数
  lose_behind_count?: number | null; // 逆転敗北数
  win_count_role?: number | null; // （home or away の）勝利数
  lose_count_role?: number | null; // （home or away の）敗北数

  // 役割に依存しないカウント（そのまま）
  fail_to_score_game_count?: number | null;

  // バッジ表示は現状通り
  consecutive_win_disp?: string | null;
  consecutive_lose_disp?: string | null;
  unbeaten_streak_disp?: string | null;
  consecutive_score_count_disp?: string | null;
  first_week_game_win_disp?: string | null;
  mid_week_game_win_disp?: string | null;
  last_week_game_win_disp?: string | null;
  lose_streak_disp?: string | null;
  promote_disp?: string | null;
  descend_disp?: string | null;
  home_adversity_disp?: string | null;
  away_adversity_disp?: string | null;
};

export type ScheduleOverviewResponse = {
  match: {
    seq: number;
    country: string;
    league: string;
    home_team: string;
    away_team: string;
    future_time: string | null;
    round_no: number | null;
    game_year: number | null;
    game_month: number | null;
  };
  surfaces: SurfaceSnapshot[];
};

const scheduledOverviewRouter = Router();

scheduledOverviewRouter.get("/:country/:league/:seq", async (req, res) => {
  const country = safeDecode(req.params.country ?? "");
  const league = safeDecode(req.params.league ?? "");
  const seqStr = String(req.params.seq ?? "");
  const seq = Number(seqStr);

  const homeTeam = safeDecode(String(req.query.home ?? "")).trim();
  const awayTeam = safeDecode(String(req.query.away ?? "")).trim();

  if (!country || !league || !seqStr || !Number.isFinite(seq)) {
    return res.status(400).json({ message: "country/league/seq are required" });
  }
  if (!homeTeam && !awayTeam) {
    return res.status(400).json({ message: "home or away query parameter is required (at least one)" });
  }

  try {
    // 置き換え: 指定チームの「月別レコードを合算」して返す
    const fetchLatest = async (teamName: string, role: "home" | "away"): Promise<SurfaceSnapshot | null> => {
      const rows = await prismaStats.$queryRawUnsafe<any[]>(
        `
  WITH base AS (
    SELECT *
    FROM public.surface_overview
    WHERE
      BTRIM(country) = BTRIM($1)
      AND BTRIM(league)  = BTRIM($2)
      AND BTRIM(team)    = BTRIM($3)
  ),

  -- 月別の「この役割でどの列を足すか」を可視化（検証用）
  monthly AS (
    SELECT
      NULLIF(BTRIM(game_year),  '')::int  AS game_year,
      NULLIF(BTRIM(game_month), '')::int  AS game_month,
      CASE WHEN $4 = 'home'
        THEN COALESCE(NULLIF(BTRIM(home_sum_score),   '')::int, 0)
        ELSE COALESCE(NULLIF(BTRIM(away_sum_score),   '')::int, 0)
      END AS goals_for_m,
      CASE WHEN $4 = 'home'
        THEN COALESCE(NULLIF(BTRIM(home_clean_sheet), '')::int, 0)
        ELSE COALESCE(NULLIF(BTRIM(away_clean_sheet), '')::int, 0)
      END AS clean_sheets_m,
      CASE WHEN $4 = 'home'
        THEN COALESCE(NULLIF(BTRIM(home_1st_half_score), '')::int, 0)
        ELSE COALESCE(NULLIF(BTRIM(away_1st_half_score), '')::int, 0)
      END AS first_half_m,
      CASE WHEN $4 = 'home'
        THEN COALESCE(NULLIF(BTRIM(home_2nd_half_score), '')::int, 0)
        ELSE COALESCE(NULLIF(BTRIM(away_2nd_half_score), '')::int, 0)
      END AS second_half_m,

      CASE WHEN $4 = 'home'
        THEN COALESCE(NULLIF(BTRIM(home_first_goal_count), '' )::int, 0)
        ELSE COALESCE(NULLIF(BTRIM(away_first_goal_count), '' )::int, 0)
      END AS first_goal_m,

      CASE WHEN $4 = 'home'
        THEN COALESCE(NULLIF(BTRIM(home_win_behind_count), '' )::int, 0)
        ELSE COALESCE(NULLIF(BTRIM(away_win_behind_count), '' )::int, 0)
      END AS win_behind_m,

      CASE WHEN $4 = 'home'
        THEN COALESCE(NULLIF(BTRIM(home_lose_behind_count), '' )::int, 0)
        ELSE COALESCE(NULLIF(BTRIM(away_lose_behind_count), '' )::int, 0)
      END AS lose_behind_m
    FROM base
  ),

  agg AS (
    SELECT
      SUM(COALESCE(NULLIF(BTRIM(games),  '')::int, 0))::int AS games,
      SUM(COALESCE(NULLIF(BTRIM(win),    '')::int, 0))::int AS win,
      SUM(COALESCE(NULLIF(BTRIM(draw),   '')::int, 0))::int AS draw,
      SUM(COALESCE(NULLIF(BTRIM(lose),   '')::int, 0))::int AS lose,
      SUM(COALESCE(NULLIF(BTRIM(winning_points), '')::int, 0))::int AS winning_points,

      SUM(goals_for_m)::int      AS goals_for,
      SUM(clean_sheets_m)::int   AS clean_sheets,
      SUM(first_half_m)::int     AS first_half_score,
      SUM(second_half_m)::int    AS second_half_score,
      SUM(first_goal_m)::int     AS first_goal_count,
      SUM(win_behind_m)::int     AS win_behind_count,
      SUM(lose_behind_m)::int    AS lose_behind_count,

      -- 役割別の勝敗数
      SUM(CASE WHEN $4='home'
            THEN COALESCE(NULLIF(BTRIM(home_win_count), '' )::int, 0)
            ELSE COALESCE(NULLIF(BTRIM(away_win_count), '' )::int, 0)
          END)::int AS win_count_role,
      SUM(CASE WHEN $4='home'
            THEN COALESCE(NULLIF(BTRIM(home_lose_count), '' )::int, 0)
            ELSE COALESCE(NULLIF(BTRIM(away_lose_count), '' )::int, 0)
          END)::int AS lose_count_role,

      -- 役割に依存しない
      SUM(COALESCE(NULLIF(BTRIM(fail_to_score_game_count), '' )::int, 0))::int AS fail_to_score_game_count
    FROM base b
    JOIN monthly m
      ON m.game_year  = NULLIF(BTRIM(b.game_year),  '')::int
     AND m.game_month = NULLIF(BTRIM(b.game_month), '')::int
  ),

  latest AS (
    SELECT
      BTRIM(team)::text AS team,
      NULLIF(BTRIM(game_year),  '')::int  AS game_year,
      NULLIF(BTRIM(game_month), '')::int  AS game_month,
      consecutive_win_disp,
      consecutive_lose_disp,
      unbeaten_streak_disp,
      consecutive_score_count_disp,
      first_week_game_win_disp,
      mid_week_game_win_disp,
      last_week_game_win_disp,
      lose_streak_disp,
      promote_disp,
      descend_disp,
      home_adversity_disp,
      away_adversity_disp
    FROM base
    ORDER BY NULLIF(BTRIM(game_year),  '')::int DESC,
             NULLIF(BTRIM(game_month), '')::int DESC
    LIMIT 1
  )

  SELECT
    latest.team, latest.game_year, latest.game_month,
    agg.games, agg.win, agg.draw, agg.lose, agg.winning_points,
    agg.goals_for, agg.clean_sheets, agg.first_half_score, agg.second_half_score,
    agg.first_goal_count, agg.win_behind_count, agg.lose_behind_count,
    agg.win_count_role, agg.lose_count_role, agg.fail_to_score_game_count,
    latest.consecutive_win_disp, latest.consecutive_lose_disp, latest.unbeaten_streak_disp,
    latest.consecutive_score_count_disp, latest.first_week_game_win_disp, latest.mid_week_game_win_disp,
    latest.last_week_game_win_disp, latest.lose_streak_disp, latest.promote_disp, latest.descend_disp,
    latest.home_adversity_disp, latest.away_adversity_disp
  FROM agg CROSS JOIN latest
  `,
        country,
        league,
        teamName,
        role
      );

      const r = rows[0];
      if (!r) return null;

      const snap: SurfaceSnapshot = {
        team: r.team,
        game_year: r.game_year ?? null,
        game_month: r.game_month ?? null,
        rank: null, // 集計の性質上ランクは意味が薄いので除外（必要なら latest.rank を追加）
        games: r.games ?? null,
        win: r.win ?? null,
        draw: r.draw ?? null,
        lose: r.lose ?? null,
        winning_points: r.winning_points ?? null,

        goals_for: r.goals_for ?? null,
        clean_sheets: r.clean_sheets ?? null,
        first_half_score: r.first_half_score ?? null,
        second_half_score: r.second_half_score ?? null,

        first_goal_count: r.first_goal_count ?? null,
        win_behind_count: r.win_behind_count ?? null,
        lose_behind_count: r.lose_behind_count ?? null,
        win_count_role: r.win_count_role ?? null,
        lose_count_role: r.lose_count_role ?? null,
        fail_to_score_game_count: r.fail_to_score_game_count ?? null,

        consecutive_win_disp: r.consecutive_win_disp ?? null,
        consecutive_lose_disp: r.consecutive_lose_disp ?? null,
        unbeaten_streak_disp: r.unbeaten_streak_disp ?? null,
        consecutive_score_count_disp: r.consecutive_score_count_disp ?? null,
        first_week_game_win_disp: r.first_week_game_win_disp ?? null,
        mid_week_game_win_disp: r.mid_week_game_win_disp ?? null,
        last_week_game_win_disp: r.last_week_game_win_disp ?? null,
        lose_streak_disp: r.lose_streak_disp ?? null,
        promote_disp: r.promote_disp ?? null,
        descend_disp: r.descend_disp ?? null,
        home_adversity_disp: r.home_adversity_disp ?? null,
        away_adversity_disp: r.away_adversity_disp ?? null,
      };
      return snap;
    };

    let homeSnap: SurfaceSnapshot | null = null;
    let awaySnap: SurfaceSnapshot | null = null;
    if (homeTeam) homeSnap = await fetchLatest(homeTeam, "home");
    if (awayTeam) awaySnap = await fetchLatest(awayTeam, "away");

    if (!homeSnap && !awaySnap) {
      return res.status(404).json({ message: "no surface_overview snapshot for given team(s)" });
    }

    const yms = [homeSnap, awaySnap]
      .filter(Boolean)
      .map((s) => ({ y: s!.game_year ?? 0, m: s!.game_month ?? 0 }))
      .sort((a, b) => (a.y === b.y ? b.m - a.m : b.y - a.y));
    const latest = yms[0] ?? { y: null as any, m: null as any };

    const resp: ScheduleOverviewResponse = {
      match: {
        seq,
        country,
        league,
        home_team: homeSnap?.team ?? (homeTeam || ""),
        away_team: awaySnap?.team ?? (awayTeam || ""),
        future_time: null,
        round_no: null,
        game_year: latest?.y ?? null,
        game_month: latest?.m ?? null,
      },
      surfaces: [homeSnap, awaySnap].filter(Boolean) as SurfaceSnapshot[],
    };

    return res.json(resp);
  } catch (e: any) {
    console.error("[GET /api/scheduled-overview/:country/:league/:seq] error", {
      params: req.params,
      query: req.query,
      err: e?.message,
    });
    return res.status(500).json({ message: "server error", detail: e?.message ?? String(e) });
  }
});

export default scheduledOverviewRouter;

function safeDecode(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
