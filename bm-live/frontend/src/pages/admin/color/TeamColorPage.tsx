import React, { useMemo, useState, useEffect } from "react";

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
    if (s === "") return;
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

/** ========= UTILS ========= */
function normalizeInputValue(v: any) {
  return v == null ? "" : String(v);
}
function toNullableString(v: string) {
  const t = v.trim();
  return t === "" ? null : t;
}

/**
 * 色コードを #RRGGBB に正規化
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

/** ========= DTO / Request ========= */
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

/** ========= UI COMPONENTS ========= */

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}>{children}</div>;

const Button = ({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  icon,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "success" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}) => {
  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white border-blue-600",
    secondary: "bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200",
    success: "bg-green-600 hover:bg-green-700 text-white border-green-600",
    danger: "bg-red-600 hover:bg-red-700 text-white border-red-600",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 rounded-lg border font-medium
        transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50
        disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2
        focus:ring-blue-500 ${sizeClasses[size]} ${variantClasses[variant]}
      `}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {icon && !loading && icon}
      {children}
    </button>
  );
};

const Input = ({
  label,
  value,
  onChange,
  placeholder = "",
  error = "",
  className = "",
  onKeyPress,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  className?: string;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyPress={onKeyPress}
      placeholder={placeholder}
      className={`
        w-full px-4 py-3 border rounded-lg transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        ${error ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-gray-300"}
      `}
    />
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

const ColorCell = ({ value, onChange, label }: { value: string; onChange: (next: string) => void; label: string }) => {
  const [inputValue, setInputValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const norm = normalizeHexColor(inputValue);
  const valid = norm.ok;
  const pickerValue = valid && norm.value ? norm.value : "#000000";
  const swatchColor = valid && norm.value ? norm.value : "#e5e7eb";

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onChange(newValue);
  };

  const handleColorPickerChange = (color: string) => {
    setInputValue(color);
    onChange(color);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-xl border-2 border-gray-200 shadow-inner cursor-pointer transition-transform hover:scale-105" style={{ backgroundColor: swatchColor }}>
            <input type="color" value={pickerValue} onChange={(e) => handleColorPickerChange(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" title="色を選択" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: pickerValue }} />
          </div>
        </div>

        <div className="flex-1">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="#RRGGBB"
            className={`
              w-full px-3 py-2 border rounded-lg transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              ${valid ? "border-gray-200 hover:border-gray-300" : "border-red-300 bg-red-50"}
              ${isFocused ? "ring-2 ring-blue-500 border-transparent" : ""}
            `}
          />
          {!valid && <p className="mt-1 text-xs text-red-600">{norm.reason}</p>}
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ count }: { count: number }) => (
  <div
    className={`
    inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
    ${count > 0 ? "bg-yellow-100 text-yellow-800 border border-yellow-200" : "bg-gray-100 text-gray-600 border border-gray-200"}
  `}
  >
    {count > 0 ? (
      <>
        <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse" />
        変更あり {count}件
      </>
    ) : (
      "変更なし"
    )}
  </div>
);

const Alert = ({ message, type = "info", onClose }: { message: string; type?: "info" | "success" | "error" | "warning"; onClose?: () => void }) => {
  const typeClasses = {
    info: "bg-blue-50 border-blue-200 text-blue-800",
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  };

  const icons = {
    info: "💡",
    success: "✅",
    error: "❌",
    warning: "⚠️",
  };

  return (
    <div
      className={`
      border rounded-lg p-4 flex items-start gap-3 relative
      ${typeClasses[type]}
    `}
    >
      <span className="text-lg">{icons[type]}</span>
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
      </div>
      {onClose && (
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          ✕
        </button>
      )}
    </div>
  );
};

const DataTable = ({ rows, onCellUpdate }: { rows: TeamColorRowUi[]; onCellUpdate: (index: number, key: keyof TeamColorRow, value: string) => void }) => {
  if (rows.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📋</div>
        <p className="text-gray-500 text-lg">検索結果がここに表示されます</p>
        <p className="text-gray-400 text-sm mt-2">条件を入力して検索ボタンをクリックしてください</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">ID</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Country</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">League</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Team</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Main Color</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Sub Color</th>
            <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.id}
              className={`
                border-b border-gray-100 transition-colors duration-150
                ${row._dirty ? "bg-yellow-50 border-yellow-200" : "hover:bg-gray-50"}
              `}
            >
              <td className="px-6 py-4">
                <div className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">{row.id}</div>
              </td>
              <td className="px-6 py-4">
                <input
                  type="text"
                  value={normalizeInputValue(row.country)}
                  onChange={(e) => onCellUpdate(index, "country", e.target.value)}
                  className={`
                    w-full px-3 py-2 border rounded-lg transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${row._dirty ? "border-yellow-300 bg-yellow-50" : "border-gray-200 hover:border-gray-300"}
                  `}
                />
              </td>
              <td className="px-6 py-4">
                <input
                  type="text"
                  value={normalizeInputValue(row.league)}
                  onChange={(e) => onCellUpdate(index, "league", e.target.value)}
                  className={`
                    w-full px-3 py-2 border rounded-lg transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${row._dirty ? "border-yellow-300 bg-yellow-50" : "border-gray-200 hover:border-gray-300"}
                  `}
                />
              </td>
              <td className="px-6 py-4">
                <input
                  type="text"
                  value={normalizeInputValue(row.team)}
                  onChange={(e) => onCellUpdate(index, "team", e.target.value)}
                  className={`
                    w-full px-3 py-2 border rounded-lg transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${row._dirty ? "border-yellow-300 bg-yellow-50" : "border-gray-200 hover:border-gray-300"}
                  `}
                />
              </td>
              <td className="px-6 py-4">
                <ColorCell value={normalizeInputValue(row.teamColorMainHex)} onChange={(value) => onCellUpdate(index, "teamColorMainHex", value)} label="" />
              </td>
              <td className="px-6 py-4">
                <ColorCell value={normalizeInputValue(row.teamColorSubHex)} onChange={(value) => onCellUpdate(index, "teamColorSubHex", value)} label="" />
              </td>
              <td className="px-6 py-4 text-center">
                {row._dirty ? (
                  <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mr-1 animate-pulse" />
                    編集中
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm">－</div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/** ========= MAIN PAGE ========= */
export default function TeamColorPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"info" | "success" | "error" | "warning">("info");

  const [cond, setCond] = useState<TeamColorCond>({ country: "", league: "", team: "" });
  const [rows, setRows] = useState<TeamColorRowUi[]>([]);

  const dirtyCount = useMemo(() => rows.filter((r) => r._dirty).length, [rows]);

  const showAlert = (msg: string, type: "info" | "success" | "error" | "warning" = "info") => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 5000);
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter") action();
  };

  async function onSearch() {
    setLoading(true);
    try {
      const data = await getJson<TeamColorRow[]>("/v1/api/team-color-master/search", cond);
      setRows(data.map((r) => ({ ...r, _dirty: false })));
      showAlert(`検索結果: ${data.length}件`, "success");
    } catch (e: any) {
      showAlert(e?.message ?? "検索でエラーが発生しました", "error");
    } finally {
      setLoading(false);
    }
  }

  async function onFetchAll() {
    setLoading(true);
    try {
      const data = await getJson<TeamColorRow[]>("/api/team-color-master");
      setRows(data.map((r) => ({ ...r, _dirty: false })));
      showAlert(`全件取得: ${data.length}件`, "success");
    } catch (e: any) {
      showAlert(e?.message ?? "全件取得でエラーが発生しました", "error");
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
    try {
      const dirty = rows.filter((r) => r._dirty);

      // バリデーション
      for (const r of dirty) {
        const main = normalizeHexColor(normalizeInputValue(r.teamColorMainHex));
        if (!main.ok) throw new Error(`[${r.id}] teamColorMainHex: ${main.reason}`);
        const sub = normalizeHexColor(normalizeInputValue(r.teamColorSubHex));
        if (!sub.ok) throw new Error(`[${r.id}] teamColorSubHex: ${sub.reason}`);
      }

      // 保存
      for (const r of dirty) {
        const main = normalizeHexColor(normalizeInputValue(r.teamColorMainHex));
        const sub = normalizeHexColor(normalizeInputValue(r.teamColorSubHex));

        const body = {
          id: r.id,
          country: toNullableString(normalizeInputValue(r.country)),
          league: toNullableString(normalizeInputValue(r.league)),
          team: toNullableString(normalizeInputValue(r.team)),
          teamColorMainHex: main.ok ? main.value : null,
          teamColorSubHex: sub.ok ? sub.value : null,
        };

        await postJson("/v1/api/team-color-master/update", body);
      }

      await onSearch();
      showAlert(`保存完了: ${dirty.length}件`, "success");
    } catch (e: any) {
      showAlert(e?.message ?? "保存でエラーが発生しました", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-xl shadow-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">チームカラー管理</h1>
              <p className="text-gray-600 mt-1">サッカーチームのカラー設定を管理</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <StatusBadge count={dirtyCount} />
            <Button onClick={onSaveDirty} variant="success" disabled={loading || dirtyCount === 0} loading={loading} icon="💾">
              変更を保存 ({dirtyCount}件)
            </Button>
          </div>
        </div>

        {/* Message Alert */}
        {message && <Alert message={message} type={messageType} onClose={() => setMessage("")} />}

        {/* Search Card */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 p-2 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">検索条件</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Input label="🏳️ Country" value={cond.country} onChange={(value) => setCond({ ...cond, country: value })} placeholder="例: Japan" onKeyPress={(e) => handleKeyPress(e, onSearch)} />
            <Input label="🏆 League" value={cond.league} onChange={(value) => setCond({ ...cond, league: value })} placeholder="例: J1 League" onKeyPress={(e) => handleKeyPress(e, onSearch)} />
            <Input label="👥 Team" value={cond.team} onChange={(value) => setCond({ ...cond, team: value })} placeholder="例: Urawa Reds" onKeyPress={(e) => handleKeyPress(e, onSearch)} />
          </div>

          <div className="flex gap-3">
            <Button onClick={onSearch} loading={loading} icon="🔍">
              検索
            </Button>
            <Button onClick={onFetchAll} variant="secondary" loading={loading} icon="📋">
              全件取得
            </Button>
          </div>
        </Card>

        {/* Data Table Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">チーム一覧</h2>
            </div>
            <div className="text-sm text-gray-500">全 {rows.length} 件</div>
          </div>

          <DataTable rows={rows} onCellUpdate={updateCell} />
        </Card>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>
            色は <span className="font-medium">#RRGGBB</span> 形式に自動正規化されます（例: <code className="bg-gray-100 px-2 py-1 rounded">#1a2b3c</code>）
          </p>
          <p className="mt-1">
            空欄で保存すると <span className="font-medium">NULL</span> として更新されます
          </p>
        </div>
      </div>
    </div>
  );
}
