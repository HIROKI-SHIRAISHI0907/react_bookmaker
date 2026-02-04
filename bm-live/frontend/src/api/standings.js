export async function fetchLeagueStanding(countryRaw, leagueRaw) {
    const url = new URL(`/v1/api/standings/${encodeURIComponent(countryRaw)}/${encodeURIComponent(leagueRaw)}`, window.location.origin);
    const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
    if (!res.ok)
        throw new Error("Failed to fetch standings");
    return (await res.json());
}
