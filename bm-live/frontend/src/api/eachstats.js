// CSV を StatPoint に変換
export function parsePackedStat(raw) {
    const s = (raw ?? "").replace(/'/g, "");
    if (!s) {
        return {
            min: null,
            minAt: null,
            max: null,
            maxAt: null,
            avg: null,
            avgAt: null,
            variance: null,
            varianceAt: null,
            skewness: null,
            kurtosis: null,
        };
    }
    const nums = s.split(",").map((t) => {
        const v = Number(t.trim());
        return Number.isFinite(v) ? v : null; // "NaN" や "null" は null に
    });
    // 先頭8つは固定（min〜varianceAt）、Skew/Kurtは末尾2つを採用
    const min = nums[0] ?? null;
    const minAt = nums[1] ?? null;
    const max = nums[2] ?? null;
    const maxAt = nums[3] ?? null;
    const avg = nums[4] ?? null;
    const avgAt = nums[5] ?? null;
    const variance = nums[6] ?? null;
    const varianceAt = nums[7] ?? null;
    const skewness = nums.length >= 2 ? (nums[nums.length - 2] ?? null) : null;
    const kurtosis = nums.length >= 1 ? (nums[nums.length - 1] ?? null) : null;
    return { min, minAt, max, maxAt, avg, avgAt, variance, varianceAt, skewness, kurtosis };
}
// “生” → “整形” に変換
export function normalizeStats(raw) {
    const convertSide = (sideObj) => {
        const byScore = {};
        for (const [scoreKey, bag] of Object.entries(sideObj ?? {})) {
            const arr = Object.entries(bag ?? {}).map(([metric, csv]) => ({
                metric,
                ...parsePackedStat(csv),
            }));
            byScore[scoreKey] = arr;
        }
        return byScore;
    };
    return {
        HOME: convertSide(raw.HOME ?? {}),
        AWAY: convertSide(raw.AWAY ?? {}),
    };
}
// 取得関数（整形して返す）
export async function fetchTeamFeatureStats(country, league, teamEnglish) {
    const url = `/api/stats/${encodeURIComponent(country)}/${encodeURIComponent(league)}/${encodeURIComponent(teamEnglish)}`;
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`stats fetch failed: ${res.status} ${text}`);
    }
    const json = await res.json();
    return { stats: normalizeStats(json.stats), meta: json.meta };
}
