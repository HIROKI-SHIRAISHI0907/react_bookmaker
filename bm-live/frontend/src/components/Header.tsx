import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuthSession, getAccessToken, getTokenType, isLoggedIn } from "../utils/auth";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export default function Header() {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  if (!isLoggedIn()) {
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

  return (
    <div
      style={{
        position: "fixed",
        top: 44,
        right: 0,
        zIndex: 9998,
        padding: "8px 16px",
      }}
    >
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        style={{
          padding: "8px 16px",
          borderRadius: 8,
          border: "1px solid #d1d5db",
          background: "white",
          color: "#374151",
          fontWeight: 700,
          fontSize: 13,
          cursor: loggingOut ? "default" : "pointer",
          opacity: loggingOut ? 0.6 : 1,
          boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
        }}
      >
        {loggingOut ? "ログアウト中..." : "ログアウト"}
      </button>
    </div>
  );
}
