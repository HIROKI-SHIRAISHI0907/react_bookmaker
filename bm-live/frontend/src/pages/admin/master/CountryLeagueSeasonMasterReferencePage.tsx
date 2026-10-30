import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { queryClient } from "../../../lib/queryClient";
import { SETUP_STATUS_QUERY_KEY } from "../SetupGate";
import { RefreshCw, Trash2 } from "lucide-react";
import {
  BadgeTone,
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
  fmtNum,
} from "../../../api/commonAdminDesign";

type CountryLeagueSeasonDTO = {
  id?: number;
  country?: string;
  league?: string;
  seasonYear?: string;
  startSeasonDate?: string;
  endSeasonDate?: string;
  round?: string;
  validFlg?: boolean | string | number;
  delFlg?: boolean | string | number;
};

type CountryLeagueSeasonMasterEntity = {
  id?: number;
  country?: string;
  league?: string;
  seasonYear?: string;
  startSeasonDate?: string;
  endSeasonDate?: string;
  round?: string;
  validFlg?: boolean | string | number;
  delFlg?: boolean | string | number;
  registerId?: string;
  registerTime?: string;
  updateId?: string;
  updateTime?: string;
};

type InitialReadingMasterCsvResponse = {
  masterName?: string;
  message?: string;
  countryLeagueSeasonMasterEntityList?: CountryLeagueSeasonMasterEntity[];
};

type InitialReadingMasterCsvUpdateTargetRequest = {
  country: string;
  league: string;
};

type InitialReadingMasterCsvUpdateRequest = {
  masterName: string;
  targets: InitialReadingMasterCsvUpdateTargetRequest[];
};

type InitialReadingMasterCsvUpdateRowRequest = {
  masterName: string;
  masterEntities?: never[];
  seasonMasterEntities?: CountryLeagueSeasonMasterEntity[];
};

type InitialReadingMasterCsvUpdateResponse = {
  success?: boolean;
  message?: string;
  updateCount?: number;
  updatedTargets?: InitialReadingMasterCsvUpdateTargetRequest[];
};

type InitialReadingMasterCsvDeleteTargetRequest = {
  masterName: string;
  masterEntities?: never[];
  seasonMasterEntities?: CountryLeagueSeasonMasterEntity[];
};

type SelectedTarget = {
  country: string;
  league: string;
};

type EditingCell = {
  rowIndex: number;
  field: keyof CountryLeagueSeasonMasterEntity;
} | null;

const PAGE_SIZE = 10;
const MASTER_NAME = "country_league_season_master";

/** モーダルで編集できる列（シーズン状態は end の後ろに差し込む） */
const MODAL_EDIT_FIELDS_BEFORE: { field: keyof CountryLeagueSeasonMasterEntity; label: string }[] = [
  { field: "country", label: "country" },
  { field: "league", label: "league" },
  { field: "seasonYear", label: "seasonYear" },
  { field: "startSeasonDate", label: "start" },
  { field: "endSeasonDate", label: "end" },
];
const MODAL_EDIT_FIELDS_AFTER: (keyof CountryLeagueSeasonMasterEntity)[] = ["round", "validFlg", "delFlg", "registerId", "registerTime", "updateId", "updateTime"];

async function fetchJsonStrict<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    credentials: "include",
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const contentType = response.headers.get("content-type") ?? "";
  const rawText = await response.text();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${rawText || response.statusText}`);
  }

  if (!contentType.includes("application/json")) {
    throw new Error(`JSON以外のレスポンスを受信しました: ${rawText.slice(0, 200)}`);
  }

  return JSON.parse(rawText) as T;
}

function toDisplay(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

function uniqueTargetsFromSeasonRows(rows: CountryLeagueSeasonMasterEntity[]): InitialReadingMasterCsvUpdateTargetRequest[] {
  const map = new Map<string, InitialReadingMasterCsvUpdateTargetRequest>();

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

function seasonRowDeleteKey(row: CountryLeagueSeasonMasterEntity): string {
  if (row.id != null) {
    return String(row.id);
  }
  return `${row.country ?? ""}___${row.league ?? ""}___${row.seasonYear ?? ""}`;
}

function getTokyoTodayDateOnly(): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());
}

function normalizeDateOnly(value?: string): string | null {
  const raw = (value ?? "").trim();
  if (!raw || raw === "-") {
    return null;
  }

  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) {
    return match[1];
  }

  return null;
}

function isCurrentSeason(seasonYear?: string): boolean {
  const value = (seasonYear ?? "").trim();
  if (!value) {
    return false;
  }

  const currentYear = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
  }).format(new Date());

  return value.includes(currentYear);
}

function getSeasonStatus(params: { seasonYear?: string; startSeasonDate?: string; endSeasonDate?: string }): { label: string; tone: BadgeTone } {
  const today = getTokyoTodayDateOnly();
  const start = normalizeDateOnly(params.startSeasonDate);
  const end = normalizeDateOnly(params.endSeasonDate);
  const currentSeason = isCurrentSeason(params.seasonYear);

  if (currentSeason && start && today < start) {
    return { label: "シーズン開始前", tone: "warn" };
  }

  if (start && end && today >= start && today <= end) {
    return { label: "シーズン中", tone: "ok" };
  }

  return { label: "シーズンオフ", tone: "neutral" };
}

function formatTokyoDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}（${map.weekday}） ${map.hour}:${map.minute}:${map.second}`;
}

const SeasonStatusBadge: React.FC<{ seasonYear?: string; startSeasonDate?: string; endSeasonDate?: string }> = (props) => {
  const status = getSeasonStatus(props);
  return <StatusBadge tone={status.tone}>{status.label}</StatusBadge>;
};

const CountryLeagueSeasonMasterPage: React.FC = () => {
  const [rows, setRows] = useState<CountryLeagueSeasonDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [newRows, setNewRows] = useState<CountryLeagueSeasonMasterEntity[]>([]);
  const [newRowsLoading, setNewRowsLoading] = useState(false);
  const [newRowsError, setNewRowsError] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<EditingCell>(null);
  const [editingValue, setEditingValue] = useState("");
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deletingRows, setDeletingRows] = useState(false);
  const [selectedDeleteKeys, setSelectedDeleteKeys] = useState<string[]>([]);
  const [tokyoNowText, setTokyoNowText] = useState("");
  const hasOpenedOnMountRef = useRef(false);

  const busy = updatingStatus || deletingRows;

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingCell(null);
    setEditingValue("");
    setNewRowsError(null);
    setNewRowsLoading(false);
    setSelectedDeleteKeys([]);
  }, []);

  const fetchNewRows = useCallback(async (target: SelectedTarget): Promise<CountryLeagueSeasonMasterEntity[]> => {
    const params = new URLSearchParams({
      masterName: MASTER_NAME,
      country: target.country,
      league: target.league,
    });

    const response = await fetchJsonStrict<InitialReadingMasterCsvResponse>(`/v1/api/admin/master/initial/csv?${params.toString()}`);
    return response.countryLeagueSeasonMasterEntityList ?? [];
  }, []);

  const updateEditedRowsApi = useCallback(async (rowsToUpdate: CountryLeagueSeasonMasterEntity[]) => {
    const body: InitialReadingMasterCsvUpdateRowRequest = {
      masterName: MASTER_NAME,
      seasonMasterEntities: rowsToUpdate,
    };

    return fetchJsonStrict<InitialReadingMasterCsvUpdateResponse>("/v1/api/admin/master/initial/csv/update-row", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });
  }, []);

  const updateInitialFlg = useCallback(async (targets: InitialReadingMasterCsvUpdateTargetRequest[]) => {
    const body: InitialReadingMasterCsvUpdateRequest = {
      masterName: MASTER_NAME,
      targets,
    };

    return fetchJsonStrict<InitialReadingMasterCsvUpdateResponse>("/v1/api/admin/master/initial/csv/update-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });
  }, []);

  const deleteSelectedRowsApi = useCallback(async (rowsToDelete: CountryLeagueSeasonMasterEntity[]) => {
    const body: InitialReadingMasterCsvDeleteTargetRequest = {
      masterName: MASTER_NAME,
      seasonMasterEntities: rowsToDelete,
    };

    return fetchJsonStrict<InitialReadingMasterCsvUpdateResponse>("/v1/api/admin/master/initial/csv/delete-row", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });
  }, []);

  const openModalForTarget = useCallback(
    async (target: SelectedTarget) => {
      setNewRows([]);
      setNewRowsError(null);
      setEditingCell(null);
      setEditingValue("");
      setInfoMessage(null);
      setModalOpen(false);
      setNewRowsLoading(true);
      setSelectedDeleteKeys([]);

      try {
        const fetchedRows = await fetchNewRows(target);

        if (fetchedRows.length === 0) {
          setNewRows([]);
          setModalOpen(false);
          setInfoMessage("新規登録データはありません。");
          return;
        }

        setNewRows(fetchedRows);
        setModalOpen(true);
      } catch (e) {
        setNewRows([]);
        setModalOpen(false);
        setNewRowsError(e instanceof Error ? e.message : "新規登録データの取得に失敗しました。");
      } finally {
        setNewRowsLoading(false);
      }
    },
    [fetchNewRows],
  );

  const openModal = useCallback(
    async (row: CountryLeagueSeasonDTO) => {
      await openModalForTarget({
        country: row.country ?? "",
        league: row.league ?? "",
      });
    },
    [openModalForTarget],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const data = await fetchJsonStrict<CountryLeagueSeasonDTO[]>("/v1/api/country-league-season-master");
      const nextRows = Array.isArray(data) ? data : [];

      setRows(nextRows);
      setCurrentPage(0);

      if (!hasOpenedOnMountRef.current) {
        hasOpenedOnMountRef.current = true;

        if (nextRows.length > 0) {
          const firstRow = nextRows[0];
          await openModalForTarget({
            country: firstRow.country ?? "",
            league: firstRow.league ?? "",
          });
        } else {
          setNewRows([]);
          setNewRowsError(null);
          setNewRowsLoading(false);
          setModalOpen(false);
          setInfoMessage("一覧データがありません。");
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "一覧取得に失敗しました。");
      setRows([]);
      setCurrentPage(0);
      setModalOpen(false);
    } finally {
      setLoading(false);
    }
  }, [openModalForTarget]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const updateTokyoNow = () => setTokyoNowText(formatTokyoDate(new Date()));
    updateTokyoNow();
    const timerId = window.setInterval(updateTokyoNow, 1000);
    return () => window.clearInterval(timerId);
  }, []);

  const filteredRows = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((row) =>
      [row.country, row.league, row.seasonYear, row.startSeasonDate, row.endSeasonDate, row.round, row.validFlg, row.delFlg].map((v) => String(v ?? "").toLowerCase()).some((v) => v.includes(q)),
    );
  }, [rows, keyword]);

  const totalPages = Math.ceil(filteredRows.length / PAGE_SIZE);

  const pagedRows = useMemo(() => {
    const start = currentPage * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, currentPage]);

  useEffect(() => {
    if (totalPages === 0) {
      if (currentPage !== 0) setCurrentPage(0);
      return;
    }

    if (currentPage > totalPages - 1) {
      setCurrentPage(0);
    }
  }, [totalPages, currentPage]);

  const startEdit = (rowIndex: number, field: keyof CountryLeagueSeasonMasterEntity, currentValue: unknown) => {
    setEditingCell({ rowIndex, field });
    setEditingValue(currentValue == null ? "" : String(currentValue));
  };

  const commitEdit = () => {
    if (!editingCell) return;

    setNewRows((prev) => prev.map((row, index) => (index === editingCell.rowIndex ? { ...row, [editingCell.field]: editingValue } : row)));

    setEditingCell(null);
    setEditingValue("");
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditingValue("");
  };

  const rowsWithPendingEdit = useMemo(() => {
    if (editingCell == null) return newRows;

    return newRows.map((row, index) => (index === editingCell.rowIndex ? { ...row, [editingCell.field]: editingValue } : row));
  }, [newRows, editingCell, editingValue]);

  const allModalRowsSelected = useMemo(() => {
    if (rowsWithPendingEdit.length === 0) return false;
    return rowsWithPendingEdit.every((row) => selectedDeleteKeys.includes(seasonRowDeleteKey(row)));
  }, [rowsWithPendingEdit, selectedDeleteKeys]);

  const toggleSelectRow = (key: string) => {
    setSelectedDeleteKeys((prev) => (prev.includes(key) ? prev.filter((v) => v !== key) : [...prev, key]));
  };

  const toggleSelectAllRows = () => {
    if (allModalRowsSelected) {
      setSelectedDeleteKeys([]);
      return;
    }

    setSelectedDeleteKeys(rowsWithPendingEdit.map((row) => seasonRowDeleteKey(row)));
  };

  const handleDeleteSelected = useCallback(async () => {
    if (busy) return;

    const deleteTargets = rowsWithPendingEdit.filter((row) => selectedDeleteKeys.includes(seasonRowDeleteKey(row)));

    if (deleteTargets.length === 0) {
      setNewRowsError("削除対象を選択してください。");
      return;
    }

    setDeletingRows(true);
    setNewRowsError(null);

    try {
      const response = await deleteSelectedRowsApi(deleteTargets);

      if (response.success === false) {
        throw new Error(response.message || "削除に失敗しました。");
      }

      const deleteKeySet = new Set(deleteTargets.map((row) => seasonRowDeleteKey(row)));
      const remainingRows = rowsWithPendingEdit.filter((row) => !deleteKeySet.has(seasonRowDeleteKey(row)));
      const message = response.message || `${deleteTargets.length}件削除しました。`;

      setNewRows(remainingRows);
      setSelectedDeleteKeys([]);
      setEditingCell(null);
      setEditingValue("");

      await load();

      if (remainingRows.length === 0) {
        closeModal();
      }

      setInfoMessage(message);
      // 入口チェック（未対応の件数）を取り直す
      void queryClient.invalidateQueries({ queryKey: SETUP_STATUS_QUERY_KEY });
    } catch (e) {
      setNewRowsError(e instanceof Error ? e.message : "削除に失敗しました。");
    } finally {
      setDeletingRows(false);
    }
  }, [busy, rowsWithPendingEdit, selectedDeleteKeys, deleteSelectedRowsApi, load, closeModal]);

  const handleConfirmOk = useCallback(async () => {
    if (busy) return;

    const rowsToSubmit = rowsWithPendingEdit;

    if (rowsToSubmit.length === 0) {
      closeModal();
      setInfoMessage("更新対象がないため、そのまま閉じました。");
      return;
    }

    setUpdatingStatus(true);
    setNewRowsError(null);

    try {
      const updateRowResponse = await updateEditedRowsApi(rowsToSubmit);

      if (updateRowResponse.success === false) {
        throw new Error(updateRowResponse.message || "行データの更新に失敗しました。");
      }

      const targets = uniqueTargetsFromSeasonRows(rowsToSubmit);
      let finalMessage = updateRowResponse.message || "行データを更新しました。";

      if (targets.length > 0) {
        const updateStatusResponse = await updateInitialFlg(targets);

        if (updateStatusResponse.success === false) {
          throw new Error(updateStatusResponse.message || "initialFlg更新に失敗しました。");
        }

        finalMessage = updateStatusResponse.message || updateRowResponse.message || `更新しました。更新件数: ${updateStatusResponse.updateCount ?? 0}`;
      }

      closeModal();
      await load();
      setInfoMessage(finalMessage);
      // 入口チェック（未対応の件数）を取り直す
      void queryClient.invalidateQueries({ queryKey: SETUP_STATUS_QUERY_KEY });
    } catch (e) {
      setNewRowsError(e instanceof Error ? e.message : "更新に失敗しました。");
    } finally {
      setUpdatingStatus(false);
    }
  }, [busy, rowsWithPendingEdit, updateEditedRowsApi, updateInitialFlg, closeModal, load]);

  /* ----- 一覧の列 ----- */
  const listColumns: ConsoleColumn<CountryLeagueSeasonDTO>[] = [
    { key: "no", header: "No", mono: true, align: "right", cell: (_r, i) => <span className="text-gray-500">{currentPage * PAGE_SIZE + i + 1}</span> },
    { key: "country", header: "country", cell: (r) => toDisplay(r.country) },
    { key: "league", header: "league", cell: (r) => toDisplay(r.league) },
    { key: "seasonYear", header: "seasonYear", mono: true, cell: (r) => toDisplay(r.seasonYear) },
    { key: "start", header: "start", mono: true, cell: (r) => toDisplay(r.startSeasonDate) },
    { key: "end", header: "end", mono: true, cell: (r) => toDisplay(r.endSeasonDate) },
    { key: "status", header: "シーズン状態", cell: (r) => <SeasonStatusBadge seasonYear={r.seasonYear} startSeasonDate={r.startSeasonDate} endSeasonDate={r.endSeasonDate} /> },
    { key: "round", header: "round", mono: true, cell: (r) => toDisplay(r.round) },
    {
      key: "check",
      header: "確認",
      align: "right",
      cell: (r) => (
        <ConsoleButton size="sm" onClick={() => void openModal(r)} disabled={newRowsLoading}>
          確認
        </ConsoleButton>
      ),
    },
  ];

  /* ----- モーダルの列 ----- */
  const editCol = (field: keyof CountryLeagueSeasonMasterEntity, label: string, maxWidth = 160): ConsoleColumn<CountryLeagueSeasonMasterEntity> => ({
    key: String(field),
    header: label,
    cell: (row, rowIndex) => (
      <ClickEditCell
        value={row[field]}
        editing={editingCell?.rowIndex === rowIndex && editingCell?.field === field}
        editingValue={editingValue}
        onStart={() => startEdit(rowIndex, field, row[field])}
        onChange={setEditingValue}
        onCommit={commitEdit}
        onCancel={cancelEdit}
        maxWidth={maxWidth}
        disabled={busy}
      />
    ),
  });

  const modalColumns: ConsoleColumn<CountryLeagueSeasonMasterEntity>[] = [
    {
      key: "check",
      header: (
        <input type="checkbox" checked={allModalRowsSelected} onChange={toggleSelectAllRows} disabled={busy || rowsWithPendingEdit.length === 0} className="accent-red-600" aria-label="すべて選択" />
      ),
      align: "center",
      cell: (row) => {
        const key = seasonRowDeleteKey(row);
        return <input type="checkbox" checked={selectedDeleteKeys.includes(key)} onChange={() => toggleSelectRow(key)} disabled={busy} className="accent-red-600" aria-label="削除対象として選択" />;
      },
    },
    { key: "id", header: "id", mono: true, cell: (row) => <span className="text-gray-500">{toDisplay(row.id)}</span> },
    ...MODAL_EDIT_FIELDS_BEFORE.map((f) => editCol(f.field, f.label)),
    { key: "status", header: "シーズン状態", cell: (row) => <SeasonStatusBadge seasonYear={row.seasonYear} startSeasonDate={row.startSeasonDate} endSeasonDate={row.endSeasonDate} /> },
    ...MODAL_EDIT_FIELDS_AFTER.map((field) => editCol(field, String(field), field === "registerTime" || field === "updateTime" ? 220 : 160)),
  ];

  return (
    <div>
      <ConsoleToolbar title="シーズンデータ取得情報" info="全件を一括取得し、10件ずつ表示" description="このページを開くと、最初の国リーグの新規登録データを確認するモーダルを自動で表示します。">
        <span className="font-mono text-xs tabular-nums text-gray-500">現在 {tokyoNowText || "-"} JST</span>
        <ConsoleInput
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setCurrentPage(0);
          }}
          placeholder="country / league / seasonYear などで絞り込み"
          className="w-72"
        />
        <ConsoleButton variant="primary" onClick={() => void load()} loading={loading}>
          {!loading && <RefreshCw className="h-3.5 w-3.5" />}
          再読み込み
        </ConsoleButton>
      </ConsoleToolbar>

      <StatChips
        items={[
          { label: "総件数", value: fmtNum(rows.length) },
          { label: "絞込件数", value: fmtNum(filteredRows.length) },
          { label: "ページ", value: `${totalPages === 0 ? 0 : currentPage + 1} / ${totalPages}` },
        ]}
      />

      {error && (
        <ConsoleNotice tone="ng" onClose={() => setError(null)}>
          {error}
        </ConsoleNotice>
      )}
      {newRowsError && !modalOpen && (
        <ConsoleNotice tone="ng" onClose={() => setNewRowsError(null)}>
          {newRowsError}
        </ConsoleNotice>
      )}
      {infoMessage && !modalOpen && <ConsoleNotice tone="info" title={infoMessage} onClose={() => setInfoMessage(null)} />}
      {newRowsLoading && !modalOpen && <ConsoleNotice tone="info" title="新規登録データを確認中です…" />}

      <ConsoleTable
        columns={listColumns}
        rows={pagedRows}
        rowKey={(r, i) => `${r.country}-${r.league}-${r.seasonYear}-${i}`}
        loading={loading}
        emptyText="表示できるデータがありません。"
        paging={{ page: currentPage + 1, pageSize: PAGE_SIZE, total: filteredRows.length, onChange: (p) => setCurrentPage(p - 1) }}
      />

      <ConsoleModal
        open={modalOpen}
        title="新規シーズンデータ確認"
        description="OK を押すと編集内容を更新し、その後 initialFlg を更新します。不要な行は複数選択して削除できます。"
        onClose={closeModal}
        busy={busy}
        width={1180}
        footer={
          <>
            <ConsoleButton variant="danger" onClick={() => void handleDeleteSelected()} disabled={selectedDeleteKeys.length === 0 || updatingStatus} loading={deletingRows}>
              {!deletingRows && <Trash2 className="h-3.5 w-3.5" />}
              {deletingRows ? "削除中…" : `選択行を削除${selectedDeleteKeys.length > 0 ? `（${selectedDeleteKeys.length}）` : ""}`}
            </ConsoleButton>
            <div className="ml-auto flex gap-1.5">
              <ConsoleButton onClick={closeModal} disabled={busy}>
                キャンセル
              </ConsoleButton>
              <ConsoleButton variant="success" onClick={() => void handleConfirmOk()} disabled={deletingRows} loading={updatingStatus} className="min-w-[80px]">
                {updatingStatus ? "更新中…" : "OK"}
              </ConsoleButton>
            </div>
          </>
        }
      >
        <ConsoleNotice tone="info">セルをクリックするとその場で編集できます。Enter またはフォーカスアウトで反映、Esc でキャンセルします。</ConsoleNotice>
        {selectedDeleteKeys.length > 0 && <ConsoleNotice tone="ng" title={`削除選択中: ${selectedDeleteKeys.length}件`} />}
        {newRowsError && <ConsoleNotice tone="ng">{newRowsError}</ConsoleNotice>}

        {newRowsLoading ? (
          <div className="py-8 text-center text-sm text-gray-400">新規登録データを読み込み中です…</div>
        ) : (
          <ConsoleTable
            columns={modalColumns}
            rows={rowsWithPendingEdit}
            rowKey={(row, i) => (row.id != null ? String(row.id) : `${row.country}-${row.league}-${row.seasonYear}-${i}`)}
            rowClassName={(row) => (selectedDeleteKeys.includes(seasonRowDeleteKey(row)) ? "!bg-red-50" : "")}
          />
        )}
      </ConsoleModal>
    </div>
  );
};

export default CountryLeagueSeasonMasterPage;
