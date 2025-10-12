// src/api/lives.ts
export type LiveMatch = {
  seq: number;
  data_category: string; // 例: "アルゼンチン: ... - ラウンド 12"
  times: string; // 例: "90:58"
  home_team_name: string;
  away_team_name: string;
  home_score: number | null;
  away_score: number | null;
  home_exp?: number | null;
  away_exp?: number | null;
  home_shoot_in?: number | null;
  away_shoot_in?: number | null;
  record_time?: string | null;
  link?: string | null; // 外部詳細URL（あれば）
};

function isLiveRow(r: any) {
  if (!r?.times) return false;
  const t = String(r.times).trim();
  if (!t.includes(":")) return false; // "MM:SS" 想定
  const endWords = ["FT", "終了", "試合終了", "中止", "延期"];
  return !endWords.some((w) => t.includes(w));
}

export async function fetchLiveMatchesAll(): Promise<LiveMatch[]> {
  const res = await fetch(`/api/live-matches`); // ← クエリ無し＝全件
  if (!res.ok) throw new Error("failed to fetch live matches");
  const json = await res.json();
  return (json ?? []).map((r: any) => ({
    seq: Number(r.seq),
    data_category: String(r.data_category ?? "").trim(),
    times: String(r.times ?? "").trim(),
    home_team_name: String(r.home_team_name ?? "").trim(),
    away_team_name: String(r.away_team_name ?? "").trim(),
    home_score: r.home_score ?? null,
    away_score: r.away_score ?? null,
    home_exp: r.home_exp ?? null,
    away_exp: r.away_exp ?? null,
    home_shoot_in: r.home_shoot_in ?? null,
    away_shoot_in: r.away_shoot_in ?? null,
    record_time: r.record_time ?? r.update_time ?? null,
    link: r.goal_time ? String(r.goal_time) : r.link ?? null,
  }));
}
