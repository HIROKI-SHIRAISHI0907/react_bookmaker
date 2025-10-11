// src/routes/histories.ts
import { Router } from "express";
import { prismaStats } from "../db";

export const historiesRouter = Router();

/**
 * 正規化ユーティリティ（全角/nbsp→半角, 余分スペース畳み込み, 小文字化）
 */
function norm(s: string | null | undefined) {
  return (s ?? "")
    .replace(/[\u3000\u00A0]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
function safeDecode(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/* =========================================================
 * 詳細: GET /api/history/:country/:league/:team/history/:seq
 *  - public.data の seq=指定、times に「終了」を含む最新行を1件返す
 *  - 返却形: HistoryDetail (frontの型に合わせたキー)
 * ========================================================= */
historiesRouter.get("/:country/:league/:team/history/:seq", async (req, res) => {
  const country = safeDecode(req.params.country);
  const league = safeDecode(req.params.league);
  const teamSlug = req.params.team;
  const seqParam = req.params.seq;

  try {
    // スラッグ→日本語名（勝敗判定などで使う可能性があるため取得）
    const nameRows = await prismaStats.$queryRaw<{ team: string }[]>`
      SELECT team
      FROM country_league_master
      WHERE country = ${country}
        AND league  = ${league}
        AND link LIKE ${`/team/${teamSlug}/%`}
      LIMIT 1
    `;
    const teamJa = nameRows[0]?.team ?? teamSlug;

    type Row = {
      seq: string;
      data_category: string | null;
      round_no: number | null;
      record_time_jst: string; // ISO-like
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
    };

    const rows = await prismaStats.$queryRawUnsafe<Row[]>(
      `
      SELECT
        d.seq::text AS seq,
        d.data_category,
        CASE
          WHEN regexp_match(d.data_category, '(ラウンド|Round)\\s*([0-9]+)') IS NULL THEN NULL
          ELSE CAST( (regexp_match(d.data_category, '(ラウンド|Round)\\s*([0-9]+)'))[2] AS INT )
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
        NULLIF(TRIM(d.judge), '') AS link_maybe
      FROM public.data d
      WHERE d.seq = $1::bigint
        AND d.times ILIKE '%終了%'
        AND d.data_category LIKE $2
      LIMIT 1
      `,
      seqParam,
      `${country}: ${league}%`
    );

    if (!rows.length) {
      return res.status(404).json({ message: "not found" });
    }

    const r = rows[0];

    const hs = r.home_score ?? 0;
    const as = r.away_score ?? 0;
    const winner: "HOME" | "AWAY" | "DRAW" = hs === as ? "DRAW" : hs > as ? "HOME" : "AWAY";

    // パーセンテージを数値に（"57%" → 57）・渡ってこなければ null
    const pct = (s: string | null) => {
      if (!s) return null;
      const m = s.match(/([0-9]+(?:\.[0-9]+)?)\s*%/);
      return m ? Number(m[1]) : null;
    };

    const detail = {
      competition: r.data_category ?? null,
      round_no: r.round_no,
      recorded_at: r.record_time_jst,
      winner,
      link: r.link_maybe ?? null,
      home: {
        name: r.home_team_name,
        score: r.home_score ?? 0,
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
        score: r.away_score ?? 0,
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
    console.error("GET /api/history detail failed:", { params: req.params, err: e?.message, stack: e?.stack });
    return res.status(500).json({ message: "server error", detail: e?.message ?? String(e) });
  }
});

/* =========================================================
 * 一覧: GET /api/history/:country/:league/:team
 *  - times に「終了」を含む行から、(JST日付×home×away)ごとに最大seqを採用
 * ========================================================= */
historiesRouter.get("/:country/:league/:team", async (req, res) => {
  const country = safeDecode(req.params.country);
  const league = safeDecode(req.params.league);
  const teamSlug = req.params.team;

  try {
    // スラッグ → 日本語名
    const nameRows = await prismaStats.$queryRaw<{ team: string }[]>`
      SELECT team
      FROM country_league_master
      WHERE country = ${country}
        AND league  = ${league}
        AND link LIKE ${`/team/${teamSlug}/%`}
      LIMIT 1
    `;
    const teamJa = nameRows[0]?.team ?? teamSlug;

    type Row = {
      seq: string;
      match_time: string; // record_time JST
      data_category: string | null;
      round_no: number | null;
      home_team_name: string;
      away_team_name: string;
      home_score: number | null;
      away_score: number | null;
      link_maybe: string | null;
    };

    const rows = await prismaStats.$queryRawUnsafe<Row[]>(
      `
      WITH finished AS (
        SELECT
          d.seq::bigint AS seq_big,
          d.data_category,
          d.home_team_name,
          d.away_team_name,
          NULLIF(TRIM(d.times), '') AS times,
          NULLIF(TRIM(d.home_score), '')::int AS home_score,
          NULLIF(TRIM(d.away_score), '')::int AS away_score,
          (d.record_time AT TIME ZONE 'Asia/Tokyo')::timestamp AS record_time_jst_ts,
          to_char((d.record_time AT TIME ZONE 'Asia/Tokyo')::date, 'YYYY-MM-DD') AS jst_date,
          NULLIF(TRIM(d.judge), '') AS link_maybe
        FROM public.data d
        WHERE d.home_team_name IS NOT NULL
          AND d.away_team_name IS NOT NULL
          AND d.times ILIKE '%終了%'
          AND d.data_category LIKE $1
          AND (d.home_team_name = $2 OR d.away_team_name = $2)
      ),
      ranked AS (
        SELECT
          seq_big,
          data_category,
          home_team_name,
          away_team_name,
          times,
          home_score,
          away_score,
          record_time_jst_ts,
          jst_date,
          link_maybe,
          ROW_NUMBER() OVER (
            PARTITION BY jst_date, home_team_name, away_team_name
            ORDER BY seq_big DESC
          ) AS rn
        FROM finished
      )
      SELECT
        r.seq_big::text AS seq,
        to_char(r.record_time_jst_ts, 'YYYY-MM-DD"T"HH24:MI:SS') AS match_time,
        r.data_category,
        CASE
          WHEN regexp_match(r.data_category, '(ラウンド|Round)\\s*([0-9]+)') IS NULL THEN NULL
          ELSE CAST( (regexp_match(r.data_category, '(ラウンド|Round)\\s*([0-9]+)'))[2] AS INT )
        END AS round_no,
        r.home_team_name,
        r.away_team_name,
        r.home_score,
        r.away_score,
        r.link_maybe
      FROM ranked r
      WHERE r.rn = 1
      ORDER BY r.record_time_jst_ts DESC
      `,
      `${country}: ${league}%`,
      teamJa
    );

    const matches = rows.map((r) => ({
      seq: Number.parseInt(r.seq, 10),
      match_time: r.match_time,
      game_team_category: r.data_category ?? "",
      home_team: r.home_team_name,
      away_team: r.away_team_name,
      home_score: r.home_score ?? 0,
      away_score: r.away_score ?? 0,
      round_no: r.round_no,
      link: r.link_maybe ?? null,
    }));

    return res.json({ matches });
  } catch (e: any) {
    console.error("GET /api/history failed:", { params: req.params, err: e?.message, stack: e?.stack });
    return res.status(500).json({ message: "server error", detail: e?.message ?? String(e) });
  }
});

export default historiesRouter;
