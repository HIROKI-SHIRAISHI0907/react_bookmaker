import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signupApi } from "../../api/auth";

type SignupForm = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  agree: boolean;
};

export default function SignupPage() {
  const nav = useNavigate();

  const [form, setForm] = useState<SignupForm>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agree: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const passwordMatch = form.password.length > 0 && form.password === form.confirmPassword;

  const canSubmit = useMemo(() => {
    return form.name.trim().length > 0 && form.email.trim().length > 0 && form.password.length >= 8 && passwordMatch && form.agree && !submitting;
  }, [form, passwordMatch, submitting]);

  const onChange =
    <K extends keyof SignupForm>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = key === "agree" ? e.target.checked : e.target.value;
      setForm((p) => ({ ...p, [key]: value as SignupForm[K] }));
    };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!canSubmit) return;

    setSubmitting(true);
    try {
      await signupApi({
        name: form.name,
        email: form.email,
        password: form.password,
      });

      setMessage("アカウント作成が完了しました。ログイン画面へ移動します。");

      setTimeout(() => {
        nav("/login");
      }, 800);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "作成に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>アカウント新規作成</h1>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <label style={styles.label}>
            お名前
            <input type="text" value={form.name} onChange={onChange("name")} required style={styles.input} placeholder="山田 太郎" />
          </label>

          <label style={styles.label}>
            メールアドレス
            <input type="email" value={form.email} onChange={onChange("email")} required style={styles.input} placeholder="you@example.com" />
          </label>

          <label style={styles.label}>
            パスワード（8文字以上）
            <input type="password" value={form.password} onChange={onChange("password")} required minLength={8} style={styles.input} placeholder="********" />
          </label>

          <label style={styles.label}>
            パスワード（確認）
            <input type="password" value={form.confirmPassword} onChange={onChange("confirmPassword")} required minLength={8} style={styles.input} placeholder="********" />
          </label>

          {!passwordMatch && form.confirmPassword.length > 0 && <div style={styles.error}>パスワードが一致しません。</div>}

          <label
            style={{
              ...styles.label,
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <input type="checkbox" checked={form.agree} onChange={onChange("agree")} />
            <span>利用規約に同意します</span>
          </label>

          <button type="submit" disabled={!canSubmit} style={styles.primaryButton}>
            {submitting ? "作成中..." : "作成する"}
          </button>

          {message && <div style={styles.message}>{message}</div>}
        </form>

        <div style={styles.links}>
          <Link to="/login">ログインへ戻る</Link>
          <Link to="/forgot-password">パスワードを忘れた方へ</Link>
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
    maxWidth: 520,
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
    boxSizing: "border-box",
  },
  error: {
    padding: 10,
    borderRadius: 10,
    background: "#fff1f2",
    border: "1px solid #fecdd3",
    fontSize: 13,
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
