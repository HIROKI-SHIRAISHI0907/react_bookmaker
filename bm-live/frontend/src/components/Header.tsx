import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { clearAuthSession, getAccessToken, getTokenType, isLoggedIn } from "../utils/auth";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

/** 画面最上部に固定されている帯（pathname 表示）の高さ。帯が無ければ 0 にする */
const TOP_OFFSET = 44;

/**
 * ログアウトボタン。
 *  - スクロール前: ページ上部に「通常の行」として置く（ツールバー等とは重ならない）
 *  - スクロール後: 右上にフローティング表示し、コンテンツの上に覆いかぶさる
 *  （通常の行が画面外に出たかを IntersectionObserver で判定。window / 内側のスクロール領域どちらでも動く）
 */
export default function Header() {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [floating, setFloating] = useState(false);
  const barRef = useRef<HTMLDivElement | null>(null);
  const loggedIn = isLoggedIn();

  useEffect(() => {
    const el = barRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setFloating(!entry.isIntersecting), {
      rootMargin: `-${TOP_OFFSET}px 0px 0px 0px`,
      threshold: 0,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [loggedIn]);

  if (!loggedIn) {
    return null;
  }

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const token = getAccessToken();
      const tokenType = getTokenType();
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `${tokenType} ${token}`;
      }
      await fetch(`${API_BASE}/v1/api/auth/logout`, {
        method: "POST",
        headers,
        credentials: "include",
      });
    } catch {
      // サーバー呼び出しが失敗しても、クライアント側のログアウトは続行する
    } finally {
      clearAuthSession();
      setLoggingOut(false);
      navigate("/login", { replace: true });
    }
  };

  const LogoutButton = ({ compact = false }: { compact?: boolean }) => (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loggingOut}
      title="ログアウト"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: compact ? "6px 12px" : "6px 14px",
        borderRadius: compact ? 999 : 8,
        border: "1px solid #d1d5db",
        background: "white",
        color: "#374151",
        fontWeight: 700,
        fontSize: 12.5,
        lineHeight: 1.4,
        cursor: loggingOut ? "default" : "pointer",
        opacity: loggingOut ? 0.6 : 1,
        boxShadow: compact ? "none" : "0 1px 2px rgba(0,0,0,0.05)",
      }}
    >
      <LogOut style={{ width: 14, height: 14 }} />
      {loggingOut ? "ログアウト中..." : "ログアウト"}
    </button>
  );

  return (
    <>
      {/* スクロール前: 通常の行（コンテンツを押し下げるので重ならない） */}
      <div
        ref={barRef}
        style={{
          display: "flex",
          justifyContent: "flex-end",
          padding: "0 0 8px",
          visibility: floating ? "hidden" : "visible",
        }}
      >
        <LogoutButton />
      </div>

      {/* スクロール後: 右上にフローティング（コンテンツの上に重なる） */}
      <div
        aria-hidden={!floating}
        style={{
          position: "fixed",
          top: TOP_OFFSET + 8,
          right: 16,
          zIndex: 9998,
          padding: 4,
          borderRadius: 999,
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          border: "1px solid rgba(229,231,235,0.9)",
          boxShadow: "0 8px 24px rgba(15,23,42,0.12), 0 2px 6px rgba(15,23,42,0.08)",
          opacity: floating ? 1 : 0,
          transform: floating ? "translateY(0)" : "translateY(-8px)",
          pointerEvents: floating ? "auto" : "none",
          transition: "opacity 160ms ease, transform 160ms ease",
        }}
      >
        <LogoutButton compact />
      </div>
    </>
  );
}
