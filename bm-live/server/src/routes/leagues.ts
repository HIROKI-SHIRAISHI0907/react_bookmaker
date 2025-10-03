// server/src/routes/leagues.ts
import { Router } from "express";
import { prismaStats } from "../db";

const router = Router();
export default router;

// --- utils ---
const toPath = (s: string) => encodeURIComponent(s.trim().replace(/\s+/g, " "));
const fromPath = (s: string) => decodeURIComponent(s);
const parseTeamLink = (link: string) => {
  const m = link.match(/^\/team\/([^/]+)\/([^/]+)/i);
  return m ? { english: m[1], hash: m[2] } : { english: "", hash: "" };
};

// 動作確認
router.get("/__ping", (_req, res) => res.json({ ok: true }));

// フラット一覧（必要なら残す）
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
      path: `/${toPath(r.country)}/${toPath(r.league)}`,
    }));
    res.json(json);
  } catch (e) {
    console.error("GET /api/leagues failed:", e);
    res.status(500).json({ message: "server error" });
  }
});

// 国ごと→リーグ配列
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

/**
 * GET /api/leagues/:country/:league
 * 国＋リーグのチーム一覧
 */
router.get("/:country/:league", async (req, res) => {
  const countryParam = fromPath(req.params.country);
  const leagueParam = fromPath(req.params.league);
  try {
    console.log("[leagues] GET /:country/:league", {
      rawCountry: req.params.country,
      rawLeague: req.params.league,
      countryParam,
      leagueParam,
    });

    const rows = await prismaStats.$queryRaw<{ country: string; league: string; team: string; link: string }[]>`
      SELECT country, league, team, link
      FROM country_league_master
      WHERE country = ${countryParam} AND league = ${leagueParam}
      ORDER BY team
    `;

    const payload = {
      country: countryParam,
      league: leagueParam,
      teams: rows.map((r) => {
        const { english, hash } = parseTeamLink(r.link);
        return {
          name: r.team,
          english,
          hash,
          link: r.link,
          path: `/${encodeURIComponent(r.country)}/${encodeURIComponent(r.league)}`,
          apiPath: `/api/leagues/${encodeURIComponent(r.country)}/${encodeURIComponent(r.league)}/${english}`,
        };
      }),
    };
    res.json(payload);
  } catch (e: any) {
    console.error("GET /api/leagues/:country/:league failed:", {
      countryParam,
      leagueParam,
      err: e?.message,
      stack: e?.stack,
    });
    res.status(500).json({ message: "server error", detail: e?.message ?? String(e) });
  }
});

/**
 * GET /api/leagues/:country/:league/:team
 * 指定チーム詳細
 */
router.get("/:country/:league/:team", async (req, res) => {
  try {
    const countryParam = fromPath(req.params.country);
    const leagueParam = fromPath(req.params.league);
    const teamEnglish = req.params.team;

    const rows = await prismaStats.$queryRaw<{ id: number; country: string; league: string; team: string; link: string }[]>`
      SELECT id, country, league, team, link
      FROM country_league_master
      WHERE country = ${countryParam}
        AND league  = ${leagueParam}
        AND link LIKE ${`/team/${teamEnglish}/%`}
      LIMIT 1
    `;
    if (rows.length === 0) return res.status(404).json({ message: "team not found" });

    const row = rows[0];
    const { english, hash } = parseTeamLink(row.link);

    res.json({
      id: row.id,
      country: row.country,
      league: row.league,
      name: row.team,
      english,
      hash,
      link: row.link,
      paths: {
        leaguePage: `/${toPath(row.country)}/${toPath(row.league)}`,
        apiSelf: `/api/leagues/${toPath(row.country)}/${toPath(row.league)}/${english}`,
      },
    });
  } catch (e) {
    console.error("GET /api/leagues/:country/:league/:team failed:", e);
    res.status(500).json({ message: "server error" });
  }
});
