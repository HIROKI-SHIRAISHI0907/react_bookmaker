// frontend/src/pages/TeamDetail.tsx
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { fetchTeamDetail, type TeamDetail as TeamDetailType } from "../../api/leagues";
import { fetchTeamCorrelations, type TeamCorrelationsPayload } from "../../api/correlations";
import { Skeleton } from "../../components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import CorrelationPanel from "../../components/correlation/CorrelationPanel";
import { fetchTeamFeatureStats, type TeamStatsResponse } from "../../api/eachstats";
import TeamFeaturePanel from "../../components/feature/TeamFeaturePanel";
import AppHeader from "../../components/layout/AppHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { fetchFutureMatches, type FutureMatch } from "../../api/upcomings";

export default function TeamDetail() {
  const params = useParams<{
    country?: string;
    league?: string;
    team?: string;
    teams?: string;
  }>();

  // ルーターから来る値（多くは encodeURIComponent 済み）
  const countryParam = params.country ?? "";
  const leagueParam = params.league ?? "";
  const teamSlug = params.team ?? params.teams ?? "";

  // 表示用 & API 入力用に decode
  const safeDecode = (s: string) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  };
  const countryLabel = safeDecode(countryParam);
  const leagueLabel = safeDecode(leagueParam);

  // ---- 相手チームの選択（空=全相手） ----
  const [opponent, setOpponent] = useState<string>("");

  // ---- Queries ----
  const detailQ = useQuery<TeamDetailType>({
    queryKey: ["team-detail", countryLabel, leagueLabel, teamSlug],
    queryFn: () => fetchTeamDetail(countryLabel, leagueLabel, teamSlug),
    enabled: !!countryLabel && !!leagueLabel && !!teamSlug,
    staleTime: 10_000,
  });

  const corrQ = useQuery<TeamCorrelationsPayload>({
    // opponent をキーに含めて選択変更で再フェッチ
    queryKey: ["team-correlations", countryLabel, leagueLabel, teamSlug, opponent],
    queryFn: () => fetchTeamCorrelations(countryLabel, leagueLabel, teamSlug, opponent || undefined),
    enabled: !!countryLabel && !!leagueLabel && !!teamSlug,
    staleTime: 10_000,
  });

  // 統計データ
  const statsQ = useQuery<TeamStatsResponse>({
    queryKey: ["team-stats", countryLabel, leagueLabel, teamSlug],
    queryFn: () => fetchTeamFeatureStats(countryLabel, leagueLabel, teamSlug),
    enabled: !!countryLabel && !!leagueLabel && !!teamSlug,
    staleTime: 10_000,
  });

  // 試合（開催中/予定）
  const futureQ = useQuery<FutureMatch[]>({
    queryKey: ["future-matches", teamSlug],
    queryFn: () => fetchFutureMatches(teamSlug),
    enabled: !!teamSlug,
    staleTime: 30_000,
  });

  // opponent 候補（相関が持っていれば使う）
  const opponentOptions = useMemo<string[]>(() => {
    return (corrQ.data?.opponents ?? []) as string[];
  }, [corrQ.data]);

  // ---- Correlation Loading Skeleton（300ms遅延で表示）----
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
    if (!d) return false; // 未確定時は空とみなさない
    const sum =
      (d.HOME?.["1st"]?.length ?? 0) + (d.HOME?.["2nd"]?.length ?? 0) + (d.HOME?.ALL?.length ?? 0) + (d.AWAY?.["1st"]?.length ?? 0) + (d.AWAY?.["2nd"]?.length ?? 0) + (d.AWAY?.ALL?.length ?? 0);
    return sum === 0;
  }, [corrQ.data]);

  // 戻りリンク（表示用のラベルを再エンコード）
  const toBack = `/${encodeURIComponent(countryLabel)}/${encodeURIComponent(leagueLabel)}`;

  // ヘッダーの副題（リーグ/チーム）
  const headerSubtitle = detailQ.data ? `${countryLabel} / ${leagueLabel} / ${detailQ.data.name}` : `${countryLabel} / ${leagueLabel}`;

  // 並べ替え（ラウンド番号 → 試合時間）
  const sortByRoundAndTime = (a: FutureMatch, b: FutureMatch) => {
    const ra = a.round_no ?? Number.POSITIVE_INFINITY;
    const rb = b.round_no ?? Number.POSITIVE_INFINITY;
    if (ra !== rb) return ra - rb;
    return new Date(a.future_time).getTime() - new Date(b.future_time).getTime();
  };

  const liveMatches = useMemo<FutureMatch[]>(() => (futureQ.data ?? []).filter((m: FutureMatch) => m.status === "LIVE").sort(sortByRoundAndTime), [futureQ.data]);
  const scheduledMatches = useMemo<FutureMatch[]>(() => (futureQ.data ?? []).filter((m: FutureMatch) => m.status === "SCHEDULED").sort(sortByRoundAndTime), [futureQ.data]);

  return (
    <div className="min-h-screen bg-background">
      {/* ← ハンバーガー付きヘッダー */}
      <AppHeader title="チーム詳細" subtitle={headerSubtitle} />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* パンくず（常時表示） */}
        <div className="mb-2 flex items-center gap-3">
          <Link to={toBack} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline">
            <ArrowLeft className="w-4 h-4" />
            {countryLabel} / {leagueLabel} に戻る
          </Link>
        </div>

        {/* チーム見出し */}
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

          {/* 統計タブ */}
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
                {/* 相手選択（相関に合わせて） */}
                <select value={opponent} onChange={(e) => setOpponent(e.target.value)} className="ml-auto rounded-md border px-2 py-1 text-sm bg-background">
                  <option value="">全対戦相手</option>
                  {opponentOptions.map((o: string) => (
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

          {/* 試合タブ */}
          <TabsContent value="matches" className="space-y-6">
            {/* 開催中 */}
            <section>
              <h3 className="mb-2 text-base font-semibold">開催中</h3>
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                {futureQ.isLoading ? (
                  <div className="text-sm text-muted-foreground">読み込み中...</div>
                ) : liveMatches.length === 0 ? (
                  <div className="text-sm text-muted-foreground">開催中の試合はありません。</div>
                ) : (
                  <ul className="divide-y">
                    {liveMatches.map((it: FutureMatch) => (
                      <li key={it.seq} className="flex items-center gap-3 py-2">
                        <div className="w-32 shrink-0 text-sm">
                          {it.round_no != null ? <span className="font-bold">ラウンド {it.round_no}</span> : <span className="text-muted-foreground">ラウンド -</span>}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm">
                            {it.home_team} vs {it.away_team}
                            <span className="ml-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] leading-none">LIVE</span>
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
                    {scheduledMatches.map((it: FutureMatch) => (
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

          {/* 選手タブ（APIが整うまでのプレースホルダ） */}
          <TabsContent value="players">
            <div className="rounded-xl border bg-card p-6 shadow-sm text-sm text-muted-foreground">選手データは準備中です。</div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
