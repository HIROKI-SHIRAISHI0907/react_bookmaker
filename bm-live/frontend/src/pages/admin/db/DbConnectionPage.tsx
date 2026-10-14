import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { BadgeTone, ConsoleButton, ConsoleNotice, ConsolePanel, ConsoleToolbar, MetricGrid, StatChips, StatChipTone, StatusBadge } from "../../../api/commonAdminDesign";

type PoolRuntimeMetrics = {
  poolName: string;
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  threadsAwaitingConnection: number;
  immediatelyAvailableConnections: number;
  remainingPoolCapacity: number;
};

type PoolConfigMetrics = {
  maximumPoolSize: number;
  minimumIdle: number;
  connectionTimeoutMs: number;
  validationTimeoutMs: number;
  idleTimeoutMs: number;
  maxLifetimeMs: number;
  leakDetectionThresholdMs: number;
  autoCommit: boolean;
  connectionTestQuery: string | null;
};

type PostgresServerMetrics = {
  maxConnections: number;
  superuserReservedConnections: number;
  reservedConnections: number | null;
  totalBackendProcesses: number;
  currentClientConnections: number;
  activeConnections: number;
  idleConnections: number;
  idleInTransactionConnections: number;
  idleInTransactionAbortedConnections: number;
  waitingConnections: number;
  estimatedAvailableConnections: number;
};

type CurrentDatabaseMetrics = {
  numBackends: number;
  currentClientConnections: number;
  activeConnections: number;
  idleConnections: number;
  idleInTransactionConnections: number;
  idleInTransactionAbortedConnections: number;
  waitingConnections: number;
  currentUserConnections: number;
};

type DbConnectionStatusResponse = {
  dataSourceKey: string;
  displayName: string;
  measuredAt: string;
  databaseName: string;
  poolRuntime: PoolRuntimeMetrics;
  poolConfig: PoolConfigMetrics;
  postgresServer: PostgresServerMetrics;
  currentDatabase: CurrentDatabaseMetrics;
};

type DbConnectionStatusListResponse = {
  count: number;
  items: DbConnectionStatusResponse[];
};

const emptyData: DbConnectionStatusResponse = {
  dataSourceKey: "",
  displayName: "",
  measuredAt: "",
  databaseName: "",
  poolRuntime: {
    poolName: "",
    totalConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    threadsAwaitingConnection: 0,
    immediatelyAvailableConnections: 0,
    remainingPoolCapacity: 0,
  },
  poolConfig: {
    maximumPoolSize: 0,
    minimumIdle: 0,
    connectionTimeoutMs: 0,
    validationTimeoutMs: 0,
    idleTimeoutMs: 0,
    maxLifetimeMs: 0,
    leakDetectionThresholdMs: 0,
    autoCommit: false,
    connectionTestQuery: null,
  },
  postgresServer: {
    maxConnections: 0,
    superuserReservedConnections: 0,
    reservedConnections: 0,
    totalBackendProcesses: 0,
    currentClientConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    idleInTransactionConnections: 0,
    idleInTransactionAbortedConnections: 0,
    waitingConnections: 0,
    estimatedAvailableConnections: 0,
  },
  currentDatabase: {
    numBackends: 0,
    currentClientConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    idleInTransactionConnections: 0,
    idleInTransactionAbortedConnections: 0,
    waitingConnections: 0,
    currentUserConnections: 0,
  },
};

type ConnectionHealthLevel = "healthy" | "watch" | "warning" | "near_exhausted" | "exhausted";

type ConnectionHealth = {
  level: ConnectionHealthLevel;
  label: string;
  tone: BadgeTone;
  message: string;
};

type ConnectionAlert = {
  label: string;
  tone: BadgeTone;
};

type Tone3 = "good" | "warn" | "danger";

/** 状態ごとの帯の色（ConsoleNotice と同じ配色） */
const HEALTH_BOX: Record<BadgeTone, string> = {
  ok: "border-emerald-200 bg-emerald-50 text-emerald-800",
  info: "border-indigo-200 bg-indigo-50 text-indigo-800",
  warn: "border-amber-200 bg-amber-50 text-amber-800",
  ng: "border-red-200 bg-red-50 text-red-800",
  neutral: "border-gray-200 bg-gray-50 text-gray-700",
};

const HEALTH_DOT: Record<BadgeTone, string> = {
  ok: "bg-emerald-500",
  info: "bg-indigo-500",
  warn: "bg-amber-500",
  ng: "bg-red-500",
  neutral: "bg-gray-400",
};

function getPoolFacts(data: DbConnectionStatusResponse) {
  const maxPool = Math.max(data.poolConfig.maximumPoolSize || 0, 1);
  const total = Math.max(data.poolRuntime.totalConnections || 0, 0);
  const active = Math.max(data.poolRuntime.activeConnections || 0, 0);
  const idle = Math.max(data.poolRuntime.idleConnections || 0, 0);
  const immediateAvailable = Math.max(data.poolRuntime.immediatelyAvailableConnections || 0, 0);
  const waitingThreads = Math.max(data.poolRuntime.threadsAwaitingConnection || 0, 0);
  const remainingPoolCapacity = Math.max(data.poolRuntime.remainingPoolCapacity || 0, 0);
  const dbAvailable = Math.max(data.postgresServer.estimatedAvailableConnections || 0, 0);

  const idleInTx = Math.max(data.currentDatabase.idleInTransactionConnections || 0, 0) + Math.max(data.currentDatabase.idleInTransactionAbortedConnections || 0, 0);

  const usageRate = active / maxPool;
  const existingPoolBusyRate = total > 0 ? active / total : 0;

  // 今まだプールを増やせるか
  const canGrowPool = remainingPoolCapacity > 0 || total < maxPool;

  // 実際に逼迫しているかをざっくり判定
  const poolPressure = waitingThreads > 0 || (!canGrowPool && immediateAvailable <= 0) || (usageRate >= 0.9 && immediateAvailable <= 1);

  return {
    maxPool,
    total,
    active,
    idle,
    immediateAvailable,
    waitingThreads,
    remainingPoolCapacity,
    dbAvailable,
    idleInTx,
    usageRate,
    existingPoolBusyRate,
    canGrowPool,
    poolPressure,
  };
}

function getConnectionHealth(data: DbConnectionStatusResponse): ConnectionHealth {
  const { active, immediateAvailable, waitingThreads, dbAvailable, idleInTx, usageRate, existingPoolBusyRate, canGrowPool, poolPressure } = getPoolFacts(data);

  if (waitingThreads > 0 || (!canGrowPool && immediateAvailable <= 0) || dbAvailable <= 0) {
    return {
      level: "exhausted",
      label: "枯渇状態",
      tone: "ng",
      message: "接続待ちが発生しているか、これ以上プールを広げられない状態で空き接続がありません。業務影響が出る可能性があります。",
    };
  }

  if (dbAvailable <= 3 || (!canGrowPool && immediateAvailable <= 1 && active > 0) || (usageRate >= 0.9 && existingPoolBusyRate >= 0.9) || poolPressure) {
    return {
      level: "near_exhausted",
      label: "逼迫寸前",
      tone: "ng",
      message: "接続使用率が高く、急な負荷増加で待ちが発生するおそれがあります。短時間での推移を重点監視してください。",
    };
  }

  if (dbAvailable <= 10 || (usageRate >= 0.75 && active > 0) || (!canGrowPool && immediateAvailable <= 2 && active > 0) || idleInTx >= 3) {
    return {
      level: "warning",
      label: "注意",
      tone: "warn",
      message: "現時点で直ちに枯渇してはいませんが、接続使用率またはDB側余力に注意が必要です。",
    };
  }

  if (idleInTx > 0) {
    return {
      level: "watch",
      label: "監視中",
      tone: "info",
      message: "接続余力はありますが、idle in transaction が存在します。接続閉じ忘れやトランザクション長期化に注意してください。",
    };
  }

  return {
    level: "healthy",
    label: "正常",
    tone: "ok",
    message: "現在のところ、コネクションプールとDB接続数は安定しています。",
  };
}

function getConnectionAlerts(data: DbConnectionStatusResponse): ConnectionAlert[] {
  const alerts: ConnectionAlert[] = [];

  const { active, immediateAvailable, waitingThreads, dbAvailable, idleInTx, usageRate, canGrowPool, remainingPoolCapacity } = getPoolFacts(data);

  const idleInTxAborted = data.currentDatabase.idleInTransactionAbortedConnections || 0;

  if (waitingThreads > 0) {
    alerts.push({ label: `接続待ち発生 ${waitingThreads}件`, tone: "ng" });
  }

  if (!canGrowPool && immediateAvailable <= 1 && active > 0) {
    alerts.push({ label: `空き接続が少ない (${immediateAvailable})`, tone: "ng" });
  }

  if (usageRate >= 0.9) {
    alerts.push({ label: `プール使用率高 (${Math.round(usageRate * 100)}%)`, tone: "ng" });
  } else if (usageRate >= 0.75) {
    alerts.push({ label: `プール使用率注意 (${Math.round(usageRate * 100)}%)`, tone: "warn" });
  }

  if (idleInTx > 0) {
    alerts.push({ label: `idle in transaction ${idleInTx}件`, tone: "info" });
  }

  if (idleInTxAborted > 0) {
    alerts.push({ label: `idle in transaction (aborted) ${idleInTxAborted}件`, tone: "ng" });
  }

  if (dbAvailable <= 3) {
    alerts.push({ label: `DB全体の空き接続が少ない (${dbAvailable})`, tone: "ng" });
  } else if (dbAvailable <= 10) {
    alerts.push({ label: `DB全体の空き接続に注意 (${dbAvailable})`, tone: "warn" });
  }

  if (remainingPoolCapacity <= 0) {
    alerts.push({ label: "プール拡張余地なし", tone: "neutral" });
  }

  return alerts;
}

function getImmediateAvailableTone(data: DbConnectionStatusResponse): Tone3 {
  const { active, immediateAvailable, waitingThreads, dbAvailable, canGrowPool } = getPoolFacts(data);

  if (waitingThreads > 0 || (!canGrowPool && immediateAvailable <= 0) || dbAvailable <= 0) {
    return "danger";
  }

  if (!canGrowPool && immediateAvailable <= 1 && active > 0) {
    return "warn";
  }

  return "good";
}

function getDbAvailableTone(value: number): Tone3 {
  if (value <= 0) return "danger";
  if (value <= 10) return "warn";
  return "good";
}

const CHIP_TONE: Record<Tone3, StatChipTone> = { good: "ok", warn: "warn", danger: "ng" };

function formatMeasuredAt(value: string) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString("ja-JP");
  } catch {
    return value;
  }
}

export default function DbConnectionStatusPage() {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [items, setItems] = useState<DbConnectionStatusResponse[]>([]);
  const [selectedKey, setSelectedKey] = useState("bm");

  // 選択を変えても再取得しないよう、selectedKey には依存させない
  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/v1/api/admin/db/connections", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = (await response.json()) as DbConnectionStatusListResponse;
      const nextItems = json.items ?? [];
      setItems(nextItems);
      setSelectedKey((prev) => (nextItems.length > 0 && !nextItems.some((item) => item.dataSourceKey === prev) ? nextItems[0].dataSourceKey : prev));
    } catch (error) {
      console.error(error);
      setErrorMessage("DBコネクション監視情報の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const data = useMemo(() => {
    return items.find((item) => item.dataSourceKey === selectedKey) ?? items[0] ?? emptyData;
  }, [items, selectedKey]);

  const health = getConnectionHealth(data);
  const alerts = getConnectionAlerts(data);

  return (
    <div>
      <ConsoleToolbar title="DBコネクション監視" info="HikariCP のプール状態と PostgreSQL の接続統計">
        <ConsoleButton variant="primary" onClick={() => void load()} loading={loading}>
          {!loading && <RefreshCw className="h-3.5 w-3.5" />}
          再読み込み
        </ConsoleButton>
      </ConsoleToolbar>

      {errorMessage && <ConsoleNotice tone="ng" title={errorMessage} onClose={() => setErrorMessage("")} />}

      {/* 監視対象の切り替え（それぞれの状態を色の点で表示） */}
      {items.length > 0 && (
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {items.map((item) => {
            const itemHealth = getConnectionHealth(item);
            const active = item.dataSourceKey === data.dataSourceKey;
            return (
              <button
                key={item.dataSourceKey}
                type="button"
                onClick={() => setSelectedKey(item.dataSourceKey)}
                className={[
                  "inline-flex h-8 items-center gap-2 rounded-lg border px-3 text-[13px] font-bold transition-colors",
                  active ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 bg-white text-gray-900 hover:bg-gray-50",
                ].join(" ")}
              >
                <span className={`h-2 w-2 rounded-full ${HEALTH_DOT[itemHealth.tone]}`} />
                {item.displayName || item.databaseName || item.dataSourceKey}
                <span className={`text-xs font-normal ${active ? "text-white/70" : "text-gray-500"}`}>{itemHealth.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <StatChips
        loading={loading && items.length === 0}
        items={[
          { label: "計測日時", value: formatMeasuredAt(data.measuredAt) },
          { label: "DB名", value: data.displayName || data.databaseName || "-" },
          { label: "即時利用可能", value: data.poolRuntime.immediatelyAvailableConnections, tone: CHIP_TONE[getImmediateAvailableTone(data)] },
          { label: "接続待ちスレッド", value: data.poolRuntime.threadsAwaitingConnection, tone: data.poolRuntime.threadsAwaitingConnection > 0 ? "ng" : "ok" },
          { label: "DB概算空き接続", value: data.postgresServer.estimatedAvailableConnections, tone: CHIP_TONE[getDbAvailableTone(data.postgresServer.estimatedAvailableConnections)] },
        ]}
      />

      {/* 総合判定 */}
      <div className={`mb-3 rounded-xl border px-3.5 py-2.5 ${HEALTH_BOX[health.tone]}`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${HEALTH_DOT[health.tone]}`} />
          <span className="text-xs font-bold opacity-80">コネクション状態</span>
          <span className="text-[17px] font-bold">{health.label}</span>
        </div>
        <div className="mt-1 text-[13px] text-gray-700">{health.message}</div>
        {alerts.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {alerts.map((alert) => (
              <StatusBadge key={alert.label} tone={alert.tone}>
                {alert.label}
              </StatusBadge>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-x-3 xl:grid-cols-2">
        <ConsolePanel title="HikariCP ランタイム">
          <MetricGrid
            items={[
              { label: "プール名", value: data.poolRuntime.poolName || "-", mono: true },
              { label: "総接続数", value: data.poolRuntime.totalConnections },
              { label: "使用中接続数", value: data.poolRuntime.activeConnections },
              { label: "アイドル接続数", value: data.poolRuntime.idleConnections },
              { label: "接続待ちスレッド数", value: data.poolRuntime.threadsAwaitingConnection, tone: data.poolRuntime.threadsAwaitingConnection > 0 ? "ng" : "default" },
              { label: "即時利用可能数", value: data.poolRuntime.immediatelyAvailableConnections },
              { label: "残り余力", value: data.poolRuntime.remainingPoolCapacity },
            ]}
          />
        </ConsolePanel>

        <ConsolePanel title="HikariCP 設定">
          <MetricGrid
            items={[
              { label: "最大プール数", value: data.poolConfig.maximumPoolSize },
              { label: "最小アイドル数", value: data.poolConfig.minimumIdle },
              { label: "接続取得タイムアウト(ms)", value: data.poolConfig.connectionTimeoutMs },
              { label: "バリデーションタイムアウト(ms)", value: data.poolConfig.validationTimeoutMs },
              { label: "アイドルタイムアウト(ms)", value: data.poolConfig.idleTimeoutMs },
              { label: "最大生存時間(ms)", value: data.poolConfig.maxLifetimeMs },
              { label: "リーク検知閾値(ms)", value: data.poolConfig.leakDetectionThresholdMs },
              { label: "autoCommit", value: String(data.poolConfig.autoCommit), mono: true },
              { label: "connectionTestQuery", value: data.poolConfig.connectionTestQuery || "-", mono: true },
            ]}
          />
        </ConsolePanel>

        <ConsolePanel title="PostgreSQL サーバ全体">
          <MetricGrid
            minWidth={200}
            items={[
              { label: "maxConnections", value: data.postgresServer.maxConnections },
              { label: "superuserReservedConnections", value: data.postgresServer.superuserReservedConnections },
              { label: "reservedConnections", value: data.postgresServer.reservedConnections ?? 0 },
              { label: "totalBackendProcesses", value: data.postgresServer.totalBackendProcesses },
              { label: "currentClientConnections", value: data.postgresServer.currentClientConnections },
              { label: "activeConnections", value: data.postgresServer.activeConnections },
              { label: "idleConnections", value: data.postgresServer.idleConnections },
              { label: "idleInTransactionConnections", value: data.postgresServer.idleInTransactionConnections },
              { label: "idleInTransactionAbortedConnections", value: data.postgresServer.idleInTransactionAbortedConnections },
              { label: "waitingConnections", value: data.postgresServer.waitingConnections },
              {
                label: "estimatedAvailableConnections",
                value: data.postgresServer.estimatedAvailableConnections,
                tone: CHIP_TONE[getDbAvailableTone(data.postgresServer.estimatedAvailableConnections)] === "ok" ? "default" : (CHIP_TONE[getDbAvailableTone(data.postgresServer.estimatedAvailableConnections)] as "warn" | "ng"),
              },
            ]}
          />
        </ConsolePanel>

        <ConsolePanel title="現在DB統計">
          <MetricGrid
            minWidth={200}
            items={[
              { label: "numBackends", value: data.currentDatabase.numBackends },
              { label: "currentClientConnections", value: data.currentDatabase.currentClientConnections },
              { label: "activeConnections", value: data.currentDatabase.activeConnections },
              { label: "idleConnections", value: data.currentDatabase.idleConnections },
              { label: "idleInTransactionConnections", value: data.currentDatabase.idleInTransactionConnections },
              { label: "idleInTransactionAbortedConnections", value: data.currentDatabase.idleInTransactionAbortedConnections },
              { label: "waitingConnections", value: data.currentDatabase.waitingConnections },
              { label: "currentUserConnections", value: data.currentDatabase.currentUserConnections },
            ]}
          />
        </ConsolePanel>
      </div>
    </div>
  );
}
