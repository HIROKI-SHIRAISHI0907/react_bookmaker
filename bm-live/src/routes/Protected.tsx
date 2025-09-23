import { useEffect, useState, type PropsWithChildren } from "react";
import { useNavigate } from "react-router-dom";

export default function Protected({ children }: PropsWithChildren) {
  const nav = useNavigate();
  const [ok, setOk] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:8080/api/auth/me", { credentials: "include" });
        if (res.ok) setOk(true);
        else nav("/login", { replace: true });
      } catch {
        nav("/login", { replace: true });
      }
    })();
  }, [nav]);

  if (!ok) return null;
  return <>{children}</>;
}