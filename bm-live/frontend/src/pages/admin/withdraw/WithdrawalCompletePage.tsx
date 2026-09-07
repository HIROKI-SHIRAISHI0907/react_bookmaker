import React from "react";
import { useNavigate } from "react-router-dom";

/**
 * 退会処理完了ページ。
 *
 * ルーティング例（要ルーター登録）:
 * <Route path="/withdrawal/complete" element={<WithdrawalCompletePage />} />
 *
 * このページに来る時点でセッションは既に破棄済み（WithdrawalConfirmPage側でclearAuthSession()
 * 済み）のため、ログイン必須ガードの対象外にしてください。
 */
export default function WithdrawalCompletePage() {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 480, margin: "80px auto", padding: 24, textAlign: "center" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>退会処理が完了しました</h1>
      <p style={{ marginBottom: 24, lineHeight: 1.7 }}>ご利用ありがとうございました。</p>
      <button
        onClick={() => navigate("/login", { replace: true })}
        style={{
          padding: "8px 16px",
          borderRadius: 8,
          border: "1px solid #d1d5db",
          background: "white",
          color: "#374151",
          fontWeight: 700,
          fontSize: 13,
          cursor: "pointer",
        }}
      >
        ログイン画面へ
      </button>
    </div>
  );
}
