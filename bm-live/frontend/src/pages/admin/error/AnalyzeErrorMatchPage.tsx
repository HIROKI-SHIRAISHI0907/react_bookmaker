import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Download, RefreshCw, Search } from "lucide-react";
import {
  BadgeTone,
  ConsoleButton,
  ConsoleColumn,
  ConsoleDrawer,
  ConsoleField,
  ConsoleInput,
  ConsoleNotice,
  ConsolePanel,
  ConsoleSelect,
  ConsoleTable,
  ConsoleTextarea,
  ConsoleToolbar,
  DetailRow,
  SegmentedTabs,
  StatChips,
  StatusBadge,
  fmtNum,
} from "../../../api/commonAdminDesign";

/* ===================================================================
 * 統計処理で登録できなかった試合（analyze_error_match）の管理画面
 *   - 一覧（未対応 / 対応済み / すべて、BM・種別・国・リーグ・原因の項目・キーワードで絞り込み、OFFSET ページング）
 *   - 集計（BM × 種別 × 国・リーグ × 項目。クリックで絞り込み）
 *   - 詳細（スタックトレース・補足）と、対応済み / 未対応に戻す / メモ
 *   - チェックした行をまとめて対応済み / 未対応に戻す
 *   - 明細のダウンロード（CSV。今の絞り込み / 選択した行 / 1件 / 未対応すべて）
 * =================================================================== */

type AnalyzeError = {
  seq: string;
  bmNumber?: string;
  errorType?: string;
  errorTypeLabel?: string;
  errorMessage?: string | null;
  country?: string;
  league?: string;
  dataCategory?: string;
  homeTeamName?: string;
  awayTeamName?: string;
  errorField?: string;
  errorValue?: string | null;
  matchId?: string | null;
  season?: string | null;
  detail?: string | null;
  exceptionClass?: string | null;
  stackTrace?: string | null;
  occurredCount?: number;
  firstOccurredAt?: string | null;
  lastOccurredAt?: string | null;
  resolvedFlg?: boolean;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  note?: string | null;
};

type AnalyzeErrorListResponse = {
  offset?: number;
  limit?: number;
  total?: number;
  items?: AnalyzeError[];
};

type AnalyzeErrorSummary = {
  bmNumber?: string;
  errorType?: string;
  errorTypeLabel?: string;
  country?: string;
  league?: string;
  errorField?: string;
  matchCount?: number;
  unresolvedCount?: number;
  occurredTotal?: number;
  firstOccurredAt?: string | null;
  lastOccurredAt?: string | null;
  latestMessage?: string | null;
};

type AnalyzeErrorResponse = {
  responseCode?: string;
  message?: string;
  item?: AnalyzeError | null;
};

type AnalyzeErrorBatchResponse = {
  responseCode?: string;
  total?: number;
  success?: number;
  failed?: number;
  results?: { seq?: string | null; responseCode?: string; message?: string }[];
};

type StatusFilter = "unresolved" | "resolved" | "all";
type ViewMode = "table" | "card";

type Filters = {
  status: StatusFilter;
  bmNumber: string;
  errorType: string;
  country: string;
  league: string;
  errorField: string;
  keyword: string;
};

const EMPTY_FILTERS: Filters = {
  status: "unresolved",
  bmNumber: "",
  errorType: "",
  country: "",
  league: "",
  errorField: "",
  keyword: "",
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const ENDPOINT = "/v1/api/analyze-error";
const PAGE_SIZE = 20;
const RESOLVED_BY = "ADMIN";

/* ---------- 通信 ---------- */

async function fetchJsonStrict<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    credentials: "include",
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const contentType = response.headers.get("content-type") ?? "";
  const rawText = await response.text();

  // 207（一部失敗）は本文に結果があるので、エラーにしない
  if (!response.ok && response.status !== 207) {
    throw new Error(`HTTP ${response.status}: ${rawText || response.statusText}`);
  }

  if (!contentType.includes("application/json")) {
    throw new Error(`JSON以外のレスポンスを受信しました: ${rawText.slice(0, 200)}`);
  }

  return JSON.parse(rawText) as T;
}

/** Content-Disposition からファイル名を取り出す（filename*=UTF-8'' を優先） */
function fileNameFromDisposition(disposition: string | null, fallback: string): string {
  if (!disposition) return fallback;
  const star = disposition.match(/filename\*\s*=\s*(?:UTF-8|utf-8)''([^;]+)/);
  if (star) {
    try {
      return decodeURIComponent(star[1].trim());
    } catch {
      /* 読めなければ次へ */
    }
  }
  const plain = disposition.match(/filename\s*=\s*"?([^";]+)"?/);
  return plain ? plain[1].trim() : fallback;
}

type DownloadResult = { fileName: string; total: number | null; exported: number | null };

/** CSV を取得して保存する */
async function downloadCsv(params: URLSearchParams): Promise<DownloadResult> {
  const response = await fetch(`${API_BASE}${ENDPOINT}/matches/export?${params.toString()}`, {
    credentials: "include",
    headers: { Accept: "text/csv" },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
  }
  const blob = await response.blob();
  const fileName = fileNameFromDisposition(response.headers.get("content-disposition"), "analyze_error.csv");
  const toNum = (v: string | null) => (v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v));

  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    // クリック直後に消すと保存されないブラウザがあるので少し待つ
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return {
    fileName,
    total: toNum(response.headers.get("x-total-count")),
    exported: toNum(response.headers.get("x-exported-count")),
  };
}

/* ---------- 表示用 ---------- */

function toDisplay(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function formatDateTimeJst(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

function getResolvedStatus(e: AnalyzeError): { label: string; tone: BadgeTone } {
  if (!e.resolvedFlg) return { label: "未対応", tone: "ng" };
  if (e.resolvedBy === "AUTO") return { label: "自動で解決", tone: "info" };
  return { label: "対応済み", tone: "ok" };
}

function getTypeTone(errorType?: string): BadgeTone {
  if (!errorType) return "neutral";
  if (errorType.startsWith("SEASON_") || errorType === "INVALID_CATEGORY") return "warn";
  if (errorType === "MISSING_VALUE" || errorType === "INVALID_VALUE") return "ng";
  return "neutral";
}

function splitFields(errorField?: string): string[] {
  return (errorField ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function matchLabel(e: AnalyzeError): string {
  const home = e.homeTeamName || "";
  const away = e.awayTeamName || "";
  if (!home && !away) return "-";
  if (!away) return home;
  return `${home || "(空)"} vs ${away}`;
}

function countryLeagueLabel(country?: string, league?: string): string {
  if (!country && !league) return "-";
  return `${country || "-"} / ${league || "-"}`;
}

/* ---------- 部品 ---------- */

const FieldChips: React.FC<{ errorField?: string }> = ({ errorField }) => {
  const fields = splitFields(errorField);
  if (fields.length === 0) return <span className="text-gray-300">-</span>;
  return (
    <span className="inline-flex flex-wrap gap-1">
      {fields.map((f) => (
        <span key={f} className="inline-flex h-5 items-center rounded border border-indigo-200 bg-indigo-50 px-1.5 font-mono text-[11px] font-bold text-indigo-800">
          {f}
        </span>
      ))}
    </span>
  );
};

/* ---------- 画面 ---------- */

const AnalyzeErrorMatchesPage: React.FC = () => {
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [offset, setOffset] = useState(0);
  const [response, setResponse] = useState<AnalyzeErrorListResponse | null>(null);
  const [summary, setSummary] = useState<AnalyzeErrorSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkNote, setBulkNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [detail, setDetail] = useState<AnalyzeError | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailNote, setDetailNote] = useState("");

  /* ----- 読み込み ----- */

  const loadList = useCallback(async (f: Filters, targetOffset: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ status: f.status, offset: String(targetOffset), limit: String(PAGE_SIZE) });
      (["bmNumber", "errorType", "country", "league", "errorField", "keyword"] as const).forEach((k) => {
        const v = f[k].trim();
        if (v) params.set(k, v);
      });
      const data = await fetchJsonStrict<AnalyzeErrorListResponse>(`${API_BASE}${ENDPOINT}/matches?${params.toString()}`);
      setResponse(data);
      setSelected(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラー一覧の取得に失敗しました。");
      setResponse(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSummary = useCallback(async () => {
    try {
      const data = await fetchJsonStrict<AnalyzeErrorSummary[]>(`${API_BASE}${ENDPOINT}/summary`);
      setSummary(data ?? []);
    } catch {
      // 集計が取れなくても一覧は使えるので、画面は止めない
      setSummary([]);
    }
  }, []);

  useEffect(() => {
    void loadList(filters, offset);
  }, [filters, offset, loadList]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const reloadAll = useCallback(() => {
    void loadList(filters, offset);
    void loadSummary();
  }, [filters, offset, loadList, loadSummary]);

  /* ----- 絞り込み ----- */

  const applyFilters = (next: Filters) => {
    setDraft(next);
    setFilters(next);
    setOffset(0);
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    applyFilters(draft);
  };

  const handleClear = () => applyFilters({ ...EMPTY_FILTERS, status: draft.status });

  const handleStatusTab = (status: StatusFilter) => applyFilters({ ...draft, status });

  const handleSummaryClick = (s: AnalyzeErrorSummary) =>
    applyFilters({
      ...EMPTY_FILTERS,
      status: "unresolved",
      bmNumber: s.bmNumber ?? "",
      errorType: s.errorType ?? "",
      country: s.country ?? "",
      league: s.league ?? "",
      errorField: splitFields(s.errorField)[0] ?? "",
    });

  /* ----- 集計から作る選択肢・件数 ----- */

  const options = useMemo(() => {
    const bm = new Set<string>();
    const types = new Map<string, string>();
    const countries = new Set<string>();
    const leagues = new Set<string>();
    const fields = new Set<string>();
    summary.forEach((s) => {
      if (s.bmNumber) bm.add(s.bmNumber);
      if (s.errorType) types.set(s.errorType, s.errorTypeLabel ?? s.errorType);
      if (s.country) countries.add(s.country);
      if (s.league && (!draft.country || s.country === draft.country)) leagues.add(s.league);
      splitFields(s.errorField).forEach((f) => fields.add(f));
    });
    const sort = (xs: Iterable<string>) => Array.from(xs).sort((a, b) => a.localeCompare(b, "ja"));
    return {
      bm: sort(bm),
      types: Array.from(types.entries()).sort((a, b) => a[0].localeCompare(b[0])),
      countries: sort(countries),
      leagues: sort(leagues),
      fields: sort(fields),
    };
  }, [summary, draft.country]);

  const totals = useMemo(() => {
    let unresolved = 0;
    let rows = 0;
    let occurred = 0;
    const bmWithUnresolved = new Set<string>();
    summary.forEach((s) => {
      unresolved += s.unresolvedCount ?? 0;
      rows += s.matchCount ?? 0;
      occurred += s.occurredTotal ?? 0;
      if ((s.unresolvedCount ?? 0) > 0 && s.bmNumber) bmWithUnresolved.add(s.bmNumber);
    });
    return { unresolved, rows, occurred, bmCount: bmWithUnresolved.size };
  }, [summary]);

  const topSummary = useMemo(() => summary.filter((s) => (s.unresolvedCount ?? 0) > 0).slice(0, 8), [summary]);

  /* ----- ページング ----- */

  const items = useMemo(() => response?.items ?? [], [response]);
  const total = response?.total ?? 0;
  const currentOffset = response?.offset ?? offset;
  const currentLimit = response?.limit ?? PAGE_SIZE;
  const currentPage = Math.floor(currentOffset / currentLimit) + 1;

  /* ----- 選択 ----- */

  const allOnPageSelected = items.length > 0 && items.every((i) => selected.has(i.seq));

  const toggleOne = (seq: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(seq)) next.delete(seq);
      else next.add(seq);
      return next;
    });

  const toggleAll = () => setSelected(allOnPageSelected ? new Set() : new Set(items.map((i) => i.seq)));

  /* ----- 更新 ----- */

  const updateBatch = async (resolvedFlg: boolean) => {
    if (selected.size === 0) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetchJsonStrict<AnalyzeErrorBatchResponse>(`${API_BASE}${ENDPOINT}/matches/resolve/batch`, {
        method: "PATCH",
        body: JSON.stringify({
          seqs: Array.from(selected),
          resolvedFlg,
          resolvedBy: RESOLVED_BY,
          note: bulkNote.trim() ? bulkNote.trim() : null,
        }),
      });
      const failed = res.failed ?? 0;
      setNotice(`${resolvedFlg ? "対応済みにしました" : "未対応に戻しました"}: 成功 ${res.success ?? 0}件` + (failed > 0 ? ` / 失敗 ${failed}件` : ""));
      setBulkNote("");
      reloadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "更新に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  /* ----- ダウンロード ----- */

  /** 絞り込み条件 → クエリ（一覧と同じ。offset / limit は付けない） */
  const toFilterParams = (f: Filters) => {
    const params = new URLSearchParams({ status: f.status });
    (["bmNumber", "errorType", "country", "league", "errorField", "keyword"] as const).forEach((k) => {
      const v = f[k].trim();
      if (v) params.set(k, v);
    });
    return params;
  };

  const runDownload = async (params: URLSearchParams) => {
    setDownloading(true);
    setError(null);
    setNotice(null);
    try {
      const r = await downloadCsv(params);
      const truncated = r.total !== null && r.exported !== null && r.exported < r.total;
      setNotice(
        `ダウンロードしました: ${r.fileName}` +
          (r.exported !== null ? `（${r.exported}件）` : "") +
          (truncated ? ` ※ 全 ${r.total} 件のうち新しい順に ${r.exported} 件までです。条件を絞ってください。` : ""),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "ダウンロードに失敗しました。");
    } finally {
      setDownloading(false);
    }
  };

  /** 今の絞り込み条件のすべて（ページをまたぐ） */
  const downloadFiltered = () => void runDownload(toFilterParams(filters));

  /** 未対応すべて（絞り込みなし） */
  const downloadUnresolved = () => void runDownload(new URLSearchParams({ status: "unresolved" }));

  /** チェックした行（状態の絞り込みに関係なく出す） */
  const downloadSelected = () => {
    if (selected.size === 0) return;
    const params = new URLSearchParams({ status: "all" });
    params.set("seqs", Array.from(selected).join(","));
    void runDownload(params);
  };

  /** 詳細の1件 */
  const downloadOne = (seq: string) => void runDownload(new URLSearchParams({ status: "all", seqs: seq }));

  const openDetail = async (seq: string) => {
    setDetailLoading(true);
    setDetail({ seq });
    try {
      const data = await fetchJsonStrict<AnalyzeError>(`${API_BASE}${ENDPOINT}/matches/${encodeURIComponent(seq)}`);
      setDetail(data);
      setDetailNote(data.note ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "詳細の取得に失敗しました。");
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const updateDetail = async (resolvedFlg: boolean | null) => {
    if (!detail) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetchJsonStrict<AnalyzeErrorResponse>(`${API_BASE}${ENDPOINT}/matches/${encodeURIComponent(detail.seq)}`, {
        method: "PATCH",
        body: JSON.stringify({ resolvedFlg, resolvedBy: RESOLVED_BY, note: detailNote }),
      });
      if (res.item) {
        setDetail({ ...res.item, stackTrace: res.item.stackTrace ?? detail.stackTrace });
        setDetailNote(res.item.note ?? "");
      }
      setNotice(resolvedFlg === null ? "メモを保存しました" : resolvedFlg ? "対応済みにしました" : "未対応に戻しました");
      reloadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "更新に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  const closeDetail = useCallback(() => setDetail(null), []);

  /* ----- 表の列 ----- */

  const summaryColumns: ConsoleColumn<AnalyzeErrorSummary>[] = [
    { key: "bm", header: "BM", mono: true, cell: (s) => toDisplay(s.bmNumber) },
    { key: "type", header: "種別", cell: (s) => <StatusBadge tone={getTypeTone(s.errorType)}>{toDisplay(s.errorTypeLabel ?? s.errorType)}</StatusBadge> },
    { key: "cl", header: "国 / リーグ", cell: (s) => countryLeagueLabel(s.country, s.league) },
    { key: "field", header: "原因の項目", cell: (s) => <FieldChips errorField={s.errorField} /> },
    { key: "unresolved", header: "未対応", align: "right", cell: (s) => <b className="text-red-700 tabular-nums">{s.unresolvedCount ?? 0}</b> },
    { key: "occurred", header: "発生回数", align: "right", cell: (s) => <span className="tabular-nums">{s.occurredTotal ?? 0}</span> },
    { key: "last", header: "最終発生", mono: true, cell: (s) => formatDateTimeJst(s.lastOccurredAt) },
    { key: "msg", header: "最新の内容", wrap: true, className: "min-w-[240px] max-w-[360px] text-gray-600", cell: (s) => toDisplay(s.latestMessage) },
  ];

  const listColumns: ConsoleColumn<AnalyzeError>[] = [
    {
      key: "check",
      header: <input type="checkbox" checked={allOnPageSelected} onChange={toggleAll} aria-label="このページをすべて選択" className="accent-indigo-600" />,
      cell: (e) => <input type="checkbox" checked={selected.has(e.seq)} onChange={() => toggleOne(e.seq)} aria-label={`${e.seq} を選択`} className="accent-indigo-600" />,
    },
    {
      key: "status",
      header: "状態",
      cell: (e) => {
        const s = getResolvedStatus(e);
        return <StatusBadge tone={s.tone}>{s.label}</StatusBadge>;
      },
    },
    { key: "last", header: "最終発生", mono: true, cell: (e) => formatDateTimeJst(e.lastOccurredAt) },
    { key: "bm", header: "BM", mono: true, cell: (e) => toDisplay(e.bmNumber) },
    { key: "type", header: "種別", cell: (e) => <StatusBadge tone={getTypeTone(e.errorType)}>{toDisplay(e.errorTypeLabel ?? e.errorType)}</StatusBadge> },
    { key: "cl", header: "国 / リーグ", cell: (e) => countryLeagueLabel(e.country, e.league) },
    {
      key: "match",
      header: "試合",
      wrap: true,
      className: "min-w-[200px]",
      cell: (e) => (
        <>
          <div className="font-bold">{matchLabel(e)}</div>
          <div className="text-[11px] text-gray-500">{toDisplay(e.dataCategory)}</div>
        </>
      ),
    },
    { key: "field", header: "原因の項目", cell: (e) => <FieldChips errorField={e.errorField} /> },
    { key: "value", header: "値", wrap: true, className: "max-w-[240px] break-all font-mono text-[12px]", cell: (e) => toDisplay(e.errorValue) },
    { key: "count", header: "回数", align: "right", cell: (e) => <span className="tabular-nums">{e.occurredCount ?? 0}</span> },
    {
      key: "open",
      header: "詳細",
      cell: (e) => (
        <button type="button" className="text-xs font-bold text-indigo-600 hover:underline" onClick={() => void openDetail(e.seq)}>
          開く
        </button>
      ),
    },
  ];

  const pagingProps = {
    page: currentPage,
    pageSize: currentLimit,
    total,
    onChange: (p: number) => setOffset((p - 1) * currentLimit),
  };

  /* ----- 描画 ----- */

  return (
    <div>
      <ConsoleToolbar
        title="登録できなかった試合"
        info="analyze_error_match"
        description="統計処理（BM）で登録できなかった試合と、その原因（項目・値）を表示します。直ったら「対応済み」にしてください。同じエラーが再発すると自動で未対応に戻り、正常に登録できると自動で解決（AUTO）になります。"
      >
        {totals.unresolved > 0 && (
          <ConsoleButton variant="danger" onClick={downloadUnresolved} loading={downloading} title="絞り込みに関係なく、未対応のエラーをすべて CSV で保存します">
            {!downloading && <Download className="h-3.5 w-3.5" />}
            未対応の明細（{fmtNum(totals.unresolved)}件）
          </ConsoleButton>
        )}
        <ConsoleButton variant="primary" onClick={reloadAll} loading={loading}>
          {!loading && <RefreshCw className="h-3.5 w-3.5" />}
          再読み込み
        </ConsoleButton>
      </ConsoleToolbar>

      <StatChips
        items={[
          { label: "未対応", value: `${fmtNum(totals.unresolved)}件`, tone: totals.unresolved > 0 ? "ng" : "ok" },
          { label: "未対応がある BM", value: fmtNum(totals.bmCount) },
          { label: "記録されたエラー（対応済みを含む）", value: `${fmtNum(totals.rows)}件` },
          { label: "発生回数の合計", value: `${fmtNum(totals.occurred)}回` },
        ]}
      />

      {error && (
        <ConsoleNotice tone="ng" onClose={() => setError(null)}>
          {error}
        </ConsoleNotice>
      )}
      {notice && (
        <ConsoleNotice tone="ok" onClose={() => setNotice(null)}>
          {notice}
        </ConsoleNotice>
      )}

      {/* ===== 集計 ===== */}
      <ConsolePanel title="未対応が多い組み合わせ" info="行をクリックするとその条件で絞り込みます" flush>
        <div className="p-2">
          <ConsoleTable
            columns={summaryColumns}
            rows={topSummary}
            rowKey={(s, i) => `${s.bmNumber}-${s.errorType}-${s.country}-${s.league}-${s.errorField}-${i}`}
            onRowClick={handleSummaryClick}
            emptyText="未対応のエラーはありません。"
          />
        </div>
      </ConsolePanel>

      {/* ===== 絞り込み ===== */}
      <ConsolePanel
        title="絞り込み"
        right={
          <SegmentedTabs<StatusFilter>
            value={filters.status}
            onChange={handleStatusTab}
            options={[
              { value: "unresolved", label: "未対応" },
              { value: "resolved", label: "対応済み" },
              { value: "all", label: "すべて" },
            ]}
          />
        }
      >
        <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-2">
          <ConsoleField label="BM">
            <ConsoleSelect value={draft.bmNumber} onChange={(e) => setDraft({ ...draft, bmNumber: e.target.value })} className="w-40">
              <option value="">すべて</option>
              {options.bm.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </ConsoleSelect>
          </ConsoleField>

          <ConsoleField label="種別">
            <ConsoleSelect value={draft.errorType} onChange={(e) => setDraft({ ...draft, errorType: e.target.value })} className="w-48">
              <option value="">すべて</option>
              {options.types.map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </ConsoleSelect>
          </ConsoleField>

          <ConsoleField label="国">
            <ConsoleInput list="analyze-error-countries" value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value, league: "" })} placeholder="完全一致" className="w-36" />
            <datalist id="analyze-error-countries">
              {options.countries.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </ConsoleField>

          <ConsoleField label="リーグ">
            <ConsoleInput list="analyze-error-leagues" value={draft.league} onChange={(e) => setDraft({ ...draft, league: e.target.value })} placeholder="完全一致" className="w-40" />
            <datalist id="analyze-error-leagues">
              {options.leagues.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
          </ConsoleField>

          <ConsoleField label="原因の項目">
            <ConsoleSelect value={draft.errorField} onChange={(e) => setDraft({ ...draft, errorField: e.target.value })} className="w-40">
              <option value="">すべて</option>
              {options.fields.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </ConsoleSelect>
          </ConsoleField>

          <ConsoleField label="キーワード（チーム名・キー・内容・マッチID・値）" className="min-w-[220px] flex-1">
            <ConsoleInput value={draft.keyword} onChange={(e) => setDraft({ ...draft, keyword: e.target.value })} className="w-full" />
          </ConsoleField>

          <ConsoleButton type="submit" variant="primary" disabled={loading}>
            <Search className="h-3.5 w-3.5" />
            検索
          </ConsoleButton>
          <ConsoleButton onClick={handleClear}>条件クリア</ConsoleButton>
        </form>
      </ConsolePanel>

      {/* ===== 一覧 ===== */}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h2 className="m-0 text-sm font-bold text-gray-900">一覧</h2>
        <span className="text-xs text-gray-500">全 {fmtNum(total)} 件</span>
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <ConsoleButton onClick={downloadFiltered} disabled={total === 0} loading={downloading} title="今の絞り込み条件に合う明細を、ページをまたいで CSV で保存します（スタックトレースを含む）">
            {!downloading && <Download className="h-3.5 w-3.5" />}
            明細をダウンロード（{fmtNum(total)}件）
          </ConsoleButton>
          <SegmentedTabs<ViewMode>
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: "table", label: "表" },
              { value: "card", label: "カード" },
            ]}
          />
        </div>
      </div>

      {/* まとめて更新 */}
      <div className={["mb-2 flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2", selected.size > 0 ? "border-indigo-200 bg-indigo-50" : "border-gray-200 bg-white"].join(" ")}>
        <span className="text-[13px] font-bold text-gray-900">選択中: {selected.size}件</span>
        <ConsoleInput value={bulkNote} onChange={(e) => setBulkNote(e.target.value)} placeholder="メモ（任意。選択した行に上書きされます）" className="min-w-[240px] flex-1" />
        <ConsoleButton variant="success" onClick={() => void updateBatch(true)} disabled={selected.size === 0} loading={saving}>
          対応済みにする
        </ConsoleButton>
        <ConsoleButton onClick={() => void updateBatch(false)} disabled={selected.size === 0 || saving}>
          未対応に戻す
        </ConsoleButton>
        <ConsoleButton onClick={downloadSelected} disabled={selected.size === 0 || downloading}>
          選択した行をダウンロード
        </ConsoleButton>
      </div>

      {viewMode === "table" ? (
        <ConsoleTable
          columns={listColumns}
          rows={items}
          rowKey={(e) => e.seq}
          loading={loading}
          emptyText="対象データがありません。"
          rowClassName={(e) => (selected.has(e.seq) ? "!bg-indigo-50" : "")}
          paging={pagingProps}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {items.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-gray-400">{loading ? "読み込み中…" : "表示対象のエラーがありません。"}</div>
          ) : (
            items.map((e) => {
              const status = getResolvedStatus(e);
              return (
                <div key={e.seq} className={`flex gap-2.5 border-t border-gray-100 px-3 py-2.5 first:border-t-0 ${selected.has(e.seq) ? "bg-indigo-50" : ""}`}>
                  <input type="checkbox" checked={selected.has(e.seq)} onChange={() => toggleOne(e.seq)} aria-label={`${e.seq} を選択`} className="mt-1 accent-indigo-600" />
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[11px] text-gray-500">
                      seq: {e.seq} / {toDisplay(e.bmNumber)} / {countryLeagueLabel(e.country, e.league)}
                    </div>
                    <div className="text-[14px] font-bold text-gray-900">{matchLabel(e)}</div>
                    <div className="text-[11px] text-gray-500">{toDisplay(e.dataCategory)}</div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                      <StatusBadge tone={getTypeTone(e.errorType)}>{toDisplay(e.errorTypeLabel ?? e.errorType)}</StatusBadge>
                      <FieldChips errorField={e.errorField} />
                      <span className="text-xs text-gray-500">発生 {e.occurredCount ?? 0}回</span>
                      <span className="font-mono text-xs text-gray-500">最終 {formatDateTimeJst(e.lastOccurredAt)}</span>
                    </div>
                    {e.errorValue && <div className="mt-1 break-all font-mono text-xs">{e.errorValue}</div>}
                    {e.errorMessage && <div className="mt-1 text-xs text-gray-600">{e.errorMessage}</div>}
                    {e.note && <div className="mt-1 text-xs text-gray-700">メモ: {e.note}</div>}
                  </div>
                  <button type="button" className="self-start text-xs font-bold text-indigo-600 hover:underline" onClick={() => void openDetail(e.seq)}>
                    詳細
                  </button>
                </div>
              );
            })
          )}
          {total > 0 && (
            <div className="flex items-center justify-between gap-2 border-t border-gray-200 px-2.5 py-2 text-xs text-gray-500">
              <span>
                {currentPage} / {Math.max(1, Math.ceil(total / currentLimit))} ページ
              </span>
              <div className="flex gap-1.5">
                <ConsoleButton size="sm" disabled={currentOffset <= 0 || loading} onClick={() => setOffset(Math.max(0, currentOffset - currentLimit))}>
                  前へ
                </ConsoleButton>
                <ConsoleButton size="sm" disabled={currentOffset + currentLimit >= total || loading} onClick={() => setOffset(currentOffset + currentLimit)}>
                  次へ
                </ConsoleButton>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== 詳細 ===== */}
      <ConsoleDrawer
        open={detail !== null}
        title="エラーの詳細"
        onClose={closeDetail}
        actions={
          detail && (
            <ConsoleButton size="sm" disabled={detailLoading} loading={downloading} onClick={() => downloadOne(detail.seq)}>
              {!downloading && <Download className="h-3.5 w-3.5" />}
              この明細をダウンロード
            </ConsoleButton>
          )
        }
      >
        {detail &&
          (detailLoading ? (
            <div className="py-10 text-center text-sm text-gray-400">読み込み中…</div>
          ) : (
            <>
              <div className="mb-2 flex flex-wrap gap-1.5">
                <StatusBadge tone={getResolvedStatus(detail).tone}>{getResolvedStatus(detail).label}</StatusBadge>
                <StatusBadge tone={getTypeTone(detail.errorType)}>{toDisplay(detail.errorTypeLabel ?? detail.errorType)}</StatusBadge>
                <StatusBadge tone="neutral" dot={false}>
                  {toDisplay(detail.bmNumber)}
                </StatusBadge>
              </div>

              <DetailRow label="seq">
                <span className="font-mono">{detail.seq}</span>
              </DetailRow>
              <DetailRow label="試合">{matchLabel(detail)}</DetailRow>
              <DetailRow label="キー">{toDisplay(detail.dataCategory)}</DetailRow>
              <DetailRow label="国 / リーグ">{countryLeagueLabel(detail.country, detail.league)}</DetailRow>
              <DetailRow label="シーズン">{toDisplay(detail.season)}</DetailRow>
              <DetailRow label="マッチID">
                <span className="font-mono">{toDisplay(detail.matchId)}</span>
              </DetailRow>
              <DetailRow label="原因の項目">
                <FieldChips errorField={detail.errorField} />
              </DetailRow>
              <DetailRow label="値">
                <span className="font-mono">{toDisplay(detail.errorValue)}</span>
              </DetailRow>
              <DetailRow label="エラー内容">{toDisplay(detail.errorMessage)}</DetailRow>
              <DetailRow label="補足">{toDisplay(detail.detail)}</DetailRow>
              <DetailRow label="発生回数">{detail.occurredCount ?? 0}回</DetailRow>
              <DetailRow label="最初の発生">
                <span className="font-mono">{formatDateTimeJst(detail.firstOccurredAt)}</span>
              </DetailRow>
              <DetailRow label="最後の発生">
                <span className="font-mono">{formatDateTimeJst(detail.lastOccurredAt)}</span>
              </DetailRow>
              <DetailRow label="対応">{detail.resolvedFlg ? `${formatDateTimeJst(detail.resolvedAt)} / ${toDisplay(detail.resolvedBy)}` : "-"}</DetailRow>
              <DetailRow label="例外">
                <span className="font-mono">{toDisplay(detail.exceptionClass)}</span>
              </DetailRow>

              {detail.stackTrace && (
                <div className="mt-3">
                  <div className="mb-1 text-xs text-gray-500">スタックトレース（先頭のみ）</div>
                  <pre className="m-0 max-h-72 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-slate-900 p-2.5 text-[11px] leading-relaxed text-slate-200">{detail.stackTrace}</pre>
                </div>
              )}

              <div className="mt-4">
                <ConsoleField label="メモ">
                  <ConsoleTextarea value={detailNote} onChange={(e) => setDetailNote(e.target.value)} rows={3} placeholder="対応内容など（マスタに追加した、など）" className="w-full resize-y" />
                </ConsoleField>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {!detail.resolvedFlg ? (
                    <ConsoleButton variant="success" loading={saving} onClick={() => void updateDetail(true)}>
                      対応済みにする
                    </ConsoleButton>
                  ) : (
                    <ConsoleButton loading={saving} onClick={() => void updateDetail(false)}>
                      未対応に戻す
                    </ConsoleButton>
                  )}
                  <ConsoleButton disabled={saving} onClick={() => void updateDetail(null)}>
                    メモだけ保存
                  </ConsoleButton>
                </div>
              </div>
            </>
          ))}
      </ConsoleDrawer>
    </div>
  );
};

export default AnalyzeErrorMatchesPage;
