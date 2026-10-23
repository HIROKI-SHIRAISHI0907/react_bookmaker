// src/components/useAuthExpiryRedirect.ts
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { msUntilExpiry, redirectToLogin } from "../utils/auth";

/** setTimeout に渡せる最大値（約 24.8 日）。これを超えると即時実行になるため抑える */
const MAX_TIMEOUT_MS = 2_147_483_647;

/**
 * 画面を開いたまま JWT の期限が来たら、操作を待たずにログイン画面へ飛ばす。
 * 別タブでログアウト・再ログインしたときも、タブに戻った時点で判定し直す。
 */
export function useAuthExpiryRedirect(): void {
  const location = useLocation();

  useEffect(() => {
    let timer: number | undefined;

    const schedule = () => {
      if (timer !== undefined) window.clearTimeout(timer);
      const ms = msUntilExpiry();
      if (ms <= 0) {
        redirectToLogin();
        return;
      }
      timer = window.setTimeout(schedule, Math.min(ms, MAX_TIMEOUT_MS));
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") schedule();
    };

    schedule();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("storage", schedule);

    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("storage", schedule);
    };
  }, [location.pathname]);
}
