// frontend/src/api/historyDetails.ts
export type SideStats = {
  name?: string | null;
  score?: number | null;

  // メタ
  manager?: string | null;
  formation?: string | null;

  // 指標
  xg?: number | null;
  possession?: number | null;
  shots?: number | null;
  shots_on?: number | null;
  shots_off?: number | null;
  blocks?: number | null;
  corners?: number | null;
  big_chances?: number | null;
  saves?: number | null;
  yc?: number | null;
  rc?: number | null;

  // パス関連（%や分数表記が来ることがあるので string）
  passes?: string | null;
  long_passes?: string | null;
};

export type HistoryDetail = {
  competition?: string | null;
  round_no?: number | null;

  // 記録時刻（終了時刻 or スナップショット最終）
  recorded_at?: string | null;

  // 勝者：HOME / AWAY / DRAW
  winner?: "HOME" | "AWAY" | "DRAW" | null;

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
 * 期待パス（実装しているバックエンドに合わせる）:
 *   GET /api/history/:country/:league/:team/history/:seq
 */
export async function fetchHistoryDetail(country: string, league: string, teamSlug: string, seq: string): Promise<HistoryDetail> {
  const url = `/api/history/${encodeURIComponent(country)}/${encodeURIComponent(league)}/${encodeURIComponent(teamSlug)}/history/${encodeURIComponent(seq)}`;

  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`history detail fetch failed: ${res.status} ${text}`);
  }
  const json = await res.json();
  // サーバは { detail: {...} } or 直接 {...} のどちらか想定に対応
  return (json.detail ?? json ?? {}) as HistoryDetail;
}
