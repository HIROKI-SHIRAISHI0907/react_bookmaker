// frontend/src/api/historyDetails.ts (SpringBoot bookmakers-web bm_w002)
export type SideStats = {
  name?: string | null;
  score?: number | null;

  // メタ
  manager?: string | null;
  formation?: string | null;

  // 指標（Spring: shotsOn, bigChances, longPasses など camelCase）
  xg?: number | null;
  possession?: number | null;
  shots?: number | null;
  shotsOn?: number | null;
  shotsOff?: number | null;
  blocks?: number | null;
  corners?: number | null;
  bigChances?: number | null;
  saves?: number | null;
  yc?: number | null;
  rc?: number | null;

  // パス関連
  passes?: string | null;
  longPasses?: string | null;
};

export type HistoryDetail = {
  competition?: string | null;
  roundNo?: number | null;

  // 記録時刻
  recordedAt?: string | null;

  // 勝者：HOME / AWAY / DRAW /（将来LIVE等が混ざるなら追加）
  winner?: "HOME" | "AWAY" | "DRAW" | string | null;

  link?: string | null;

  home?: SideStats | null;
  away?: SideStats | null;

  venue?: {
    stadium?: string | null;
    audience?: string | null;
    capacity?: string | null;
  } | null;
};

/**
 * 履歴詳細を取得
 * GET /api/{country}/{league}/{team}/{seq}/history
 * 返却: { detail: {...} }
 */
export async function fetchHistoryDetail(country: string, league: string, teamSlug: string, seq: string): Promise<HistoryDetail> {
  const url = `/api/${encodeURIComponent(country)}` + `/${encodeURIComponent(league)}` + `/${encodeURIComponent(teamSlug)}` + `/${encodeURIComponent(seq)}/history`;

  const res = await fetch(url, { credentials: "include", headers: { Accept: "application/json" } });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`history detail fetch failed: ${res.status} ${text}`);
  }

  const json = await res.json();
  // サーバは { detail: {...} } 形式
  return (json?.detail ?? null) as HistoryDetail;
}
