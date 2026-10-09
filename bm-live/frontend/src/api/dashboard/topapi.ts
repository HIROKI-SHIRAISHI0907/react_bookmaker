// Dashboard（トップ画面）の API 呼び出し
import type { DashboardFavoriteResponse, DashboardLiveResponse, DashboardSummaryResponse, DashboardUpcomingResponse } from "./types";
import { getAccessToken, getTokenType } from "../../utils/auth";

const BASE = "/v1/api/dashboard";

/** JWT（Authorization ヘッダー）。utils/auth の authSession から取り出す */
function authHeader(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `${getTokenType()} ${token}` } : {};
}

async function getJson<T>(path: string, base: string = BASE): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json", ...authHeader() },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    throw new Error("API に届いていません（JSON 以外が返りました）");
  }
  return res.json() as Promise<T>;
}

export const fetchDashboardSummary = () => getJson<DashboardSummaryResponse>("/summary");
export const fetchDashboardLive = () => getJson<DashboardLiveResponse>("/live");
/** トップ画面: リーグごとに直近 perLeague 試合・最大 maxLeagues リーグ（0 なら全リーグ） */
export const fetchDashboardUpcoming = (perLeague = 3, maxLeagues = 5) => getJson<DashboardUpcomingResponse>(`/upcoming?perLeague=${perLeague}&maxLeagues=${maxLeagues}`);

/** 全試合画面（UpcomingMatches.tsx）: hours 時間後までの全試合（league を付けるとそのリーグだけ） */
export const fetchUpcomingMatches = (hours = 36, league?: string) => {
  const q = new URLSearchParams({ hours: String(hours) });
  if (league) q.set("league", league);
  return getJson<DashboardUpcomingResponse>(`?${q.toString()}`, "/v1/api/upcoming-matches");
};
export const fetchDashboardFavorites = () => getJson<DashboardFavoriteResponse>("/favorites");
