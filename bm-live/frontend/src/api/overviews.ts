export type SurfaceOverview = {
  country: string;
  league: string;
  game_year: string;
  game_month: string;
  team: string;
  games: number | null;
  rank: number | null;
  win: number | null;
  draw: number | null;
  lose: number | null;
  winning_points: number | null;
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
    future_time: string;
    round_no: number | null;
    game_team_category: string | null;
    home_team: string;
    away_team: string;
    game_year: number;
    game_month: number;
  };
  surfaces: SurfaceOverview[];
};

export async function fetchScheduleOverview(country: string, league: string, seq: number): Promise<ScheduleOverviewResponse> {
  const url = `/api/schedule-overview/${encodeURIComponent(country)}/${encodeURIComponent(league)}/${seq}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("failed to fetch schedule overview");
  return res.json();
}
