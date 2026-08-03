// src/pages/admin/ManualDataTargetPage.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type AllLeagueDTO = {
  country: string;
  league: string;
  logicFlg: string;
  dispFlg: string; // "0"(対象) / "1"(対象外)
};

export type AllLeagueRequest = {
  country: string;
  league: string;
  logicFlg: string;
  dispFlg: string;
};

export type AllLeagueResponse = {
  responseCode: string;
  message?: string;
};

export type ExecTaskResponse = {
  returnCd: string;
  taskArn?: string;
  message?: string;
};

export type ExecTaskRequest = Record<string, never>;

type AllLeagueMasterEntity = {
  id?: number;
  country?: string;
  league?: string;
  logicFlg?: string;
  dispFlg?: string;
  registerId?: string;
  registerTime?: string;
  updateId?: string;
  updateTime?: string;
};

type InitialReadingMasterCsvResponse = {
  masterName?: string;
  message?: string;
  allLeagueMasterEntityList?: AllLeagueMasterEntity[];
};

type InitialReadingMasterCsvUpdateStatusTargetRequest = {
  country: string;
  league: string;
};

type InitialReadingMasterCsvUpdateRequest = {
  masterName: string;
  targets: InitialReadingMasterCsvUpdateStatusTargetRequest[];
};

type InitialReadingMasterCsvUpdateRowRequest = {
  masterName: string;
  allLeagueMasterEntities?: AllLeagueMasterEntity[];
  masterEntities?: never[];
  seasonMasterEntities?: never[];
};

type InitialReadingMasterCsvDeleteTargetRequest = {
  masterName: string;
  allLeagueMasterEntities?: AllLeagueMasterEntity[];
  masterEntities?: never[];
  seasonMasterEntities?: never[];
};

type InitialReadingMasterCsvUpdateResponse = {
  success?: boolean;
  message?: string;
  updateCount?: number;
  updatedTargets?: InitialReadingMasterCsvUpdateStatusTargetRequest[];
};

type SaveState = { type: "idle" } | { type: "saving"; message?: string } | { type: "success"; message?: string } | { type: "error"; message?: string };

type RunState = { type: "idle" } | { type: "running"; message?: string } | { type: "success"; message?: string; taskArn?: string } | { type: "error"; message?: string };

type RowKey = string;
type ModalRowKey = string;

type EditingCell = {
  rowIndex: number;
  field: keyof AllLeagueMasterEntity;
} | null;

const BASE = "/v1/api/all-league-master";
const EXEC_TASK_API = "/v1/api/admin/exec/task/all-league-scrape-master-json";
const INITIAL_CSV_API = "/v1/api/admin/master/initial/csv";
const INITIAL_CSV_UPDATE_STATUS_API = "/v1/api/admin/master/initial/csv/update-status";
const INITIAL_CSV_UPDATE_ROW_API = "/v1/api/admin/master/initial/csv/update-row";
const INITIAL_CSV_DELETE_ROW_API = "/v1/api/admin/master/initial/csv/delete-row";

// 実際の定数値に合わせてください
const MASTER_NAME = "all_league_scrape_master";

const OK_CODES = new Set(["0", "200"]);
const isOkCode = (code?: string) => OK_CODES.has(String(code ?? ""));

const keyOf = (r: Pick<AllLeagueDTO, "country" | "league">): RowKey => `${r.country}__${r.league}`;
const modalKeyOf = (r: AllLeagueMasterEntity): ModalRowKey => (r.id != null ? String(r.id) : `${(r.country ?? "").trim()}__${(r.league ?? "").trim()}`);

const isScrapeTarget = (dispFlg: string) => dispFlg === "0";
const dispFlgFromChecked = (checked: boolean) => (checked ? "0" : "1");

function toDisplay(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

function uniqueTargetsFromAllLeagueRows(rows: AllLeagueMasterEntity[]): InitialReadingMasterCsvUpdateStatusTargetRequest[] {
  const map = new Map<string, InitialReadingMasterCsvUpdateStatusTargetRequest>();

  rows.forEach((row) => {
    const country = (row.country ?? "").trim();
    const league = (row.league ?? "").trim();
    if (!country || !league) return;

    const key = `${country}___${league}`;
    if (!map.has(key)) {
      map.set(key, { country, league });
    }
  });

  return Array.from(map.values());
}

type FetchJsonOptions = RequestInit & {
  snippetLength?: number;
  allowEmptyBody?: boolean;
};

function buildNotJsonHint(ct: string, text: string, redirected: boolean) {
  const looksHtml = /<!doctype html>|<html[\s>]/i.test(text);
  if (looksHtml) {
    return [
      "HTMLが返っています。",
      "原因候補:",
      " - Viteのproxy未設定でフロント(index.html)が返っている",
      " - 認証が必要でログイン画面HTMLへリダイレクトされている",
      " - APIパス違いでエラーページHTMLが返っている",
      `content-type=${ct}`,
      redirected ? "redirected: true（ログイン画面等に飛ばされている可能性）" : "",
    ]
      .filter(Boolean)
      .join("\n");
  }
  return `JSON以外が返っています（content-type=${ct}）`;
}

async function fetchJsonStrict<T>(url: string, init?: FetchJsonOptions): Promise<T> {
  const snippetLength = init?.snippetLength ?? 500;
  const allowEmptyBody = init?.allowEmptyBody ?? false;

  const res = await fetch(url, {
    credentials: "include",
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const ct = res.headers.get("content-type") ?? "";
  const text = await res.text().catch(() => "");

  if (!res.ok) {
    throw new Error(
      [`HTTP ${res.status} ${res.statusText}`, `url: ${res.url}`, `content-type: ${ct}`, res.redirected ? "redirected: true" : "", text ? `body(snippet):\n${text.slice(0, snippetLength)}` : ""]
        .filter(Boolean)
        .join("\n"),
    );
  }

  if ((res.status === 204 || text.trim() === "") && allowEmptyBody) {
    return null as unknown as T;
  }

  if (!ct.includes("application/json")) {
    const hint = buildNotJsonHint(ct, text, res.redirected);
    throw new Error([`Expected JSON but got non-JSON response`, `url: ${res.url}`, hint, text ? `body(snippet):\n${text.slice(0, snippetLength)}` : ""].filter(Boolean).join("\n"));
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error([`JSON parse failed`, `url: ${res.url}`, `content-type: ${ct}`, text ? `body(snippet):\n${text.slice(0, snippetLength)}` : ""].filter(Boolean).join("\n"));
  }
}

export async function fetchAllLeagueMaster(): Promise<AllLeagueDTO[]> {
  const data = await fetchJsonStrict<AllLeagueDTO[] | null>(BASE, { method: "GET" });
  return Array.isArray(data) ? data : [];
}

export async function patchAllLeagueMaster(req: AllLeagueRequest): Promise<AllLeagueResponse> {
  const res = await fetch(BASE, {
    method: "PATCH",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req),
  });

  const ct = res.headers.get("content-type") ?? "";
  const text = await res.text().catch(() => "");

  let json: any = null;
  if (ct.includes("application/json") && text.trim() !== "") {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  if (!res.ok) {
    if (json && isOkCode(json.responseCode)) {
      return json as AllLeagueResponse;
    }
    throw new Error([`HTTP ${res.status} ${res.statusText}`, `url: ${res.url}`, `content-type: ${ct}`, text ? `body(snippet):\n${text.slice(0, 500)}` : ""].filter(Boolean).join("\n"));
  }

  if (!json) return { responseCode: "200", message: "empty response (treated as success)" };
  return json as AllLeagueResponse;
}

export async function execAllLeagueJsonTask(req: ExecTaskRequest = {}): Promise<ExecTaskResponse> {
  const data = await fetchJsonStrict<ExecTaskResponse | null>(EXEC_TASK_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    allowEmptyBody: false,
  });

  if (!data) throw new Error("exec task API returned empty body");
  return data;
}

async function fetchInitialAllLeagueRows(): Promise<AllLeagueMasterEntity[]> {
  const params = new URLSearchParams({ masterName: MASTER_NAME });
  const response = await fetchJsonStrict<InitialReadingMasterCsvResponse>(`${INITIAL_CSV_API}?${params.toString()}`, {
    method: "GET",
  });
  return response.allLeagueMasterEntityList ?? [];
}

async function updateInitialFlg(targets: InitialReadingMasterCsvUpdateStatusTargetRequest[]) {
  const body: InitialReadingMasterCsvUpdateRequest = {
    masterName: MASTER_NAME,
    targets,
  };

  return fetchJsonStrict<InitialReadingMasterCsvUpdateResponse>(INITIAL_CSV_UPDATE_STATUS_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
}

async function updateInitialRows(rows: AllLeagueMasterEntity[]) {
  const body: InitialReadingMasterCsvUpdateRowRequest = {
    masterName: MASTER_NAME,
    allLeagueMasterEntities: rows,
  };

  return fetchJsonStrict<InitialReadingMasterCsvUpdateResponse>(INITIAL_CSV_UPDATE_ROW_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
}

async function deleteInitialRows(rows: AllLeagueMasterEntity[]) {
  const body: InitialReadingMasterCsvDeleteTargetRequest = {
    masterName: MASTER_NAME,
    allLeagueMasterEntities: rows,
  };

  return fetchJsonStrict<InitialReadingMasterCsvUpdateResponse>(INITIAL_CSV_DELETE_ROW_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
}

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
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold ring-1 ring-inset ${cls[tone]}`}>{children}</span>;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border bg-white/85 backdrop-blur shadow-sm ${className}`}>{children}</div>;
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

function Button({
  children,
  onClick,
  disabled,
  loading,
  variant = "primary",
  title,
  className = "",
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger";
  title?: string;
  className?: string;
  type?: "button" | "submit";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-extrabold transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const v =
    variant === "primary"
      ? "bg-gray-900 text-white border-gray-900 hover:bg-black focus:ring-gray-400"
      : variant === "danger"
        ? "bg-rose-600 text-white border-rose-600 hover:bg-rose-700 focus:ring-rose-500"
        : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50 focus:ring-gray-300";

  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} title={title} className={`${base} ${v} ${className}`}>
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}

function Alert({ type, title, message, right }: { type: "info" | "success" | "warning" | "error"; title: string; message: string; right?: React.ReactNode }) {
  const cls =
    type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : type === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : type === "error"
          ? "border-rose-200 bg-rose-50 text-rose-900"
          : "border-blue-200 bg-blue-50 text-blue-900";

  const icon = type === "success" ? "✅" : type === "warning" ? "⚠️" : type === "error" ? "❌" : "💡";

  return (
    <div className={`rounded-2xl border p-4 flex items-start gap-3 ${cls}`}>
      <div className="mt-0.5">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-extrabold">{title}</div>
        <pre className="mt-1 text-xs whitespace-pre-wrap leading-relaxed">{message}</pre>
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

function EditableCell({
  rowIndex,
  field,
  value,
  editingCell,
  editingValue,
  onStartEdit,
  onChangeValue,
  onCommit,
  onCancel,
}: {
  rowIndex: number;
  field: keyof AllLeagueMasterEntity;
  value: unknown;
  editingCell: EditingCell;
  editingValue: string;
  onStartEdit: (rowIndex: number, field: keyof AllLeagueMasterEntity, currentValue: unknown) => void;
  onChangeValue: (value: string) => void;
  onCommit: () => void;
  onCancel: () => void;
}) {
  const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.field === field;

  if (isEditing) {
    return (
      <input
        autoFocus
        value={editingValue}
        onChange={(e) => onChangeValue(e.target.value)}
        onBlur={onCommit}
        onKeyDown={(e) => {
          if (e.key === "Enter") onCommit();
          if (e.key === "Escape") onCancel();
        }}
        className="w-full min-w-[180px] rounded-lg border border-slate-400 px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-blue-500"
      />
    );
  }

  return (
    <button type="button" onClick={() => onStartEdit(rowIndex, field, value)} className="w-full text-left text-xs text-gray-900 hover:text-blue-700" title={toDisplay(value)}>
      <span className="block max-w-[220px] truncate">{toDisplay(value)}</span>
    </button>
  );
}

export default function ManualDataTargetPage() {
  const [rows, setRows] = useState<AllLeagueDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [saveState, setSaveState] = useState<SaveState>({ type: "idle" });
  const [runState, setRunState] = useState<RunState>({ type: "idle" });

  const [initialMap, setInitialMap] = useState<Record<RowKey, { logicFlg: string; dispFlg: string }>>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [modalRows, setModalRows] = useState<AllLeagueMasterEntity[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalInfo, setModalInfo] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<EditingCell>(null);
  const [editingValue, setEditingValue] = useState("");
  const [selectedDeleteKeys, setSelectedDeleteKeys] = useState<string[]>([]);
  const [updatingModal, setUpdatingModal] = useState(false);
  const [deletingModalRows, setDeletingModalRows] = useState(false);

  const [currentCountryPage, setCurrentCountryPage] = useState(0);

  const autoOpenTriedRef = useRef(false);

  const saving = saveState.type === "saving";
  const running = runState.type === "running";
  const modalBusy = updatingModal || deletingModalRows;

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => `${r.country} ${r.league}`.toLowerCase().includes(s));
  }, [rows, q]);

  const countryPages = useMemo(() => {
    const seen = new Set<string>();
    const countries: string[] = [];

    for (const row of filtered) {
      const country = (row.country ?? "").trim();
      if (!country) continue;
      if (!seen.has(country)) {
        seen.add(country);
        countries.push(country);
      }
    }

    return countries;
  }, [filtered]);

  const totalCountryPages = countryPages.length;
  const currentCountry = totalCountryPages > 0 ? countryPages[currentCountryPage] : "";

  const pagedRows = useMemo(() => {
    if (!currentCountry) return [];
    return filtered.filter((r) => (r.country ?? "").trim() === currentCountry);
  }, [filtered, currentCountry]);

  useEffect(() => {
    if (totalCountryPages === 0) {
      if (currentCountryPage !== 0) {
        setCurrentCountryPage(0);
      }
      return;
    }

    if (currentCountryPage > totalCountryPages - 1) {
      setCurrentCountryPage(0);
    }
  }, [currentCountryPage, totalCountryPages]);

  useEffect(() => {
    setCurrentCountryPage(0);
  }, [q]);

  const changedCount = useMemo(() => {
    let cnt = 0;
    for (const r of rows) {
      const init = initialMap[keyOf(r)];
      if (!init) continue;
      if (r.logicFlg !== init.logicFlg || r.dispFlg !== init.dispFlg) cnt++;
    }
    return cnt;
  }, [rows, initialMap]);

  const targetCountVisible = useMemo(() => pagedRows.filter((r) => isScrapeTarget(r.dispFlg)).length, [pagedRows]);

  const rowsWithPendingEdit = useMemo(() => {
    if (editingCell == null) return modalRows;
    return modalRows.map((row, index) =>
      index === editingCell.rowIndex
        ? {
            ...row,
            [editingCell.field]: editingValue,
          }
        : row,
    );
  }, [modalRows, editingCell, editingValue]);

  const allModalRowsSelected = useMemo(() => {
    if (rowsWithPendingEdit.length === 0) return false;
    return rowsWithPendingEdit.every((row) => selectedDeleteKeys.includes(modalKeyOf(row)));
  }, [rowsWithPendingEdit, selectedDeleteKeys]);

  const successTaskArn = runState.type === "success" ? runState.taskArn : undefined;
  const successRunMessage = runState.type === "success" ? `${runState.message ?? ""}${successTaskArn ? `\n\ntaskArn:\n${successTaskArn}` : ""}` : "";

  const closeModal = useCallback(() => {
    if (modalBusy) return;
    setModalOpen(false);
    setEditingCell(null);
    setEditingValue("");
    setSelectedDeleteKeys([]);
    setModalError(null);
  }, [modalBusy]);

  const loadMainRows = useCallback(async () => {
    const list = await fetchAllLeagueMaster();
    setRows(list);

    const m: Record<RowKey, { logicFlg: string; dispFlg: string }> = {};
    for (const r of list) {
      m[keyOf(r)] = { logicFlg: r.logicFlg, dispFlg: r.dispFlg };
    }
    setInitialMap(m);
  }, []);

  const loadPendingRows = useCallback(async (openWhenExists: boolean) => {
    setModalError(null);
    setModalInfo(null);
    setModalLoading(true);

    try {
      const list = await fetchInitialAllLeagueRows();
      setModalRows(list);

      if (openWhenExists) {
        setModalOpen(list.length > 0);
        if (list.length === 0) {
          setModalInfo("未確認の新規データはありません。");
        }
      }
    } catch (e: any) {
      const message = e?.message ?? "未確認データの取得に失敗しました。";
      setModalError(message);
      if (openWhenExists) {
        setModalOpen(false);
      }
    } finally {
      setModalLoading(false);
    }
  }, []);

  const initialLoad = useCallback(async () => {
    try {
      setLoading(true);
      setErr(null);
      await loadMainRows();

      if (!autoOpenTriedRef.current) {
        autoOpenTriedRef.current = true;
        await loadPendingRows(true);
      }
    } catch (e: any) {
      setErr(e?.message ?? "一覧取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [loadMainRows, loadPendingRows]);

  useEffect(() => {
    void initialLoad();
  }, [initialLoad]);

  useEffect(() => {
    if (!modalOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !modalBusy) {
        closeModal();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [modalOpen, modalBusy, closeModal]);

  const setRowChecked = (row: AllLeagueDTO, checked: boolean) => {
    const k = keyOf(row);
    const nextDisp = dispFlgFromChecked(checked);
    setRows((prev) => prev.map((x) => (keyOf(x) === k ? { ...x, dispFlg: nextDisp } : x)));
  };

  const setAllVisible = (checked: boolean) => {
    const targetKeys = new Set(pagedRows.map((r) => keyOf(r)));
    const nextDisp = dispFlgFromChecked(checked);
    setRows((prev) => prev.map((x) => (targetKeys.has(keyOf(x)) ? { ...x, dispFlg: nextDisp } : x)));
  };

  const saveAll = async () => {
    const changed = rows.filter((r) => {
      const init = initialMap[keyOf(r)];
      if (!init) return true;
      return r.logicFlg !== init.logicFlg || r.dispFlg !== init.dispFlg;
    });

    if (changed.length === 0) {
      setSaveState({ type: "success", message: "変更がないため保存は不要です" });
      setTimeout(() => setSaveState({ type: "idle" }), 1200);
      return;
    }

    setSaveState({ type: "saving", message: `保存中... (${changed.length}件)` });

    const errors: Array<{ key: string; code?: string; message?: string }> = [];

    for (const r of changed) {
      try {
        const res = await patchAllLeagueMaster({
          country: r.country,
          league: r.league,
          logicFlg: r.logicFlg,
          dispFlg: r.dispFlg,
        });

        if (!isOkCode(res.responseCode)) {
          errors.push({ key: keyOf(r), code: res.responseCode, message: res.message });
        }
      } catch (e: any) {
        errors.push({ key: keyOf(r), message: e?.message ?? "network error" });
      }
    }

    if (errors.length > 0) {
      setSaveState({
        type: "error",
        message: `保存失敗: ${errors.length}件（例: ${errors[0].key} ${errors[0].code ?? ""} ${errors[0].message ?? ""}）`,
      });
      return;
    }

    const m: Record<RowKey, { logicFlg: string; dispFlg: string }> = {};
    for (const r of rows) {
      m[keyOf(r)] = { logicFlg: r.logicFlg, dispFlg: r.dispFlg };
    }
    setInitialMap(m);

    setSaveState({ type: "success", message: `保存しました (${changed.length}件)` });
    setTimeout(() => setSaveState({ type: "idle" }), 1200);
  };

  const runUploadTask = async () => {
    try {
      setRunState({ type: "running", message: "タスク起動中..." });

      const res = await execAllLeagueJsonTask({});

      if (res.returnCd && res.returnCd !== "ACCEPTED") {
        setRunState({ type: "error", message: res.message ?? `タスク起動失敗: ${res.returnCd}` });
        return;
      }

      setRunState({
        type: "success",
        message: "タスクを起動しました（ECSで実行中）",
        taskArn: res.taskArn,
      });
    } catch (e: any) {
      setRunState({ type: "error", message: e?.message ?? "タスク起動に失敗しました" });
    }
  };

  const openPendingModal = useCallback(async () => {
    setEditingCell(null);
    setEditingValue("");
    setSelectedDeleteKeys([]);
    setModalOpen(true);
    await loadPendingRows(true);
  }, [loadPendingRows]);

  const startEdit = (rowIndex: number, field: keyof AllLeagueMasterEntity, currentValue: unknown) => {
    setEditingCell({ rowIndex, field });
    setEditingValue(currentValue == null ? "" : String(currentValue));
  };

  const commitEdit = () => {
    if (!editingCell) return;

    setModalRows((prev) =>
      prev.map((row, index) =>
        index === editingCell.rowIndex
          ? {
              ...row,
              [editingCell.field]: editingValue,
            }
          : row,
      ),
    );

    setEditingCell(null);
    setEditingValue("");
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditingValue("");
  };

  const toggleSelectRow = (key: string) => {
    setSelectedDeleteKeys((prev) => (prev.includes(key) ? prev.filter((v) => v !== key) : [...prev, key]));
  };

  const toggleSelectAllRows = () => {
    if (allModalRowsSelected) {
      setSelectedDeleteKeys([]);
      return;
    }
    setSelectedDeleteKeys(rowsWithPendingEdit.map((row) => modalKeyOf(row)));
  };

  const handleConfirmModal = useCallback(async () => {
    if (modalBusy) return;

    const submitRows = rowsWithPendingEdit;
    if (submitRows.length === 0) {
      closeModal();
      setModalInfo("未確認の新規データはありません。");
      return;
    }

    setUpdatingModal(true);
    setModalError(null);

    try {
      const updateRowResponse = await updateInitialRows(submitRows);
      if (updateRowResponse.success === false) {
        throw new Error(updateRowResponse.message || "行更新に失敗しました。");
      }

      const targets = uniqueTargetsFromAllLeagueRows(submitRows);
      let finalMessage = updateRowResponse.message || "更新しました。";

      if (targets.length > 0) {
        const updateStatusResponse = await updateInitialFlg(targets);
        if (updateStatusResponse.success === false) {
          throw new Error(updateStatusResponse.message || "initialFlg更新に失敗しました。");
        }
        finalMessage = updateStatusResponse.message || finalMessage;
      }

      setModalOpen(false);
      setSelectedDeleteKeys([]);
      setEditingCell(null);
      setEditingValue("");
      setModalInfo(finalMessage);

      await loadMainRows();
      await loadPendingRows(false);
    } catch (e: any) {
      setModalError(e?.message ?? "更新に失敗しました。");
    } finally {
      setUpdatingModal(false);
    }
  }, [modalBusy, rowsWithPendingEdit, closeModal, loadMainRows, loadPendingRows]);

  const handleDeleteSelected = useCallback(async () => {
    if (modalBusy) return;

    const deleteTargets = rowsWithPendingEdit.filter((row) => selectedDeleteKeys.includes(modalKeyOf(row)));
    if (deleteTargets.length === 0) {
      setModalError("削除対象を選択してください。");
      return;
    }

    const ok = window.confirm(`選択した ${deleteTargets.length} 件を削除します。よろしいですか？`);
    if (!ok) return;

    setDeletingModalRows(true);
    setModalError(null);

    try {
      const response = await deleteInitialRows(deleteTargets);
      if (response.success === false) {
        throw new Error(response.message || "削除に失敗しました。");
      }

      const deleteKeySet = new Set(deleteTargets.map((row) => modalKeyOf(row)));
      const remainingRows = rowsWithPendingEdit.filter((row) => !deleteKeySet.has(modalKeyOf(row)));

      setModalRows(remainingRows);
      setSelectedDeleteKeys([]);
      setEditingCell(null);
      setEditingValue("");
      setModalInfo(response.message || `${deleteTargets.length}件削除しました。`);

      await loadMainRows();
      await loadPendingRows(false);

      if (remainingRows.length === 0) {
        setModalOpen(false);
      }
    } catch (e: any) {
      setModalError(e?.message ?? "削除に失敗しました。");
    } finally {
      setDeletingModalRows(false);
    }
  }, [modalBusy, rowsWithPendingEdit, selectedDeleteKeys, loadMainRows, loadPendingRows]);

  const modalContent =
    modalOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-[2147483647] bg-slate-900/45 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="all-league-initial-modal-title"
            onClick={(e) => {
              if (e.target === e.currentTarget && !modalBusy) {
                closeModal();
              }
            }}
          >
            <div className="w-[min(980px,94vw)] max-h-[86vh] overflow-auto rounded-2xl bg-white shadow-2xl border">
              <div className="p-5 border-b sticky top-0 bg-white z-10">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 id="all-league-initial-modal-title" className="text-xl font-extrabold text-gray-900">
                      未確認の新規リーグデータ確認
                    </h2>
                    <p className="mt-1 text-xs text-gray-600">country / league はその場で編集できます。OK で行更新後に initialFlg を更新します。不要な行は複数選択して削除できます。</p>
                  </div>

                  <Button variant="secondary" onClick={closeModal} disabled={modalBusy}>
                    閉じる
                  </Button>
                </div>

                <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-900">Enter またはフォーカスアウトで編集反映、Esc でキャンセルです。</div>

                {selectedDeleteKeys.length > 0 ? (
                  <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-900">削除選択中: {selectedDeleteKeys.length}件</div>
                ) : null}

                {modalError ? (
                  <div className="mt-3">
                    <Alert type="error" title="モーダルエラー" message={modalError} />
                  </div>
                ) : null}

                {modalInfo && !modalError ? (
                  <div className="mt-3">
                    <Alert type="info" title="案内" message={modalInfo} />
                  </div>
                ) : null}
              </div>

              <div className="p-5">
                {modalLoading ? (
                  <div className="py-10 text-sm text-gray-600">未確認データを読み込み中です...</div>
                ) : rowsWithPendingEdit.length === 0 ? (
                  <div className="py-10 text-sm text-gray-500">未確認の新規データはありません。</div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="px-4 py-3 text-center text-xs font-extrabold text-gray-600 w-12">
                            <input type="checkbox" checked={allModalRowsSelected} onChange={toggleSelectAllRows} disabled={modalBusy || rowsWithPendingEdit.length === 0} />
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-600 whitespace-nowrap">id</th>
                          <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-600 whitespace-nowrap">country</th>
                          <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-600 whitespace-nowrap">league</th>
                          <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-600 whitespace-nowrap">registerId</th>
                          <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-600 whitespace-nowrap">registerTime</th>
                          <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-600 whitespace-nowrap">updateId</th>
                          <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-600 whitespace-nowrap">updateTime</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rowsWithPendingEdit.map((row, rowIndex) => {
                          const key = modalKeyOf(row);
                          const checked = selectedDeleteKeys.includes(key);

                          return (
                            <tr key={`${key}-${rowIndex}`} className={`border-b ${checked ? "bg-rose-50" : rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}>
                              <td className="px-4 py-3 text-center">
                                <input type="checkbox" checked={checked} onChange={() => toggleSelectRow(key)} disabled={modalBusy} />
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">{toDisplay(row.id)}</td>
                              <td className="px-4 py-3">
                                <EditableCell
                                  rowIndex={rowIndex}
                                  field="country"
                                  value={row.country}
                                  editingCell={editingCell}
                                  editingValue={editingValue}
                                  onStartEdit={startEdit}
                                  onChangeValue={setEditingValue}
                                  onCommit={commitEdit}
                                  onCancel={cancelEdit}
                                />
                              </td>
                              <td className="px-4 py-3">
                                <EditableCell
                                  rowIndex={rowIndex}
                                  field="league"
                                  value={row.league}
                                  editingCell={editingCell}
                                  editingValue={editingValue}
                                  onStartEdit={startEdit}
                                  onChangeValue={setEditingValue}
                                  onCommit={commitEdit}
                                  onCancel={cancelEdit}
                                />
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">{toDisplay(row.registerId)}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">{toDisplay(row.registerTime)}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">{toDisplay(row.updateId)}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">{toDisplay(row.updateTime)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
                  <Button variant="danger" onClick={() => void handleDeleteSelected()} disabled={modalBusy || selectedDeleteKeys.length === 0} loading={deletingModalRows}>
                    選択行を削除{selectedDeleteKeys.length > 0 ? ` (${selectedDeleteKeys.length})` : ""}
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={closeModal} disabled={modalBusy}>
                      キャンセル
                    </Button>
                    <Button onClick={() => void handleConfirmModal()} disabled={modalBusy || rowsWithPendingEdit.length === 0} loading={updatingModal}>
                      OK
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
        <div className="max-w-6xl mx-auto">
          <Card className="p-6">
            <div className="h-6 w-72 bg-gray-200 rounded animate-pulse" />
            <div className="mt-3 h-4 w-96 bg-gray-200 rounded animate-pulse" />
            <div className="mt-6 h-48 bg-gray-200 rounded-2xl animate-pulse" />
          </Card>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Alert type="error" title="Error" message={err} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-start md:items-center justify-between gap-4 flex-col md:flex-row">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white p-3 rounded-2xl shadow-lg">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">スクレイピング対象データ設定</h1>
                <p className="text-sm text-gray-600 mt-1">チェックあり＝対象（dispFlg=0） / チェックなし＝対象外（dispFlg=1）</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge tone="blue">表示中リーグ数 {pagedRows.length}</Badge>
              <Badge tone="gray">全件数 {rows.length}</Badge>
              <Badge tone="gray">絞込件数 {filtered.length}</Badge>
              <Badge tone={changedCount > 0 ? "amber" : "emerald"}>変更 {changedCount}</Badge>
              <Badge tone="violet">対象(現在国) {targetCountVisible}</Badge>
              <Badge tone="blue">
                国ページ {totalCountryPages === 0 ? 0 : currentCountryPage + 1} / {totalCountryPages}
              </Badge>
              <Badge tone={modalRows.length > 0 ? "rose" : "gray"}>未確認 {modalRows.length}</Badge>
            </div>
          </div>

          {saveState.type === "error" ? <Alert type="error" title="保存エラー" message={saveState.message ?? ""} /> : null}
          {saveState.type === "success" ? <Alert type="success" title="保存" message={saveState.message ?? ""} /> : null}
          {runState.type === "error" ? <Alert type="error" title="タスク起動エラー" message={runState.message ?? ""} /> : null}
          {modalError && !modalOpen ? <Alert type="error" title="未確認データ取得エラー" message={modalError} /> : null}
          {modalInfo && !modalOpen ? <Alert type="info" title="未確認データ" message={modalInfo} /> : null}

          {runState.type === "success" ? (
            <Alert
              type="success"
              title="タスク起動"
              message={successRunMessage}
              right={
                successTaskArn ? (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      if (!successTaskArn) return;
                      void navigator.clipboard.writeText(successTaskArn);
                    }}
                    className="px-3 py-2 text-xs"
                  >
                    taskArnコピー
                  </Button>
                ) : null
              }
            />
          ) : null}

          <Card className="p-6">
            <div className="flex items-start md:items-center justify-between gap-4 flex-col md:flex-row">
              <div className="w-full md:w-auto">
                <div className="text-lg font-extrabold text-gray-900">検索・操作</div>
                <div className="text-sm text-gray-600 mt-1">一覧は国ごとにページングしています</div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button variant="secondary" onClick={() => setAllVisible(true)} disabled={pagedRows.length === 0 || saving || running}>
                  現在国を全チェック
                </Button>

                <Button variant="secondary" onClick={() => setAllVisible(false)} disabled={pagedRows.length === 0 || saving || running}>
                  現在国を全チェック外し
                </Button>

                <Button variant="secondary" onClick={() => void openPendingModal()} disabled={saving || running || modalLoading}>
                  {modalLoading ? "読込中..." : "未確認データ確認"}
                </Button>

                <Button onClick={() => void saveAll()} disabled={saving || changedCount === 0 || running} loading={saving}>
                  まとめて保存
                </Button>

                <Button variant="danger" onClick={() => void runUploadTask()} disabled={running} loading={running}>
                  対象データアップロード実行
                </Button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-2">
                <label className="block text-sm font-extrabold text-gray-900 mb-2">検索</label>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="国 / リーグで検索（例: JP, J1）"
                  className="w-full px-4 py-3 rounded-xl border bg-white text-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap justify-start md:justify-end">
                <Badge tone={saving ? "amber" : "gray"}>保存: {saving ? "実行中" : "待機"}</Badge>
                <Badge tone={running ? "amber" : "gray"}>タスク: {running ? "起動中" : "待機"}</Badge>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="secondary" onClick={() => setCurrentCountryPage((prev) => Math.max(prev - 1, 0))} disabled={totalCountryPages === 0 || currentCountryPage <= 0}>
                  前の国
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => setCurrentCountryPage((prev) => Math.min(prev + 1, totalCountryPages - 1))}
                  disabled={totalCountryPages === 0 || currentCountryPage >= totalCountryPages - 1}
                >
                  次の国
                </Button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge tone="emerald">現在の国 {currentCountry || "-"}</Badge>
              </div>
            </div>

            {saveState.type === "saving" ? (
              <div className="mt-4">
                <Alert type="info" title="保存" message={saveState.message ?? "保存中..."} />
              </div>
            ) : null}

            {runState.type === "running" ? (
              <div className="mt-4">
                <Alert type="info" title="タスク起動" message={runState.message ?? "タスク起動中..."} />
              </div>
            ) : null}
          </Card>

          <Card className="p-0 overflow-hidden">
            <div className="px-6 py-4 border-b bg-gradient-to-r from-white to-gray-50 flex items-center justify-between gap-4">
              <div className="font-extrabold text-gray-900">一覧</div>
              <div className="text-xs text-gray-600">※ 現在の国に属するリーグだけ表示しています</div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="text-left border-b bg-gray-50">
                    <th className="px-6 py-3 text-xs font-extrabold text-gray-600 whitespace-nowrap">国</th>
                    <th className="px-6 py-3 text-xs font-extrabold text-gray-600 whitespace-nowrap">リーグ</th>
                    <th className="px-6 py-3 text-xs font-extrabold text-gray-600 whitespace-nowrap">スクレイピング対象</th>
                    <th className="px-6 py-3 text-xs font-extrabold text-gray-600 whitespace-nowrap">状態</th>
                  </tr>
                </thead>

                <tbody>
                  {pagedRows.map((r) => {
                    const k = keyOf(r);
                    const init = initialMap[k];
                    const dirty = init ? r.dispFlg !== init.dispFlg : false;
                    const checked = isScrapeTarget(r.dispFlg);

                    return (
                      <tr key={k} className={`border-b transition-colors ${dirty ? "bg-amber-50/60" : "hover:bg-gray-50"}`}>
                        <td className="px-6 py-3 font-semibold text-gray-900 whitespace-nowrap">{r.country}</td>
                        <td className="px-6 py-3 font-semibold text-gray-900 whitespace-nowrap">{r.league}</td>

                        <td className="px-6 py-3 whitespace-nowrap">
                          <label className="inline-flex items-center gap-3 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => setRowChecked(r, e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            {checked ? <Badge tone="emerald">対象</Badge> : <Badge tone="gray">対象外</Badge>}
                          </label>
                        </td>

                        <td className="px-6 py-3 whitespace-nowrap">{dirty ? <Badge tone="amber">未保存</Badge> : <Badge tone="gray">保存済み</Badge>}</td>
                      </tr>
                    );
                  })}

                  {pagedRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-500">
                        該当データがありません
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="text-center text-xs text-gray-500 leading-relaxed">※ JSON以外のレスポンスが来る場合は、proxy未設定・認証リダイレクト・APIパス誤りをまず確認してください。</div>
        </div>
      </div>
      {modalContent}
    </>
  );
}
