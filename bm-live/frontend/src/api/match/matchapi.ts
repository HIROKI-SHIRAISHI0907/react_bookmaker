// 試合詳細の API
import { getAccessToken, getTokenType } from "../../utils/auth";
import type { MatchDetailResponse } from "./matchtypes";

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
