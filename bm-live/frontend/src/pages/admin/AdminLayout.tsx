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
        <div style={{ fontWeight: 800, marginBottom: 12 }}>管理画面</div>

        <div style={{ display: "grid", gap: 8 }}>
          <NavLink to="data/fetch" style={linkStyle}>
            データ取得管理
          </NavLink>
          <NavLink to="force/update" style={linkStyle}>
            管理者国リーグ強制制御
          </NavLink>
          <NavLink to="scrape/manual" style={linkStyle}>
            スクレイピング管理
          </NavLink>
          <NavLink to="s3/fileCount" style={linkStyle}>
            S3ファイル情報取得管理
          </NavLink>
          <NavLink to="notices" style={linkStyle}>
            お知らせ通知管理
          </NavLink>
        </div>
      </aside>

      <main style={{ padding: 16 }}>
        <Outlet />
      </main>
    </div>
  );
}
