// src/pages/admin/ManualDataTargetPage.tsx
import React, { useEffect, useMemo, useState } from "react";

export type AllLeagueDTO = {
  country: string;
  league: string;
  logicFlg: string; // 送信には使う（表示はしない）
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

const BASE = "/v1/api/all-league-master";

export async function fetchAllLeagueMaster(): Promise<AllLeagueDTO[]> {
  const res = await fetch(BASE, { method: "GET" });
  if (!res.ok) throw new Error(`GET failed: ${res.status}`);
  return res.json();
}

export async function patchAllLeagueMaster(req: AllLeagueRequest): Promise<AllLeagueResponse> {
  const res = await fetch(BASE, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return (await res.json()) as AllLeagueResponse;
}

type SaveState = { type: "idle" } | { type: "saving"; message?: string } | { type: "success"; message?: string } | { type: "error"; message?: string };

type RowKey = string;
const keyOf = (r: Pick<AllLeagueDTO, "country" | "league">): RowKey => `${r.country}__${r.league}`;

/**
 * dispFlg の意味（要件どおり）
 * - checked = true  => dispFlg="0" （スクレイピング対象）
 * - checked = false => dispFlg="1" （対象外）
 */
const isScrapeTarget = (dispFlg: string) => dispFlg === "0";
const dispFlgFromChecked = (checked: boolean) => (checked ? "0" : "1");

export default function ManualDataTargetPage() {
  const [rows, setRows] = useState<AllLeagueDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [saveState, setSaveState] = useState<SaveState>({ type: "idle" });

  // 初期値（変更検知用）
  const [initialMap, setInitialMap] = useState<Record<RowKey, { logicFlg: string; dispFlg: string }>>({});

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const list = await fetchAllLeagueMaster();
        setRows(list);

        const m: Record<RowKey, { logicFlg: string; dispFlg: string }> = {};
        for (const r of list) m[keyOf(r)] = { logicFlg: r.logicFlg, dispFlg: r.dispFlg };
        setInitialMap(m);
      } catch (e: any) {
        setErr(e?.message ?? "一覧取得に失敗しました");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => `${r.country} ${r.league}`.toLowerCase().includes(s));
  }, [rows, q]);

  const changedCount = useMemo(() => {
    let cnt = 0;
    for (const r of rows) {
      const init = initialMap[keyOf(r)];
      if (!init) continue;
      if (r.logicFlg !== init.logicFlg || r.dispFlg !== init.dispFlg) cnt++;
    }
    return cnt;
  }, [rows, initialMap]);

  const setRowChecked = (row: AllLeagueDTO, checked: boolean) => {
    const k = keyOf(row);
    const nextDisp = dispFlgFromChecked(checked);

    setRows((prev) => prev.map((x) => (keyOf(x) === k ? { ...x, dispFlg: nextDisp } : x)));
  };

  // ★ここを saveAll の外に出す（表示中=filtered にだけ適用）
  const setAllVisible = (checked: boolean) => {
    const targetKeys = new Set(filtered.map((r) => keyOf(r)));
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
          logicFlg: r.logicFlg, // 画面では編集しないが、API必須なら送る
          dispFlg: r.dispFlg,
        });

        if (res.responseCode !== "200") {
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

    // 成功したら初期値を更新（変更点リセット）
    const m: Record<RowKey, { logicFlg: string; dispFlg: string }> = {};
    for (const r of rows) m[keyOf(r)] = { logicFlg: r.logicFlg, dispFlg: r.dispFlg };
    setInitialMap(m);

    setSaveState({ type: "success", message: `保存しました (${changed.length}件)` });
    setTimeout(() => setSaveState({ type: "idle" }), 1200);
  };

  if (loading) return <div>読み込み中...</div>;
  if (err) return <div style={{ color: "crimson" }}>Error: {err}</div>;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <h2 style={{ margin: 0 }}>スクレイピング対象データ設定</h2>
        <div style={{ fontSize: 12, color: "#666" }}>チェックあり＝対象（dispFlg=0） / チェックなし＝対象外（dispFlg=1）</div>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="国 / リーグで検索"
          style={{
            padding: "8px 10px",
            border: "1px solid #ddd",
            borderRadius: 8,
            width: 320,
          }}
        />

        <div style={{ fontSize: 12, color: "#555" }}>
          表示件数: {filtered.length} / 全{rows.length}（変更: {changedCount}）
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => setAllVisible(true)} style={btnGhost} disabled={filtered.length === 0} title="表示中をすべて対象にする">
            全チェック
          </button>

          <button onClick={() => setAllVisible(false)} style={btnGhost} disabled={filtered.length === 0} title="表示中をすべて対象外にする">
            全チェック外し
          </button>

          <button onClick={saveAll} style={btnPrimary} disabled={saveState.type === "saving" || changedCount === 0} title={changedCount === 0 ? "変更がありません" : "変更分をまとめて保存します"}>
            まとめて保存
          </button>

          <div style={{ fontSize: 12, marginLeft: 8 }}>
            {saveState.type === "saving" && <span>保存中… {saveState.message}</span>}
            {saveState.type === "success" && <span style={{ color: "green" }}>{saveState.message}</span>}
            {saveState.type === "error" && <span style={{ color: "crimson" }}>{saveState.message}</span>}
          </div>
        </div>
      </div>

      <div style={{ overflowX: "auto", border: "1px solid #eee", borderRadius: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#fafafa" }}>
              <th style={th}>国</th>
              <th style={th}>リーグ</th>
              <th style={th}>スクレイピング対象</th>
              <th style={th}>状態</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((r) => {
              const k = keyOf(r);
              const init = initialMap[k];
              const dirty = init ? r.dispFlg !== init.dispFlg : false;

              return (
                <tr key={k}>
                  <td style={td}>{r.country}</td>
                  <td style={td}>{r.league}</td>

                  <td style={td}>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <input type="checkbox" checked={isScrapeTarget(r.dispFlg)} onChange={(e) => setRowChecked(r, e.target.checked)} />
                      <span style={{ fontSize: 12, color: "#333" }}>{isScrapeTarget(r.dispFlg) ? "対象" : "対象外"}</span>
                    </label>
                  </td>

                  <td style={td}>{dirty ? <span style={{ fontSize: 12, color: "#b45309" }}>未保存</span> : <span style={{ fontSize: 12, color: "#666" }}>保存済み</span>}</td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td style={{ padding: 14, color: "#666" }} colSpan={4}>
                  該当データがありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: 12, color: "#666", lineHeight: 1.6 }}>
        ※ 検索してもチェック状態は保持されます（状態は rows に保持しているため）。
        <br />
        ※ 保存は「変更があった行だけ」送信します。
        <br />※ API仕様上 `logicFlg` が必須なら送っています（画面では編集しません）。
      </div>
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  padding: 12,
  fontSize: 12,
  color: "#444",
  borderBottom: "1px solid #eee",
  whiteSpace: "nowrap",
};

const td: React.CSSProperties = {
  padding: 12,
  borderBottom: "1px solid #f0f0f0",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
};

const btnPrimary: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: 10,
  border: "1px solid #ddd",
  background: "#111827",
  color: "white",
  cursor: "pointer",
};

const btnGhost: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "white",
  cursor: "pointer",
};
