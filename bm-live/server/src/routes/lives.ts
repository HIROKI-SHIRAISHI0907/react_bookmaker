// src/routes/lives.ts
import { Router } from "express";
import { prismaStats } from "../db";

const router = Router();

/**
 * GET /api/live-matches
 *  - ?country=...&league=... 指定で絞り込み。未指定なら全カテゴリ（当日JST）。
 *  - public.data (当日JST) から対戦ペアごとに最新 seq だけを抽出。
 *  - times に「終了」を含む行は除外（LIVEのみ）。
 *  - スコア "1.0" などは floor で整数化（小数点以下切り捨て）。
 */
router.get("/", async (req, res) => {
  const country = safeDecode(String(req.query.country ?? ""));
  const league = safeDecode(String(req.query.league ?? ""));
  const like = country && league ? `${country}: ${league}%` : `%`;

  try {
    type Row = {
      seq: string | null;
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
      goal_time: string | null;
    };

    const rows = await prismaStats.$transaction(
      async (tx) => {
        // 重い集計対策（このトランザクション内だけ適用）
        await tx.$executeRawUnsafe(`SET LOCAL max_parallel_workers_per_gather = 0`);
        await tx.$executeRawUnsafe(`SET LOCAL max_parallel_workers = 0`);
        await tx.$executeRawUnsafe(`SET LOCAL force_parallel_mode = off`);
        await tx.$executeRawUnsafe(`SET LOCAL jit = off`);
        await tx.$executeRawUnsafe(`SET LOCAL statement_timeout = '25s'`);

        const sql = `
WITH data_norm AS (
  SELECT
    d.seq::bigint AS seq_big,
    d.seq::text   AS seq,
    NULLIF(TRIM(d.data_category), '')           AS data_category,
    NULLIF(TRIM(d.times), '')                   AS times,
    NULLIF(TRIM(d.home_team_name), '')          AS home_team_name,
    NULLIF(TRIM(d.away_team_name), '')          AS away_team_name,

    /* 一旦「クリーン文字列」を作ってから変換する（構文安定 & 速度向上） */
    regexp_replace(COALESCE(TRIM(d.home_score), ''),      '[^0-9.-]', '', 'g') AS home_score_s,
    regexp_replace(COALESCE(TRIM(d.away_score), ''),      '[^0-9.-]', '', 'g') AS away_score_s,
    regexp_replace(COALESCE(TRIM(d.home_exp), ''),        '[^0-9.-]', '', 'g') AS home_exp_s,
    regexp_replace(COALESCE(TRIM(d.away_exp), ''),        '[^0-9.-]', '', 'g') AS away_exp_s,
    regexp_replace(COALESCE(TRIM(d.home_shoot_in), ''),   '[^0-9-]',  '', 'g') AS home_shoot_in_s,
    regexp_replace(COALESCE(TRIM(d.away_shoot_in), ''),   '[^0-9-]',  '', 'g') AS away_shoot_in_s,

    d.record_time,
    d.update_time,
    NULLIF(TRIM(d.goal_time), '')               AS goal_time,

    /* チーム名の正規化: 全角/NBSP→半角スペース、空白畳み、lower */
    lower(
      btrim(
        regexp_replace(
          translate(TRIM(d.home_team_name), CHR(12288) || CHR(160), '  '),
          '[[:space:]]+', ' ', 'g'
        )
      )
    ) AS home_key,
    lower(
      btrim(
        regexp_replace(
          translate(TRIM(d.away_team_name), CHR(12288) || CHR(160), '  '),
          '[[:space:]]+', ' ', 'g'
        )
      )
    ) AS away_key
  FROM public.data d
  WHERE d.home_team_name IS NOT NULL
    AND d.away_team_name IS NOT NULL
    AND d.data_category LIKE $1
    AND (d.record_time AT TIME ZONE 'Asia/Tokyo')::date = (now() AT TIME ZONE 'Asia/Tokyo')::date
),
/* ここで数値化（home_score_s 等を CASE で安全に変換） */
data_cast AS (
  SELECT
    dn.seq_big,
    dn.seq,
    dn.data_category,
    dn.times,
    dn.home_team_name,
    dn.away_team_name,

    CASE WHEN dn.home_score_s       = '' THEN NULL ELSE floor((dn.home_score_s)::float)::int END AS home_score,
    CASE WHEN dn.away_score_s       = '' THEN NULL ELSE floor((dn.away_score_s)::float)::int END AS away_score,
    CASE WHEN dn.home_exp_s         = '' THEN NULL ELSE (dn.home_exp_s)::float END               AS home_exp,
    CASE WHEN dn.away_exp_s         = '' THEN NULL ELSE (dn.away_exp_s)::float END               AS away_exp,
    CASE WHEN dn.home_shoot_in_s    = '' THEN NULL ELSE (dn.home_shoot_in_s)::int END            AS home_shoot_in,
    CASE WHEN dn.away_shoot_in_s    = '' THEN NULL ELSE (dn.away_shoot_in_s)::int END            AS away_shoot_in,

    dn.record_time,
    dn.update_time,
    dn.goal_time,
    dn.home_key,
    dn.away_key
  FROM data_norm dn
),
data_keyed AS (
  SELECT
    dc.*,
    CASE WHEN dc.home_key <= dc.away_key
         THEN dc.home_key || '|' || dc.away_key
         ELSE dc.away_key || '|' || dc.home_key
    END AS pair_key
  FROM data_cast dc
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
    ON la.pair_key = dk.pair_key
   AND la.seq_any  = dk.seq_big
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
  lr.seq_big DESC
`;
        return await tx.$queryRawUnsafe<Row[]>(sql, like);
      },
      { timeout: 30000, maxWait: 10000 }
    );

    const payload = (rows ?? []).map((r) => ({
      seq: r.seq != null ? Number.parseInt(r.seq, 10) : 0,
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

    res.json(payload);
  } catch (e: any) {
    console.error("GET /api/live-matches failed:", {
      query: req.query,
      err: e?.message,
      stack: e?.stack,
    });
    res.status(500).json({ message: "server error", detail: e?.message ?? String(e) });
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
