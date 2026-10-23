// src/api/client.ts
import axios from "axios";
import { clearAuth, getAccessToken, getTokenType } from "../utils/auth";

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
    if (error?.response?.status === 401) {
      clearAuth();

      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }

    return Promise.reject(error);
  },
);
