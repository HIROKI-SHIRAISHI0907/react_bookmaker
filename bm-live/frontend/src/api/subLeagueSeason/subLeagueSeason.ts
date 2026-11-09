// サブリーグ保有国リーグ登録設定（/admin/sub-league-season）の API（2026-11-09 追加）
//  GET  /v1/api/admin/sub-league-season       国・リーグ ごとの設定（未設定・サブリーグあり（名前つき）・なし）
//  POST /v1/api/admin/sub-league-season       変更した 国・リーグ だけ送る
//  POST /v1/api/admin/sub-league-season/skip  設定しない（未設定の 国・リーグ を全部「サブリーグなし」にする）

/** UNSET = 未設定 / HAS = サブリーグあり / NONE = なし */
export type SubLeagueStatus = "UNSET" | "HAS" | "NONE";

export type SubLeagueSeasonEntity = {
  country: string;
  league: string;
  status: SubLeagueStatus;
  /** サブリーグ名（表示順。HAS のときだけ） */
  subLeagues: string[];
  /** 日本時間 "yyyy-MM-dd HH:mm:ss"（未設定は null） */
  updateTime: string | null;
  updateId: string | null;
};

export type SubLeagueSeasonItem = {
  country: string;
  league: string;
  hasSubLeague: boolean;
  subLeagues: string[];
};

export type SubLeagueSeasonSaveResponse = {
  updatedLeagues: number;
  items: SubLeagueSeasonEntity[];
};

/** サーバーと同じ上限 */
export const MAX_SUB_LEAGUE_NAME_LENGTH = 100;
export const MAX_SUB_LEAGUES = 10;

const BASE_URL = "/v1/api/admin/sub-league-season";

async function errorMessage(res: Response, fallback: string): Promise<string> {
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    if (body?.message) return body.message;
  }
  const text = await res.text().catch(() => "");
  return `${fallback}: ${res.status} ${text}`.trim();
}

export async function fetchSubLeagueSeasons(): Promise<SubLeagueSeasonEntity[]> {
  const res = await fetch(BASE_URL, { method: "GET", headers: { Accept: "application/json" }, credentials: "include" });
  if (!res.ok) throw new Error(await errorMessage(res, "サブリーグ保有の取得に失敗しました"));
  return res.json();
}

export async function saveSubLeagueSeasons(items: SubLeagueSeasonItem[]): Promise<SubLeagueSeasonSaveResponse> {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "include",
    body: JSON.stringify({ items }),
  });
  if (!res.ok) throw new Error(await errorMessage(res, "サブリーグ保有の保存に失敗しました"));
  return res.json();
}

export async function skipSubLeagueSeasons(): Promise<SubLeagueSeasonSaveResponse> {
  const res = await fetch(`${BASE_URL}/skip`, { method: "POST", headers: { Accept: "application/json" }, credentials: "include" });
  if (!res.ok) throw new Error(await errorMessage(res, "「設定しない」に失敗しました"));
  return res.json();
}
