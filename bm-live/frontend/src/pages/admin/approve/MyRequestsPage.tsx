import React, { useEffect, useMemo, useState } from "react";
import { getAccessToken, getTokenType } from "../../../utils/auth";
import { targetKindLabel, targetSummaryTitle, targetSummaryDetail, TargetInfoView } from "./targetInfoView";

/**
 * 自分の依頼状況画面（担当者専用）。
 *
 * 自分(ROLE_ADMIN_SUB)が起票した依頼の一覧を確認する画面。
 * GET /api/approve/requests は、担当者としてログインしている場合
 * AdminApproveController#listRequests -> AdminApproveService#getMyRequests で
 * 自動的に「自分が申請した依頼のみ」に絞り込まれて返ってくるため、
 * このページ側で追加のフィルタリングは不要。
 *
 * 申請確認画面(RequestReviewPage.tsx、管理者用)と同じ見た目・操作感に揃えている。
 * こちらでは承認/差し戻しはできず、代わりに
 *  - 取り消す: 申請済のものだけ。ステータスが「取り消し」に変わるだけで履歴には残る。
 *  - 削除する: ステータスを問わず、依頼そのものを完全に削除する(復元不可)。
 * の2つの操作を行える。
 */

type ApproveItem = {
  approveId?: string;
  instructionOrReview?: string; // "依頼"
  fromUserId?: number;
  fromUserName?: string;
  targetKind?: string; // "NOTICE" | "SCREEN" | "MAIL_INFO"
  targetApprovementInfo?: string;
  flowStatus?: string; // 申請済 / 承認 / 差し戻し / 取り消し / 保留
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
const APPROVE_API_BASE = `${API_BASE}/api/approve`;

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
    case "保留":
      return { label: "保留", bg: "#fef3c7", fg: "#92400e" };
    default:
      return { label: flowStatus ?? "-", bg: "#e5e7eb", fg: "#374151" };
  }
}

function formatDateTime(value?: string): string {
  return value ?? "-";
}

function authHeaders(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `${getTokenType()} ${token}` } : {};
}

async function getJsonSafe<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: { ...authHeaders() },
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}${txt ? `: ${txt}` : ""}`);
  }
  return (await res.json()) as T;
}

async function patchJsonSafe<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    credentials: "include",
    body: JSON.stringify(body ?? {}),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const serverMessage = data && typeof data === "object" && typeof (data as { message?: unknown }).message === "string" ? (data as { message: string }).message : undefined;
    throw new Error(serverMessage ?? `HTTP ${res.status}`);
  }
  return data as T;
}

async function deleteJsonSafe<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    method: "DELETE",
    headers: { ...authHeaders() },
    credentials: "include",
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const serverMessage = data && typeof data === "object" && typeof (data as { message?: unknown }).message === "string" ? (data as { message: string }).message : undefined;
    throw new Error(serverMessage ?? `HTTP ${res.status}`);
  }
  return data as T;
}

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<ApproveItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [viewing, setViewing] = useState<ApproveItem | null>(null);
  const [comment, setComment] = useState("");
  const [running, setRunning] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

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

  const openView = (item: ApproveItem) => {
    setViewing(item);
    setComment("");
    setConfirmingDelete(false);
  };

  const closeView = () => {
    if (running) return;
    setViewing(null);
    setComment("");
    setConfirmingDelete(false);
  };

  const cancel = async () => {
    if (!viewing?.approveId) return;
    setRunning(true);
    setMessage("");
    try {
      const res = await patchJsonSafe<ApproveActionResponse>(`${APPROVE_API_BASE}/requests/${viewing.approveId}/cancel`, {
        comment: comment.trim() || undefined,
      });
      setMessage(res.message ?? "依頼を取り消しました。");
      setViewing(null);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
      await loadRequests();
    }
  };

  const remove = async () => {
    if (!viewing?.approveId) return;
    setRunning(true);
    setMessage("");
    try {
      const res = await deleteJsonSafe<ApproveActionResponse>(`${APPROVE_API_BASE}/requests/${viewing.approveId}`);
      setMessage(res.message ?? "依頼を削除しました。");
      setViewing(null);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
      setConfirmingDelete(false);
      await loadRequests();
    }
  };

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>自分の依頼状況</h1>
        <div style={{ color: "#6b7280", fontSize: 14 }}>これまでに自分が起票した依頼の状況を確認できます。</div>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={loadRequests} disabled={loading} style={buttonSecondaryStyle}>
          {loading ? "読込中..." : "再読込"}
        </button>
        {pendingCount > 0 && <span style={badgeStyle("#dbeafe", "#1d4ed8")}>管理者の確認待ち {pendingCount}件</span>}
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
          <div style={{ fontWeight: 800, fontSize: 18 }}>〜自分の依頼一覧〜</div>
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
            <div style={{ padding: 16, color: "#6b7280", fontSize: 14 }}>起票した依頼はありません。</div>
          ) : (
            sortedRequests.map((item) => {
              const status = statusInfo(item.flowStatus);
              const detail = targetSummaryDetail(item);
              return (
                <div key={item.approveId} style={{ ...rowGridStyle, cursor: "pointer" }} onClick={() => openView(item)}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                      <span style={badgeStyle("#e5e7eb", "#374151")}>{targetKindLabel(item.targetKind)}</span>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{targetSummaryTitle(item)}</div>
                      <span style={badgeStyle(status.bg, status.fg)}>{status.label}</span>
                    </div>
                    {detail && <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>{detail}</div>}
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      申請日時: {formatDateTime(item.registerTime)} ／ 更新日時: {formatDateTime(item.updateTime)}
                    </div>
                    {item.comment && <div style={{ fontSize: 12, color: "#991b1b", marginTop: 4 }}>管理者コメント: {item.comment}</div>}
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openView(item);
                      }}
                      style={buttonSecondaryStyle}
                    >
                      詳細を見る
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {viewing && (
        <div style={overlayStyle} onClick={closeView}>
          <div style={modalBoxStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>依頼の詳細</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={badgeStyle("#e5e7eb", "#374151")}>{targetKindLabel(viewing.targetKind)}</span>
              <span style={badgeStyle(statusInfo(viewing.flowStatus).bg, statusInfo(viewing.flowStatus).fg)}>
                {statusInfo(viewing.flowStatus).label}
              </span>
            </div>

            <div style={{ marginBottom: 12 }}>
              <TargetInfoView item={viewing} />
            </div>

            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
              申請日時: {formatDateTime(viewing.registerTime)} ／ 更新日時: {formatDateTime(viewing.updateTime)}
            </div>
            {viewing.comment && <div style={{ fontSize: 13, color: "#991b1b", marginBottom: 12 }}>管理者コメント: {viewing.comment}</div>}

            {confirmingDelete ? (
              <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca" }}>
                <div style={{ fontSize: 14, color: "#991b1b", fontWeight: 700, marginBottom: 4 }}>本当に削除しますか？</div>
                <div style={{ fontSize: 13, color: "#991b1b", marginBottom: 12 }}>
                  この操作は取り消せません。依頼の記録自体が完全に削除されます。
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button onClick={() => setConfirmingDelete(false)} disabled={running} style={buttonSecondaryStyle}>
                    キャンセル
                  </button>
                  <button onClick={remove} disabled={running} style={{ ...buttonDangerStyle, opacity: running ? 0.6 : 1 }}>
                    {running ? "削除中..." : "削除する"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {viewing.flowStatus === "申請済" && (
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="コメント（取り消し理由。任意）"
                    style={textareaStyle}
                  />
                )}

                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16, flexWrap: "wrap" }}>
                  <button onClick={closeView} disabled={running} style={buttonSecondaryStyle}>
                    閉じる
                  </button>
                  <button onClick={() => setConfirmingDelete(true)} disabled={running} style={buttonDangerStyle}>
                    削除する
                  </button>
                  {viewing.flowStatus === "申請済" && (
                    <button onClick={cancel} disabled={running} style={{ ...buttonPrimaryStyle, opacity: running ? 0.6 : 1 }}>
                      {running ? "処理中..." : "取り消す"}
                    </button>
                  )}
                </div>
              </>
            )}
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
  minHeight: 70,
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
  maxWidth: 560,
  maxHeight: "85vh",
  overflowY: "auto",
  boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
};
