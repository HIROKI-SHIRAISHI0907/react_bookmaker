// src/routes/game.ts
import { Router } from "express";
import { prismaStats } from "../db";

export const gameRouter = Router();

/**
 * GET /api/games/:country/:league/:team
 *
 * 仕様（重要点だけ抜粋）:
 * - future_master.start_flg = '0'（開催中/終了の対象試合）
 * - スラッグ→日本語名を解決（country_league_master）
 * - チーム名は正規化して home/away 順不同ペアキーで public.data と突合
 * - public.data は「JST 当日」だけを対象にし、ペアごと最大 seq の 1 行を “最新” とみなす
 * - その最新行の times に「終了」を含めば FINISHED、含まなければ LIVE
 * - 最新行の seq を latest_seq、times を latest_times として返却（画面遷移用に latest_seq を使用）
 * - レスポンスは { live: Row[], finished: Row[] }
 */
gameRouter.get("/:country/:league/:team", async (req, res) => {
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
      seq: string; // future_master.seq
      game_team_category: string;
      future_time: string;
      home_team_name: string;
      away_team_name: string;
      game_link: string | null;
      round_no: number | null;
      latest_seq: string | null; // public.data の最大 seq（当日・ペア別）
      latest_times: string | null; // その行の times
      status: "LIVE" | "FINISHED";
    };

    // 置き換え対象: prismaStats.$queryRawUnsafe<Row[]>(` ... `, `${country}: ${league}%`, teamJa)
    const rows = await prismaStats.$queryRawUnsafe<Row[]>(
      `
  /* ===== LIVE / FINISHED を当日スナップショットから取得 ===== */

  WITH
  /* チーム名（日本語）を SQL 内で正規化してキー化 */
  team_norm AS (
    SELECT lower(
             btrim(
               regexp_replace(
                 translate(TRIM($2), CHR(12288) || CHR(160), '  '),  /* 全角/nbsp→半角2スペース */
                 '\\s+', ' ', 'g'                                    /* 連続空白を1つへ */
               )
             )
           ) AS key
  ),

  /* 試合（future_master）側の候補。ここでは大会カテゴリでだけ絞り、チームは後段のキー突合で絞る */
  base AS (
    SELECT
      f.seq::text AS seq,
      f.game_team_category,
      f.future_time,
      f.home_team_name,
      f.away_team_name,
      NULLIF(TRIM(f.game_link), '') AS game_link,
      CASE
        WHEN regexp_match(f.game_team_category, '(ラウンド|Round)\\s*([0-9]+)') IS NULL THEN NULL
        ELSE ((regexp_match(f.game_team_category, '(ラウンド|Round)\\s*([0-9]+)'))[2])::int
      END AS round_no,
      /* 正規化キー（home/away それぞれ） */
      lower(
        btrim(
          regexp_replace(
            translate(TRIM(f.home_team_name), CHR(12288) || CHR(160), '  '),
            '\\s+',' ','g'
          )
        )
      ) AS home_key,
      lower(
        btrim(
          regexp_replace(
            translate(TRIM(f.away_team_name), CHR(12288) || CHR(160), '  '),
            '\\s+',' ','g'
          )
        )
      ) AS away_key
    FROM future_master f
    WHERE f.game_team_category LIKE $1   /* 例: '日本: J3 リーグ%' */
  ),

  /* 順不同ペアキーを付与 */
  base_keyed AS (
    SELECT
      b.*,
      CASE WHEN b.home_key <= b.away_key
           THEN b.home_key || '|' || b.away_key
           ELSE b.away_key || '|' || b.home_key
      END AS pair_key
    FROM base b
  ),

  /* 指定チームに該当するカードだけに絞る（正規化キーで突合） */
  base_for_team AS (
    SELECT bk.*
    FROM base_keyed bk
    CROSS JOIN team_norm t
    WHERE bk.home_key = t.key OR bk.away_key = t.key
  ),

  /* data 側：JST 当日分のみ・同一大会のみ */
  data_norm AS (
    SELECT
      d.seq::bigint AS seq_big,
      lower(
        btrim(
          regexp_replace(
            translate(TRIM(d.home_team_name), CHR(12288) || CHR(160), '  '),
            '\\s+',' ','g'
          )
        )
      ) AS home_key,
      lower(
        btrim(
          regexp_replace(
            translate(TRIM(d.away_team_name), CHR(12288) || CHR(160), '  '),
            '\\s+',' ','g'
          )
        )
      ) AS away_key,
      NULLIF(TRIM(d.times), '') AS times
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

  /* ペアごとに最大 seq を最新スナップショットとする */
  latest AS (
    SELECT pair_key, MAX(seq_big) AS max_seq
    FROM data_keyed
    GROUP BY pair_key
  ),

  latest_rows AS (
    SELECT dk.pair_key, dk.seq_big, dk.times
    FROM data_keyed dk
    JOIN latest l ON l.pair_key = dk.pair_key AND l.max_seq = dk.seq_big
  )

  SELECT
    bft.seq,
    bft.game_team_category,
    bft.future_time,
    bft.home_team_name,
    bft.away_team_name,
    bft.game_link,
    bft.round_no,
    lr.seq_big::text AS latest_seq,       /* ← data 側の最大 seq（詳細遷移に使用） */
    lr.times         AS latest_times,
    CASE
      WHEN lr.times ILIKE '%終了%' THEN 'FINISHED'
      ELSE 'LIVE'
    END AS status
  FROM base_for_team bft
  JOIN latest_rows lr ON lr.pair_key = bft.pair_key
  ORDER BY bft.round_no NULLS LAST, bft.future_time ASC;
  `,
      `${country}: ${league}%`, // $1
      teamJa // $2
    );

    // 行を LIVE / FINISHED に振り分け
    const live = [] as any[];
    const finished = [] as any[];

    for (const r of rows) {
      const obj = {
        seq: Number.parseInt(r.seq, 10),
        game_team_category: r.game_team_category,
        future_time: r.future_time,
        home_team: r.home_team_name,
        away_team: r.away_team_name,
        link: r.game_link,
        round_no: r.round_no,
        latest_times: r.latest_times ?? null,
        latest_seq: r.latest_seq ? Number.parseInt(r.latest_seq, 10) : null, // ← 詳細遷移に使用
        status: r.status,
      };
      if (r.status === "FINISHED") finished.push(obj);
      else live.push(obj);
    }

    return res.json({ live, finished });
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

function safeDecode(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
