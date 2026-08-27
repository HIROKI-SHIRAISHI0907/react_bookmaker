import axios from "axios";
import { apiClient } from "./client";
import { saveAuth } from "../utils/auth";

export type AuthResponse = {
  responseCode?: string;
  responseMessage?: string;
  message?: string;
  userId?: number;
  accessToken?: string;
  authFlg?: number;
  tokenType?: string;
  issuedAtEpochSecond?: number;
  expiresAtEpochSecond?: number;
  roles?: string[];
  email?: string;
  name?: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type SignUpRequest = {
  name: string;
  email: string;
  password: string;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type ResetPasswordValidateRequest = {
  key: string;
};

export type ResetPasswordRequest = {
  key: string;
  newPassword: string;
};

// バリデーションAPI・再設定APIは、期限切れ/使用済み/無効をresponseCodeで
// 呼び出し元に判定させたいので、失敗時も例外を投げずAuthResponseとして正規化して返す。
// （login/signup/forgotPasswordのように失敗を例外に丸めてしまうと、
//   responseCodeの情報が失われてしまうため、あえて挙動を変えています）
function toApiResponse(error: unknown): AuthResponse {
  if (axios.isAxiosError(error) && error.response?.data) {
    return error.response.data as AuthResponse;
  }
  return {
    responseCode: "999",
    responseMessage: resolveErrorMessage(error),
  };
}

export async function validateResetTokenApi(payload: ResetPasswordValidateRequest): Promise<AuthResponse> {
  try {
    const { data } = await apiClient.get<AuthResponse>("/v1/api/auth/reset-password/validate", {
      params: payload,
    });
    return data;
  } catch (e) {
    return toApiResponse(e);
  }
}

export async function resetPasswordApi(payload: ResetPasswordRequest): Promise<AuthResponse> {
  try {
    const { data } = await apiClient.post<AuthResponse>("/v1/api/auth/reset-password", payload);
    return data;
  } catch (e) {
    return toApiResponse(e);
  }
}

function resolveErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.responseMessage || error.response?.data?.message || error.message || "通信に失敗しました。";
  }
  if (error instanceof Error) return error.message;
  return "通信に失敗しました。";
}

export async function loginApi(payload: LoginRequest): Promise<AuthResponse> {
  try {
    const { data } = await apiClient.post<AuthResponse>("/v1/api/auth/login", payload);

    if (!data.accessToken) {
      throw new Error(data.responseMessage || data.message || "アクセストークンが返却されませんでした。");
    }

    saveAuth({
      accessToken: data.accessToken,
      tokenType: data.tokenType ?? "Bearer",
      issuedAtEpochSecond: data.issuedAtEpochSecond,
      expiresAtEpochSecond: data.expiresAtEpochSecond,
      authFlg: data.authFlg,
      roles: data.roles ?? [],
      email: data.email,
      name: data.name,
      userId: data.userId,
    });

    return data;
  } catch (e) {
    throw new Error(resolveErrorMessage(e));
  }
}

export async function signupApi(payload: SignUpRequest): Promise<AuthResponse> {
  try {
    const { data } = await apiClient.post<AuthResponse>("/v1/api/auth/signup", payload);
    return data;
  } catch (e) {
    throw new Error(resolveErrorMessage(e));
  }
}

export async function forgotPasswordApi(payload: ForgotPasswordRequest): Promise<AuthResponse> {
  try {
    const { data } = await apiClient.patch<AuthResponse>("/v1/api/auth/passwd/reset/view", payload);
    return data;
  } catch (e) {
    throw new Error(resolveErrorMessage(e));
  }
}
