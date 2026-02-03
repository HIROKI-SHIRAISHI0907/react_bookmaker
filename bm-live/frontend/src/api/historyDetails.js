/**
 * 履歴詳細を取得
 * GET /api/{country}/{league}/{team}/{seq}/history
 * 返却: { detail: {...} }
 */
export async function fetchHistoryDetail(country, league, teamSlug, seq) {
    const url = `/api/${encodeURIComponent(country)}` + `/${encodeURIComponent(league)}` + `/${encodeURIComponent(teamSlug)}` + `/${encodeURIComponent(seq)}/history`;
    const res = await fetch(url, { credentials: "include", headers: { Accept: "application/json" } });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`history detail fetch failed: ${res.status} ${text}`);
    }
    const json = await res.json();
    // サーバは { detail: {...} } 形式
    return (json?.detail ?? null);
}
