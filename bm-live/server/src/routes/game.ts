// src/routes/game.ts
import { Router } from "express";
import { prismaStats } from "../db";

export const gameRouter = Router();

/**
 * GET /api/games/:country/:league/:team
 *
 * - future_master.start_flg = '0'（= 開催中 or 試合終了 の試合）
 * - スラッグ→日本語名に解決
 * - チーム名を正規化し、public.data と home/away 順不同のペアキーで突合
 * - public.data は「JST の当日分」だけを対象にし、ペアごとに最大 seq の1行を最新とみなす
 * - 最新 times に「終了」を含めば FINISHED、そうでなければ LIVE（latest_times にその時刻を返す）
 * - round_no は表示用に抽出（フィルタには使わない）
 */
gameRouter.get("/:country/:league/:team", async (req, res) => {
  const country = safeDecode(req.params.country);
  const league = safeDecode(req.params.league);
  const teamSlug = req.params.team;

  try {
    // 英語スラッグ → 日本語名
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
      game_team_category: string;
      future_time: string;
      home_team_name: string;
      away_team_name: string;
      game_link: string | null;
      round_no: number | null;
      latest_times: string | null;
      status: "LIVE" | "FINISHED";
    };

    const rows = await prismaStats.$queryRawUnsafe<Row[]>(
      `
      WITH base AS (
        SELECT
          f.seq::text AS seq,
          f.game_team_category,
          f.future_time,
          f.home_team_name,
          f.away_team_name,
          NULLIF(TRIM(f.game_link), '') AS game_link,
          /* 表示用のラウンド番号（フィルタには未使用） */
          CASE
            WHEN regexp_match(f.game_team_category, '(ラウンド|Round)\\s*([0-9]+)') IS NULL THEN NULL
            ELSE CAST((regexp_match(f.game_team_category, '(ラウンド|Round)\\s*([0-9]+)'))[2] AS INT)
          END AS round_no,
          /* 正規化キー */
          lower(
            btrim(
              regexp_replace(translate(TRIM(f.home_team_name), E'\\u3000\\u00A0', '  '), '\\s+', ' ', 'g')
            )
          ) AS home_key,
          lower(
            btrim(
              regexp_replace(translate(TRIM(f.away_team_name), E'\\u3000\\u00A0', '  '), '\\s+', ' ', 'g')
            )
          ) AS away_key
        FROM future_master f
        WHERE f.start_flg = '0'
          AND f.game_team_category LIKE $1
          AND (f.home_team_name = $2 OR f.away_team_name = $2)
      ),
      base_w_key AS (
        SELECT
          b.*,
          CASE
            WHEN b.home_key <= b.away_key
              THEN b.home_key || '|' || b.away_key
            ELSE b.away_key || '|' || b.home_key
          END AS pair_key
        FROM base b
      ),
      /* 当日の data のみ（JST） */
      data_norm AS (
        SELECT
          d.seq::bigint AS seq_big,
          lower(
            btrim(
              regexp_replace(translate(TRIM(d.home_team_name), E'\\u3000\\u00A0', '  '), '\\s+', ' ', 'g')
            )
          ) AS home_key,
          lower(
            btrim(
              regexp_replace(translate(TRIM(d.away_team_name), E'\\u3000\\u00A0', '  '), '\\s+', ' ', 'g')
            )
          ) AS away_key,
          NULLIF(TRIM(d.times), '') AS times
        FROM public.data d
        WHERE d.home_team_name IS NOT NULL
          AND d.away_team_name IS NOT NULL
          AND (d.record_time AT TIME ZONE 'Asia/Tokyo')::date = (now() AT TIME ZONE 'Asia/Tokyo')::date
      ),
      data_w_key AS (
        SELECT
          dn.*,
          CASE
            WHEN dn.home_key <= dn.away_key
              THEN dn.home_key || '|' || dn.away_key
            ELSE dn.away_key || '|' || dn.home_key
          END AS pair_key
        FROM data_norm dn
      ),
      latest_data AS (
        SELECT pair_key, MAX(seq_big) AS max_seq
        FROM data_w_key
        GROUP BY pair_key
      ),
      latest_rows AS (
        SELECT dwk.pair_key, dwk.times
        FROM data_w_key dwk
        JOIN latest_data ld
          ON ld.pair_key = dwk.pair_key
         AND ld.max_seq  = dwk.seq_big
      )
      SELECT
        bwk.seq,
        bwk.game_team_category,
        bwk.future_time,
        bwk.home_team_name,
        bwk.away_team_name,
        bwk.game_link,
        bwk.round_no,
        lr.times AS latest_times,
        CASE
          WHEN lr.times ILIKE '%終了%' THEN 'FINISHED'
          ELSE 'LIVE'
        END AS status
      FROM base_w_key bwk
      /* data が引っかかった試合だけ返す */
      JOIN latest_rows lr
        ON lr.pair_key = bwk.pair_key
      ORDER BY bwk.future_time ASC;
      `,
      `${country}: ${league}%`, // $1: カテゴリの先頭一致
      teamJa // $2: チーム名（両辺で使用）
    );

    const games = rows.map((r) => ({
      seq: Number.parseInt(r.seq, 10),
      game_team_category: r.game_team_category,
      future_time: r.future_time,
      home_team: r.home_team_name,
      away_team: r.away_team_name,
      link: r.game_link,
      round_no: r.round_no,
      latest_times: r.latest_times ?? null,
      status: r.latest_times && /終了/.test(r.latest_times) ? "FINISHED" : "LIVE",
    }));

    return res.json({ games });
  } catch (e: any) {
    console.error("GET /api/games failed:", {
      params: req.params,
      err: e?.message,
      stack: e?.stack,
    });
    return res.status(500).json({ message: "server error", detail: e?.message ?? String(e) });
  }
});

export default gameRouter;

// helpers
function safeDecode(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
