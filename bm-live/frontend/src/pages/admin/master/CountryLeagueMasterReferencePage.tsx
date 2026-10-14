import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, Trash2 } from "lucide-react";
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
  fmtNum,
} from "../../../api/commonAdminDesign";

type CountryLeagueDTO = {
  id?: string;
  country?: string;
  league?: string;
  team?: string;
  delFlg?: string;
};

type CountryLeagueMasterEntity = {
  id?: string;
  country?: string;
  league?: string;
  team?: string;
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

type InitialReadingMasterCsvUpdateRowRequest = {
  masterName: string;
  masterEntities?: CountryLeagueMasterEntity[];
  seasonMasterEntities?: never[];
};

type InitialReadingMasterCsvUpdateResponse = {
  success?: boolean;
  message?: string;
  updateCount?: number;
  updatedTargets?: InitialReadingMasterCsvUpdateTargetRequest[];
};

type InitialReadingMasterCsvDeleteTargetRequest = {
  masterName: string;
  masterEntities?: CountryLeagueMasterEntity[];
  seasonMasterEntities?: never[];
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

const EDIT_FIELDS: (keyof CountryLeagueMasterEntity)[] = ["country", "league", "team", "delFlg"];

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

function masterRowDeleteKey(row: CountryLeagueMasterEntity): string {
  if (row.id != null && row.id !== "") {
    return String(row.id);
  }
  return `${row.country ?? ""}___${row.league ?? ""}___${row.team ?? ""}`;
}

const CountryLeagueMasterPage: React.FC = () => {
  const [rows, setRows] = useState<CountryLeagueDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [currentCountryLeaguePage, setCurrentCountryLeaguePage] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [newRows, setNewRows] = useState<CountryLeagueMasterEntity[]>([]);
  const [newRowsLoading, setNewRowsLoading] = useState(false);
  const [newRowsError, setNewRowsError] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<EditingCell>(null);
  const [editingValue, setEditingValue] = useState("");
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deletingRows, setDeletingRows] = useState(false);
  const [selectedDeleteKeys, setSelectedDeleteKeys] = useState<string[]>([]);
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

  const fetchNewRows = useCallback(async (target: SelectedTarget): Promise<CountryLeagueMasterEntity[]> => {
    const params = new URLSearchParams({
      masterName: MASTER_NAME,
      country: target.country,
      league: target.league,
    });

    const response = await fetchJsonStrict<InitialReadingMasterCsvResponse>(`/v1/api/admin/master/initial/csv?${params.toString()}`);
    return response.countryLeagueMasterEntityList ?? [];
  }, []);

  const updateEditedRowsApi = useCallback(async (rowsToUpdate: CountryLeagueMasterEntity[]) => {
    const body: InitialReadingMasterCsvUpdateRowRequest = {
      masterName: MASTER_NAME,
      masterEntities: rowsToUpdate,
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

  const deleteSelectedRowsApi = useCallback(async (rowsToDelete: CountryLeagueMasterEntity[]) => {
    const body: InitialReadingMasterCsvDeleteTargetRequest = {
      masterName: MASTER_NAME,
      masterEntities: rowsToDelete,
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
      setInfoMessage(null);
      setNewRowsError(null);
      setNewRows([]);
      setEditingCell(null);
      setEditingValue("");
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

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const data = await fetchJsonStrict<CountryLeagueDTO[]>("/v1/api/country-league-master");
      const nextRows = Array.isArray(data) ? data : [];

      setRows(nextRows);
      setCurrentCountryLeaguePage(0);

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
      setCurrentCountryLeaguePage(0);
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

  const filteredRows = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((row) => [row.country, row.league, row.team, row.delFlg].map((v) => String(v ?? "").toLowerCase()).some((v) => v.includes(q)));
  }, [rows, keyword]);

  const countryLeaguePages = useMemo(() => {
    const pageMap = new Map<string, { country: string; league: string; items: CountryLeagueDTO[] }>();

    filteredRows.forEach((row) => {
      const country = (row.country ?? "").trim() || "未設定国";
      const league = (row.league ?? "").trim() || "未設定リーグ";
      const key = `${country}___${league}`;

      const current = pageMap.get(key);
      if (current) {
        current.items.push(row);
        return;
      }

      pageMap.set(key, { country, league, items: [row] });
    });

    return Array.from(pageMap.values());
  }, [filteredRows]);

  useEffect(() => {
    if (countryLeaguePages.length === 0) {
      if (currentCountryLeaguePage !== 0) setCurrentCountryLeaguePage(0);
      return;
    }

    if (currentCountryLeaguePage > countryLeaguePages.length - 1) {
      setCurrentCountryLeaguePage(0);
    }
  }, [countryLeaguePages, currentCountryLeaguePage]);

  const currentPageData = countryLeaguePages[currentCountryLeaguePage];
  const currentRows = currentPageData?.items ?? [];
  const currentCountryName = currentPageData?.country ?? "-";
  const currentLeagueName = currentPageData?.league ?? "-";
  const totalCountryLeaguePages = countryLeaguePages.length;

  const startEdit = (rowIndex: number, field: keyof CountryLeagueMasterEntity, currentValue: unknown) => {
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
    return rowsWithPendingEdit.every((row) => selectedDeleteKeys.includes(masterRowDeleteKey(row)));
  }, [rowsWithPendingEdit, selectedDeleteKeys]);

  const toggleSelectRow = (key: string) => {
    setSelectedDeleteKeys((prev) => (prev.includes(key) ? prev.filter((v) => v !== key) : [...prev, key]));
  };

  const toggleSelectAllRows = () => {
    if (allModalRowsSelected) {
      setSelectedDeleteKeys([]);
      return;
    }

    setSelectedDeleteKeys(rowsWithPendingEdit.map((row) => masterRowDeleteKey(row)));
  };

  const handleDeleteSelected = useCallback(async () => {
    if (busy) return;

    const deleteTargets = rowsWithPendingEdit.filter((row) => selectedDeleteKeys.includes(masterRowDeleteKey(row)));

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

      const deleteKeySet = new Set(deleteTargets.map((row) => masterRowDeleteKey(row)));
      const remainingRows = rowsWithPendingEdit.filter((row) => !deleteKeySet.has(masterRowDeleteKey(row)));
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

  const handleOk = useCallback(async () => {
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

      const targets = uniqueTargetsFromRows(rowsToSubmit);
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

  /* ----- 一覧の列 ----- */
  const listColumns: ConsoleColumn<CountryLeagueDTO>[] = [
    { key: "no", header: "No", mono: true, align: "right", cell: (_r, i) => <span className="text-gray-500">{i + 1}</span> },
    { key: "country", header: "country", cell: (r) => toDisplay(r.country) },
    { key: "league", header: "league", cell: (r) => toDisplay(r.league) },
    { key: "team", header: "team", className: "max-w-[260px] truncate", cell: (r) => <span title={toDisplay(r.team)}>{toDisplay(r.team)}</span> },
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
  const modalColumns: ConsoleColumn<CountryLeagueMasterEntity>[] = [
    {
      key: "check",
      header: <input type="checkbox" checked={allModalRowsSelected} onChange={toggleSelectAllRows} disabled={busy || rowsWithPendingEdit.length === 0} className="accent-red-600" aria-label="すべて選択" />,
      align: "center",
      cell: (row) => {
        const key = masterRowDeleteKey(row);
        return <input type="checkbox" checked={selectedDeleteKeys.includes(key)} onChange={() => toggleSelectRow(key)} disabled={busy} className="accent-red-600" aria-label="削除対象として選択" />;
      },
    },
    { key: "no", header: "No", mono: true, align: "right", cell: (_r, i) => <span className="text-gray-500">{i + 1}</span> },
    ...EDIT_FIELDS.map<ConsoleColumn<CountryLeagueMasterEntity>>((field) => ({
      key: String(field),
      header: String(field),
      cell: (row, rowIndex) => (
        <ClickEditCell
          value={row[field]}
          editing={editingCell?.rowIndex === rowIndex && editingCell?.field === field}
          editingValue={editingValue}
          onStart={() => startEdit(rowIndex, field, row[field])}
          onChange={setEditingValue}
          onCommit={commitEdit}
          onCancel={cancelEdit}
          disabled={busy}
        />
      ),
    })),
  ];

  const pageNo = totalCountryLeaguePages === 0 ? 0 : currentCountryLeaguePage + 1;

  return (
    <div>
      <ConsoleToolbar
        title="country_league_master 確認"
        info="全件を一括取得し、国＋リーグごとにページを分けて表示"
        description="このページを開くと、最初の国リーグの新規登録データを確認するモーダルを自動で表示します。"
      >
        <ConsoleInput
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setCurrentCountryLeaguePage(0);
          }}
          placeholder="country / league / team / delFlg で絞り込み"
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
          { label: "国", value: currentCountryName },
          { label: "リーグ", value: currentLeagueName },
          { label: "国リーグ", value: `${pageNo} / ${totalCountryLeaguePages}` },
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
        rows={currentRows}
        rowKey={(r, i) => `${r.country}-${r.league}-${r.team}-${i}`}
        loading={loading}
        emptyText="表示できるデータがありません。"
        footer={
          <>
            <span>
              <b className="text-gray-900">
                {currentCountryName} / {currentLeagueName}
              </b>
              <span className="ml-2 tabular-nums">
                {pageNo} / {totalCountryLeaguePages} 国リーグ・{currentRows.length}件
              </span>
            </span>
            <div className="flex gap-1.5">
              <ConsoleButton size="sm" onClick={() => setCurrentCountryLeaguePage((prev) => Math.max(prev - 1, 0))} disabled={currentCountryLeaguePage <= 0}>
                <ChevronLeft className="h-3.5 w-3.5" />
                前の国リーグ
              </ConsoleButton>
              <ConsoleButton
                size="sm"
                onClick={() => setCurrentCountryLeaguePage((prev) => Math.min(prev + 1, totalCountryLeaguePages - 1))}
                disabled={currentCountryLeaguePage >= totalCountryLeaguePages - 1 || totalCountryLeaguePages === 0}
              >
                次の国リーグ
                <ChevronRight className="h-3.5 w-3.5" />
              </ConsoleButton>
            </div>
          </>
        }
      />

      <ConsoleModal
        open={modalOpen}
        title="新規リーグデータ確認"
        description="OK を押すと編集内容を更新し、その後 initialFlg を更新します。不要な行は複数選択して削除できます。"
        onClose={closeModal}
        busy={busy}
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
              <ConsoleButton variant="success" onClick={() => void handleOk()} disabled={deletingRows} loading={updatingStatus} className="min-w-[80px]">
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
            rowKey={(row, i) => (row.id != null && row.id !== "" ? row.id : `${row.country}-${row.league}-${row.team}-${i}`)}
            rowClassName={(row) => (selectedDeleteKeys.includes(masterRowDeleteKey(row)) ? "!bg-red-50" : "")}
          />
        )}
      </ConsoleModal>
    </div>
  );
};

export default CountryLeagueMasterPage;
