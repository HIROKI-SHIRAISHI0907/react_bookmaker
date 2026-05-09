import axios from "axios";
import { apiClient } from "./client";
import { saveAuth } from "../utils/authStorage";

export type AuthResponse = {
  responseCode?: string;
  responseMessage?: string;
  accessToken?: string;
  tokenType?: string;
  issuedAtEpochSecond?: number;
  expiresAtEpochSecond?: number;
  roles?: string[];
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

  if (error instanceof Error) {
    return error.message;
  }

  return "通信に失敗しました。";
}

export async function loginApi(payload: LoginRequest): Promise<AuthResponse> {
  try {
    const { data } = await apiClient.post<AuthResponse>("/v1/api/auth/login", payload);

    if (!data.accessToken) {
      throw new Error(data.responseMessage || "アクセストークンが返却されませんでした。");
    }

    saveAuth({
      accessToken: data.accessToken,
      tokenType: data.tokenType ?? "Bearer",
      roles: data.roles ?? [],
    });

    return data;
  } catch (error) {
    throw new Error(resolveErrorMessage(error));
  }
}

export async function signupApi(payload: SignUpRequest): Promise<AuthResponse> {
  try {
    const { data } = await apiClient.post<AuthResponse>("/v1/api/auth/signup", payload);
    return data;
  } catch (error) {
    throw new Error(resolveErrorMessage(error));
  }
}

export async function forgotPasswordApi(payload: ForgotPasswordRequest): Promise<AuthResponse> {
  try {
    const { data } = await apiClient.post<AuthResponse>("/v1/api/auth/forgot-password", payload);
    return data;
  } catch (error) {
    throw new Error(resolveErrorMessage(error));
  }
}
