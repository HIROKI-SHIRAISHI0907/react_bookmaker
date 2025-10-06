// src/routes/futures.ts
import { Router } from "express";
import { prismaStats } from "../db";

const futureRouter = Router();

/**
 * GET /api/future/:country/:league/:team
 *  - future_master から start_flg='1' (予定) のみ取得
 *  - :team は英語スラッグ。country_league_master で日本語名に解決してマッチング
 *  - 並び順: ラウンド番号(昇順) → 試合時間(昇順)
 *  - ラウンド番号は game_team_category 内の「ラウンド 12 / Round 12」から抽出
 */
futureRouter.get("/:country/:league/:team", async (req, res) => {
  const country = safeDecode(req.params.country);
  const league = safeDecode(req.params.league);
  const teamSlug = req.params.team;

  try {
    // スラッグ→日本語名
    const teamNameRows = await prismaStats.$queryRaw<{ team: string }[]>`
      SELECT team
      FROM country_league_master
      WHERE country = ${country}
        AND league  = ${league}
        AND link LIKE ${`/team/${teamSlug}/%`}
      LIMIT 1
    `;
    const teamJa = teamNameRows[0]?.team ?? teamSlug;

    // 予定のみ取得（start_flg='1'）+ ラウンド番号抽出 + JSONで扱えるよう seq は text に
    const rows = await prismaStats.$queryRawUnsafe<any[]>(
      `
      SELECT
        (f.seq)::text AS seq,
        f.game_team_category,
        f.future_time,
        f.home_team_name AS home_team,
        f.away_team_name AS away_team,
        NULLIF(TRIM(f.game_link), '') AS link,
        CASE
          WHEN regexp_match(f.game_team_category, '(ラウンド|Round)\\s*([0-9]+)') IS NULL THEN NULL
          ELSE CAST( (regexp_match(f.game_team_category, '(ラウンド|Round)\\s*([0-9]+)'))[2] AS INT )
        END AS round_no,
        'SCHEDULED' AS status
      FROM future_master f
      WHERE f.start_flg = '1'
        AND (f.home_team_name = $1 OR f.away_team_name = $1)
        AND f.game_team_category LIKE $2
      ORDER BY
        CASE
          WHEN regexp_match(f.game_team_category, '(ラウンド|Round)\\s*([0-9]+)') IS NULL THEN 2147483647
          ELSE CAST( (regexp_match(f.game_team_category, '(ラウンド|Round)\\s*([0-9]+)'))[2] AS INT )
        END ASC,
        f.future_time ASC
      `,
      teamJa,
      `${country}: ${league}%`
    );

    // 念のため整形（文字列・null の正規化）
    const matches = rows.map((r) => ({
      seq: Number(r.seq), // text→number
      game_team_category: r.game_team_category ?? "",
      future_time: new Date(r.future_time).toISOString(),
      home_team: r.home_team ?? "",
      away_team: r.away_team ?? "",
      link: r.link ?? null,
      round_no: r.round_no === null ? null : Number(r.round_no),
      status: "SCHEDULED" as const,
    }));

    return res.json({ matches });
  } catch (e: any) {
    console.error("[GET /api/future/:country/:league/:team] error", {
      params: req.params,
      err: e?.message,
    });
    return res.status(500).json({ message: "server error", detail: e?.message ?? String(e) });
  }
});

export default futureRouter;

// --- helpers ---
function safeDecode(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
