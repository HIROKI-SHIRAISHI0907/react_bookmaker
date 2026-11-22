// 統計詳細データ参照（/admin/match-detail）の API（2026-11 追加）
//  GET /v1/api/admin/match-detail?keyword=&dateFrom=&dateTo=&errorsOnly=&offset=&limit=
//      B016 が登録した match_detail_match の一覧（各テーブルの行数つき）
//  試合ごとの中身は既存の GET /v1/api/match-detail/extra?matchId=（api/match/matchapi.ts の fetchMatchDetailExtra）

export type MatchDetailReferenceRow = {
  matchId: string;
  matchDate: string | null;
  category: string | null;
  homeTeam: string | null;
  awayTeam: string | null;
  homeScore: string | null;
  awayScore: string | null;
  status: string | null;
  startTime: string | null;
  matchUrl: string | null;
  scrapedAt: string | null;
  /** 取れなかったページ（カンマ区切り。全部取れたら空） */
  scrapeErrors: string | null;
  /** 日本時間 "yyyy-MM-dd HH:mm:ss" */
  registerTime: string | null;
  momentumCount: number;
  incidentCount: number;
  summaryCount: number;
  goalCount: number;
  formationCount: number;
  lineupCount: number;
  missingCount: number;
  memberStatCount: number;
  /** 取れるはずなのに無いデータ（取り直す余地あり。2026-11-22 追加）。空なら「OK」 */
  missingTables?: string[] | null;
  /** このリーグでは提供されていないデータ（2026-11-22 追加） */
  unavailableTables?: string[] | null;
};

export type MatchDetailReferenceResponse = {
  total: number;
  offset: number;
  limit: number;
  items: MatchDetailReferenceRow[];
};

export type MatchDetailReferenceQuery = {
  keyword?: string;
  dateFrom?: string;
  dateTo?: string;
  errorsOnly?: boolean;
  offset: number;
  limit: number;
};

async function errorMessage(res: Response, fallback: string): Promise<string> {
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    if (body?.message) return body.message;
  }
  const text = await res.text().catch(() => "");
  return `${fallback}: ${res.status} ${text}`.trim();
}

export async function fetchMatchDetailReference(q: MatchDetailReferenceQuery): Promise<MatchDetailReferenceResponse> {
  const params = new URLSearchParams();
  if (q.keyword?.trim()) params.set("keyword", q.keyword.trim());
  if (q.dateFrom) params.set("dateFrom", q.dateFrom);
  if (q.dateTo) params.set("dateTo", q.dateTo);
  if (q.errorsOnly) params.set("errorsOnly", "true");
  params.set("offset", String(q.offset));
  params.set("limit", String(q.limit));
  const res = await fetch(`/v1/api/admin/match-detail?${params.toString()}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "include",
  });
  if (!res.ok) throw new Error(await errorMessage(res, "統計詳細データの取得に失敗しました"));
  return res.json();
}
