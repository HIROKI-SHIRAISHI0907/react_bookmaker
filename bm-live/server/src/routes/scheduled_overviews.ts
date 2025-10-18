// src/routes/scheduled_overviews.ts
import { Router } from "express";
import { prismaStats } from "../db";

export type SurfaceSnapshot = {
  team: string;
  game_year: number | null;
  game_month: number | null;

  rank: number | null;
  games: number | null;
  win: number | null;
  draw: number | null;
  lose: number | null;
  winning_points: number | null;

  // 合計系（ホーム＋アウェー）
  goals_for: number | null; // home_sum_score + away_sum_score
  clean_sheets: number | null; // home_clean_sheet + away_clean_sheet

  // バッジ用の表示列（あればそのまま）
  consecutive_win_disp?: string | null;
  consecutive_lose_disp?: string | null;
  unbeaten_streak_disp?: string | null;
  consecutive_score_count_disp?: string | null;
  first_win_disp?: string | null;
  lose_streak_disp?: string | null;
  promote_disp?: string | null;
  descend_disp?: string | null;
  home_adversity_disp?: string | null;
  away_adversity_disp?: string | null;
};

export type ScheduleOverviewResponse = {
  match: {
    seq: number;
    country: string;
    league: string;
    home_team: string;
    away_team: string;
    future_time: string | null; // 予定系テーブルが無いので null
    round_no: number | null; // 同上
    game_year: number | null; // 両チームの最新の年(大)を採用
    game_month: number | null; // 両チームの最新の月(大)を採用
  };
  surfaces: SurfaceSnapshot[]; // [home, away] の順で返す（片方だけでもOK）
};

const scheduledOverviewRouter = Router();

/**
 * GET /api/scheduled-overview/:country/:league/:seq?home=FC大阪&away=ガイナーレ鳥取
 *
 * 必須: country, league, seq（seqはIDとして見せる用）
 * 推奨: home, away（チーム名）… 未来試合テーブルが無い前提なのでここから特定する
 *
 * レスポンス: 各チームの surface_overview の「最新月」スナップショットを返す
 */
scheduledOverviewRouter.get("/:country/:league/:seq", async (req, res) => {
  const country = safeDecode(req.params.country ?? "");
  const league = safeDecode(req.params.league ?? "");
  const seqStr = String(req.params.seq ?? "");
  const seq = Number(seqStr);

  // チームはクエリで受け取る（未来試合テーブルが無いため）
  const homeTeam = safeDecode(String(req.query.home ?? "")).trim();
  const awayTeam = safeDecode(String(req.query.away ?? "")).trim();

  if (!country || !league || !seqStr || !Number.isFinite(seq)) {
    return res.status(400).json({ message: "country/league/seq are required" });
  }
  if (!homeTeam && !awayTeam) {
    return res.status(400).json({ message: "home or away query parameter is required (at least one)" });
  }

  try {
    const snapshots: SurfaceSnapshot[] = [];

    // 内部ヘルパー: 指定チームの最新月を1件とる
    const fetchLatest = async (teamName: string): Promise<SurfaceSnapshot | null> => {
      const rows = await prismaStats.$queryRawUnsafe<any[]>(
        `
        SELECT
          team::text AS team,
          NULLIF(BTRIM(game_year),  '')::int  AS game_year,
          NULLIF(BTRIM(game_month), '')::int  AS game_month,

          NULLIF(BTRIM(rank),            '')::int                AS rank,
          COALESCE(NULLIF(BTRIM(games),  '')::int, 0)            AS games,
          COALESCE(NULLIF(BTRIM(win),    '')::int, 0)            AS win,
          COALESCE(NULLIF(BTRIM(draw),   '')::int, 0)            AS draw,
          COALESCE(NULLIF(BTRIM(lose),   '')::int, 0)            AS lose,
          COALESCE(NULLIF(BTRIM(winning_points), '')::int, 0)    AS winning_points,

          -- 合計系
          COALESCE(NULLIF(BTRIM(home_sum_score),  '')::int, 0)
            + COALESCE(NULLIF(BTRIM(away_sum_score),  '')::int, 0) AS goals_for,
          COALESCE(NULLIF(BTRIM(home_clean_sheet), '')::int, 0)
            + COALESCE(NULLIF(BTRIM(away_clean_sheet), '')::int, 0) AS clean_sheets,

          -- バッジ系（文字列）
          consecutive_win_disp,
          consecutive_lose_disp,
          unbeaten_streak_disp,
          consecutive_score_count_disp,
          first_win_disp,
          lose_streak_disp,
          promote_disp,
          descend_disp,
          home_adversity_disp,
          away_adversity_disp

        FROM public.surface_overview
        WHERE country = $1 AND league = $2 AND team = $3
        ORDER BY
          NULLIF(BTRIM(game_year),  '')::int DESC,
          NULLIF(BTRIM(game_month), '')::int DESC
        LIMIT 1
        `,
        country,
        league,
        teamName
      );

      const r = rows[0];
      if (!r) return null;

      const snap: SurfaceSnapshot = {
        team: r.team,
        game_year: r.game_year ?? null,
        game_month: r.game_month ?? null,
        rank: r.rank ?? null,
        games: r.games ?? null,
        win: r.win ?? null,
        draw: r.draw ?? null,
        lose: r.lose ?? null,
        winning_points: r.winning_points ?? null,
        goals_for: r.goals_for ?? null,
        clean_sheets: r.clean_sheets ?? null,

        consecutive_win_disp: r.consecutive_win_disp ?? null,
        consecutive_lose_disp: r.consecutive_lose_disp ?? null,
        unbeaten_streak_disp: r.unbeaten_streak_disp ?? null,
        consecutive_score_count_disp: r.consecutive_score_count_disp ?? null,
        first_win_disp: r.first_win_disp ?? null,
        lose_streak_disp: r.lose_streak_disp ?? null,
        promote_disp: r.promote_disp ?? null,
        descend_disp: r.descend_disp ?? null,
        home_adversity_disp: r.home_adversity_disp ?? null,
        away_adversity_disp: r.away_adversity_disp ?? null,
      };
      return snap;
    };

    let homeSnap: SurfaceSnapshot | null = null;
    let awaySnap: SurfaceSnapshot | null = null;

    if (homeTeam) homeSnap = await fetchLatest(homeTeam);
    if (awayTeam) awaySnap = await fetchLatest(awayTeam);

    // 1件も取れない場合は404
    if (!homeSnap && !awaySnap) {
      return res.status(404).json({ message: "no surface_overview snapshot for given team(s)" });
    }

    // 見出しに使う年月は両者の新しい方
    const yms = [homeSnap, awaySnap]
      .filter(Boolean)
      .map((s) => ({ y: s!.game_year ?? 0, m: s!.game_month ?? 0 }))
      .sort((a, b) => (a.y === b.y ? b.m - a.m : b.y - a.y));
    const latest = yms[0] ?? { y: null as any, m: null as any };

    const resp: ScheduleOverviewResponse = {
      match: {
        seq,
        country,
        league,
        home_team: homeSnap?.team ?? (homeTeam || ""),
        away_team: awaySnap?.team ?? (awayTeam || ""),
        future_time: null,
        round_no: null,
        game_year: latest?.y ?? null,
        game_month: latest?.m ?? null,
      },
      surfaces: [homeSnap, awaySnap].filter(Boolean) as SurfaceSnapshot[],
    };

    return res.json(resp);
  } catch (e: any) {
    console.error("[GET /api/scheduled-overview/:country/:league/:seq] error", {
      params: req.params,
      query: req.query,
      err: e?.message,
    });
    return res.status(500).json({ message: "server error", detail: e?.message ?? String(e) });
  }
});

export default scheduledOverviewRouter;

function safeDecode(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
