// src/routes/lives.ts
import { Router } from "express";
import { prismaStats } from "../db";

const router = Router();

/**
 * GET /api/live-matches?country=JAPAN&league=J1
 *
 * 仕様:
 * - public.data（JST 当日）から country: league に一致するカテゴリのみ
 * - home/away を正規化してペアキー化し、ペアごと最大 seq を“最新”として採用
 * - times に「終了」を含まない (= LIVE) のみ返す
 * - フロントの型（src/api/live.ts の LiveMatch）に合わせて整形
 */
router.get("/", async (req, res) => {
  const country = safeDecode(String(req.query.country ?? ""));
  const league = safeDecode(String(req.query.league ?? ""));
  // country / league が未指定なら全件
  const like = country && league ? `${country}: ${league}%` : `%`;

  try {
    type Row = {
      seq: string;
      data_category: string | null;
      times: string | null;
      home_team_name: string | null;
      away_team_name: string | null;
      home_score: number | null;
      away_score: number | null;
      home_exp: number | null;
      away_exp: number | null;
      home_shoot_in: number | null;
      away_shoot_in: number | null;
      record_time: string | null;
      update_time: string | null;
      goal_time: string | null; // URLが入る可能性があるため
    };

    const rows = await prismaStats.$queryRawUnsafe<Row[]>(
      `
WITH data_norm AS (
  SELECT
    d.seq::bigint AS seq_big,
    d.seq::text   AS seq,
    NULLIF(TRIM(d.data_category), '')           AS data_category,
    NULLIF(TRIM(d.times), '')                   AS times,
    NULLIF(TRIM(d.home_team_name), '')          AS home_team_name,
    NULLIF(TRIM(d.away_team_name), '')          AS away_team_name,
    NULLIF(TRIM(d.home_score), '')::int         AS home_score,
    NULLIF(TRIM(d.away_score), '')::int         AS away_score,
    NULLIF(TRIM(d.home_exp), '')::float         AS home_exp,
    NULLIF(TRIM(d.away_exp), '')::float         AS away_exp,
    NULLIF(TRIM(d.home_shoot_in), '')::int      AS home_shoot_in,
    NULLIF(TRIM(d.away_shoot_in), '')::int      AS away_shoot_in,
    d.record_time,
    d.update_time,
    NULLIF(TRIM(d.goal_time), '')               AS goal_time,
    lower(btrim(regexp_replace(translate(TRIM(d.home_team_name), CHR(12288) || CHR(160), '  '), '\\s+', ' ', 'g'))) AS home_key,
    lower(btrim(regexp_replace(translate(TRIM(d.away_team_name), CHR(12288) || CHR(160), '  '), '\\s+', ' ', 'g'))) AS away_key
  FROM public.data d
  WHERE d.home_team_name IS NOT NULL
    AND d.away_team_name IS NOT NULL
    AND d.data_category LIKE $1
    AND (d.record_time AT TIME ZONE 'Asia/Tokyo')::date = (now() AT TIME ZONE 'Asia/Tokyo')::date
),
data_keyed AS (
  SELECT
    dn.*,
    CASE WHEN dn.home_key <= dn.away_key
         THEN dn.home_key || '|' || dn.away_key
         ELSE dn.away_key || '|' || dn.home_key
    END AS pair_key
  FROM data_norm dn
),
latest_any AS (
  SELECT pair_key, MAX(seq_big) AS seq_any
  FROM data_keyed
  GROUP BY pair_key
),
latest_rows AS (
  SELECT dk.*
  FROM data_keyed dk
  JOIN latest_any la
    ON la.pair_key = dk.pair_key AND la.seq_any = dk.seq_big
)
SELECT
  lr.seq,
  lr.data_category,
  lr.times,
  lr.home_team_name,
  lr.away_team_name,
  lr.home_score,
  lr.away_score,
  lr.home_exp,
  lr.away_exp,
  lr.home_shoot_in,
  lr.away_shoot_in,
  lr.record_time,
  lr.update_time,
  lr.goal_time
FROM latest_rows lr
WHERE lr.times IS NOT NULL
  AND lr.times NOT ILIKE '%終了%'
ORDER BY
  COALESCE(lr.data_category, '') ASC,
  lr.seq_big DESC;
      `,
      like
    );

    const payload = (rows ?? []).map((r) => ({
      seq: Number.parseInt(r.seq!, 10),
      data_category: r.data_category ?? "",
      times: r.times ?? "",
      home_team_name: r.home_team_name ?? "",
      away_team_name: r.away_team_name ?? "",
      home_score: r.home_score ?? null,
      away_score: r.away_score ?? null,
      home_exp: r.home_exp ?? null,
      away_exp: r.away_exp ?? null,
      home_shoot_in: r.home_shoot_in ?? null,
      away_shoot_in: r.away_shoot_in ?? null,
      record_time: r.record_time ?? null,
      update_time: r.update_time ?? null,
      goal_time: r.goal_time ?? null,
    }));

    return res.json(payload);
  } catch (e: any) {
    console.error("GET /api/live-matches failed:", {
      query: req.query,
      err: e?.message,
      stack: e?.stack,
    });
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
