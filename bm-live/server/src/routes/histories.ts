// src/routes/histories.ts
import { Router } from "express";
import { prismaStats } from "../db";

export const historiesRouter = Router();

/**
 * GET /api/history/:country/:league/:team
 *
 * 目的: 過去の対戦履歴（当該チームの試合で "終了" が確定した最終スナップショット）を返す
 *
 * 仕様:
 * - チームの英語スラッグ → 日本語名に解決（country_league_master）
 * - public.data をデータ元とし、"times" に「終了」を含むレコードを対象
 * - 同一試合の中間スナップショットが複数あるため、
 *   「JST日付 × home_team_name × away_team_name」ごとに seq の最大行を最終行として採用
 * - data_category からラウンド番号を抽出（表示用）
 * - 結果判定（WIN/LOSE/DRAW）は引数チーム視点で判定
 * - 国/リーグは data_category の先頭一致で絞り込み
 */
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
      seq: string; // bigint を文字列で受ける
      data_category: string;
      jst_date: string; // YYYY-MM-DD
      record_time_jst: string; // 最終スナップのJSTタイムスタンプ
      home_team_name: string;
      away_team_name: string;
      home_score: number | null;
      away_score: number | null;
      round_no: number | null;
      link: string | null;
    };

    // 注意:
    // - data_category 先頭が "<国>: <リーグ>" で始まるものを対象
    // - 「終了」を含む行のみ
    // - 同一試合の最終行を ROW_NUMBER で抽出（JST日付単位でグルーピング）
    const rows = await prismaStats.$queryRawUnsafe<Row[]>(
      `
      WITH finished AS (
        SELECT
          d.seq::bigint                            AS seq_big,
          d.data_category                          AS data_category,
          d.home_team_name                         AS home_team_name,
          d.away_team_name                         AS away_team_name,
          NULLIF(TRIM(d.times), '')                AS times,
          NULLIF(TRIM(d.home_score), '')::int      AS home_score,
          NULLIF(TRIM(d.away_score), '')::int      AS away_score,
          (d.record_time AT TIME ZONE 'Asia/Tokyo')::timestamp AS record_time_jst_ts,
          to_char((d.record_time AT TIME ZONE 'Asia/Tokyo')::date, 'YYYY-MM-DD') AS jst_date,
          -- data 末尾に格納されていることが多い試合URLを拾えないケースもあるため nullable
          NULLIF(TRIM(d.judge), '')                AS link_maybe -- 列名が不確かなため保険（存在しなければ常に NULL）
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
        r.seq_big::text                            AS seq,
        r.data_category                            AS data_category,
        r.jst_date                                 AS jst_date,
        to_char(r.record_time_jst_ts, 'YYYY-MM-DD"T"HH24:MI:SS') AS record_time_jst,
        r.home_team_name                           AS home_team_name,
        r.away_team_name                           AS away_team_name,
        r.home_score                                AS home_score,
        r.away_score                                AS away_score,
        CASE
          WHEN regexp_match(r.data_category, '(ラウンド|Round)\\s*([0-9]+)') IS NULL THEN NULL
          ELSE CAST( (regexp_match(r.data_category, '(ラウンド|Round)\\s*([0-9]+)'))[2] AS INT )
        END                                        AS round_no,
        NULLIF(r.link_maybe, '')                   AS link
      FROM ranked r
      WHERE r.rn = 1
      ORDER BY r.record_time_jst_ts DESC
      `,
      `${country}: ${league}%`,
      teamJa
    );

    // フロント用に整形 & 結果判定
    const matches = rows.map((r) => {
      const seq = Number.parseInt(r.seq, 10);
      const home = r.home_team_name;
      const away = r.away_team_name;
      const hs = r.home_score ?? 0;
      const as = r.away_score ?? 0;

      let result: "WIN" | "LOSE" | "DRAW" = "DRAW";
      if (home === teamJa) {
        result = hs > as ? "WIN" : hs < as ? "LOSE" : "DRAW";
      } else if (away === teamJa) {
        result = as > hs ? "WIN" : as < hs ? "LOSE" : "DRAW";
      }

      return {
        seq,
        competition: r.data_category,
        round_no: r.round_no,
        date_jst: r.jst_date, // "YYYY-MM-DD"
        record_time_jst: r.record_time_jst, // "YYYY-MM-DDTHH:mm:ss"
        home_team: home,
        away_team: away,
        home_score: r.home_score,
        away_score: r.away_score,
        link: r.link ?? null,
        result, // WIN / LOSE / DRAW（呼び出しチーム視点）
      };
    });

    return res.json({ matches });
  } catch (e: any) {
    console.error("GET /api/history failed:", {
      params: req.params,
      err: e?.message,
      stack: e?.stack,
    });
    return res.status(500).json({ message: "server error", detail: e?.message ?? String(e) });
  }
});

export default historiesRouter;

// helpers
function safeDecode(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
