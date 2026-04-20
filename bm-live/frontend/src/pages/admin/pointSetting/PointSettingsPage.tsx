import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPointSettings, isValidRemarks, normalizeRemarks, savePointSettings, type PointSettingEntity, type PointSettingItem } from "../../../api/adminPointSettings";

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

  if (isLoading) {
    return (
      <div style={{ padding: 24 }}>
        <h1>勝ち点設定</h1>
        <p>読み込み中です...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ padding: 24 }}>
        <h1>勝ち点設定</h1>
        <p style={{ color: "crimson" }}>{error instanceof Error ? error.message : "取得に失敗しました"}</p>
        <button onClick={() => refetch()}>再読み込み</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, display: "grid", gap: 16 }}>
      <div>
        <h1 style={{ marginBottom: 8 }}>勝ち点設定</h1>
        <p style={{ margin: 0, color: "#555" }}>
          備考は空欄か、<strong>PK勝ち=数値,PK負け=数値</strong> の形式で入力してください。 既存行の 国・リーグ・備考 は更新キーのため編集不可にしています。
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "end",
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 16,
          background: "#fafafa",
        }}
      >
        <div style={{ display: "grid", gap: 6 }}>
          <label htmlFor="filter-country">国フィルタ</label>
          <input id="filter-country" value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)} placeholder="例: 日本" style={{ minWidth: 220, padding: 8 }} />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label htmlFor="filter-league">リーグフィルタ</label>
          <input id="filter-league" value={filterLeague} onChange={(e) => setFilterLeague(e.target.value)} placeholder="例: J1" style={{ minWidth: 220, padding: 8 }} />
        </div>

        <button onClick={addRow} style={{ padding: "10px 16px" }}>
          行追加
        </button>

        <button
          onClick={handleSave}
          disabled={mutation.isPending}
          style={{
            padding: "10px 16px",
            background: "#0b5fff",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          {mutation.isPending ? "保存中..." : "保存"}
        </button>

        <button onClick={() => refetch()} style={{ padding: "10px 16px" }}>
          再取得
        </button>
      </div>

      {saveMessage ? (
        <div
          style={{
            border: "1px solid #b7eb8f",
            background: "#f6ffed",
            color: "#135200",
            padding: 12,
            borderRadius: 8,
          }}
        >
          {saveMessage}
        </div>
      ) : null}

      {localErrors.length > 0 ? (
        <div
          style={{
            border: "1px solid #ffccc7",
            background: "#fff2f0",
            color: "#a8071a",
            padding: 12,
            borderRadius: 8,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8 }}>入力エラー</div>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {localErrors.map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div style={{ overflowX: "auto", border: "1px solid #ddd", borderRadius: 8 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1100 }}>
          <thead>
            <tr style={{ background: "#f5f5f5" }}>
              <th style={thStyle}>国</th>
              <th style={thStyle}>リーグ</th>
              <th style={thStyle}>勝ち点(勝)</th>
              <th style={thStyle}>勝ち点(負)</th>
              <th style={thStyle}>勝ち点(引分)</th>
              <th style={thStyle}>備考</th>
              <th style={thStyle}>状態</th>
              <th style={thStyle}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: 24, textAlign: "center", color: "#666" }}>
                  データがありません
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => {
                const deleted = row.delFlg === "1";
                const keyLocked = !row.isNew;

                return (
                  <tr
                    key={row.rowId}
                    style={{
                      background: deleted ? "#fff1f0" : "#fff",
                      opacity: deleted ? 0.7 : 1,
                    }}
                  >
                    <td style={tdStyle}>
                      <input
                        value={row.country}
                        disabled={keyLocked}
                        onChange={(e) => updateRow(row.rowId, "country", e.target.value)}
                        style={{ ...inputStyle, background: keyLocked ? "#f5f5f5" : "#fff" }}
                      />
                    </td>
                    <td style={tdStyle}>
                      <input
                        value={row.league}
                        disabled={keyLocked}
                        onChange={(e) => updateRow(row.rowId, "league", e.target.value)}
                        style={{ ...inputStyle, background: keyLocked ? "#f5f5f5" : "#fff" }}
                      />
                    </td>
                    <td style={tdStyle}>
                      <input value={row.win} onChange={(e) => updateRow(row.rowId, "win", e.target.value)} style={inputStyle} inputMode="numeric" />
                    </td>
                    <td style={tdStyle}>
                      <input value={row.lose} onChange={(e) => updateRow(row.rowId, "lose", e.target.value)} style={inputStyle} inputMode="numeric" />
                    </td>
                    <td style={tdStyle}>
                      <input value={row.draw} onChange={(e) => updateRow(row.rowId, "draw", e.target.value)} style={inputStyle} inputMode="numeric" />
                    </td>
                    <td style={tdStyle}>
                      <input
                        value={row.remarks}
                        disabled={keyLocked}
                        onChange={(e) => updateRow(row.rowId, "remarks", e.target.value)}
                        placeholder="PK勝ち=2,PK負け=1"
                        style={{ ...inputStyle, background: keyLocked ? "#f5f5f5" : "#fff" }}
                      />
                    </td>
                    <td style={tdStyle}>
                      {deleted ? <span style={deletedBadgeStyle}>削除予定</span> : row.isNew ? <span style={newBadgeStyle}>新規</span> : <span style={normalBadgeStyle}>既存</span>}
                    </td>
                    <td style={tdStyle}>{deleted ? <button onClick={() => restoreRow(row.rowId)}>削除取り消し</button> : <button onClick={() => markDelete(row.rowId)}>削除</button>}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px 10px",
  borderBottom: "1px solid #ddd",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "10px",
  borderBottom: "1px solid #eee",
  verticalAlign: "top",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 120,
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #ccc",
  boxSizing: "border-box",
};

const newBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "4px 8px",
  borderRadius: 999,
  background: "#e6f4ff",
  color: "#0958d9",
  fontSize: 12,
  fontWeight: 700,
};

const normalBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "4px 8px",
  borderRadius: 999,
  background: "#f5f5f5",
  color: "#595959",
  fontSize: 12,
  fontWeight: 700,
};

const deletedBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "4px 8px",
  borderRadius: 999,
  background: "#fff1f0",
  color: "#cf1322",
  fontSize: 12,
  fontWeight: 700,
};
