import { Router } from "express";
import { prismaStats } from "../db";

export const historiesRouter = Router();

/**
 * GET /api/history/:country/:league/:team
 * - times に「終了」を含む最終スナップショット（同日×home×awayごとの最大 seq）
 * - チーム名は末尾「・詳細/：詳細/: 詳細」を除去してから正規化して判定
 * - 時刻は JST のエポック(ms) を返却（played_at_ms）
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
      seq: string;
      data_category: string;
      jst_date: string;
      record_time_jst: string; // 旧互換
      played_at_ms: number; // 追加: JST基準のエポック(ms)
      home_team_name: string;
      away_team_name: string;
      home_score: number | null;
      away_score: number | null;
      round_no: number | null;
      link: string | null;
    };

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
          NULLIF(TRIM(d.judge), '')                AS link_maybe
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
        /* ← フロントはこれを使って Date を作る（Invalid Date 回避） */
        (EXTRACT(EPOCH FROM r.record_time_jst_ts) * 1000)::bigint AS played_at_ms,
        r.home_team_name                           AS home_team_name,
        r.away_team_name                           AS away_team_name,
        r.home_score                               AS home_score,
        r.away_score                               AS away_score,
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

    // --- 勝敗判定のための正規化 ---
    const stripTailDetail = (s: string) => s.replace(/[・:：]?\s*詳細\s*$/u, ""); // 末尾だけ除去（クラブ名中の「・」は保持）

    const norm = (s: string | null | undefined) =>
      stripTailDetail(s ?? "")
        .replace(/[\u3000\u00A0]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

    const teamKey = norm(teamJa);

    const matches = rows.map((r) => {
      const seq = Number.parseInt(r.seq, 10);
      const home = r.home_team_name ?? "";
      const away = r.away_team_name ?? "";
      const hs = r.home_score ?? 0;
      const as = r.away_score ?? 0;

      const isHome = norm(home) === teamKey;
      const isAway = norm(away) === teamKey;

      let result: "WIN" | "LOSE" | "DRAW";
      if (isHome) {
        result = hs > as ? "WIN" : hs < as ? "LOSE" : "DRAW";
      } else if (isAway) {
        result = as > hs ? "WIN" : as < hs ? "LOSE" : "DRAW";
      } else {
        // どちらにも一致しない場合は引き分けなら DRAW、勝敗は neutral=LOSE としないで DRAW に寄せたければここを変更
        result = hs === as ? "DRAW" : "LOSE";
      }

      return {
        seq,
        competition: r.data_category,
        round_no: r.round_no,
        date_jst: r.jst_date,
        record_time_jst: r.record_time_jst,
        played_at_ms: Number(r.played_at_ms),
        home_team: r.home_team_name,
        away_team: r.away_team_name,
        home_score: r.home_score,
        away_score: r.away_score,
        link: r.link ?? null,
        result,
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

function safeDecode(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
