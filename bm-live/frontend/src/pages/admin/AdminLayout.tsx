import React, { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useCurrentRole } from "../../hooks/useCurrentRole";

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
  const role = useCurrentRole();

  const menuGroups: MenuGroup[] = useMemo(() => {
    const groups: MenuGroup[] = [
      {
        key: "scraping",
        label: "スクレイピング管理",
        items: [
          { label: "スクレイピング対象データ取得設定", to: "manual/data/target" },
          { label: "スクレイピングCSV情報取得管理", to: "scrape/manual" },
          { label: "スクレイピング生成物数管理", to: "s3/fileCount" },
          { label: "スクレイピングCSV情報データ登録管理", to: "data/fetch" },
        ],
      },
      {
        key: "master",
        label: "マスタデータ参照",
        items: [
          { label: "シーズンデータ取得情報", to: "season" },
          { label: "チームデータ取得情報", to: "team" },
          { label: "試合予定データ取得情報", to: "future/matches" },
        ],
      },
      {
        key: "other",
        label: "その他データ参照",
        items: [
          { label: "リアルタイムデータ登録済参照", to: "matches/by-date" },
          { label: "統計用CSV作成内容参照", to: "csv/today" },
          { label: "未来データ・リアルタイムデータ紐づき参照", to: "ingested" },
          { label: "アップロード済リアルタイムデータ参照", to: "upload/realtime" },
        ],
      },
      {
        key: "otherSetting",
        label: "その他設定",
        items: [
          { label: "統計用CSV作成前詳細設定", to: "sub-input" },
          { label: "お気に入り国リーグ情報全体反映設定", to: "force/update" },
          { label: "リーグ勝ち点情報反映設定", to: "point-setting" },
          { label: "チームカラー情報反映設定", to: "manual/teamColor" },
          { label: "サブリーグ名反映設定", to: "sub-league" },
          // お知らせの作成・編集ができる画面のため、担当者のみに表示する。
          // 管理者は「申請確認画面」から内容を見て承認/差し戻しするだけにする。
          ...(role === "ADMIN_SUB" ? [{ label: "トップメニュー通知情報設定", to: "notices" }] : []),
          { label: "データカテゴリ変更設定", to: "data-category" },
          { label: "メール情報登録設定", to: "mailinfo" },
        ],
      },
      {
        key: "approveFlow",
        label: "承認フロー",
        items: [
          // 管理者: 担当者から届いた依頼をまとめて確認・承認/差し戻しする画面。
          ...(role === "ADMIN" ? [{ label: "申請確認画面", to: "approve/requests" }] : []),
          // 担当者: 管理者から届いた指令を確認する画面。
          ...(role === "ADMIN_SUB" ? [{ label: "指令確認画面", to: "approve/instructions" }] : []),
        ],
      },
      {
        key: "user",
        label: "利用者情報",
        items: [{ label: "利用者情報管理", to: "users" }],
      },
      {
        key: "db",
        label: "ミドルウェア管理",
        items: [
          { label: "コネクション管理", to: "db/connections" },
          { label: "非稼働ECS管理", to: "noecs" },
        ],
      },
    ];

    // ロールによって表示項目が0件になったグループ(承認フローなど)はメニューに出さない。
    return groups.filter((g) => g.items.length > 0);
  }, [role]);

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
