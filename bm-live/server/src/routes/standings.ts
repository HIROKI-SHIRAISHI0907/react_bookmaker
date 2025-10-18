import { Router } from "express";
import { prismaStats } from "../db";

const standingsRouter = Router();

/**
 * GET /api/standings/:country/:league
 * - 国名・リーグ名は日本語（URLエンコードされて渡る）
 * - 順位表を返す
 * - 並び順: 勝点 DESC → 勝利 DESC → 敗戦 ASC → 引分 DESC → チーム名 ASC（日本語）
 */
standingsRouter.get("/:country/:league", async (req, res) => {
  const country = safeDecode(req.params.country);
  const league = safeDecode(req.params.league);

  if (!country || !league) {
    return res.status(400).json({ message: "country and league are required" });
  }

  try {
    const rows = await prismaStats.$queryRawUnsafe<any[]>(
      `
      WITH base AS (
        SELECT
          o.team,
          SUM(COALESCE(NULLIF(BTRIM(o.win),  '')::int, 0))   AS win,
          SUM(COALESCE(NULLIF(BTRIM(o.lose), '')::int, 0))   AS lose,
          SUM(COALESCE(NULLIF(BTRIM(o.draw), '')::int, 0))   AS draw,
          SUM(COALESCE(NULLIF(BTRIM(o.winning_points), '')::int, 0)) AS points
        FROM public.surface_overview o
        WHERE o.country = $1
          AND o.league  = $2
        GROUP BY o.team
      ),
      cm_agg AS (
        SELECT
          team,
          MIN(NULLIF(TRIM(link), '')) AS link
        FROM country_league_master
        WHERE country = $1
          AND league  = $2
        GROUP BY team
      ),
      with_meta AS (
        SELECT
          b.*,
          (b.win + b.draw + b.lose) AS game,
          c.link
        FROM base b
        LEFT JOIN cm_agg c
          ON c.team = b.team
      ),
      ranked AS (
        SELECT
          ROW_NUMBER() OVER (
            ORDER BY
              points DESC NULLS LAST,
              win    DESC NULLS LAST,
              lose   ASC  NULLS LAST,
              draw   DESC NULLS LAST,
              team   ASC
          ) AS position,
          *
        FROM with_meta
      )
      SELECT
        r.position,
        r.team                                        AS "teamName",
        COALESCE(split_part(NULLIF(r.link,''), '/', 3), '') AS "teamEnglish",
        r.game                                        AS "game",
        r.win                                         AS "win",
        r.draw                                        AS "draw",
        r.lose                                        AS "lose",
        r.points                                      AS "winningPoints"
      FROM ranked r
      ORDER BY r.position ASC
      `,
      country,
      league
    );

    const payload = {
      season: undefined as string | undefined,
      updatedAt: undefined as string | undefined,
      rows: rows.map((r) => ({
        position: Number(r.position),
        teamName: String(r.teamName ?? ""),
        teamEnglish: String(r.teamEnglish ?? ""),
        game: Number(r.game ?? 0),
        win: Number(r.win ?? 0),
        draw: Number(r.draw ?? 0),
        lose: Number(r.lose ?? 0),
        winningPoints: Number(r.winningPoints ?? 0),
      })),
    };

    return res.json(payload);
  } catch (e: any) {
    console.error("[GET /api/standings/:country/:league] error", {
      params: req.params,
      err: e?.message,
    });
    return res.status(500).json({ message: "server error", detail: e?.message ?? String(e) });
  }
});

export default standingsRouter;

// --- helpers ---
function safeDecode(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
