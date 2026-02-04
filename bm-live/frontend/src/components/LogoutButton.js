import { jsx as _jsx } from "react/jsx-runtime";
export default function LogoutButton() {
  return _jsx("button", {
    onClick: async () => {
      await fetch("http://localhost:8080/v1/api/auth/logout", { method: "POST", credentials: "include" });
      window.location.href = "/login";
    },
    children: "\u30ED\u30B0\u30A2\u30A6\u30C8",
  });
}
