// frontend/src/pages/personal/top/Dashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "../../../lib/queryClient";
import MatchHeader from "../../../components/MatchHeader";
import StatsGrid from "../../../components/StatsGrid";
import { Button } from "../../../components/ui/button";
import { Skeleton } from "../../../components/ui/skeleton";
import AppHeader from "../../../components/layout/AppHeader";
import { RefreshCw } from "lucide-react";
import NoticeRibbon from "../../../pages/personal/component/notice/NoticeRibbon";

// =========================
// 型定義
// =========================

// 全試合ライブ情報
type LiveMatchDTO = {
  seq: number;
  dataCategory: string;
  times: string;
  subLeague: string | null;
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

type SubLeagueGroup = {
  subLeagueLabel: string;
  matches: LiveMatchDTO[];
};

type MultiLiveMatchesResponse = {
  matches: LiveMatchDTO[];
  count: number;
};

type LeagueLiveGroup = {
  leagueLabel: string;
  matches: LiveMatchDTO[];
};

// デザイン確認用: モック
type TeamPair = { home: number; away: number };

type MatchStats = {
  shotsOnTarget: TeamPair;
  totalShots: TeamPair;
  possession: TeamPair;
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
  stats: MatchStats;
};

// =========================
// Utils
// =========================
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

function formatTimeOnly(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const GAME_DETAIL_SEQ_KEY = "game-detail-seq";

// =========================
// Mock
// =========================
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

// =========================
// Page
// =========================
export default function Dashboard() {
  const navigate = useNavigate();
  const selectedMatchId = "match1";
  const [selectedLeagueTab, setSelectedLeagueTab] = useState<string>("");

  const handleOpenGameDetail = (seq: number) => {
    if (!seq || seq <= 0) return;
    sessionStorage.setItem(GAME_DETAIL_SEQ_KEY, String(seq));
    navigate("/gameDetail");
  };

  // 全ライブ取得
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

  // 既存のダッシュボード表示用モック
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

  // Refresh
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

  // ライブ試合をリーグごとにまとめる
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

  // タブの初期選択 / データ変更追従
  useEffect(() => {
    if (groupedLiveMatches.length === 0) {
      setSelectedLeagueTab("");
      return;
    }

    const exists = groupedLiveMatches.some((g) => g.leagueLabel === selectedLeagueTab);

    if (!exists) {
      setSelectedLeagueTab(groupedLiveMatches[0].leagueLabel);
    }
  }, [groupedLiveMatches, selectedLeagueTab]);

  // 選択中タブの試合一覧
  const activeLiveGroup = useMemo(() => {
    if (!selectedLeagueTab) return null;
    return groupedLiveMatches.find((g) => g.leagueLabel === selectedLeagueTab) ?? null;
  }, [groupedLiveMatches, selectedLeagueTab]);

  const activeSubLeagueGroups = useMemo<SubLeagueGroup[]>(() => {
    const matches = activeLiveGroup?.matches ?? [];
    if (!matches.length) return [];

    const map = new Map<string, LiveMatchDTO[]>();

    for (const match of matches) {
      const subLeagueLabel = (match.subLeague ?? "").trim() || "全体";

      if (!map.has(subLeagueLabel)) {
        map.set(subLeagueLabel, []);
      }
      map.get(subLeagueLabel)!.push(match);
    }

    return Array.from(map.entries())
      .map(([subLeagueLabel, list]) => ({
        subLeagueLabel,
        matches: [...list].sort((a, b) => {
          const ta = a.times ?? "";
          const tb = b.times ?? "";
          return ta.localeCompare(tb, "ja");
        }),
      }))
      .sort((a, b) => a.subLeagueLabel.localeCompare(b.subLeagueLabel, "ja"));
  }, [activeLiveGroup]);

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

      <main className="container mx-auto px-4 py-6">
        {/* LIVE 一覧 */}
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
              {/* タブ一覧 */}
              <div className="overflow-x-auto">
                <div className="flex min-w-max gap-2 pb-1">
                  {groupedLiveMatches.map((group) => {
                    const active = selectedLeagueTab === group.leagueLabel;

                    return (
                      <button
                        key={group.leagueLabel}
                        type="button"
                        onClick={() => setSelectedLeagueTab(group.leagueLabel)}
                        className={[
                          "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
                          active ? "border-red-200 bg-red-50 text-red-700" : "border-border bg-background text-foreground hover:bg-muted",
                        ].join(" ")}
                      >
                        <span>{group.leagueLabel}</span>
                        <span className={["rounded-full px-2 py-0.5 text-xs", active ? "bg-red-100 text-red-700" : "bg-muted text-muted-foreground"].join(" ")}>{group.matches.length}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 選択中リーグの試合一覧 */}
              {activeLiveGroup && (
                <div className="rounded-lg border bg-background p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="font-semibold text-foreground">{activeLiveGroup.leagueLabel}</div>
                    <div className="text-xs text-muted-foreground">{activeLiveGroup.matches.length}試合</div>
                  </div>

                  <div className="space-y-4">
                    {activeSubLeagueGroups.map((subGroup) => (
                      <div key={subGroup.subLeagueLabel} className="rounded-lg border bg-card p-3">
                        <div className="mb-3 flex items-center justify-between">
                          <div className="text-sm font-semibold text-foreground">{subGroup.subLeagueLabel}</div>
                          <div className="text-xs text-muted-foreground">{subGroup.matches.length}試合</div>
                        </div>

                        <div className="space-y-2">
                          {subGroup.matches.map((match) => (
                            <button
                              key={match.seq}
                              type="button"
                              onClick={() => handleOpenGameDetail(match.seq)}
                              className="flex w-full items-center justify-between rounded-lg border bg-background px-4 py-3 text-left transition hover:bg-muted/40"
                            >
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
                                <div className="text-xs text-muted-foreground">{formatTimeOnly(match.recordTime)}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* 既存ダッシュボード */}
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
