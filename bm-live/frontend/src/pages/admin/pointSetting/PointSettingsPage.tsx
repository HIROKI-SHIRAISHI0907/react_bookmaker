import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw, RotateCcw, Save, Trash2 } from "lucide-react";
import { fetchPointSettings, isValidRemarks, normalizeRemarks, savePointSettings, type PointSettingEntity, type PointSettingItem } from "../../../api/adminPointSettings";
import { ConsoleButton, ConsoleCellInput, ConsoleColumn, ConsoleField, ConsoleInput, ConsoleNotice, ConsoleTable, ConsoleToolbar, StatChips, StatusBadge } from "../../../api/commonAdminDesign";

type EditableRow = {
  rowId: string;
  id?: string;
  country: string;
  league: string;
  win: string;
  lose: string;
  draw: string;
  remarks: string;
  delFlg: "0" | "1";
  isNew: boolean;
};

function createRowId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function toEditableRow(entity: PointSettingEntity): EditableRow {
  return {
    rowId: createRowId(),
    id: entity.id,
    country: entity.country ?? "",
    league: entity.league ?? "",
    win: entity.win == null ? "" : String(entity.win),
    lose: entity.lose == null ? "" : String(entity.lose),
    draw: entity.draw == null ? "" : String(entity.draw),
    remarks: entity.remarks ?? "",
    delFlg: entity.delFlg === "1" ? "1" : "0",
    isNew: false,
  };
}

function createEmptyRow(): EditableRow {
  return {
    rowId: createRowId(),
    country: "",
    league: "",
    win: "",
    lose: "",
    draw: "",
    remarks: "",
    delFlg: "0",
    isNew: true,
  };
}

function parseNumber(value: string): number | null {
  const text = value.trim();
  if (!text) return null;
  const num = Number(text);
  if (!Number.isFinite(num)) return null;
  return Math.trunc(num);
}

function buildBusinessKey(row: EditableRow): string {
  return [row.country.trim().toLowerCase(), row.league.trim().toLowerCase(), normalizeRemarks(row.remarks).toLowerCase()].join("||");
}

function validateRows(rows: EditableRow[]): string[] {
  const errors: string[] = [];
  const keySet = new Set<string>();

  rows.forEach((row, index) => {
    if (row.delFlg === "1") return;

    const rowNo = index + 1;
    const country = row.country.trim();
    const league = row.league.trim();
    const remarks = normalizeRemarks(row.remarks);

    if (!country) {
      errors.push(`${rowNo}行目: 国は必須です`);
    }

    if (!league) {
      errors.push(`${rowNo}行目: リーグは必須です`);
    }

    const win = parseNumber(row.win);
    const lose = parseNumber(row.lose);
    const draw = parseNumber(row.draw);

    if (win == null || win < 0) {
      errors.push(`${rowNo}行目: 勝ちは0以上の整数で入力してください`);
    }
    if (lose == null || lose < 0) {
      errors.push(`${rowNo}行目: 負けは0以上の整数で入力してください`);
    }
    if (draw == null || draw < 0) {
      errors.push(`${rowNo}行目: 引き分けは0以上の整数で入力してください`);
    }

    if (!isValidRemarks(remarks)) {
      errors.push(`${rowNo}行目: 備考は「PK勝ち=数値,PK負け=数値」の形式で入力してください`);
    }

    const key = buildBusinessKey(row);
    if (country && league) {
      if (keySet.has(key)) {
        errors.push(`${rowNo}行目: 同じ 国・リーグ・備考 の行が重複しています`);
      } else {
        keySet.add(key);
      }
    }
  });

  return errors;
}

export default function PointSettingsPage() {
  const queryClient = useQueryClient();

  const [rows, setRows] = useState<EditableRow[]>([]);
  const [filterCountry, setFilterCountry] = useState("");
  const [filterLeague, setFilterLeague] = useState("");
  const [localErrors, setLocalErrors] = useState<string[]>([]);
  const [saveMessage, setSaveMessage] = useState("");

  const {
    data = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["admin-point-settings"],
    queryFn: fetchPointSettings,
  });

  useEffect(() => {
    setRows(data.map(toEditableRow));
  }, [data]);

  const mutation = useMutation({
    mutationFn: savePointSettings,
    onSuccess: async () => {
      setSaveMessage("保存しました");
      setLocalErrors([]);
      await queryClient.invalidateQueries({ queryKey: ["admin-point-settings"] });
    },
    onError: (err: unknown) => {
      setSaveMessage("");
      setLocalErrors([err instanceof Error ? err.message : "保存中にエラーが発生しました"]);
    },
  });

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const hitCountry = !filterCountry.trim() || row.country.toLowerCase().includes(filterCountry.trim().toLowerCase());
      const hitLeague = !filterLeague.trim() || row.league.toLowerCase().includes(filterLeague.trim().toLowerCase());
      return hitCountry && hitLeague;
    });
  }, [rows, filterCountry, filterLeague]);

  const counts = useMemo(
    () => ({
      newCount: rows.filter((r) => r.isNew).length,
      deleteCount: rows.filter((r) => r.delFlg === "1").length,
    }),
    [rows],
  );

  const updateRow = (rowId: string, key: keyof EditableRow, value: string) => {
    setRows((prev) => prev.map((row) => (row.rowId === rowId ? { ...row, [key]: value } : row)));
  };

  const addRow = () => {
    setSaveMessage("");
    setLocalErrors([]);
    setRows((prev) => [...prev, createEmptyRow()]);
  };

  const markDelete = (rowId: string) => {
    setSaveMessage("");
    setLocalErrors([]);
    setRows((prev) =>
      prev.flatMap((row) => {
        if (row.rowId !== rowId) return [row];
        if (row.isNew) return [];
        return [{ ...row, delFlg: "1" }];
      }),
    );
  };

  const restoreRow = (rowId: string) => {
    setSaveMessage("");
    setLocalErrors([]);
    setRows((prev) => prev.map((row) => (row.rowId === rowId ? { ...row, delFlg: "0" } : row)));
  };

  const handleSave = async () => {
    setSaveMessage("");

    const errors = validateRows(rows);
    if (errors.length > 0) {
      setLocalErrors(errors);
      return;
    }

    setLocalErrors([]);

    const items: PointSettingItem[] = rows.map((row) => ({
      country: row.country.trim(),
      league: row.league.trim(),
      win: parseNumber(row.win),
      lose: parseNumber(row.lose),
      draw: parseNumber(row.draw),
      remarks: normalizeRemarks(row.remarks),
      delFlg: row.delFlg,
    }));

    await mutation.mutateAsync({ items });
  };

  /** 文字の入力欄（既存行のキー項目は編集不可） */
  const textCol = (key: "country" | "league" | "remarks", header: string, opts: { keyLocked: boolean; placeholder?: string; minWidth?: string }): ConsoleColumn<EditableRow> => ({
    key,
    header,
    className: "py-1",
    cell: (row) => {
      const locked = opts.keyLocked && !row.isNew;
      return (
        <ConsoleCellInput
          value={row[key]}
          disabled={locked || row.delFlg === "1"}
          onChange={(e) => updateRow(row.rowId, key, e.target.value)}
          placeholder={opts.placeholder}
          className={`${opts.minWidth ?? "min-w-[120px]"} ${locked ? "!border-transparent !bg-transparent text-gray-700" : ""}`}
        />
      );
    },
  });

  /** 勝ち点の入力欄 */
  const numCol = (key: "win" | "lose" | "draw", header: string): ConsoleColumn<EditableRow> => ({
    key,
    header,
    align: "right",
    className: "py-1",
    cell: (row) => (
      <ConsoleCellInput
        value={row[key]}
        inputMode="numeric"
        disabled={row.delFlg === "1"}
        onChange={(e) => updateRow(row.rowId, key, e.target.value)}
        className="!min-w-[64px] w-16 text-right font-mono tabular-nums"
      />
    ),
  });

  const columns: ConsoleColumn<EditableRow>[] = [
    textCol("country", "国", { keyLocked: true }),
    textCol("league", "リーグ", { keyLocked: true }),
    numCol("win", "勝ち点(勝)"),
    numCol("lose", "勝ち点(負)"),
    numCol("draw", "勝ち点(引分)"),
    textCol("remarks", "備考", { keyLocked: true, placeholder: "PK勝ち=2,PK負け=1", minWidth: "min-w-[180px]" }),
    {
      key: "state",
      header: "状態",
      cell: (row) => (row.delFlg === "1" ? <StatusBadge tone="ng">削除予定</StatusBadge> : row.isNew ? <StatusBadge tone="info">新規</StatusBadge> : <StatusBadge tone="neutral">既存</StatusBadge>),
    },
    {
      key: "ops",
      header: "操作",
      align: "right",
      cell: (row) =>
        row.delFlg === "1" ? (
          <ConsoleButton size="sm" onClick={() => restoreRow(row.rowId)}>
            <RotateCcw className="h-3 w-3" />
            削除取り消し
          </ConsoleButton>
        ) : (
          <ConsoleButton size="sm" variant="ghost" className="hover:!bg-red-50 hover:!text-red-700" onClick={() => markDelete(row.rowId)}>
            <Trash2 className="h-3 w-3" />
            削除
          </ConsoleButton>
        ),
    },
  ];

  return (
    <div>
      <ConsoleToolbar
        title="リーグ勝ち点情報反映設定"
        info="国・リーグごとの勝ち点"
        description={
          <>
            備考は空欄か、<b>PK勝ち=数値,PK負け=数値</b> の形式で入力してください。既存行の 国・リーグ・備考 は更新キーのため編集できません。
          </>
        }
      >
        <ConsoleButton onClick={() => void refetch()} loading={isFetching && !isLoading}>
          {!(isFetching && !isLoading) && <RefreshCw className="h-3.5 w-3.5" />}
          再取得
        </ConsoleButton>
        <ConsoleButton onClick={addRow} disabled={isLoading || isError}>
          <Plus className="h-3.5 w-3.5" />
          行追加
        </ConsoleButton>
        <ConsoleButton variant="primary" onClick={() => void handleSave()} disabled={isLoading || isError} loading={mutation.isPending}>
          {!mutation.isPending && <Save className="h-3.5 w-3.5" />}
          {mutation.isPending ? "保存中…" : "保存"}
        </ConsoleButton>
      </ConsoleToolbar>

      {saveMessage && <ConsoleNotice tone="ok" title={saveMessage} onClose={() => setSaveMessage("")} />}
      {localErrors.length > 0 && (
        <ConsoleNotice tone="ng" title="入力エラー" onClose={() => setLocalErrors([])}>
          {localErrors.map((msg) => `・${msg}`).join("\n")}
        </ConsoleNotice>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <StatChips
          loading={isLoading}
          items={[
            { label: "全件", value: rows.length },
            { label: "表示中", value: filteredRows.length },
            { label: "新規", value: counts.newCount, tone: counts.newCount > 0 ? "info" : "default" },
            { label: "削除予定", value: counts.deleteCount, tone: counts.deleteCount > 0 ? "ng" : "default" },
          ]}
        />
        <div className="mb-2.5 ml-auto flex flex-wrap items-end gap-2">
          <ConsoleField label="国で絞り込み">
            <ConsoleInput value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)} placeholder="例: 日本" className="w-44" />
          </ConsoleField>
          <ConsoleField label="リーグで絞り込み">
            <ConsoleInput value={filterLeague} onChange={(e) => setFilterLeague(e.target.value)} placeholder="例: J1" className="w-44" />
          </ConsoleField>
        </div>
      </div>

      <ConsoleTable
        columns={columns}
        rows={filteredRows}
        rowKey={(row) => row.rowId}
        loading={isLoading}
        error={isError ? (error instanceof Error ? error.message : "取得に失敗しました") : undefined}
        emptyText="データがありません"
        plain
        rowClassName={(row) => (row.delFlg === "1" ? "bg-red-50/60 opacity-70" : row.isNew ? "bg-indigo-50/40" : "")}
        maxHeight="calc(100vh - 260px)"
      />
    </div>
  );
}
