import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "../../lib/queryClient";
import MatchHeader from "../../components/MatchHeader";
import StatsGrid from "../../components/StatsGrid";
import ThemeToggle from "../../components/ThemeToggle";
import { Button } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
import { RefreshCw } from "lucide-react";

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

  // Fetch match details with real-time stats
  const {
    data: matchDetails,
    isLoading,
    error,
  } = useQuery<MatchDetails>({
    queryKey: ["match-details", selectedMatchId],
    // デザイン確認用：APIは叩かずにモック返却
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 400)); // Skeleton確認用のちょい待ち
      return MOCK_MATCH;
    },
    refetchInterval: false, // API接続に戻したら必要に応じて復活
    staleTime: 30_000,
  });

  // Refresh mutation for manual updates
  const refreshMutation = useMutation({
    mutationFn: async () => {
      await queryClient.invalidateQueries({ queryKey: ["match-details", selectedMatchId] });
    },
  });

  const handleRefresh = () => {
    refreshMutation.mutate();
  };

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

  {
    /* 正常トップページ */
  }
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-app-title">
                統計データ
              </h1>
              <p className="text-muted-foreground text-sm">Live Match Dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshMutation.isPending} data-testid="button-refresh" className="hover-elevate">
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
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
