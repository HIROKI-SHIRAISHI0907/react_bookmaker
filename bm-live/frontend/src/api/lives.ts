// src/api/lives.ts

export type LiveMatch = {
  seq: number;
  data_category: string;
  times: string;
  home_team_name: string;
  away_team_name: string;
  home_score: number | null;
  away_score: number | null;
  home_exp?: number | null;
  away_exp?: number | null;
  home_shoot_in?: number | null;
  away_shoot_in?: number | null;
  record_time?: string | null;
  link?: string | null;
  // サーバーが付与する英語スラグ（country_league_master.link 由来）
  home_slug?: string | null;
  away_slug?: string | null;
};

function toIntOrNull(v: any): number | null {
  if (v == null || v === "") return null;
  // 数字以外（マイナス含む）を除去して整数へ
  const s = String(v).replace(/[^\d-]/g, "");
  if (s === "") return null;
  return Number.parseInt(s, 10);
}

function toFloatOrNull(v: any): number | null {
  if (v == null || v === "") return null;
  const s = String(v).replace(/[^0-9.\-]/g, "");
  if (s === "" || s === "." || s === "-" || s === "-.") return null;
  return Number(s);
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
    // サーバーが goal_time に URL を持ってくる実装だったため、念のため link に格納
    link: r.goal_time ?? null,
    home_slug: r.home_slug ?? null,
    away_slug: r.away_slug ?? null,
  };
}

/** “LIVE” 判定の最終フィルタ（サーバー側でも弾いているがフロントでも保険） */
function isLiveRow(r: any): boolean {
  const t = String(r?.times ?? "").trim();
  if (!t) return false;
  // 「終了」や FT を含むものは除外
  const endWords = ["FT", "終了", "試合終了", "中止", "延期"];
  if (endWords.some((w) => t.includes(w))) return false;
  // 基本は "MM:SS" / "MM'" / "MM+X'" 等を想定
  return /(\d{1,3}:\d{2}|\d{1,3}'|\d{1,3}\+\d{1,2}')/.test(t) || /(前半|後半|ハーフタイム)/.test(t);
}

/** A) 国・リーグ指定で本日の LIVE を取得 */
export async function fetchLiveMatchesByLeague(country: string, league: string): Promise<LiveMatch[]> {
  const url = `/api/live-matches?country=${encodeURIComponent(country)}&league=${encodeURIComponent(league)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`failed to fetch live matches (${res.status}) ${txt}`);
  }
  const json = await res.json();
  return (Array.isArray(json) ? json : []).filter(isLiveRow).map(normalizeRow);
}

/** B) 本日（全カテゴリ＝国・リーグ横断）の LIVE を取得 */
export async function fetchLiveMatchesTodayAll(): Promise<LiveMatch[]> {
  const res = await fetch(`/api/live-matches`, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`failed to fetch live matches (all) (${res.status}) ${txt}`);
  }
  const json = await res.json();
  return (Array.isArray(json) ? json : []).filter(isLiveRow).map(normalizeRow);
}
