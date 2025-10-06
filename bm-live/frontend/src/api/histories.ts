// frontend/src/api/history.ts
export type PastMatch = {
  seq: number;
  match_time: string; // ISO (終了時刻 or キックオフ時刻)
  game_team_category: string;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  round_no: number | null;
  link: string | null;
};

export type PastQuery = {
  opponent?: string; // 相手を絞るなら指定、未指定なら全件（ページ側で絞りUIを後付け可）
};

export async function fetchPastMatches(country: string, league: string, teamSlug: string, q?: PastQuery): Promise<PastMatch[]> {
  const params = new URLSearchParams();
  if (q?.opponent) params.set("opponent", q.opponent);

  const url = `/api/history/${encodeURIComponent(country)}/${encodeURIComponent(league)}/${encodeURIComponent(teamSlug)}${params.toString() ? `?${params}` : ""}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`history fetch failed: ${res.status} ${text}`);
  }
  const json = await res.json();
  return (json.matches ?? []) as PastMatch[];
}
