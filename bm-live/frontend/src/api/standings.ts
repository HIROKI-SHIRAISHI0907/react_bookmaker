// src/api/standings.ts
export type StandingRow = {
  position: number;
  teamName: string; // 表示名（日本語）
  teamEnglish: string; // ルーティング用 slug
  game: number;
  win: number;
  draw: number;
  lose: number;
  winningPoints: number;
};

export type LeagueStanding = {
  season?: string;
  updatedAt?: string;
  rows: StandingRow[];
};

export async function fetchLeagueStanding(countryRaw: string, leagueRaw: string): Promise<LeagueStanding> {
  const url = new URL(`/api/standings/${encodeURIComponent(countryRaw)}/${encodeURIComponent(leagueRaw)}`, window.location.origin);

  const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Failed to fetch standings");
  return (await res.json()) as LeagueStanding;
}
