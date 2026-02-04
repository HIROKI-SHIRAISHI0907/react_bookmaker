import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
export default function Protected({ children }) {
  const nav = useNavigate();
  const [ok, setOk] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:8080/v1/api/auth/me", { credentials: "include" });
        if (res.ok) setOk(true);
        else nav("/login", { replace: true });
      } catch {
        nav("/login", { replace: true });
      }
    })();
  }, [nav]);
  if (!ok) return null;
  return _jsx(_Fragment, { children: children });
}
