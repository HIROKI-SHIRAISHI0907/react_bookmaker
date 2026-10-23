// src/pages/auth/LoginPage.tsx
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { saveAuthSession } from "../../utils/auth";

type LoginResponse = {
  responseCode?: string;
  message?: string;
  accessToken?: string;
  tokenType?: string;
  issuedAtEpochSecond?: number;
  expiresAtEpochSecond?: number;
  roles?: string[];
  authFlg?: number;
  userId?: number;
};

type LoginLocationState = {
  from?: string | { pathname?: string };
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: LoginLocationState };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/v1/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = (await res.json()) as LoginResponse;

      if (!res.ok) {
        setErrorMessage(data?.message ?? `ログインに失敗しました。(HTTP ${res.status})`);
        return;
      }

      if (!data?.accessToken) {
        setErrorMessage("アクセストークンが返却されませんでした。");
        return;
      }

      saveAuthSession({
        accessToken: data.accessToken,
        tokenType: data.tokenType,
        issuedAtEpochSecond: data.issuedAtEpochSecond,
        expiresAtEpochSecond: data.expiresAtEpochSecond,
        authFlg: data.authFlg,
        roles: data.roles ?? [],
        email: email.trim().toLowerCase(),
        userId: data.userId,
      });

      const isAdmin = data.authFlg === 1 || data.roles?.includes("ROLE_ADMIN");

      const rawFrom = location.state?.from;
      const fromPath = typeof rawFrom === "string" ? rawFrom : rawFrom?.pathname;

      if (isAdmin) {
        navigate("/admin", { replace: true });
        return;
      }

      if (fromPath && fromPath.startsWith("/admin")) {
        navigate("/top", { replace: true });
        return;
      }

      navigate(fromPath || "/top", { replace: true });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "ログインに失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f8fafc",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
        }}
      >
        <h1 style={{ margin: 0, marginBottom: 8, fontSize: 28, fontWeight: 800 }}>ログイン</h1>
        <p
          style={{
            marginTop: 0,
            marginBottom: 20,
            color: "#6b7280",
            fontSize: 14,
          }}
        >
          メールアドレスとパスワードを入力してください。
        </p>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@example.com"
              autoComplete="email"
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid #d1d5db",
                fontSize: 14,
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              autoComplete="current-password"
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid #d1d5db",
                fontSize: 14,
                boxSizing: "border-box",
              }}
            />
          </div>

          {errorMessage && (
            <div
              style={{
                background: "#fef2f2",
                color: "#991b1b",
                border: "1px solid #fecaca",
                borderRadius: 10,
                padding: "10px 12px",
                fontSize: 14,
              }}
            >
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px 16px",
              borderRadius: 10,
              border: "none",
              background: "#2563eb",
              color: "white",
              fontWeight: 800,
              fontSize: 14,
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "ログイン中..." : "ログイン"}
          </button>
        </form>

        <div
          style={{
            marginTop: 18,
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            fontSize: 14,
          }}
        >
          <Link to="/signup">新規登録</Link>
          <Link to="/forgot-password">パスワードを忘れた方</Link>
        </div>
      </div>
    </div>
  );
}
