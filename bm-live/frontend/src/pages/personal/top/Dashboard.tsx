// frontend/src/pages/personal/top/Dashboard.tsx
import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "../../../lib/queryClient";
import MatchHeader from "../../../components/MatchHeader";
import StatsGrid from "../../../components/StatsGrid";
import ThemeToggle from "../../../components/ThemeToggle";
import { Button } from "../../../components/ui/button";
import { Skeleton } from "../../../components/ui/skeleton";
import AppHeader from "../../../components/layout/AppHeader";
import { RefreshCw } from "lucide-react";
import NoticeRibbon from "../../../pages/personal/component/notice/NoticeRibbon";

// 全試合ライブ情報
type LiveMatchDTO = {
  seq: number;
  dataCategory: string;
  times: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number | null;
  awayScore: number | null;
  homeExp: number | null;
  awayExp: number | null;
  homeShootIn: number | null;
  awayShootIn: number | null;
  recordTime: string;
  link: string | null;
  homeSlug: string | null;
  awaySlug: string | null;
};

type MultiLiveMatchesResponse = {
  matches: LiveMatchDTO[];
  count: number;
};

type LeagueLiveGroup = {
  leagueLabel: string;
  matches: LiveMatchDTO[];
};

// --- デザイン確認用: 型定義 & モック --------------------
type TeamPair = { home: number; away: number };

type MatchStats = {
  shotsOnTarget: TeamPair;
  totalShots: TeamPair;
  possession: TeamPair; // 例: パーセント
  passes: TeamPair;
  dribbles: TeamPair;
  tackles: TeamPair;
  corners: TeamPair;
  fouls: TeamPair;
  offsides: TeamPair;
};

type MatchDetails = {
  match: {
    id: string;
    status: "LIVE" | "HT" | "FT";
    matchTime: string;
    competition: string;
    homeTeam: { name: string; shortName: string };
    awayTeam: { name: string; shortName: string };
    homeScore?: number;
    awayScore?: number;
  };
  stats: MatchStats; // ← 配列ではなくオブジェクト
};

function getLeagueLabel(dataCategory?: string) {
  const s = (dataCategory ?? "").trim();
  if (!s) return "その他";

  const [countryPart, afterColon = ""] = s.split(":", 2);
  const country = countryPart?.trim() ?? "";
  const league = afterColon.split("-")[0]?.trim() ?? "";

  if (country && league) return `${country} / ${league}`;
  if (league) return league;
  return s;
}

const MOCK_MATCH: MatchDetails = {
  match: {
    id: "match1",
    status: "LIVE",
    matchTime: "67'",
    competition: "Sample League",
    homeTeam: { name: "Home United", shortName: "HOME" },
    awayTeam: { name: "Away City", shortName: "AWAY" },
    homeScore: 2,
    awayScore: 1,
  },
  stats: {
    shotsOnTarget: { home: 6, away: 3 },
    totalShots: { home: 12, away: 9 },
    possession: { home: 56, away: 44 },
    passes: { home: 420, away: 365 },
    dribbles: { home: 8, away: 6 },
    tackles: { home: 14, away: 11 },
    corners: { home: 7, away: 4 },
    fouls: { home: 9, away: 12 },
    offsides: { home: 2, away: 1 },
  },
};
// --------------------------------------------------------

export default function Dashboard() {
  const [selectedMatchId, setSelectedMatchId] = useState("match1");

  const {
    data: allLiveMatches,
    isLoading: allLiveLoading,
    error: allLiveError,
  } = useQuery<MultiLiveMatchesResponse, Error>({
    queryKey: ["all-live-matches"],
    queryFn: async () => {
      const res = await fetch("/v1/api/live-matches/all", {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      return res.json();
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const {
    data: matchDetails,
    isLoading,
    error,
  } = useQuery<MatchDetails>({
    queryKey: ["match-details", selectedMatchId],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 400));
      return MOCK_MATCH;
    },
    staleTime: 30_000,
  });

  // Refresh mutation for manual updates
  const refreshMutation = useMutation({
    mutationFn: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["match-details", selectedMatchId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["all-live-matches"],
        }),
      ]);
    },
  });

  const handleRefresh = () => refreshMutation.mutate();

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Error Loading Match Data</h2>
          <p className="text-muted-foreground mb-4">Failed to load match information</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const groupedLiveMatches = useMemo<LeagueLiveGroup[]>(() => {
    const matches = allLiveMatches?.matches ?? [];
    if (!matches.length) return [];

    const map = new Map<string, LiveMatchDTO[]>();

    for (const match of matches) {
      const leagueLabel = getLeagueLabel(match.dataCategory);

      if (!map.has(leagueLabel)) {
        map.set(leagueLabel, []);
      }
      map.get(leagueLabel)!.push(match);
    }

    return Array.from(map.entries())
      .map(([leagueLabel, list]) => ({
        leagueLabel,
        matches: [...list].sort((a, b) => {
          const ta = a.times ?? "";
          const tb = b.times ?? "";
          return ta.localeCompare(tb, "ja");
        }),
      }))
      .sort((a, b) => a.leagueLabel.localeCompare(b.leagueLabel, "ja"));
  }, [allLiveMatches]);

  {
    /* 正常トップページ */
  }
  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        title="統計データ"
        subtitle="Live Match Dashboard"
        rightSlot={
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshMutation.isPending} data-testid="button-refresh" className="hover-elevate">
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <NoticeRibbon />

      {/* LIVE 一覧 */}
      <main className="container mx-auto px-4 py-6">
        <section className="mb-6 rounded-xl border bg-card p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">ライブ</h2>
              <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">LIVE</span>
            </div>

            <div className="text-sm text-muted-foreground">{allLiveMatches?.count ?? 0}試合</div>
          </div>

          {allLiveLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-lg border p-4">
                  <Skeleton className="mb-3 h-5 w-40" />
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : allLiveError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">ライブ試合の取得に失敗しました: {allLiveError.message}</div>
          ) : groupedLiveMatches.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">現在ライブ中の試合はありません</div>
          ) : (
            <div className="space-y-4">
              {groupedLiveMatches.map((group) => (
                <div key={group.leagueLabel} className="rounded-lg border bg-background p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="font-semibold text-foreground">{group.leagueLabel}</div>
                    <div className="text-xs text-muted-foreground">{group.matches.length}試合</div>
                  </div>

                  <div className="space-y-2">
                    {group.matches.map((match) => (
                      <div key={match.seq} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
                        <div className="min-w-0">
                          <div className="mb-1 flex items-center gap-2">
                            <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">ライブ</span>
                            <span className="text-xs text-muted-foreground">{match.times}</span>
                          </div>

                          <div className="truncate text-sm font-medium text-foreground">
                            {match.homeTeamName} <span className="text-muted-foreground">vs</span> {match.awayTeamName}
                          </div>
                        </div>

                        <div className="ml-4 shrink-0 text-right">
                          <div className="text-lg font-bold text-foreground">
                            {match.homeScore ?? 0} - {match.awayScore ?? 0}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {match.recordTime
                              ? new Date(match.recordTime).toLocaleTimeString("ja-JP", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {isLoading ? (
          <div className="space-y-6">
            {/* Match Header Skeleton */}
            <div className="p-6 border rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-6 w-20" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-8" />
                  <Skeleton className="h-6 w-4" />
                  <Skeleton className="h-10 w-8" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-16 w-16 rounded-full" />
                </div>
              </div>
            </div>

            {/* Stats Grid Skeleton */}
            <div>
              <Skeleton className="h-6 w-40 mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                    <Skeleton className="h-2 w-full mb-2" />
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-8" />
                      <Skeleton className="h-3 w-8" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : matchDetails ? (
          <>
            <MatchHeader
              homeTeam={{
                name: matchDetails.match.homeTeam.name,
                logo: matchDetails.match.homeTeam.shortName,
                score: matchDetails.match.homeScore || 0,
              }}
              awayTeam={{
                name: matchDetails.match.awayTeam.name,
                logo: matchDetails.match.awayTeam.shortName,
                score: matchDetails.match.awayScore || 0,
              }}
              matchTime={matchDetails.match.matchTime || "0'"}
              status={matchDetails.match.status as "LIVE" | "HT" | "FT"}
              competition={matchDetails.match.competition}
            />

            <div className="mb-6">
              <h2 className="text-xl font-bold mb-4" data-testid="text-statistics-title">
                Match Statistics
              </h2>
              <StatsGrid stats={matchDetails.stats} />
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
