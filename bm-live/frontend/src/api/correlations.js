export async function fetchTeamCorrelations(country, league, team, opponent) {
    const base = `/v1/api/leagues/correlations/${encodeURIComponent(country)}/${encodeURIComponent(league)}/${encodeURIComponent(team)}`;
    const url = opponent ? `${base}?opponent=${encodeURIComponent(opponent)}` : base;
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("fetchTeamCorrelations failed:", res.status, text);
        throw new Error(`Failed to fetch correlations: ${res.status}`);
    }
    return res.json();
}
