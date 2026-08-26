import React from "react";
import { Link } from "react-router-dom";

/**
 * 無効画面（汎用エラー画面）
 * パスワード再設定リンクが期限切れ・使用済み・改ざん等、
 * いずれの理由であっても同じ汎用メッセージを表示する。
 */
export default function ResetPasswordInvalidPage() {
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <p style={styles.desc}>システムエラーが発生しました。ログイン画面に遷移してください。</p>

        <Link to="/login" style={styles.primaryButton}>
          ログイン画面へ
        </Link>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 24,
    background: "#f6f7fb",
  },
  card: {
    width: "100%",
    maxWidth: 480,
    background: "white",
    border: "1px solid #e6e8ef",
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
    textAlign: "center",
  },
  desc: {
    margin: "0 0 20px",
    color: "#4b5563",
    fontSize: 14,
    lineHeight: 1.6,
  },
  primaryButton: {
    display: "inline-block",
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    background: "#111827",
    color: "white",
    fontWeight: 600,
    textDecoration: "none",
    boxSizing: "border-box",
  },
};
