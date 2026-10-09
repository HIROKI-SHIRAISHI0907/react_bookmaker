// チームの過去の結果（/v1/api/team-results）・お気に入り編集（/v1/api/favorite-edit）の API
import type { FavoriteEditResponse, FavoriteLeague, FavoriteTeamCandidate, TeamResultsResponse } from "./teamtypes";
import { getAccessToken, getTokenType } from "../../utils/auth";

/**
 * JWT（Authorization ヘッダー）。
 * 既存の保存キーが分からないため、よく使うキーを順に探す（見つかった値が "Bearer xxx" でも "xxx" でも可）。
 * TODO: utils/auth にトークン取得関数があれば、それに置き換える。
 */
const TOKEN_KEYS = ["accessToken", "access_token", "token", "jwt", "authToken", "idToken"];

function findToken(): string | null {
  try {
    for (const store of [localStorage, sessionStorage]) {
      for (const k of TOKEN_KEYS) {
        const v = store.getItem(k);
        if (v) return v;
      }
      // { token: "..." } 形式で保存している場合（auth / user など）
      for (const k of ["auth", "user", "session"]) {
        const raw = store.getItem(k);
        if (!raw) continue;
        try {
          const o = JSON.parse(raw);
          const v = o?.accessToken ?? o?.token ?? o?.access_token ?? o?.jwt;
          if (typeof v === "string" && v) return v;
        } catch {
          /* JSON でなければ無視 */
        }
      }
    }
  } catch {
    /* storage が使えない環境 */
  }
  return null;
}

function authHeader(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `${getTokenType()} ${token}` } : {};
}

/** 401（未ログイン・トークン切れ）。画面側でログインページへ飛ばすために区別する */
export class UnauthorizedError extends Error {
  constructor() {
    super("ログインが必要です");
    this.name = "UnauthorizedError";
  }
}
export const isUnauthorized = (e: unknown): boolean => e instanceof UnauthorizedError;

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    cache: "no-store",
    credentials: "include", // Cookie 認証の場合にも送る
    ...init,
    headers: { Accept: "application/json", ...(init.body ? { "Content-Type": "application/json" } : {}), ...authHeader(), ...(init.headers ?? {}) },
  });
  if (res.status === 401) throw new UnauthorizedError();
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) throw new Error("API に届いていません（JSON 以外が返りました）");
  return res.json() as Promise<T>;
}

/** チームの過去の結果（直近 limit ラウンド） */
export const fetchTeamResults = (country: string, league: string, team: string, limit = 5) => {
  const q = new URLSearchParams({ country, league, team, limit: String(limit) });
  return request<TeamResultsResponse>(`/v1/api/team-results?${q.toString()}`);
};

const FAV = "/v1/api/favorite-edit";

export const fetchFavoriteTeams = () => request<FavoriteEditResponse>(`${FAV}/teams`);
export const fetchFavoriteLeagues = () => request<FavoriteLeague[]>(`${FAV}/leagues`);
export const searchFavoriteCandidates = (q: string, country: string, league: string) => {
  const p = new URLSearchParams({ q, country, league });
  return request<FavoriteTeamCandidate[]>(`${FAV}/search?${p.toString()}`);
};
export const addFavoriteTeam = (country: string, league: string, team: string) => request<FavoriteEditResponse>(`${FAV}/teams`, { method: "POST", body: JSON.stringify({ country, league, team }) });
export const deleteFavoriteTeam = (id: number) => request<FavoriteEditResponse>(`${FAV}/teams/${id}`, { method: "DELETE" });
