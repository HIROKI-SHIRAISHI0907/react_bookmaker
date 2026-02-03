export async function fetchPastMatches(country, league, teamSlug, q) {
    const params = new URLSearchParams();
    if (q?.opponent)
        params.set("opponent", q.opponent);
    const url = `/api/${encodeURIComponent(country)}/${encodeURIComponent(league)}/${encodeURIComponent(teamSlug)}${params.toString() ? `?${params}` : ""}/history`;
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`history fetch failed: ${res.status} ${text}`);
    }
    const json = await res.json();
    return (json.matches ?? []);
}
