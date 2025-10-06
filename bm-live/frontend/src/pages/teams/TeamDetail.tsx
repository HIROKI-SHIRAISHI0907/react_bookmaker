// frontend/src/pages/TeamDetail.tsx
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { fetchTeamDetail, type TeamDetail as TeamDetailType } from "../../api/leagues";
import { fetchTeamCorrelations, type TeamCorrelationsPayload } from "../../api/correlations";
import { fetchTeamFeatureStats, type TeamStatsResponse } from "../../api/eachstats";
import { fetchFutureMatches, type FutureMatch } from "../../api/upcomings";
import { fetchTeamGames, type GameMatch } from "../../api/games";

import AppHeader from "../../components/layout/AppHeader";
import CorrelationPanel from "../../components/correlation/CorrelationPanel";
import TeamFeaturePanel from "../../components/feature/TeamFeaturePanel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { Skeleton } from "../../components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

export default function TeamDetail() {
  const params = useParams<{ country?: string; league?: string; team?: string; teams?: string }>();

  const countryParam = params.country ?? "";
  const leagueParam = params.league ?? "";
  const teamSlug = params.team ?? params.teams ?? "";

  const safeDecode = (s: string) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  };
  const countryLabel = safeDecode(countryParam);
  const leagueLabel = safeDecode(leagueParam);

  // 相手チーム選択（相関/統計用）
  const [opponent, setOpponent] = useState<string>("");

  // --------- Queries ----------
  const detailQ = useQuery<TeamDetailType>({
    queryKey: ["team-detail", countryLabel, leagueLabel, teamSlug],
    queryFn: () => fetchTeamDetail(countryLabel, leagueLabel, teamSlug),
    enabled: !!countryLabel && !!leagueLabel && !!teamSlug,
    staleTime: 10_000,
  });

  const corrQ = useQuery<TeamCorrelationsPayload>({
    queryKey: ["team-correlations", countryLabel, leagueLabel, teamSlug, opponent],
    queryFn: () => fetchTeamCorrelations(countryLabel, leagueLabel, teamSlug, opponent || undefined),
    enabled: !!countryLabel && !!leagueLabel && !!teamSlug,
    staleTime: 10_000,
  });

  const statsQ = useQuery<TeamStatsResponse>({
    queryKey: ["team-stats", countryLabel, leagueLabel, teamSlug],
    queryFn: () => fetchTeamFeatureStats(countryLabel, leagueLabel, teamSlug),
    enabled: !!countryLabel && !!leagueLabel && !!teamSlug,
    staleTime: 10_000,
  });

  // 試合予定（future.ts が返す SCHEDULED）
  const futureQ = useQuery({
    queryKey: ["future-matches", countryLabel, leagueLabel, teamSlug],
    queryFn: () => fetchFutureMatches(teamSlug, { country: countryLabel, league: leagueLabel }),
    enabled: !!countryLabel && !!leagueLabel && !!teamSlug,
    staleTime: 30_000,
  });

  // 開催中/試合終了（game.ts が返す LIVE or FINISHED）
  const gameQ = useQuery<{ live: GameMatch[]; finished: GameMatch[] }>({
    queryKey: ["game-matches", countryLabel, leagueLabel, teamSlug],
    queryFn: () => fetchTeamGames(teamSlug, { country: countryLabel, league: leagueLabel }),
    enabled: !!countryLabel && !!leagueLabel && !!teamSlug,
    staleTime: 30_000,
  });

  // 相手候補
  const opponentOptions = useMemo<string[]>(() => (corrQ.data?.opponents ?? []) as string[], [corrQ.data]);

  // 相関のスケルトン遅延表示
  const [showCorrSkeleton, setShowCorrSkeleton] = useState(false);
  useEffect(() => {
    if (corrQ.isLoading) {
      const t = setTimeout(() => setShowCorrSkeleton(true), 300);
      return () => clearTimeout(t);
    }
    setShowCorrSkeleton(false);
  }, [corrQ.isLoading]);

  const isCorrEmpty = useMemo<boolean>(() => {
    const d = corrQ.data?.correlations;
    if (!d) return false;
    const sum =
      (d.HOME?.["1st"]?.length ?? 0) + (d.HOME?.["2nd"]?.length ?? 0) + (d.HOME?.ALL?.length ?? 0) + (d.AWAY?.["1st"]?.length ?? 0) + (d.AWAY?.["2nd"]?.length ?? 0) + (d.AWAY?.ALL?.length ?? 0);
    return sum === 0;
  }, [corrQ.data]);

  // 並び順: ラウンド番号(小) → 試合時間(早)
  type RoundTimeItem = { round_no: number | null; future_time: string };
  const sortByRoundAndTime = (a: RoundTimeItem, b: RoundTimeItem) => {
    const ra = a.round_no ?? Number.POSITIVE_INFINITY;
    const rb = b.round_no ?? Number.POSITIVE_INFINITY;
    if (ra !== rb) return ra - rb;
    return new Date(a.future_time).getTime() - new Date(b.future_time).getTime();
  };

  // 開催中 or 試合終了（どちらか一方のみ表示）
  const liveSorted = useMemo<GameMatch[]>(() => (gameQ.data?.live ?? []).slice().sort(sortByRoundAndTime), [gameQ.data]);
  const finishedSorted = useMemo<GameMatch[]>(() => (gameQ.data?.finished ?? []).slice().sort(sortByRoundAndTime), [gameQ.data]);

  const hasLive = liveSorted.length > 0;
  const currentTitle = hasLive ? "開催中" : "試合終了";
  const displayMatches: GameMatch[] = hasLive ? liveSorted : finishedSorted;

  // 予定
  const scheduledMatches = useMemo<FutureMatch[]>(() => (futureQ.data ?? []).slice().sort(sortByRoundAndTime), [futureQ.data]);

  // 戻るリンク/ヘッダ
  const toBack = `/${encodeURIComponent(countryLabel)}/${encodeURIComponent(leagueLabel)}`;
  const headerSubtitle = detailQ.data ? `${countryLabel} / ${leagueLabel} / ${detailQ.data.name}` : `${countryLabel} / ${leagueLabel}`;

  // ★ 過去対戦履歴ページへのパス（params はエンコード済みをそのまま使う）
  const historyPath = `/${countryParam}/${leagueParam}/${teamSlug}/history`;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="チーム詳細" subtitle={headerSubtitle} />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* パンくず */}
        <div className="mb-2 flex items-center gap-3">
          <Link to={toBack} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline">
            <ArrowLeft className="w-4 h-4" />
            {countryLabel} / {leagueLabel} に戻る
          </Link>
        </div>

        {/* 見出し */}
        {!teamSlug ? (
          <div className="text-sm text-muted-foreground">チームが指定されていません。</div>
        ) : detailQ.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-4 w-64" />
          </div>
        ) : detailQ.isError ? (
          <div className="text-destructive">チーム情報の取得に失敗しました。</div>
        ) : detailQ.data ? (
          <div>
            <h1 className="text-2xl font-bold">{detailQ.data.name}</h1>
            <p className="text-sm text-muted-foreground">
              英語スラッグ: <code>{detailQ.data.english}</code>
            </p>
          </div>
        ) : null}

        {/* タブ */}
        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="stats">統計</TabsTrigger>
            <TabsTrigger value="matches">試合</TabsTrigger>
            <TabsTrigger value="players">選手</TabsTrigger>
          </TabsList>

          {/* ---- 統計タブ ---- */}
          <TabsContent value="stats" className="space-y-3">
            <section>
              <h2 className="mb-2 text-xl font-bold">相関係数（上位5件）</h2>
              {showCorrSkeleton ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-40" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : corrQ.isError ? (
                <div className="text-muted-foreground">表示ができませんでした。</div>
              ) : corrQ.isLoading ? null : !corrQ.data || isCorrEmpty ? (
                <div className="text-muted-foreground">表示するデータがありません。</div>
              ) : (
                <CorrelationPanel data={corrQ.data.correlations} opponents={corrQ.data.opponents} opponent={opponent} onOpponentChange={setOpponent} />
              )}
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">チーム統計（要約）</h2>
                <select value={opponent} onChange={(e) => setOpponent(e.target.value)} className="ml-auto rounded-md border px-2 py-1 text-sm bg-background">
                  <option value="">全対戦相手</option>
                  {opponentOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              {statsQ.isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-40" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : statsQ.isError ? (
                <div className="text-muted-foreground">統計データの取得に失敗しました。</div>
              ) : !statsQ.data ? null : (
                <TeamFeaturePanel data={statsQ.data.stats} />
              )}
            </section>
          </TabsContent>

          {/* ---- 試合タブ ---- */}
          <TabsContent value="matches" className="space-y-6">
            {/* ★ 過去の対戦履歴ページへの導線 */}
            <div className="flex items-center justify-end">
              <Link
                to={historyPath}
                onClick={(e) => e.stopPropagation()} // ← 親の onClick/Link へ伝播させない
                className="inline-flex items-center text-sm font-medium rounded-md border px-3 py-1.5 hover:bg-accent"
              >
                過去の対戦履歴を見る →
              </Link>
            </div>

            {/* 当日（JST）に public.data でヒットしたときだけ表示 */}
            {!!(gameQ.data && (gameQ.data.live.length || gameQ.data.finished.length)) && (
              <section>
                {(() => {
                  const list = gameQ.data!;
                  const anyLive = list.live.length > 0;
                  const title = anyLive ? "開催中" : "試合終了";
                  const rows = anyLive ? list.live : list.finished;

                  // 見栄えのため時刻昇順
                  const sorted = [...rows].sort((a, b) => new Date(a.future_time).getTime() - new Date(b.future_time).getTime());

                  return (
                    <>
                      <h3 className="mb-2 text-base font-semibold">{title}</h3>
                      <div className="rounded-xl border bg-card p-4 shadow-sm">
                        {gameQ.isLoading ? (
                          <div className="text-sm text-muted-foreground">読み込み中...</div>
                        ) : (
                          <ul className="divide-y">
                            {sorted.map((it) => (
                              <li key={it.seq} className="flex items-center gap-3 py-2">
                                <div className="w-32 shrink-0 text-sm">
                                  {it.round_no != null ? <span className="font-bold">ラウンド {it.round_no}</span> : <span className="text-muted-foreground">ラウンド -</span>}
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm">
                                    {it.home_team} vs {it.away_team}
                                    {it.status === "LIVE" && <span className="ml-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] leading-none">LIVE</span>}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {/* 当日の最新 times を表示（終了なら「終了済」等、LIVEなら "68:09" など） */}
                                    {it.latest_times ?? "-"}
                                    {it.link ? (
                                      <>
                                        {" "}
                                        ·{" "}
                                        <a href={it.link} target="_blank" rel="noreferrer" className="underline">
                                          詳細
                                        </a>
                                      </>
                                    ) : null}
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </>
                  );
                })()}
              </section>
            )}

            {/* 開催予定 */}
            <section>
              <h3 className="mb-2 text-base font-semibold">開催予定</h3>
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                {futureQ.isLoading ? (
                  <div className="text-sm text-muted-foreground">読み込み中...</div>
                ) : scheduledMatches.length === 0 ? (
                  <div className="text-sm text-muted-foreground">開催予定の試合はありません。</div>
                ) : (
                  <ul className="divide-y">
                    {scheduledMatches.map((it) => (
                      <li key={it.seq} className="flex items-center gap-3 py-2">
                        <div className="w-32 shrink-0 text-sm">
                          {it.round_no != null ? <span className="font-bold">ラウンド {it.round_no}</span> : <span className="text-muted-foreground">ラウンド -</span>}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm">
                            {it.home_team} vs {it.away_team}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(it.future_time).toLocaleString()}
                            {it.link ? (
                              <>
                                {" "}
                                ·{" "}
                                <a href={it.link} target="_blank" rel="noreferrer" className="underline">
                                  詳細
                                </a>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </TabsContent>

          {/* ---- 選手タブ（プレースホルダ） ---- */}
          <TabsContent value="players">
            <div className="rounded-xl border bg-card p-6 shadow-sm text-sm text-muted-foreground">選手データは準備中です。</div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
