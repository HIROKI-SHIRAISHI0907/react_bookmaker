// src/pages/personal/teams/Team.tsx
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchTeamsInLeague, type TeamsInLeague } from "../../../api/leagues";
import { Skeleton } from "../../../components/ui/skeleton";
import AppHeader from "../../../components/layout/AppHeader";

function normalizeQuerySubLeague(v?: string | null) {
  const s = (v ?? "").trim();
  if (!s) return null;
  if (s === "未設定") return null;
  return s;
}

export default function LeagueTeams() {
  const { countrySlug = "", leagueSlug = "" } = useParams<{
    countrySlug: string;
    leagueSlug: string;
  }>();

  const [searchParams] = useSearchParams();
  const subLeague = normalizeQuerySubLeague(searchParams.get("subLeague"));

  const { data, isLoading, isError, error } = useQuery<TeamsInLeague>({
    queryKey: ["teams-in-league", countrySlug, leagueSlug, subLeague],
    queryFn: () => fetchTeamsInLeague(countrySlug, leagueSlug, subLeague),
    staleTime: 60_000,
    enabled: !!countrySlug && !!leagueSlug,
  });

  const countryLabel = data?.country ?? countrySlug;
  const leagueLabel = data?.league ?? leagueSlug;
  const currentSubLeague = data?.subLeague ?? subLeague ?? null;
  const teams = data?.teams ?? [];

  const leagueRoutingPath = teams[0]?.path || `/soccer/${countrySlug}/${leagueSlug}`;

  const rankingRoute = currentSubLeague && currentSubLeague.trim() ? `/ranking${leagueRoutingPath}?subLeague=${encodeURIComponent(currentSubLeague)}` : `/ranking${leagueRoutingPath}`;

  if (isError) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="チーム一覧" subtitle={currentSubLeague ? `${countryLabel} / ${leagueLabel} / ${currentSubLeague}` : `${countryLabel} / ${leagueLabel}`} />

        <main className="container mx-auto px-4 py-6">
          <h1 className="mb-2 text-2xl font-bold">
            {countryLabel} / {leagueLabel}
            {currentSubLeague ? ` / ${currentSubLeague}` : ""}
          </h1>
          <p className="text-destructive">{error instanceof Error ? error.message : "データの取得に失敗しました"}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="チーム一覧" subtitle={currentSubLeague ? `${countryLabel} / ${leagueLabel} / ${currentSubLeague}` : `${countryLabel} / ${leagueLabel}`} />

      <main className="container mx-auto px-4 py-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">
              {countryLabel} / {leagueLabel}
              {currentSubLeague ? ` / ${currentSubLeague}` : ""}
            </h1>
            <p className="text-sm text-muted-foreground">{currentSubLeague ? "Team List (Sub League)" : "Team List (All Teams)"}</p>
          </div>

          <Link to="/live" className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent">
            現在開催中の試合 →
          </Link>

          <Link to={rankingRoute} className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent">
            順位表 →
          </Link>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="rounded border p-3">
                <Skeleton className="mb-2 h-5 w-48" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && teams.length === 0 && <div className="text-muted-foreground">表示するチームがありません。</div>}

        {!isLoading && teams.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((t) => (
              <Link key={t.routingPath} to={t.routingPath} className="group rounded border p-3 transition-colors hover:bg-accent">
                <div className="font-medium">{t.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">{t.routingPath}</div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
