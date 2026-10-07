// Dashboard（トップ画面）の API 呼び出し
import type {
  DashboardFavoriteResponse,
  DashboardLiveResponse,
  DashboardSummaryResponse,
  DashboardUpcomingResponse,
} from "./types";

const BASE = "/v1/api/dashboard";

/**
 * JWT（Authorization ヘッダー）。
 * TODO: utils/auth にトークンを取り出す関数があれば、それに置き換える（保存しているキー名に合わせる）。
 */
function authHeader(): Record<string, string> {
  let token: string | null = null;
  try {
    token = localStorage.getItem("accessToken") ?? sessionStorage.getItem("accessToken");
  } catch {
    token = null;
  }
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
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
export const fetchDashboardUpcoming = (limit = 20) => getJson<DashboardUpcomingResponse>(`/upcoming?limit=${limit}`);
export const fetchDashboardFavorites = () => getJson<DashboardFavoriteResponse>("/favorites");
