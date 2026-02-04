import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from "react";
const AuthContext = createContext(undefined);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshMe = async () => {
    try {
      const res = await fetch("/v1/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser({ uid: data.user.uid, email: data.user.email });
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };
  const logout = async () => {
    await fetch("/v1/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
  };
  useEffect(() => {
    refreshMe();
  }, []);
  return _jsx(AuthContext.Provider, { value: { user, loading, refreshMe, logout }, children: children });
}
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
