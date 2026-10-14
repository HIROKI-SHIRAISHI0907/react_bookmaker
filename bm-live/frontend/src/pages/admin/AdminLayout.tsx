import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { ChevronDown, LayoutGrid, Menu, X } from "lucide-react";
import { useCurrentRole } from "../../hooks/useCurrentRole";
import { ADMIN_BASE, adminPath, buildAdminMenu, isMenuItemActive, roleLabel } from "../../api/auth/adminMenu";

/**
 * 管理画面の共通レイアウト（左にメニュー、右に各画面）
 *   /admin（メニュー画面）はこのレイアウトの外で表示し、各画面に入ったらこのレイアウトで表示する。
 */
export default function AdminLayout() {
  const location = useLocation();
  const role = useCurrentRole();

  const menuGroups = useMemo(() => buildAdminMenu(role), [role]);

  /** 今いる画面が含まれるグループ */
  const activeGroupKey = useMemo(() => menuGroups.find((g) => g.items.some((it) => isMenuItemActive(location.pathname, it.to)))?.key ?? null, [menuGroups, location.pathname]);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => (activeGroupKey ? { [activeGroupKey]: true } : {}));
  const [mobileOpen, setMobileOpen] = useState(false);

  // 別グループの画面へ移ったら、そのグループを開く（他のグループの開閉はそのまま）
  useEffect(() => {
    if (activeGroupKey) setOpenGroups((prev) => (prev[activeGroupKey] ? prev : { ...prev, [activeGroupKey]: true }));
    setMobileOpen(false);
  }, [activeGroupKey, location.pathname]);

  const toggleGroup = (key: string) => setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  const nav = (
    <nav className="grid gap-1">
      {menuGroups.map((group) => {
        const isOpen = !!openGroups[group.key];
        const hasActive = group.key === activeGroupKey;
        return (
          <div key={group.key}>
            <button
              type="button"
              onClick={() => toggleGroup(group.key)}
              className={[
                "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12.5px] font-bold transition-colors hover:bg-gray-100",
                hasActive ? "text-gray-900" : "text-gray-600",
              ].join(" ")}
              aria-expanded={isOpen}
            >
              <span className="min-w-0 flex-1 truncate">{group.label}</span>
              {!isOpen && hasActive && <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />}
              <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
              <div className="mb-1 ml-2.5 mt-0.5 grid gap-px border-l border-gray-200 pl-1.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={adminPath(item.to)}
                    title={item.desc}
                    className={({ isActive }) =>
                      [
                        "block rounded-md px-2.5 py-1.5 text-[12.5px] leading-snug no-underline transition-colors",
                        isActive ? "bg-indigo-50 font-bold text-indigo-700" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                      ].join(" ")
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );

  const header = (
    <div className="mb-3 flex items-center gap-2 px-1">
      <Link to={ADMIN_BASE} className="inline-flex items-center gap-1.5 text-[15px] font-bold text-gray-900 no-underline hover:text-indigo-700" title="管理メニューへ">
        <LayoutGrid className="h-4 w-4 text-indigo-600" />
        管理画面
      </Link>
      <span className="ml-auto rounded-full bg-gray-100 px-2 py-px text-[11px] font-bold text-gray-600">{roleLabel(role)}</span>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-40px)] bg-[#f5f6f8] md:grid md:grid-cols-[248px_minmax(0,1fr)]">
      {/* PC: 左に固定のメニュー */}
      <aside className="hidden border-r border-gray-200 bg-white md:block">
        <div className="sticky top-10 max-h-[calc(100vh-40px)] overflow-y-auto px-2.5 py-3">
          {header}
          {nav}
        </div>
      </aside>

      {/* スマホ: 上にメニューボタン */}
      <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-3 py-2 md:hidden">
        <button type="button" onClick={() => setMobileOpen((v) => !v)} className="rounded-md p-1 text-gray-700 hover:bg-gray-100" aria-label="メニュー">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <Link to={ADMIN_BASE} className="text-[14px] font-bold text-gray-900 no-underline">
          管理画面
        </Link>
        <span className="ml-auto rounded-full bg-gray-100 px-2 py-px text-[11px] font-bold text-gray-600">{roleLabel(role)}</span>
      </div>
      {mobileOpen && <div className="border-b border-gray-200 bg-white px-2.5 py-2 md:hidden">{nav}</div>}

      <main className="min-w-0 p-4">
        <Outlet />
      </main>
    </div>
  );
}
