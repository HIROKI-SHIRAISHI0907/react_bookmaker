import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { RefreshCw, Search } from "lucide-react";
import {
  ConsoleButton,
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
  StatChipItem,
  StatusBadge,
  BadgeTone,
  fmtNum,
} from "../../../api/commonAdminDesign";
import { getAccessToken, getTokenType } from "../../../utils/auth";

/**
 * ファイルアップロード状況管理（file_upload_status_manage）
 *
 *   GET /v1/api/admin/csv/upload/status        一覧（新しい順）
 *   GET /v1/api/admin/csv/upload/status/{id}   詳細（エラー行を含む）
 *
 *   ?id=123 で開くと、その受付の詳細をすぐ表示する（アップロード画面の結果からのリンク）。
 */

type CsvUploadRowError = {
  rowNo: number;
  operation?: string;
  key?: string;
  message?: string;
};

type FileUploadStatus = {
  id: number;
  masterName: string;
  fileName: string;
  csvFileName?: string | null;
  fileSize?: number | null;
  status: string;
  message?: string | null;
  totalCount: number;
  insertCount: number;
  updateCount: number;
  deleteCount: number;
  hideCount: number;
  showCount: number;
  errorCount: number;
  /** アップロードしたログインユーザー（メールアドレス） */
  loginUser?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  elapsedSec?: number | null;
  errors?: CsvUploadRowError[];
};

type StatusSummary = { status: string; count: number };

type ListResponse = {
  page: number;
  size: number;
  total: number;
  summary: StatusSummary[];
  items: FileUploadStatus[];
};

type Filters = {
  masterName: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  fileName: string;
  loginUser: string;
};

const API_BASE = "/v1/api/admin/csv/upload/status";
const PAGE_SIZE = 50;

export const MASTER_LABEL: Record<string, string> = {
  season: "シーズン",
  team: "チーム",
  future: "試合予定",
  realtime: "リアルタイム",
};

const STATUS_DEF: Record<string, { label: string; tone: BadgeTone }> = {
  RECEIVED: { label: "処理中", tone: "info" },
  SUCCESS: { label: "反映済", tone: "ok" },
  ROW_ERROR: { label: "行エラー（未反映）", tone: "warn" },
  FILE_ERROR: { label: "ファイルエラー（未反映）", tone: "warn" },
  DB_ERROR: { label: "DBエラー（取消）", tone: "ng" },
};

const STATUS_ORDER = ["RECEIVED", "SUCCESS", "ROW_ERROR", "FILE_ERROR", "DB_ERROR"];

const EMPTY_FILTERS: Filters = { masterName: "", status: "", dateFrom: "", dateTo: "", fileName: "", loginUser: "" };

/** JWT（Authorization ヘッダー） */
function authHeader(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `${getTokenType()} ${token}` } : {};
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: "include", headers: { Accept: "application/json", ...authHeader() } });
  const text = await response.text();
  if (!response.ok) {
    let message = text;
    try {
      message = (JSON.parse(text) as { message?: string }).message ?? text;
    } catch {
      /* JSON でなければそのまま */
    }
    throw new Error(`HTTP ${response.status}: ${message || response.statusText}`);
  }
  return JSON.parse(text) as T;
}

function StatusCell({ status }: { status: string }) {
  const def = STATUS_DEF[status] ?? { label: status, tone: "neutral" as BadgeTone };
  return <StatusBadge tone={def.tone}>{def.label}</StatusBadge>;
}

function fmtSize(bytes?: number | null): string {
  if (bytes == null) return "-";
  if (bytes < 1024) return `${bytes} B`;
  return `${fmtNum(Math.ceil(bytes / 1024))} KB`;
}

function fmtElapsed(sec?: number | null): string {
  if (sec == null) return "-";
  if (sec < 60) return `${sec} 秒`;
  return `${Math.floor(sec / 60)} 分 ${sec % 60} 秒`;
}

/** 件数の要約（0 件は出さない） */
function countSummary(r: FileUploadStatus): string {
  const parts: string[] = [];
  if (r.insertCount) parts.push(`登録 ${fmtNum(r.insertCount)}`);
  if (r.updateCount) parts.push(`更新 ${fmtNum(r.updateCount)}`);
  if (r.deleteCount) parts.push(`削除 ${fmtNum(r.deleteCount)}`);
  if (r.hideCount) parts.push(`非表示 ${fmtNum(r.hideCount)}`);
  if (r.showCount) parts.push(`再表示 ${fmtNum(r.showCount)}`);
  return parts.length > 0 ? parts.join(" / ") : "-";
}

function buildQuery(f: Filters, page: number): string {
  const q = new URLSearchParams();
  (Object.keys(f) as (keyof Filters)[]).forEach((k) => {
    const v = f[k].trim();
    if (v !== "") q.set(k, v);
  });
  q.set("page", String(page));
  q.set("size", String(PAGE_SIZE));
  return q.toString();
}

const FileUploadStatusPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);

  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [detail, setDetail] = useState<FileUploadStatus | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  /* ----- 一覧 ----- */
  const load = useCallback(async (f: Filters, p: number) => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchJson<ListResponse>(`${API_BASE}?${buildQuery(f, p)}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : "一覧の取得に失敗しました。");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(filters, page);
  }, [load, filters, page]);

  /* ----- 詳細 ----- */
  const openDetail = useCallback(
    async (id: number) => {
      setDetailOpen(true);
      setDetailLoading(true);
      setDetailError(null);
      setDetail(null);
      try {
        setDetail(await fetchJson<FileUploadStatus>(`${API_BASE}/${id}`));
      } catch (e) {
        setDetailError(e instanceof Error ? e.message : "詳細の取得に失敗しました。");
      } finally {
        setDetailLoading(false);
      }
    },
    [],
  );

  // ?id= で開いたとき（アップロード画面の結果からのリンク）
  useEffect(() => {
    const idParam = searchParams.get("id");
    if (idParam && /^\d+$/.test(idParam)) {
      void openDetail(Number(idParam));
    }
    // 初回だけ見る
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeDetail = useCallback(() => {
    setDetailOpen(false);
    if (searchParams.has("id")) {
      const next = new URLSearchParams(searchParams);
      next.delete("id");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  /* ----- 検索 ----- */
  const applySearch = () => {
    setPage(1);
    setFilters({ ...draft });
  };

  const resetSearch = () => {
    setDraft(EMPTY_FILTERS);
    setPage(1);
    setFilters(EMPTY_FILTERS);
  };

  const onStatusChip = (status: string) => {
    const next = { ...filters, status: filters.status === status ? "" : status };
    setDraft(next);
    setPage(1);
    setFilters(next);
  };

  /* ----- 集計 ----- */
  const summaryMap = useMemo(() => {
    const m = new Map<string, number>();
    (data?.summary ?? []).forEach((s) => m.set(s.status, s.count));
    return m;
  }, [data]);

  const allCount = useMemo(() => Array.from(summaryMap.values()).reduce((a, b) => a + b, 0), [summaryMap]);

  const chips: StatChipItem[] = [
    { label: "条件に合う件数", value: fmtNum(data?.total ?? 0) },
    { label: "全状態", value: fmtNum(allCount) },
    ...STATUS_ORDER.map<StatChipItem>((s) => ({
      label: STATUS_DEF[s].label,
      value: fmtNum(summaryMap.get(s) ?? 0),
      tone: (summaryMap.get(s) ?? 0) === 0 ? "default" : STATUS_DEF[s].tone === "neutral" ? "default" : STATUS_DEF[s].tone,
    })),
  ];

  /* ----- 列 ----- */
  const columns: ConsoleColumn<FileUploadStatus>[] = [
    { key: "id", header: "ID", mono: true, align: "right", cell: (r) => r.id },
    { key: "startedAt", header: "受付日時", mono: true, cell: (r) => r.startedAt ?? "-" },
    { key: "master", header: "種類", cell: (r) => MASTER_LABEL[r.masterName] ?? r.masterName },
    { key: "fileName", header: "ファイル名", mono: true, wrap: true, className: "min-w-[220px] break-all", cell: (r) => r.fileName },
    { key: "status", header: "状態", cell: (r) => <StatusCell status={r.status} /> },
    { key: "total", header: "行数", mono: true, align: "right", cell: (r) => fmtNum(r.totalCount) },
    { key: "counts", header: "反映内容", wrap: true, className: "min-w-[160px]", cell: (r) => countSummary(r) },
    {
      key: "errors",
      header: "エラー",
      mono: true,
      align: "right",
      cell: (r) => (r.errorCount > 0 ? <span className="font-bold text-red-700">{fmtNum(r.errorCount)}</span> : <span className="text-gray-400">0</span>),
    },
    { key: "user", header: "ログインユーザー", className: "max-w-[220px] truncate", cell: (r) => <span title={r.loginUser ?? ""}>{r.loginUser || "-"}</span> },
    { key: "elapsed", header: "処理時間", mono: true, align: "right", cell: (r) => fmtElapsed(r.elapsedSec) },
  ];

  const errorColumns: ConsoleColumn<CsvUploadRowError>[] = [
    { key: "rowNo", header: "行", mono: true, align: "right", cell: (e) => e.rowNo },
    { key: "operation", header: "処理区分", cell: (e) => e.operation || "-" },
    { key: "key", header: "キー", wrap: true, className: "min-w-[180px] break-all", cell: (e) => e.key || "-" },
    { key: "message", header: "エラー内容", wrap: true, className: "min-w-[240px]", cell: (e) => <span className="text-red-700">{e.message || "-"}</span> },
  ];

  const draftChanged = (k: keyof Filters) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setDraft((prev) => ({ ...prev, [k]: e.target.value }));

  return (
    <div>
      <ConsoleToolbar
        title="ファイルアップロード状況管理"
        info="file_upload_status_manage"
        description="CSV アップロード画面（シーズン / チーム / 試合予定 / リアルタイム）からのアップロード 1 回ごとの受付と結果です。行をクリックすると詳細（エラー行）を表示します。"
      >
        <ConsoleButton variant="primary" onClick={() => void load(filters, page)} loading={loading}>
          {!loading && <RefreshCw className="h-3.5 w-3.5" />}
          再読み込み
        </ConsoleButton>
      </ConsoleToolbar>

      <ConsolePanel title="検索条件">
        <div className="flex flex-wrap items-end gap-2.5">
          <ConsoleField label="種類">
            <ConsoleSelect value={draft.masterName} onChange={draftChanged("masterName")} className="w-36">
              <option value="">すべて</option>
              {Object.entries(MASTER_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </ConsoleSelect>
          </ConsoleField>
          <ConsoleField label="状態">
            <ConsoleSelect value={draft.status} onChange={draftChanged("status")} className="w-48">
              <option value="">すべて</option>
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_DEF[s].label}
                </option>
              ))}
            </ConsoleSelect>
          </ConsoleField>
          <ConsoleField label="受付日（から）">
            <ConsoleInput type="date" value={draft.dateFrom} onChange={draftChanged("dateFrom")} />
          </ConsoleField>
          <ConsoleField label="受付日（まで）">
            <ConsoleInput type="date" value={draft.dateTo} onChange={draftChanged("dateTo")} />
          </ConsoleField>
          <ConsoleField label="ファイル名（部分一致）">
            <ConsoleInput
              value={draft.fileName}
              onChange={draftChanged("fileName")}
              onKeyDown={(e) => e.key === "Enter" && applySearch()}
              placeholder="例: season_2026"
              className="w-56"
            />
          </ConsoleField>
          <ConsoleField label="ログインユーザー（部分一致）">
            <ConsoleInput
              value={draft.loginUser}
              onChange={draftChanged("loginUser")}
              onKeyDown={(e) => e.key === "Enter" && applySearch()}
              placeholder="例: taro@example.com"
              className="w-56"
            />
          </ConsoleField>
          <div className="flex gap-1.5">
            <ConsoleButton variant="primary" onClick={applySearch} disabled={loading}>
              <Search className="h-3.5 w-3.5" />
              検索
            </ConsoleButton>
            <ConsoleButton variant="ghost" onClick={resetSearch} disabled={loading}>
              条件をクリア
            </ConsoleButton>
          </div>
        </div>
      </ConsolePanel>

      <StatChips items={chips} loading={loading && data == null} />
      <div className="mb-2.5 -mt-1 flex flex-wrap gap-1.5 text-xs text-gray-500">
        状態で絞り込む：
        {STATUS_ORDER.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onStatusChip(s)}
            className={`rounded-full border px-2 py-px ${filters.status === s ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 bg-white hover:bg-gray-50"}`}
          >
            {STATUS_DEF[s].label}
          </button>
        ))}
      </div>

      {error && (
        <ConsoleNotice tone="ng" title="一覧を取得できませんでした。" onClose={() => setError(null)}>
          {error}
        </ConsoleNotice>
      )}

      <ConsoleTable
        columns={columns}
        rows={data?.items ?? []}
        rowKey={(r) => r.id}
        loading={loading}
        emptyText="条件に合うアップロードはありません。"
        onRowClick={(r) => void openDetail(r.id)}
        rowClassName={(r) => (r.status === "DB_ERROR" ? "!bg-red-50/60" : "")}
        paging={{ page, pageSize: PAGE_SIZE, total: data?.total ?? 0, onChange: setPage }}
      />

      <ConsoleDrawer open={detailOpen} title={detail ? `アップロード詳細 #${detail.id}` : "アップロード詳細"} onClose={closeDetail} width={760}>
        {detailLoading && <div className="py-8 text-center text-sm text-gray-400">読み込み中…</div>}
        {detailError && <ConsoleNotice tone="ng">{detailError}</ConsoleNotice>}
        {detail && (
          <>
            <ConsoleNotice tone={detail.status === "SUCCESS" ? "ok" : detail.status === "RECEIVED" ? "info" : "ng"} title={detail.message || "-"} />
            <ConsolePanel>
              <DetailRow label="状態">
                <StatusCell status={detail.status} />
              </DetailRow>
              <DetailRow label="種類">{MASTER_LABEL[detail.masterName] ?? detail.masterName}</DetailRow>
              <DetailRow label="ファイル名">
                <span className="font-mono break-all">{detail.fileName}</span>
              </DetailRow>
              <DetailRow label="中の CSV">
                <span className="font-mono break-all">{detail.csvFileName || "-"}</span>
              </DetailRow>
              <DetailRow label="サイズ">{fmtSize(detail.fileSize)}</DetailRow>
              <DetailRow label="ログインユーザー">
                <span className="break-all">{detail.loginUser || "-"}</span>
              </DetailRow>
              <DetailRow label="受付日時">
                <span className="font-mono">{detail.startedAt ?? "-"}</span>
              </DetailRow>
              <DetailRow label="終了日時">
                <span className="font-mono">{detail.finishedAt ?? "（処理中）"}</span>
              </DetailRow>
              <DetailRow label="処理時間">{fmtElapsed(detail.elapsedSec)}</DetailRow>
            </ConsolePanel>

            <StatChips
              items={[
                { label: "CSV行数", value: fmtNum(detail.totalCount) },
                { label: "登録", value: fmtNum(detail.insertCount), tone: detail.insertCount > 0 ? "ok" : "default" },
                { label: "更新", value: fmtNum(detail.updateCount), tone: detail.updateCount > 0 ? "ok" : "default" },
                { label: "削除", value: fmtNum(detail.deleteCount), tone: detail.deleteCount > 0 ? "warn" : "default" },
                { label: "非表示", value: fmtNum(detail.hideCount), tone: detail.hideCount > 0 ? "warn" : "default" },
                { label: "再表示", value: fmtNum(detail.showCount), tone: detail.showCount > 0 ? "info" : "default" },
                { label: "エラー", value: fmtNum(detail.errorCount), tone: detail.errorCount > 0 ? "ng" : "default" },
              ]}
            />

            {detail.errorCount > 0 && (
              <ConsolePanel title="エラー行" info={detail.errorCount > (detail.errors?.length ?? 0) ? `先頭 ${fmtNum(detail.errors?.length ?? 0)} 行を表示` : undefined} flush>
                <ConsoleTable columns={errorColumns} rows={detail.errors ?? []} rowKey={(e, i) => `${e.rowNo}-${i}`} maxHeight="calc(100vh - 460px)" />
              </ConsolePanel>
            )}
          </>
        )}
      </ConsoleDrawer>
    </div>
  );
};

export default FileUploadStatusPage;
