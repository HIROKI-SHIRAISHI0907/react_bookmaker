import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resetPasswordApi, validateResetTokenApi } from "../../api/auth";

/**
 * パスワード再設定画面
 * メール本文のリンク（例: /reset-password?key=<mail_send_key>）を踏んだ後に表示する画面。
 *
 * 表示時にkeyの有効性をサーバーに確認し、
 *  - 期限切れ（発行から10分経過）
 *  - 使用済み
 *  - 存在しない/改ざんされている
 * のいずれかであれば無効画面（/reset-password/invalid）へ遷移する。
 *
 * パスワード再設定（PATCH /passwd/reset/confirm）が200で返ってきたら、
 * そのままログイン画面（/login）へリダイレクトする。
 *
 * validateResetTokenApi / resetPasswordApi は、失敗時も例外を投げず
 * AuthResponse（responseCode付き）として返ってくる前提。
 */

type ValidationState = "checking" | "valid";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const key = searchParams.get("key") ?? "";

  const [validation, setValidation] = useState<ValidationState>("checking");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!key) {
      navigate("/reset-password/invalid", { replace: true });
      return;
    }

    let cancelled = false;

    (async () => {
      const res = await validateResetTokenApi({ key });
      if (cancelled) return;

      if (res.responseCode === "200") {
        setValidation("valid");
      } else {
        // 期限切れ・使用済み・改ざん等、理由を問わず汎用の無効画面へ
        navigate("/reset-password/invalid", { replace: true });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [key, navigate]);

  const passwordError = useMemo(() => {
    if (!password) return null;
    if (password.length < 8) return "パスワードは8文字以上で入力してください。";
    if (passwordConfirm && password !== passwordConfirm) return "パスワードが一致しません。";
    return null;
  }, [password, passwordConfirm]);

  const canSubmit = useMemo(() => validation === "valid" && password.length >= 8 && password === passwordConfirm && !submitting, [validation, password, passwordConfirm, submitting]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!canSubmit) return;

    setSubmitting(true);
    const res = await resetPasswordApi({ key, newPassword: password });
    setSubmitting(false);

    if (res.responseCode === "200") {
      // パスワード再設定に成功したら、そのままログイン画面へ
      navigate("/login", { replace: true });
      return;
    }

    if (res.responseCode === "409") {
      // 確認中に他タブ等で既に使用済みになっていた場合
      navigate("/reset-password/invalid", { replace: true });
      return;
    }

    setErrorMessage(res.message || "パスワードの再設定に失敗しました。");
  };

  if (validation === "checking") {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <p style={styles.desc}>リンクを確認しています...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>パスワードの再設定</h1>
        <p style={styles.desc}>新しいパスワードを入力してください。</p>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <label style={styles.label}>
            新しいパスワード
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} style={styles.input} placeholder="8文字以上" />
          </label>

          <label style={styles.label}>
            新しいパスワード（確認）
            <input type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} required minLength={8} style={styles.input} placeholder="もう一度入力してください" />
          </label>

          {passwordError && <div style={styles.errorText}>{passwordError}</div>}

          <button type="submit" disabled={!canSubmit} style={styles.primaryButton}>
            {submitting ? "更新中..." : "パスワードを再設定する"}
          </button>

          {errorMessage && <div style={styles.errorText}>{errorMessage}</div>}
        </form>
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
  errorText: {
    fontSize: 12,
    color: "#dc2626",
  },
};
