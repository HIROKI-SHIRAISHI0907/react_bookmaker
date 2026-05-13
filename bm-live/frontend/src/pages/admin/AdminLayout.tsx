import React, { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

type MenuItem = {
  label: string;
  to: string;
};

type MenuGroup = {
  key: string;
  label: string;
  items: MenuItem[];
};

export default function AdminLayout() {
  const location = useLocation();

  const menuGroups: MenuGroup[] = useMemo(
    () => [
      {
        key: "batch",
        label: "バッチ・取得",
        items: [
          { label: "データ取得管理", to: "data/fetch" },
          { label: "スクレイピング実行管理", to: "scrape/manual" },
          { label: "S3ファイル情報取得管理", to: "s3/fileCount" },
        ],
      },
      {
        key: "scraping",
        label: "スクレイピング",
        items: [
          { label: "対象データ設定", to: "manual/data/target" },
          { label: "手動登録・更新", to: "manual/data/register" },
          { label: "欠陥値設定", to: "manual/data/defect" },
          { label: "MatchKey管理", to: "match-key-save" },
          { label: "投入済みデータ参照", to: "ingested" },
        ],
      },
      {
        key: "master",
        label: "マスタ・設定",
        items: [
          { label: "チームカラー設定", to: "manual/teamColor" },
          { label: "CSV等選択肢登録", to: "sub-input" },
          { label: "サブリーグ設定", to: "sub-league" },
          { label: "勝ち点設定", to: "point-setting" },
        ],
      },
      {
        key: "user",
        label: "ユーザー・権限",
        items: [{ label: "ユーザー管理", to: "users" }],
      },
      {
        key: "admin",
        label: "管理・通知",
        items: [
          { label: "管理者国リーグ強制制御", to: "force/update" },
          { label: "お知らせ通知管理", to: "notices" },
        ],
      },
    ],
    [],
  );

  const initialOpenState = useMemo(() => {
    const state: Record<string, boolean> = {};
    for (const group of menuGroups) {
      state[group.key] = group.items.some((item) => location.pathname.includes(`/admin/${item.to}`));
    }
    return state;
  }, [menuGroups, location.pathname]);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(initialOpenState);

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const linkStyle = ({ isActive }: { isActive: boolean }) => ({
    display: "block",
    padding: "10px 12px 10px 20px",
    textDecoration: "none",
    color: "#111827",
    background: isActive ? "#eef2ff" : "transparent",
    borderRadius: 8,
    fontWeight: isActive ? 700 : 500,
    borderLeft: isActive ? "4px solid #4f46e5" : "4px solid transparent",
  });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", minHeight: "calc(100vh - 40px)" }}>
      <aside style={{ padding: 16, borderRight: "1px solid #eee", background: "#fff" }}>
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 16 }}>管理画面</div>

        <div style={{ display: "grid", gap: 12 }}>
          {menuGroups.map((group) => {
            const isOpen = openGroups[group.key];

            return (
              <div
                key={group.key}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  overflow: "hidden",
                  background: "#fafafa",
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleGroup(group.key)}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 14px",
                    background: "white",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  <span>{group.label}</span>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>{isOpen ? "▲" : "▼"}</span>
                </button>

                {isOpen && (
                  <div style={{ display: "grid", gap: 6, padding: 10, background: "#fafafa" }}>
                    {group.items.map((item) => (
                      <NavLink key={item.to} to={item.to} style={linkStyle}>
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      <main style={{ padding: 16 }}>
        <Outlet />
      </main>
    </div>
  );
}
