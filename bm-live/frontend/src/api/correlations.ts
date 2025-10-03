// frontend/src/api/correlations.ts
export type CorrelationsBySideScore = {
  HOME: {
    "1st": Array<{ metric: string; value: number }>;
    "2nd": Array<{ metric: string; value: number }>;
    ALL: Array<{ metric: string; value: number }>;
  };
  AWAY: {
    "1st": Array<{ metric: string; value: number }>;
    "2nd": Array<{ metric: string; value: number }>;
    ALL: Array<{ metric: string; value: number }>;
  };
};

export async function fetchTeamCorrelations(country: string, league: string, team: string): Promise<CorrelationsBySideScore> {
  const url = `/api/leagues/${encodeURIComponent(country)}/${encodeURIComponent(league)}/${encodeURIComponent(team)}/correlations`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("fetchTeamCorrelations failed:", res.status, text);
    throw new Error(`Failed to fetch correlations: ${res.status}`);
  }

  const json = await res.json();
  // 期待形: { team, country, league, correlations: CorrelationsBySideScore }
  if (json?.correlations) return json.correlations as CorrelationsBySideScore;

  // （必要なら）古い配列形式から変換するフォールバックをここに置けます
  // …省略…

  // 最低限の空形
  return {
    HOME: { "1st": [], "2nd": [], ALL: [] },
    AWAY: { "1st": [], "2nd": [], ALL: [] },
  };
}
