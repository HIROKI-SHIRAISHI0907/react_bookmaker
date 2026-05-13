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
    const { data } = await apiClient.post<AuthResponse>("/v1/api/auth/forgot-password", payload);
    return data;
  } catch (e) {
    throw new Error(resolveErrorMessage(e));
  }
}
