// src/api/eachstats.ts
export type SideKey = "HOME" | "AWAY";
export type ScoreKey = "1st" | "2nd" | "ALL" | string;

// サーバーが返す “生” 形
export type RawFeatureBag = Record<string, string | null>;
export type RawStats = {
  HOME: Record<string, RawFeatureBag>;
  AWAY: Record<string, RawFeatureBag>;
};
export type TeamStatsResponseRaw = {
  stats: RawStats;
  meta?: any;
};

// グラフが使う “整形後” 形
export type StatPoint = {
  metric: string;
  min: number | null;
  minAt: number | null;
  max: number | null;
  maxAt: number | null;
  avg: number | null;
  avgAt: number | null;
  variance: number | null;
  varianceAt: number | null;
  skewness: number | null;
  kurtosis: number | null;
};
export type StatsBySideScore = {
  HOME: Record<ScoreKey, StatPoint[]>;
  AWAY: Record<ScoreKey, StatPoint[]>;
};
export type TeamStatsResponse = {
  stats: StatsBySideScore;
  meta?: any;
};

// CSV を StatPoint に変換
export function parsePackedStat(raw: string | null): Omit<StatPoint, "metric"> {
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
  const skewness = nums.length >= 2 ? nums[nums.length - 2] ?? null : null;
  const kurtosis = nums.length >= 1 ? nums[nums.length - 1] ?? null : null;
  return { min, minAt, max, maxAt, avg, avgAt, variance, varianceAt, skewness, kurtosis };
}

// “生” → “整形” に変換
export function normalizeStats(raw: RawStats): StatsBySideScore {
  const convertSide = (sideObj: Record<string, RawFeatureBag>) => {
    const byScore: Record<string, StatPoint[]> = {};
    for (const [scoreKey, bag] of Object.entries(sideObj ?? {})) {
      const arr: StatPoint[] = Object.entries(bag ?? {}).map(([metric, csv]) => ({
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
export async function fetchTeamFeatureStats(country: string, league: string, teamEnglish: string): Promise<TeamStatsResponse> {
  const url = `/api/stats/${encodeURIComponent(country)}/${encodeURIComponent(league)}/${encodeURIComponent(teamEnglish)}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`stats fetch failed: ${res.status} ${text}`);
  }
  const json: TeamStatsResponseRaw = await res.json();
  return { stats: normalizeStats(json.stats), meta: json.meta };
}
