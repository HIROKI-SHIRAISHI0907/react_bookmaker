import React, { useEffect, useState } from "react";

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
  measuredAt: string;
  databaseName: string;
  poolRuntime: PoolRuntimeMetrics;
  poolConfig: PoolConfigMetrics;
  postgresServer: PostgresServerMetrics;
  currentDatabase: CurrentDatabaseMetrics;
};

const emptyData: DbConnectionStatusResponse = {
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
  icon: string;
  color: string;
  background: string;
  borderColor: string;
  message: string;
};

type ConnectionAlert = {
  icon: string;
  label: string;
  color: string;
  background: string;
};

function getConnectionHealth(data: DbConnectionStatusResponse): ConnectionHealth {
  const maxPool = Math.max(data.poolConfig.maximumPoolSize || 0, 1);
  const active = data.poolRuntime.activeConnections || 0;
  const immediateAvailable = data.poolRuntime.immediatelyAvailableConnections || 0;
  const waitingThreads = data.poolRuntime.threadsAwaitingConnection || 0;
  const dbAvailable = data.postgresServer.estimatedAvailableConnections || 0;

  const usageRate = active / maxPool;
  const nearExhaustedThreshold = Math.max(1, Math.floor(maxPool * 0.1));
  const warningThreshold = Math.max(2, Math.floor(maxPool * 0.25));

  const idleInTx = (data.currentDatabase.idleInTransactionConnections || 0) + (data.currentDatabase.idleInTransactionAbortedConnections || 0);

  if (waitingThreads > 0 || immediateAvailable <= 0 || dbAvailable <= 0) {
    return {
      level: "exhausted",
      label: "枯渇状態",
      icon: "🔴",
      color: "#b91c1c",
      background: "#fef2f2",
      borderColor: "#fecaca",
      message: "接続待ちが発生しているか、即時利用可能な接続がありません。業務影響が出る可能性があります。",
    };
  }

  if (immediateAvailable <= nearExhaustedThreshold || usageRate >= 0.9 || dbAvailable <= 3) {
    return {
      level: "near_exhausted",
      label: "そろそろ枯渇",
      icon: "🟠",
      color: "#c2410c",
      background: "#fff7ed",
      borderColor: "#fdba74",
      message: "接続余力がかなり少ない状態です。少し負荷が上がると枯渇するおそれがあります。",
    };
  }

  if (immediateAvailable <= warningThreshold || usageRate >= 0.75 || idleInTx >= 3) {
    return {
      level: "warning",
      label: "注意",
      icon: "🟡",
      color: "#a16207",
      background: "#fefce8",
      borderColor: "#fde68a",
      message: "接続使用率が高めです。継続すると逼迫に近づくため監視強化をおすすめします。",
    };
  }

  if (idleInTx > 0) {
    return {
      level: "watch",
      label: "監視中",
      icon: "🔵",
      color: "#1d4ed8",
      background: "#eff6ff",
      borderColor: "#bfdbfe",
      message: "接続余力はありますが、idle in transaction が存在します。接続閉じ忘れやトランザクション長期化に注意してください。",
    };
  }

  return {
    level: "healthy",
    label: "正常",
    icon: "🟢",
    color: "#15803d",
    background: "#f0fdf4",
    borderColor: "#bbf7d0",
    message: "現在のところ、コネクションプールとDB接続数は安定しています。",
  };
}

function getConnectionAlerts(data: DbConnectionStatusResponse): ConnectionAlert[] {
  const alerts: ConnectionAlert[] = [];

  const maxPool = Math.max(data.poolConfig.maximumPoolSize || 0, 1);
  const active = data.poolRuntime.activeConnections || 0;
  const waitingThreads = data.poolRuntime.threadsAwaitingConnection || 0;
  const immediateAvailable = data.poolRuntime.immediatelyAvailableConnections || 0;
  const usageRate = active / maxPool;

  const idleInTx = data.currentDatabase.idleInTransactionConnections || 0;
  const idleInTxAborted = data.currentDatabase.idleInTransactionAbortedConnections || 0;

  if (waitingThreads > 0) {
    alerts.push({
      icon: "⏳",
      label: `接続待ち発生 ${waitingThreads}件`,
      color: "#991b1b",
      background: "#fef2f2",
    });
  }

  if (immediateAvailable <= Math.max(1, Math.floor(maxPool * 0.1))) {
    alerts.push({
      icon: "🚨",
      label: `即時利用可能が少ない (${immediateAvailable})`,
      color: "#9a3412",
      background: "#fff7ed",
    });
  }

  if (usageRate >= 0.9) {
    alerts.push({
      icon: "📈",
      label: `プール使用率高 (${Math.round(usageRate * 100)}%)`,
      color: "#9a3412",
      background: "#fff7ed",
    });
  } else if (usageRate >= 0.75) {
    alerts.push({
      icon: "📊",
      label: `プール使用率注意 (${Math.round(usageRate * 100)}%)`,
      color: "#854d0e",
      background: "#fefce8",
    });
  }

  if (idleInTx > 0) {
    alerts.push({
      icon: "🧵",
      label: `idle in transaction ${idleInTx}件`,
      color: "#1d4ed8",
      background: "#eff6ff",
    });
  }

  if (idleInTxAborted > 0) {
    alerts.push({
      icon: "💥",
      label: `idle in transaction (aborted) ${idleInTxAborted}件`,
      color: "#991b1b",
      background: "#fef2f2",
    });
  }

  if (data.postgresServer.estimatedAvailableConnections <= 3) {
    alerts.push({
      icon: "🗄️",
      label: `DB全体の空き接続が少ない (${data.postgresServer.estimatedAvailableConnections})`,
      color: "#9a3412",
      background: "#fff7ed",
    });
  }

  return alerts;
}

export default function DbConnectionStatusPage() {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [data, setData] = useState<DbConnectionStatusResponse>(emptyData);

  const load = async () => {
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

      const json = (await response.json()) as DbConnectionStatusResponse;
      setData(json);
    } catch (error) {
      console.error(error);
      setErrorMessage("DBコネクション監視情報の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const health = getConnectionHealth(data);
  const alerts = getConnectionAlerts(data);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 24 }}>DBコネクション監視</h1>
          <p style={{ margin: "8px 0 0", color: "#6b7280" }}>HikariCP のプール状態と PostgreSQL の接続統計を表示します。</p>
        </div>

        <button
          type="button"
          onClick={load}
          disabled={loading}
          style={{
            border: "1px solid #d1d5db",
            background: "#fff",
            padding: "10px 14px",
            borderRadius: 10,
            cursor: loading ? "default" : "pointer",
            fontWeight: 700,
          }}
        >
          {loading ? "更新中..." : "再読込"}
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        }}
      >
        <SummaryCard title="計測日時" value={data.measuredAt || "-"} />
        <SummaryCard title="DB名" value={data.databaseName || "-"} />
        <SummaryCard
          title="即時利用可能"
          value={String(data.poolRuntime.immediatelyAvailableConnections)}
          tone={
            data.poolRuntime.immediatelyAvailableConnections <= 0
              ? "danger"
              : data.poolRuntime.immediatelyAvailableConnections <= Math.max(1, Math.floor((data.poolConfig.maximumPoolSize || 1) * 0.25))
                ? "warn"
                : "good"
          }
        />
        <SummaryCard title="接続待ちスレッド" value={String(data.poolRuntime.threadsAwaitingConnection)} tone={data.poolRuntime.threadsAwaitingConnection > 0 ? "danger" : "good"} />
        <SummaryCard
          title="DB概算空き接続"
          value={String(data.postgresServer.estimatedAvailableConnections)}
          tone={data.postgresServer.estimatedAvailableConnections <= 0 ? "danger" : data.postgresServer.estimatedAvailableConnections <= 3 ? "warn" : "good"}
        />
      </div>
      <div
        style={{
          border: `1px solid ${health.borderColor}`,
          background: health.background,
          borderRadius: 12,
          padding: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontSize: 34, lineHeight: 1 }}>{health.icon}</div>

          <div style={{ flex: 1, minWidth: 240 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: health.color,
              }}
            >
              コネクション状態
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: health.color,
                marginTop: 4,
              }}
            >
              {health.label}
            </div>
            <div
              style={{
                marginTop: 8,
                color: "#374151",
                lineHeight: 1.6,
              }}
            >
              {health.message}
            </div>
          </div>
        </div>

        {alerts.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginTop: 14,
            }}
          >
            {alerts.map((alert) => (
              <span
                key={`${alert.icon}-${alert.label}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 10px",
                  borderRadius: 999,
                  background: alert.background,
                  color: alert.color,
                  fontSize: 13,
                  fontWeight: 700,
                  border: "1px solid rgba(0,0,0,0.06)",
                }}
              >
                <span>{alert.icon}</span>
                <span>{alert.label}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {errorMessage && (
        <div
          style={{
            border: "1px solid #fecaca",
            background: "#fef2f2",
            color: "#991b1b",
            borderRadius: 10,
            padding: 12,
          }}
        >
          {errorMessage}
        </div>
      )}

      <Section title="HikariCP ランタイム">
        <MetricGrid
          items={[
            ["プール名", data.poolRuntime.poolName || "-"],
            ["総接続数", data.poolRuntime.totalConnections],
            ["使用中接続数", data.poolRuntime.activeConnections],
            ["アイドル接続数", data.poolRuntime.idleConnections],
            ["接続待ちスレッド数", data.poolRuntime.threadsAwaitingConnection],
            ["即時利用可能数", data.poolRuntime.immediatelyAvailableConnections],
            ["残り余力", data.poolRuntime.remainingPoolCapacity],
          ]}
        />
      </Section>

      <Section title="HikariCP 設定">
        <MetricGrid
          items={[
            ["最大プール数", data.poolConfig.maximumPoolSize],
            ["最小アイドル数", data.poolConfig.minimumIdle],
            ["接続取得タイムアウト(ms)", data.poolConfig.connectionTimeoutMs],
            ["バリデーションタイムアウト(ms)", data.poolConfig.validationTimeoutMs],
            ["アイドルタイムアウト(ms)", data.poolConfig.idleTimeoutMs],
            ["最大生存時間(ms)", data.poolConfig.maxLifetimeMs],
            ["リーク検知閾値(ms)", data.poolConfig.leakDetectionThresholdMs],
            ["autoCommit", String(data.poolConfig.autoCommit)],
            ["connectionTestQuery", data.poolConfig.connectionTestQuery || "-"],
          ]}
        />
      </Section>

      <Section title="PostgreSQL サーバ全体">
        <MetricGrid
          items={[
            ["maxConnections", data.postgresServer.maxConnections],
            ["superuserReservedConnections", data.postgresServer.superuserReservedConnections],
            ["reservedConnections", data.postgresServer.reservedConnections ?? 0],
            ["totalBackendProcesses", data.postgresServer.totalBackendProcesses],
            ["currentClientConnections", data.postgresServer.currentClientConnections],
            ["activeConnections", data.postgresServer.activeConnections],
            ["idleConnections", data.postgresServer.idleConnections],
            ["idleInTransactionConnections", data.postgresServer.idleInTransactionConnections],
            ["idleInTransactionAbortedConnections", data.postgresServer.idleInTransactionAbortedConnections],
            ["waitingConnections", data.postgresServer.waitingConnections],
            ["estimatedAvailableConnections", data.postgresServer.estimatedAvailableConnections],
          ]}
        />
      </Section>

      <Section title="現在DB統計">
        <MetricGrid
          items={[
            ["numBackends", data.currentDatabase.numBackends],
            ["currentClientConnections", data.currentDatabase.currentClientConnections],
            ["activeConnections", data.currentDatabase.activeConnections],
            ["idleConnections", data.currentDatabase.idleConnections],
            ["idleInTransactionConnections", data.currentDatabase.idleInTransactionConnections],
            ["idleInTransactionAbortedConnections", data.currentDatabase.idleInTransactionAbortedConnections],
            ["waitingConnections", data.currentDatabase.waitingConnections],
            ["currentUserConnections", data.currentDatabase.currentUserConnections],
          ]}
        />
      </Section>
    </div>
  );
}

function SummaryCard({ title, value, tone = "default" }: { title: string; value: string; tone?: "default" | "good" | "warn" | "danger" }) {
  const toneStyle =
    tone === "good"
      ? {
          borderColor: "#bbf7d0",
          background: "#f0fdf4",
        }
      : tone === "warn"
        ? {
            borderColor: "#fde68a",
            background: "#fefce8",
          }
        : tone === "danger"
          ? {
              borderColor: "#fecaca",
              background: "#fef2f2",
            }
          : {
              borderColor: "#e5e7eb",
              background: "#fff",
            };

  return (
    <div
      style={{
        border: `1px solid ${toneStyle.borderColor}`,
        borderRadius: 12,
        padding: 16,
        background: toneStyle.background,
        minWidth: 180,
      }}
    >
      <div style={{ fontSize: 12, color: "#6b7280" }}>{title}</div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 800,
          marginTop: 6,
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        background: "#fff",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid #e5e7eb",
          fontWeight: 800,
        }}
      >
        {title}
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

function MetricGrid({ items }: { items: Array<[string, string | number]> }) {
  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      }}
    >
      {items.map(([label, value]) => (
        <div
          key={label}
          style={{
            border: "1px solid #f3f4f6",
            borderRadius: 10,
            padding: 12,
            background: "#fafafa",
          }}
        >
          <div style={{ fontSize: 12, color: "#6b7280" }}>{label}</div>
          <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>{String(value)}</div>
        </div>
      ))}
    </div>
  );
}
