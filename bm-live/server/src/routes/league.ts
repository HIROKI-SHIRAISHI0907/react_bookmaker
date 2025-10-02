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

// URLスラッグ → 元名（最低限の復元）
const fromPath = (s: string) => decodeURIComponent(s).replace(/-/g, " ");

// link から英語表記とハッシュを抜く
const parseTeamLink = (link: string) => {
  const m = link.match(/^\/team\/([^/]+)\/([^/]+)/i);
  return m ? { english: m[1], hash: m[2] } : { english: "", hash: "" };
};

/**
 * GET /api/leagues/:country/:league
 * 指定の国・リーグに属する team 一覧を返す
 * レスポンス例:
 * {
 *   country: "...",
 *   league: "...",
 *   teams: [
 *     { name: "FC 東京", english: "fc-tokyo", hash: "abc123", link: "/team/fc-tokyo/abc123",
 *       path: "/日本/J1", apiPath: "/api/leagues/日本/J1/fc-tokyo" }
 *   ]
 * }
 */
router.get("/:country/:league", async (req, res) => {
  try {
    const countryParam = fromPath(req.params.country);
    const leagueParam = fromPath(req.params.league);

    // country + league で絞り込み
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
          name: r.team, // 表示名
          english, // /team/<english>/<hash> の <english>
          hash, // 同 <hash>
          link: r.link, // 例: /team/<english>/<hash>
          // 画面用の人間向けパス（既存ルール）
          path: `/${toPath(r.country)}/${toPath(r.league)}`,
          // API の詳細取得エンドポイント
          apiPath: `/api/leagues/${toPath(r.country)}/${toPath(r.league)}/${english}`,
        };
      }),
    };

    return res.json(payload);
  } catch (e) {
    console.error("GET /api/leagues/:country/:league failed:", e);
    return res.status(500).json({ message: "server error" });
  }
});

/**
 * GET /api/leagues/:country/:league/:team
 * 指定チーム（英語表記）1件の詳細を返す
 * - :team は /team/<english>/<hash> の <english>
 * - country, league は人名/日本語などDBの生値と一致させるため fromPath で復元
 */
router.get("/:country/:league/:team", async (req, res) => {
  try {
    const countryParam = fromPath(req.params.country);
    const leagueParam = fromPath(req.params.league);
    const teamEnglish = req.params.team; // 英語スラッグ（そのまま使う）

    // link で英語表記をマッチさせる
    // 例: link LIKE '/team/<english>/%'
    const rows = await prismaStats.$queryRaw<{ id: number; country: string; league: string; team: string; link: string }[]>`
      SELECT id, country, league, team, link
      FROM country_league_master
      WHERE country = ${countryParam}
        AND league  = ${leagueParam}
        AND link LIKE ${`/team/${teamEnglish}/%`}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return res.status(404).json({ message: "team not found" });
    }

    const row = rows[0];
    const { english, hash } = parseTeamLink(row.link);

    const detail = {
      id: row.id,
      country: row.country,
      league: row.league,
      name: row.team, // 表示名
      english, // link から抽出
      hash,
      link: row.link,
      // 関連リンク（UI/クライアントで便利な派生）
      paths: {
        leaguePage: `/${toPath(row.country)}/${toPath(row.league)}`,
        apiSelf: `/api/leagues/${toPath(row.country)}/${toPath(row.league)}/${english}`,
      },
    };

    return res.json(detail);
  } catch (e) {
    console.error("GET /api/leagues/:country/:league/:team failed:", e);
    return res.status(500).json({ message: "server error" });
  }
});

export default router;
