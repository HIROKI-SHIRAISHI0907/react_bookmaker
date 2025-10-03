// server/src/routes/correlation.ts
import { Router } from "express";
import { prismaStats } from "../db";
export const correlationRouter = Router();

const fromPath = (s: string) => decodeURIComponent(s);

type RawRow = Record<string, any> & {
  score: "1st" | "2nd" | "ALL";
  home: string | null;
  away: string | null;
  // rank_1th ~ rank_74th が文字列 "metric,value" / null で入る
};

correlationRouter.get("/:country/:league/:team/correlations", async (req, res) => {
  try {
    const countryParam = fromPath(req.params.country);
    const leagueParam = fromPath(req.params.league);
    const teamSlug = req.params.team; // 英語スラッグ

    // ① スラッグ→日本語チーム名
    const teamRows = await prismaStats.$queryRaw<{ team: string }[]>`
      SELECT clm.team
      FROM country_league_master clm
      WHERE clm.country = ${countryParam}
        AND clm.league  = ${leagueParam}
        AND clm.link LIKE ${`/team/${teamSlug}/%`}
      LIMIT 1
    `;
    if (teamRows.length === 0) {
      return res.status(404).json({ message: "team not found" });
    }
    const teamName = teamRows[0].team;

    // ② 該当チームが home/away のどちらかで出現する行（1st/2nd/ALL）
    const rows = await prismaStats.$queryRaw<RawRow[]>`
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

    // ③ rank_Xth を side ごとにフィルタ
    const pickTopN = (row: RawRow | undefined, wantPrefix: "home" | "away", n = 5) => {
      if (!row) return [] as Array<{ metric: string; value: number }>;
      const out: Array<{ metric: string; value: number }> = [];
      // ranking は rank_1th → rank_74th の昇順で意味があるので順に走査
      for (let i = 1; i <= 74; i++) {
        const key = `rank_${i}th`;
        const raw = row[key];
        if (!raw) continue;
        const [metric, valueStr] = String(raw).split(",");
        if (!metric || !metric.startsWith(wantPrefix)) continue;
        const v = Number(valueStr);
        if (!Number.isFinite(v)) continue;
        out.push({ metric, value: v });
        if (out.length >= n) break;
      }
      return out;
    };

    // ④ score×side でマッピング
    const findBy = (score: "1st" | "2nd" | "ALL", side: "home" | "away") => rows.find((r) => r.score === score && (r as any).side === side);

    const correlations = {
      HOME: {
        "1st": pickTopN(findBy("1st", "home"), "home"),
        "2nd": pickTopN(findBy("2nd", "home"), "home"),
        ALL: pickTopN(findBy("ALL", "home"), "home"),
      },
      AWAY: {
        "1st": pickTopN(findBy("1st", "away"), "away"),
        "2nd": pickTopN(findBy("2nd", "away"), "away"),
        ALL: pickTopN(findBy("ALL", "away"), "away"),
      },
    };

    return res.json({
      team: teamName,
      country: countryParam,
      league: leagueParam,
      correlations,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "internal error" });
  }
});
