// src/api/overviews.ts(SpringBoot bookmakers-web bm_w003)
export async function fetchMonthlyOverview(country, league, teamSlug) {
    const url = new URL(`/v1/api/overview/${encodeURIComponent(country)}/${encodeURIComponent(league)}/${encodeURIComponent(teamSlug)}`, window.location.origin);
    const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
    if (!res.ok)
        throw new Error("Failed to fetch monthly overview");
    return (await res.json());
}
export async function fetchScheduleOverview(country, league, seq) {
    const url = new URL(`/v1/api/overview/${encodeURIComponent(country)}/${encodeURIComponent(league)}/match/${seq}`, window.location.origin);
    const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
    if (!res.ok)
        throw new Error("Failed to fetch schedule overview");
    return (await res.json());
}
