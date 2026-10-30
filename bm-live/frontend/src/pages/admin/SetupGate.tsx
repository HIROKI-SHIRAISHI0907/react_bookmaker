// 管理画面の入口チェック（AdminLayout の右側を包む）
//  GET /v1/api/admin/setup-status で未対応（新規シーズン・新規チームの未確認、チームの重複など）を見て、
//  ブロック対象の未対応が残っているときは、対応用の画面（system_view_master の setup_flg = 1）以外を開けなくする。
//  対応用の画面では、上に残りの未対応を出す。チェックは画面の移動・30秒ごと・タブに戻ったときに取り直す。
//  チェックを増やすときは、web に SetupCheck の実装を足して system_view_master に行を登録するだけでよい（この画面は変更不要）。
import { useEffect, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { adminPath, isMenuItemActive } from "../../api/auth/adminMenu";

type SetupItem = {
  checkCode: string;
  checkName: string;
  count: number;
  details: string[];
  viewCode: string | null;
  viewName: string | null;
  path: string | null;
  block: boolean;
  error: string | null;
};
type SetupView = { viewCode: string; viewName: string; path: string };
type SetupStatus = { blocked: boolean; items: SetupItem[]; setupViews: SetupView[] };

export const SETUP_STATUS_QUERY_KEY = ["admin-setup-status"];

async function fetchSetupStatus(): Promise<SetupStatus> {
  const res = await fetch("/v1/api/admin/setup-status", { credentials: "include", cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export default function SetupGate({ children }: { children: ReactNode }) {
  const location = useLocation();
  const q = useQuery({
    queryKey: SETUP_STATUS_QUERY_KEY,
    queryFn: fetchSetupStatus,
    staleTime: 10_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  // 画面を移動したら取り直す（対応用の画面で解消してから戻ったときにすぐ反映する）
  useEffect(() => {
    void q.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // 取得に失敗したときは止めない（管理画面が全部開けなくなるのを防ぐ）
  if (!q.data) return <>{children}</>;

  const pending = q.data.items.filter((i) => i.count > 0);
  const onSetupView = q.data.setupViews.some((v) => isMenuItemActive(location.pathname, v.path));

  if (q.data.blocked && !onSetupView) {
    return <BlockedPage items={pending} />;
  }

  return (
    <>
      {pending.length > 0 && <PendingBanner items={pending} currentPath={location.pathname} />}
      {children}
    </>
  );
}

/** ブロック中: 画面の代わりに出す案内 */
function BlockedPage({ items }: { items: SetupItem[] }) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-xl border border-red-200 bg-white p-5">
        <div className="mb-3 flex items-center gap-2 text-red-700">
          <AlertTriangle className="h-5 w-5" />
          <h2 className="m-0 text-base font-bold">先に以下の対応が必要です</h2>
        </div>
        <p className="mb-4 text-sm text-gray-600">新しく登録されたデータの確認、または重複の解消が終わるまで、ほかの管理画面は開けません。</p>
        <div className="space-y-3">
          {items.map((i) => (
            <PendingCard key={i.checkCode} item={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PendingCard({ item }: { item: SetupItem }) {
  return (
    <section className={`rounded-lg border p-3 ${item.block ? "border-red-200 bg-red-50/60" : "border-amber-200 bg-amber-50/60"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-gray-900">{item.checkName}</span>
        <span className={`rounded-full px-2 py-px text-xs font-bold ${item.block ? "bg-red-600 text-white" : "bg-amber-500 text-white"}`}>{item.count} 件</span>
        {!item.block && <span className="text-[11px] text-amber-700">（警告のみ）</span>}
        {item.path && (
          <Link to={adminPath(item.path)} className="ml-auto inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-bold text-white no-underline hover:bg-indigo-700">
            {item.viewName ?? "対応する画面"}へ
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      {item.details.length > 0 && (
        <ul className="mt-2 max-h-40 list-disc space-y-0.5 overflow-auto pl-5 text-xs text-gray-700">
          {item.details.map((d, k) => (
            <li key={k}>{d}</li>
          ))}
          {item.count > item.details.length && <li className="list-none text-gray-400">ほか {item.count - item.details.length} 件</li>}
        </ul>
      )}
    </section>
  );
}

/** 対応用の画面・警告だけのとき: 上に残りの未対応を細く出す */
function PendingBanner({ items, currentPath }: { items: SetupItem[]; currentPath: string }) {
  return (
    <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
      <span className="mr-2 font-bold">未対応：</span>
      {items.map((i, k) => {
        const here = i.path != null && isMenuItemActive(currentPath, i.path);
        return (
          <span key={i.checkCode} className="mr-3 inline-flex items-center gap-1">
            {k > 0 && <span className="text-amber-400">/</span>}
            {i.path && !here ? (
              <Link to={adminPath(i.path)} className="font-bold text-amber-900 underline">
                {i.checkName} {i.count}件
              </Link>
            ) : (
              <span className="font-bold">
                {i.checkName} {i.count}件{here ? "（この画面）" : ""}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
