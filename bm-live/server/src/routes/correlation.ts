import { Router } from "express";
import { prismaStats } from "../db";

const router = Router();

const fromPath = (s: string) => decodeURIComponent(s).replace(/-/g, " ");

function parseMetric(raw?: string | null) {
  if (!raw) return null;
  const [m, v] = String(raw).split(",");
  if (!m) return null;
  const num = Number(v);
  if (!Number.isFinite(num)) return null;
  return { metric: m, value: num };
}

function pickTopNWithPreference(row: any, preferred: "home" | "away", N = 5) {
  const preferredList: Array<{ metric: string; value: number }> = [];
  const others: Array<{ metric: string; value: number }> = [];
  for (let i = 1; i <= 74; i++) {
    const parsed = parseMetric(row[`rank_${i}th`]);
    if (!parsed) continue;
    if (parsed.metric.toLowerCase().startsWith(preferred)) preferredList.push(parsed);
    else others.push(parsed);
    if (preferredList.length >= N) break;
  }
  const out = preferredList.slice(0, N);
  let j = 0;
  while (out.length < N && j < others.length) out.push(others[j++]);
  return out;
}

/** 段階的に slug -> 日本語チーム名を解決 */
async function resolveTeamName(country: string, league: string, slug: string) {
  // 1) 国・リーグ・link 前方一致（最も厳密）
  let rows = await prismaStats.$queryRaw<{ team: string }[]>`
    SELECT team
    FROM country_league_master
    WHERE country = ${country}
      AND league  = ${league}
      AND link LIKE ${`/team/${slug}/%`}
    LIMIT 1
  `;
  if (rows.length > 0) return { team: rows[0].team, by: "country+league+link" };

  // 2) 国一致 + link 前方一致（リーグ表記ゆれ対策）
  rows = await prismaStats.$queryRaw<{ team: string }[]>`
    SELECT team
    FROM country_league_master
    WHERE country = ${country}
      AND link LIKE ${`/team/${slug}/%`}
    LIMIT 1
  `;
  if (rows.length > 0) return { team: rows[0].team, by: "country+link" };

  // 3) link 前方一致だけ（最小限）
  rows = await prismaStats.$queryRaw<{ team: string }[]>`
    SELECT team
    FROM country_league_master
    WHERE link LIKE ${`/team/${slug}/%`}
    LIMIT 1
  `;
  if (rows.length > 0) return { team: rows[0].team, by: "link-only" };

  return null;
}

router.get("/:country/:league/:team/correlations", async (req, res) => {
  try {
    const countryParam = fromPath(req.params.country);
    const leagueParam = fromPath(req.params.league);
    const teamSlug = req.params.team;

    // ログ（必要に応じて）
    // console.log("[corr] req", { countryParam, leagueParam, teamSlug });

    // slug -> 日本語チーム名
    const resolved = await resolveTeamName(countryParam, leagueParam, teamSlug);
    if (!resolved) {
      return res.status(404).json({
        message: "team not found",
        hints: {
          tried: ["country+league+link LIKE", "country+link LIKE", "link LIKE only"],
          received: { country: countryParam, league: leagueParam, slug: teamSlug },
        },
      });
    }
    const teamName = resolved.team;

    // 相関テーブル
    const rows = await prismaStats.$queryRaw<any[]>`
      SELECT
        r.*,
        CASE
          WHEN r.home = ${teamName} THEN 'home'
          WHEN r.away = ${teamName} THEN 'away'
          ELSE NULL
        END AS side
      FROM calc_correlation_ranking r
      WHERE r.country = ${countryParam}
        AND r.league  = ${leagueParam}
        AND (r.home = ${teamName} OR r.away = ${teamName})
        AND r.score IN ('1st','2nd','ALL')
    `;

    if (rows.length === 0) {
      // country/league の表記ずれ対策：league を無視して再トライ（任意）
      const rows2 = await prismaStats.$queryRaw<any[]>`
        SELECT
          r.*,
          CASE
            WHEN r.home = ${teamName} THEN 'home'
            WHEN r.away = ${teamName} THEN 'away'
            ELSE NULL
          END AS side
        FROM calc_correlation_ranking r
        WHERE r.country = ${countryParam}
          AND (r.home = ${teamName} OR r.away = ${teamName})
          AND r.score IN ('1st','2nd','ALL')
      `;
      if (rows2.length === 0) {
        return res.status(404).json({
          message: "correlations not found",
          hints: {
            country: countryParam,
            league: leagueParam,
            team: teamName,
            note: "league 表記ゆれの可能性。上の rows2 クエリも 0 件ならデータ未登録です。",
          },
        });
      }
      // rows2 を採用（リーグゆるめ）
      const byScore2: Record<"1st" | "2nd" | "ALL", any[]> = { "1st": [], "2nd": [], ALL: [] };
      (["1st", "2nd", "ALL"] as const).forEach((s) => {
        const row = rows2.find((r) => r.score === s);
        if (!row) return;
        const preferred: "home" | "away" = row.side === "away" ? "away" : "home";
        byScore2[s] = pickTopNWithPreference(row, preferred, 5);
      });
      return res.json({
        team: { name: teamName, slug: teamSlug },
        country: countryParam,
        league: leagueParam,
        correlations: byScore2,
        relaxed: true, // ← フラグ（デバッグ用）
      });
    }

    // 通常（厳密 league で命中）
    const byScore: Record<"1st" | "2nd" | "ALL", any[]> = { "1st": [], "2nd": [], ALL: [] };
    (["1st", "2nd", "ALL"] as const).forEach((s) => {
      const row = rows.find((r) => r.score === s);
      if (!row) return;
      const preferred: "home" | "away" = row.side === "away" ? "away" : "home";
      byScore[s] = pickTopNWithPreference(row, preferred, 5);
    });

    return res.json({
      team: { name: teamName, slug: teamSlug },
      country: countryParam,
      league: leagueParam,
      correlations: byScore,
    });
  } catch (e) {
    console.error("GET /api/leagues/:country/:league/:team/correlations failed:", e);
    return res.status(500).json({ message: "server error" });
  }
});

export default router;
