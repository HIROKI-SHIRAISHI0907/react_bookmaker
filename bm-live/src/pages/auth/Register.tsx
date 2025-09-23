import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // cookie 使う場合
        body: JSON.stringify({ email, username, password }),
      });

      if (res.ok) {
        nav("/login", { replace: true }); // 成功→ログイン画面へ
      } else {
        const body = await res.json().catch(() => ({}));
        setErr(body?.message ?? "登録に失敗しました");
      }
    } catch {
      setErr("通信に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, maxWidth: 360, margin: "40px auto" }}>
      <h1>新規登録</h1>

      <label>
        <div>メールアドレス</div>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>

      <label>
        <div>ユーザー名</div>
        <input value={username} onChange={(e) => setUsername(e.target.value)} required minLength={2} />
      </label>

      <label>
        <div>パスワード</div>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
      </label>

      <button type="submit" disabled={busy}>
        {busy ? "送信中..." : "登録する"}
      </button>

      {err && <p style={{ color: "crimson" }}>{err}</p>}

      <p style={{ marginTop: 16 }}>
        既にアカウントがありますか？ <Link to="/login">ログイン</Link>
      </p>
    </form>
  );
}