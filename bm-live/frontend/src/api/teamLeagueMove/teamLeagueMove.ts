// チーム昇格・降格確認設定（/admin/team-league-move）の API（2026-11-24 追加）
//  GET  /v1/api/admin/team-league-move?all=         未確定だけ（all=true で確定・取り消し済みも）
//  POST /v1/api/admin/team-league-move/confirm?all= { items: [{ id, moveType }] } 確定
//  POST /v1/api/admin/team-league-move/cancel?all=  { items: [{ id }] } 取り消し（誤検知）

/** UP = 昇格 / DOWN = 降格 / OTHER = その他 / RENAME = リーグ名変更（付け替え設定で自動確定） */
export type MoveType = "UP" | "DOWN" | "OTHER" | "RENAME";

/** "0" 未確定 / "1" 確定 / "9" 取り消し */
export type ConfirmFlg = "0" | "1" | "9";

export type TeamLeagueMoveEntity = {
  id: number;
  country: string;
  team: string;
  link: string | null;
  teamId: number | null;
  fromLeague: string;
  toLeague: string;
  fromLevel: number | null;
  toLevel: number | null;
  suggestType: MoveType;
  moveType: MoveType | null;
  source: "UPDATE" | "INSERT";
  confirmFlg: ConfirmFlg;
  /** 日本時間 "yyyy-MM-dd HH:mm:ss" */
  detectedTime: string;
  confirmTime: string | null;
  updateId: string | null;
};

export type TeamLeagueMoveResponse = {
  updated: number;
  favorites: number;
  cupTeams: number;
  items: TeamLeagueMoveEntity[];
  warnings: string[];
};

export const MOVE_TYPE_LABEL: Record<MoveType, string> = { UP: "昇格", DOWN: "降格", OTHER: "その他", RENAME: "リーグ名変更" };

const BASE_URL = "/v1/api/admin/team-league-move";

async function errorMessage(res: Response, fallback: string): Promise<string> {
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    if (body?.message) return body.message;
  }
  const text = await res.text().catch(() => "");
  return `${fallback}: ${res.status} ${text}`.trim();
}

export async function fetchTeamLeagueMoves(all: boolean): Promise<TeamLeagueMoveEntity[]> {
  const res = await fetch(`${BASE_URL}?all=${all}`, { method: "GET", headers: { Accept: "application/json" }, credentials: "include" });
  if (!res.ok) throw new Error(await errorMessage(res, "昇格・降格の取得に失敗しました"));
  return res.json();
}

async function post(path: string, all: boolean, items: { id: number; moveType?: MoveType }[], fallback: string): Promise<TeamLeagueMoveResponse> {
  const res = await fetch(`${BASE_URL}/${path}?all=${all}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "include",
    body: JSON.stringify({ items }),
  });
  if (!res.ok) throw new Error(await errorMessage(res, fallback));
  return res.json();
}

export const confirmTeamLeagueMoves = (all: boolean, items: { id: number; moveType: MoveType }[]) =>
  post("confirm", all, items, "確定に失敗しました");

export const cancelTeamLeagueMoves = (all: boolean, ids: number[]) =>
  post("cancel", all, ids.map((id) => ({ id })), "取り消しに失敗しました");
