import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/auth/Register.tsx （パスはあなたの構成に合わせて）
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
export default function Register() {
    const nav = useNavigate();
    const [email, setEmail] = useState("");
    const [name, setName] = useState(""); // ← username → name に変更
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState(null);
    async function onSubmit(e) {
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
            }
            else {
                const body = await res.json().catch(() => ({}));
                setErr(body?.message ?? "登録に失敗しました");
            }
        }
        catch {
            setErr("通信に失敗しました");
        }
        finally {
            setBusy(false);
        }
    }
    return (_jsxs("form", { onSubmit: onSubmit, style: { display: "grid", gap: 12, maxWidth: 360, margin: "40px auto" }, children: [_jsx("h1", { children: "\u65B0\u898F\u767B\u9332" }), _jsxs("label", { children: [_jsx("div", { children: "\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9" }), _jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), required: true })] }), _jsxs("label", { children: [_jsx("div", { children: "\u540D\u524D" }), " ", _jsx("input", { value: name, onChange: (e) => setName(e.target.value), required: true, minLength: 1 })] }), _jsxs("label", { children: [_jsx("div", { children: "\u30D1\u30B9\u30EF\u30FC\u30C9" }), _jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), required: true, minLength: 8 })] }), _jsx("button", { type: "submit", disabled: busy, children: busy ? "送信中..." : "登録する" }), err && _jsx("p", { style: { color: "crimson" }, children: err }), _jsxs("p", { style: { marginTop: 16 }, children: ["\u65E2\u306B\u30A2\u30AB\u30A6\u30F3\u30C8\u304C\u3042\u308A\u307E\u3059\u304B\uFF1F ", _jsx(Link, { to: "/login", children: "\u30ED\u30B0\u30A4\u30F3" })] })] }));
}
