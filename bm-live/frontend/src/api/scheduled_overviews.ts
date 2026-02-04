// frontend/src/api/scheduled_overviews.ts(SpringBoot bookmakers-web bm_w004)
export type SurfaceSnapshot = {
  team: string;
  gameYear: number | null;
  gameMonth: number | null;
  rank: number | null;
  games: number | null;
  win: number | null;
  draw: number | null;
  lose: number | null;
  winningPoints: number | null;

  // 既存
  goalsFor: number | null;
  cleanSheets: number | null;
  firstHalfScore: number | null;
  secondHalfScore: number | null;

  // 役割依存の集計（既存）
  firstGoalCount?: number | null;
  winBehindCount?: number | null;
  loseBehindCount?: number | null;
  winCountRole?: number | null;
  loseCountRole?: number | null;

  // 役割非依存（既存）
  failToScoreGameCount?: number | null;

  // ▼ 追加：メインデータ（バックエンドが camelCase で返す想定）
  homeWinCount?: number | null;
  homeLoseCount?: number | null;
  awayWinCount?: number | null;
  awayLoseCount?: number | null;

  // バッジ（既存）
  consecutiveWinDisp?: string | null;
  consecutiveLoseDisp?: string | null;
  unbeatenStreakDisp?: string | null;
  consecutiveScoreCountDisp?: string | null;
  firstWeekGameWinDisp?: string | null;
  midWeekGameWinDisp?: string | null;
  lastWeekGameWinDisp?: string | null;
  firstWinDisp?: string | null;
  loseStreakDisp?: string | null;
  promoteDisp?: string | null;
  descendDisp?: string | null;
  homeAdversityDisp?: string | null;
  awayAdversityDisp?: string | null;
};

export type ScheduleOverviewResponse = {
  match: {
    seq: number;
    country: string;
    league: string;
    home_team: string;
    away_team: string;
    future_time: string | null;
    round_no: number | null;
    game_year: number | null;
    game_month: number | null;
  };
  surfaces: SurfaceSnapshot[];
};

// ★ 追加: API が「値なし」で返すケース用
export type ScheduleOverviewNoData = { message: string };

// ★ 追加: 実際の API 返却は OK or NoData の Union
export type ScheduleOverviewApi = ScheduleOverviewResponse | ScheduleOverviewNoData;

export async function fetchScheduleOverview(country: string, league: string, seq: number, opts?: { home?: string; away?: string }): Promise<ScheduleOverviewApi> {
  const url = new URL(`/v1/api/scheduled-overview/${encodeURIComponent(country)}/${encodeURIComponent(league)}/${encodeURIComponent(String(seq))}`, window.location.origin);
  if (opts?.home) url.searchParams.set("home", opts.home);
  if (opts?.away) url.searchParams.set("away", opts.away);

  const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Failed to fetch schedule overview (${res.status})`);

  const json = await res.json();

  // ★ runtime ガード: surfaces が配列なら OK、そうでなければ {message} 扱いに正規化
  if (json && Array.isArray(json.surfaces)) {
    return json as ScheduleOverviewResponse;
  }
  return { message: String(json?.message ?? "no surface_overview snapshot for given team(s)") };
}
