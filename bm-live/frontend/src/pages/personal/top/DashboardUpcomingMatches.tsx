// これからの試合（全試合画面）  /upcoming?league=国 / リーグ&hours=36|72|168&fav=1
//  GET /v1/api/upcoming-matches
//  期間・リーグ・チーム名・お気に入りだけ で絞り込み。チーム名 → チームの過去の結果（/team-results）
import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Search, Star } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Skeleton } from "../../../components/ui/skeleton";
import AppHeader from "../../../components/layout/AppHeader";
import { isAuthenticated } from "../../../utils/auth";
import { fetchDashboardFavorites, fetchUpcomingMatches } from "../../../api/dashboard/topapi";
import type { DashboardUpcomingLeague, DashboardUpcomingMatch } from "../../../api/dashboard/types";
import { GoalsBadge, RankBadge, TeamGrades, WdlBar, formatKickoff } from "./parts";
import { TeamLink } from "../teams/TeamForm";

const PERIODS = [
  { hours: 36, label: "今日・明日" },
  { hours: 72, label: "3日間" },
  { hours: 168, label: "7日間" },
] as const;

export default function UpcomingMatches() {
  const navigate = useNavigate();
  const loggedIn = isAuthenticated();
  const [params, setParams] = useSearchParams();
  const league = params.get("league") ?? "";
  const hours = Number(params.get("hours")) || 36;
  const favOnly = loggedIn && params.get("fav") === "1";
  const [keyword, setKeyword] = useState("");

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  // リーグのチップは絞り込み前の全リーグから作るので、league はサーバーに渡さず画面側で絞る
  const all = useQuery({
    queryKey: ["upcoming-matches", hours, loggedIn],
    queryFn: () => fetchUpcomingMatches(hours),
    staleTime: 60_000,
    refetchInterval: 300_000,
  });

  const favorites = useQuery({
    queryKey: ["dashboard-favorites"],
    queryFn: fetchDashboardFavorites,
    enabled: loggedIn,
    staleTime: 30_000,
  });
  const favoriteTeams = useMemo(() => new Set((favorites.data?.items ?? []).map((f) => f.teamName)), [favorites.data]);

  const leagues: DashboardUpcomingLeague[] = useMemo(() => {
    const src = all.data?.leagues ?? [];
    const kw = keyword.trim().toLowerCase();
    return src
      .filter((l) => !league || l.leagueLabel === league)
      .map((l) => ({
        ...l,
        matches: l.matches.filter(
          (m) => (!kw || m.home.name.toLowerCase().includes(kw) || m.away.name.toLowerCase().includes(kw)) && (!favOnly || favoriteTeams.has(m.home.name) || favoriteTeams.has(m.away.name)),
        ),
      }))
      .filter((l) => l.matches.length > 0);
  }, [all.data, league, keyword, favOnly, favoriteTeams]);

  const shown = leagues.reduce((n, l) => n + l.matches.length, 0);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="これからの試合" subtitle={`全${all.data?.totalCount ?? 0}試合・${all.data?.totalLeagueCount ?? 0}リーグ`} />

      <main className="container mx-auto space-y-4 px-4 py-6">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} data-testid="button-back">
            <ArrowLeft className="mr-1 h-4 w-4" />
            戻る
          </Button>
          <div className="flex gap-1">
            {PERIODS.map((p) => (
              <button
                key={p.hours}
                type="button"
                onClick={() => setParam("hours", p.hours === 36 ? null : String(p.hours))}
                className={`rounded-full px-3 py-1 text-xs font-bold ${hours === p.hours ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"}`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {loggedIn && (
            <button
              type="button"
              onClick={() => setParam("fav", favOnly ? null : "1")}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${favOnly ? "bg-amber-400 text-slate-950" : "bg-muted text-muted-foreground hover:text-foreground"}`}
              data-testid="button-fav-only"
            >
              <Star className="h-3 w-3" />
              お気に入りだけ
            </button>
          )}
          <label className="ml-auto flex items-center gap-1 rounded-lg border px-2 py-1">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="チーム名で探す" className="w-40 bg-transparent text-sm outline-none" data-testid="input-team-search" />
          </label>
        </div>

        {/* リーグで絞る */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <LeagueChip active={!league} onClick={() => setParam("league", null)} label="すべて" count={all.data?.totalCount ?? 0} />
          {(all.data?.leagues ?? []).map((l) => (
            <LeagueChip key={l.leagueLabel} active={league === l.leagueLabel} onClick={() => setParam("league", l.leagueLabel)} label={l.leagueLabel} count={l.totalCount} />
          ))}
        </div>

        {all.isLoading ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : all.error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">これからの試合の取得に失敗しました: {(all.error as Error).message}</div>
        ) : leagues.length === 0 ? (
          <div className="rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">
            該当する試合はありません
            {favOnly && (
              <div className="mt-2 text-xs">
                お気に入りのチームは
                <Link to="/favorite-edit" className="mx-1 font-bold text-emerald-600 hover:underline">
                  お気に入りの編集
                </Link>
                で追加できます
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="text-xs text-muted-foreground">{shown} 試合</div>
            {leagues.map((l) => (
              <section key={l.leagueLabel} className="space-y-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold">{l.leagueLabel}</h2>
                  <span className="text-[11px] text-muted-foreground">{l.matches.length}試合</span>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {l.matches.map((m) => (
                    <MatchCard key={`${m.kickoff}-${m.home.name}-${m.away.name}`} m={m} favoriteTeams={favoriteTeams} />
                  ))}
                </div>
              </section>
            ))}
          </>
        )}

        <div className="pt-2 text-center">
          <Link to="/top" className="text-xs text-muted-foreground hover:text-foreground">
            トップへ戻る
          </Link>
        </div>
      </main>
    </div>
  );
}

function LeagueChip({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs ${active ? "bg-foreground font-bold text-background" : "bg-muted text-muted-foreground hover:text-foreground"}`}
    >
      {label} <span className="font-mono">{count}</span>
    </button>
  );
}

function MatchCard({ m, favoriteTeams }: { m: DashboardUpcomingMatch; favoriteTeams: Set<string> }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-300">{formatKickoff(m.kickoff)}</span>
        <span className="flex min-w-0 items-center gap-2">
          {m.roundLabel && <span className="truncate text-[10px] text-muted-foreground">{m.roundLabel}</span>}
          <GoalsBadge f={m.forecast} />
        </span>
      </div>
      <div className="mt-1.5 space-y-1 text-sm">
        {[m.home, m.away].map((t, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <RankBadge rank={t.rank} />
              <TeamLink country={m.country} league={m.league} team={t.name} className="truncate font-semibold">
                {favoriteTeams.has(t.name) && <span className="text-amber-500">★ </span>}
                {t.name}
              </TeamLink>
            </div>
            <TeamGrades team={t} />
          </div>
        ))}
      </div>
      <div className="mt-2">
        <WdlBar f={m.forecast} />
      </div>
    </div>
  );
}
