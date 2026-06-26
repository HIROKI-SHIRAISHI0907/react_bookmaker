import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

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

const pageStyle: React.CSSProperties = {
  padding: 16,
  fontSize: 12,
  color: "#0f172a",
};

const sectionStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  padding: 14,
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.42)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 2147483647,
};

const modalStyle: React.CSSProperties = {
  width: "min(1080px, 94vw)",
  maxHeight: "86vh",
  overflow: "auto",
  background: "#fff",
  borderRadius: 12,
  boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
  padding: 16,
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
  tableLayout: "auto",
};

const thTdStyle: React.CSSProperties = {
  borderBottom: "1px solid #e2e8f0",
  padding: "7px 8px",
  fontSize: 12,
  verticalAlign: "top",
  lineHeight: 1.4,
};

const thStyle: React.CSSProperties = {
  ...thTdStyle,
  position: "sticky",
  top: 0,
  background: "#f8fafc",
  zIndex: 1,
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const cellTextStyle: React.CSSProperties = {
  display: "block",
  maxWidth: 160,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const wideCellTextStyle: React.CSSProperties = {
  ...cellTextStyle,
  maxWidth: 220,
};

const buttonStyle: React.CSSProperties = {
  height: 30,
  padding: "0 10px",
  borderRadius: 7,
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

const okButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: "#16a34a",
  color: "#fff",
  border: "1px solid #16a34a",
  minWidth: 80,
};

const dangerButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: "#dc2626",
  color: "#fff",
  border: "1px solid #dc2626",
  minWidth: 120,
};

const disabledButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  opacity: 0.45,
  cursor: "not-allowed",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 180,
  height: 30,
  border: "1px solid #94a3b8",
  borderRadius: 6,
  padding: "4px 8px",
  fontSize: 12,
  boxSizing: "border-box",
};

const badgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  height: 26,
  padding: "0 10px",
  borderRadius: 9999,
  background: "#f1f5f9",
  color: "#334155",
  fontSize: 12,
};

const seasonStatusBadgeBaseStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  height: 24,
  padding: "0 10px",
  borderRadius: 9999,
  fontSize: 12,
  fontWeight: 700,
  whiteSpace: "nowrap",
};

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

function isSeasonOff(endSeasonDate?: string): boolean {
  const value = (endSeasonDate ?? "").trim();
  return value === "" || value === "-";
}

function getSeasonStatus(endSeasonDate?: string): { label: string; icon: string; style: React.CSSProperties } {
  if (isSeasonOff(endSeasonDate)) {
    return {
      label: "シーズンオフ",
      icon: "⚪",
      style: {
        ...seasonStatusBadgeBaseStyle,
        background: "#f1f5f9",
        color: "#475569",
        border: "1px solid #cbd5e1",
      },
    };
  }

  return {
    label: "シーズン中",
    icon: "🟢",
    style: {
      ...seasonStatusBadgeBaseStyle,
      background: "#dcfce7",
      color: "#166534",
      border: "1px solid #86efac",
    },
  };
}

function formatTokyoDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}（${map.weekday}） Asia/Tokyo`;
}

type EditableCellProps = {
  rowIndex: number;
  field: keyof CountryLeagueSeasonMasterEntity;
  value: unknown;
  editingCell: EditingCell;
  editingValue: string;
  wide?: boolean;
  onStartEdit: (rowIndex: number, field: keyof CountryLeagueSeasonMasterEntity, currentValue: unknown) => void;
  onChangeValue: (value: string) => void;
  onCommit: () => void;
  onCancel: () => void;
};

const EditableCell: React.FC<EditableCellProps> = ({ rowIndex, field, value, editingCell, editingValue, wide, onStartEdit, onChangeValue, onCommit, onCancel }) => {
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
        style={inputStyle}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => onStartEdit(rowIndex, field, value)}
      style={{
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        color: "#0f172a",
        fontSize: 12,
      }}
      title={toDisplay(value)}
    >
      <span style={wide ? wideCellTextStyle : cellTextStyle}>{toDisplay(value)}</span>
    </button>
  );
};

const SeasonCell: React.FC<{ value: unknown; wide?: boolean }> = ({ value, wide }) => (
  <span style={wide ? wideCellTextStyle : cellTextStyle} title={toDisplay(value)}>
    {toDisplay(value)}
  </span>
);

const SeasonStatusBadge: React.FC<{ endSeasonDate?: string }> = ({ endSeasonDate }) => {
  const status = getSeasonStatus(endSeasonDate);

  return (
    <span style={status.style} title={status.label}>
      <span aria-hidden="true">{status.icon}</span>
      <span>{status.label}</span>
    </span>
  );
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
    const updateTokyoNow = () => {
      setTokyoNowText(formatTokyoDate(new Date()));
    };

    updateTokyoNow();

    const timerId = window.setInterval(updateTokyoNow, 60 * 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  useEffect(() => {
    if (!modalOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) {
        closeModal();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [modalOpen, closeModal, busy]);

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

    setNewRows((prev) =>
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

  const rowsWithPendingEdit = useMemo(() => {
    if (editingCell == null) return newRows;

    return newRows.map((row, index) =>
      index === editingCell.rowIndex
        ? {
            ...row,
            [editingCell.field]: editingValue,
          }
        : row,
    );
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
    } catch (e) {
      setNewRowsError(e instanceof Error ? e.message : "更新に失敗しました。");
    } finally {
      setUpdatingStatus(false);
    }
  }, [busy, rowsWithPendingEdit, updateEditedRowsApi, updateInitialFlg, closeModal, load]);

  const modalContent =
    modalOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            style={overlayStyle}
            role="dialog"
            aria-modal="true"
            aria-labelledby="country-league-season-modal-title"
            onClick={(e) => {
              if (e.target === e.currentTarget && !busy) {
                closeModal();
              }
            }}
          >
            <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div>
                  <h2 id="country-league-season-modal-title" style={{ margin: 0, fontSize: 18, lineHeight: 1.3 }}>
                    新規シーズンデータ確認
                  </h2>
                  <p style={{ margin: "6px 0 0", color: "#475569", fontSize: 12 }}>
                    各セルは編集できます。OK を押すと編集内容を更新し、その後 initialFlg を更新します。不要な行は複数選択して削除できます。
                  </p>
                </div>
                <button type="button" style={busy ? disabledButtonStyle : buttonStyle} onClick={closeModal} disabled={busy}>
                  閉じる
                </button>
              </div>

              <div
                style={{
                  marginTop: 12,
                  padding: 10,
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              >
                各セルはクリックするとその場で編集できます。Enter またはフォーカスアウトで反映、Esc でキャンセルします。
              </div>

              {selectedDeleteKeys.length > 0 && (
                <div
                  style={{
                    marginTop: 12,
                    padding: 10,
                    background: "#fef2f2",
                    color: "#991b1b",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                >
                  削除選択中: {selectedDeleteKeys.length}件
                </div>
              )}

              {newRowsError && (
                <div
                  style={{
                    marginTop: 12,
                    color: "#b91c1c",
                    background: "#fee2e2",
                    padding: 10,
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                >
                  {newRowsError}
                </div>
              )}

              {newRowsLoading ? (
                <div style={{ marginTop: 16, fontSize: 12 }}>新規登録データを読み込み中です...</div>
              ) : (
                <div style={tableWrapperStyle}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={{ ...thStyle, width: 44, textAlign: "center" }}>
                          <input type="checkbox" checked={allModalRowsSelected} onChange={toggleSelectAllRows} disabled={busy || rowsWithPendingEdit.length === 0} />
                        </th>
                        {["id", "country", "league", "seasonYear", "start", "end", "シーズン状態", "round", "validFlg", "delFlg", "registerId", "registerTime", "updateId", "updateTime"].map(
                          (label) => (
                            <th key={label} style={thStyle}>
                              {label}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {rowsWithPendingEdit.map((row, rowIndex) => {
                        const key = seasonRowDeleteKey(row);
                        const checked = selectedDeleteKeys.includes(key);

                        return (
                          <tr
                            key={row.id != null ? String(row.id) : `${row.country}-${row.league}-${row.seasonYear}-${rowIndex}`}
                            style={{ background: checked ? "#fef2f2" : rowIndex % 2 === 0 ? "#ffffff" : "#fcfcfd" }}
                          >
                            <td style={{ ...thTdStyle, textAlign: "center" }}>
                              <input type="checkbox" checked={checked} onChange={() => toggleSelectRow(key)} disabled={busy} />
                            </td>

                            <td style={thTdStyle}>
                              <SeasonCell value={row.id} />
                            </td>

                            <td style={thTdStyle}>
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

                            <td style={thTdStyle}>
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

                            <td style={thTdStyle}>
                              <EditableCell
                                rowIndex={rowIndex}
                                field="seasonYear"
                                value={row.seasonYear}
                                editingCell={editingCell}
                                editingValue={editingValue}
                                onStartEdit={startEdit}
                                onChangeValue={setEditingValue}
                                onCommit={commitEdit}
                                onCancel={cancelEdit}
                              />
                            </td>

                            <td style={thTdStyle}>
                              <EditableCell
                                rowIndex={rowIndex}
                                field="startSeasonDate"
                                value={row.startSeasonDate}
                                editingCell={editingCell}
                                editingValue={editingValue}
                                onStartEdit={startEdit}
                                onChangeValue={setEditingValue}
                                onCommit={commitEdit}
                                onCancel={cancelEdit}
                              />
                            </td>

                            <td style={thTdStyle}>
                              <EditableCell
                                rowIndex={rowIndex}
                                field="endSeasonDate"
                                value={row.endSeasonDate}
                                editingCell={editingCell}
                                editingValue={editingValue}
                                onStartEdit={startEdit}
                                onChangeValue={setEditingValue}
                                onCommit={commitEdit}
                                onCancel={cancelEdit}
                              />
                            </td>

                            <td style={thTdStyle}>
                              <SeasonStatusBadge endSeasonDate={row.endSeasonDate} />
                            </td>

                            {(["round", "validFlg", "delFlg", "registerId", "registerTime", "updateId", "updateTime"] as (keyof CountryLeagueSeasonMasterEntity)[]).map((field) => (
                              <td key={String(field)} style={thTdStyle}>
                                <EditableCell
                                  rowIndex={rowIndex}
                                  field={field}
                                  value={row[field]}
                                  wide={field === "registerTime" || field === "updateTime"}
                                  editingCell={editingCell}
                                  editingValue={editingValue}
                                  onStartEdit={startEdit}
                                  onChangeValue={setEditingValue}
                                  onCommit={commitEdit}
                                  onCancel={cancelEdit}
                                />
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
                <button
                  type="button"
                  style={busy || selectedDeleteKeys.length === 0 ? disabledButtonStyle : dangerButtonStyle}
                  onClick={() => void handleDeleteSelected()}
                  disabled={busy || selectedDeleteKeys.length === 0}
                >
                  {deletingRows ? "削除中..." : `選択行を削除${selectedDeleteKeys.length > 0 ? ` (${selectedDeleteKeys.length})` : ""}`}
                </button>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <button type="button" style={busy ? disabledButtonStyle : buttonStyle} onClick={closeModal} disabled={busy}>
                    キャンセル
                  </button>
                  <button type="button" style={busy ? disabledButtonStyle : okButtonStyle} onClick={() => void handleConfirmOk()} disabled={busy}>
                    {updatingStatus ? "更新中..." : "OK"}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div style={pageStyle}>
        <div style={sectionStyle}>
          <div
            style={{
              marginBottom: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h1 style={{ margin: 0, fontSize: 22, lineHeight: 1.3 }}>country_league_season_master 確認</h1>
              <p style={{ margin: "6px 0 0", color: "#475569", fontSize: 12 }}>このページに遷移した瞬間にモーダルを表示し、APIでは全件一括取得、画面側で10件ずつページング表示します。</p>
            </div>

            <div
              style={{
                fontSize: 12,
                color: "#334155",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: "8px 10px",
                whiteSpace: "nowrap",
              }}
            >
              現在日時: {tokyoNowText || "-"}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
            <button type="button" onClick={() => void load()} style={primaryButtonStyle}>
              {loading ? "読み込み中..." : "再読み込み"}
            </button>
            <input
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setCurrentPage(0);
              }}
              placeholder="country / league / seasonYear などで絞り込み"
              style={{ ...inputStyle, width: 300 }}
            />
            <span style={badgeStyle}>総件数: {rows.length}</span>
            <span style={badgeStyle}>絞込件数: {filteredRows.length}</span>
            <span style={badgeStyle}>
              ページ: {totalPages === 0 ? 0 : currentPage + 1} / {totalPages}
            </span>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
            <button type="button" style={currentPage <= 0 ? disabledButtonStyle : buttonStyle} onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))} disabled={currentPage <= 0}>
              前へ
            </button>
            <button
              type="button"
              style={currentPage >= totalPages - 1 || totalPages === 0 ? disabledButtonStyle : buttonStyle}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))}
              disabled={currentPage >= totalPages - 1 || totalPages === 0}
            >
              次へ
            </button>
          </div>

          {error && <div style={{ marginBottom: 10, color: "#b91c1c", background: "#fee2e2", padding: 10, borderRadius: 8, fontSize: 12 }}>{error}</div>}
          {newRowsError && !modalOpen && <div style={{ marginBottom: 10, color: "#b91c1c", background: "#fee2e2", padding: 10, borderRadius: 8, fontSize: 12 }}>{newRowsError}</div>}
          {infoMessage && !modalOpen && <div style={{ marginBottom: 10, color: "#1d4ed8", background: "#dbeafe", padding: 10, borderRadius: 8, fontSize: 12 }}>{infoMessage}</div>}

          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {["No", "country", "league", "seasonYear", "start", "end", "シーズン状態", "round", "delFlg", "確認"].map((label) => (
                    <th key={label} style={thStyle}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} style={thTdStyle}>
                      読み込み中です...
                    </td>
                  </tr>
                ) : pagedRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={thTdStyle}>
                      表示できるデータがありません。
                    </td>
                  </tr>
                ) : (
                  pagedRows.map((row, index) => (
                    <tr key={`${row.country}-${row.league}-${row.seasonYear}-${index}`} style={{ background: index % 2 === 0 ? "#ffffff" : "#fcfcfd" }}>
                      <td style={thTdStyle}>
                        <SeasonCell value={currentPage * PAGE_SIZE + index + 1} />
                      </td>
                      <td style={thTdStyle}>
                        <SeasonCell value={row.country} />
                      </td>
                      <td style={thTdStyle}>
                        <SeasonCell value={row.league} />
                      </td>
                      <td style={thTdStyle}>
                        <SeasonCell value={row.seasonYear} />
                      </td>
                      <td style={thTdStyle}>
                        <SeasonCell value={row.startSeasonDate} />
                      </td>
                      <td style={thTdStyle}>
                        <SeasonCell value={row.endSeasonDate} />
                      </td>
                      <td style={thTdStyle}>
                        <SeasonStatusBadge endSeasonDate={row.endSeasonDate} />
                      </td>
                      <td style={thTdStyle}>
                        <SeasonCell value={row.round} />
                      </td>
                      <td style={thTdStyle}>
                        <SeasonCell value={row.delFlg} />
                      </td>
                      <td style={thTdStyle}>
                        <button
                          type="button"
                          style={buttonStyle}
                          onClick={(e) => {
                            e.stopPropagation();
                            void openModal(row);
                          }}
                        >
                          確認
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {modalContent}
    </>
  );
};

export default CountryLeagueSeasonMasterPage;
