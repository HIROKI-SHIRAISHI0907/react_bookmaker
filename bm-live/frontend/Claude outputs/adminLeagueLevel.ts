// リーグレベル情報反映設定（/admin/league-level）の API
//  GET  /v1/api/admin/league-level  国・リーグ ごとのリーグレベル
//  POST /v1/api/admin/league-level  変更した 国・リーグ だけ送る（国・リーグ の全行に同じ値が入る）

export type LeagueLevelEntity = {
  country: string;
  league: string;
  /** 同じ国で 1 = 最上位、大きいほど下位。未設定・ばらつきは null */
  leagueLevel: number | null;
  /** 同じ 国・リーグ の行で値がばらついている（保存するとそろう） */
  mixed: boolean;
  /** 有効なチーム数（del_flg = '0'） */
  activeTeams: number;
  /** 全行数（削除・非表示の行を含む） */
  totalRows: number;
  /** 日本時間 "yyyy-MM-dd HH:mm:ss" */
  updateTime: string | null;
  updateId: string | null;
};

export type LeagueLevelItem = {
  country: string;
  league: string;
  /** 1〜99。null は未設定に戻す */
  leagueLevel: number | null;
};

export type LeagueLevelSaveResponse = {
  updatedLeagues: number;
  updatedRows: number;
  items: LeagueLevelEntity[];
};

/** レベルの上限（サーバーと同じ） */
export const MAX_LEAGUE_LEVEL = 99;

const BASE_URL = "/v1/api/admin/league-level";

async function errorMessage(res: Response, fallback: string): Promise<string> {
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    if (body?.message) return body.message;
  }
  const text = await res.text().catch(() => "");
  return `${fallback}: ${res.status} ${text}`.trim();
}

export async function fetchLeagueLevels(): Promise<LeagueLevelEntity[]> {
  const res = await fetch(BASE_URL, { method: "GET", headers: { Accept: "application/json" }, credentials: "include" });
  if (!res.ok) throw new Error(await errorMessage(res, "リーグレベルの取得に失敗しました"));
  return res.json();
}

export async function saveLeagueLevels(items: LeagueLevelItem[]): Promise<LeagueLevelSaveResponse> {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "include",
    body: JSON.stringify({ items }),
  });
  if (!res.ok) throw new Error(await errorMessage(res, "リーグレベルの保存に失敗しました"));
  return res.json();
}
