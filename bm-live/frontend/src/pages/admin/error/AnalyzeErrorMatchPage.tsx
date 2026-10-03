import React, { useCallback, useEffect, useMemo, useState } from "react";

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
type StatusTone = "gray" | "blue" | "emerald" | "amber" | "rose";

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
const ENDPOINT = "/api/analyze-error";
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

function getResolvedStatus(e: AnalyzeError): { label: string; tone: StatusTone } {
  if (!e.resolvedFlg) return { label: "未対応", tone: "rose" };
  if (e.resolvedBy === "AUTO") return { label: "自動で解決", tone: "blue" };
  return { label: "対応済み", tone: "emerald" };
}

function getTypeTone(errorType?: string): StatusTone {
  if (!errorType) return "gray";
  if (errorType.startsWith("SEASON_") || errorType === "INVALID_CATEGORY") return "amber";
  if (errorType === "MISSING_VALUE" || errorType === "INVALID_VALUE") return "rose";
  return "gray";
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

/* ---------- スタイル（試合予定一覧と同じ） ---------- */

const pageStyle: React.CSSProperties = {
  padding: 16,
  fontSize: 12,
  color: "#0f172a",
  background: "#f8fafc",
  minHeight: "100vh",
  boxSizing: "border-box",
};

const sectionStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: 16,
  marginBottom: 16,
};

const buttonStyle: React.CSSProperties = {
  height: 32,
  padding: "0 12px",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  background: "#fff",
  cursor: "pointer",
  fontSize: 12,
  whiteSpace: "nowrap",
};

const primaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: "#2563eb",
  color: "#fff",
  border: "1px solid #2563eb",
};

const successButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: "#15803d",
  color: "#fff",
  border: "1px solid #15803d",
};

const dangerButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: "#b91c1c",
  border: "1px solid #b91c1c",
  color: "#ffffff",
};

const disabledButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  opacity: 0.45,
  cursor: "not-allowed",
};

const linkButtonStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#2563eb",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 600,
  padding: 0,
};

const inputStyle: React.CSSProperties = {
  height: 32,
  border: "1px solid #94a3b8",
  borderRadius: 8,
  padding: "4px 8px",
  fontSize: 12,
  boxSizing: "border-box",
  background: "#fff",
};

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  fontSize: 11,
  color: "#64748b",
};

const badgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 28,
  padding: "0 10px",
  borderRadius: 9999,
  background: "#f1f5f9",
  color: "#334155",
  fontSize: 12,
  border: "1px solid #e2e8f0",
};

const fieldChipStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 22,
  padding: "0 8px",
  borderRadius: 6,
  background: "#eef2ff",
  color: "#3730a3",
  border: "1px solid #c7d2fe",
  fontSize: 11,
  fontWeight: 700,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const infoCardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: 14,
  minWidth: 180,
  flex: "1 1 180px",
};

const infoLabelStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#64748b",
  marginBottom: 6,
};

const infoValueStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  color: "#0f172a",
  lineHeight: 1.3,
};

const tableWrapperStyle: React.CSSProperties = {
  overflowX: "auto",
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  marginTop: 10,
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 12,
};

const thTdStyle: React.CSSProperties = {
  borderBottom: "1px solid #e2e8f0",
  padding: "8px 10px",
  fontSize: 12,
  verticalAlign: "top",
  lineHeight: 1.5,
  textAlign: "left",
};

const thStyle: React.CSSProperties = {
  ...thTdStyle,
  background: "#f8fafc",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const matchCardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: 14,
  background: "#fff",
};

const statusPillBaseStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 26,
  minWidth: 64,
  padding: "0 10px",
  borderRadius: 9999,
  fontSize: 12,
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const tabContainerStyle: React.CSSProperties = {
  display: "inline-flex",
  gap: 8,
  padding: 4,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
};

const tabBaseStyle: React.CSSProperties = {
  height: 36,
  padding: "0 14px",
  borderRadius: 10,
  border: "1px solid transparent",
  background: "transparent",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 700,
  color: "#475569",
};

const preStyle: React.CSSProperties = {
  margin: 0,
  padding: 10,
  background: "#0f172a",
  color: "#e2e8f0",
  borderRadius: 8,
  fontSize: 11,
  lineHeight: 1.5,
  maxHeight: 280,
  overflow: "auto",
  whiteSpace: "pre-wrap",
  wordBreak: "break-all",
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.45)",
  display: "flex",
  justifyContent: "flex-end",
  zIndex: 1000,
};

const drawerStyle: React.CSSProperties = {
  width: "min(720px, 100%)",
  height: "100%",
  background: "#fff",
  boxShadow: "-4px 0 16px rgba(15, 23, 42, 0.15)",
  padding: 20,
  overflowY: "auto",
  boxSizing: "border-box",
};

function getTabStyle(active: boolean): React.CSSProperties {
  return active
    ? {
        ...tabBaseStyle,
        background: "#2563eb",
        color: "#ffffff",
        border: "1px solid #2563eb",
        boxShadow: "0 1px 2px rgba(37, 99, 235, 0.2)",
      }
    : tabBaseStyle;
}

function getStatusPillStyle(tone: StatusTone): React.CSSProperties {
  const colors: Record<StatusTone, [string, string, string]> = {
    blue: ["#dbeafe", "#1d4ed8", "#bfdbfe"],
    emerald: ["#dcfce7", "#15803d", "#bbf7d0"],
    amber: ["#fef3c7", "#b45309", "#fde68a"],
    rose: ["#fee2e2", "#b91c1c", "#fecaca"],
    gray: ["#e2e8f0", "#475569", "#cbd5e1"],
  };
  const [bg, fg, border] = colors[tone];
  return { ...statusPillBaseStyle, background: bg, color: fg, border: `1px solid ${border}` };
}

/* ---------- 部品 ---------- */

const FieldChips: React.FC<{ errorField?: string }> = ({ errorField }) => {
  const fields = splitFields(errorField);
  if (fields.length === 0) return <span style={{ color: "#94a3b8" }}>-</span>;
  return (
    <span style={{ display: "inline-flex", gap: 4, flexWrap: "wrap" }}>
      {fields.map((f) => (
        <span key={f} style={fieldChipStyle}>
          {f}
        </span>
      ))}
    </span>
  );
};

const DetailRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 8, padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
    <div style={{ color: "#64748b" }}>{label}</div>
    <div style={{ wordBreak: "break-all" }}>{children}</div>
  </div>
);

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

  /* ----- 集計から作る選択肢・カード ----- */

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
  const totalPages = Math.max(1, Math.ceil(total / currentLimit));
  const canPrev = currentOffset > 0 && !loading;
  const canNext = currentOffset + currentLimit < total && !loading;

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

  /* ----- 描画 ----- */

  return (
    <div style={pageStyle}>
      {/* ===== 見出し・集計 ===== */}
      <div style={sectionStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, lineHeight: 1.3 }}>登録できなかった試合</h1>
            <p style={{ margin: "6px 0 0", color: "#475569", fontSize: 12 }}>
              統計処理（BM）で登録できなかった試合と、その原因（項目・値）を表示します。直ったら「対応済み」にしてください。
              同じエラーが再発すると自動で未対応に戻り、正常に登録できると自動で解決（AUTO）になります。
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
            {totals.unresolved > 0 && (
              <button
                type="button"
                onClick={downloadUnresolved}
                style={downloading ? disabledButtonStyle : dangerButtonStyle}
                disabled={downloading}
                title="絞り込みに関係なく、未対応のエラーをすべて CSV で保存します"
              >
                {downloading ? "作成中..." : `未対応の明細をダウンロード（${totals.unresolved}件）`}
              </button>
            )}
            <button type="button" onClick={reloadAll} style={loading ? disabledButtonStyle : primaryButtonStyle} disabled={loading}>
              {loading ? "読込中..." : "再読み込み"}
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <div style={infoCardStyle}>
            <div style={infoLabelStyle}>未対応</div>
            <div style={{ ...infoValueStyle, color: totals.unresolved > 0 ? "#b91c1c" : "#15803d" }}>{totals.unresolved}件</div>
            <div style={{ marginTop: 8, color: "#475569", fontSize: 12 }}>未対応がある BM: {totals.bmCount}</div>
          </div>
          <div style={infoCardStyle}>
            <div style={infoLabelStyle}>記録されたエラー（対応済みを含む）</div>
            <div style={infoValueStyle}>{totals.rows}件</div>
          </div>
          <div style={infoCardStyle}>
            <div style={infoLabelStyle}>発生回数の合計</div>
            <div style={infoValueStyle}>{totals.occurred}回</div>
            <div style={{ marginTop: 8, color: "#475569", fontSize: 12 }}>同じ試合の再発は1件にまとめて回数を数えます</div>
          </div>
        </div>

        <h3 style={{ margin: "0 0 8px", fontSize: 14 }}>未対応が多い組み合わせ</h3>
        {topSummary.length === 0 ? (
          <div style={{ color: "#475569", background: "#f8fafc", padding: 12, borderRadius: 10 }}>未対応のエラーはありません。</div>
        ) : (
          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>BM</th>
                  <th style={thStyle}>種別</th>
                  <th style={thStyle}>国 / リーグ</th>
                  <th style={thStyle}>原因の項目</th>
                  <th style={thStyle}>未対応</th>
                  <th style={thStyle}>発生回数</th>
                  <th style={thStyle}>最終発生</th>
                  <th style={thStyle}>最新の内容</th>
                </tr>
              </thead>
              <tbody>
                {topSummary.map((s, idx) => (
                  <tr
                    key={`${s.bmNumber}-${s.errorType}-${s.country}-${s.league}-${s.errorField}-${idx}`}
                    onClick={() => handleSummaryClick(s)}
                    style={{ cursor: "pointer" }}
                    title="クリックでこの条件に絞り込み"
                  >
                    <td style={thTdStyle}>{toDisplay(s.bmNumber)}</td>
                    <td style={thTdStyle}>
                      <span style={getStatusPillStyle(getTypeTone(s.errorType))}>{toDisplay(s.errorTypeLabel ?? s.errorType)}</span>
                    </td>
                    <td style={thTdStyle}>{countryLeagueLabel(s.country, s.league)}</td>
                    <td style={thTdStyle}>
                      <FieldChips errorField={s.errorField} />
                    </td>
                    <td style={{ ...thTdStyle, fontWeight: 700, color: "#b91c1c" }}>{s.unresolvedCount ?? 0}</td>
                    <td style={thTdStyle}>{s.occurredTotal ?? 0}</td>
                    <td style={thTdStyle}>{formatDateTimeJst(s.lastOccurredAt)}</td>
                    <td style={{ ...thTdStyle, maxWidth: 320 }}>{toDisplay(s.latestMessage)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== 絞り込み ===== */}
      <div style={sectionStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>絞り込み</h2>
          <div style={tabContainerStyle}>
            <button type="button" style={getTabStyle(filters.status === "unresolved")} onClick={() => handleStatusTab("unresolved")}>
              未対応
            </button>
            <button type="button" style={getTabStyle(filters.status === "resolved")} onClick={() => handleStatusTab("resolved")}>
              対応済み
            </button>
            <button type="button" style={getTabStyle(filters.status === "all")} onClick={() => handleStatusTab("all")}>
              すべて
            </button>
          </div>
        </div>

        <form onSubmit={handleSearch} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <label style={labelStyle}>
            BM
            <select value={draft.bmNumber} onChange={(e) => setDraft({ ...draft, bmNumber: e.target.value })} style={{ ...inputStyle, width: 170 }}>
              <option value="">すべて</option>
              {options.bm.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>

          <label style={labelStyle}>
            種別
            <select value={draft.errorType} onChange={(e) => setDraft({ ...draft, errorType: e.target.value })} style={{ ...inputStyle, width: 200 }}>
              <option value="">すべて</option>
              {options.types.map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label style={labelStyle}>
            国
            <input
              list="analyze-error-countries"
              value={draft.country}
              onChange={(e) => setDraft({ ...draft, country: e.target.value, league: "" })}
              style={{ ...inputStyle, width: 140 }}
              placeholder="完全一致"
            />
            <datalist id="analyze-error-countries">
              {options.countries.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>

          <label style={labelStyle}>
            リーグ
            <input list="analyze-error-leagues" value={draft.league} onChange={(e) => setDraft({ ...draft, league: e.target.value })} style={{ ...inputStyle, width: 160 }} placeholder="完全一致" />
            <datalist id="analyze-error-leagues">
              {options.leagues.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
          </label>

          <label style={labelStyle}>
            原因の項目
            <select value={draft.errorField} onChange={(e) => setDraft({ ...draft, errorField: e.target.value })} style={{ ...inputStyle, width: 160 }}>
              <option value="">すべて</option>
              {options.fields.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>

          <label style={{ ...labelStyle, flex: "1 1 220px" }}>
            キーワード（チーム名・キー・内容・マッチID・値）
            <input value={draft.keyword} onChange={(e) => setDraft({ ...draft, keyword: e.target.value })} style={{ ...inputStyle, width: "100%" }} />
          </label>

          <button type="submit" style={loading ? disabledButtonStyle : primaryButtonStyle} disabled={loading}>
            検索
          </button>
          <button type="button" onClick={handleClear} style={buttonStyle}>
            条件クリア
          </button>
        </form>
      </div>

      {/* ===== 一覧 ===== */}
      <div style={sectionStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>一覧</h2>
            <span style={badgeStyle}>全 {total} 件</span>
            <span style={badgeStyle}>
              page: {currentPage} / {totalPages}
            </span>
            <button type="button" onClick={() => canPrev && setOffset(Math.max(0, currentOffset - currentLimit))} style={canPrev ? buttonStyle : disabledButtonStyle} disabled={!canPrev}>
              前へ
            </button>
            <button type="button" onClick={() => canNext && setOffset(currentOffset + currentLimit)} style={canNext ? buttonStyle : disabledButtonStyle} disabled={!canNext}>
              次へ
            </button>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={downloadFiltered}
              style={total > 0 && !downloading ? buttonStyle : disabledButtonStyle}
              disabled={total === 0 || downloading}
              title="今の絞り込み条件に合う明細を、ページをまたいで CSV で保存します（スタックトレースを含む）"
            >
              {downloading ? "作成中..." : `明細をダウンロード（CSV・${total}件）`}
            </button>
            <div style={tabContainerStyle}>
              <button type="button" style={getTabStyle(viewMode === "table")} onClick={() => setViewMode("table")}>
                一覧テーブル
              </button>
              <button type="button" style={getTabStyle(viewMode === "card")} onClick={() => setViewMode("card")}>
                カード表示
              </button>
            </div>
          </div>
        </div>

        {error && <div style={{ marginBottom: 12, color: "#b91c1c", background: "#fee2e2", padding: 10, borderRadius: 8 }}>{error}</div>}
        {notice && <div style={{ marginBottom: 12, color: "#15803d", background: "#dcfce7", padding: 10, borderRadius: 8 }}>{notice}</div>}

        {/* まとめて更新 */}
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
            padding: 10,
            background: selected.size > 0 ? "#eff6ff" : "#f8fafc",
            border: `1px solid ${selected.size > 0 ? "#bfdbfe" : "#e2e8f0"}`,
            borderRadius: 10,
          }}
        >
          <span style={{ fontWeight: 700 }}>選択中: {selected.size}件</span>
          <input value={bulkNote} onChange={(e) => setBulkNote(e.target.value)} placeholder="メモ（任意。選択した行に上書きされます）" style={{ ...inputStyle, flex: "1 1 240px" }} />
          <button type="button" onClick={() => void updateBatch(true)} style={selected.size > 0 && !saving ? successButtonStyle : disabledButtonStyle} disabled={selected.size === 0 || saving}>
            対応済みにする
          </button>
          <button type="button" onClick={() => void updateBatch(false)} style={selected.size > 0 && !saving ? buttonStyle : disabledButtonStyle} disabled={selected.size === 0 || saving}>
            未対応に戻す
          </button>
          <button type="button" onClick={downloadSelected} style={selected.size > 0 && !downloading ? buttonStyle : disabledButtonStyle} disabled={selected.size === 0 || downloading}>
            選択した行をダウンロード
          </button>
        </div>

        {viewMode === "table" ? (
          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>
                    <input type="checkbox" checked={allOnPageSelected} onChange={toggleAll} aria-label="このページをすべて選択" />
                  </th>
                  <th style={thStyle}>状態</th>
                  <th style={thStyle}>最終発生</th>
                  <th style={thStyle}>BM</th>
                  <th style={thStyle}>種別</th>
                  <th style={thStyle}>国 / リーグ</th>
                  <th style={thStyle}>試合</th>
                  <th style={thStyle}>原因の項目</th>
                  <th style={thStyle}>値</th>
                  <th style={thStyle}>回数</th>
                  <th style={thStyle}>詳細</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={thTdStyle}>
                      {loading ? "読込中..." : "対象データがありません。"}
                    </td>
                  </tr>
                ) : (
                  items.map((e) => {
                    const status = getResolvedStatus(e);
                    return (
                      <tr key={e.seq} style={{ background: selected.has(e.seq) ? "#eff6ff" : undefined }}>
                        <td style={thTdStyle}>
                          <input type="checkbox" checked={selected.has(e.seq)} onChange={() => toggleOne(e.seq)} aria-label={`${e.seq} を選択`} />
                        </td>
                        <td style={thTdStyle}>
                          <span style={getStatusPillStyle(status.tone)}>{status.label}</span>
                        </td>
                        <td style={{ ...thTdStyle, whiteSpace: "nowrap" }}>{formatDateTimeJst(e.lastOccurredAt)}</td>
                        <td style={{ ...thTdStyle, whiteSpace: "nowrap" }}>{toDisplay(e.bmNumber)}</td>
                        <td style={thTdStyle}>
                          <span style={getStatusPillStyle(getTypeTone(e.errorType))}>{toDisplay(e.errorTypeLabel ?? e.errorType)}</span>
                        </td>
                        <td style={thTdStyle}>{countryLeagueLabel(e.country, e.league)}</td>
                        <td style={thTdStyle}>
                          <div style={{ fontWeight: 600 }}>{matchLabel(e)}</div>
                          <div style={{ color: "#64748b", fontSize: 11 }}>{toDisplay(e.dataCategory)}</div>
                        </td>
                        <td style={thTdStyle}>
                          <FieldChips errorField={e.errorField} />
                        </td>
                        <td style={{ ...thTdStyle, maxWidth: 240, wordBreak: "break-all" }}>{toDisplay(e.errorValue)}</td>
                        <td style={thTdStyle}>{e.occurredCount ?? 0}</td>
                        <td style={thTdStyle}>
                          <button type="button" style={linkButtonStyle} onClick={() => void openDetail(e.seq)}>
                            開く
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : items.length === 0 ? (
          <div style={{ color: "#475569", background: "#f8fafc", padding: 12, borderRadius: 10, marginTop: 10 }}>{loading ? "読込中..." : "表示対象のエラーがありません。"}</div>
        ) : (
          <div style={{ display: "grid", gap: 12, marginTop: 10 }}>
            {items.map((e) => {
              const status = getResolvedStatus(e);
              return (
                <div key={e.seq} style={{ ...matchCardStyle, borderColor: selected.has(e.seq) ? "#93c5fd" : "#e2e8f0" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <input type="checkbox" checked={selected.has(e.seq)} onChange={() => toggleOne(e.seq)} aria-label={`${e.seq} を選択`} style={{ marginTop: 4 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>
                        seq: {e.seq} / {toDisplay(e.bmNumber)} / {countryLeagueLabel(e.country, e.league)}
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.4 }}>{matchLabel(e)}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{toDisplay(e.dataCategory)}</div>

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10, alignItems: "center" }}>
                        <span style={getStatusPillStyle(status.tone)}>{status.label}</span>
                        <span style={getStatusPillStyle(getTypeTone(e.errorType))}>{toDisplay(e.errorTypeLabel ?? e.errorType)}</span>
                        <FieldChips errorField={e.errorField} />
                        <span style={badgeStyle}>発生 {e.occurredCount ?? 0}回</span>
                        <span style={badgeStyle}>最終発生: {formatDateTimeJst(e.lastOccurredAt)}</span>
                      </div>

                      {e.errorValue && <div style={{ marginTop: 8, fontFamily: "ui-monospace, Menlo, monospace" }}>{e.errorValue}</div>}
                      {e.errorMessage && <div style={{ marginTop: 6, color: "#475569" }}>{e.errorMessage}</div>}
                      {e.note && <div style={{ marginTop: 6, color: "#334155" }}>メモ: {e.note}</div>}

                      <div style={{ marginTop: 10 }}>
                        <button type="button" style={linkButtonStyle} onClick={() => void openDetail(e.seq)}>
                          詳細を開く
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== 詳細 ===== */}
      {detail && (
        <div style={overlayStyle} onClick={() => setDetail(null)}>
          <div style={drawerStyle} onClick={(ev) => ev.stopPropagation()} role="dialog" aria-modal="true">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>エラーの詳細</h2>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" style={detailLoading || downloading ? disabledButtonStyle : buttonStyle} disabled={detailLoading || downloading} onClick={() => downloadOne(detail.seq)}>
                  この明細をダウンロード
                </button>
                <button type="button" style={buttonStyle} onClick={() => setDetail(null)}>
                  閉じる
                </button>
              </div>
            </div>

            {detailLoading ? (
              <div>読込中...</div>
            ) : (
              <>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                  <span style={getStatusPillStyle(getResolvedStatus(detail).tone)}>{getResolvedStatus(detail).label}</span>
                  <span style={getStatusPillStyle(getTypeTone(detail.errorType))}>{toDisplay(detail.errorTypeLabel ?? detail.errorType)}</span>
                  <span style={badgeStyle}>{toDisplay(detail.bmNumber)}</span>
                </div>

                <DetailRow label="seq">{detail.seq}</DetailRow>
                <DetailRow label="試合">{matchLabel(detail)}</DetailRow>
                <DetailRow label="キー">{toDisplay(detail.dataCategory)}</DetailRow>
                <DetailRow label="国 / リーグ">{countryLeagueLabel(detail.country, detail.league)}</DetailRow>
                <DetailRow label="シーズン">{toDisplay(detail.season)}</DetailRow>
                <DetailRow label="マッチID">{toDisplay(detail.matchId)}</DetailRow>
                <DetailRow label="原因の項目">
                  <FieldChips errorField={detail.errorField} />
                </DetailRow>
                <DetailRow label="値">
                  <span style={{ fontFamily: "ui-monospace, Menlo, monospace" }}>{toDisplay(detail.errorValue)}</span>
                </DetailRow>
                <DetailRow label="エラー内容">{toDisplay(detail.errorMessage)}</DetailRow>
                <DetailRow label="補足">{toDisplay(detail.detail)}</DetailRow>
                <DetailRow label="発生回数">{detail.occurredCount ?? 0}回</DetailRow>
                <DetailRow label="最初の発生">{formatDateTimeJst(detail.firstOccurredAt)}</DetailRow>
                <DetailRow label="最後の発生">{formatDateTimeJst(detail.lastOccurredAt)}</DetailRow>
                <DetailRow label="対応">{detail.resolvedFlg ? `${formatDateTimeJst(detail.resolvedAt)} / ${toDisplay(detail.resolvedBy)}` : "-"}</DetailRow>
                <DetailRow label="例外">{toDisplay(detail.exceptionClass)}</DetailRow>

                {detail.stackTrace && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ color: "#64748b", marginBottom: 6 }}>スタックトレース（先頭のみ）</div>
                    <pre style={preStyle}>{detail.stackTrace}</pre>
                  </div>
                )}

                <div style={{ marginTop: 16 }}>
                  <label style={labelStyle}>
                    メモ
                    <textarea
                      value={detailNote}
                      onChange={(e) => setDetailNote(e.target.value)}
                      rows={3}
                      style={{ ...inputStyle, height: "auto", padding: 8, resize: "vertical" }}
                      placeholder="対応内容など（マスタに追加した、など）"
                    />
                  </label>
                  <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                    {!detail.resolvedFlg ? (
                      <button type="button" style={saving ? disabledButtonStyle : successButtonStyle} disabled={saving} onClick={() => void updateDetail(true)}>
                        対応済みにする
                      </button>
                    ) : (
                      <button type="button" style={saving ? disabledButtonStyle : buttonStyle} disabled={saving} onClick={() => void updateDetail(false)}>
                        未対応に戻す
                      </button>
                    )}
                    <button type="button" style={saving ? disabledButtonStyle : buttonStyle} disabled={saving} onClick={() => void updateDetail(null)}>
                      メモだけ保存
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyzeErrorMatchesPage;
