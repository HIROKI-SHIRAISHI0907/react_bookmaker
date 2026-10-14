import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Play, Search } from "lucide-react";
import {
  ConsoleButton,
  ConsoleCheck,
  ConsoleColumn,
  ConsoleDrawer,
  ConsoleField,
  ConsoleInput,
  ConsoleNotice,
  ConsolePanel,
  ConsoleSelect,
  ConsoleTable,
  ConsoleToolbar,
  DetailRow,
  StatChips,
  StatusBadge,
  fmtNum,
} from "../../../api/commonAdminDesign";

/** =========================
 * Types
 * ========================= */
type FinGettingRequest = {
  matches: Array<{
    matchDate: string; // YYYY-MM-DD
    matchId: string;
    matchUrl?: string;
  }>;
};

type ExecTaskResponse = {
  returnCd?: string;
  taskArn?: string;
  message?: string;
};

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

async function postFinGettingJson(req: FinGettingRequest, signal?: AbortSignal): Promise<ExecTaskResponse> {
  const res = await fetch("/v1/api/admin/fin-getting-json", {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}${text ? `: ${text}` : ""}`);
  }

  return (await res.json()) as ExecTaskResponse;
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

function extractMidFromUrl(url: string | null | undefined): string | null {
  const s = (url ?? "").trim();
  if (!s) return null;
  const m = s.match(/[?&]mid=([A-Za-z0-9]+)/);
  return m?.[1] ?? null;
}

function isoToJstDateKey(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;

  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);

  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const dd = parts.find((p) => p.type === "day")?.value;

  if (!y || !m || !dd) return null;
  return `${y}-${m}-${dd}`;
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

function buildFinGettingRequestFromRows(rows: IngestedRowDTO[]): FinGettingRequest {
  type Group = {
    matchDate: string | null;
    matchId: string | null;
    matchUrl: string | null;
  };

  const grouped = new Map<string, Group>();

  for (const row of rows) {
    const gameLink = getRowGameLink(row) || null;
    const futureTime = getRowFutureTime(row) || null;

    const matchDate = futureTime ? isoToJstDateKey(futureTime) : null;
    const matchId = (row.matchKey ?? "").trim() || extractMidFromUrl(gameLink) || (row.data?.gameId ?? "").trim() || null;

    const groupKey = matchId || extractMidFromUrl(gameLink) || `${row.table}:${row.seq}`;

    const existing = grouped.get(groupKey);
    if (!existing) {
      grouped.set(groupKey, {
        matchDate,
        matchId,
        matchUrl: gameLink,
      });
      continue;
    }

    if (!existing.matchDate && matchDate) existing.matchDate = matchDate;
    if (!existing.matchId && matchId) existing.matchId = matchId;
    if (!existing.matchUrl && gameLink) existing.matchUrl = gameLink;
  }

  const matches: FinGettingRequest["matches"] = [];

  for (const [, g] of grouped) {
    if (!g.matchDate || !g.matchId) continue;

    const row: { matchDate: string; matchId: string; matchUrl?: string } = {
      matchDate: g.matchDate,
      matchId: g.matchId,
    };

    if (g.matchUrl) {
      row.matchUrl = g.matchUrl;
    }

    matches.push(row);
  }

  matches.sort((a, b) => (a.matchDate + a.matchId).localeCompare(b.matchDate + b.matchId));
  return { matches };
}

function LinkText({ href }: { href: string | null | undefined }) {
  if (!href) return <>-</>;
  return (
    <a href={href} target="_blank" rel="noreferrer" className="break-all text-indigo-600 hover:underline">
      {href}
    </a>
  );
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
  const [searchVersion, setSearchVersion] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);

  const [execLoading, setExecLoading] = useState(false);
  const [execError, setExecError] = useState<string | null>(null);
  const [execResult, setExecResult] = useState<ExecTaskResponse | null>(null);

  // --- bulk (all pages) B008 execution ---
  const BULK_CHUNK_SIZE = 300;
  const BULK_CHUNK_DELAY_MS = 3000;

  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
  const [bulkResults, setBulkResults] = useState<Array<{ batch: number; size: number; ok: boolean; detail: string }>>([]);

  // 詳細（右から出るパネル）
  const [detailRow, setDetailRow] = useState<IngestedRowDTO | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();

    if (country.trim()) {
      params.set("country", country.trim());
    }

    params.set("onlyNeedsAttention", String(onlyNeedsAttention));
    params.set("limit", String(pageSize));
    params.set("offset", String(offset));

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
  }, [apiUrl, searchVersion]);

  const rows = response?.rows ?? [];
  const total = response?.total ?? 0;

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

  const handleSearch = () => {
    setOffset(0);
    setCountry(countryInput);
    setOnlyNeedsAttention(onlyNeedsAttentionInput);
    setSearchVersion((v) => v + 1);
  };

  const runB008 = async () => {
    setExecLoading(true);
    setExecError(null);
    setExecResult(null);

    try {
      const req = buildFinGettingRequestFromRows(rows);

      if (req.matches.length === 0) {
        setExecError("B008対象が0件です(futureTime または matchId が取れる行がありません)。");
        return;
      }

      if (req.matches.length > 300) {
        setExecError(`対象が多すぎます(${req.matches.length}件)。検索条件を絞ってください。`);
        return;
      }

      const res = await postFinGettingJson(req);
      setExecResult(res);
    } catch (e: any) {
      setExecError(e?.message ?? String(e));
    } finally {
      setExecLoading(false);
    }
  };

  // 現在適用中の検索条件(country / onlyNeedsAttention)で、ページングせず全件を取得する。
  const fetchAllMatchingRows = async (): Promise<IngestedRowDTO[]> => {
    const bulkPageSize = 500; // 通信回数を減らすため、通常のページサイズより大きめに取得する
    let bulkOffset = 0;
    let bulkTotal = Infinity;
    const all: IngestedRowDTO[] = [];
    const MAX_PAGES = 200; // 無限ループ防止用の安全策

    for (let page = 0; page < MAX_PAGES && bulkOffset < bulkTotal; page++) {
      const params = new URLSearchParams();

      if (country.trim()) {
        params.set("country", country.trim());
      }

      params.set("onlyNeedsAttention", String(onlyNeedsAttention));
      params.set("limit", String(bulkPageSize));
      params.set("offset", String(bulkOffset));

      const res = await fetchJsonStrict<ApiResponse>(`/v1/api/admin/ingested?${params.toString()}`);
      bulkTotal = res.total ?? 0;
      const pageRows = res.rows ?? [];
      all.push(...pageRows);

      if (pageRows.length === 0) break;
      bulkOffset += pageRows.length;
    }

    return all;
  };

  // 現在の検索条件に合致する全件(ページ横断)を対象にB008を一括起動する。
  // 1回のリクエストが大きくなりすぎないよう、BULK_CHUNK_SIZE件ずつに分割して順番に実行する。
  const runB008AllMatching = async () => {
    setBulkLoading(true);
    setBulkError(null);
    setBulkResults([]);
    setBulkProgress(null);

    try {
      const allRows = await fetchAllMatchingRows();

      if (allRows.length === 0) {
        setBulkError("対象が0件です。");
        return;
      }

      const fullReq = buildFinGettingRequestFromRows(allRows);

      if (fullReq.matches.length === 0) {
        setBulkError("B008対象が0件です(matchDate または matchId が取れる行がありません)。");
        return;
      }

      const chunks: FinGettingRequest["matches"][] = [];
      for (let i = 0; i < fullReq.matches.length; i += BULK_CHUNK_SIZE) {
        chunks.push(fullReq.matches.slice(i, i + BULK_CHUNK_SIZE));
      }

      setBulkProgress({ done: 0, total: chunks.length });

      for (let i = 0; i < chunks.length; i++) {
        try {
          const res = await postFinGettingJson({ matches: chunks[i] });
          setBulkResults((prev) => [...prev, { batch: i + 1, size: chunks[i].length, ok: true, detail: JSON.stringify(res) }]);
        } catch (e: any) {
          setBulkResults((prev) => [...prev, { batch: i + 1, size: chunks[i].length, ok: false, detail: e?.message ?? String(e) }]);
        }

        setBulkProgress({ done: i + 1, total: chunks.length });

        if (i < chunks.length - 1) {
          await new Promise((r) => setTimeout(r, BULK_CHUNK_DELAY_MS));
        }
      }
    } catch (e: any) {
      setBulkError(e?.message ?? String(e));
    } finally {
      setBulkLoading(false);
    }
  };

  const closeDetail = useCallback(() => setDetailRow(null), []);

  const columns: ConsoleColumn<IngestedRowDTO>[] = [
    {
      key: "table",
      header: "種別",
      cell: (r) => (
        <StatusBadge tone={r.table === "DATA" ? "info" : "ok"} dot={false}>
          {r.table}
        </StatusBadge>
      ),
    },
    {
      key: "match",
      header: "試合",
      wrap: true,
      className: "min-w-[260px]",
      cell: (r) => (
        <>
          <div className="font-bold">
            {getRowHome(r)} <span className="font-normal text-gray-400">vs</span> {getRowAway(r)}
          </div>
          <div className="text-[11px] text-gray-500">{getRowCategory(r)}</div>
        </>
      ),
    },
    {
      key: "futureTime",
      header: "試合予定時間",
      mono: true,
      cell: (r) => {
        const t = getRowFutureTime(r);
        return t ? fmtJstFixed(t, true) : <span className="text-gray-300">-</span>;
      },
    },
    {
      key: "future",
      header: "未来データ",
      cell: (r) => (r.futureExists ? <StatusBadge tone="ok">あり</StatusBadge> : <StatusBadge tone="ng">なし</StatusBadge>),
    },
    {
      key: "finished",
      header: "終了済データ",
      cell: (r) => (r.hasFinishedData ? <StatusBadge tone="info">あり</StatusBadge> : <StatusBadge tone="warn">なし</StatusBadge>),
    },
    {
      key: "same",
      header: "同一試合data",
      align: "right",
      cell: (r) => (r.data?.sameMatchDataCount != null ? <span className="tabular-nums">{r.data.sameMatchDataCount}</span> : <span className="text-gray-300">-</span>),
    },
    {
      key: "link",
      header: "リンク",
      cell: (r) => {
        const link = getRowGameLink(r);
        return link ? (
          <a href={link} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline">
            開く <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span className="text-gray-300">-</span>
        );
      },
    },
  ];

  const busy = loading || execLoading || bulkLoading;

  return (
    <div>
      <ConsoleToolbar title="投入済データ参照管理" info="国と「終了済データなし または 未来データなし」で検索">
        <ConsoleButton variant="primary" onClick={() => void runB008()} disabled={busy || rows.length === 0} loading={execLoading}>
          {!execLoading && <Play className="h-3 w-3" />}
          {execLoading ? "B008起動中…" : "B008起動（このページ）"}
        </ConsoleButton>
        <ConsoleButton onClick={() => void runB008AllMatching()} disabled={busy || total === 0} loading={bulkLoading}>
          {bulkLoading ? `一括実行中（${bulkProgress?.done ?? 0}/${bulkProgress?.total ?? "?"}バッチ）` : `全件（${fmtNum(total)}件）でB008一括起動`}
        </ConsoleButton>
      </ConsoleToolbar>

      {execError && (
        <ConsoleNotice tone="ng" title="B008起動に失敗しました" onClose={() => setExecError(null)}>
          {execError}
        </ConsoleNotice>
      )}
      {execResult && (
        <ConsoleNotice tone="ok" title="B008を起動しました" onClose={() => setExecResult(null)}>
          {`returnCd: ${execResult.returnCd ?? "-"}${execResult.taskArn ? `\ntaskArn: ${execResult.taskArn}` : ""}${execResult.message ? `\nmessage: ${execResult.message}` : ""}`}
        </ConsoleNotice>
      )}
      {bulkError && (
        <ConsoleNotice tone="ng" title="一括B008起動に失敗しました" onClose={() => setBulkError(null)}>
          {bulkError}
        </ConsoleNotice>
      )}
      {bulkResults.length > 0 && (
        <ConsoleNotice
          tone={bulkResults.every((r) => r.ok) ? "ok" : "ng"}
          title={`一括B008起動: ${bulkResults.filter((r) => r.ok).length}/${bulkResults.length} バッチ成功${bulkLoading ? "（実行中…）" : ""}`}
          onClose={bulkLoading ? undefined : () => setBulkResults([])}
        >
          {bulkResults.map((r) => `バッチ${r.batch}(${r.size}件): ${r.ok ? "OK" : "失敗"} - ${r.detail}`).join("\n")}
        </ConsoleNotice>
      )}
      {error && (
        <ConsoleNotice tone="ng" title="取得に失敗しました" onClose={() => setError(null)}>
          {error}
        </ConsoleNotice>
      )}

      <ConsolePanel title="検索条件" info={lastFetchedAt ? `最終取得 ${fmtJstFixed(lastFetchedAt, true)}` : undefined}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-wrap items-end gap-2"
        >
          <ConsoleField label="国名">
            <ConsoleInput value={countryInput} onChange={(e) => setCountryInput(e.target.value)} placeholder="例）日本" className="w-48" />
          </ConsoleField>
          <ConsoleCheck checked={onlyNeedsAttentionInput} onChange={setOnlyNeedsAttentionInput}>
            終了済データなし または 未来データなしのみ
          </ConsoleCheck>
          <ConsoleButton type="submit" variant="primary" loading={loading}>
            {!loading && <Search className="h-3.5 w-3.5" />}
            検索
          </ConsoleButton>
          <ConsoleField label="1ページの件数" className="ml-auto">
            <ConsoleSelect
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
            </ConsoleSelect>
          </ConsoleField>
        </form>
      </ConsolePanel>

      <StatChips
        loading={loading && rows.length === 0}
        items={[
          { label: "総件数", value: fmtNum(total) },
          { label: "このページ", value: fmtNum(rows.length) },
          { label: "未来データあり", value: fmtNum(stats.futureExistsCount), tone: "ok" },
          { label: "終了済あり", value: fmtNum(stats.finishedCount), tone: "info" },
          { label: "不足あり", value: fmtNum(stats.missingEitherCount), tone: stats.missingEitherCount > 0 ? "warn" : "default" },
        ]}
      />

      <ConsoleTable
        columns={columns}
        rows={rows}
        rowKey={(r) => `${r.table}:${r.seq}`}
        loading={loading}
        emptyText="データがありません。"
        onRowClick={setDetailRow}
        maxHeight="calc(100vh - 300px)"
        paging={{
          page: Math.floor(offset / pageSize) + 1,
          pageSize,
          total,
          onChange: (p) => setOffset((p - 1) * pageSize),
        }}
      />

      <ConsoleDrawer
        open={detailRow !== null}
        onClose={closeDetail}
        title={detailRow ? `${getRowHome(detailRow)} vs ${getRowAway(detailRow)}` : ""}
      >
        {detailRow && (
          <>
            <div className="mb-2 flex flex-wrap gap-1.5">
              <StatusBadge tone={detailRow.table === "DATA" ? "info" : "ok"} dot={false}>
                {detailRow.table}
              </StatusBadge>
              {detailRow.futureExists ? <StatusBadge tone="ok">未来データあり</StatusBadge> : <StatusBadge tone="ng">未来データなし</StatusBadge>}
              {detailRow.hasFinishedData ? <StatusBadge tone="info">終了済データあり</StatusBadge> : <StatusBadge tone="warn">終了済データなし</StatusBadge>}
            </div>

            <h3 className="mb-1 mt-3 text-xs font-bold text-gray-500">共通情報</h3>
            <DetailRow label="seq">
              <span className="font-mono">{detailRow.seq}</span>
            </DetailRow>
            <DetailRow label="table">{detailRow.table}</DetailRow>
            <DetailRow label="matchKey">
              <span className="font-mono">{detailRow.matchKey ?? "-"}</span>
            </DetailRow>
            <DetailRow label="home">{getRowHome(detailRow)}</DetailRow>
            <DetailRow label="away">{getRowAway(detailRow)}</DetailRow>
            <DetailRow label="category">{getRowCategory(detailRow)}</DetailRow>
            <DetailRow label="futureTime">
              <span className="font-mono">{getRowFutureTime(detailRow) ? fmtJstFixed(getRowFutureTime(detailRow), true) : "-"}</span>
            </DetailRow>
            <DetailRow label="gameLink">
              <LinkText href={getRowGameLink(detailRow)} />
            </DetailRow>

            {detailRow.data && (
              <>
                <h3 className="mb-1 mt-4 text-xs font-bold text-gray-500">data 詳細</h3>
                <DetailRow label="dataCategory">{detailRow.data.dataCategory ?? "-"}</DetailRow>
                <DetailRow label="sameMatchDataCount">{detailRow.data.sameMatchDataCount ?? "-"}</DetailRow>
                <DetailRow label="gameId">
                  <span className="font-mono">{detailRow.data.gameId ?? "-"}</span>
                </DetailRow>
                <DetailRow label="gameLink">
                  <LinkText href={detailRow.data.gameLink} />
                </DetailRow>
              </>
            )}

            {detailRow.future && (
              <>
                <h3 className="mb-1 mt-4 text-xs font-bold text-gray-500">future_master 詳細</h3>
                <DetailRow label="gameTeamCategory">{detailRow.future.gameTeamCategory ?? "-"}</DetailRow>
                <DetailRow label="futureTime">
                  <span className="font-mono">{detailRow.future.futureTime ? fmtJstFixed(detailRow.future.futureTime, true) : "-"}</span>
                </DetailRow>
                <DetailRow label="gameLink">
                  <LinkText href={detailRow.future.gameLink} />
                </DetailRow>
              </>
            )}
          </>
        )}
      </ConsoleDrawer>
    </div>
  );
}
