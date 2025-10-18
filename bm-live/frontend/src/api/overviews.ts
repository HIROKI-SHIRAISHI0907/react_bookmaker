// frontend/src/api/overview.ts
export type MonthlyOverview = {
  ym: string;
  label: string;
  year: number;
  month: number;
  rank: number | null;

  // ベース
  winningPoints: number;
  games: number;
  win: number;
  draw: number;
  lose: number;

  // トータル
  goalsFor: number;
  cleanSheets: number;

  // Home/Away 明細
  homeGoalsFor: number;
  homeGoals1st: number;
  homeGoals2nd: number;
  homeCleanSheets: number;
  homeWins: number;
  homeLoses: number;
  homeFirstGoals: number;

  awayGoalsFor: number;
  awayGoals1st: number;
  awayGoals2nd: number;
  awayCleanSheets: number;
  awayWins: number;
  awayLoses: number;
  awayFirstGoals: number;
};

export type MonthlyOverviewResponse = { items: MonthlyOverview[] };

export async function fetchMonthlyOverview(country: string, league: string, teamSlug: string): Promise<MonthlyOverviewResponse> {
  const url = new URL(`/api/overview/${encodeURIComponent(country)}/${encodeURIComponent(league)}/${encodeURIComponent(teamSlug)}`, window.location.origin);
  const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Failed to fetch monthly overview");
  return (await res.json()) as MonthlyOverviewResponse;
}
