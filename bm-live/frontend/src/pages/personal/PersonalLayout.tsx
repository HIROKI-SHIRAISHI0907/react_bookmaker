import React from "react";
import { NavLink, Outlet } from "react-router-dom";

export default function AdminLayout() {
  const linkStyle = ({ isActive }: { isActive: boolean }) => ({
    display: "block",
    padding: "10px 12px",
    textDecoration: "none",
    color: "black",
    background: isActive ? "#f3f4f6" : "transparent",
    borderRadius: 8,
  });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", minHeight: "calc(100vh - 40px)" }}>
      <aside style={{ padding: 12, borderRight: "1px solid #eee" }}>
        <div style={{ fontWeight: 800, marginBottom: 12 }}>設定画面</div>

        <div style={{ display: "grid", gap: 8 }}>
          <NavLink to="favorite" style={linkStyle}>
            お気に入り設定
          </NavLink>
        </div>
      </aside>

      <main style={{ padding: 16 }}>
        <Outlet />
      </main>
    </div>
  );
}
