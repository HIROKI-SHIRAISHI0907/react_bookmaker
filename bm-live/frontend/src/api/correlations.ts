// frontend/src/api/correlations.ts
export type CorrelationItem = { metric: string; value: number };

export type CorrelationsBySideScore = {
  HOME: { "1st": CorrelationItem[]; "2nd": CorrelationItem[]; ALL: CorrelationItem[] };
  AWAY: { "1st": CorrelationItem[]; "2nd": CorrelationItem[]; ALL: CorrelationItem[] };
};

export type TeamCorrelationsPayload = {
  team: string;
  country: string;
  league: string;
  opponent: string | null;
  opponents: string[];
  correlations: CorrelationsBySideScore;
};

export async function fetchTeamCorrelations(country: string, league: string, team: string, opponent?: string): Promise<TeamCorrelationsPayload> {
  const base = `/api/leagues/${encodeURIComponent(country)}/${encodeURIComponent(league)}/${encodeURIComponent(team)}/correlations`;
  const url = opponent ? `${base}?opponent=${encodeURIComponent(opponent)}` : base;

  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("fetchTeamCorrelations failed:", res.status, text);
    throw new Error(`Failed to fetch correlations: ${res.status}`);
  }
  return res.json();
}
