// src/utils/authFetchGuard.ts
import { redirectToLogin } from "./auth";

/**
 * 画面ごとに fetch を直接使っている API 呼び出しでも、
 * 401（未ログイン・JWT 期限切れ）が返ったらログイン画面へ飛ばす。
 *
 * - axios（api/client.ts の apiClient）は interceptor で同じことをしている
 * - ログイン・サインアップ・パスワード再設定など認証 API（/api/auth/）の 401 は
 *   「メールアドレスかパスワードの間違い」なので飛ばさない
 * - main.tsx で 1 回だけ呼ぶ
 */
let installed = false;

export function installAuthFetchGuard(): void {
  if (installed || typeof window === "undefined" || typeof window.fetch !== "function") return;
  installed = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const response = await originalFetch(input, init);

    if (response.status === 401) {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (!url.includes("/api/auth/")) {
        redirectToLogin();
      }
    }

    return response;
  };
}
