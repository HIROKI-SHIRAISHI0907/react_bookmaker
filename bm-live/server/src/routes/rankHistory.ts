// src/routes/rankHistory.ts
import { Router } from "express";
import { prismaStats } from "../db";

const rankHistoryRouter = Router();

/**
 * GET /api/rank-history/:country/:league
 *
 * - rank_history から指定リーグの順位履歴を取得
 * - チーム条件は不要（国 × リーグ × 試合節ごとの全チームの順位を返す）
 * - 並び順: match(節) ASC, rank ASC
 */
rankHistoryRouter.get("/:country/:league", async (req, res) => {
  const country = safeDecode(req.params.country);
  const league = safeDecode(req.params.league);

  try {
    const rows = await prismaStats.$queryRaw<
      {
        id: number;
        country: string;
        league: string;
        match: number;
        team: string;
        rank: number;
      }[]
    >`
      SELECT
        id,
        country,
        league,
        match,
        team,
        rank
      FROM rank_history
      WHERE country = ${country}
        AND league  = ${league}
      ORDER BY "match" ASC, rank ASC
    `;

    const items = rows.map((r) => ({
      id: Number(r.id),
      country: r.country,
      league: r.league,
      match: Number(r.match),
      team: r.team,
      rank: Number(r.rank),
    }));

    return res.json({ items });
  } catch (e: any) {
    console.error("[GET /api/rank-history/:country/:league] error", {
      params: req.params,
      err: e?.message,
    });

    return res.status(500).json({
      message: "server error",
      detail: e?.message ?? String(e),
    });
  }
});

export default rankHistoryRouter;

// --- helpers ---
function safeDecode(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
