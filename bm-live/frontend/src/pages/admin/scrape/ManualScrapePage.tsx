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

type S3PrefixScope = "DEFAULT" | "ROOT" | "PARENT" | "CUSTOM";

type S3FileCountRequest = {
  batchCode: string;
  day?: string | null;
  scope?: S3PrefixScope | null;
  prefixOverride?: string | null;
};

type S3FileCountResponse = {
  batchCode?: string;
  bucket?: string | null;
  prefix?: string | null;
  recursive?: boolean | null;
  dayJst?: string | null;
  totalCount?: number | null;
  countOnDay?: number | null;
  message?: string | null;
};

type S3FileListRequest = {
  batchCode: string;
  scope?: S3PrefixScope | null;
  prefixOverride?: string | null;
  recursiveOverride?: boolean | null;
  limit?: number | null;
};

type S3FileListResponse = {
  batchCode: string;
  bucket: string;
  prefix: string;
  recursive: boolean;
  returnedCount: number;
  message: string;
  items: Array<{
    key: string;
    size: number;
    lastModifiedIso: string;
  }>;
};

const COUNT_URL = `/v1/api/admin/s3/files/count`;
const LIST_URL = `/v1/api/admin/s3/files/list`;

async function postNoBody(url: string) {
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

async function postJson<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: body != null ? { "Content-Type": "application/json" } : undefined,
    body: body != null ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${text}`);
  }
  return res.json();
}

function ConfirmModal(props: {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onClose: () => void;
  isLoading?: boolean;
  confirmDisabled?: boolean;
}) {
  const { open, title = "確認", message, confirmText = "OK", cancelText = "キャンセル", onConfirm, onClose, isLoading, confirmDisabled } = props;

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 9999,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(520px, 100%)",
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          padding: 16,
          boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>{title}</div>
        <div style={{ color: "#374151", marginBottom: 16, whiteSpace: "pre-wrap" }}>{message}</div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onClose} disabled={isLoading}>
            {cancelText}
          </button>
          <button onClick={onConfirm} disabled={isLoading || confirmDisabled} style={{ fontWeight: 800 }} title={confirmDisabled ? "条件を満たしていないため実行できません" : ""}>
            {isLoading ? "処理中…" : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ManualScrapePage() {
  const batchCodes = ["B002", "B003", "B004", "B005", "B007", "B008", "B009"];
  const [batchCode, setBatchCode] = useState(batchCodes[0]);

  // ===== Progress =====
  const progressQuery = useQuery({
    queryKey: ["progress", batchCode],
    queryFn: () => getJson<ProgressRes>(`/v1/api/admin/scrape/ecs/${batchCode}/latest/progress`),
    refetchInterval: 5000,
  });

  const isRunning = useMemo(() => progressQuery.data?.status === "RUNNING", [progressQuery.data]);

  // ===== Run =====
  const runMutation = useMutation({
    mutationFn: async () => {
      await postNoBody(`/v1/api/admin/scrape/ecs/${batchCode}/run`);
    },
    onSuccess: async () => {
      await progressQuery.refetch();
    },
  });

  // ===== B007 Master Register =====
  const isB007 = batchCode === "B007";
  const [scope, setScope] = useState<S3PrefixScope>("DEFAULT");
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);

  // S3 count/list request（参考実装に合わせる）
  const countReq = useMemo<S3FileCountRequest>(
    () => ({
      batchCode,
      scope,
      day: null, // 日付を使う場合はここを string にする
    }),
    [batchCode, scope],
  );

  const listReq = useMemo<S3FileListRequest>(
    () => ({
      batchCode,
      scope,
      limit: 100,
      // 必要なら上書き指定できる
      // recursiveOverride: true,
      // prefixOverride: "some/prefix/",
    }),
    [batchCode, scope],
  );

  const s3CountQuery = useQuery({
    queryKey: ["s3-file-count", countReq],
    enabled: isB007,
    queryFn: () => postJson<S3FileCountResponse>(COUNT_URL, countReq),
    refetchInterval: isB007 ? 15000 : false,
  });

  const s3ListQuery = useQuery({
    queryKey: ["s3-file-list", listReq],
    enabled: isB007,
    queryFn: () => postJson<S3FileListResponse>(LIST_URL, listReq),
    refetchInterval: isB007 ? 15000 : false,
  });

  const csvItems = useMemo(() => {
    const items = s3ListQuery.data?.items ?? [];
    return items.filter((it) => it.key.toLowerCase().endsWith(".csv"));
  }, [s3ListQuery.data]);

  const canRegisterMaster = isB007 && csvItems.length === 1;

  const masterMutation = useMutation({
    mutationFn: async () => {
      // もし backend が CSVキー等を要求するなら、ここで body に渡す
      // await postJson(`/v1/api/all-league-scrape-master`, { batchCode, s3Key: csvItems[0].key });
      await postJson(`/v1/api/admin/exec/task/all-league-scrape-master`, {});
    },
    onSuccess: async () => {
      setIsMasterModalOpen(false);
      await Promise.all([progressQuery.refetch(), s3CountQuery.refetch(), s3ListQuery.refetch()]);
    },
  });

  const busy = runMutation.isPending || masterMutation.isPending;

  return (
    <div style={{ maxWidth: 980 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>スクレイピング管理</h2>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ fontSize: 12, color: "#666" }}>Batch</div>
          <select value={batchCode} onChange={(e) => setBatchCode(e.target.value)} disabled={busy}>
            {batchCodes.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {isB007 && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ fontSize: 12, color: "#666" }}>Prefix</div>
            <select value={scope} onChange={(e) => setScope(e.target.value as S3PrefixScope)} disabled={busy}>
              <option value="DEFAULT">json/（DEFAULT）</option>
              <option value="ROOT">ルート（ROOT）</option>
              {/* 必要なら */}
              {/* <option value="PARENT">PARENT</option>
              <option value="CUSTOM">CUSTOM</option> */}
            </select>
          </div>
        )}

        <button onClick={() => runMutation.mutate()} disabled={runMutation.isPending || isRunning || masterMutation.isPending} title={isRunning ? "RUNNING中のため実行できません" : ""}>
          {runMutation.isPending ? "起動中…" : isRunning ? "実行中" : "実行"}
        </button>

        <button onClick={() => progressQuery.refetch()} disabled={progressQuery.isFetching || busy}>
          {progressQuery.isFetching ? "更新中…" : "更新"}
        </button>

        {isB007 && (
          <>
            <button
              onClick={() => {
                s3CountQuery.refetch();
                s3ListQuery.refetch();
              }}
              disabled={busy || s3CountQuery.isFetching || s3ListQuery.isFetching}
              title="S3のファイル状況を再取得します"
            >
              {s3CountQuery.isFetching || s3ListQuery.isFetching ? "S3確認中…" : "S3確認"}
            </button>

            <button
              onClick={() => setIsMasterModalOpen(true)}
              disabled={busy || isRunning || !canRegisterMaster}
              title={isRunning ? "RUNNING中はマスタ登録できません" : !canRegisterMaster ? "S3にcsvがちょうど1つ必要です" : ""}
            >
              マスタ登録
            </button>

            <div style={{ fontSize: 12 }}>
              判定: <span style={{ fontWeight: 800, color: canRegisterMaster ? "#065f46" : "#b91c1c" }}>{canRegisterMaster ? "OK（csv=1）" : `NG（csv=${csvItems.length}）`}</span>
            </div>
          </>
        )}
      </div>

      {runMutation.isError && <div style={{ color: "#b91c1c", marginBottom: 10 }}>起動エラー: {(runMutation.error as Error).message}</div>}
      {progressQuery.isError && <div style={{ color: "#b91c1c", marginBottom: 10 }}>進捗取得エラー: {(progressQuery.error as Error).message}</div>}
      {masterMutation.isError && <div style={{ color: "#b91c1c", marginBottom: 10 }}>マスタ登録エラー: {(masterMutation.error as Error).message}</div>}

      {/* ===== Progress Panel ===== */}
      <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 12, color: "#666" }}>Status</div>
            <div style={{ fontWeight: 900 }}>{progressQuery.data?.status ?? "-"}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#666" }}>Task</div>
            <div style={{ fontWeight: 900 }}>{progressQuery.data?.taskId ?? "-"}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#666" }}>Time</div>
            <div style={{ fontWeight: 900 }}>{progressQuery.data?.logTime ?? "-"}</div>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, color: "#666" }}>Progress</div>
          <div style={{ fontWeight: 900 }}>
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

      {/* ===== S3 Panel（B007 only） ===== */}
      {isB007 && (
        <div style={{ marginTop: 14, border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "baseline" }}>
            <div style={{ fontWeight: 900 }}>S3 成果物確認（B007）</div>
            <div style={{ fontSize: 12, color: "#666" }}>
              {s3CountQuery.data?.bucket ?? "-"} / {s3CountQuery.data?.prefix ?? "-"} / recursive: {String(s3CountQuery.data?.recursive ?? "-")}
            </div>
          </div>

          {(s3CountQuery.isError || s3ListQuery.isError) && (
            <div style={{ color: "#b91c1c", marginTop: 10 }}>S3取得エラー: {((s3CountQuery.error as Error)?.message || (s3ListQuery.error as Error)?.message) ?? "unknown"}</div>
          )}

          <div style={{ marginTop: 12, display: "flex", gap: 18, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 12, color: "#666" }}>Total（prefix配下）</div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>{typeof s3CountQuery.data?.totalCount === "number" ? s3CountQuery.data.totalCount.toLocaleString() : "-"}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#666" }}>指定日（countOnDay）</div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>{typeof s3CountQuery.data?.countOnDay === "number" ? s3CountQuery.data.countOnDay.toLocaleString() : "-"}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#666" }}>CSV files</div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>{csvItems.length.toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#666" }}>Returned（list）</div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>{typeof s3ListQuery.data?.returnedCount === "number" ? s3ListQuery.data.returnedCount.toLocaleString() : "-"}</div>
            </div>
          </div>

          {s3CountQuery.data?.message && <div style={{ marginTop: 10, fontSize: 12, color: "#374151" }}>{s3CountQuery.data.message}</div>}
          {s3ListQuery.data?.message && <div style={{ marginTop: 10, fontSize: 12, color: "#374151" }}>{s3ListQuery.data.message}</div>}

          {/* list table */}
          <div style={{ overflow: "auto", marginTop: 10 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", background: "#fafafa" }}>
                  <th style={{ padding: 8, minWidth: 520 }}>key</th>
                  <th style={{ padding: 8, minWidth: 160 }}>size</th>
                  <th style={{ padding: 8, minWidth: 220 }}>lastModifiedIso</th>
                </tr>
              </thead>
              <tbody>
                {(s3ListQuery.data?.items ?? []).map((it) => {
                  const isCsv = it.key.toLowerCase().endsWith(".csv");
                  return (
                    <tr key={it.key} style={{ borderBottom: "1px solid #f3f4f6", background: isCsv ? "#f0f9ff" : "#fff" }}>
                      <td style={{ padding: 8, wordBreak: "break-all" }}>{it.key}</td>
                      <td style={{ padding: 8 }}>{typeof it.size === "number" ? it.size.toLocaleString() : "-"}</td>
                      <td style={{ padding: 8 }}>{it.lastModifiedIso ?? "-"}</td>
                    </tr>
                  );
                })}
                {(s3ListQuery.data?.items ?? []).length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ padding: 10, fontSize: 12, color: "#666" }}>
                      ファイルがありません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {!canRegisterMaster && (
            <div style={{ marginTop: 10, fontSize: 12, color: "#b91c1c", fontWeight: 700 }}>マスタ登録するには、S3に csv がちょうど 1つ存在する必要があります（現在: {csvItems.length}）。</div>
          )}
        </div>
      )}

      {/* ===== Confirm Modal ===== */}
      <ConfirmModal
        open={isMasterModalOpen}
        title="マスタ登録"
        message={canRegisterMaster ? `マスタに登録しますか？\n対象CSV: ${csvItems[0]?.key ?? ""}` : `マスタ登録できません。\nS3に csv がちょうど 1つ必要です（現在: ${csvItems.length}）。`}
        onClose={() => {
          if (!masterMutation.isPending) setIsMasterModalOpen(false);
        }}
        onConfirm={() => masterMutation.mutate()}
        isLoading={masterMutation.isPending}
        confirmText="登録する"
        cancelText="やめる"
        confirmDisabled={!canRegisterMaster}
      />
    </div>
  );
}
