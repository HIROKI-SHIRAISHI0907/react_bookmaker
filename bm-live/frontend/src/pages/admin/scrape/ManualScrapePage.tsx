import { useMutation, useQuery } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";

type ProgressRes = {
  taskId?: string;
  status?: "RUNNING" | "STOPPED" | "NOT_FOUND" | string;
  percent?: number | null;
  teamsDone?: number | null;
  teamsTotal?: number | null;
  logLine?: string | null;
  logTime?: string | null;
  message?: string | null;
};

async function post(url: string) {
  const res = await fetch(url, { method: "POST", credentials: "include" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${text}`);
  }
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${text}`);
  }
  return res.json();
}

export default function ManualScrapePage() {
  const batchCodes = ["B002", "B003", "B004", "B005", "B008", "B009"];
  const [batchCode, setBatchCode] = useState(batchCodes[0]);

  const progressQuery = useQuery({
    queryKey: ["progress", batchCode],
    queryFn: () => getJson<ProgressRes>(`/v1/api/admin/scrape/ecs/${batchCode}/latest/progress`),
    refetchInterval: 5000,
  });

  const isRunning = useMemo(() => progressQuery.data?.status === "RUNNING", [progressQuery.data]);

  const runMutation = useMutation({
    mutationFn: async () => {
      await post(`/v1/api/admin/scrape/ecs/${batchCode}/run`);
    },
    onSuccess: async () => {
      // 起動直後は progress が NOT_FOUND の可能性があるので一旦 refetch
      await progressQuery.refetch();
    },
  });

  return (
    <div style={{ maxWidth: 900 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>スクレイピング管理</h2>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <select value={batchCode} onChange={(e) => setBatchCode(e.target.value)} disabled={runMutation.isPending}>
          {batchCodes.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>

        <button onClick={() => runMutation.mutate()} disabled={runMutation.isPending || isRunning} title={isRunning ? "RUNNING中のため実行できません" : ""}>
          {runMutation.isPending ? "起動中…" : isRunning ? "実行中" : "実行"}
        </button>

        <button onClick={() => progressQuery.refetch()} disabled={progressQuery.isFetching}>
          {progressQuery.isFetching ? "更新中…" : "更新"}
        </button>
      </div>

      {runMutation.isError && <div style={{ color: "#b91c1c" }}>起動エラー: {(runMutation.error as Error).message}</div>}
      {progressQuery.isError && <div style={{ color: "#b91c1c" }}>進捗取得エラー: {(progressQuery.error as Error).message}</div>}

      <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 12, color: "#666" }}>Status</div>
            <div style={{ fontWeight: 800 }}>{progressQuery.data?.status ?? "-"}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#666" }}>Task</div>
            <div style={{ fontWeight: 800 }}>{progressQuery.data?.taskId ?? "-"}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#666" }}>Time</div>
            <div style={{ fontWeight: 800 }}>{progressQuery.data?.logTime ?? "-"}</div>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, color: "#666" }}>Progress</div>
          <div style={{ fontWeight: 800 }}>
            {progressQuery.data?.percent != null
              ? `${progressQuery.data.percent.toFixed(1)}% (${progressQuery.data.teamsDone}/${progressQuery.data.teamsTotal})`
              : (progressQuery.data?.message ?? "進捗情報なし")}
          </div>
          <div style={{ height: 10, background: "#eee", borderRadius: 999, overflow: "hidden", marginTop: 6 }}>
            <div
              style={{
                width: `${Math.min(100, Math.max(0, progressQuery.data?.percent ?? 0))}%`,
                height: "100%",
                background: "#2563eb",
                transition: "width 0.3s",
              }}
            />
          </div>
        </div>

        {progressQuery.data?.logLine && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: "#666" }}>Latest Log</div>
            <pre style={{ background: "#0b1020", color: "#e5e7eb", padding: 10, borderRadius: 8, whiteSpace: "pre-wrap" }}>{progressQuery.data.logLine}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
