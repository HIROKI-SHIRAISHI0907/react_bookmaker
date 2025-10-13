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
  if (!t.includes(":")) return false; // "MM:SS" を基本想定
  const endWords = ["FT", "終了", "試合終了", "中止", "延期"];
  return !endWords.some((w) => t.includes(w));
}

function toIntOrNull(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v); // 念のため切り捨て
  if (typeof v === "string") {
    const cleaned = v.trim();
    if (!cleaned) return null;
    const num = Number.parseFloat(cleaned.replace(/[^0-9.\-]/g, ""));
    return Number.isFinite(num) ? Math.trunc(Math.floor(num)) : null;
  }
  return null;
}

function toFloatOrNull(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const num = Number.parseFloat(v.replace(/[^0-9.\-]/g, ""));
    return Number.isFinite(num) ? num : null;
  }
  return null;
}

function normalizeRow(r: any): LiveMatch {
  return {
    seq: Number(r.seq),
    data_category: String(r.data_category ?? "").trim(),
    times: String(r.times ?? "").trim(),
    home_team_name: String(r.home_team_name ?? "").trim(),
    away_team_name: String(r.away_team_name ?? "").trim(),
    home_score: toIntOrNull(r.home_score),
    away_score: toIntOrNull(r.away_score),
    home_exp: toFloatOrNull(r.home_exp),
    away_exp: toFloatOrNull(r.away_exp),
    home_shoot_in: toIntOrNull(r.home_shoot_in),
    away_shoot_in: toIntOrNull(r.away_shoot_in),
    record_time: r.record_time ?? r.update_time ?? null,
    link: r.goal_time ? String(r.goal_time) : r.link ?? null, // スキーマに合わせて調整
  };
}

/** A) 国・リーグ指定（必要な画面用） */
export async function fetchLiveMatchesByLeague(country: string, league: string): Promise<LiveMatch[]> {
  const url = `/api/live-matches?country=${encodeURIComponent(country)}&league=${encodeURIComponent(league)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("failed to fetch live matches");
  const json = await res.json();
  return (json ?? []).filter(isLiveRow).map(normalizeRow);
}

/** B) 当日全ライブ（国・リーグ関係なし） */
export async function fetchLiveMatchesTodayAll(): Promise<LiveMatch[]> {
  const res = await fetch(`/api/live-matches`);
  if (!res.ok) throw new Error("failed to fetch live matches (all)");
  const json = await res.json();
  return (json ?? []).filter(isLiveRow).map(normalizeRow);
}
