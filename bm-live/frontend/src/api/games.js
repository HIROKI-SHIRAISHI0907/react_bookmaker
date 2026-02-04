/**
 * 開催中/試合終了の試合を取得（/api/games/:country/:league/:team）
 * - backend 側で、public.data の最大 seq(=最新) に紐づく times を持ってきて、
 *   「終了済」を含むなら FINISHED、含まなければ LIVE に振り分けます
 */
export async function fetchTeamGames(teamSlug, opts) {
    const { country, league } = opts;
    const url = `/v1/api/games/${encodeURIComponent(country)}/${encodeURIComponent(league)}/${encodeURIComponent(teamSlug)}`;
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`games fetch failed: ${res.status} ${text}`);
    }
    const json = await res.json();
    // 安全側：型整形
    return {
        live: (json.live ?? []),
        finished: (json.finished ?? []),
    };
}
