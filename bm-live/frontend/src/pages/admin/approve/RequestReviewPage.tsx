import React, { useEffect, useMemo, useState } from "react";

// dev.web.api.bm_a028 のレスポンスDTOに対応する型（依頼のみ扱う）
type ApproveItem = {
  approveId?: string;
  instructionOrReview?: string; // "依頼"
  fromUserId?: number;
  fromUserName?: string;
  targetKind?: string; // "NOTICE" | "SCREEN"
  targetApprovementInfo?: string;
  flowStatus?: string; // 申請済 / 承認 / 差し戻し / 取り消し
  comment?: string;
  registerTime?: string;
  updateTime?: string;
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
    case "申請済":
      return { label: "申請済", bg: "#dbeafe", fg: "#1d4ed8" };
    case "承認":
      return { label: "承認", bg: "#dcfce7", fg: "#166534" };
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

async function patchJsonSafe<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body ?? {}),
  });
  // レスポンスボディはエラー時も含めてJSONとして読む(バックエンドが409等でも
  // { responseCode, message } の形で理由を返してくるため、それをそのまま表示に使う)
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const serverMessage = data && typeof data === "object" && typeof (data as { message?: unknown }).message === "string" ? (data as { message: string }).message : undefined;
    throw new Error(serverMessage ?? `HTTP ${res.status}`);
  }
  return data as T;
}

/**
 * 申請確認画面（管理者専用）。
 * 担当者から届いた依頼を一覧表示し、内容を見ながら承認・差し戻しだけを行う。
 * (依頼の起票は担当者側の画面から行うため、ここには作成フォームは置かない)
 */
export default function RequestReviewPage() {
  const [requests, setRequests] = useState<ApproveItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [reviewing, setReviewing] = useState<ApproveItem | null>(null);
  const [comment, setComment] = useState("");
  const [running, setRunning] = useState(false);

  const loadRequests = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await getJsonSafe<ApproveListResponse>(`${APPROVE_API_BASE}/requests`);
      setRequests(res.items ?? []);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const sortedRequests = useMemo(() => {
    const rank = (item: ApproveItem) => (item.flowStatus === "申請済" ? 0 : 1);
    return [...requests].sort((a, b) => rank(a) - rank(b));
  }, [requests]);

  const pendingCount = useMemo(() => requests.filter((r) => r.flowStatus === "申請済").length, [requests]);

  const openReview = (item: ApproveItem) => {
    setReviewing(item);
    setComment("");
  };

  const closeReview = () => {
    if (running) return;
    setReviewing(null);
    setComment("");
  };

  const approve = async () => {
    if (!reviewing?.approveId) return;
    setRunning(true);
    setMessage("");
    try {
      const res = await patchJsonSafe<ApproveActionResponse>(`${APPROVE_API_BASE}/requests/${reviewing.approveId}/approve`);
      setMessage(res.message ?? "承認しました。");
      setReviewing(null);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
      await loadRequests();
    }
  };

  const reject = async () => {
    if (!reviewing?.approveId) return;
    if (!comment.trim()) {
      setMessage("差し戻す場合はコメントが必須です。");
      return;
    }
    setRunning(true);
    setMessage("");
    try {
      const res = await patchJsonSafe<ApproveActionResponse>(`${APPROVE_API_BASE}/requests/${reviewing.approveId}/reject`, {
        comment: comment.trim(),
      });
      setMessage(res.message ?? "差し戻しました。");
      setReviewing(null);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
      await loadRequests();
    }
  };

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>申請確認画面</h1>
        <div style={{ color: "#6b7280", fontSize: 14 }}>担当者から届いた依頼を確認し、承認または差し戻しを行います。</div>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={loadRequests} disabled={loading} style={buttonSecondaryStyle}>
          {loading ? "読込中..." : "再読込"}
        </button>
        {pendingCount > 0 && <span style={badgeStyle("#fee2e2", "#991b1b")}>対応待ち {pendingCount}件</span>}
      </div>

      {message && <div style={{ padding: 12, borderRadius: 10, background: "#f3f4f6", color: "#111827", fontSize: 14 }}>{message}</div>}

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
          <div style={{ fontWeight: 800, fontSize: 18 }}>〜依頼一覧〜</div>
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
            {sortedRequests.length}件
          </div>
        </div>

        <div style={{ display: "grid" }}>
          {sortedRequests.length === 0 ? (
            <div style={{ padding: 16, color: "#6b7280", fontSize: 14 }}>依頼はありません。</div>
          ) : (
            sortedRequests.map((item) => {
              const status = statusInfo(item.flowStatus);
              const isPending = item.flowStatus === "申請済";
              return (
                <div key={item.approveId} style={rowGridStyle}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>
                        {targetKindLabel(item.targetKind)}: {item.targetApprovementInfo ?? "-"}
                      </div>
                      <span style={badgeStyle(status.bg, status.fg)}>{status.label}</span>
                    </div>
                    <div style={{ fontSize: 14, color: "#374151", marginBottom: 4 }}>申請者: {item.fromUserName ?? item.fromUserId ?? "-"}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      申請日時: {formatDateTime(item.registerTime)} ／ 更新日時: {formatDateTime(item.updateTime)}
                    </div>
                    {item.comment && <div style={{ fontSize: 12, color: "#991b1b", marginTop: 4 }}>コメント: {item.comment}</div>}
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <button
                      disabled={!isPending}
                      onClick={() => openReview(item)}
                      style={{
                        ...buttonPrimaryStyle,
                        opacity: !isPending ? 0.5 : 1,
                        cursor: !isPending ? "default" : "pointer",
                      }}
                    >
                      {isPending ? "承認 / 差し戻し" : "対応済み"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {reviewing && (
        <div style={overlayStyle} onClick={closeReview}>
          <div style={modalBoxStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 12 }}>依頼の確認</div>

            <div style={{ fontSize: 14, color: "#374151", marginBottom: 4 }}>
              対象: {targetKindLabel(reviewing.targetKind)} / {reviewing.targetApprovementInfo ?? "-"}
            </div>
            <div style={{ fontSize: 14, color: "#374151", marginBottom: 4 }}>申請者: {reviewing.fromUserName ?? reviewing.fromUserId ?? "-"}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>申請日時: {formatDateTime(reviewing.registerTime)}</div>

            <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="コメント（差し戻す場合は必須）" style={textareaStyle} />

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
              <button onClick={closeReview} disabled={running} style={buttonSecondaryStyle}>
                閉じる
              </button>
              <button onClick={reject} disabled={running || !comment.trim()} style={{ ...buttonDangerStyle, opacity: running || !comment.trim() ? 0.6 : 1 }}>
                {running ? "処理中..." : "差し戻す"}
              </button>
              <button onClick={approve} disabled={running} style={{ ...buttonPrimaryStyle, opacity: running ? 0.6 : 1 }}>
                {running ? "処理中..." : "承認する"}
              </button>
            </div>
          </div>
        </div>
      )}
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

const textareaStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 90,
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  fontSize: 14,
  resize: "vertical",
  boxSizing: "border-box",
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

const buttonDangerStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "none",
  background: "#dc2626",
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

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(17, 24, 39, 0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 50,
  padding: 16,
};

const modalBoxStyle: React.CSSProperties = {
  background: "white",
  borderRadius: 16,
  padding: 20,
  width: "100%",
  maxWidth: 480,
  boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
};
