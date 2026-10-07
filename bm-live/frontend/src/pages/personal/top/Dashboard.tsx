import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { queryClient } from "../../../lib/queryClient";
import { Button } from "../../../components/ui/button";
import { Skeleton } from "../../../components/ui/skeleton";
import AppHeader from "../../../components/layout/AppHeader";
import NoticeRibbon from "../component/notice/NoticeRibbon";
import { isAuthenticated } from "../../../utils/auth";
import { fetchDashboardFavorites, fetchDashboardLive, fetchDashboardSummary, fetchDashboardUpcoming } from "../../../api/dashboard/topapi";
import DashboardKpiCards from "./DashboardKpiCards";
import DashboardFeatured from "./DashboardFeatured";
import DashboardLiveBoard from "./DashboardLiveBoard";
import DashboardUpcoming from "./DashboardUpcoming";
import DashboardFavorites, { DashboardLoginCta } from "./DashboardFavorites";

/* =====================================================================
 * トップ画面（Dashboard）
 *   目的: 得点が入りやすい / 入りにくいチーム、どちらが勝ちそうかを一目で見る
 *   - 数字カード        GET /v1/api/dashboard/summary   （60秒ごと）
 *   - 注目の試合・ライブ GET /v1/api/dashboard/live      （30秒ごと）
 *   - これからの試合     GET /v1/api/dashboard/upcoming  （5分ごと）
 *   - お気に入り         GET /v1/api/dashboard/favorites （ログイン時だけ・60秒ごと）
 *   未ログインは確率・平均得点などの数値がサーバーから返らない（◎○△・バー・多い/少ないは見える）
 * ===================================================================== */

const GAME_DETAIL_SEQ_KEY = "game-detail-seq";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const loggedIn = isAuthenticated();

  const handleOpenGameDetail = (seq: number) => {
    if (!seq || seq <= 0) return;
    sessionStorage.setItem(GAME_DETAIL_SEQ_KEY, String(seq));
    navigate("/gameDetail");
  };

  const summary = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: fetchDashboardSummary,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const live = useQuery({
    queryKey: ["dashboard-live", loggedIn],
    queryFn: fetchDashboardLive,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const upcoming = useQuery({
    queryKey: ["dashboard-upcoming", loggedIn],
    queryFn: () => fetchDashboardUpcoming(20),
    staleTime: 60_000,
    refetchInterval: 300_000,
  });

  const favorites = useQuery({
    queryKey: ["dashboard-favorites"],
    queryFn: fetchDashboardFavorites,
    enabled: loggedIn,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const favoriteTeams = useMemo(() => new Set((favorites.data?.items ?? []).map((f) => f.teamName)), [favorites.data]);

  const refresh = useMutation({
    mutationFn: () =>
      queryClient.invalidateQueries({
        predicate: (q) => String(q.queryKey[0]).startsWith("dashboard-"),
      }),
  });

  const updatedAt = live.data?.updatedAt ? new Date(live.data.updatedAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : null;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        title="統計データ"
        subtitle={updatedAt ? `Live Match Dashboard ・ 更新 ${updatedAt}` : "Live Match Dashboard"}
        rightSlot={
          <Button variant="outline" size="sm" onClick={() => refresh.mutate()} disabled={refresh.isPending} data-testid="button-refresh">
            <RefreshCw className={`mr-2 h-4 w-4 ${refresh.isPending ? "animate-spin" : ""}`} />
            更新
          </Button>
        }
      />

      <NoticeRibbon />

      <main className="container mx-auto space-y-6 px-4 py-6">
        <DashboardKpiCards s={summary.data} />

        {/* 注目の試合 */}
        {live.isLoading ? <Skeleton className="h-72 w-full rounded-2xl" /> : live.data?.featured ? <DashboardFeatured m={live.data.featured} onOpen={handleOpenGameDetail} /> : null}

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* ライブ */}
          {live.isLoading ? (
            <div className="space-y-3 rounded-2xl border bg-card p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : live.error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">ライブ試合の取得に失敗しました: {(live.error as Error).message}</div>
          ) : (
            <DashboardLiveBoard leagues={live.data?.leagues ?? []} count={live.data?.count ?? 0} favoriteTeams={favoriteTeams} loggedIn={loggedIn} onOpen={handleOpenGameDetail} />
          )}

          {/* 右カラム */}
          <aside className="space-y-4">
            {loggedIn ? (
              <DashboardFavorites items={favorites.data?.items ?? []} loading={favorites.isLoading} onOpen={handleOpenGameDetail} />
            ) : (
              <DashboardLoginCta from={location.pathname + location.search} />
            )}
            <DashboardUpcoming matches={upcoming.data?.matches ?? []} loading={upcoming.isLoading} favoriteTeams={favoriteTeams} />
          </aside>
        </div>
      </main>
    </div>
  );
}
