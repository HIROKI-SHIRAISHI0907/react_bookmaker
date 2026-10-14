// src/pages/admin/target/ManualDataTargetPage.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckSquare, ChevronLeft, ChevronRight, ClipboardList, Copy, Save, Square, Trash2, Upload } from "lucide-react";
import {
  ClickEditCell,
  ConsoleButton,
  ConsoleColumn,
  ConsoleInput,
  ConsoleModal,
  ConsoleNotice,
  ConsoleTable,
  ConsoleToolbar,
  StatChips,
  StatusBadge,
} from "../../../api/commonAdminDesign";

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
    return modalRows.map((row, index) => (index === editingCell.rowIndex ? { ...row, [editingCell.field]: editingValue } : row));
  }, [modalRows, editingCell, editingValue]);

  const allModalRowsSelected = useMemo(() => {
    if (rowsWithPendingEdit.length === 0) return false;
    return rowsWithPendingEdit.every((row) => selectedDeleteKeys.includes(modalKeyOf(row)));
  }, [rowsWithPendingEdit, selectedDeleteKeys]);

  const successTaskArn = runState.type === "success" ? runState.taskArn : undefined;

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

    setModalRows((prev) => prev.map((row, index) => (index === editingCell.rowIndex ? { ...row, [editingCell.field]: editingValue } : row)));

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

  /* ----- 一覧の列 ----- */
  const columns: ConsoleColumn<AllLeagueDTO>[] = [
    { key: "country", header: "国", cell: (r) => <b>{r.country}</b> },
    { key: "league", header: "リーグ", cell: (r) => <b>{r.league}</b> },
    {
      key: "target",
      header: "スクレイピング対象",
      cell: (r) => {
        const checked = isScrapeTarget(r.dispFlg);
        return (
          <label className="inline-flex cursor-pointer select-none items-center gap-2">
            <input type="checkbox" checked={checked} onChange={(e) => setRowChecked(r, e.target.checked)} className="h-4 w-4 accent-indigo-600" />
            {checked ? <StatusBadge tone="ok">対象</StatusBadge> : <StatusBadge tone="neutral">対象外</StatusBadge>}
          </label>
        );
      },
    },
    {
      key: "state",
      header: "状態",
      cell: (r) => {
        const init = initialMap[keyOf(r)];
        const dirty = init ? r.dispFlg !== init.dispFlg : false;
        return dirty ? <StatusBadge tone="warn">未保存</StatusBadge> : <StatusBadge tone="neutral" dot={false}>保存済み</StatusBadge>;
      },
    },
  ];

  /* ----- モーダルの列 ----- */
  const editCol = (field: "country" | "league"): ConsoleColumn<AllLeagueMasterEntity> => ({
    key: field,
    header: field,
    cell: (row, rowIndex) => (
      <ClickEditCell
        value={row[field]}
        editing={editingCell?.rowIndex === rowIndex && editingCell?.field === field}
        editingValue={editingValue}
        onStart={() => startEdit(rowIndex, field, row[field])}
        onChange={setEditingValue}
        onCommit={commitEdit}
        onCancel={cancelEdit}
        maxWidth={220}
        disabled={modalBusy}
      />
    ),
  });

  const modalColumns: ConsoleColumn<AllLeagueMasterEntity>[] = [
    {
      key: "check",
      header: <input type="checkbox" checked={allModalRowsSelected} onChange={toggleSelectAllRows} disabled={modalBusy || rowsWithPendingEdit.length === 0} className="accent-red-600" aria-label="すべて選択" />,
      align: "center",
      cell: (row) => {
        const key = modalKeyOf(row);
        return <input type="checkbox" checked={selectedDeleteKeys.includes(key)} onChange={() => toggleSelectRow(key)} disabled={modalBusy} className="accent-red-600" aria-label="削除対象として選択" />;
      },
    },
    { key: "id", header: "id", mono: true, cell: (row) => <span className="text-gray-500">{toDisplay(row.id)}</span> },
    editCol("country"),
    editCol("league"),
    { key: "registerId", header: "registerId", mono: true, className: "text-gray-500", cell: (row) => toDisplay(row.registerId) },
    { key: "registerTime", header: "registerTime", mono: true, className: "text-gray-500", cell: (row) => toDisplay(row.registerTime) },
    { key: "updateId", header: "updateId", mono: true, className: "text-gray-500", cell: (row) => toDisplay(row.updateId) },
    { key: "updateTime", header: "updateTime", mono: true, className: "text-gray-500", cell: (row) => toDisplay(row.updateTime) },
  ];

  const pageNo = totalCountryPages === 0 ? 0 : currentCountryPage + 1;

  return (
    <div>
      <ConsoleToolbar title="スクレイピング対象データ設定" info="チェックあり＝対象（dispFlg=0） / チェックなし＝対象外（dispFlg=1）">
        <ConsoleButton onClick={() => void openPendingModal()} disabled={saving || running} loading={modalLoading}>
          {!modalLoading && <ClipboardList className="h-3.5 w-3.5" />}
          未確認データ確認
          {modalRows.length > 0 && <span className="rounded-full bg-red-600 px-1.5 text-[11px] text-white">{modalRows.length}</span>}
        </ConsoleButton>
        <ConsoleButton variant="primary" onClick={() => void saveAll()} disabled={changedCount === 0 || running || loading} loading={saving}>
          {!saving && <Save className="h-3.5 w-3.5" />}
          まとめて保存{changedCount > 0 ? `（${changedCount}）` : ""}
        </ConsoleButton>
        <ConsoleButton variant="danger" onClick={() => void runUploadTask()} loading={running} disabled={loading}>
          {!running && <Upload className="h-3.5 w-3.5" />}
          対象データアップロード実行
        </ConsoleButton>
      </ConsoleToolbar>

      {err && <ConsoleNotice tone="ng" title="Error">{err}</ConsoleNotice>}
      {saveState.type === "error" && <ConsoleNotice tone="ng" title="保存エラー">{saveState.message ?? ""}</ConsoleNotice>}
      {saveState.type === "success" && <ConsoleNotice tone="ok" title={saveState.message ?? "保存しました"} />}
      {saveState.type === "saving" && <ConsoleNotice tone="info" title={saveState.message ?? "保存中..."} />}
      {runState.type === "running" && <ConsoleNotice tone="info" title={runState.message ?? "タスク起動中..."} />}
      {runState.type === "error" && <ConsoleNotice tone="ng" title="タスク起動エラー">{runState.message ?? ""}</ConsoleNotice>}
      {runState.type === "success" && (
        <ConsoleNotice tone="ok" title={runState.message ?? "タスクを起動しました"} onClose={() => setRunState({ type: "idle" })}>
          {successTaskArn ? (
            <span className="inline-flex flex-wrap items-center gap-2">
              <span className="font-mono">taskArn: {successTaskArn}</span>
              <ConsoleButton size="sm" onClick={() => void navigator.clipboard.writeText(successTaskArn)}>
                <Copy className="h-3 w-3" />
                コピー
              </ConsoleButton>
            </span>
          ) : null}
        </ConsoleNotice>
      )}
      {modalError && !modalOpen && <ConsoleNotice tone="ng" title="未確認データ取得エラー">{modalError}</ConsoleNotice>}
      {modalInfo && !modalOpen && <ConsoleNotice tone="info" title={modalInfo} onClose={() => setModalInfo(null)} />}

      <div className="flex flex-wrap items-start gap-2">
        <StatChips
          loading={loading}
          items={[
            { label: "全件数", value: rows.length },
            { label: "絞込件数", value: filtered.length },
            { label: "現在の国のリーグ", value: pagedRows.length },
            { label: "対象（現在の国）", value: targetCountVisible, tone: "ok" },
            { label: "変更", value: changedCount, tone: changedCount > 0 ? "warn" : "default" },
            { label: "未確認", value: modalRows.length, tone: modalRows.length > 0 ? "ng" : "default" },
          ]}
        />
        <ConsoleInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="国 / リーグで検索（例: JP, J1）" className="ml-auto mb-2.5 w-72" />
      </div>

      <ConsoleTable
        columns={columns}
        rows={pagedRows}
        rowKey={keyOf}
        loading={loading}
        emptyText="該当データがありません"
        plain
        rowClassName={(r) => {
          const init = initialMap[keyOf(r)];
          return init && r.dispFlg !== init.dispFlg ? "bg-amber-50/70" : "";
        }}
        footer={
          <>
            <span className="flex flex-wrap items-center gap-2">
              <b className="text-[13px] text-gray-900">{currentCountry || "-"}</b>
              <span className="tabular-nums">
                {pageNo} / {totalCountryPages} 国
              </span>
              <ConsoleButton size="sm" variant="ghost" onClick={() => setAllVisible(true)} disabled={pagedRows.length === 0 || saving || running}>
                <CheckSquare className="h-3 w-3" />
                全チェック
              </ConsoleButton>
              <ConsoleButton size="sm" variant="ghost" onClick={() => setAllVisible(false)} disabled={pagedRows.length === 0 || saving || running}>
                <Square className="h-3 w-3" />
                全チェック外し
              </ConsoleButton>
            </span>
            <div className="flex gap-1.5">
              <ConsoleButton size="sm" onClick={() => setCurrentCountryPage((prev) => Math.max(prev - 1, 0))} disabled={totalCountryPages === 0 || currentCountryPage <= 0}>
                <ChevronLeft className="h-3.5 w-3.5" />
                前の国
              </ConsoleButton>
              <ConsoleButton size="sm" onClick={() => setCurrentCountryPage((prev) => Math.min(prev + 1, totalCountryPages - 1))} disabled={totalCountryPages === 0 || currentCountryPage >= totalCountryPages - 1}>
                次の国
                <ChevronRight className="h-3.5 w-3.5" />
              </ConsoleButton>
            </div>
          </>
        }
      />

      <div className="mt-2 text-center text-[11px] text-gray-400">※ JSON以外のレスポンスが来る場合は、proxy未設定・認証リダイレクト・APIパス誤りをまず確認してください。</div>

      <ConsoleModal
        open={modalOpen}
        title="未確認の新規リーグデータ確認"
        description="country / league はその場で編集できます。OK で行更新後に initialFlg を更新します。不要な行は複数選択して削除できます。"
        onClose={closeModal}
        busy={modalBusy}
        footer={
          <>
            <ConsoleButton variant="danger" onClick={() => void handleDeleteSelected()} disabled={selectedDeleteKeys.length === 0 || updatingModal} loading={deletingModalRows}>
              {!deletingModalRows && <Trash2 className="h-3.5 w-3.5" />}
              選択行を削除{selectedDeleteKeys.length > 0 ? `（${selectedDeleteKeys.length}）` : ""}
            </ConsoleButton>
            <div className="ml-auto flex gap-1.5">
              <ConsoleButton onClick={closeModal} disabled={modalBusy}>
                キャンセル
              </ConsoleButton>
              <ConsoleButton variant="success" onClick={() => void handleConfirmModal()} disabled={deletingModalRows || rowsWithPendingEdit.length === 0} loading={updatingModal} className="min-w-[80px]">
                OK
              </ConsoleButton>
            </div>
          </>
        }
      >
        <ConsoleNotice tone="info">セルをクリックするとその場で編集できます。Enter またはフォーカスアウトで反映、Esc でキャンセルします。</ConsoleNotice>
        {selectedDeleteKeys.length > 0 && <ConsoleNotice tone="ng" title={`削除選択中: ${selectedDeleteKeys.length}件`} />}
        {modalError && <ConsoleNotice tone="ng" title="モーダルエラー">{modalError}</ConsoleNotice>}
        {modalInfo && !modalError && <ConsoleNotice tone="info" title={modalInfo} />}

        {modalLoading ? (
          <div className="py-8 text-center text-sm text-gray-400">未確認データを読み込み中です…</div>
        ) : (
          <ConsoleTable
            columns={modalColumns}
            rows={rowsWithPendingEdit}
            rowKey={(row, i) => `${modalKeyOf(row)}-${i}`}
            emptyText="未確認の新規データはありません。"
            rowClassName={(row) => (selectedDeleteKeys.includes(modalKeyOf(row)) ? "!bg-red-50" : "")}
          />
        )}
      </ConsoleModal>
    </div>
  );
}
