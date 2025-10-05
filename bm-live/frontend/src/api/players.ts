// src/api/players.ts
export type Player = {
  id: string | number;
  name: string;
  position?: string;
  number?: number | null;
  nationality?: string;
  age?: number | null;
};

export async function fetchTeamPlayers(country: string, league: string, team: string): Promise<Player[]> {
  const url = `/api/teams/${encodeURIComponent(country)}/${encodeURIComponent(league)}/${encodeURIComponent(team)}/players`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`players fetch failed: ${res.status}`);
  return res.json();
}
