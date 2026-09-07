import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuthSession, getAccessToken, getTokenType } from "../utils/auth";
import { useCurrentRole } from "../hooks/useCurrentRole";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

/**
 * 退会確認ページ（担当者のみ）。
 *
 * ルーティング例（要ルーター登録。App.tsx等のルート定義ファイルは今回未共有のため、
 * このコンポーネントを使う <Route path="/withdrawal/confirm" element={<WithdrawalConfirmPage />} /> を
 * 追加してください）。
 */
export default function WithdrawalConfirmPage() {
  const navigate = useNavigate();
  const currentRole = useCurrentRole();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 担当者以外（管理者・未ログイン等）が直接URLを叩いても操作できないようにする。
  // 画面自体への遷移可否（観点4）は別途ルーター側のガードでも制御することを推奨。
  if (currentRole !== "ADMIN_SUB") {
    return (
      <div style={{ maxWidth: 480, margin: "80px auto", padding: 24 }}>
        <p>このページは担当者のみご利用いただけます。</p>
      </div>
    );
  }

  const handleWithdraw = async () => {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const token = getAccessToken();
      const tokenType = getTokenType();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers.Authorization = `${tokenType} ${token}`;
      }
      const res = await fetch(`${API_BASE}/v1/api/account/withdraw`, {
        method: "POST",
        headers,
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setErrorMessage(body?.message ?? "退会処理に失敗しました。時間をおいて再度お試しください。");
        setSubmitting(false);
        return;
      }
      // 退会が完了したので、クライアント側のセッションも破棄してから完了ページへ。
      clearAuthSession();
      navigate("/withdrawal/complete", { replace: true });
    } catch {
      setErrorMessage("通信に失敗しました。時間をおいて再度お試しください。");
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: "80px auto", padding: 24 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>退会確認</h1>
      <p style={{ marginBottom: 8, lineHeight: 1.7 }}>
        退会すると、以降このアカウントでログインできなくなります。
      </p>
      <p style={{ marginBottom: 24, lineHeight: 1.7 }}>
        あなたが起票した「申請中」の依頼は「保留」に、あなたが確認済みの指令は「未確認」に変更されます。
        本当に退会しますか？
      </p>
      {errorMessage && (
        <p style={{ color: "#b91c1c", marginBottom: 16 }}>{errorMessage}</p>
      )}
      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={() => navigate(-1)}
          disabled={submitting}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            background: "white",
            color: "#374151",
            fontWeight: 700,
            fontSize: 13,
            cursor: submitting ? "default" : "pointer",
          }}
        >
          キャンセル
        </button>
        <button
          onClick={handleWithdraw}
          disabled={submitting}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid #b91c1c",
            background: "#b91c1c",
            color: "white",
            fontWeight: 700,
            fontSize: 13,
            cursor: submitting ? "default" : "pointer",
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? "処理中..." : "退会する"}
        </button>
      </div>
    </div>
  );
}
