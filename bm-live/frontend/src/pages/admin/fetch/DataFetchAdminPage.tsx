// src/pages/admin/fetch/DataFetchAdminPage.tsx
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Copy, Link2, Play, RefreshCw } from "lucide-react";
import {
  BadgeTone,
  ConsoleButton,
  ConsoleField,
  ConsoleInput,
  ConsoleNotice,
  ConsolePanel,
  ConsoleSelect,
  ConsoleToolbar,
  NoticeTone,
  SegmentedTabs,
  StatChips,
  StatusBadge,
} from "../../../api/commonAdminDesign";

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

/** 旧トーン → 共通バッジのトーン */
const TONE: Record<Tone, BadgeTone> = { gray: "neutral", blue: "info", emerald: "ok", amber: "warn", rose: "ng" };

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
type AlertType = "info" | "success" | "error" | "warning";

const ALERT_TONE: Record<AlertType, NoticeTone> = { info: "info", success: "ok", error: "ng", warning: "warn" };

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const STAT_OPTIONS_ENDPOINT = "/v1/api/admin/stat/options";
const FILE_CHECKS_ENDPOINT = "/v1/api/admin/file-checks";

/**
 * 新B014の実APIパス
 */
const B007_ALL_LEAGUE_ENDPOINT = "/v1/api/admin/exec/task/all-league-scrape-master";
const B013_SEASON_END_DELETE_ENDPOINT = "/v1/api/admin/exec/task/delete-season-data";
const B014_ENDPOINT = "/v1/api/admin/exec/task/geografic";
/** ファイルアップロード反映（CSV アップロードの判定前を DB チェック・反映する。bookmakers-batch の B015） */
const B015_FILE_UPLOAD_STATUS_ENDPOINT = "/v1/api/admin/exec/task/file-upload-status";

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

function getFileBadgeTone(task?: BatchFileCheckTaskResource): Tone {
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

function canRunTask(task: TaskDef, isRunning: boolean, fileCheck?: BatchFileCheckTaskResource): boolean {
  if (isRunning) return false;
  if (task.precheckMode === "always") return true;
  return !!fileCheck?.ready;
}

function getEffectiveFileBadgeTone(task: TaskDef, fileCheck?: BatchFileCheckTaskResource): Tone {
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

/** ============ 小さな部品 ============ */

const CHIP_TONE: Record<Tone, string> = {
  gray: "border-gray-200 bg-gray-50 text-gray-600",
  blue: "border-indigo-200 bg-indigo-50 text-indigo-700",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  rose: "border-red-200 bg-red-50 text-red-700",
};

/** 事前確認アイテムを1行に収まる小さなチップで表示 */
const ItemChip = ({ item }: { item: BatchFileCheckItemResource }) => {
  const tone = getItemTone(item);
  const tooltip = [item.bucket ? `Bucket: ${item.bucket}` : null, item.key ? `Key: ${item.key}` : null, item.kind === "count" ? `Count: ${item.count ?? 0}` : null, item.required ? "必須" : "任意"]
    .filter(Boolean)
    .join("\n");

  return (
    <span title={tooltip} className={`inline-flex items-center gap-1 whitespace-nowrap rounded border px-1.5 py-px text-[11px] font-medium ${CHIP_TONE[tone]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      <span>{item.label ?? "-"}</span>
      {item.kind === "count" && <span className="font-bold tabular-nums">: {item.count ?? 0}</span>}
    </span>
  );
};

const copyText = (text: string) => void navigator.clipboard.writeText(text);

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
        endpoint: "/v1/api/admin/exec/task/stat-csv",
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
      {
        id: "B015",
        code: "B015",
        title: "ファイルアップロード反映",
        description: "aws-s3-upload-check-csv の uploaded/ に判定前の zip があれば実行可能。DB チェック・反映し、success / error に振り分ける",
        endpoint: B015_FILE_UPLOAD_STATUS_ENDPOINT,
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
      const data = await getJsonSafe<BatchFileCheckResponseResource>(url);
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
  const statOptionsBadgeLabel = statOptionsError ? "候補取得失敗" : statOptionsLoading ? "候補取得中…" : `候補API OK（${countryOptions.length} countries）`;

  /** 事前確認の詳細 */
  const renderFileCheckPanel = (task: TaskDef, fileCheck?: BatchFileCheckTaskResource) => (
    <div className="mt-2.5 rounded-lg border border-gray-200 bg-gray-50 p-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-bold text-gray-900">{task.precheckMode === "always" ? "実行前確認（参考）" : "事前ファイル確認"}</div>
        <div className="text-[11px] text-gray-500">{getPrecheckPanelSummary(task, fileCheck)}</div>
      </div>

      {fileCheck?.items?.length ? (
        <div className="mt-2 overflow-hidden rounded-md border border-gray-200 bg-white">
          <table className="w-full border-collapse text-[12px]">
            <tbody>
              {fileCheck.items.map((item, idx) => (
                <tr key={`${task.code}-${idx}`} className="border-t border-gray-100 first:border-t-0">
                  <td className="whitespace-nowrap px-2 py-1 font-bold text-gray-900">{item.label ?? "-"}</td>
                  <td className="whitespace-nowrap px-2 py-1">
                    <span className="inline-flex flex-wrap gap-1">
                      <StatusBadge tone={TONE[getItemTone(item)]}>{getItemStatusText(item)}</StatusBadge>
                      {item.type && (
                        <StatusBadge tone="neutral" dot={false}>
                          {item.type}
                        </StatusBadge>
                      )}
                      {item.required && (
                        <StatusBadge tone="warn" dot={false}>
                          必須
                        </StatusBadge>
                      )}
                    </span>
                  </td>
                  <td className="w-full break-all px-2 py-1 font-mono text-[11px] text-gray-500">
                    {item.bucket && <div>Bucket: {item.bucket}</div>}
                    {item.key && <div>Key: {item.key}</div>}
                    {item.kind === "count" && <div>Count: {item.count ?? 0}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : task.precheckMode === "always" ? (
        <div className="mt-2 text-[11px] text-emerald-700">このタスクは必須の事前条件なしで実行できます。</div>
      ) : (
        <div className="mt-2 text-[11px] text-gray-500">確認情報がありません</div>
      )}

      {task.precheckMode !== "always" && !!fileCheck && !fileCheck.ready && (
        <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] text-red-700">必須条件が満たされていないため、このタスクは実行できません。</div>
      )}
    </div>
  );

  /** 実行結果 */
  const renderResultPanel = (result?: StatResponseResource | null) => {
    if (!result) return null;

    return (
      <div className="mt-2.5 rounded-lg border border-gray-200 bg-white p-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-bold text-gray-900">結果</div>
          <ConsoleButton size="sm" onClick={() => copyText(JSON.stringify(result, null, 2))}>
            <Copy className="h-3 w-3" />
            JSONコピー
          </ConsoleButton>
        </div>

        <div className="mt-1.5 grid gap-1 text-[12px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-14 text-[11px] text-gray-500">returnCd</span>
            <code className="rounded bg-gray-100 px-1.5 font-mono">{result.returnCd ?? "-"}</code>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-14 text-[11px] text-gray-500">taskArn</span>
            <code className="break-all rounded bg-gray-100 px-1.5 font-mono">{result.taskArn ?? "-"}</code>
            {result.taskArn && (
              <ConsoleButton size="sm" variant="ghost" onClick={() => copyText(String(result.taskArn))} title="taskArn をコピー">
                <Copy className="h-3 w-3" />
              </ConsoleButton>
            )}
          </div>
          <details>
            <summary className="cursor-pointer select-none text-[11px] font-bold text-gray-600">詳細JSONを表示</summary>
            <pre className="m-0 mt-1 whitespace-pre-wrap rounded bg-gray-50 p-2 font-mono text-[11px] text-gray-700">{JSON.stringify(result, null, 2)}</pre>
          </details>
        </div>
      </div>
    );
  };

  /** 事前確認をチップで1行表示 */
  const renderItemChips = (task: TaskDef, fileCheck?: BatchFileCheckTaskResource) => {
    if (fileCheck?.items?.length) {
      return (
        <div className="flex flex-wrap gap-1">
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

  /** 展開したときの中身（説明・Endpoint・事前確認・エラー・結果） */
  const renderExpanded = (s: (typeof unitStates)[number]) => {
    const { u, err, fileCheck, result } = s;
    const t = u.display;
    return (
      <div className="border-t border-gray-100 bg-gray-50/50 px-3 pb-3 pt-2">
        <div className="text-xs text-gray-600">{t.description}</div>
        <div className="mt-1 text-[11px] text-gray-500">
          Endpoint: <code className="break-all rounded bg-gray-100 px-1.5 font-mono">{u.baseTask.endpoint}</code>
        </div>
        {renderFileCheckPanel(t, fileCheck)}
        {err && (
          <ConsoleNotice tone="ng" title="エラー" className="mb-0 mt-2.5">
            {err}
          </ConsoleNotice>
        )}
        {renderResultPanel(result)}
      </div>
    );
  };

  /** ===== 一覧表示: 1タスク = 1行 ===== */
  const renderCompactRow = (s: (typeof unitStates)[number]) => {
    const { u, isRunning, err, fileCheck, canRun, runTone, runLabel } = s;
    const t = u.display;
    const isOpen = expanded.has(u.key) || !!err;

    return (
      <div key={u.key} className={`border-t border-gray-100 first:border-t-0 ${s.runnable ? "" : "bg-red-50/30"}`}>
        <div className="flex flex-col gap-2 px-3 py-2 md:flex-row md:items-center">
          <div className="flex min-w-0 flex-1 items-start gap-2.5">
            <code className="w-[72px] shrink-0 pt-0.5 font-mono text-xs font-bold text-indigo-700">{t.code}</code>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-bold text-gray-900" title={`${t.title}\n${t.description}\n${t.endpoint}`}>
                {t.title}
              </div>
              <div className="mt-1">{renderItemChips(t, fileCheck)}</div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-1.5 md:flex-nowrap md:justify-end">
            <StatusBadge tone={TONE[runTone]}>{runLabel}</StatusBadge>
            <StatusBadge tone={TONE[getEffectiveFileBadgeTone(t, fileCheck)]} dot={false}>
              {getEffectiveFileBadgeLabel(t, fileCheck)}
            </StatusBadge>
            <ConsoleButton size="sm" variant="primary" onClick={() => void runUnit(u)} loading={isRunning} disabled={!canRun}>
              {!isRunning && <Play className="h-3 w-3" />}
              {isRunning ? "実行中" : "実行"}
            </ConsoleButton>
            <ConsoleButton size="sm" variant="ghost" onClick={() => copyText(`${API_BASE}${u.baseTask.endpoint}`)} title="URLコピー">
              <Link2 className="h-3.5 w-3.5" />
            </ConsoleButton>
            <ConsoleButton size="sm" variant="ghost" onClick={() => toggleExpanded(u.key)} title="詳細">
              {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </ConsoleButton>
          </div>
        </div>

        {isOpen && renderExpanded(s)}
      </div>
    );
  };

  /** ===== カード表示 ===== */
  const renderDetailCard = (s: (typeof unitStates)[number]) => {
    const { u, isRunning, result, err, fileCheck, canRun, runTone, runLabel } = s;
    const t = u.display;
    const isOpen = expanded.has(u.key) || !!err || !s.runnable;

    return (
      <div key={u.key} className={`rounded-xl border bg-white p-3 ${s.runnable ? "border-gray-200" : "border-red-200"}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <code className="font-mono text-xs font-bold text-indigo-700">{t.code}</code>
              <StatusBadge tone={TONE[runTone]}>{runLabel}</StatusBadge>
              <StatusBadge tone={TONE[getEffectiveFileBadgeTone(t, fileCheck)]} dot={false}>
                {getEffectiveFileBadgeLabel(t, fileCheck)}
              </StatusBadge>
            </div>
            <div className="mt-1 truncate text-[14px] font-bold text-gray-900" title={t.title}>
              {t.title}
            </div>
            <div className="mt-0.5 text-xs text-gray-600">{t.description}</div>
            <div className="mt-1 text-[11px] text-gray-500">
              Endpoint: <code className="break-all rounded bg-gray-100 px-1.5 font-mono">{u.baseTask.endpoint}</code>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-1.5">
            <ConsoleButton size="sm" variant="primary" onClick={() => void runUnit(u)} loading={isRunning} disabled={!canRun}>
              {!isRunning && <Play className="h-3 w-3" />}
              {isRunning ? "実行中…" : "実行"}
            </ConsoleButton>
            <ConsoleButton size="sm" onClick={() => copyText(`${API_BASE}${u.baseTask.endpoint}`)}>
              <Link2 className="h-3 w-3" />
              URLコピー
            </ConsoleButton>
          </div>
        </div>

        <div className="mt-2">{renderItemChips(t, fileCheck)}</div>

        <button type="button" onClick={() => toggleExpanded(u.key)} className="mt-2 text-[11px] font-bold text-indigo-600 hover:underline">
          {isOpen ? "▲ 事前確認の詳細を閉じる" : "▼ 事前確認の詳細を開く"}
        </button>

        {isOpen && renderFileCheckPanel(t, fileCheck)}

        {err && (
          <ConsoleNotice tone="ng" title="エラー" className="mb-0 mt-2.5">
            {err}
          </ConsoleNotice>
        )}

        {renderResultPanel(result)}
      </div>
    );
  };

  return (
    <div>
      <ConsoleToolbar title="スクレイピングCSV情報データ登録管理" info="バッチ起動（POST）と事前確認">
        <StatusBadge tone={API_BASE ? "ok" : "warn"} dot={false}>
          {API_BASE ? `API: ${API_BASE}` : "API_BASE 未設定"}
        </StatusBadge>
        <StatusBadge tone={TONE[statOptionsBadgeTone]}>{statOptionsBadgeLabel}</StatusBadge>
        <ConsoleButton onClick={() => void loadStatOptions()} loading={statOptionsLoading}>
          候補更新
        </ConsoleButton>
        <ConsoleButton variant="primary" onClick={() => void loadFileChecks()} loading={fileChecksLoading}>
          {!fileChecksLoading && <RefreshCw className="h-3.5 w-3.5" />}
          状態更新
        </ConsoleButton>
      </ConsoleToolbar>

      {fileChecksError && (
        <ConsoleNotice tone="warn" title="事前確認の取得に失敗" onClose={() => setFileChecksError(null)}>
          {fileChecksError}
        </ConsoleNotice>
      )}
      {statOptionsError && (
        <ConsoleNotice tone="warn" title="国・リーグ候補の取得に失敗" onClose={() => setStatOptionsError(null)}>
          {statOptionsError}
        </ConsoleNotice>
      )}

      {/* リクエストパラメータ（折りたたみ） */}
      <ConsolePanel
        title={
          <button type="button" onClick={() => setParamsOpen((v) => !v)} className="inline-flex items-center gap-1 text-sm font-bold text-gray-900">
            {paramsOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            リクエストパラメータ
          </button>
        }
        info={<code className="inline-block max-w-[50vw] truncate rounded bg-gray-100 px-1.5 align-middle font-mono text-[11px] text-gray-700">{JSON.stringify(requestBody)}</code>}
        right={
          <>
            <ConsoleButton
              size="sm"
              onClick={() => {
                setCountry("");
                setLeague("");
                setSeason("");
              }}
            >
              クリア
            </ConsoleButton>
            <ConsoleButton size="sm" onClick={() => copyText(JSON.stringify(requestBody, null, 2))}>
              <Copy className="h-3 w-3" />
              body をコピー
            </ConsoleButton>
          </>
        }
        flush={!paramsOpen}
      >
        {paramsOpen && (
          <>
            <div className="mb-2 text-xs text-gray-500">country を選ぶと、その国に紐づく league のみ選択できます。入力した値は各タスクの request body に入れて送信します。</div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <ConsoleField label="country" hint="B006-each で利用する国を選択">
                <ConsoleSelect value={country} onChange={(e) => handleCountryChange(e.target.value)} disabled={statOptionsLoading || countryOptions.length === 0} className="w-full">
                  <option value="">{statOptionsLoading ? "読込中…" : countryOptions.length > 0 ? "国を選択" : "候補なし"}</option>
                  {countryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </ConsoleSelect>
              </ConsoleField>

              <ConsoleField label="league" hint="選択した国に紐づくリーグのみ表示">
                <ConsoleSelect value={league} onChange={(e) => setLeague(e.target.value)} disabled={statOptionsLoading || !country || leagueOptions.length === 0} className="w-full">
                  <option value="">{!country ? "先に国を選択" : leagueOptions.length > 0 ? "リーグを選択" : "候補なし"}</option>
                  {leagueOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </ConsoleSelect>
              </ConsoleField>

              <ConsoleField label="season" hint="必要な場合のみ指定">
                <ConsoleInput value={season} onChange={(e) => setSeason(e.target.value)} placeholder="例: 2025" className="w-full" />
              </ConsoleField>
            </div>
          </>
        )}
      </ConsolePanel>

      {/* 集計・絞り込み（スクロールしても上に固定） */}
      <div className="sticky top-0 z-20 mb-2 flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white/95 px-3 pt-2.5 backdrop-blur">
        <StatChips
          items={[
            { label: "タスク数", value: unitStates.length },
            { label: "実行可", value: runnableCount, tone: "ok" },
            { label: "必須不足", value: blockedCount, tone: blockedCount > 0 ? "ng" : "default" },
          ]}
        />
        <div className="mb-2.5 ml-auto flex flex-wrap items-center gap-1.5">
          <SegmentedTabs<FilterMode>
            value={filterMode}
            onChange={setFilterMode}
            options={[
              { value: "all", label: "すべて" },
              { value: "runnable", label: "実行可のみ" },
              { value: "blocked", label: "必須不足のみ" },
            ]}
          />
          <SegmentedTabs<ViewMode>
            value={viewMode}
            onChange={changeViewMode}
            options={[
              { value: "compact", label: "一覧" },
              { value: "detail", label: "カード" },
            ]}
          />
          <ConsoleButton size="sm" onClick={() => setExpanded(new Set(units.map((u) => u.key)))}>
            すべて開く
          </ConsoleButton>
          <ConsoleButton size="sm" onClick={() => setExpanded(new Set())}>
            すべて閉じる
          </ConsoleButton>
        </div>
      </div>

      {/* タスク */}
      {visibleStates.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-400">条件に一致するタスクはありません。</div>
      ) : viewMode === "compact" ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">{visibleStates.map(renderCompactRow)}</div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2 2xl:grid-cols-3">{visibleStates.map(renderDetailCard)}</div>
      )}

      <div className="pt-3 text-center text-[11px] text-gray-400">
        ブラウザから叩けない場合は、Spring側の <b>CORS</b> / <b>認証</b> / <b>CSRF</b> を確認してください。
      </div>

      {/* 実行結果メッセージ（画面右下に固定表示） */}
      {globalMessage && (
        <div className="fixed bottom-4 right-4 z-50 w-[min(28rem,calc(100vw-2rem))] shadow-xl">
          <ConsoleNotice tone={ALERT_TONE[globalMessage.type]} title={globalMessage.title} onClose={() => setGlobalMessage(null)} className="mb-0">
            {globalMessage.message}
          </ConsoleNotice>
        </div>
      )}
    </div>
  );
}
