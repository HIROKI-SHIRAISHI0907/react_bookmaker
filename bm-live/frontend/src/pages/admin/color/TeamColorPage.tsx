import React, { useMemo, useState } from "react";

/** ========= API ========= */
async function postJson<T>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${text ? `: ${text}` : ""}`);
  }
  return res.json();
}

function buildQuery(params: Record<string, any>) {
  const q = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([k, v]) => {
    if (v == null) return;
    const s = String(v).trim();
    if (s === "") return; // 空は送らない（必要なら外してOK）
    q.set(k, s);
  });
  const qs = q.toString();
  return qs ? `?${qs}` : "";
}

async function getJson<T>(url: string, params?: Record<string, any>): Promise<T> {
  const res = await fetch(`${url}${buildQuery(params ?? {})}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${text ? `: ${text}` : ""}`);
  }
  return res.json();
}

/** ========= util ========= */
function normalizeInputValue(v: any) {
  return v == null ? "" : String(v);
}
function toNullableString(v: string) {
  const t = v.trim();
  return t === "" ? null : t;
}

/**
 * 色コードを #RRGGBB に正規化
 * - "" は null
 * - "#abc" -> "#aabbcc"
 * - "aabbcc" -> "#aabbcc"
 * - "#A1B2C3" -> "#a1b2c3"
 */
function normalizeHexColor(raw: string): { ok: true; value: string | null } | { ok: false; reason: string } {
  const s = (raw ?? "").trim();
  if (s === "") return { ok: true, value: null };

  let t = s;
  if (!t.startsWith("#")) t = `#${t}`;

  const m3 = /^#([0-9a-fA-F]{3})$/.exec(t);
  if (m3) {
    const [r, g, b] = m3[1].split("");
    return { ok: true, value: `#${r}${r}${g}${g}${b}${b}`.toLowerCase() };
  }

  const m6 = /^#([0-9a-fA-F]{6})$/.exec(t);
  if (m6) return { ok: true, value: `#${m6[1].toLowerCase()}` };

  return { ok: false, reason: "カラーコードは # + 6桁（例: #1a2b3c）で入力してください" };
}

/** ========= DTO / Request（Javaに合わせて完全一致） ========= */
type TeamColorRow = {
  id: string;
  country: string | null;
  league: string | null;
  team: string | null;
  teamColorMainHex: string | null;
  teamColorSubHex: string | null;
};
type TeamColorRowUi = TeamColorRow & { _dirty: boolean };

type TeamColorCond = {
  country: string;
  league: string;
  team: string;
};

/** ========= UI ========= */
const inputStyle: React.CSSProperties = {
  padding: "8px 10px",
  border: "1px solid #ddd",
  borderRadius: 8,
  width: "100%",
  background: "white",
};
const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: 10,
  borderBottom: "1px solid #eee",
  fontSize: 12,
  color: "#666",
  whiteSpace: "nowrap",
};
const tdStyle: React.CSSProperties = {
  padding: 10,
  borderBottom: "1px solid #f2f2f2",
  verticalAlign: "top",
};

function ColorCell({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const norm = normalizeHexColor(value);
  const valid = norm.ok;
  const pickerValue = valid && norm.value ? norm.value : "#000000";

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type="color"
          value={pickerValue}
          onChange={(e) => onChange(e.target.value)} // 常に #RRGGBB
          style={{ width: 44, height: 34, padding: 0, border: "1px solid #ddd", borderRadius: 8, background: "white" }}
          title="色を選択"
        />
        <div style={{ fontSize: 12, color: valid ? "#111" : "#b91c1c" }}>{valid ? "OK" : "形式不正"}</div>
      </div>

      <input style={inputStyle} value={value} onChange={(e) => onChange(e.target.value)} placeholder="#RRGGBB" />
      {!valid && <div style={{ fontSize: 11, color: "#b91c1c" }}>{norm.ok ? "" : norm.reason}</div>}
    </div>
  );
}

export default function TeamColorPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [cond, setCond] = useState<TeamColorCond>({ country: "", league: "", team: "" });
  const [rows, setRows] = useState<TeamColorRowUi[]>([]);

  const dirtyCount = useMemo(() => rows.filter((r) => r._dirty).length, [rows]);

  async function onSearch() {
    setLoading(true);
    setMessage("");
    try {
      const data = await getJson<TeamColorRow[]>("/v1/api/team-color-master/search", cond);
      setRows(data.map((r) => ({ ...r, _dirty: false })));
      setMessage(`検索結果: ${data.length}件`);
    } catch (e: any) {
      setMessage(e?.message ?? "検索でエラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  async function onFetchAll() {
    setLoading(true);
    setMessage("");
    try {
      const data = await getJson<TeamColorRow[]>("/api/team-color-master");
      setRows(data.map((r) => ({ ...r, _dirty: false })));
      setMessage(`全件取得: ${data.length}件`);
    } catch (e: any) {
      setMessage(e?.message ?? "全件取得でエラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  function updateCell(index: number, key: keyof TeamColorRow, value: string) {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value, _dirty: true } as any;
      return next;
    });
  }

  async function onSaveDirty() {
    setLoading(true);
    setMessage("");
    try {
      const dirty = rows.filter((r) => r._dirty);

      // バリデーション（不正があれば保存中断）
      for (const r of dirty) {
        const main = normalizeHexColor(normalizeInputValue(r.teamColorMainHex));
        if (!main.ok) throw new Error(`[${r.id}] teamColorMainHex: ${main.reason}`);
        const sub = normalizeHexColor(normalizeInputValue(r.teamColorSubHex));
        if (!sub.ok) throw new Error(`[${r.id}] teamColorSubHex: ${sub.reason}`);
      }

      for (const r of dirty) {
        const main = normalizeHexColor(normalizeInputValue(r.teamColorMainHex));
        const sub = normalizeHexColor(normalizeInputValue(r.teamColorSubHex));

        // ★ TeamColorRequest と完全一致
        const body = {
          id: r.id,
          country: toNullableString(normalizeInputValue(r.country)),
          league: toNullableString(normalizeInputValue(r.league)),
          team: toNullableString(normalizeInputValue(r.team)),
          teamColorMainHex: main.ok ? main.value : null, // #RRGGBB or null
          teamColorSubHex: sub.ok ? sub.value : null, // #RRGGBB or null
        };

        await postJson("/v1/api/team-color-master/update", body);
      }

      await onSearch();
      setMessage(`保存完了: ${dirty.length}件`);
    } catch (e: any) {
      setMessage(e?.message ?? "保存でエラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ fontSize: 18, fontWeight: 800 }}>チームカラー設定（DBメンテ）</div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={onSearch} disabled={loading} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #ddd" }}>
          検索
        </button>
        <button onClick={onFetchAll} disabled={loading} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #ddd" }}>
          全件取得
        </button>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={onSaveDirty} disabled={loading || dirtyCount === 0} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #ddd" }}>
            変更分を保存（{dirtyCount}件）
          </button>
        </div>
      </div>

      {message && <div style={{ fontSize: 12, color: "#333", padding: "8px 10px", border: "1px solid #eee", borderRadius: 10 }}>{message}</div>}

      <div style={{ padding: 12, border: "1px solid #eee", borderRadius: 12 }}>
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ fontWeight: 700 }}>検索条件</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>country</div>
              <input style={inputStyle} value={cond.country} onChange={(e) => setCond({ ...cond, country: e.target.value })} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>league</div>
              <input style={inputStyle} value={cond.league} onChange={(e) => setCond({ ...cond, league: e.target.value })} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>team</div>
              <input style={inputStyle} value={cond.team} onChange={(e) => setCond({ ...cond, team: e.target.value })} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ overflowX: "auto", border: "1px solid #eee", borderRadius: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#fafafa" }}>
              <th style={thStyle}>id</th>
              <th style={thStyle}>country</th>
              <th style={thStyle}>league</th>
              <th style={thStyle}>team</th>
              <th style={thStyle}>teamColorMainHex</th>
              <th style={thStyle}>teamColorSubHex</th>
              <th style={thStyle}>changed</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id ?? i}>
                <td style={tdStyle} title={r.id}>
                  {r.id}
                </td>

                <td style={tdStyle}>
                  <input style={inputStyle} value={normalizeInputValue(r.country)} onChange={(e) => updateCell(i, "country", e.target.value)} />
                </td>
                <td style={tdStyle}>
                  <input style={inputStyle} value={normalizeInputValue(r.league)} onChange={(e) => updateCell(i, "league", e.target.value)} />
                </td>
                <td style={tdStyle}>
                  <input style={inputStyle} value={normalizeInputValue(r.team)} onChange={(e) => updateCell(i, "team", e.target.value)} />
                </td>

                <td style={tdStyle}>
                  <ColorCell value={normalizeInputValue(r.teamColorMainHex)} onChange={(v) => updateCell(i, "teamColorMainHex", v)} />
                </td>

                <td style={tdStyle}>
                  <ColorCell value={normalizeInputValue(r.teamColorSubHex)} onChange={(v) => updateCell(i, "teamColorSubHex", v)} />
                </td>

                <td style={{ ...tdStyle, fontSize: 12, color: r._dirty ? "#111" : "#999" }}>{r._dirty ? "●" : "-"}</td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 16, color: "#666", fontSize: 12 }}>
                  検索結果がここに表示されます
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: 12, color: "#666" }}>
        色は <b># + 6桁</b> に正規化して保存します（例: <code>#1a2b3c</code>）。空欄で保存すると <b>NULL</b> 更新です。
      </div>
    </div>
  );
}
