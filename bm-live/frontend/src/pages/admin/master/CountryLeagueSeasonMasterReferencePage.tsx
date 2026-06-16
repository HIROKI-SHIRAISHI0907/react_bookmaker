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
  path?: string;
  icon?: string;
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
  path?: string;
  icon?: string;
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

type InitialReadingMasterCsvUpdateResponse = {
  message?: string;
  updateCount?: number;
  updatedTargets?: InitialReadingMasterCsvUpdateTargetRequest[];
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

function toDisplay(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
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

const CountryLeagueSeasonMasterPage: React.FC = () => {
  const [rows, setRows] = useState<CountryLeagueSeasonDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(0);

  const [selectedTarget, setSelectedTarget] = useState<SelectedTarget | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newRows, setNewRows] = useState<CountryLeagueSeasonMasterEntity[]>([]);
  const [newRowsLoading, setNewRowsLoading] = useState(false);
  const [newRowsError, setNewRowsError] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<EditingCell>(null);
  const [editingValue, setEditingValue] = useState("");
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const hasOpenedOnMountRef = useRef(false);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setSelectedTarget(null);
    setEditingCell(null);
    setEditingValue("");
    setNewRowsError(null);
    setNewRowsLoading(false);
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

  const openModalForTarget = useCallback(
    async (target: SelectedTarget) => {
      setSelectedTarget(null);
      setNewRows([]);
      setNewRowsError(null);
      setEditingCell(null);
      setEditingValue("");
      setInfoMessage(null);
      setModalOpen(false);
      setNewRowsLoading(true);

      try {
        const fetchedRows = await fetchNewRows(target);

        if (fetchedRows.length === 0) {
          setNewRows([]);
          setSelectedTarget(null);
          setModalOpen(false);
          setInfoMessage("新規登録データはありません。");
          return;
        }

        setSelectedTarget(target);
        setNewRows(fetchedRows);
        setModalOpen(true);
      } catch (e) {
        setSelectedTarget(null);
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
          setSelectedTarget(null);
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
    if (!modalOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !updatingStatus) {
        closeModal();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [modalOpen, closeModal, updatingStatus]);

  const filteredRows = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((row) =>
      [row.country, row.league, row.seasonYear, row.startSeasonDate, row.endSeasonDate, row.round, row.path, row.icon, row.validFlg, row.delFlg]
        .map((v) => String(v ?? "").toLowerCase())
        .some((v) => v.includes(q)),
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

  const handleConfirmOk = useCallback(async () => {
    if (newRows.length === 0) {
      closeModal();
      return;
    }

    setUpdatingStatus(true);
    setNewRowsError(null);

    try {
      const uniqueTargets = Array.from(
        new Map(
          newRows.map((row) => [
            `${row.country ?? ""}___${row.league ?? ""}`,
            {
              country: row.country ?? "",
              league: row.league ?? "",
            },
          ]),
        ).values(),
      ).filter((target) => target.country && target.league);

      const requestBody: InitialReadingMasterCsvUpdateRequest = {
        masterName: MASTER_NAME,
        targets: uniqueTargets,
      };

      const response = await fetchJsonStrict<InitialReadingMasterCsvUpdateResponse>("/v1/api/admin/master/initial/csv/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      closeModal();
      setInfoMessage(response.message ?? "更新しました。");
      await load();
    } catch (e) {
      setNewRowsError(e instanceof Error ? e.message : "更新に失敗しました。");
    } finally {
      setUpdatingStatus(false);
    }
  }, [newRows, closeModal, load]);

  const modalContent =
    modalOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            style={overlayStyle}
            role="dialog"
            aria-modal="true"
            aria-labelledby="country-league-season-modal-title"
            onClick={(e) => {
              if (e.target === e.currentTarget && !updatingStatus) {
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
                  <p style={{ margin: "6px 0 0", color: "#475569", fontSize: 12 }}>新規シーズンデータが登録されています。こちらのデータで問題ないでしょうか？</p>
                </div>
                <button type="button" style={updatingStatus ? disabledButtonStyle : buttonStyle} onClick={closeModal} disabled={updatingStatus}>
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
                        {["No", "country", "league", "seasonYear", "start", "end", "round", "path", "icon", "validFlg", "delFlg", "registerId", "registerTime", "updateId", "updateTime"].map(
                          (label) => (
                            <th key={label} style={thStyle}>
                              {label}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {newRows.map((row, rowIndex) => (
                        <tr key={`${row.country}-${row.league}-${row.seasonYear}-${rowIndex}`} style={{ background: rowIndex % 2 === 0 ? "#ffffff" : "#fcfcfd" }}>
                          <td style={thTdStyle}>
                            <SeasonCell value={rowIndex + 1} />
                          </td>
                          {(
                            [
                              "country",
                              "league",
                              "seasonYear",
                              "startSeasonDate",
                              "endSeasonDate",
                              "round",
                              "path",
                              "icon",
                              "validFlg",
                              "delFlg",
                              "registerId",
                              "registerTime",
                              "updateId",
                              "updateTime",
                            ] as (keyof CountryLeagueSeasonMasterEntity)[]
                          ).map((field) => (
                            <td key={String(field)} style={thTdStyle}>
                              <EditableCell
                                rowIndex={rowIndex}
                                field={field}
                                value={row[field]}
                                wide={field === "path" || field === "icon" || field === "registerTime" || field === "updateTime"}
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
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                <button type="button" style={updatingStatus ? disabledButtonStyle : buttonStyle} onClick={closeModal} disabled={updatingStatus}>
                  キャンセル
                </button>
                <button type="button" style={updatingStatus ? disabledButtonStyle : okButtonStyle} onClick={() => void handleConfirmOk()} disabled={updatingStatus}>
                  {updatingStatus ? "更新中..." : "OK"}
                </button>
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
          <div style={{ marginBottom: 12 }}>
            <h1 style={{ margin: 0, fontSize: 22, lineHeight: 1.3 }}>country_league_season_master 確認</h1>
            <p style={{ margin: "6px 0 0", color: "#475569", fontSize: 12 }}>このページに遷移した瞬間にモーダルを表示し、APIでは全件一括取得、画面側で10件ずつページング表示します。</p>
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
                  {["No", "country", "league", "seasonYear", "start", "end", "round", "path", "icon", "validFlg", "delFlg", "確認"].map((label) => (
                    <th key={label} style={thStyle}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={12} style={thTdStyle}>
                      読み込み中です...
                    </td>
                  </tr>
                ) : pagedRows.length === 0 ? (
                  <tr>
                    <td colSpan={12} style={thTdStyle}>
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
                        <SeasonCell value={row.round} />
                      </td>
                      <td style={thTdStyle}>
                        <SeasonCell value={row.path} wide />
                      </td>
                      <td style={thTdStyle}>
                        <SeasonCell value={row.icon} wide />
                      </td>
                      <td style={thTdStyle}>
                        <SeasonCell value={row.validFlg} />
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
