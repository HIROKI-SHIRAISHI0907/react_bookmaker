import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Skeleton } from "../../../components/ui/skeleton";

/** =========================
 * Types
 * ========================= */
type ApiResponse = {
  from?: string | null;
  to?: string | null;
  total: number;
  rows: IngestedRowDTO[];
};

type IngestedRowDTO = {
  seq: string;
  table: "FUTURE_MASTER" | "DATA";
  future?: FutureMasterRowDTO | null;
  data?: DataRowDTO | null;
  matchKey?: string | null;
  futureExists?: boolean | null;
  hasFinishedData?: boolean | null;
};

type FutureMasterRowDTO = {
  gameTeamCategory?: string | null;
  futureTime?: string | null;
  homeTeamName?: string | null;
  awayTeamName?: string | null;
  gameLink?: string | null;
};

type DataRowDTO = {
  dataCategory?: string | null;
  sameMatchDataCount?: number | null;
  homeTeamName?: string | null;
  awayTeamName?: string | null;
  gameId?: string | null;
  gameLink?: string | null;
};

/** =========================
 * UI helpers
 * ========================= */
type Tone = "gray" | "blue" | "emerald" | "amber" | "rose" | "violet";

function Badge({ children, tone = "gray" }: { children: React.ReactNode; tone?: Tone }) {
  const cls: Record<Tone, string> = {
    gray: "bg-gray-100 text-gray-700 ring-gray-200",
    blue: "bg-blue-100 text-blue-800 ring-blue-200",
    emerald: "bg-emerald-100 text-emerald-800 ring-emerald-200",
    amber: "bg-amber-100 text-amber-900 ring-amber-200",
    rose: "bg-rose-100 text-rose-800 ring-rose-200",
    violet: "bg-violet-100 text-violet-800 ring-violet-200",
  };

  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${cls[tone]}`}>{children}</span>;
}

function Panel({ title, desc, right, children }: { title: string; desc?: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white/80 backdrop-blur shadow-sm">
      <div className="px-5 py-4 border-b bg-gradient-to-r from-white to-gray-50 rounded-t-2xl">
        <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
          <div>
            <div className="text-base font-extrabold text-gray-900">{title}</div>
            {desc ? <div className="text-sm text-muted-foreground mt-1">{desc}</div> : null}
          </div>
          {right ? <div className="shrink-0">{right}</div> : null}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Alert({ type, title, message, onClose }: { type: "info" | "success" | "error"; title: string; message: string; onClose?: () => void }) {
  const cls = type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : type === "error" ? "border-rose-200 bg-rose-50 text-rose-900" : "border-blue-200 bg-blue-50 text-blue-900";

  return (
    <div className={`rounded-2xl border p-4 flex items-start gap-3 ${cls}`}>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-extrabold">{title}</div>
        <pre className="mt-1 text-xs whitespace-pre-wrap leading-relaxed">{message}</pre>
      </div>
      {onClose ? (
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors" type="button">
          ✕
        </button>
      ) : null}
    </div>
  );
}

/** =========================
 * Utils
 * ========================= */
async function fetchJsonStrict<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, {
    method: "GET",
    signal,
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}${text ? `: ${text}` : ""}`);
  }

  return (await res.json()) as T;
}

function fmtJstFixed(iso: string | null | undefined, withSeconds = false) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);

  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: withSeconds ? "2-digit" : undefined,
  }).format(d);
}

function safeText(v: unknown) {
  return typeof v === "string" ? v : "";
}

function getRowHome(row: IngestedRowDTO) {
  return safeText(row.data?.homeTeamName) || safeText(row.future?.homeTeamName) || "-";
}

function getRowAway(row: IngestedRowDTO) {
  return safeText(row.data?.awayTeamName) || safeText(row.future?.awayTeamName) || "-";
}

function getRowCategory(row: IngestedRowDTO) {
  return safeText(row.data?.dataCategory) || safeText(row.future?.gameTeamCategory) || "-";
}

function getRowGameLink(row: IngestedRowDTO) {
  return safeText(row.data?.gameLink) || safeText(row.future?.gameLink) || "";
}

function getRowFutureTime(row: IngestedRowDTO) {
  return safeText(row.future?.futureTime) || "";
}

/** =========================
 * Page
 * ========================= */
export default function IngestedDataReferenceAdminPage() {
  const [countryInput, setCountryInput] = useState("日本");
  const [onlyNeedsAttentionInput, setOnlyNeedsAttentionInput] = useState(false);

  const [country, setCountry] = useState("日本");
  const [onlyNeedsAttention, setOnlyNeedsAttention] = useState(false);

  const [offset, setOffset] = useState(0);
  const [pageSize, setPageSize] = useState(100);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);

  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  const abortRef = useRef<AbortController | null>(null);

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();

    if (country.trim()) {
      params.set("country", country.trim());
    }

    // controller の @RequestParam 名に合わせる
    params.set("onlyNeedsAttention", String(onlyNeedsAttention));
    params.set("limit", String(pageSize));
    params.set("offset", String(offset));

    // context-path が /v1 のままならこのまま
    return `/v1/api/admin/ingested?${params.toString()}`;
  }, [country, onlyNeedsAttention, pageSize, offset]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const doFetch = async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    setError(null);

    try {
      const res = await fetchJsonStrict<ApiResponse>(apiUrl, ac.signal);
      setResponse(res);
      setLastFetchedAt(new Date().toISOString());
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setError(e?.message ?? String(e));
      setResponse(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void doFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl]);

  const rows = response?.rows ?? [];
  const total = response?.total ?? 0;

  const canPrev = offset > 0;
  const canNext = offset + pageSize < total;

  const stats = useMemo(() => {
    const dataCount = rows.filter((r) => r.table === "DATA").length;
    const futureCount = rows.filter((r) => r.table === "FUTURE_MASTER").length;
    const futureExistsCount = rows.filter((r) => Boolean(r.futureExists)).length;
    const finishedCount = rows.filter((r) => Boolean(r.hasFinishedData)).length;
    const missingEitherCount = rows.filter((r) => !Boolean(r.futureExists) || !Boolean(r.hasFinishedData)).length;

    return {
      dataCount,
      futureCount,
      futureExistsCount,
      finishedCount,
      missingEitherCount,
    };
  }, [rows]);

  const handleSearch = async () => {
    setOffset(0);
    setCountry(countryInput);
    setOnlyNeedsAttention(onlyNeedsAttentionInput);
  };

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
        <div className="flex items-start md:items-center justify-between gap-4 flex-col md:flex-row">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-violet-600 to-blue-600 text-white p-3 rounded-2xl shadow-lg">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16v16H4zM7 8h10M7 12h10M7 16h10" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">投入済データ参照管理</h1>
              <p className="text-sm text-muted-foreground mt-1">国と「終了済データなし または 未来データなし」条件で検索します。</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge tone="blue">page rows {rows.length}</Badge>
            <Badge tone="gray">total {total}</Badge>
            <Badge tone="emerald">futureあり {stats.futureExistsCount}</Badge>
            <Badge tone="violet">終了済あり {stats.finishedCount}</Badge>
            <Badge tone="amber">不足あり {stats.missingEitherCount}</Badge>
          </div>
        </div>

        {error ? <Alert type="error" title="取得に失敗しました" message={error} onClose={() => setError(null)} /> : null}

        <Panel
          title="検索条件"
          desc="チェックボックスの状態を変えたあと、検索ボタンでAPIを再実行します。"
          right={
            <div className="flex flex-col items-end gap-1">
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? "検索中..." : "検索"}
              </Button>
              {lastFetchedAt ? <div className="text-[11px] text-muted-foreground">最終取得: {fmtJstFixed(lastFetchedAt, true)}</div> : null}
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-800">国名</div>
              <input
                className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={countryInput}
                onChange={(e) => setCountryInput(e.target.value)}
                placeholder="例）日本"
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-800">絞り込み</div>
              <label className="flex items-center gap-2 text-sm rounded-xl border bg-white px-3 py-3">
                <input type="checkbox" checked={onlyNeedsAttentionInput} onChange={(e) => setOnlyNeedsAttentionInput(e.target.checked)} />
                終了済データなし または 未来データなしのみ
              </label>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <Badge tone="gray">offset {offset}</Badge>
            <Badge tone="gray">limit {pageSize}</Badge>

            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-muted-foreground">page size</span>
              <select
                className="rounded-xl border bg-white px-3 py-2 text-sm"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setOffset(0);
                }}
              >
                {[50, 100, 200].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Panel>

        <Panel
          title="一覧"
          desc="API返却結果をそのまま表示します。"
          right={
            <div className="flex items-center gap-2">
              <Badge tone="gray">
                {Math.min(offset + 1, total)} - {Math.min(offset + pageSize, total)} / {total}
              </Badge>
              <Button variant="outline" size="sm" disabled={!canPrev || loading} onClick={() => setOffset((v) => Math.max(0, v - pageSize))}>
                Prev
              </Button>
              <Button variant="outline" size="sm" disabled={!canNext || loading} onClick={() => setOffset((v) => v + pageSize)}>
                Next
              </Button>
            </div>
          }
        >
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-2/3" />
            </div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-muted-foreground">データがありません。</div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {rows.map((row) => {
                const expanded = Boolean(expandedKeys[`${row.table}:${row.seq}`]);
                const home = getRowHome(row);
                const away = getRowAway(row);
                const category = getRowCategory(row);
                const gameLink = getRowGameLink(row);
                const futureTime = getRowFutureTime(row);

                return (
                  <div key={`${row.table}:${row.seq}`} className="rounded-2xl border bg-white hover:shadow-sm transition-shadow p-4">
                    <button type="button" className="w-full text-left" onClick={() => toggleExpand(`${row.table}:${row.seq}`)}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-lg font-extrabold text-gray-900 truncate">
                            {home} vs {away}
                          </div>

                          <div className="mt-1 text-sm text-muted-foreground truncate">{category}</div>

                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <Badge tone={row.table === "DATA" ? "blue" : "emerald"}>{row.table}</Badge>

                            {Boolean(row.futureExists) ? <Badge tone="emerald">未来データあり</Badge> : <Badge tone="rose">未来データなし</Badge>}

                            {Boolean(row.hasFinishedData) ? <Badge tone="violet">終了済データあり</Badge> : <Badge tone="amber">終了済データなし</Badge>}

                            {row.data?.sameMatchDataCount != null ? <Badge tone="gray">同一試合data件数 {row.data.sameMatchDataCount}</Badge> : null}
                          </div>

                          <div className="mt-2 text-sm text-gray-700">
                            試合予定時間: {futureTime ? <span className="font-semibold">{fmtJstFixed(futureTime, true)}</span> : <span className="text-gray-400">-</span>}
                          </div>
                        </div>

                        <div className="shrink-0 text-xs text-muted-foreground">{expanded ? "▲" : "▼"}</div>
                      </div>
                    </button>

                    {expanded ? (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="rounded-2xl border bg-gray-50 px-4 py-3">
                          <div className="text-sm font-extrabold text-gray-900">共通情報</div>
                          <div className="mt-2 text-sm text-gray-800 space-y-1">
                            <div>
                              <span className="text-muted-foreground">seq</span> {row.seq}
                            </div>
                            <div>
                              <span className="text-muted-foreground">table</span> {row.table}
                            </div>
                            <div>
                              <span className="text-muted-foreground">matchKey</span> {row.matchKey ?? "-"}
                            </div>
                            <div>
                              <span className="text-muted-foreground">home</span> {home}
                            </div>
                            <div>
                              <span className="text-muted-foreground">away</span> {away}
                            </div>
                            <div>
                              <span className="text-muted-foreground">category</span> {category}
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border bg-gray-50 px-4 py-3">
                          <div className="text-sm font-extrabold text-gray-900">状態</div>
                          <div className="mt-2 text-sm text-gray-800 space-y-1">
                            <div>
                              <span className="text-muted-foreground">futureExists</span> {String(Boolean(row.futureExists))}
                            </div>
                            <div>
                              <span className="text-muted-foreground">hasFinishedData</span> {String(Boolean(row.hasFinishedData))}
                            </div>
                            <div>
                              <span className="text-muted-foreground">futureTime</span> {futureTime ? fmtJstFixed(futureTime, true) : "-"}
                            </div>
                            <div>
                              <span className="text-muted-foreground">gameLink</span>{" "}
                              {gameLink ? (
                                <a href={gameLink} target="_blank" rel="noreferrer" className="text-blue-600 underline break-all">
                                  {gameLink}
                                </a>
                              ) : (
                                "-"
                              )}
                            </div>
                          </div>
                        </div>

                        {row.data ? (
                          <div className="md:col-span-2 rounded-2xl border bg-white px-4 py-3">
                            <div className="text-sm font-extrabold text-gray-900">data 詳細</div>
                            <div className="mt-3 overflow-x-auto">
                              <table className="w-full text-sm">
                                <tbody>
                                  <tr className="border-b">
                                    <th className="py-2 pr-3 text-left text-muted-foreground font-medium">dataCategory</th>
                                    <td className="py-2 pr-3">{row.data.dataCategory ?? "-"}</td>
                                  </tr>
                                  <tr className="border-b">
                                    <th className="py-2 pr-3 text-left text-muted-foreground font-medium">sameMatchDataCount</th>
                                    <td className="py-2 pr-3">{row.data.sameMatchDataCount ?? "-"}</td>
                                  </tr>
                                  <tr className="border-b">
                                    <th className="py-2 pr-3 text-left text-muted-foreground font-medium">gameId</th>
                                    <td className="py-2 pr-3">{row.data.gameId ?? "-"}</td>
                                  </tr>
                                  <tr>
                                    <th className="py-2 pr-3 text-left text-muted-foreground font-medium">gameLink</th>
                                    <td className="py-2 pr-3">
                                      {row.data.gameLink ? (
                                        <a href={row.data.gameLink} target="_blank" rel="noreferrer" className="text-blue-600 underline break-all">
                                          {row.data.gameLink}
                                        </a>
                                      ) : (
                                        "-"
                                      )}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : null}

                        {row.future ? (
                          <div className="md:col-span-2 rounded-2xl border bg-white px-4 py-3">
                            <div className="text-sm font-extrabold text-gray-900">future_master 詳細</div>
                            <div className="mt-3 overflow-x-auto">
                              <table className="w-full text-sm">
                                <tbody>
                                  <tr className="border-b">
                                    <th className="py-2 pr-3 text-left text-muted-foreground font-medium">gameTeamCategory</th>
                                    <td className="py-2 pr-3">{row.future.gameTeamCategory ?? "-"}</td>
                                  </tr>
                                  <tr className="border-b">
                                    <th className="py-2 pr-3 text-left text-muted-foreground font-medium">futureTime</th>
                                    <td className="py-2 pr-3">{row.future.futureTime ? fmtJstFixed(row.future.futureTime, true) : "-"}</td>
                                  </tr>
                                  <tr>
                                    <th className="py-2 pr-3 text-left text-muted-foreground font-medium">gameLink</th>
                                    <td className="py-2 pr-3">
                                      {row.future.gameLink ? (
                                        <a href={row.future.gameLink} target="_blank" rel="noreferrer" className="text-blue-600 underline break-all">
                                          {row.future.gameLink}
                                        </a>
                                      ) : (
                                        "-"
                                      )}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
