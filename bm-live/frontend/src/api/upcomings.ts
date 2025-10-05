// frontend/src/api/upcomings.ts
export type FutureMatch = {
  seq: number;
  game_team_category: string;
  future_time: string; // ISO
  home_team: string;
  away_team: string;
  link: string | null;
  round_no: number | null;
  status: "LIVE" | "SCHEDULED";
};

export async function fetchFutureMatches(team?: string): Promise<FutureMatch[]> {
  const qs = team ? `?team=${encodeURIComponent(team)}` : "";
  const res = await fetch(`/api/future${qs}`, { credentials: "include" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`future fetch failed: ${res.status} ${text}`);
  }
  const json = await res.json();
  return (json.matches ?? []) as FutureMatch[];
}
