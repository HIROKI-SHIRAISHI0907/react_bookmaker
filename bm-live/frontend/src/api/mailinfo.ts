import type { MailInfoFormValues } from "../pages/admin/mail/MailRegisterFormPage";
import { getAccessToken, getTokenType } from "../utils/auth";

export type MailInfoMasterEntity = MailInfoFormValues;

// dev.web.mail.MailSendResponse に対応する型(regMailMasterの戻り値)
type MailSendResponseLike = {
  responseCode?: string;
  message?: string;
  mailSendKey?: string;
};

// dev.web.api.bm_a028.AdminApproveActionResponse に対応する型(承認フロー依頼作成の戻り値)
type ApproveActionResponseLike = {
  responseCode?: string;
  message?: string;
  approveId?: string;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
// dev.web.controller.MailInfoMasterWebController の @RequestMapping("/api/admin") に対応
const MAILINFO_API_BASE = `${API_BASE}/v1/api/admin/mailinfo`;
// dev.web.controller.AdminApproveController の @RequestMapping("/api/approve") に対応
const APPROVE_API_BASE = `${API_BASE}/v1/api/approve`;

/**
 * AdminApproveController#resolveCurrentUser が Authorization: Bearer <token> を
 * 必須にしているため、承認フロー系のAPIを呼ぶ際はこれを付与する必要がある。
 * トークンは utils/auth.ts の authSession(localStorage)から取得する。
 */
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

async function patchJsonSafe<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    credentials: "include",
    body: JSON.stringify(body ?? {}),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok && !(data && typeof data === "object" && "responseCode" in data)) {
    // レスポンスがJSONとして読めない致命的な失敗のみここで例外にする。
    // { responseCode, message } の形で返ってくるエラー(400/404/409等)は
    // 呼び出し元(画面側)がresponseCodeを見て分岐できるよう、そのまま返す。
    throw new Error(`HTTP ${res.status}`);
  }
  return data as T;
}

async function postJsonSafe<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    credentials: "include",
    body: JSON.stringify(body ?? {}),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok && !(data && typeof data === "object" && "responseCode" in data)) {
    throw new Error(`HTTP ${res.status}`);
  }
  return data as T;
}

/** メール情報マスタへ直接登録する(ADMIN用)。PATCH /v1/api/admin/mailinfo */
export async function registerMailInfoApi(values: MailInfoFormValues): Promise<MailSendResponseLike> {
  return patchJsonSafe<MailSendResponseLike>(MAILINFO_API_BASE, values);
}

/** メール情報マスタの内容を更新する。PATCH /v1/api/admin/mailinfo/update */
export async function updateMailInfoApi(values: MailInfoFormValues): Promise<MailSendResponseLike> {
  return patchJsonSafe<MailSendResponseLike>(`${MAILINFO_API_BASE}/update`, values);
}

/** メール情報マスタの一覧を取得する。GET /v1/api/admin/mailinfo */
export async function fetchMailInfoListApi(): Promise<MailInfoMasterEntity[]> {
  return getJsonSafe<MailInfoMasterEntity[]>(MAILINFO_API_BASE);
}

/** メール情報マスタを1件取得する。GET /v1/api/admin/mailinfo/{mailId} */
export async function fetchMailInfoByIdApi(mailId: string): Promise<MailInfoMasterEntity> {
  return getJsonSafe<MailInfoMasterEntity>(`${MAILINFO_API_BASE}/${encodeURIComponent(mailId)}`);
}

/**
 * 【新規】メール情報の登録を、承認フロー経由で管理者に依頼する(ADMIN_SUB用)。
 * POST /v1/api/approve/requests に targetKind="MAIL_INFO" ・
 * targetApprovementInfo=登録内容のJSON文字列、で依頼を起票する。
 * 管理者が承認すると、サーバー側(AdminApproveService#approveRequest)で
 * 実際にメール情報マスタへのinsertが行われる。
 *
 * レスポンス形状は registerMailInfoApi と同じ { responseCode, message } 系のため、
 * 呼び出し元(MailInfoRegisterPage)はどちらのAPIを呼んだかを意識せず同じ分岐で扱える。
 */
export async function requestMailInfoApprovalApi(values: MailInfoFormValues): Promise<ApproveActionResponseLike> {
  return postJsonSafe<ApproveActionResponseLike>(`${APPROVE_API_BASE}/requests`, {
    targetKind: "MAIL_INFO",
    targetApprovementInfo: JSON.stringify(values),
  });
}
