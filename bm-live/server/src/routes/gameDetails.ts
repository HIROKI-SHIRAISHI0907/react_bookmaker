import { Router } from "express";
import { prismaStats } from "../db";

export const gameDetailRouter = Router();

gameDetailRouter.get("/:country/:league/:team/:seq", async (req, res) => {
  const country = safeDecode(req.params.country);
  const league = safeDecode(req.params.league);
  const seqParam = req.params.seq;

  try {
    type Row = {
      data_category: string | null;
      round_no: number | null;
      record_time_jst: string;
      home_team_name: string;
      away_team_name: string;
      home_score: number | null;
      away_score: number | null;
      home_exp: number | null;
      away_exp: number | null;
      home_donation: string | null;
      away_donation: string | null;
      home_shoot_all: number | null;
      away_shoot_all: number | null;
      home_shoot_in: number | null;
      away_shoot_in: number | null;
      home_shoot_out: number | null;
      away_shoot_out: number | null;
      home_block_shoot: number | null;
      away_block_shoot: number | null;
      home_corner: number | null;
      away_corner: number | null;
      home_big_chance: number | null;
      away_big_chance: number | null;
      home_keeper_save: number | null;
      away_keeper_save: number | null;
      home_yellow_card: number | null;
      away_yellow_card: number | null;
      home_red_card: number | null;
      away_red_card: number | null;
      home_pass_count: string | null;
      away_pass_count: string | null;
      home_long_pass_count: string | null;
      away_long_pass_count: string | null;
      home_manager: string | null;
      away_manager: string | null;
      home_formation: string | null;
      away_formation: string | null;
      studium: string | null;
      capacity: string | null;
      audience: string | null;
      link_maybe: string | null;
      times: string | null;
    };

    const rows = await prismaStats.$queryRawUnsafe<Row[]>(
      `
      SELECT
        d.data_category,
        CASE
          WHEN regexp_match(d.data_category, '(ラウンド|Round)\\s*([0-9]+)') IS NULL THEN NULL
          ELSE CAST((regexp_match(d.data_category, '(ラウンド|Round)\\s*([0-9]+)'))[2] AS INT)
        END AS round_no,
        to_char((d.record_time AT TIME ZONE 'Asia/Tokyo'), 'YYYY-MM-DD"T"HH24:MI:SS') AS record_time_jst,
        d.home_team_name, d.away_team_name,
        NULLIF(TRIM(d.home_score), '')::int AS home_score,
        NULLIF(TRIM(d.away_score), '')::int AS away_score,
        NULLIF(TRIM(d.home_exp), '')::numeric AS home_exp,
        NULLIF(TRIM(d.away_exp), '')::numeric AS away_exp,
        NULLIF(TRIM(d.home_donation), '') AS home_donation,
        NULLIF(TRIM(d.away_donation), '') AS away_donation,
        NULLIF(TRIM(d.home_shoot_all), '')::int AS home_shoot_all,
        NULLIF(TRIM(d.away_shoot_all), '')::int AS away_shoot_all,
        NULLIF(TRIM(d.home_shoot_in), '')::int AS home_shoot_in,
        NULLIF(TRIM(d.away_shoot_in), '')::int AS away_shoot_in,
        NULLIF(TRIM(d.home_shoot_out), '')::int AS home_shoot_out,
        NULLIF(TRIM(d.away_shoot_out), '')::int AS away_shoot_out,
        NULLIF(TRIM(d.home_block_shoot), '')::int AS home_block_shoot,
        NULLIF(TRIM(d.away_block_shoot), '')::int AS away_block_shoot,
        NULLIF(TRIM(d.home_corner), '')::int AS home_corner,
        NULLIF(TRIM(d.away_corner), '')::int AS away_corner,
        NULLIF(TRIM(d.home_big_chance), '')::int AS home_big_chance,
        NULLIF(TRIM(d.away_big_chance), '')::int AS away_big_chance,
        NULLIF(TRIM(d.home_keeper_save), '')::int AS home_keeper_save,
        NULLIF(TRIM(d.away_keeper_save), '')::int AS away_keeper_save,
        NULLIF(TRIM(d.home_yellow_card), '')::int AS home_yellow_card,
        NULLIF(TRIM(d.away_yellow_card), '')::int AS away_yellow_card,
        NULLIF(TRIM(d.home_red_card), '')::int AS home_red_card,
        NULLIF(TRIM(d.away_red_card), '')::int AS away_red_card,
        NULLIF(TRIM(d.home_pass_count), '') AS home_pass_count,
        NULLIF(TRIM(d.away_pass_count), '') AS away_pass_count,
        NULLIF(TRIM(d.home_long_pass_count), '') AS home_long_pass_count,
        NULLIF(TRIM(d.away_long_pass_count), '') AS away_long_pass_count,
        NULLIF(TRIM(d.home_manager), '') AS home_manager,
        NULLIF(TRIM(d.away_manager), '') AS away_manager,
        NULLIF(TRIM(d.home_formation), '') AS home_formation,
        NULLIF(TRIM(d.away_formation), '') AS away_formation,
        NULLIF(TRIM(d.studium), '') AS studium,
        NULLIF(TRIM(d.capacity), '') AS capacity,
        NULLIF(TRIM(d.audience), '') AS audience,
        NULLIF(TRIM(d.judge), '') AS link_maybe,
        NULLIF(TRIM(d.times), '') AS times
      FROM public.data d
      WHERE d.seq = $1::bigint
        AND d.data_category LIKE $2
      LIMIT 1
      `,
      seqParam,
      `${country}: ${league}%`
    );

    if (!rows.length) return res.status(404).json({ message: "not found" });

    const r = rows[0];
    const hs = r.home_score ?? 0;
    const as = r.away_score ?? 0;

    // 終了かどうかを times で判定
    const finished = r.times ? /終了/.test(r.times) : false;
    const winner: "HOME" | "AWAY" | "DRAW" | "LIVE" = finished ? (hs === as ? "DRAW" : hs > as ? "HOME" : "AWAY") : "LIVE";

    const pct = (s: string | null) => {
      if (!s) return null;
      const m = s.match(/([0-9]+(?:\.[0-9]+)?)\s*%/);
      return m ? Number(m[1]) : null;
    };

    const detail = {
      competition: r.data_category ?? "",
      round_no: r.round_no,
      recorded_at: r.record_time_jst,
      winner, // LIVE | HOME | AWAY | DRAW
      link: r.link_maybe ?? null,
      home: {
        name: r.home_team_name,
        score: hs,
        manager: r.home_manager,
        formation: r.home_formation,
        xg: (r.home_exp as any) == null ? null : Number(r.home_exp),
        possession: pct(r.home_donation),
        shots: r.home_shoot_all,
        shots_on: r.home_shoot_in,
        shots_off: r.home_shoot_out,
        blocks: r.home_block_shoot,
        corners: r.home_corner,
        big_chances: r.home_big_chance,
        saves: r.home_keeper_save,
        yc: r.home_yellow_card,
        rc: r.home_red_card,
        passes: r.home_pass_count,
        long_passes: r.home_long_pass_count,
      },
      away: {
        name: r.away_team_name,
        score: as,
        manager: r.away_manager,
        formation: r.away_formation,
        xg: (r.away_exp as any) == null ? null : Number(r.away_exp),
        possession: pct(r.away_donation),
        shots: r.away_shoot_all,
        shots_on: r.away_shoot_in,
        shots_off: r.away_shoot_out,
        blocks: r.away_block_shoot,
        corners: r.away_corner,
        big_chances: r.away_big_chance,
        saves: r.away_keeper_save,
        yc: r.away_yellow_card,
        rc: r.away_red_card,
        passes: r.away_pass_count,
        long_passes: r.away_long_pass_count,
      },
      venue: {
        stadium: r.studium,
        audience: r.audience,
        capacity: r.capacity,
      },
    };

    return res.json({ detail });
  } catch (e: any) {
    console.error("GET /api/games/detail failed:", { params: req.params, err: e?.message, stack: e?.stack });
    return res.status(500).json({ message: "server error", detail: e?.message ?? String(e) });
  }
});

export default gameDetailRouter;

function safeDecode(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
