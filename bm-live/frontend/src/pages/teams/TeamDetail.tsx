// frontend/src/pages/TeamDetail.tsx
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";

// API
import { fetchTeamDetail, type TeamDetail as TeamDetailType } from "../../api/leagues";
import { fetchTeamCorrelations, type TeamCorrelationsPayload } from "../../api/correlations";
import { fetchTeamFeatureStats, type TeamStatsResponse } from "../../api/eachstats";
import { fetchFutureMatches, type FutureMatchesResponse } from "../../api/upcomings";

// UI
import AppHeader from "../../components/layout/AppHeader";
import { Skeleton } from "../../components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import CorrelationPanel from "../../components/correlation/CorrelationPanel";
import TeamFeaturePanel from "../../components/feature/TeamFeaturePanel";
import FutureMatchesList from "../../components/future/FutureMatchesList";

export default function TeamDetail() {
  const params = useParams<{ country?: string; league?: string; team?: string; teams?: string }>();

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

  // ---- 相手チームの選択（相関タブ用 / 空=全相手） ----
  const [opponent, setOpponent] = useState<string>("");

  // ---- タブ状態 ----
  const [tab, setTab] = useState<"correlation" | "feature" | "future" | "players">("correlation");

  // ---- Queries ----
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

  const futureQ = useQuery<FutureMatchesResponse>({
    queryKey: ["team-future", countryLabel, leagueLabel, teamSlug],
    queryFn: () => fetchFutureMatches(countryLabel, leagueLabel, teamSlug),
    enabled: !!countryLabel && !!leagueLabel && !!teamSlug,
    staleTime: 60_000,
  });

  // 相手候補（相関が持っていれば使う）
  const opponentOptions = useMemo(() => {
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

  const isCorrEmpty = useMemo(() => {
    const d = corrQ.data?.correlations;
    if (!d) return false; // 未確定時はここでは空とみなさない
    const sum =
      (d.HOME?.["1st"]?.length ?? 0) + (d.HOME?.["2nd"]?.length ?? 0) + (d.HOME?.ALL?.length ?? 0) + (d.AWAY?.["1st"]?.length ?? 0) + (d.AWAY?.["2nd"]?.length ?? 0) + (d.AWAY?.ALL?.length ?? 0);
    return sum === 0;
  }, [corrQ.data]);

  // 戻りリンク
  const toBack = `/${encodeURIComponent(countryLabel)}/${encodeURIComponent(leagueLabel)}`;

  // ヘッダーの副題（リーグ/チーム）
  const headerSubtitle = detailQ.data ? `${countryLabel} / ${leagueLabel} / ${detailQ.data.name}` : `${countryLabel} / ${leagueLabel}`;

  return (
    <div className="min-h-screen bg-background">
      {/* ハンバーガー付きヘッダー（Top と同じ AppHeader を使用） */}
      <AppHeader title="チーム詳細" subtitle={headerSubtitle} />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* パンくず */}
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
          <div className="text-destructive">チーム情報の取得に失敗しました</div>
        ) : detailQ.data ? (
          <div>
            <h1 className="text-2xl font-bold">{detailQ.data.name}</h1>
            <p className="text-sm text-muted-foreground">
              英語スラッグ: <code>{detailQ.data.english}</code>
            </p>
          </div>
        ) : null}

        {/* タブ切り替え */}
        <Tabs value={tab} onValueChange={(v: string) => setTab(v as any)} className="space-y-4">
          <TabsList>
            <TabsTrigger value="correlation">相関</TabsTrigger>
            <TabsTrigger value="feature">統計</TabsTrigger>
            <TabsTrigger value="future">試合予定</TabsTrigger>
            <TabsTrigger value="players">選手</TabsTrigger>
          </TabsList>

          {/* 相関タブ */}
          <TabsContent value="correlation">
            <section>
              <div className="mb-2 flex items-center gap-2">
                <h2 className="text-xl font-bold">相関係数（上位5件）</h2>
                <select value={opponent} onChange={(e) => setOpponent(e.target.value)} className="ml-auto rounded-md border px-2 py-1 text-sm bg-background">
                  <option value="">全対戦相手</option>
                  {opponentOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>

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
          </TabsContent>

          {/* 統計タブ */}
          <TabsContent value="feature">
            <section className="space-y-3">
              <h2 className="text-xl font-bold">チーム統計（要約）</h2>
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

          {/* 試合予定タブ */}
          <TabsContent value="future">
            <section className="space-y-3">
              <h2 className="text-xl font-bold">今後の試合</h2>
              {futureQ.isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-44" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : futureQ.isError ? (
                <div className="text-muted-foreground">予定試合の取得に失敗しました。</div>
              ) : !futureQ.data ? null : (
                <FutureMatchesList items={futureQ.data.items} />
              )}
            </section>
          </TabsContent>

          {/* 選手タブ（今後の実装用プレースホルダ） */}
          <TabsContent value="players">
            <section className="space-y-3">
              <h2 className="text-xl font-bold">選手</h2>
              <div className="text-muted-foreground text-sm">選手データは近日対応予定です。</div>
            </section>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
