// server/src/routes/leagues.ts
import { Router } from "express";
import { prismaStats } from "../db";

const router = Router();

// URL片を生成（encodeURIComponent を使う）
const toPath = (s: string) => encodeURIComponent(s.trim().replace(/\s+/g, " ")); // 見た目は保ちつつURLセーフ

// フラットな配列（国×リーグごと）
router.get("/", async (_req, res) => {
  try {
    const rows = await prismaStats.$queryRaw<{ country: string; league: string; team_count: bigint }[]>`
      SELECT country, league, COUNT(*) AS team_count
      FROM country_league_master
      GROUP BY country, league
      ORDER BY country, league
    `;

    const json = rows.map((r) => ({
      country: r.country,
      league: r.league,
      team_count: Number(r.team_count),
      path: `/${toPath(r.country)}/${toPath(r.league)}`, // ★ ここで生成
    }));

    res.json(json);
  } catch (e) {
    console.error("GET /api/leagues failed:", e);
    res.status(500).json({ message: "server error" });
  }
});

// 国ごとにリーグをまとめた形（フロントで扱いやすい）
router.get("/grouped", async (_req, res) => {
  try {
    const rows = await prismaStats.$queryRaw<{ country: string; league: string; team_count: bigint }[]>`
      SELECT country, league, COUNT(*) AS team_count
      FROM country_league_master
      GROUP BY country, league
      ORDER BY country, league
    `;

    const map = new Map<string, { country: string; leagues: { name: string; team_count: number; path: string }[] }>();
    for (const r of rows) {
      const key = r.country;
      if (!map.has(key)) map.set(key, { country: r.country, leagues: [] });
      map.get(key)!.leagues.push({
        name: r.league,
        team_count: Number(r.team_count),
        path: `/${toPath(r.country)}/${toPath(r.league)}`,
      });
    }
    res.json(Array.from(map.values()));
  } catch (e) {
    console.error("GET /api/leagues/grouped failed:", e);
    res.status(500).json({ message: "server error" });
  }
});

export default router;
