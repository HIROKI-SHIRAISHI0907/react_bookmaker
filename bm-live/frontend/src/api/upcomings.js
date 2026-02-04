// frontend/src/api/upcomings.ts(SpringBoot bookmakers-web bm_w001)
// GET /api/future/:country/:league/:team
export async function fetchFutureMatches(teamSlug, opts) {
    const { country, league } = opts;
    const url = `/v1/api/future/${encodeURIComponent(country)}/${encodeURIComponent(league)}/${encodeURIComponent(teamSlug)}`;
    const res = await fetch(url, { credentials: "include", headers: { Accept: "application/json" } });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("[future] %s for %s", res.status, url);
        throw new Error(`future fetch failed: ${res.status} ${text}`);
    }
    const json = (await res.json());
    // 念のため整形（number/nullの正規化）
    const matches = (json.matches ?? []).map((m) => ({
        seq: Number(m.seq),
        gameTeamCategory: String(m.gameTeamCategory ?? ""),
        futureTime: String(m.futureTime ?? ""),
        homeTeam: String(m.homeTeam ?? ""),
        awayTeam: String(m.awayTeam ?? ""),
        link: m.link ?? null,
        roundNo: m.roundNo == null ? null : Number(m.roundNo),
        status: (m.status ?? "SCHEDULED"),
    }));
    return matches;
}
