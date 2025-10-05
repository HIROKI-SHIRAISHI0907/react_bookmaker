// src/routes/eachscoredstats.ts
import { Router } from "express";
import { prismaStats } from "../db";

export const eachStatsRouter = Router();

/**
 * テーブル想定:
 *   - テーブル: each_team_score_based_feature_stats（必要なら実名に変更）
 *   - 列: id, situation, score, country, league, team, （下の STAT_COLUMNS）
 *   - 各統計列は「min,minTime,max,maxTime,avg,avgTime,var,varTime,skew,kurt」10要素のカンマ区切り文字列
 *
 * エンドポイント:
 *   GET /api/stats/:country/:league/:team
 *
 * 返却（動的スコア対応）:
 * {
 *   stats: {
 *     HOME: { [score: string]: Record<string,string|null> },
 *     AWAY: { [score: string]: Record<string,string|null> }
 *   },
 *   meta: { teamJa: string, situations: string[], scores: string[] }
 * }
 */

const TABLE_NAME = "each_team_score_based_feature_stats"; // ←必要なら変更

const STAT_COLUMNS = [
  "home_exp_stat",
  "away_exp_stat",
  "home_in_goal_exp_stat",
  "away_in_goal_exp_stat",
  "home_donation_stat",
  "away_donation_stat",
  "home_shoot_all_stat",
  "away_shoot_all_stat",
  "home_shoot_in_stat",
  "away_shoot_in_stat",
  "home_shoot_out_stat",
  "away_shoot_out_stat",
  "home_block_shoot_stat",
  "away_block_shoot_stat",
  "home_big_chance_stat",
  "away_big_chance_stat",
  "home_corner_stat",
  "away_corner_stat",
  "home_box_shoot_in_stat",
  "away_box_shoot_in_stat",
  "home_box_shoot_out_stat",
  "away_box_shoot_out_stat",
  "home_goal_post_stat",
  "away_goal_post_stat",
  "home_goal_head_stat",
  "away_goal_head_stat",
  "home_keeper_save_stat",
  "away_keeper_save_stat",
  "home_free_kick_stat",
  "away_free_kick_stat",
  "home_offside_stat",
  "away_offside_stat",
  "home_foul_stat",
  "away_foul_stat",
  "home_yellow_card_stat",
  "away_yellow_card_stat",
  "home_red_card_stat",
  "away_red_card_stat",
  "home_slow_in_stat",
  "away_slow_in_stat",
  "home_box_touch_stat",
  "away_box_touch_stat",
  "home_pass_count_stat",
  "away_pass_count_stat",
  "home_long_pass_count_stat",
  "away_long_pass_count_stat",
  "home_final_third_pass_count_stat",
  "away_final_third_pass_count_stat",
  "home_cross_count_stat",
  "away_cross_count_stat",
  "home_tackle_count_stat",
  "away_tackle_count_stat",
  "home_clear_count_stat",
  "away_clear_count_stat",
  "home_duel_count_stat",
  "away_duel_count_stat",
  "home_intercept_count_stat",
  "away_intercept_count_stat",
] as const;

type Row = {
  situation: string;
  score: string; // 動的キー
  country: string;
  league: string;
  team: string;
} & Record<(typeof STAT_COLUMNS)[number], string | null>;

// ---------------- Route ----------------
eachStatsRouter.get("/:country/:league/:team", async (req, res) => {
  const country = safeDecode(req.params.country);
  const league = safeDecode(req.params.league);
  const teamSlug = req.params.team; // 英語スラッグ

  try {
    // statsテーブルが日本語チーム名を持つケースに対応
    const teamNameRows = await prismaStats.$queryRaw<{ team: string }[]>`
      SELECT team
      FROM country_league_master
      WHERE country = ${country}
        AND league  = ${league}
        AND link LIKE ${`/team/${teamSlug}/%`}
      LIMIT 1
    `;
    const teamJa = teamNameRows[0]?.team ?? teamSlug;

    const selectCols = ["situation", "score", "country", "league", "team", ...STAT_COLUMNS].map((c) => `s.${c}`).join(", ");

    const rows = await prismaStats.$queryRawUnsafe<Row[]>(
      `
        SELECT ${selectCols}
        FROM ${TABLE_NAME} s
        WHERE s.country = $1
          AND s.league  = $2
          AND s.team    = $3
      `,
      country,
      league,
      teamJa
    );

    // 整形: HOME/AWAY × 動的score で分ける（スコアごとに初期化）
    const HOME: Record<string, Record<string, string | null>> = {};
    const AWAY: Record<string, Record<string, string | null>> = {};

    const situationsSet = new Set<string>();
    const scoresSet = new Set<string>();

    for (const r of rows) {
      const scoreKey = String(r.score); // 例: "1st", "2nd", "ALL", "0-1", "1-1" など
      scoresSet.add(scoreKey);
      situationsSet.add(r.situation);

      // 未初期化なら器を作る
      if (!HOME[scoreKey]) HOME[scoreKey] = {};
      if (!AWAY[scoreKey]) AWAY[scoreKey] = {};

      for (const col of STAT_COLUMNS) {
        const val = r[col] ?? null;
        if (col.startsWith("home_")) {
          HOME[scoreKey][col.replace(/^home_/, "")] = val;
        } else if (col.startsWith("away_")) {
          AWAY[scoreKey][col.replace(/^away_/, "")] = val;
        }
      }
    }

    // スコア表示順を軽く調整（1st,2nd,ALL を先頭、その後に数値スコアを名前順）
    const preferred = ["1st", "2nd", "ALL"];
    const dynamicScores = Array.from(scoresSet)
      .filter((s) => !preferred.includes(s))
      .sort(localeCmp);
    const scores = [...preferred.filter((s) => scoresSet.has(s)), ...dynamicScores];

    return res.json({
      stats: { HOME, AWAY },
      meta: {
        teamJa,
        situations: Array.from(situationsSet),
        scores,
      },
    });
  } catch (e: any) {
    console.error("GET /api/stats failed:", {
      params: req.params,
      err: e?.message,
      stack: e?.stack,
    });
    return res.status(500).json({ message: "server error", detail: e?.message ?? String(e) });
  }
});

export default eachStatsRouter;

// -------------- helpers --------------
function safeDecode(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
function localeCmp(a: string, b: string) {
  return a.localeCompare(b, "ja");
}
