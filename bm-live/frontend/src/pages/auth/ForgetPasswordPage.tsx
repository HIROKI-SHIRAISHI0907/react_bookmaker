import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { forgotPasswordApi } from "../../api/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canSubmit = useMemo(() => email.trim().length > 0 && !submitting, [email, submitting]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const res = await forgotPasswordApi({ email });
      setMessage(res.responseMessage || "再設定リンクを送信しました。メールをご確認ください。");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "送信に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>パスワードを忘れた方へ</h1>
        <p style={styles.desc}>登録メールアドレス宛に、再設定用リンクを送信します。</p>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <label style={styles.label}>
            メールアドレス
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={styles.input} placeholder="you@example.com" />
          </label>

          <button type="submit" disabled={!canSubmit} style={styles.primaryButton}>
            {submitting ? "送信中..." : "リンクを送信"}
          </button>

          {message && <div style={styles.message}>{message}</div>}
        </form>

        <div style={styles.links}>
          <Link to="/login">ログインへ戻る</Link>
          <Link to="/signup">新規作成</Link>
        </div>
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
    padding: 20,
    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
  },
  title: { margin: "0 0 8px", fontSize: 22 },
  desc: {
    margin: "0 0 12px",
    color: "#4b5563",
    fontSize: 14,
    lineHeight: 1.5,
  },
  label: { display: "grid", gap: 6, fontSize: 14 },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #d7dbe7",
    outline: "none",
    fontSize: 14,
    boxSizing: "border-box",
  },
  primaryButton: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    background: "#111827",
    color: "white",
    fontWeight: 600,
  },
  message: {
    padding: 10,
    borderRadius: 10,
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    fontSize: 13,
  },
  links: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 14,
    fontSize: 14,
    gap: 12,
  },
};
