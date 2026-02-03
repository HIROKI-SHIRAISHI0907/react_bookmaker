import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/client"; // ← 置いた場所に合わせて相対パス調整
export default function Login() {
    const nav = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    async function onSubmit(e) {
        e.preventDefault();
        try {
            await api("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password }),
            });
            nav("/top", { replace: true });
        }
        catch (err) {
            console.error(err);
            alert("ログイン失敗");
        }
    }
    return (_jsxs("form", { onSubmit: onSubmit, style: { display: "grid", gap: 12, maxWidth: 320, margin: "40px auto" }, children: [_jsx("h1", { children: "\u30ED\u30B0\u30A4\u30F3" }), _jsx("input", { type: "email", placeholder: "email", value: email, onChange: (e) => setEmail(e.target.value), required: true }), _jsx("input", { type: "password", placeholder: "password", value: password, onChange: (e) => setPassword(e.target.value), required: true }), _jsx("button", { type: "submit", children: "\u30ED\u30B0\u30A4\u30F3" }), _jsx("p", { style: { marginTop: 16 }, children: _jsx(Link, { to: "/register", children: "\u65B0\u898F\u767B\u9332" }) })] }));
}
