// frontend/src/api/rankHistory.ts

export type RankHistoryPoint = {
  /** ラウンド番号（節） */
  match: number;
  /** チームラベル */
  team: string;
  /** このラウンド終了時点の順位（1位, 2位, ...） */
  rank: number;
};

export type RankHistoryResponse = {
  items: RankHistoryPoint[];
};

/**
 * チームのラウンドごとの順位変動データを取得する
 */
export async function fetchRankHistory(country: string, league: string): Promise<RankHistoryResponse> {
  const url = `/api/rank-history/${encodeURIComponent(country)}/${encodeURIComponent(league)}}`;

  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`rank history fetch failed: ${res.status} ${text}`);
  }

  const json = await res.json();
  // サーバー側のレスポンス形に合わせてここを調整してください
  return {
    items: (json.items ?? []) as RankHistoryPoint[],
  };
}
