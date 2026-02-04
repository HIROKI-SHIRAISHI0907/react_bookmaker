export async function fetchScheduleOverview(country, league, seq, opts) {
    const url = new URL(`/v1/api/scheduled-overview/${encodeURIComponent(country)}/${encodeURIComponent(league)}/${encodeURIComponent(String(seq))}`, window.location.origin);
    if (opts?.home)
        url.searchParams.set("home", opts.home);
    if (opts?.away)
        url.searchParams.set("away", opts.away);
    const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
    if (!res.ok)
        throw new Error(`Failed to fetch schedule overview (${res.status})`);
    const json = await res.json();
    // ★ runtime ガード: surfaces が配列なら OK、そうでなければ {message} 扱いに正規化
    if (json && Array.isArray(json.surfaces)) {
        return json;
    }
    return { message: String(json?.message ?? "no surface_overview snapshot for given team(s)") };
}
