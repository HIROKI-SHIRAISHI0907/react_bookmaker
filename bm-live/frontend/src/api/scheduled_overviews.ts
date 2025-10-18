// frontend/src/api/scheduled_overviews.ts
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
  goals_for: number | null;
  clean_sheets: number | null;

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
    future_time: string | null;
    round_no: number | null;
    game_year: number | null;
    game_month: number | null;
  };
  surfaces: SurfaceSnapshot[];
};

export async function fetchScheduleOverview(country: string, league: string, seq: number, opts?: { home?: string; away?: string }): Promise<ScheduleOverviewResponse> {
  const url = new URL(`/api/scheduled-overview/${encodeURIComponent(country)}/${encodeURIComponent(league)}/${encodeURIComponent(String(seq))}`, window.location.origin);
  if (opts?.home) url.searchParams.set("home", opts.home);
  if (opts?.away) url.searchParams.set("away", opts.away);

  const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Failed to fetch schedule overview (${res.status})`);
  return (await res.json()) as ScheduleOverviewResponse;
}
