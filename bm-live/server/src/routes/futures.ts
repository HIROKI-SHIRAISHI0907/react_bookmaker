// src/routes/future.ts
import { Router } from "express";
import { prismaStats } from "../db";

export const futureRouter = Router();

type FutureRow = {
  seq: bigint | number;
  game_team_category: string | null;
  future_time: string; // timestamptz -> ISO 文字列
  home_team_name: string;
  away_team_name: string;
  game_link: string | null;
  round_no: number | null;
  status: "LIVE" | "SCHEDULED";
};

function toJSON(r: FutureRow) {
  // BigInt を安全に number へ
  const seqNum = typeof r.seq === "bigint" ? Number(r.seq) : (r.seq as number);
  return {
    seq: seqNum,
    game_team_category: r.game_team_category ?? "",
    future_time: r.future_time,
    home_team: r.home_team_name,
    away_team: r.away_team_name,
    link: r.game_link,
    round_no: r.round_no,
    status: r.status,
  };
}

// ラウンド番号抽出（PostgreSQL 正規表現）
// "ラウンド 33" / "Round 12" 等に対応
const ROUND_SQL = `
  CASE
    WHEN regexp_match(f.game_team_category, '(ラウンド|Round)\\s*([0-9]+)') IS NULL THEN NULL
    ELSE CAST( (regexp_match(f.game_team_category, '(ラウンド|Round)\\s*([0-9]+)'))[2] AS INT )
  END AS round_no
`;

// start_flg: 0=LIVE, 1=SCHEDULED のみ対象
const BASE_SELECT = `
  SELECT
    f.seq,
    f.game_team_category,
    to_char(f.future_time AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS future_time,
    f.home_team_name,
    f.away_team_name,
    f.game_link,
    ${ROUND_SQL},
    CASE WHEN f.start_flg = '0' THEN 'LIVE' ELSE 'SCHEDULED' END AS status
  FROM future_master f
  WHERE f.start_flg IN ('0','1')
`;

// --- 1) クエリ版: /api/future?team=<teamSlug or name> ---
futureRouter.get("/", async (req, res) => {
  try {
    const team = req.query.team ? String(req.query.team) : undefined;

    let teamJa: string | undefined;
    if (team) {
      // team がスラッグなら日本語名を拾う（country/league 不明でも可能な範囲で）
      const m = await prismaStats.$queryRaw<{ team: string }[]>`
        SELECT team
        FROM country_league_master
        WHERE link LIKE ${`/team/${team}/%`}
        LIMIT 1
      `;
      teamJa = m[0]?.team ?? undefined;
    }

    const rows = await prismaStats.$queryRawUnsafe<FutureRow[]>(
      `
      ${BASE_SELECT}
      ${teamJa ? `AND (f.home_team_name = $1 OR f.away_team_name = $1)` : ""}
      ORDER BY
        -- ラウンド番号 → 時間（昇順）
        ${teamJa ? "" : ""} 
        ${teamJa ? `AND (f.home_team_name = $1 OR f.away_team_name = $1)` : ""}
        ORDER BY
        round_no NULLS LAST,
        f.future_time ASC
      `,
      ...(teamJa ? [teamJa] : [])
    );

    return res.json({ matches: rows.map(toJSON) });
  } catch (e: any) {
    console.error("[GET /api/future] failed:", e);
    return res.status(500).json({ message: "server error", detail: e?.message ?? String(e) });
  }
});

// --- 2) パス版: /api/future/:country/:league/:team ---
futureRouter.get("/:country/:league/:team", async (req, res) => {
  const country = safeDecode(req.params.country);
  const league = safeDecode(req.params.league);
  const teamSlug = req.params.team;

  try {
    // スラッグ→日本語名
    const m = await prismaStats.$queryRaw<{ team: string }[]>`
      SELECT team
      FROM country_league_master
      WHERE country = ${country}
        AND league  = ${league}
        AND link LIKE ${`/team/${teamSlug}/%`}
      LIMIT 1
    `;
    const teamJa = m[0]?.team ?? teamSlug;

    const rows = await prismaStats.$queryRawUnsafe<FutureRow[]>(
      `
      ${BASE_SELECT}
      AND (f.home_team_name = $1 OR f.away_team_name = $1)
      ORDER BY
        round_no NULLS LAST,
        f.future_time ASC
      `,
      teamJa
    );

    return res.json({ matches: rows.map(toJSON) });
  } catch (e: any) {
    console.error("[GET /api/future/:country/:league/:team] failed:", e);
    return res.status(500).json({ message: "server error", detail: e?.message ?? String(e) });
  }
});

export default futureRouter;

function safeDecode(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
