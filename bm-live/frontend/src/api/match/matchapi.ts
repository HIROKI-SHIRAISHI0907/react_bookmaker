// 試合詳細の API
import { getAccessToken, getTokenType } from "../../utils/auth";
import type { MatchDetailExtraResponse, MatchDetailResponse } from "./matchtypes";

function authHeader(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `${getTokenType()} ${token}` } : {};
}

export async function fetchMatchDetail(seqKey: string): Promise<MatchDetailResponse> {
  const res = await fetch(`/v1/api/match-detail?seqKey=${encodeURIComponent(seqKey)}`, {
    cache: "no-store",
    headers: { Accept: "application/json", ...authHeader() },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) throw new Error("API に届いていません（JSON 以外が返りました）");
  return res.json() as Promise<MatchDetailResponse>;
}

/** 統計詳細データ（試合が終わってから取得したもの）。無ければ found=false */
export async function fetchMatchDetailExtra(matchId: string): Promise<MatchDetailExtraResponse> {
  const res = await fetch(`/v1/api/match-detail/extra?matchId=${encodeURIComponent(matchId)}`, {
    headers: { Accept: "application/json", ...authHeader() },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) throw new Error("API に届いていません（JSON 以外が返りました）");
  return res.json() as Promise<MatchDetailExtraResponse>;
}
