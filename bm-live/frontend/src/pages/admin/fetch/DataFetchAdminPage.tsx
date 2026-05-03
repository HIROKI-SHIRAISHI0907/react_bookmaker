// src/pages/admin/DataFetchAdminPage.tsx
import React, { useEffect, useMemo, useState } from "react";

/** ============ Types ============ */
type StatRequestResource = {
  country?: string;
  league?: string;
  season?: string;
};

type StatResponseResource = {
  returnCd?: string;
  taskArn?: string;
  [k: string]: any;
};

type TaskDef = {
  id: string;
  code: string;
  title: string;
  description: string;
  endpoint: string;
  defaultBody?: StatRequestResource;
};

type BatchFileCheckItemResource = {
  label?: string;
  bucket?: string;
  key?: string | null;
  kind?: "file" | "folder" | "count" | string;
  type?: string;
  exists?: boolean;
  required?: boolean;
  count?: number | null;
};

type BatchFileCheckTaskResource = {
  taskCode?: string;
  ready?: boolean;
  summary?: string;
  items?: BatchFileCheckItemResource[];
};

type BatchFileCheckResponseResource = {
  tasks?: BatchFileCheckTaskResource[];
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

/** ============ Utils ============ */
function toTrimOrNull(s: string): string | null {
  const t = (s ?? "").trim();
  return t === "" ? null : t;
}

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e ?? "unknown error");
}

async function postJsonSafe<T>(url: string, body: unknown): Promise<{ data: T | null; rawText: string | null }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body ?? {}),
  });

  const ct = res.headers.get("content-type") ?? "";

  if (!res.ok) {
    let detail = "";
    try {
      if (ct.includes("application/json")) {
        const j = await res.json();
        detail = JSON.stringify(j, null, 2);
      } else {
        detail = await res.text();
      }
    } catch {
      // ignore
    }
    throw new Error(`HTTP ${res.status} ${res.statusText}${detail ? `:\n${detail}` : ""}`);
  }

  if (res.status === 204) return { data: null, rawText: null };

  if (ct.includes("application/json")) {
    const data = (await res.json()) as T;
    return { data, rawText: null };
  }

  const text = await res.text().catch(() => "");
  return { data: null, rawText: text || null };
}

async function getJsonSafe<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
  });

  const ct = res.headers.get("content-type") ?? "";

  if (!res.ok) {
    let detail = "";
    try {
      if (ct.includes("application/json")) {
        const j = await res.json();
        detail = JSON.stringify(j, null, 2);
      } else {
        detail = await res.text();
      }
    } catch {
      // ignore
    }
    throw new Error(`HTTP ${res.status} ${res.statusText}${detail ? `:\n${detail}` : ""}`);
  }

  if (!ct.includes("application/json")) {
    const text = await res.text().catch(() => "");
    throw new Error(`JSONレスポンスではありません${text ? `:\n${text}` : ""}`);
  }

  return (await res.json()) as T;
}

function getTaskFileStatusMap(data: BatchFileCheckResponseResource | null | undefined): Record<string, BatchFileCheckTaskResource> {
  const map: Record<string, BatchFileCheckTaskResource> = {};
  for (const task of data?.tasks ?? []) {
    if (task?.taskCode) {
      map[task.taskCode] = task;
    }
  }
  return map;
}

function getFileBadgeTone(task?: BatchFileCheckTaskResource): "gray" | "emerald" | "amber" | "rose" {
  if (!task) return "gray";
  if (task.ready) return "emerald";
  return "rose";
}

function getFileBadgeLabel(task?: BatchFileCheckTaskResource): string {
  if (!task) return "未確認";
  if (task.ready) return "準備OK";
  return task.summary?.trim() || "必須不足";
}

function getItemTone(item: BatchFileCheckItemResource): "gray" | "blue" | "emerald" | "amber" | "rose" {
  if (item.kind === "count") {
    if (item.required && !item.exists) return "rose";
    return "blue";
  }
  if (item.exists) return "emerald";
  if (item.required) return "rose";
  return "gray";
}

function getItemStatusText(item: BatchFileCheckItemResource): string {
  if (item.kind === "count") {
    return `${item.count ?? 0}`;
  }
  if (item.exists) return "存在";
  if (item.required) return "必須不足";
  return "未存在";
}

function getItemIcon(item: BatchFileCheckItemResource): string {
  if (item.kind === "count") return "📊";
  if (item.exists) return "✅";
  if (item.required) return "❌";
  return "⚪";
}

/** ============ Common UI Components ============ */
type CardProps = { children: React.ReactNode; className?: string };
const Card = ({ children, className = "" }: CardProps) => <div className={`bg-white/90 backdrop-blur rounded-2xl shadow-sm border border-gray-100 ${className}`}>{children}</div>;

type ButtonVariant = "primary" | "secondary" | "success" | "danger";
type ButtonProps = {
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  className?: string;
};
const Button = ({ children, onClick, variant = "primary", disabled, loading, icon, className = "" }: ButtonProps) => {
  const variantClasses: Record<ButtonVariant, string> = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white border-blue-600 focus:ring-blue-500",
    secondary: "bg-gray-50 hover:bg-gray-100 text-gray-800 border-gray-200 focus:ring-gray-300",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 focus:ring-emerald-500",
    danger: "bg-rose-600 hover:bg-rose-700 text-white border-rose-600 focus:ring-rose-500",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold
        transition-all duration-200 shadow-sm hover:shadow-md
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {!loading && icon}
      {children}
    </button>
  );
};

type InputProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
};
const Input = ({ label, value, onChange, placeholder = "", hint }: InputProps) => (
  <div>
    <label className="block text-sm font-semibold text-gray-800 mb-2">{label}</label>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="
        w-full px-4 py-3 rounded-xl border border-gray-200 bg-white
        transition-colors duration-200
        hover:border-gray-300
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
      "
    />
    {hint && <p className="mt-2 text-xs text-gray-500">{hint}</p>}
  </div>
);

type AlertType = "info" | "success" | "error" | "warning";
const Alert = ({ type, title, message, onClose }: { type: AlertType; title: string; message: string; onClose?: () => void }) => {
  const typeClasses: Record<AlertType, string> = {
    info: "bg-blue-50 border-blue-200 text-blue-900",
    success: "bg-emerald-50 border-emerald-200 text-emerald-900",
    error: "bg-rose-50 border-rose-200 text-rose-900",
    warning: "bg-amber-50 border-amber-200 text-amber-900",
  };
  return (
    <div className={`border rounded-2xl p-4 flex gap-3 items-start ${typeClasses[type]}`}>
      <div className="mt-0.5">
        {type === "info" && "💡"}
        {type === "success" && "✅"}
        {type === "error" && "❌"}
        {type === "warning" && "⚠️"}
      </div>
      <div className="flex-1">
        <div className="font-bold text-sm">{title}</div>
        <pre className="mt-1 whitespace-pre-wrap text-xs leading-relaxed">{message}</pre>
      </div>
      {onClose && (
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors">
          ✕
        </button>
      )}
    </div>
  );
};

const Badge = ({ children, tone = "gray" }: { children: React.ReactNode; tone?: "gray" | "blue" | "emerald" | "amber" | "rose" }) => {
  const classes: Record<string, string> = {
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    emerald: "bg-emerald-100 text-emerald-800 border-emerald-200",
    amber: "bg-amber-100 text-amber-800 border-amber-200",
    rose: "bg-rose-100 text-rose-800 border-rose-200",
  };
  return <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${classes[tone]}`}>{children}</span>;
};

/** ============ Page ============ */
export default function DataFetchAdminPage() {
  const tasks: TaskDef[] = useMemo(
    () => [
      { id: "B002", code: "B002", title: "選手情報取得", description: "country / league / team / member を収集", endpoint: "/v1/api/admin/exec/task/country-league-team-member" },
      { id: "B003", code: "B003", title: "国リーグ別シーズン開始情報取得", description: "国×リーグのシーズン開始情報を更新", endpoint: "/v1/api/admin/exec/task/country-league-season" },
      { id: "B004", code: "B004", title: "チーム名情報取得", description: "国×リーグのチーム情報を更新", endpoint: "/v1/api/admin/exec/task/country-league" },
      { id: "B005", code: "B005", title: "試合予定データ取得", description: "未来の試合予定を取得", endpoint: "/v1/api/admin/exec/task/future" },
      { id: "B006", code: "B006", title: "統計CSVデータ取り入れ実行", description: "統計CSVを取り込む", endpoint: "/v1/api/stat" },
      { id: "B008", code: "B008", title: "開催中データ取得", description: "開催中データを更新", endpoint: "/v1/api/admin/exec/task/bm-data" },
      {
        id: "B010",
        code: "B010",
        title: "欠損値（未来データ、終了済データ）データ取得",
        description: "欠損値（未来データ、終了済データ）データを更新",
        endpoint: "/v1/api/admin/exec/task/fin-getting-json",
      },
      { id: "B011", code: "B011", title: "統計CSVデータ生成", description: "統計CSVを生成", endpoint: "/v1/api/admin/exec/task/stat-csv" },
    ],
    [],
  );

  const [country, setCountry] = useState("");
  const [league, setLeague] = useState("");
  const [season, setSeason] = useState("");

  const [running, setRunning] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<Record<string, StatResponseResource | null>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [globalMessage, setGlobalMessage] = useState<{ type: AlertType; title: string; message: string } | null>(null);

  const [fileChecks, setFileChecks] = useState<Record<string, BatchFileCheckTaskResource>>({});
  const [fileChecksLoading, setFileChecksLoading] = useState(false);
  const [fileChecksError, setFileChecksError] = useState<string | null>(null);

  const requestBody = useMemo<StatRequestResource>(() => {
    const body: StatRequestResource = {};
    const c = toTrimOrNull(country);
    const l = toTrimOrNull(league);
    const s = toTrimOrNull(season);
    if (c) body.country = c;
    if (l) body.league = l;
    if (s) body.season = s;
    return body;
  }, [country, league, season]);

  const loadFileChecks = async () => {
    setFileChecksLoading(true);
    setFileChecksError(null);

    try {
      const url = `${API_BASE}/v1/api/admin/file-checks`;
      const data = await getJsonSafe<BatchFileCheckResponseResource>(url);
      setFileChecks(getTaskFileStatusMap(data));
    } catch (e: unknown) {
      setFileChecksError(getErrorMessage(e));
    } finally {
      setFileChecksLoading(false);
    }
  };

  useEffect(() => {
    loadFileChecks();
  }, []);

  const runTask = async (t: TaskDef) => {
    setGlobalMessage(null);
    setErrors((p) => ({ ...p, [t.id]: null }));
    setRunning((p) => new Set(p).add(t.id));

    try {
      const url = `${API_BASE}${t.endpoint}`;
      const { data, rawText } = await postJsonSafe<StatResponseResource>(url, requestBody);

      const payload: StatResponseResource =
        data ??
        ({
          returnCd: "OK",
          taskArn: null,
          _note: rawText ? `Non-JSON response: ${rawText}` : "No content",
        } as any);

      setResults((p) => ({ ...p, [t.id]: payload }));

      setGlobalMessage({
        type: "success",
        title: `実行完了: ${t.code}`,
        message: `${t.title}\nEndpoint: ${t.endpoint}`,
      });

      await loadFileChecks();
    } catch (e: unknown) {
      const msg = getErrorMessage(e);
      setErrors((p) => ({ ...p, [t.id]: msg }));
      setResults((p) => ({ ...p, [t.id]: null }));
      setGlobalMessage({ type: "error", title: `実行失敗: ${t.code}`, message: msg });
    } finally {
      setRunning((p) => {
        const next = new Set(p);
        next.delete(t.id);
        return next;
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start md:items-center justify-between gap-4 flex-col md:flex-row">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-2xl shadow-lg">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">データ取得管理</h1>
              <p className="text-sm text-gray-600 mt-1">バッチ起動（POST）と事前ファイル確認</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge tone={API_BASE ? "emerald" : "amber"}>{API_BASE ? `API: ${API_BASE}` : "API_BASE 未設定"}</Badge>
            <Badge tone="blue">タスク数: {tasks.length}</Badge>
            <Button variant="secondary" icon="🔄" loading={fileChecksLoading} onClick={loadFileChecks} className="px-3 py-2 text-xs">
              {fileChecksLoading ? "確認中..." : "ファイル状態更新"}
            </Button>
          </div>
        </div>

        {/* Global alert */}
        {globalMessage && <Alert type={globalMessage.type} title={globalMessage.title} message={globalMessage.message} onClose={() => setGlobalMessage(null)} />}

        {/* File-check alert */}
        {fileChecksError && <Alert type="warning" title="事前ファイル確認の取得に失敗" message={fileChecksError} onClose={() => setFileChecksError(null)} />}

        {/* Request params */}
        <Card className="p-6">
          <div className="flex items-start md:items-center justify-between gap-4 flex-col md:flex-row">
            <div>
              <div className="text-lg font-bold text-gray-900">リクエストパラメータ（任意）</div>
              <div className="text-sm text-gray-600 mt-1">入力した値は各タスクの request body に入れて送信します</div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                icon="🧹"
                onClick={() => {
                  setCountry("");
                  setLeague("");
                  setSeason("");
                }}
              >
                クリア
              </Button>

              <Button variant="secondary" icon="📋" onClick={() => navigator.clipboard.writeText(JSON.stringify(requestBody, null, 2))}>
                body をコピー
              </Button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="🏳️ country" value={country} onChange={setCountry} placeholder="例: JP" />
            <Input label="🏆 league" value={league} onChange={setLeague} placeholder="例: J1" />
            <Input label="📅 season" value={season} onChange={setSeason} placeholder="例: 2025" />
          </div>

          <div className="mt-4 text-xs text-gray-500">※ Spring側で env に詰める想定なら「入力 → request body → runner 側で env 反映」の流れにできます。</div>

          <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="text-xs font-semibold text-gray-700 mb-2">送信 body（プレビュー）</div>
            <pre className="text-xs text-gray-700 whitespace-pre-wrap">{JSON.stringify(requestBody, null, 2)}</pre>
          </div>
        </Card>

        {/* Tasks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.map((t) => {
            const isRunning = running.has(t.id);
            const result = results[t.id];
            const err = errors[t.id];
            const fileCheck = fileChecks[t.code];

            const runTone: "gray" | "blue" | "emerald" | "amber" | "rose" = err ? "rose" : result ? "emerald" : "gray";
            const fileTone = getFileBadgeTone(fileCheck);
            const canRun = !isRunning && !!fileCheck?.ready;

            return (
              <Card key={t.id} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge tone="blue">{t.code}</Badge>
                      <Badge tone={runTone}>{err ? "ERROR" : result ? "DONE" : "IDLE"}</Badge>
                      <Badge tone={fileTone}>{getFileBadgeLabel(fileCheck)}</Badge>
                    </div>

                    <div className="mt-2 text-lg font-extrabold text-gray-900 truncate">{t.title}</div>
                    <div className="mt-1 text-sm text-gray-600">{t.description}</div>

                    <div className="mt-3 text-xs text-gray-500">
                      Endpoint: <code className="px-2 py-1 rounded-lg bg-gray-100 border border-gray-200">{t.endpoint}</code>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <Button onClick={() => runTask(t)} loading={isRunning} disabled={!canRun} icon={!isRunning ? "▶️" : undefined}>
                      {isRunning ? "実行中..." : "実行"}
                    </Button>

                    <Button variant="secondary" icon="📎" onClick={() => navigator.clipboard.writeText(`${API_BASE}${t.endpoint}`)}>
                      URLコピー
                    </Button>
                  </div>
                </div>

                {/* File Check */}
                <div className="mt-4 rounded-2xl border border-gray-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-bold text-gray-900">事前ファイル確認</div>
                    <div className="text-xs text-gray-500">{fileCheck?.summary ?? "未確認"}</div>
                  </div>

                  {fileCheck?.items?.length ? (
                    <div className="mt-3 space-y-2">
                      {fileCheck.items.map((item, idx) => (
                        <div key={`${t.code}-${idx}`} className="rounded-xl border border-gray-100 bg-white p-3">
                          <div className="flex items-start gap-3">
                            <div className="text-lg leading-none pt-0.5">{getItemIcon(item)}</div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-gray-900">{item.label ?? "-"}</span>
                                <Badge tone={getItemTone(item)}>{getItemStatusText(item)}</Badge>
                                {item.type && <Badge tone="gray">{item.type}</Badge>}
                                {item.required && <Badge tone="amber">必須</Badge>}
                              </div>

                              <div className="mt-2 text-xs text-gray-600 space-y-1 break-all">
                                {item.bucket && <div>Bucket: {item.bucket}</div>}
                                {item.key && <div>Key: {item.key}</div>}
                                {item.kind === "count" && <div>Count: {item.count ?? 0}</div>}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3 text-xs text-gray-500">確認情報がありません</div>
                  )}

                  {!fileCheck?.ready && (
                    <div className="mt-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">必須条件が満たされていないため、このタスクは実行できません。</div>
                  )}
                </div>

                {/* Error */}
                {err && (
                  <div className="mt-4">
                    <Alert type="error" title="エラー" message={err} />
                  </div>
                )}

                {/* Result */}
                {result && (
                  <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-bold text-gray-900">結果</div>
                      <div className="flex gap-2">
                        <Button variant="secondary" icon="📋" onClick={() => navigator.clipboard.writeText(JSON.stringify(result, null, 2))} className="px-3 py-2 text-xs">
                          JSONコピー
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2 text-sm text-gray-800">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-500">returnCd</span>
                        <code className="px-2 py-1 rounded-lg bg-white border border-gray-200">{result.returnCd ?? "-"}</code>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-500">taskArn</span>
                        <code className="px-2 py-1 rounded-lg bg-white border border-gray-200 break-all">{result.taskArn ?? "-"}</code>
                        {result.taskArn && (
                          <Button variant="secondary" icon="📋" onClick={() => navigator.clipboard.writeText(String(result.taskArn))} className="px-3 py-2 text-xs">
                            コピー
                          </Button>
                        )}
                      </div>

                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs font-semibold text-gray-700 select-none">詳細JSONを表示</summary>
                        <pre className="mt-2 text-xs whitespace-pre-wrap text-gray-700">{JSON.stringify(result, null, 2)}</pre>
                      </details>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          ブラウザから叩けない場合は、Spring側の <span className="font-semibold">CORS</span> / <span className="font-semibold">認証</span> / <span className="font-semibold">CSRF</span>{" "}
          を確認してください。
        </div>
      </div>
    </div>
  );
}
