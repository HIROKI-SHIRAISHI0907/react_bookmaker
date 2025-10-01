import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/client"; // ← 置いた場所に合わせて相対パス調整

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      nav("/top", { replace: true });
    } catch (err) {
      console.error(err);
      alert("ログイン失敗");
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, maxWidth: 320, margin: "40px auto" }}>
      <h1>ログイン</h1>
      <input type="email" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <button type="submit">ログイン</button>

      <p style={{ marginTop: 16 }}>
        <Link to="/register">新規登録</Link>
      </p>
    </form>
  );
}
