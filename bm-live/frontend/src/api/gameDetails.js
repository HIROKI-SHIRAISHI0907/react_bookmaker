export async function fetchGameDetail(country, league, teamSlug, seq) {
    const url = `/api/games/detail/${encodeURIComponent(country)}/${encodeURIComponent(league)}/${encodeURIComponent(teamSlug)}/${encodeURIComponent(seq)}`;
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`game detail fetch failed: ${res.status} ${text}`);
    }
    const json = await res.json();
    return json.detail;
}
