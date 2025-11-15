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

  // 役割依存の集計（既存）
  first_goal_count?: number | null;
  win_behind_count?: number | null;
  lose_behind_count?: number | null;
  win_count_role?: number | null;
  lose_count_role?: number | null;

  // 役割非依存（既存）
  fail_to_score_game_count?: number | null;

  // ▼ 追加：メインデータ（バックエンドが camelCase で返す想定）
  homeWinCount?: number | null;
  homeLoseCount?: number | null;
  awayWinCount?: number | null;
  awayLoseCount?: number | null;

  // バッジ（既存）
  consecutive_win_disp?: string | null;
  consecutive_lose_disp?: string | null;
  unbeaten_streak_disp?: string | null;
  consecutive_score_count_disp?: string | null;
  first_week_game_win_disp?: string | null;
  mid_week_game_win_disp?: string | null;
  last_week_game_win_disp?: string | null;
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

// ★ 追加: API が「値なし」で返すケース用
export type ScheduleOverviewNoData = { message: string };

// ★ 追加: 実際の API 返却は OK or NoData の Union
export type ScheduleOverviewApi = ScheduleOverviewResponse | ScheduleOverviewNoData;

export async function fetchScheduleOverview(country: string, league: string, seq: number, opts?: { home?: string; away?: string }): Promise<ScheduleOverviewApi> {
  const url = new URL(`/api/scheduled-overview/${encodeURIComponent(country)}/${encodeURIComponent(league)}/${encodeURIComponent(String(seq))}`, window.location.origin);
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
