// データ別のランキングと順位の変遷の API（/v1/api/rankings。2026-11-28 追加）
import { getAccessToken, getTokenType } from "../../utils/auth";

export type RankingLeague = { country: string; league: string; teamCount: number };

export type RankingMetric = {
  key: string;
  label: string;
  /** RESULT = 結果 / STAT = スタッツ */
  type: "RESULT" | "STAT";
  unit: string;
  higherBetter: boolean;
  /** このリーグで出せるか（スタッツは統計ができたリーグだけ） */
  available: boolean;
};

export type RankingMetricsResponse = {
  country: string;
  league: string;
  season: string | null;
  source: "STATS" | "STATIC";
  metrics: RankingMetric[];
};

/** ラウンドの 1 点（試合が無い・取れていないラウンドは rank・value が null） */
export type RankingPoint = { round: number; rank: number | null; value: number | null };

export type RankingTeam = {
  rank: number | null;
  team: string;
  value: number | null;
  games: number;
  lastRound: number | null;
  colorMain: string | null;
  colorSub: string | null;
  series: RankingPoint[];
};

export type RankingResponse = {
  country: string;
  league: string;
  season: string | null;
  source: "STATS" | "STATIC" | null;
  metric: string;
  label: string;
  unit: string;
  higherBetter: boolean;
  scale: number;
  rounds: number[];
  teams: RankingTeam[];
  notes: string[];
};

function authHeader(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `${getTokenType()} ${token}` } : {};
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store", headers: { Accept: "application/json", ...authHeader() } });
  const ct = res.headers.get("content-type") ?? "";
  if (!res.ok) {
    if (ct.includes("application/json")) {
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      if (body?.message) throw new Error(body.message);
    }
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
  if (!ct.includes("application/json")) throw new Error("API に届いていません（JSON 以外が返りました）");
  return res.json() as Promise<T>;
}

export const fetchRankingLeagues = () => getJson<RankingLeague[]>("/v1/api/rankings/leagues");

export const fetchRankingMetrics = (country: string, league: string) =>
  getJson<RankingMetricsResponse>(`/v1/api/rankings/metrics?${new URLSearchParams({ country, league }).toString()}`);

export const fetchRanking = (country: string, league: string, metric: string) =>
  getJson<RankingResponse>(`/v1/api/rankings?${new URLSearchParams({ country, league, metric }).toString()}`);
