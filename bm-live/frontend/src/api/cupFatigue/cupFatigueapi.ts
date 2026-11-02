// 直近の大会（ACL など）出場の API（今後の試合予定・試合中の画面の CupFatigueBox）
import { getAccessToken, getTokenType } from "../../utils/auth";
import type { CupFatigueResponse } from "./cupFatiguetypes";

function authHeader(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `${getTokenType()} ${token}` } : {};
}

export type CupFatigueParams = {
  country?: string | null;
  league?: string | null;
  home?: string | null;
  away?: string | null;
  /** この試合の開始日時（JST, yyyy-MM-dd HH:mm）。無ければ今 */
  at?: string | null;
  /** 前後何日を見るか（既定 7） */
  days?: number;
};

export async function fetchCupFatigue(p: CupFatigueParams): Promise<CupFatigueResponse> {
  const q = new URLSearchParams();
  if (p.country) q.set("country", p.country);
  if (p.league) q.set("league", p.league);
  if (p.home) q.set("home", p.home);
  if (p.away) q.set("away", p.away);
  if (p.at) q.set("at", p.at);
  if (p.days) q.set("days", String(p.days));
  const res = await fetch(`/v1/api/cup-fatigue?${q.toString()}`, {
    headers: { Accept: "application/json", ...authHeader() },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) throw new Error("API に届いていません（JSON 以外が返りました）");
  return res.json() as Promise<CupFatigueResponse>;
}

/** 日時の文字列（ISO・"2026-11-05 19:00:00+09" など）→ JST の "yyyy-MM-dd HH:mm"。読めなければ null */
export function toJstMinute(s: string | null | undefined): string | null {
  if (!s) return null;
  // タイムゾーンが付いていない "yyyy-MM-dd HH:mm(:ss)" は JST とみなしてそのまま使う
  const plain = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(:\d{2}(\.\d+)?)?$/.exec(s.trim());
  if (plain) return `${plain[1]} ${plain[2]}`;
  const d = new Date(s.trim().replace(/^(\d{4}-\d{2}-\d{2}) /, "$1T").replace(/([+-]\d{2})$/, "$1:00"));
  if (Number.isNaN(d.getTime())) return null;
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const v = (t: string) => parts.find((x) => x.type === t)?.value ?? "";
  return `${v("year")}-${v("month")}-${v("day")} ${v("hour") === "24" ? "00" : v("hour")}:${v("minute")}`;
}
