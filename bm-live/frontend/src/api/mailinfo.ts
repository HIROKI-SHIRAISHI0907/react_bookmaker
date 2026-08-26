import axios from "axios";
import { apiClient } from "./client";

export type MailInfoMasterEntity = {
  mailId: string;
  mailSubject: string;
  mailBody: string;
  fromAddress: string;
};

export type MailInfoMasterRequest = {
  mailId: string;
  mailSubject: string;
  mailBody: string;
  fromAddress: string;
};

export type MailInfoResponse = {
  responseCode?: string;
  message?: string;
};

function resolveErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || "通信に失敗しました。";
  }
  if (error instanceof Error) return error.message;
  return "通信に失敗しました。";
}

// register/updateは、409（重複）など呼び出し元で分岐したいケースがあるため、
// 失敗時も例外を投げずMailInfoResponseとして正規化して返す。
function toApiResponse(error: unknown): MailInfoResponse {
  if (axios.isAxiosError(error) && error.response?.data) {
    return error.response.data as MailInfoResponse;
  }
  return {
    responseCode: "999",
    message: resolveErrorMessage(error),
  };
}

export async function fetchMailInfoListApi(): Promise<MailInfoMasterEntity[]> {
  try {
    const { data } = await apiClient.get<MailInfoMasterEntity[]>("/v1/api/mailinfo");
    return data ?? [];
  } catch (e) {
    throw new Error(resolveErrorMessage(e));
  }
}

// ※現状のコントローラー（GET /api/mailinfo/{mailId}）は@PathVariableを受け取っておらず、
//   @RequestBodyでmailIdを渡す作りになっています。GETリクエストでボディを送る前提は
//   標準的ではないため、@PathVariable String mailIdを受け取ってservice側にそのまま渡す形に
//   直すことをおすすめします。ここでは直った前提の、パスパラメータのみの呼び出しにしています。
export async function fetchMailInfoByIdApi(mailId: string): Promise<MailInfoMasterEntity> {
  try {
    const { data } = await apiClient.get<MailInfoMasterEntity>(`/v1/api/mailinfo/${encodeURIComponent(mailId)}`);
    return data;
  } catch (e) {
    throw new Error(resolveErrorMessage(e));
  }
}

export async function registerMailInfoApi(payload: MailInfoMasterRequest): Promise<MailInfoResponse> {
  try {
    const { data } = await apiClient.patch<MailInfoResponse>("/v1/api/mailinfo", payload);
    return data;
  } catch (e) {
    return toApiResponse(e);
  }
}

export async function updateMailInfoApi(payload: MailInfoMasterRequest): Promise<MailInfoResponse> {
  try {
    const { data } = await apiClient.patch<MailInfoResponse>("/v1/api/mailinfo/update", payload);
    return data;
  } catch (e) {
    return toApiResponse(e);
  }
}
