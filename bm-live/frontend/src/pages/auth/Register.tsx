// src/auth/Register.tsx （パスはあなたの構成に合わせて）
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [name, setName] = useState(""); // ← username → name に変更
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      // ① API ベースURLの扱い：下の「補足」参照
      const base = import.meta.env.VITE_API_BASE || "";
      const res = await fetch(`${base}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, name, password }), // ← name を送る
      });

      if (res.ok) {
        nav("/login", { replace: true });
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
        <div>名前</div> {/* ラベルも合わせる */}
        <input value={name} onChange={(e) => setName(e.target.value)} required minLength={1} />
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
