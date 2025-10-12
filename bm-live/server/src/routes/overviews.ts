import { Router } from "express";
import { prismaStats } from "../db";

const router = Router();

/**
 * GET /api/schedule-overview/:country/:league/:seq
 *
 * - future_master から seq の試合を特定
 * - その future_time(JST) の年/月で public.surface_overview を抽出（国/リーグ/チーム一致）
 * - 2 チーム分の表面データを返却
 */
router.get("/:country/:league/:seq", async (req, res) => {
  const country = safeDecode(req.params.country);
  const league = safeDecode(req.params.league);
  const seq = Number(req.params.seq);

  try {
    // 対象試合のメタ
    const meta = await prismaStats.$queryRawUnsafe<
      {
        seq: number;
        future_time: string;
        home_team_name: string;
        away_team_name: string;
        game_team_category: string | null;
        round_no: number | null;
      }[]
    >(
      `
      SELECT
        f.seq,
        f.future_time,
        f.home_team_name,
        f.away_team_name,
        f.game_team_category,
        CASE
          WHEN regexp_match(f.game_team_category, '(ラウンド|Round)\\s*([0-9]+)') IS NULL THEN NULL
          ELSE ((regexp_match(f.game_team_category, '(ラウンド|Round)\\s*([0-9]+)'))[2])::int
        END AS round_no
      FROM future_master f
      WHERE f.seq = $1
      LIMIT 1
      `,
      seq
    );

    if (!meta.length) return res.status(404).json({ message: "future match not found" });
    const m = meta[0];

    // JST年/月
    const ym = await prismaStats.$queryRawUnsafe<{ y: number; m: number }[]>(
      `
      SELECT
        EXTRACT(YEAR  FROM (TIMESTAMP WITH TIME ZONE $1 AT TIME ZONE 'Asia/Tokyo'))::int AS y,
        EXTRACT(MONTH FROM (TIMESTAMP WITH TIME ZONE $1 AT TIME ZONE 'Asia/Tokyo'))::int AS m
      `,
      m.future_time
    );
    const game_year = ym[0].y;
    const game_month = ym[0].m;

    type Surface = {
      country: string;
      league: string;
      game_year: string;
      game_month: string;
      team: string;
      games: number | null;
      rank: number | null;
      win: number | null;
      draw: number | null;
      lose: number | null;
      winning_points: number | null;
      consecutive_win_disp: string | null;
      consecutive_lose_disp: string | null;
      unbeaten_streak_disp: string | null;
      consecutive_score_count_disp: string | null;
      first_win_disp: string | null;
      lose_streak_disp: string | null;
      promote_disp: string | null;
      descend_disp: string | null;
      home_adversity_disp: string | null;
      away_adversity_disp: string | null;
    };

    const rows = await prismaStats.$queryRawUnsafe<Surface[]>(
      `
      SELECT
        s.country, s.league, s.game_year, s.game_month, s.team,
        NULLIF(TRIM(s.games), '')::int AS games,
        NULLIF(TRIM(s.rank),  '')::int AS rank,
        NULLIF(TRIM(s.win),   '')::int AS win,
        NULLIF(TRIM(s.draw),  '')::int AS draw,
        NULLIF(TRIM(s.lose),  '')::int AS lose,
        NULLIF(TRIM(s.winning_points), '')::int AS winning_points,
        NULLIF(TRIM(s.consecutive_win_disp), '')         AS consecutive_win_disp,
        NULLIF(TRIM(s.consecutive_lose_disp), '')        AS consecutive_lose_disp,
        NULLIF(TRIM(s.unbeaten_streak_disp), '')         AS unbeaten_streak_disp,
        NULLIF(TRIM(s.consecutive_score_count_disp), '') AS consecutive_score_count_disp,
        NULLIF(TRIM(s.first_win_disp), '')               AS first_win_disp,
        NULLIF(TRIM(s.lose_streak_disp), '')             AS lose_streak_disp,
        NULLIF(TRIM(s.promote_disp), '')                 AS promote_disp,
        NULLIF(TRIM(s.descend_disp), '')                 AS descend_disp,
        NULLIF(TRIM(s.home_adversity_disp), '')          AS home_adversity_disp,
        NULLIF(TRIM(s.away_adversity_disp), '')          AS away_adversity_disp
      FROM public.surface_overview s
      WHERE s.country = $1
        AND s.league  = $2
        AND s.game_year  = $3::text
        AND s.game_month = $4::text
        AND s.team IN ($5, $6)
      `,
      country,
      league,
      game_year,
      game_month,
      m.home_team_name,
      m.away_team_name
    );

    return res.json({
      match: {
        seq: m.seq,
        future_time: m.future_time,
        round_no: m.round_no,
        game_team_category: m.game_team_category,
        home_team: m.home_team_name,
        away_team: m.away_team_name,
        game_year,
        game_month,
      },
      surfaces: rows,
    });
  } catch (e: any) {
    console.error("GET /api/schedule-overview failed:", { params: req.params, err: e?.message });
    return res.status(500).json({ message: "server error", detail: e?.message ?? String(e) });
  }
});

export default router;

function safeDecode(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
