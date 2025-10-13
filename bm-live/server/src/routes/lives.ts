// src/routes/lives.ts
import { Router } from "express";
import { prismaStats } from "../db";

const router = Router();

/**
 * GET /api/live-matches
 *   ?country=国名&league=リーグ名 で絞り込み。未指定なら全カテゴリ。
 * 仕様:
 *   - public.data（JST 当日）から pair_key（home/away 正規化）ごとの最新 seq を採用
 *   - times に「終了」を含む行は除外（LIVE のみ）
 *   - スコアは小数でも floor で切り捨て int 化
 *   - country_league_master を正規化キーで JOIN し、/team/<slug>/ の <slug> を返す
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
      home_slug: string | null;
      away_slug: string | null;
    };

    const sql = `
WITH data_norm AS (
  SELECT
    d.seq::bigint AS seq_big,
    d.seq::text   AS seq,
    NULLIF(TRIM(d.data_category), '')           AS data_category,
    NULLIF(TRIM(d.times), '')                   AS times,
    NULLIF(TRIM(d.home_team_name), '')          AS home_team_name,
    NULLIF(TRIM(d.away_team_name), '')          AS away_team_name,

    /* スコア: 非数字と '.' '-' を除去 → float → floor → int */
    CASE
      WHEN NULLIF(regexp_replace(TRIM(d.home_score), '[-0-9.]', '', 'g'), '') IS NULL
      THEN NULL
      ELSE floor(NULLIF(regexp_replace(TRIM(d.home_score), '[^0-9.-]', '', 'g'), '')::float)::int
    END AS home_score,
    CASE
      WHEN NULLIF(regexp_replace(TRIM(d.away_score), '[-0-9.]', '', 'g'), '') IS NULL
      THEN NULL
      ELSE floor(NULLIF(regexp_replace(TRIM(d.away_score), '[^0-9.-]', '', 'g'), '')::float)::int
    END AS away_score,

    /* xG: float 正規化（数字と '.' '-' のみ残す） */
    NULLIF(regexp_replace(TRIM(d.home_exp),      '[^0-9.-]', '', 'g'), '')::float AS home_exp,
    NULLIF(regexp_replace(TRIM(d.away_exp),      '[^0-9.-]', '', 'g'), '')::float AS away_exp,

    /* 枠内シュート: int 正規化（数字と '-' のみ残す） */
    NULLIF(regexp_replace(TRIM(d.home_shoot_in), '[^0-9-]',  '', 'g'), '')::int   AS home_shoot_in,
    NULLIF(regexp_replace(TRIM(d.away_shoot_in), '[^0-9-]',  '', 'g'), '')::int   AS away_shoot_in,

    d.record_time,
    d.update_time,
    NULLIF(TRIM(d.goal_time), '')               AS goal_time,

    /* data_category → country / league 抜き出し（例: "日本: J1 リーグ - ラウンド 12"） */
    btrim(split_part(COALESCE(NULLIF(TRIM(d.data_category), ''), ''), ':', 1)) AS dc_country,
    btrim(split_part(split_part(COALESCE(NULLIF(TRIM(d.data_category), ''), ''), ':', 2), '-', 1)) AS dc_league,

    /* チーム名の正規化キー（全角/nbsp→半角、空白畳み、lower） */
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
    ON la.pair_key = dk.pair_key
   AND la.seq_any  = dk.seq_big
),

/* マスタ側: 同じ正規化キーを用意し、/team/<slug>/ の <slug> を抽出 */
clm_norm AS (
  SELECT
    m.country,
    m.league,
    m.team,
    m.link,
    NULLIF(substring(m.link from '/team/([^/]+)/'), '') AS slug,
    lower(
      btrim(
        regexp_replace(
          translate(TRIM(m.team), CHR(12288) || CHR(160), '  '),
          '[[:space:]]+', ' ', 'g'
        )
      )
    ) AS team_key
  FROM public.country_league_master m
)

/* 最新行 + スラグ付与 */
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
  lr.goal_time,
  ch.slug AS home_slug,
  ca.slug AS away_slug
FROM latest_rows lr
LEFT JOIN clm_norm ch
  ON ch.country = lr.dc_country
 AND ch.league  = lr.dc_league
 AND ch.team_key = lr.home_key
LEFT JOIN clm_norm ca
  ON ca.country = lr.dc_country
 AND ca.league  = lr.dc_league
 AND ca.team_key = lr.away_key
WHERE lr.times IS NOT NULL
  AND lr.times NOT ILIKE '%終了%'
ORDER BY
  COALESCE(lr.data_category, '') ASC,
  lr.seq DESC
`;

    const rows = await prismaStats.$queryRawUnsafe<Row[]>(sql, like);

    const payload = (rows ?? []).map((r) => ({
      seq: r.seq ? Number.parseInt(r.seq, 10) : 0,
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
      record_time: r.record_time ?? r.update_time ?? null,
      update_time: r.update_time ?? null,
      goal_time: r.goal_time ?? null,
      home_slug: r.home_slug ?? null,
      away_slug: r.away_slug ?? null,
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
