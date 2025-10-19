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

  // 既存
  goals_for: number | null;
  clean_sheets: number | null;
  first_half_score: number | null;
  second_half_score: number | null;

  // ▼ 新規: 役割で home/away を自動切替して返す
  first_goal_count?: number | null; // 先制回数
  win_behind_count?: number | null; // 逆転勝利数
  lose_behind_count?: number | null; // 逆転敗北数
  win_count_role?: number | null; // （home or away の）勝利数
  lose_count_role?: number | null; // （home or away の）敗北数

  // 役割に依存しないカウント（そのまま）
  fail_to_score_game_count?: number | null;

  // バッジ表示は現状通り
  consecutive_win_disp?: string | null;
  consecutive_lose_disp?: string | null;
  unbeaten_streak_disp?: string | null;
  consecutive_score_count_disp?: string | null;
  first_week_game_win_disp?: string | null;
  mid_week_game_win_disp?: string | null;
  last_week_game_win_disp?: string | null;
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
