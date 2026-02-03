export async function fetchTeamPlayers(teamSlug, opts) {
    const { country, league } = opts;
    const url = `/api/players/${encodeURIComponent(country)}/${encodeURIComponent(league)}/${encodeURIComponent(teamSlug)}`;
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`players fetch failed: ${res.status} ${text}`);
    }
    const json = await res.json();
    return (json.players ?? []);
}
