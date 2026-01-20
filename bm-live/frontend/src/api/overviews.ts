// src/api/overviews.ts(SpringBoot bookmakers-web bm_w003)

// ===== 月次サマリ（既存） =====
export type MonthlyOverview = {
  ym: string;
  label: string;
  year: number;
  month: number;
  rank: number | null;
  winningPoints: number;
  cleanSheets: number;
  goalsFor: number;
  goalsAgainst: number;
  games: number;

  // （勝・分・負も使うなら）
  win?: number;
  draw?: number;
  lose?: number;
};

export type MonthlyOverviewResponse = {
  items: MonthlyOverview[];
};

export async function fetchMonthlyOverview(country: string, league: string, teamSlug: string): Promise<MonthlyOverviewResponse> {
  const url = new URL(`/api/overview/${encodeURIComponent(country)}/${encodeURIComponent(league)}/${encodeURIComponent(teamSlug)}`, window.location.origin);
  const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Failed to fetch monthly overview");
  return (await res.json()) as MonthlyOverviewResponse;
}

// ====== 試合ごとの「開催予定 詳細」用 ======

export type ScheduleMatch = {
  seq: number;
  roundNo: number | null;
  futureTime: string; // ISO
  gameYear: number;
  gameMonth: number;
  homeTeam: string;
  awayTeam: string;
  link?: string | null;
};

export type SurfaceSnapshot = {
  team: string;
  games: number | null;
  win: number | null;
  draw: number | null;
  lose: number | null;
  winningPoints: number | null;
  rank: number | null;

  // バッジなど（nullable想定）
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
  match: ScheduleMatch;
  surfaces: SurfaceSnapshot[]; // [homeチーム, awayチーム] の順を想定
};

export async function fetchScheduleOverview(country: string, league: string, seq: number): Promise<ScheduleOverviewResponse> {
  const url = new URL(`/api/overview/${encodeURIComponent(country)}/${encodeURIComponent(league)}/match/${seq}`, window.location.origin);
  const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Failed to fetch schedule overview");
  return (await res.json()) as ScheduleOverviewResponse;
}
