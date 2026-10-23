// src/api/client.ts
import axios from "axios";
import { getAccessToken, getTokenType, redirectToLogin } from "../utils/auth";

/**
 * ※以前は "../utils/authStorage"(accessToken/tokenType/rolesを個別キーで持つ古い方式)
 *   からトークンを読んでいたが、現在のログイン処理(api/auth.ts の loginApi)は
 *   "../utils/auth" の saveAuth(=saveAuthSession、authSessionというJSON1本にまとめる方式)
 *   しか呼んでいないため、authStorage.ts側の個別キーは更新されず、apiClientが古い/空の
 *   トークンを送ってしまい、承認フロー系API(/v1/api/approve/**)が401になっていた。
 *   "../utils/auth" に統一する。
 */

export const apiClient = axios.create({
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  const tokenType = getTokenType();

  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `${tokenType} ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // ログイン・パスワード再設定などの認証 API の 401 は「入力ミス」なので飛ばさない
    const url = String(error?.config?.url ?? "");
    if (error?.response?.status === 401 && !url.includes("/api/auth/")) {
      redirectToLogin();
    }

    return Promise.reject(error);
  },
);
