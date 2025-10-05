// server/src/routes/correlation.ts
import { Router } from "express";
import { prismaStats } from "../db";
import { Prisma } from "../../generated/stats"; // ★ 追加: Prisma.sql / Prisma.empty 用

const fromPath = (s: string) => decodeURIComponent(s).replace(/-/g, " ");

export const correlationRouter = Router();

type RawRow = Record<string, any> & {
  score: "1st" | "2nd" | "ALL";
  home: string | null;
  away: string | null;
  side: "home" | "away" | null;
  opponent: string | null;
  // rank_1th ~ rank_74th が "metric,value" / null
};

correlationRouter.get("/:country/:league/:team/correlations", async (req, res) => {
  try {
    const countryParam = fromPath(req.params.country);
    const leagueParam = fromPath(req.params.league);
    const teamSlug = req.params.team; // 英語スラッグ
    const opponent = req.query.opponent as string | undefined; // 追加: 任意の対戦相手

    // ① スラッグ→日本語チーム名
    const teamRows = await prismaStats.$queryRaw<{ team: string }[]>`
      SELECT clm.team
      FROM country_league_master clm
      WHERE clm.country = ${countryParam}
        AND clm.league  = ${leagueParam}
        AND clm.link LIKE ${`/team/${teamSlug}/%`}
      LIMIT 1
    `;
    if (teamRows.length === 0) return res.status(404).json({ message: "team not found" });
    const teamName = teamRows[0].team;

    // ② opponent の可変条件を Prisma.sql で合成（空は Prisma.empty）
    const opponentCond = opponent && opponent.trim().length > 0 ? Prisma.sql` AND (CASE WHEN r.home = ${teamName} THEN r.away ELSE r.home END) = ${opponent}` : Prisma.empty;

    // ③ データ取得（side と opponent を計算して返す）
    const rows = await prismaStats.$queryRaw<RawRow[]>`
      SELECT
        r.*,
        CASE
          WHEN r.home = ${teamName} THEN 'home'
          WHEN r.away = ${teamName} THEN 'away'
          ELSE NULL
        END AS side,
        CASE
          WHEN r.home = ${teamName} THEN r.away
          ELSE r.home
        END AS opponent
      FROM calc_correlation_ranking r
      WHERE r.country = ${countryParam}
        AND r.league  = ${leagueParam}
        AND (r.home = ${teamName} OR r.away = ${teamName})
        AND r.score IN ('1st','2nd','ALL')
        ${opponentCond}   -- ★ ここが安全に展開される
    `;

    // ④ rank_Xth を side ごと・prefix ごとに抽出
    const pickTopN = (row: RawRow | undefined, wantPrefix: "home" | "away", n = 5) => {
      if (!row) return [] as Array<{ metric: string; value: number }>;
      const out: Array<{ metric: string; value: number }> = [];
      for (let i = 1; i <= 74; i++) {
        const k = `rank_${i}th`;
        const raw = (row as any)[k];
        if (!raw) continue;
        const [metric, vstr] = String(raw).split(",");
        if (!metric || !metric.startsWith(wantPrefix)) continue;
        const v = Number(vstr);
        if (!Number.isFinite(v)) continue;
        out.push({ metric, value: v });
        if (out.length >= n) break;
      }
      return out;
    };

    const findBy = (score: "1st" | "2nd" | "ALL", side: "home" | "away") => rows.find((r) => r.score === score && r.side === side);

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

    // ⑤ プルダウン候補（相手一覧）を抽出（distinct, null 除外, ソート）
    const opponents = Array.from(new Set(rows.map((r) => r.opponent).filter((v): v is string => !!v))).sort((a, b) => a.localeCompare(b, "ja"));

    return res.json({
      team: teamName,
      country: countryParam,
      league: leagueParam,
      opponents,
      correlations,
    });
  } catch (e) {
    console.error("correlations failed:", e);
    return res.status(500).json({ message: "internal error" });
  }
});
