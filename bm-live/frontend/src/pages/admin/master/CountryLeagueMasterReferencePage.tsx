import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type CountryLeagueDTO = {
  id?: string;
  country?: string;
  league?: string;
  team?: string;
  link?: string;
  delFlg?: string;
};

type CountryLeagueMasterEntity = {
  id?: string;
  country?: string;
  league?: string;
  team?: string;
  link?: string;
  delFlg?: string;
  registerId?: string;
  registerTime?: string;
  updateId?: string;
  updateTime?: string;
};

type InitialReadingMasterCsvResponse = {
  masterName?: string;
  message?: string;
  countryLeagueMasterEntityList?: CountryLeagueMasterEntity[];
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
  success?: boolean;
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
  field: keyof CountryLeagueMasterEntity;
} | null;

const MASTER_NAME = "country_league_master";

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
  width: "min(980px, 94vw)",
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
  maxWidth: 240,
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
  return String(value);
}

function uniqueTargetsFromRows(rows: CountryLeagueMasterEntity[]): InitialReadingMasterCsvUpdateTargetRequest[] {
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

type EditableCellProps = {
  rowIndex: number;
  field: keyof CountryLeagueMasterEntity;
  value: unknown;
  editingCell: EditingCell;
  editingValue: string;
  wide?: boolean;
  onStartEdit: (rowIndex: number, field: keyof CountryLeagueMasterEntity, currentValue: unknown) => void;
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

const MasterCell: React.FC<{ value: unknown; wide?: boolean }> = ({ value, wide }) => (
  <span style={wide ? wideCellTextStyle : cellTextStyle} title={toDisplay(value)}>
    {toDisplay(value)}
  </span>
);

const CountryLeagueMasterPage: React.FC = () => {
  const [rows, setRows] = useState<CountryLeagueDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [currentLeaguePage, setCurrentLeaguePage] = useState(0);

  const [selectedTarget, setSelectedTarget] = useState<SelectedTarget | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newRows, setNewRows] = useState<CountryLeagueMasterEntity[]>([]);
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

  const fetchNewRows = useCallback(async (target: SelectedTarget): Promise<CountryLeagueMasterEntity[]> => {
    const params = new URLSearchParams({
      masterName: MASTER_NAME,
      country: target.country,
      league: target.league,
    });

    const response = await fetchJsonStrict<InitialReadingMasterCsvResponse>(`/v1/api/admin/master/initial/csv?${params.toString()}`);
    return response.countryLeagueMasterEntityList ?? [];
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

  const openModalForTarget = useCallback(
    async (target: SelectedTarget) => {
      setInfoMessage(null);
      setNewRowsError(null);
      setNewRows([]);
      setEditingCell(null);
      setEditingValue("");
      setSelectedTarget(null);
      setModalOpen(false);
      setNewRowsLoading(true);

      try {
        const fetchedRows = await fetchNewRows(target);

        if (fetchedRows.length === 0) {
          setSelectedTarget(null);
          setNewRows([]);
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

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const data = await fetchJsonStrict<CountryLeagueDTO[]>("/v1/api/country-league-master");
      const nextRows = Array.isArray(data) ? data : [];

      setRows(nextRows);
      setCurrentLeaguePage(0);

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
      setCurrentLeaguePage(0);
      setModalOpen(false);
    } finally {
      setLoading(false);
    }
  }, [openModalForTarget]);

  const openModal = useCallback(
    async (row: CountryLeagueDTO) => {
      await openModalForTarget({
        country: row.country ?? "",
        league: row.league ?? "",
      });
    },
    [openModalForTarget],
  );

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

    return rows.filter((row) => [row.country, row.league, row.team, row.link, row.delFlg].map((v) => String(v ?? "").toLowerCase()).some((v) => v.includes(q)));
  }, [rows, keyword]);

  const leaguePages = useMemo(() => {
    const pageMap = new Map<string, CountryLeagueDTO[]>();

    filteredRows.forEach((row) => {
      const leagueKey = (row.league ?? "未設定リーグ").trim() || "未設定リーグ";
      const current = pageMap.get(leagueKey) ?? [];
      current.push(row);
      pageMap.set(leagueKey, current);
    });

    return Array.from(pageMap.entries()).map(([league, items]) => ({ league, items }));
  }, [filteredRows]);

  useEffect(() => {
    if (leaguePages.length === 0) {
      if (currentLeaguePage !== 0) setCurrentLeaguePage(0);
      return;
    }

    if (currentLeaguePage > leaguePages.length - 1) {
      setCurrentLeaguePage(0);
    }
  }, [leaguePages, currentLeaguePage]);

  const currentPageData = leaguePages[currentLeaguePage];
  const currentRows = currentPageData?.items ?? [];
  const currentLeagueName = currentPageData?.league ?? "-";
  const totalLeaguePages = leaguePages.length;

  const startEdit = (rowIndex: number, field: keyof CountryLeagueMasterEntity, currentValue: unknown) => {
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

  const handleOk = useCallback(async () => {
    if (updatingStatus) return;

    const rowsToSubmit =
      editingCell == null
        ? newRows
        : newRows.map((row, index) =>
            index === editingCell.rowIndex
              ? {
                  ...row,
                  [editingCell.field]: editingValue,
                }
              : row,
          );

    const targets = uniqueTargetsFromRows(rowsToSubmit);

    if (targets.length === 0) {
      closeModal();
      setInfoMessage("更新対象がないため、そのまま閉じました。");
      return;
    }

    setUpdatingStatus(true);
    setNewRowsError(null);

    try {
      const updateResponse = await updateInitialFlg(targets);

      if (updateResponse.success === false) {
        throw new Error(updateResponse.message || "initialFlg更新に失敗しました。");
      }

      closeModal();
      setInfoMessage(updateResponse.message || `更新しました。更新件数: ${updateResponse.updateCount ?? 0}`);
      await load();
    } catch (e) {
      setNewRowsError(e instanceof Error ? e.message : "更新に失敗しました。");
    } finally {
      setUpdatingStatus(false);
    }
  }, [newRows, editingCell, editingValue, updateInitialFlg, closeModal, updatingStatus, load]);

  const modalContent =
    modalOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            style={overlayStyle}
            role="dialog"
            aria-modal="true"
            aria-labelledby="country-league-modal-title"
            onClick={(e) => {
              if (e.target === e.currentTarget && !updatingStatus) {
                closeModal();
              }
            }}
          >
            <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div>
                  <h2 id="country-league-modal-title" style={{ margin: 0, fontSize: 18, lineHeight: 1.3 }}>
                    新規リーグデータ確認
                  </h2>
                  <p style={{ margin: "6px 0 0", color: "#475569", fontSize: 12 }}>新規リーグデータが登録されています。こちらのデータで問題ないでしょうか？</p>
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
                        {["No", "country", "league", "team", "link", "delFlg", "registerId", "registerTime", "updateId", "updateTime"].map((label) => (
                          <th key={label} style={thStyle}>
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {newRows.map((row, rowIndex) => (
                        <tr key={`${row.country}-${row.league}-${row.team}-${rowIndex}`} style={{ background: rowIndex % 2 === 0 ? "#ffffff" : "#fcfcfd" }}>
                          <td style={thTdStyle}>
                            <MasterCell value={rowIndex + 1} />
                          </td>
                          {(["country", "league", "team", "link", "delFlg", "registerId", "registerTime", "updateId", "updateTime"] as (keyof CountryLeagueMasterEntity)[]).map((field) => (
                            <td key={String(field)} style={thTdStyle}>
                              <EditableCell
                                rowIndex={rowIndex}
                                field={field}
                                value={row[field]}
                                wide={field === "link" || field === "registerTime" || field === "updateTime"}
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
                <button type="button" style={updatingStatus ? disabledButtonStyle : okButtonStyle} onClick={() => void handleOk()} disabled={updatingStatus}>
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
            <h1 style={{ margin: 0, fontSize: 22, lineHeight: 1.3 }}>country_league_master 確認</h1>
            <p style={{ margin: "6px 0 0", color: "#475569", fontSize: 12 }}>このページに遷移した瞬間にモーダルを表示し、APIでは全件一括取得、画面側で同一リーグごとにページング表示します。</p>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
            <button type="button" onClick={() => void load()} style={primaryButtonStyle}>
              {loading ? "読み込み中..." : "再読み込み"}
            </button>

            <input
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setCurrentLeaguePage(0);
              }}
              placeholder="country / league / team / link / delFlg などで絞り込み"
              style={{ ...inputStyle, width: 300 }}
            />

            <span style={badgeStyle}>総件数: {rows.length}</span>
            <span style={badgeStyle}>絞込件数: {filteredRows.length}</span>
            <span style={badgeStyle}>リーグ: {currentLeagueName}</span>
            <span style={badgeStyle}>
              ページ: {totalLeaguePages === 0 ? 0 : currentLeaguePage + 1} / {totalLeaguePages}
            </span>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              style={currentLeaguePage <= 0 ? disabledButtonStyle : buttonStyle}
              onClick={() => setCurrentLeaguePage((prev) => Math.max(prev - 1, 0))}
              disabled={currentLeaguePage <= 0}
            >
              前のリーグ
            </button>

            <button
              type="button"
              style={currentLeaguePage >= totalLeaguePages - 1 || totalLeaguePages === 0 ? disabledButtonStyle : buttonStyle}
              onClick={() => setCurrentLeaguePage((prev) => Math.min(prev + 1, totalLeaguePages - 1))}
              disabled={currentLeaguePage >= totalLeaguePages - 1 || totalLeaguePages === 0}
            >
              次のリーグ
            </button>
          </div>

          {error && (
            <div
              style={{
                marginBottom: 10,
                color: "#b91c1c",
                background: "#fee2e2",
                padding: 10,
                borderRadius: 8,
                fontSize: 12,
              }}
            >
              {error}
            </div>
          )}

          {newRowsError && !modalOpen && (
            <div
              style={{
                marginBottom: 10,
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

          {infoMessage && !modalOpen && (
            <div
              style={{
                marginBottom: 10,
                color: "#1d4ed8",
                background: "#dbeafe",
                padding: 10,
                borderRadius: 8,
                fontSize: 12,
              }}
            >
              {infoMessage}
            </div>
          )}

          {newRowsLoading && !modalOpen && (
            <div
              style={{
                marginBottom: 10,
                color: "#334155",
                background: "#f8fafc",
                padding: 10,
                borderRadius: 8,
                fontSize: 12,
              }}
            >
              新規登録データを確認中です...
            </div>
          )}

          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {["No", "country", "league", "team", "link", "delFlg", "確認"].map((label) => (
                    <th key={label} style={thStyle}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={thTdStyle}>
                      読み込み中です...
                    </td>
                  </tr>
                ) : currentRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={thTdStyle}>
                      表示できるデータがありません。
                    </td>
                  </tr>
                ) : (
                  currentRows.map((row, index) => (
                    <tr key={`${row.country}-${row.league}-${row.team}-${index}`} style={{ background: index % 2 === 0 ? "#ffffff" : "#fcfcfd" }}>
                      <td style={thTdStyle}>
                        <MasterCell value={index + 1} />
                      </td>
                      <td style={thTdStyle}>
                        <MasterCell value={row.country} />
                      </td>
                      <td style={thTdStyle}>
                        <MasterCell value={row.league} />
                      </td>
                      <td style={thTdStyle}>
                        <MasterCell value={row.team} />
                      </td>
                      <td style={thTdStyle}>
                        <MasterCell value={row.link} wide />
                      </td>
                      <td style={thTdStyle}>
                        <MasterCell value={row.delFlg} />
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

export default CountryLeagueMasterPage;
