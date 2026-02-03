// frontend/src/api/rankHistory.ts(SpringBoot bookmakers-web bm_w012)
/**
 * チームのラウンドごとの順位変動データを取得する
 */
export async function fetchRankHistory(country, league) {
    const url = `/api/rank-history/${encodeURIComponent(country)}/${encodeURIComponent(league)}`;
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`rank history fetch failed: ${res.status} ${text}`);
    }
    const json = await res.json();
    // サーバー側のレスポンス形に合わせてここを調整してください
    return {
        items: (json.items ?? []),
    };
}
