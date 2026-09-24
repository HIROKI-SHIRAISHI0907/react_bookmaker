// src/pages/admin/DataFetchAdminPage.tsx
import React, { useEffect, useMemo, useState } from "react";

/** ============ Types ============ */
type StatRequestResource = {
  country?: string;
  league?: string;
  season?: string;
  readyFlg?: boolean;
};

type StatResponseResource = {
  returnCd?: string;
  taskArn?: string;
  [k: string]: any;
};

type PrecheckMode = "required" | "always";

type TaskDef = {
  id: string;
  code: string;
  title: string;
  description: string;
  endpoint: string;
  defaultBody?: StatRequestResource;
  precheckMode?: PrecheckMode;
  precheckTaskCode?: string;
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

type StatCountryLeagueOptionResource = {
  country?: string;
  leagues?: string[];
};

type StatCountryLeagueOptionsResponseResource = {
  countries?: StatCountryLeagueOptionResource[];
};

type SelectOption = {
  label: string;
  value: string;
};

type Tone = "gray" | "blue" | "emerald" | "amber" | "rose";

/**
 * 画面上の「実行単位」。
 * B014 は readyFlg=true / false の2つの実行単位に分かれる。
 */
type RunUnit = {
  key: string; // running / results / errors の state key
  display: TaskDef; // 表示用（code / title / description / precheckMode）
  baseTask: TaskDef; // 実行用（endpoint）
  fileCheckKey: string; // fileChecks の参照キー
  extraBody?: Partial<StatRequestResource>;
};

type ViewMode = "compact" | "detail";
type FilterMode = "all" | "runnable" | "blocked";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const STAT_OPTIONS_ENDPOINT = "/v1/api/admin/stat/options";
const FILE_CHECKS_ENDPOINT = "/v1/api/admin/file-checks";

/**
 * 新B014の実APIパス
 */
const B007_ALL_LEAGUE_ENDPOINT = "/v1/api/admin/exec/task/all-league-scrape-master";
const B013_SEASON_END_DELETE_ENDPOINT = "/v1/api/admin/exec/task/delete-season-data";
const B014_ENDPOINT = "/v1/api/admin/exec/task/geografic";

const B014_TRUE_STATE_KEY = "B014T";
const B014_FALSE_STATE_KEY = "B014F";

const VIEW_MODE_STORAGE_KEY = "dataFetchAdmin.viewMode";

/** ============ Utils ============ */
function toTrimOrNull(s: string): string | null {
  const t = (s ?? "").trim();
  return t === "" ? null : t;
}

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e ?? "unknown error");
}

function withCacheBuster(url: string): string {
  const sep = url.indexOf("?") >= 0 ? "&" : "?";
  return `${url}${sep}_ts=${Date.now()}`;
}

function loadViewMode(): ViewMode {
  try {
    const v = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return v === "detail" ? "detail" : "compact";
  } catch {
    return "compact";
  }
}

function saveViewMode(mode: ViewMode) {
  try {
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
  } catch {
    // ignore
  }
}

async function postJsonSafe<T>(url: string, body: unknown): Promise<{ data: T | null; rawText: string | null }> {
  const res = await fetch(withCacheBuster(url), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/plain, */*",
      "Cache-Control": "no-cache, no-store, max-age=0",
      Pragma: "no-cache",
    },
    credentials: "include",
    cache: "no-store",
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
  const res = await fetch(withCacheBuster(url), {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Cache-Control": "no-cache, no-store, max-age=0",
      Pragma: "no-cache",
    },
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

/**
 * APIレスポンスをそのまま画面に反映する。
 * B014F は Java 側が正なので、React側で output/ 等への補正は行わない。
 */
function normalizeBatchFileChecksResponse(data: BatchFileCheckResponseResource | null | undefined): BatchFileCheckResponseResource | null | undefined {
  if (!data?.tasks?.length) return data;

  return {
    ...data,
    tasks: (data.tasks ?? []).map((task) => ({
      ...task,
      items: (task.items ?? []).map((item) => ({
        ...item,
      })),
    })),
  };
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

function getItemTone(item: BatchFileCheckItemResource): Tone {
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

function canRunTask(task: TaskDef, isRunning: boolean, fileCheck?: BatchFileCheckTaskResource): boolean {
  if (isRunning) return false;
  if (task.precheckMode === "always") return true;
  return !!fileCheck?.ready;
}

function getEffectiveFileBadgeTone(task: TaskDef, fileCheck?: BatchFileCheckTaskResource): "gray" | "emerald" | "amber" | "rose" {
  if (task.precheckMode === "always") return "emerald";
  return getFileBadgeTone(fileCheck);
}

function getEffectiveFileBadgeLabel(task: TaskDef, fileCheck?: BatchFileCheckTaskResource): string {
  if (task.precheckMode === "always") return "前提条件なし";
  return getFileBadgeLabel(fileCheck);
}

function getPrecheckPanelSummary(task: TaskDef, fileCheck?: BatchFileCheckTaskResource): string {
  if (task.precheckMode === "always") return fileCheck?.summary ?? "必須条件なし";
  return fileCheck?.summary ?? "未確認";
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
  title?: string;
};
const Button = ({ children, onClick, variant = "primary", disabled, loading, icon, className = "", title }: ButtonProps) => {
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
      title={title}
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

type SelectProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  hint?: string;
  disabled?: boolean;
};
const Select = ({ label, value, onChange, options, placeholder = "選択してください", hint, disabled = false }: SelectProps) => (
  <div>
    <label className="block text-sm font-semibold text-gray-800 mb-2">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="
        w-full px-4 py-3 rounded-xl border border-gray-200 bg-white
        transition-colors duration-200
        hover:border-gray-300
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
      "
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {hint && <p className="mt-2 text-xs text-gray-500">{hint}</p>}
  </div>
);

type AlertType = "info" | "success" | "error" | "warning";
const Alert = ({ type, title, message, onClose, className = "" }: { type: AlertType; title: string; message: string; onClose?: () => void; className?: string }) => {
  const typeClasses: Record<AlertType, string> = {
    info: "bg-blue-50 border-blue-200 text-blue-900",
    success: "bg-emerald-50 border-emerald-200 text-emerald-900",
    error: "bg-rose-50 border-rose-200 text-rose-900",
    warning: "bg-amber-50 border-amber-200 text-amber-900",
  };
  return (
    <div className={`border rounded-2xl p-4 flex gap-3 items-start ${typeClasses[type]} ${className}`}>
      <div className="mt-0.5">
        {type === "info" && "💡"}
        {type === "success" && "✅"}
        {type === "error" && "❌"}
        {type === "warning" && "⚠️"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm">{title}</div>
        <pre className="mt-1 whitespace-pre-wrap break-all text-xs leading-relaxed max-h-60 overflow-auto">{message}</pre>
      </div>
      {onClose && (
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors">
          ✕
        </button>
      )}
    </div>
  );
};

const toneClasses: Record<Tone, string> = {
  gray: "bg-gray-100 text-gray-700 border-gray-200",
  blue: "bg-blue-100 text-blue-800 border-blue-200",
  emerald: "bg-emerald-100 text-emerald-800 border-emerald-200",
  amber: "bg-amber-100 text-amber-800 border-amber-200",
  rose: "bg-rose-100 text-rose-800 border-rose-200",
};

const Badge = ({ children, tone = "gray" }: { children: React.ReactNode; tone?: Tone }) => {
  return <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${toneClasses[tone]}`}>{children}</span>;
};

/** 事前確認アイテムを1行に収まる小さなチップで表示 */
const ItemChip = ({ item }: { item: BatchFileCheckItemResource }) => {
  const tone = getItemTone(item);
  const tooltip = [item.bucket ? `Bucket: ${item.bucket}` : null, item.key ? `Key: ${item.key}` : null, item.kind === "count" ? `Count: ${item.count ?? 0}` : null, item.required ? "必須" : "任意"]
    .filter(Boolean)
    .join("\n");

  return (
    <span title={tooltip} className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${toneClasses[tone]}`}>
      <span aria-hidden="true">{getItemIcon(item)}</span>
      <span>{item.label ?? "-"}</span>
      {item.kind === "count" && <span className="font-bold">: {item.count ?? 0}</span>}
    </span>
  );
};

/** ============ Page ============ */
export default function DataFetchAdminPage() {
  const tasks: TaskDef[] = useMemo(
    () => [
      {
        id: "B002",
        code: "B002",
        title: "選手情報取得",
        description: "country / league / team / member を収集",
        endpoint: "/v1/api/admin/exec/task/country-league-team-member",
        precheckMode: "required",
      },
      {
        id: "B003",
        code: "B003",
        title: "国リーグ別シーズン開始情報取得",
        description: "国×リーグのシーズン開始情報を更新",
        endpoint: "/v1/api/admin/exec/task/country-league-season",
        precheckMode: "required",
      },
      {
        id: "B004",
        code: "B004",
        title: "チーム名情報取得",
        description: "国×リーグのチーム情報を更新",
        endpoint: "/v1/api/admin/exec/task/country-league",
        precheckMode: "required",
      },
      {
        id: "B005",
        code: "B005",
        title: "試合予定データ取得",
        description: "未来の試合予定を取得",
        endpoint: "/v1/api/admin/exec/task/future",
        precheckMode: "required",
      },
      {
        id: "B006",
        code: "B006",
        title: "統計CSVデータ取り入れ実行",
        description: "統計CSVを取り込む",
        endpoint: "/v1/api/stat",
        precheckMode: "always",
      },
      {
        id: "B007",
        code: "B007",
        title: "全リーグマスタデータ処理",
        description: "all_league_master.csv を前提に実行",
        endpoint: B007_ALL_LEAGUE_ENDPOINT,
        precheckMode: "required",
      },
      {
        id: "B008",
        code: "B008",
        title: "開催中データ取得",
        description: "開催中データを更新",
        endpoint: "/v1/api/admin/exec/task/bm-data",
        precheckMode: "required",
      },
      {
        id: "B010",
        code: "B010",
        title: "欠損値（未来データ・終了済データ）取得",
        description: "aws-s3-outputs-fin-csv の json / fin 以外の直フォルダが1件以上あれば実行可能",
        endpoint: "/v1/api/admin/exec/task/fin-getting-json",
        precheckMode: "required",
      },
      {
        id: "B011",
        code: "B011",
        title: "統計CSVデータ生成",
        description: "必須情報なし。常時実行可能",
        endpoint: "/v1/api/admin/exec/task/stat-csv",
        precheckMode: "always",
      },
      {
        id: "B006_EACH",
        code: "B006-each",
        title: "統計CSVデータ取り入れ実行（国別 / 国リーグ別）",
        description: "country または country + league を指定して統計CSVを取り込む",
        endpoint: "/v1/api/stat/each",
        precheckMode: "always",
        precheckTaskCode: "B006",
      },
      {
        id: "B013",
        code: "B013",
        title: "シーズン終了後削除処理",
        description: "シーズン終了後の不要データ削除を実行",
        endpoint: B013_SEASON_END_DELETE_ENDPOINT,
        precheckMode: "always",
      },
      {
        id: "B014",
        code: "B014",
        title: "地理情報データ処理",
        description: "b015_team_location.csv を前提に実行",
        endpoint: B014_ENDPOINT,
        precheckMode: "required",
      },
    ],
    [],
  );

  /** タスク定義 → 実行単位（B014 は T / F に分割） */
  const units: RunUnit[] = useMemo(() => {
    const list: RunUnit[] = [];
    for (const t of tasks) {
      if (t.code === "B014") {
        list.push({
          key: B014_TRUE_STATE_KEY,
          display: {
            ...t,
            id: B014_TRUE_STATE_KEY,
            code: B014_TRUE_STATE_KEY,
            title: `${t.title}（readyFlg=true）`,
            description: "前提条件なしで実行",
            precheckMode: "always",
          },
          baseTask: t,
          fileCheckKey: B014_TRUE_STATE_KEY,
          extraBody: { readyFlg: true },
        });
        list.push({
          key: B014_FALSE_STATE_KEY,
          display: {
            ...t,
            id: B014_FALSE_STATE_KEY,
            code: B014_FALSE_STATE_KEY,
            title: `${t.title}（readyFlg=false）`,
            precheckMode: "required",
          },
          baseTask: t,
          fileCheckKey: B014_FALSE_STATE_KEY,
          extraBody: { readyFlg: false },
        });
        continue;
      }
      list.push({
        key: t.id,
        display: t,
        baseTask: t,
        fileCheckKey: t.precheckTaskCode ?? t.code,
      });
    }
    return list;
  }, [tasks]);

  const [country, setCountry] = useState("");
  const [league, setLeague] = useState("");
  const [season, setSeason] = useState("");

  const [statOptions, setStatOptions] = useState<StatCountryLeagueOptionsResponseResource | null>(null);
  const [statOptionsLoading, setStatOptionsLoading] = useState(false);
  const [statOptionsError, setStatOptionsError] = useState<string | null>(null);

  const [running, setRunning] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<Record<string, StatResponseResource | null>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [globalMessage, setGlobalMessage] = useState<{ type: AlertType; title: string; message: string } | null>(null);

  const [fileChecks, setFileChecks] = useState<Record<string, BatchFileCheckTaskResource>>({});
  const [fileChecksLoading, setFileChecksLoading] = useState(false);
  const [fileChecksError, setFileChecksError] = useState<string | null>(null);

  // 表示の工夫用
  const [viewMode, setViewMode] = useState<ViewMode>(() => loadViewMode());
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [paramsOpen, setParamsOpen] = useState(false);

  const changeViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    saveViewMode(mode);
  };

  const toggleExpanded = (key: string) => {
    setExpanded((p) => {
      const next = new Set(p);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // 成功メッセージは6秒で自動的に閉じる
  useEffect(() => {
    if (globalMessage?.type !== "success") return;
    const timer = window.setTimeout(() => setGlobalMessage(null), 6000);
    return () => window.clearTimeout(timer);
  }, [globalMessage]);

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

  const countryOptions = useMemo<SelectOption[]>(() => {
    return (statOptions?.countries ?? [])
      .filter((x) => !!x.country)
      .map((x) => ({
        label: x.country as string,
        value: x.country as string,
      }));
  }, [statOptions]);

  const leagueOptions = useMemo<SelectOption[]>(() => {
    const selected = (statOptions?.countries ?? []).find((x) => x.country === country);
    return (selected?.leagues ?? []).map((item) => ({
      label: item,
      value: item,
    }));
  }, [statOptions, country]);

  const handleCountryChange = (nextCountry: string) => {
    setCountry(nextCountry);

    const selected = (statOptions?.countries ?? []).find((x) => x.country === nextCountry);
    const leagues = selected?.leagues ?? [];

    if (!leagues.includes(league)) {
      setLeague("");
    }
  };

  const loadFileChecks = async () => {
    setFileChecksLoading(true);
    setFileChecksError(null);

    try {
      const url = `${API_BASE}${FILE_CHECKS_ENDPOINT}`;
      console.log("[file-checks] url =", url);

      const data = await getJsonSafe<BatchFileCheckResponseResource>(url);
      console.log("[file-checks] response =", data);

      const normalized = normalizeBatchFileChecksResponse(data);
      setFileChecks(getTaskFileStatusMap(normalized));
    } catch (e: unknown) {
      setFileChecksError(getErrorMessage(e));
    } finally {
      setFileChecksLoading(false);
    }
  };

  const loadStatOptions = async () => {
    setStatOptionsLoading(true);
    setStatOptionsError(null);

    try {
      const url = `${API_BASE}${STAT_OPTIONS_ENDPOINT}`;
      const data = await getJsonSafe<StatCountryLeagueOptionsResponseResource>(url);
      setStatOptions(data);
    } catch (e: unknown) {
      setStatOptionsError(getErrorMessage(e));
    } finally {
      setStatOptionsLoading(false);
    }
  };

  useEffect(() => {
    loadFileChecks();
    loadStatOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!country) return;

    const selected = (statOptions?.countries ?? []).find((x) => x.country === country);
    if (!selected) {
      setCountry("");
      setLeague("");
      return;
    }

    const leagues = selected.leagues ?? [];
    if (league && !leagues.includes(league)) {
      setLeague("");
    }
  }, [statOptions, country, league]);

  const runTask = async (
    t: TaskDef,
    options?: {
      stateKey?: string;
      extraBody?: Partial<StatRequestResource>;
      successCode?: string;
      successTitle?: string;
      errorCode?: string;
      errorTitle?: string;
    },
  ) => {
    const stateKey = options?.stateKey ?? t.id;
    const successCode = options?.successCode ?? t.code;
    const successTitle = options?.successTitle ?? t.title;
    const errorCode = options?.errorCode ?? t.code;
    const errorTitle = options?.errorTitle ?? t.title;
    const body: StatRequestResource = {
      ...requestBody,
      ...(options?.extraBody ?? {}),
    };

    setGlobalMessage(null);
    setErrors((p) => ({ ...p, [stateKey]: null }));
    setRunning((p) => new Set(p).add(stateKey));

    try {
      const url = `${API_BASE}${t.endpoint}`;
      const { data, rawText } = await postJsonSafe<StatResponseResource>(url, body);

      const payload: StatResponseResource =
        data ??
        ({
          returnCd: "OK",
          taskArn: null,
          _note: rawText ? `Non-JSON response: ${rawText}` : "No content",
        } as any);

      setResults((p) => ({ ...p, [stateKey]: payload }));

      setGlobalMessage({
        type: "success",
        title: `実行完了: ${successCode}`,
        message: `${successTitle}\nEndpoint: ${t.endpoint}`,
      });

      await loadFileChecks();
    } catch (e: unknown) {
      const msg = getErrorMessage(e);
      setErrors((p) => ({ ...p, [stateKey]: msg }));
      setResults((p) => ({ ...p, [stateKey]: null }));
      setGlobalMessage({ type: "error", title: `実行失敗: ${errorCode}`, message: `${errorTitle}\n${msg}` });
    } finally {
      setRunning((p) => {
        const next = new Set(p);
        next.delete(stateKey);
        return next;
      });
    }
  };

  const runUnit = async (u: RunUnit) => {
    await runTask(u.baseTask, {
      stateKey: u.key,
      extraBody: u.extraBody,
      successCode: u.display.code,
      successTitle: u.display.title,
      errorCode: u.display.code,
      errorTitle: u.display.title,
    });
    // 実行後は結果が見えるように詳細を開く
    setExpanded((p) => new Set(p).add(u.key));
  };

  /** 各実行単位の状態をまとめて計算 */
  const unitStates = useMemo(() => {
    return units.map((u) => {
      const isRunning = running.has(u.key);
      const result = results[u.key];
      const err = errors[u.key];
      const fileCheck = fileChecks[u.fileCheckKey];
      const canRun = canRunTask(u.display, isRunning, fileCheck);
      const runnable = canRunTask(u.display, false, fileCheck); // 実行中かどうかに関係なく、条件を満たすか
      const runTone: Tone = isRunning ? "amber" : err ? "rose" : result ? "emerald" : "gray";
      const runLabel = isRunning ? "RUNNING" : err ? "ERROR" : result ? "DONE" : "IDLE";
      return { u, isRunning, result, err, fileCheck, canRun, runnable, runTone, runLabel };
    });
  }, [units, running, results, errors, fileChecks]);

  const runnableCount = unitStates.filter((s) => s.runnable).length;
  const blockedCount = unitStates.length - runnableCount;

  const visibleStates = unitStates.filter((s) => {
    if (filterMode === "runnable") return s.runnable;
    if (filterMode === "blocked") return !s.runnable;
    return true;
  });

  const statOptionsBadgeTone: Tone = statOptionsError ? "rose" : statOptionsLoading ? "amber" : "emerald";

  const statOptionsBadgeLabel = statOptionsError ? "候補取得失敗" : statOptionsLoading ? "候補取得中..." : `候補API OK (${countryOptions.length} countries)`;

  const renderFileCheckPanel = (task: TaskDef, fileCheck?: BatchFileCheckTaskResource) => {
    return (
      <div className="mt-4 rounded-2xl border border-gray-100 bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-bold text-gray-900">{task.precheckMode === "always" ? "実行前確認（参考）" : "事前ファイル確認"}</div>
          <div className="text-xs text-gray-500">{getPrecheckPanelSummary(task, fileCheck)}</div>
        </div>

        {fileCheck?.items?.length ? (
          <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-2">
            {fileCheck.items.map((item, idx) => (
              <div key={`${task.code}-${idx}`} className="rounded-xl border border-gray-100 bg-white p-3">
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
        ) : task.precheckMode === "always" ? (
          <div className="mt-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">このタスクは必須の事前条件なしで実行できます。</div>
        ) : (
          <div className="mt-3 text-xs text-gray-500">確認情報がありません</div>
        )}

        {task.precheckMode !== "always" && !!fileCheck && !fileCheck.ready && (
          <div className="mt-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">必須条件が満たされていないため、このタスクは実行できません。</div>
        )}
      </div>
    );
  };

  const renderResultPanel = (result?: StatResponseResource | null) => {
    if (!result) return null;

    return (
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
    );
  };

  /** 事前確認をチップで1行表示 */
  const renderItemChips = (task: TaskDef, fileCheck?: BatchFileCheckTaskResource) => {
    if (fileCheck?.items?.length) {
      return (
        <div className="flex flex-wrap gap-1.5">
          {fileCheck.items.map((item, idx) => (
            <ItemChip key={`${task.code}-chip-${idx}`} item={item} />
          ))}
        </div>
      );
    }
    if (task.precheckMode === "always") {
      return <span className="text-[11px] text-emerald-700">前提条件なし</span>;
    }
    return <span className="text-[11px] text-gray-400">確認情報なし</span>;
  };

  /** ===== コンパクト表示: 1タスク = 1行 ===== */
  const renderCompactRow = (s: (typeof unitStates)[number]) => {
    const { u, isRunning, result, err, fileCheck, canRun, runTone, runLabel } = s;
    const t = u.display;
    const isOpen = expanded.has(u.key) || !!err;

    return (
      <div key={u.key} className={`rounded-xl border bg-white transition-colors ${s.runnable ? "border-gray-100" : "border-rose-100"}`}>
        <div className="flex flex-col md:flex-row md:items-center gap-3 px-4 py-3">
          {/* 左: コード + タイトル + チップ */}
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-20 shrink-0 pt-0.5">
              <Badge tone="blue">{t.code}</Badge>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-gray-900 truncate" title={`${t.title}\n${t.description}\n${t.endpoint}`}>
                {t.title}
              </div>
              <div className="mt-1.5">{renderItemChips(t, fileCheck)}</div>
            </div>
          </div>

          {/* 右: 状態 + 操作 */}
          <div className="flex items-center gap-2 flex-wrap md:flex-nowrap md:justify-end shrink-0">
            <Badge tone={runTone}>{runLabel}</Badge>
            <Badge tone={getEffectiveFileBadgeTone(t, fileCheck)}>{getEffectiveFileBadgeLabel(t, fileCheck)}</Badge>
            <Button onClick={() => runUnit(u)} loading={isRunning} disabled={!canRun} icon={!isRunning ? "▶️" : undefined} className="px-3 py-1.5 text-xs">
              {isRunning ? "実行中" : "実行"}
            </Button>
            <Button variant="secondary" onClick={() => navigator.clipboard.writeText(`${API_BASE}${u.baseTask.endpoint}`)} className="px-2.5 py-1.5 text-xs" title="URLコピー">
              📎
            </Button>
            <Button variant="secondary" onClick={() => toggleExpanded(u.key)} className="px-2.5 py-1.5 text-xs" title="詳細">
              {isOpen ? "▲" : "▼"}
            </Button>
          </div>
        </div>

        {isOpen && (
          <div className="border-t border-gray-100 px-4 pb-4">
            <div className="mt-3 text-xs text-gray-600">{t.description}</div>
            <div className="mt-2 text-xs text-gray-500">
              Endpoint: <code className="px-2 py-0.5 rounded-lg bg-gray-100 border border-gray-200 break-all">{u.baseTask.endpoint}</code>
            </div>

            {renderFileCheckPanel(t, fileCheck)}

            {err && (
              <div className="mt-4">
                <Alert type="error" title="エラー" message={err} />
              </div>
            )}

            {renderResultPanel(result)}
          </div>
        )}
      </div>
    );
  };

  /** ===== 詳細表示: 従来のカード（事前確認は折りたたみ） ===== */
  const renderDetailCard = (s: (typeof unitStates)[number]) => {
    const { u, isRunning, result, err, fileCheck, canRun, runTone, runLabel } = s;
    const t = u.display;
    const isOpen = expanded.has(u.key) || !!err || !s.runnable;

    return (
      <Card key={u.key} className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge tone="blue">{t.code}</Badge>
              <Badge tone={runTone}>{runLabel}</Badge>
              <Badge tone={getEffectiveFileBadgeTone(t, fileCheck)}>{getEffectiveFileBadgeLabel(t, fileCheck)}</Badge>
            </div>

            <div className="mt-2 text-base font-extrabold text-gray-900 truncate" title={t.title}>
              {t.title}
            </div>
            <div className="mt-1 text-sm text-gray-600">{t.description}</div>

            <div className="mt-2 text-xs text-gray-500">
              Endpoint: <code className="px-2 py-0.5 rounded-lg bg-gray-100 border border-gray-200 break-all">{u.baseTask.endpoint}</code>
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <Button onClick={() => runUnit(u)} loading={isRunning} disabled={!canRun} icon={!isRunning ? "▶️" : undefined} className="px-3 py-2 text-xs">
              {isRunning ? "実行中..." : "実行"}
            </Button>
            <Button variant="secondary" icon="📎" onClick={() => navigator.clipboard.writeText(`${API_BASE}${u.baseTask.endpoint}`)} className="px-3 py-2 text-xs">
              URLコピー
            </Button>
          </div>
        </div>

        <div className="mt-3">{renderItemChips(t, fileCheck)}</div>

        <button type="button" onClick={() => toggleExpanded(u.key)} className="mt-3 text-xs font-semibold text-blue-700 hover:underline">
          {isOpen ? "▲ 事前確認の詳細を閉じる" : "▼ 事前確認の詳細を開く"}
        </button>

        {isOpen && renderFileCheckPanel(t, fileCheck)}

        {err && (
          <div className="mt-4">
            <Alert type="error" title="エラー" message={err} />
          </div>
        )}

        {renderResultPanel(result)}
      </Card>
    );
  };

  const segmentBtn = (active: boolean) => `px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${active ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-4">
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
              <p className="text-sm text-gray-600 mt-1">バッチ起動（POST）と事前確認</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge tone={API_BASE ? "emerald" : "amber"}>{API_BASE ? `API: ${API_BASE}` : "API_BASE 未設定"}</Badge>
            <Badge tone={statOptionsBadgeTone}>{statOptionsBadgeLabel}</Badge>
          </div>
        </div>

        {/* File-check alert */}
        {fileChecksError && <Alert type="warning" title="事前確認の取得に失敗" message={fileChecksError} onClose={() => setFileChecksError(null)} />}

        {/* Options alert */}
        {statOptionsError && <Alert type="warning" title="国・リーグ候補の取得に失敗" message={statOptionsError} onClose={() => setStatOptionsError(null)} />}

        {/* Request params（折りたたみ） */}
        <Card className="p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <button type="button" onClick={() => setParamsOpen((v) => !v)} className="flex items-center gap-2 text-left min-w-0">
              <span className="text-sm font-bold text-gray-900">{paramsOpen ? "▲" : "▼"} リクエストパラメータ</span>
              <code className="px-2 py-0.5 rounded-lg bg-gray-100 border border-gray-200 text-xs text-gray-700 truncate max-w-[50vw]">{JSON.stringify(requestBody)}</code>
            </button>

            <div className="flex gap-2 flex-wrap">
              <Button
                variant="secondary"
                icon="🧹"
                className="px-3 py-1.5 text-xs"
                onClick={() => {
                  setCountry("");
                  setLeague("");
                  setSeason("");
                }}
              >
                クリア
              </Button>

              <Button variant="secondary" icon="📋" className="px-3 py-1.5 text-xs" onClick={() => navigator.clipboard.writeText(JSON.stringify(requestBody, null, 2))}>
                body をコピー
              </Button>
            </div>
          </div>

          {paramsOpen && (
            <>
              <div className="mt-2 text-xs text-gray-600">country を選ぶと、その国に紐づく league のみ選択できます。入力した値は各タスクの request body に入れて送信します。</div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label="🏳️ country"
                  value={country}
                  onChange={handleCountryChange}
                  options={countryOptions}
                  placeholder={statOptionsLoading ? "読込中..." : countryOptions.length > 0 ? "国を選択" : "候補なし"}
                  hint="B006-each で利用する国を選択"
                  disabled={statOptionsLoading || countryOptions.length === 0}
                />

                <Select
                  label="🏆 league"
                  value={league}
                  onChange={setLeague}
                  options={leagueOptions}
                  placeholder={!country ? "先に国を選択" : leagueOptions.length > 0 ? "リーグを選択" : "候補なし"}
                  hint="選択した国に紐づくリーグのみ表示"
                  disabled={statOptionsLoading || !country || leagueOptions.length === 0}
                />

                <Input label="📅 season" value={season} onChange={setSeason} placeholder="例: 2025" hint="必要な場合のみ指定" />
              </div>

              <div className="mt-3 text-xs text-gray-500">※ Spring側で env に詰める想定なら「入力 → request body → runner 側で env 反映」の流れにできます。</div>
            </>
          )}
        </Card>

        {/* Toolbar（スクロールしても上に固定） */}
        <div className="sticky top-0 z-20">
          <div className="rounded-2xl border border-gray-100 bg-white/90 backdrop-blur shadow-sm px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge tone="blue">タスク数: {unitStates.length}</Badge>
              <Badge tone="emerald">実行可: {runnableCount}</Badge>
              <Badge tone={blockedCount > 0 ? "rose" : "gray"}>必須不足: {blockedCount}</Badge>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* フィルタ */}
              <div className="inline-flex rounded-xl bg-gray-100 p-1">
                <button type="button" className={segmentBtn(filterMode === "all")} onClick={() => setFilterMode("all")}>
                  すべて
                </button>
                <button type="button" className={segmentBtn(filterMode === "runnable")} onClick={() => setFilterMode("runnable")}>
                  実行可のみ
                </button>
                <button type="button" className={segmentBtn(filterMode === "blocked")} onClick={() => setFilterMode("blocked")}>
                  必須不足のみ
                </button>
              </div>

              {/* 表示切替 */}
              <div className="inline-flex rounded-xl bg-gray-100 p-1">
                <button type="button" className={segmentBtn(viewMode === "compact")} onClick={() => changeViewMode("compact")}>
                  ☰ 一覧
                </button>
                <button type="button" className={segmentBtn(viewMode === "detail")} onClick={() => changeViewMode("detail")}>
                  ▦ カード
                </button>
              </div>

              <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => setExpanded(new Set(units.map((u) => u.key)))}>
                すべて開く
              </Button>
              <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => setExpanded(new Set())}>
                すべて閉じる
              </Button>

              <Button variant="secondary" icon="🗂️" loading={statOptionsLoading} onClick={loadStatOptions} className="px-3 py-1.5 text-xs">
                {statOptionsLoading ? "候補読込中..." : "候補更新"}
              </Button>

              <Button variant="secondary" icon="🔄" loading={fileChecksLoading} onClick={loadFileChecks} className="px-3 py-1.5 text-xs">
                {fileChecksLoading ? "確認中..." : "状態更新"}
              </Button>
            </div>
          </div>
        </div>

        {/* Tasks */}
        {visibleStates.length === 0 ? (
          <Card className="p-6 text-center text-sm text-gray-500">条件に一致するタスクはありません。</Card>
        ) : viewMode === "compact" ? (
          <div className="space-y-2">{visibleStates.map(renderCompactRow)}</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 items-start">{visibleStates.map(renderDetailCard)}</div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 pt-2">
          ブラウザから叩けない場合は、Spring側の <span className="font-semibold">CORS</span> / <span className="font-semibold">認証</span> / <span className="font-semibold">CSRF</span>{" "}
          を確認してください。
        </div>
      </div>

      {/* 実行結果メッセージ（画面右下に固定表示。スクロール位置に関係なく見える） */}
      {globalMessage && (
        <div className="fixed bottom-4 right-4 z-50 w-[min(28rem,calc(100vw-2rem))] shadow-xl rounded-2xl">
          <Alert type={globalMessage.type} title={globalMessage.title} message={globalMessage.message} onClose={() => setGlobalMessage(null)} />
        </div>
      )}
    </div>
  );
}
