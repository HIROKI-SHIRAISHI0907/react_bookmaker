import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useCurrentRole } from "../../../hooks/useCurrentRole";
import { ConsoleToolbar, StatusBadge } from "../../../api/commonAdminDesign";
import { adminPath, buildAdminMenu, roleLabel } from "../../../api/auth/adminMenu";

/**
 * 管理メニュー画面（/admin）
 *   ログイン直後に表示する。ここから各画面に入ると、AdminLayout（左メニュー付き）で表示される。
 */
export default function AdminMenuPage() {
  const role = useCurrentRole();
  const menuGroups = useMemo(() => buildAdminMenu(role), [role]);
  const itemCount = menuGroups.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <div className="min-h-[calc(100vh-40px)] bg-[#f5f6f8] p-4">
      <div className="mx-auto max-w-6xl">
        <ConsoleToolbar title="管理メニュー" info={`${itemCount} 画面`}>
          <StatusBadge tone={role === "ADMIN" ? "ng" : "ok"}>{roleLabel(role)}</StatusBadge>
        </ConsoleToolbar>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {menuGroups.map((group) => (
            <section key={group.key} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="flex items-center gap-2 border-b border-gray-200 px-3.5 py-2">
                <h2 className="m-0 text-sm font-bold text-gray-900">{group.label}</h2>
                <span className="ml-auto text-xs tabular-nums text-gray-400">{group.items.length}</span>
              </div>
              <div>
                {group.items.map((item) => (
                  <Link key={item.to} to={adminPath(item.to)} className="group flex items-center gap-2 border-t border-gray-100 px-3.5 py-2 no-underline first:border-t-0 hover:bg-indigo-50/60">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-bold text-gray-900 group-hover:text-indigo-700">{item.label}</div>
                      {item.desc && <div className="truncate text-[11px] text-gray-500">{item.desc}</div>}
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 group-hover:text-indigo-500" />
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
