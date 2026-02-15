import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

type LoginForm = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const nav = useNavigate();
  const [form, setForm] = useState<LoginForm>({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return form.email.trim().length > 0 && form.password.length >= 8 && !submitting;
  }, [form.email, form.password, submitting]);

  const onChange = (key: keyof LoginForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((p) => ({ ...p, [key]: e.target.value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      // TODO: ここでAPI呼び出しに置き換え
      await new Promise((r) => setTimeout(r, 600));

      // 例：ログイン後にどこかへ遷移
      setMessage("ログイン処理（ダミー）が完了しました。");
      // nav("/dashboard"); // 作ったらここへ
    } catch {
      setMessage("ログインに失敗しました。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>ログイン</h1>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <label style={styles.label}>
            メールアドレス
            <input type="email" value={form.email} onChange={onChange("email")} autoComplete="email" required style={styles.input} placeholder="you@example.com" />
          </label>

          <label style={styles.label}>
            パスワード（8文字以上）
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={onChange("password")}
                autoComplete="current-password"
                required
                minLength={8}
                style={{ ...styles.input, flex: 1 }}
                placeholder="********"
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} style={styles.secondaryButton}>
                {showPassword ? "隠す" : "表示"}
              </button>
            </div>
          </label>

          <button type="submit" disabled={!canSubmit} style={styles.primaryButton}>
            {submitting ? "送信中..." : "ログイン"}
          </button>

          {message && <div style={styles.message}>{message}</div>}
        </form>

        <div style={styles.links}>
          <Link to="/forgot-password">パスワードを忘れた方へ</Link>
          <Link to="/signup">アカウント新規作成</Link>
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
    maxWidth: 420,
    background: "white",
    border: "1px solid #e6e8ef",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
  },
  title: { margin: "0 0 12px", fontSize: 22 },
  label: { display: "grid", gap: 6, fontSize: 14 },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #d7dbe7",
    outline: "none",
    fontSize: 14,
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
  secondaryButton: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #d7dbe7",
    background: "white",
    cursor: "pointer",
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
  },
};
