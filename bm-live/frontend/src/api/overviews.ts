// src/api/overviews.ts

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
  round_no: number | null;
  future_time: string; // ISO
  game_year: number;
  game_month: number;
  home_team: string;
  away_team: string;
  link?: string | null;
};

export type SurfaceSnapshot = {
  team: string;
  games: number | null;
  win: number | null;
  draw: number | null;
  lose: number | null;
  winning_points: number | null;
  rank: number | null;

  // バッジなど（nullable想定）
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
  match: ScheduleMatch;
  surfaces: SurfaceSnapshot[]; // [homeチーム, awayチーム] の順を想定
};

export async function fetchScheduleOverview(country: string, league: string, seq: number): Promise<ScheduleOverviewResponse> {
  const url = new URL(`/api/overview/${encodeURIComponent(country)}/${encodeURIComponent(league)}/match/${seq}`, window.location.origin);
  const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Failed to fetch schedule overview");
  return (await res.json()) as ScheduleOverviewResponse;
}
