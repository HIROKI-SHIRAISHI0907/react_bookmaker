import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
export default function RequireAuth() {
    const { user, loading } = useAuth();
    const location = useLocation();
    if (loading) {
        return _jsx("div", { className: "min-h-screen grid place-items-center text-muted-foreground", children: "\u8AAD\u307F\u8FBC\u307F\u4E2D\u2026" });
    }
    if (!user) {
        return _jsx(Navigate, { to: "/login", replace: true, state: { from: location } });
    }
    return _jsx(Outlet, {});
}
