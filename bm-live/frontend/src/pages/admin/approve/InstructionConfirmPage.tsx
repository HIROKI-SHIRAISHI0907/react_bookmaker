import React, { useEffect, useMemo, useState } from "react";

// dev.web.api.bm_a028 のレスポンスDTOに対応する型（指令のみ扱う）
type ApproveItem = {
  approveId?: string;
  instructionOrReview?: string; // "指令"
  fromUserId?: number;
  fromUserName?: string;
  targetKind?: string; // "NOTICE" | "SCREEN"
  targetApprovementInfo?: string;
  flowStatus?: string; // 未確認 / 確認済 / 差し戻し / 取り消し
  comment?: string;
  registerTime?: string;
  updateTime?: string;
  confirmedByMe?: boolean;
};

type ApproveListResponse = {
  responseCode?: string;
  message?: string;
  items?: ApproveItem[];
};

type ApproveActionResponse = {
  responseCode?: string;
  message?: string;
  approveId?: string;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/v1";
// dev.web.controller.AdminApproveController の @RequestMapping("/api/approve") に対応。
// 実際に使っているAPIパスの命名規則(例: /v1/api/admin/...)に合わせて変更してください。
const APPROVE_API_BASE = `${API_BASE}/api/approve`;

function targetKindLabel(targetKind?: string): string {
  if (targetKind === "NOTICE") return "お知らせ";
  if (targetKind === "SCREEN") return "画面";
  return targetKind ?? "-";
}

function statusInfo(flowStatus?: string): { label: string; bg: string; fg: string } {
  switch (flowStatus) {
    case "未確認":
      return { label: "未確認", bg: "#dbeafe", fg: "#1d4ed8" };
    case "確認済":
      return { label: "確認済", bg: "#dcfce7", fg: "#166534" };
    case "差し戻し":
      return { label: "差し戻し", bg: "#fee2e2", fg: "#991b1b" };
    case "取り消し":
      return { label: "取り消し", bg: "#e5e7eb", fg: "#374151" };
    default:
      return { label: flowStatus ?? "-", bg: "#e5e7eb", fg: "#374151" };
  }
}

function formatDateTime(value?: string): string {
  return value ?? "-";
}

async function getJsonSafe<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: "GET", credentials: "include" });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}${txt ? `: ${txt}` : ""}`);
  }
  return (await res.json()) as T;
}

async function patchJsonSafe<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({}),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const serverMessage =
      data && typeof data === "object" && typeof (data as { message?: unknown }).message === "string"
        ? (data as { message: string }).message
        : undefined;
    throw new Error(serverMessage ?? `HTTP ${res.status}`);
  }
  return data as T;
}

/**
 * 指令確認画面（担当者専用）。
 * 管理者から届いた指令を一覧表示し、内容を確認するだけの画面
 * (承認/差し戻しのような判断はできず、「確認する」ボタンのみ)。
 */
export default function InstructionConfirmPage() {
  const [instructions, setInstructions] = useState<ApproveItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [runningId, setRunningId] = useState<string | null>(null);

  const loadInstructions = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await getJsonSafe<ApproveListResponse>(`${APPROVE_API_BASE}/instructions`);
      setInstructions(res.items ?? []);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInstructions();
  }, []);

  const sortedInstructions = useMemo(() => {
    const rank = (item: ApproveItem) => (item.confirmedByMe ? 1 : 0);
    return [...instructions].sort((a, b) => rank(a) - rank(b));
  }, [instructions]);

  const unconfirmedCount = useMemo(
    () => instructions.filter((i) => !i.confirmedByMe && i.flowStatus === "未確認").length,
    [instructions]
  );

  const confirm = async (item: ApproveItem) => {
    if (!item.approveId) return;
    setRunningId(item.approveId);
    setMessage("");
    try {
      const res = await patchJsonSafe<ApproveActionResponse>(`${APPROVE_API_BASE}/instructions/${item.approveId}/confirm`);
      setMessage(res.message ?? "確認しました。");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setRunningId(null);
      await loadInstructions();
    }
  };

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>指令確認画面</h1>
        <div style={{ color: "#6b7280", fontSize: 14 }}>管理者から届いた指令を確認します。</div>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={loadInstructions} disabled={loading} style={buttonSecondaryStyle}>
          {loading ? "読込中..." : "再読込"}
        </button>
        {unconfirmedCount > 0 && <span style={badgeStyle("#fee2e2", "#991b1b")}>未確認 {unconfirmedCount}件</span>}
      </div>

      {message && (
        <div style={{ padding: 12, borderRadius: 10, background: "#f3f4f6", color: "#111827", fontSize: 14 }}>{message}</div>
      )}

      <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden" }}>
        <div
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid #f3f4f6",
            background: "#f9fafb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 18 }}>〜指令一覧〜</div>
          <div
            style={{
              fontSize: 12,
              padding: "4px 10px",
              borderRadius: 999,
              background: "#e5e7eb",
              color: "#374151",
              fontWeight: 700,
            }}
          >
            {sortedInstructions.length}件
          </div>
        </div>

        <div style={{ display: "grid" }}>
          {sortedInstructions.length === 0 ? (
            <div style={{ padding: 16, color: "#6b7280", fontSize: 14 }}>指令はありません。</div>
          ) : (
            sortedInstructions.map((item) => {
              const status = statusInfo(item.flowStatus);
              const canConfirm = !item.confirmedByMe && item.flowStatus !== "差し戻し" && item.flowStatus !== "取り消し";
              const running = runningId === item.approveId;
              return (
                <div key={item.approveId} style={rowGridStyle}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>
                        {targetKindLabel(item.targetKind)}: {item.targetApprovementInfo ?? "-"}
                      </div>
                      <span style={badgeStyle(status.bg, status.fg)}>{status.label}</span>
                      {item.confirmedByMe && <span style={badgeStyle("#dcfce7", "#166534")}>確認済み</span>}
                    </div>
                    <div style={{ fontSize: 14, color: "#374151", marginBottom: 4 }}>
                      発行者: {item.fromUserName ?? item.fromUserId ?? "-"}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      発行日時: {formatDateTime(item.registerTime)} ／ 更新日時: {formatDateTime(item.updateTime)}
                    </div>
                    {item.comment && <div style={{ fontSize: 12, color: "#991b1b", marginTop: 4 }}>コメント: {item.comment}</div>}
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <button
                      disabled={!canConfirm || running}
                      onClick={() => confirm(item)}
                      style={{
                        ...buttonPrimaryStyle,
                        opacity: !canConfirm ? 0.5 : 1,
                        cursor: !canConfirm || running ? "default" : "pointer",
                      }}
                    >
                      {running ? "処理中..." : item.confirmedByMe ? "確認済み" : "確認する"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function badgeStyle(bg: string, fg: string): React.CSSProperties {
  return {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    background: bg,
    color: fg,
  };
}

const rowGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: 16,
  alignItems: "center",
  padding: 16,
  borderTop: "1px solid #f3f4f6",
};

const buttonPrimaryStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "none",
  background: "#2563eb",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};

const buttonSecondaryStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  background: "white",
  color: "#111827",
  fontWeight: 700,
  cursor: "pointer",
};
