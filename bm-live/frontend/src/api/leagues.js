export async function fetchLeaguesGrouped() {
    const res = await fetch("/v1/api/leagues/grouped", { credentials: "include" });
    if (!res.ok)
        throw new Error("Failed to fetch leagues");
    return res.json();
}
export async function fetchTeamsInLeague(country, league) {
    const url = `/v1/api/leagues/${encodeURIComponent(country)}/${encodeURIComponent(league)}`;
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("fetchTeamsInLeague failed:", res.status, text);
        throw new Error(`Failed to fetch teams: ${res.status}`);
    }
    return res.json();
}
export async function fetchTeamDetail(country, league, teamEnglish) {
    const url = `/v1/api/leagues/${encodeURIComponent(country)}/${encodeURIComponent(league)}/${encodeURIComponent(teamEnglish)}`;
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok)
        throw new Error("Failed to fetch team detail");
    return res.json();
}
