import React, { useEffect, useMemo, useState } from "react";

// ------------------------------------------------------------
// dev.web.api.bm_a028 のレスポンス/リクエストDTOに対応する型
// ------------------------------------------------------------

type ApproveRecipientItem = {
  userId?: number;
  userName?: string;
  chkFlg?: string; // "未確認" | "確認済"
  confirmedTime?: string;
};

type ApproveItem = {
  approveId?: string;
  instructionOrReview?: string; // "指令" | "依頼"
  fromUserId?: number;
  fromUserName?: string;
  targetKind?: string; // "NOTICE" | "SCREEN"
  targetApprovementInfo?: string;
  flowStatus?: string; // 依頼: 申請済/承認/差し戻し/取り消し　指令: 未確認/確認済/差し戻し/取り消し
  comment?: string;
  registerTime?: string;
  updateTime?: string;
  totalRecipientCount?: number;
  confirmedRecipientCount?: number;
  recipients?: ApproveRecipientItem[];
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

// ログイン中ユーザーのロール。JWTのroles(ROLE_ADMIN / ROLE_ADMIN_SUB)を見て
// 親コンポーネント側で解決し、propsとして渡してください。
export type CurrentRole = "ADMIN" | "ADMIN_SUB";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/v1";
// dev.web.controller.AdminApproveController の @RequestMapping("/api/approve") に対応。
// 実際に使っているAPIパスの命名規則(例: /v1/api/admin/...)に合わせて変更してください。
const APPROVE_API_BASE = `${API_BASE}/api/approve`;

const TARGET_KIND_OPTIONS: { value: string; label: string }[] = [
  { value: "SCREEN", label: "画面" },
  { value: "NOTICE", label: "お知らせ" },
];

function targetKindLabel(targetKind?: string): string {
  return TARGET_KIND_OPTIONS.find((o) => o.value === targetKind)?.label ?? targetKind ?? "-";
}

function statusInfo(flowStatus?: string): { label: string; bg: string; fg: string } {
  switch (flowStatus) {
    case "申請済":
    case "未確認":
      return { label: flowStatus, bg: "#dbeafe", fg: "#1d4ed8" };
    case "承認":
    case "確認済":
      return { label: flowStatus, bg: "#dcfce7", fg: "#166534" };
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
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}${txt ? `: ${txt}` : ""}`);
  }
  return (await res.json()) as T;
}

async function sendJsonSafe<T>(url: string, method: "POST" | "PATCH", body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
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

// ------------------------------------------------------------
// モーダル
// ------------------------------------------------------------

type ModalKind = "reviewRequest" | "cancelRequest" | "rejectInstruction" | "cancelInstruction";

type ModalState = {
  kind: ModalKind;
  item: ApproveItem;
};

const MODAL_TITLE: Record<ModalKind, string> = {
  reviewRequest: "依頼の確認",
  cancelRequest: "依頼の取り消し",
  rejectInstruction: "指令の差し戻し",
  cancelInstruction: "指令の取り消し",
};

export default function ApproveFlowPage({ role }: { role: CurrentRole }) {
  const isAdmin = role === "ADMIN";

  const [requests, setRequests] = useState<ApproveItem[]>([]);
  const [instructions, setInstructions] = useState<ApproveItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [runningId, setRunningId] = useState<string | null>(null);

  const [formTargetKind, setFormTargetKind] = useState<string>("SCREEN");
  const [formTargetInfo, setFormTargetInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [modalState, setModalState] = useState<ModalState | null>(null);
  const [modalComment, setModalComment] = useState("");
  const [modalRunning, setModalRunning] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    setMessage("");
    try {
      // /requests, /instructions とも、管理者/担当者いずれでログインしているかをサーバー側
      // (JWTのroles)で判定して返す内容を出し分けている。
      const [reqRes, insRes] = await Promise.all([getJsonSafe<ApproveListResponse>(`${APPROVE_API_BASE}/requests`), getJsonSafe<ApproveListResponse>(`${APPROVE_API_BASE}/instructions`)]);
      setRequests(reqRes.items ?? []);
      setInstructions(insRes.items ?? []);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const sortedRequests = useMemo(() => {
    const rank = (item: ApproveItem) => (item.flowStatus === "申請済" ? 0 : 1);
    return [...requests].sort((a, b) => rank(a) - rank(b));
  }, [requests]);

  const sortedInstructions = useMemo(() => {
    const rank = (item: ApproveItem) => {
      if (isAdmin) {
        if (item.flowStatus === "未確認") return 0;
        if (item.flowStatus === "確認済") return 1;
        return 2;
      }
      return item.confirmedByMe ? 1 : 0;
    };
    return [...instructions].sort((a, b) => rank(a) - rank(b));
  }, [instructions, isAdmin]);

  const openModal = (kind: ModalKind, item: ApproveItem) => {
    setModalState({ kind, item });
    setModalComment("");
  };

  const closeModal = () => {
    if (modalRunning) return;
    setModalState(null);
    setModalComment("");
  };

  const submitCreate = async () => {
    if (!formTargetInfo.trim()) {
      setMessage("対象承認情報を入力してください。");
      return;
    }
    setSubmitting(true);
    setMessage("");
    try {
      const path = isAdmin ? "instructions" : "requests";
      const res = await sendJsonSafe<ApproveActionResponse>(`${APPROVE_API_BASE}/${path}`, "POST", {
        targetKind: formTargetKind,
        targetApprovementInfo: formTargetInfo.trim(),
      });
      setMessage(res.message ?? (isAdmin ? "指令を発行しました。" : "依頼を登録しました。"));
      setFormTargetInfo("");
      await loadAll();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmInstruction = async (item: ApproveItem) => {
    if (!item.approveId) return;
    setRunningId(item.approveId);
    setMessage("");
    try {
      const res = await sendJsonSafe<ApproveActionResponse>(`${APPROVE_API_BASE}/instructions/${item.approveId}/confirm`, "PATCH");
      setMessage(res.message ?? "確認しました。");
      await loadAll();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setRunningId(null);
    }
  };

  const approveFromModal = async () => {
    if (!modalState?.item.approveId) return;
    setModalRunning(true);
    setMessage("");
    try {
      const res = await sendJsonSafe<ApproveActionResponse>(`${APPROVE_API_BASE}/requests/${modalState.item.approveId}/approve`, "PATCH");
      setMessage(res.message ?? "承認しました。");
      setModalState(null);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setModalRunning(false);
      await loadAll();
    }
  };

  const rejectRequestFromModal = async () => {
    if (!modalState?.item.approveId) return;
    if (!modalComment.trim()) {
      setMessage("差し戻す場合はコメントが必須です。");
      return;
    }
    setModalRunning(true);
    setMessage("");
    try {
      const res = await sendJsonSafe<ApproveActionResponse>(`${APPROVE_API_BASE}/requests/${modalState.item.approveId}/reject`, "PATCH", { comment: modalComment.trim() });
      setMessage(res.message ?? "差し戻しました。");
      setModalState(null);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setModalRunning(false);
      await loadAll();
    }
  };

  const runSingleActionModal = async () => {
    if (!modalState?.item.approveId) return;
    const { kind, item } = modalState;
    const commentRequired = kind === "rejectInstruction" || kind === "cancelInstruction";
    if (commentRequired && !modalComment.trim()) {
      setMessage("コメントを入力してください。");
      return;
    }

    setModalRunning(true);
    setMessage("");
    try {
      let path: string;
      if (kind === "cancelRequest") {
        path = `requests/${item.approveId}/cancel`;
      } else if (kind === "rejectInstruction") {
        path = `instructions/${item.approveId}/reject`;
      } else {
        path = `instructions/${item.approveId}/cancel`;
      }
      const comment = modalComment.trim();
      const res = await sendJsonSafe<ApproveActionResponse>(`${APPROVE_API_BASE}/${path}`, "PATCH", {
        comment: comment || undefined,
      });
      setMessage(res.message ?? "更新しました。");
      setModalState(null);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setModalRunning(false);
      await loadAll();
    }
  };

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>承認フロー</h1>
        <div style={{ color: "#6b7280", fontSize: 14 }}>
          {isAdmin ? "担当者からの依頼を承認・差し戻しし、担当者への指令を発行・管理します。" : "管理者からの指令を確認し、管理者への依頼を起票します。"}
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={loadAll} disabled={loading} style={buttonSecondaryStyle}>
          {loading ? "読込中..." : "再読込"}
        </button>
      </div>

      {message && <div style={{ padding: 12, borderRadius: 10, background: "#f3f4f6", color: "#111827", fontSize: 14 }}>{message}</div>}

      <div
        style={{
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          padding: 16,
          display: "grid",
          gap: 12,
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 16 }}>{isAdmin ? "指令を発行する" : "依頼を起票する"}</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <select value={formTargetKind} onChange={(e) => setFormTargetKind(e.target.value)} style={selectStyle}>
            {TARGET_KIND_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <input
            value={formTargetInfo}
            onChange={(e) => setFormTargetInfo(e.target.value)}
            placeholder={formTargetKind === "NOTICE" ? "お知らせID" : "画面名"}
            style={{ ...inputStyle, minWidth: 260 }}
          />
          <button onClick={submitCreate} disabled={submitting} style={buttonPrimaryStyle}>
            {submitting ? "送信中..." : isAdmin ? "指令を発行" : "依頼を起票"}
          </button>
        </div>
      </div>

      {isAdmin ? (
        <SectionCard title="〜依頼一覧〜" count={sortedRequests.length} emptyMessage="依頼はありません。">
          {sortedRequests.map((item) => (
            <RequestRow key={item.approveId} item={item} onOpenReview={() => openModal("reviewRequest", item)} />
          ))}
        </SectionCard>
      ) : (
        <SectionCard title="〜自分の依頼状況〜" count={sortedRequests.length} emptyMessage="起票した依頼はありません。">
          {sortedRequests.map((item) => (
            <MyRequestRow key={item.approveId} item={item} onCancel={() => openModal("cancelRequest", item)} />
          ))}
        </SectionCard>
      )}

      <SectionCard title={isAdmin ? "〜発行した指令一覧〜" : "〜指令一覧〜"} count={sortedInstructions.length} emptyMessage="指令はありません。">
        {sortedInstructions.map((item) =>
          isAdmin ? (
            <AdminInstructionRow key={item.approveId} item={item} onReject={() => openModal("rejectInstruction", item)} onCancel={() => openModal("cancelInstruction", item)} />
          ) : (
            <StaffInstructionRow key={item.approveId} item={item} running={runningId === item.approveId} onConfirm={() => confirmInstruction(item)} />
          ),
        )}
      </SectionCard>

      <ActionModal
        state={modalState}
        comment={modalComment}
        setComment={setModalComment}
        running={modalRunning}
        onClose={closeModal}
        onApprove={approveFromModal}
        onReject={rejectRequestFromModal}
        onSingleAction={runSingleActionModal}
      />
    </div>
  );
}

function SectionCard({ title, count, emptyMessage, children }: { title: string; count: number; emptyMessage: string; children: React.ReactNode }) {
  const childArray = React.Children.toArray(children);

  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
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
        <div style={{ fontWeight: 800, fontSize: 18 }}>{title}</div>
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
          {count}件
        </div>
      </div>

      <div style={{ display: "grid" }}>{childArray.length > 0 ? childArray : <div style={{ padding: 16, color: "#6b7280", fontSize: 14 }}>{emptyMessage}</div>}</div>
    </div>
  );
}

function RequestRow({ item, onOpenReview }: { item: ApproveItem; onOpenReview: () => void }) {
  const status = statusInfo(item.flowStatus);
  const isPending = item.flowStatus === "申請済";

  return (
    <div style={rowGridStyle}>
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
          onClick={onOpenReview}
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
}

function MyRequestRow({ item, onCancel }: { item: ApproveItem; onCancel: () => void }) {
  const status = statusInfo(item.flowStatus);
  const canCancel = item.flowStatus === "申請済";

  return (
    <div style={rowGridStyle}>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>
            {targetKindLabel(item.targetKind)}: {item.targetApprovementInfo ?? "-"}
          </div>
          <span style={badgeStyle(status.bg, status.fg)}>{status.label}</span>
        </div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>
          申請日時: {formatDateTime(item.registerTime)} ／ 更新日時: {formatDateTime(item.updateTime)}
        </div>
        {item.comment && <div style={{ fontSize: 12, color: "#991b1b", marginTop: 4 }}>管理者コメント: {item.comment}</div>}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
        {canCancel && (
          <button onClick={onCancel} style={buttonDangerStyle}>
            取り消す
          </button>
        )}
      </div>
    </div>
  );
}

function AdminInstructionRow({ item, onReject, onCancel }: { item: ApproveItem; onReject: () => void; onCancel: () => void }) {
  const status = statusInfo(item.flowStatus);
  const canAct = item.flowStatus !== "差し戻し" && item.flowStatus !== "取り消し";
  const total = item.totalRecipientCount ?? 0;
  const confirmed = item.confirmedRecipientCount ?? 0;

  return (
    <div style={rowGridStyle}>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>
            {targetKindLabel(item.targetKind)}: {item.targetApprovementInfo ?? "-"}
          </div>
          <span style={badgeStyle(status.bg, status.fg)}>{status.label}</span>
          <span style={badgeStyle("#e5e7eb", "#374151")}>
            {confirmed}/{total}人が確認済み
          </span>
        </div>
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>
          発行日時: {formatDateTime(item.registerTime)} ／ 更新日時: {formatDateTime(item.updateTime)}
        </div>
        {item.recipients && item.recipients.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {item.recipients.map((r) => {
              const rs = statusInfo(r.chkFlg);
              return (
                <span key={r.userId} style={badgeStyle(rs.bg, rs.fg)}>
                  {r.userName ?? r.userId}: {rs.label}
                </span>
              );
            })}
          </div>
        )}
        {item.comment && <div style={{ fontSize: 12, color: "#991b1b", marginTop: 6 }}>コメント: {item.comment}</div>}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
        <button disabled={!canAct} onClick={onReject} style={{ ...buttonSecondaryStyle, opacity: !canAct ? 0.5 : 1, cursor: !canAct ? "default" : "pointer" }}>
          差し戻す
        </button>
        <button disabled={!canAct} onClick={onCancel} style={{ ...buttonDangerStyle, opacity: !canAct ? 0.5 : 1, cursor: !canAct ? "default" : "pointer" }}>
          取り消す
        </button>
      </div>
    </div>
  );
}

function StaffInstructionRow({ item, running, onConfirm }: { item: ApproveItem; running: boolean; onConfirm: () => void }) {
  const status = statusInfo(item.flowStatus);
  const canConfirm = !item.confirmedByMe && item.flowStatus !== "差し戻し" && item.flowStatus !== "取り消し";

  return (
    <div style={rowGridStyle}>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>
            {targetKindLabel(item.targetKind)}: {item.targetApprovementInfo ?? "-"}
          </div>
          <span style={badgeStyle(status.bg, status.fg)}>{status.label}</span>
          {item.confirmedByMe && <span style={badgeStyle("#dcfce7", "#166534")}>確認済み</span>}
        </div>
        <div style={{ fontSize: 14, color: "#374151", marginBottom: 4 }}>発行者: {item.fromUserName ?? item.fromUserId ?? "-"}</div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>
          発行日時: {formatDateTime(item.registerTime)} ／ 更新日時: {formatDateTime(item.updateTime)}
        </div>
        {item.comment && <div style={{ fontSize: 12, color: "#991b1b", marginTop: 4 }}>コメント: {item.comment}</div>}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
        <button
          disabled={!canConfirm || running}
          onClick={onConfirm}
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
}

function ActionModal({
  state,
  comment,
  setComment,
  running,
  onClose,
  onApprove,
  onReject,
  onSingleAction,
}: {
  state: ModalState | null;
  comment: string;
  setComment: (v: string) => void;
  running: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onSingleAction: () => void;
}) {
  if (!state) return null;
  const { kind, item } = state;
  const commentRequired = kind === "rejectInstruction" || kind === "cancelInstruction";

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalBoxStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 12 }}>{MODAL_TITLE[kind]}</div>

        <div style={{ fontSize: 14, color: "#374151", marginBottom: 4 }}>
          対象: {targetKindLabel(item.targetKind)} / {item.targetApprovementInfo ?? "-"}
        </div>
        {kind === "reviewRequest" && <div style={{ fontSize: 14, color: "#374151", marginBottom: 4 }}>申請者: {item.fromUserName ?? item.fromUserId ?? "-"}</div>}
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>申請/発行日時: {formatDateTime(item.registerTime)}</div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={kind === "reviewRequest" ? "コメント（差し戻す場合は必須）" : commentRequired ? "コメント（必須）" : "コメント（任意）"}
          style={textareaStyle}
        />

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
          <button onClick={onClose} disabled={running} style={buttonSecondaryStyle}>
            閉じる
          </button>

          {kind === "reviewRequest" ? (
            <>
              <button onClick={onReject} disabled={running || !comment.trim()} style={{ ...buttonDangerStyle, opacity: running || !comment.trim() ? 0.6 : 1 }}>
                {running ? "処理中..." : "差し戻す"}
              </button>
              <button onClick={onApprove} disabled={running} style={{ ...buttonPrimaryStyle, opacity: running ? 0.6 : 1 }}>
                {running ? "処理中..." : "承認する"}
              </button>
            </>
          ) : (
            <button
              onClick={onSingleAction}
              disabled={running || (commentRequired && !comment.trim())}
              style={{ ...buttonDangerStyle, opacity: running || (commentRequired && !comment.trim()) ? 0.6 : 1 }}
            >
              {running ? "処理中..." : kind === "cancelRequest" ? "取り消す" : kind === "rejectInstruction" ? "差し戻す" : "取り消す"}
            </button>
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

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  fontSize: 14,
};

const selectStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  fontSize: 14,
  background: "white",
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
