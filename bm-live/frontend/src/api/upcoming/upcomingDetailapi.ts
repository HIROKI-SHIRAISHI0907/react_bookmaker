// これからの試合の詳細の API
import { getAccessToken, getTokenType } from "../../utils/auth";
import type { UpcomingDetailResponse } from "./upcomingDetailtypes";

function authHeader(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `${getTokenType()} ${token}` } : {};
}

/** GET /v1/api/upcoming-detail?country=&league=&home=&away=&h2hLimit= */
export async function fetchUpcomingDetail(p: { country: string; league: string; home: string; away: string; h2hLimit?: number }): Promise<UpcomingDetailResponse> {
  const q = new URLSearchParams({ country: p.country, league: p.league, home: p.home, away: p.away });
  if (p.h2hLimit) q.set("h2hLimit", String(p.h2hLimit));
  const res = await fetch(`/v1/api/upcoming-detail?${q.toString()}`, {
    cache: "no-store",
    headers: { Accept: "application/json", ...authHeader() },
  });
  const ct = res.headers.get("content-type") ?? "";
  if (!res.ok) {
    // 400 は { message }
    if (ct.includes("application/json")) {
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      if (body?.message) throw new Error(body.message);
    }
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
  if (!ct.includes("application/json")) throw new Error("API に届いていません（JSON 以外が返りました）");
  return res.json() as Promise<UpcomingDetailResponse>;
}
