// frontend/src/pages/teams/TeamDetail.tsx
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { fetchTeamDetail, type TeamDetail as TeamDetailType } from "../../api/leagues";
import { fetchTeamCorrelations, type TeamCorrelationsPayload } from "../../api/correlations";
import { fetchTeamFeatureStats, type TeamStatsResponse } from "../../api/eachstats";
import { fetchFutureMatches, type FutureMatch } from "../../api/upcomings";
import { fetchTeamGames, type GameMatch } from "../../api/games";
import { fetchTeamPlayers, type Player } from "../../api/players";

import AppHeader from "../../components/layout/AppHeader";
import CorrelationPanel from "../../components/correlation/CorrelationPanel";
import TeamFeaturePanel from "../../components/feature/TeamFeaturePanel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { Skeleton } from "../../components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

// 月次サマリ API（単数ファイル名を推奨）
import { fetchMonthlyOverview, type MonthlyOverviewResponse } from "../../api/overviews";

// recharts
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

/** times -> “分”表記に統一（HT/第一ハーフ/前半/後半などは原文表示） */
function formatTimesMinute(s?: string | null) {
  if (!s) return "-";
  const t = s.trim();
  if (/ハーフタイム|第一ハーフ|前半|後半/i.test(t)) return t;
  const m1 = t.match(/^(\d{1,3}):\d{2}$/);
  if (m1) return `${Number(m1[1])}'`;
  const m2 = t.match(/^(\d{1,3})'$/);
  if (m2) return `${Number(m2[1])}'`;
  const m3 = t.match(/^(\d{1,3})\+\d{1,2}'$/);
  if (m3) return `${Number(m3[1])}'`;
  return t;
}

export default function TeamDetail() {
  const params = useParams<{ country?: string; league?: string; team?: string; teams?: string }>();
  const navigate = useNavigate();

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

  // ========== Queries ==========
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
  const futureQ = useQuery<FutureMatch[]>({
    queryKey: ["future-matches", countryLabel, leagueLabel, teamSlug],
    queryFn: () => fetchFutureMatches(teamSlug, { country: countryLabel, league: leagueLabel }),
    enabled: !!countryLabel && !!leagueLabel && !!teamSlug,
    staleTime: 30_000,
  });

  // 当日ヒット（LIVE/FINISHED のみ）
  const gameQ = useQuery<{ live: GameMatch[]; finished: GameMatch[] }>({
    queryKey: ["game-matches", countryLabel, leagueLabel, teamSlug],
    queryFn: () => fetchTeamGames(teamSlug, { country: countryLabel, league: leagueLabel }),
    enabled: !!countryLabel && !!leagueLabel && !!teamSlug,
    staleTime: 30_000,
  });

  // 選手
  const playersQ = useQuery<Player[]>({
    queryKey: ["team-players", countryLabel, leagueLabel, teamSlug],
    queryFn: () => fetchTeamPlayers(teamSlug, { country: countryLabel, league: leagueLabel }),
    enabled: !!countryLabel && !!leagueLabel && !!teamSlug,
    staleTime: 60_000,
  });

  // 月次サマリ（合算のみ）
  const monthlyQ = useQuery<MonthlyOverviewResponse>({
    queryKey: ["team-monthly", countryLabel, leagueLabel, teamSlug],
    queryFn: () => fetchMonthlyOverview(countryLabel, leagueLabel, teamSlug),
    enabled: !!countryLabel && !!leagueLabel && !!teamSlug,
    staleTime: 60_000,
  });

  // 単系列メトリクスの選択肢（合算）
  const SINGLE_OPTIONS = {
    winningPoints: { label: "勝点" },
    goalsFor: { label: "得点" },
    cleanSheets: { label: "クリーンシート" },
    games: { label: "試合数" },
  } as const;
  type SingleKey = keyof typeof SINGLE_OPTIONS;
  const [singleMetric, setSingleMetric] = useState<SingleKey>("winningPoints");

  // ========== Utils ==========
  const posOrder = (p?: string | null) => {
    switch (p) {
      case "ゴールキーパー":
        return 1;
      case "ディフェンダー":
        return 2;
      case "ミッドフィルダー":
        return 3;
      case "フォワード":
        return 4;
      default:
        return 9;
    }
  };

  const groupedPlayers = useMemo(() => {
    const list = (playersQ.data ?? []).slice().sort((a, b) => {
      const po = posOrder(a.position) - posOrder(b.position);
      if (po !== 0) return po;
      const ja = a.jersey ?? 9999;
      const jb = b.jersey ?? 9999;
      if (ja !== jb) return ja - jb;
      return a.name.localeCompare(b.name, "ja");
    });

    const groups: Record<string, Player[]> = {};
    for (const p of list) {
      const key = p.position || "その他";
      (groups[key] ||= []).push(p);
    }
    return groups;
  }, [playersQ.data]);

  // 相手候補（相関）
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

  // 当日・予定
  const liveSorted = useMemo<GameMatch[]>(() => (gameQ.data?.live ?? []).slice().sort(sortByRoundAndTime), [gameQ.data]);
  const finishedSorted = useMemo<GameMatch[]>(() => (gameQ.data?.finished ?? []).slice().sort(sortByRoundAndTime), [gameQ.data]);

  const hasLiveToday = liveSorted.length > 0;
  const hasFinishedToday = !hasLiveToday && finishedSorted.length > 0;
  const hasFuture = (futureQ.data?.length ?? 0) > 0;

  const todaysTitle = hasLiveToday ? "開催中" : hasFinishedToday ? "試合終了" : null;
  const todaysMatches: GameMatch[] = hasLiveToday ? liveSorted : hasFinishedToday ? finishedSorted : [];

  const scheduledSorted = useMemo<FutureMatch[]>(() => (futureQ.data ?? []).slice().sort(sortByRoundAndTime), [futureQ.data]);

  // 戻るリンク/ヘッダ
  const toBack = `/${encodeURIComponent(countryLabel)}/${encodeURIComponent(leagueLabel)}`;
  const headerSubtitle = detailQ.data ? `${countryLabel} / ${leagueLabel} / ${detailQ.data.name}` : `${countryLabel} / ${leagueLabel}`;

  // 過去対戦履歴ページへの導線（params はエンコード済みをそのまま使う）
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
            <TabsTrigger value="overview">月次サマリ</TabsTrigger>
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
            {/* 導線 */}
            <div className="flex items-center justify-end gap-2">
              <Link to={`/live`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center text-sm font-medium rounded-md border px-3 py-1.5 hover:bg-accent">
                現在開催中の試合 →
              </Link>
              <Link to={historyPath} onClick={(e) => e.stopPropagation()} className="inline-flex items-center text-sm font-medium rounded-md border px-3 py-1.5 hover:bg-accent">
                過去の対戦履歴を見る →
              </Link>
            </div>

            {/* 当日（開催中 or 試合終了） */}
            {(() => {
              if (!todaysTitle) return null;
              return (
                <section>
                  <h3 className="mb-2 text-base font-semibold">{todaysTitle}</h3>
                  <div className="rounded-xl border bg-card p-4 shadow-sm">
                    {gameQ.isLoading ? (
                      <div className="text-sm text-muted-foreground">読み込み中...</div>
                    ) : (
                      <ul className="divide-y">
                        {todaysMatches.map((it) => {
                          const clickable = (it as any).latest_seq != null;
                          const latestSeq = (it as any).latest_seq as number | null;
                          const detailPath = clickable ? `/${encodeURIComponent(countryLabel)}/${encodeURIComponent(leagueLabel)}/${encodeURIComponent(teamSlug)}/game/${latestSeq}` : "";

                          // 勝敗バッジ
                          const ResultBadge = () => {
                            if (it.status !== "FINISHED") return null;
                            if (it.home_score == null || it.away_score == null || !detailQ.data) return null;

                            const norm = (s: string) =>
                              s
                                .replace(/[\u3000\u00A0]/g, " ")
                                .replace(/\s+/g, " ")
                                .trim()
                                .toLowerCase();
                            const teamName = norm(detailQ.data.name);
                            const home = norm(it.home_team);
                            const away = norm(it.away_team);
                            const hs = Number(it.home_score);
                            const as = Number(it.away_score);

                            let label: "WIN" | "LOSE" | "DRAW" = "DRAW";
                            if (home === teamName) label = hs > as ? "WIN" : hs < as ? "LOSE" : "DRAW";
                            else if (away === teamName) label = as > hs ? "WIN" : as < hs ? "LOSE" : "DRAW";

                            const cls = label === "WIN" ? "bg-green-100 text-green-700" : label === "LOSE" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700";

                            return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${cls}`}>{label}</span>;
                          };

                          const RightPane =
                            it.status === "FINISHED" && it.home_score != null && it.away_score != null ? (
                              <div className="w-28 text-right shrink-0">
                                <div className="text-sm font-semibold tabular-nums">
                                  {it.home_score} <span className="text-muted-foreground">-</span> {it.away_score}
                                </div>
                                <div className="mt-1">
                                  <ResultBadge />
                                </div>
                              </div>
                            ) : null;

                          return (
                            <li key={it.seq} className="py-2">
                              <div
                                role="button"
                                tabIndex={0}
                                className={`flex items-center gap-3 rounded-md px-2 py-2 transition ${clickable ? "hover:bg-accent/40 cursor-pointer" : "opacity-70 cursor-default"}`}
                                onClick={() => clickable && navigate(detailPath)}
                                onKeyDown={(e) => {
                                  if (clickable && (e.key === "Enter" || e.key === " ")) {
                                    e.preventDefault();
                                    navigate(detailPath);
                                  }
                                }}
                              >
                                <div className="w-32 shrink-0 text-sm">
                                  {it.round_no != null ? <span className="font-bold">ラウンド {it.round_no}</span> : <span className="text-muted-foreground">ラウンド -</span>}
                                </div>

                                <div className="flex-1">
                                  <div className="text-sm">
                                    {it.home_team} vs {it.away_team}
                                    {it.status === "LIVE" && <span className="ml-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] leading-none">LIVE</span>}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatTimesMinute((it as any).latest_times)}
                                    {(it as any).link && (
                                      <>
                                        {" "}
                                        &middot;{" "}
                                        <button
                                          type="button"
                                          className="underline"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            window.open((it as any).link, "_blank", "noopener,noreferrer");
                                          }}
                                        >
                                          外部詳細
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* 右側：試合終了のみ表示 */}
                                {RightPane}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </section>
              );
            })()}

            {/* 開催予定（当日の状況に関係なく、件数があれば出す） */}
            {hasFuture && (
              <section>
                <h3 className="mb-2 text-base font-semibold">開催予定</h3>
                <div className="rounded-xl border bg-card p-4 shadow-sm">
                  {futureQ.isLoading ? (
                    <div className="text-sm text-muted-foreground">読み込み中...</div>
                  ) : (
                    <ul className="divide-y">
                      {scheduledSorted.map((it) => {
                        const detailPath = `/${countryParam}/${leagueParam}/${teamSlug}/scheduled/${it.seq}`;
                        return (
                          <li key={it.seq} className="py-2">
                            <div
                              role="button"
                              tabIndex={0}
                              className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-accent/40 transition cursor-pointer"
                              onClick={() => navigate(detailPath)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  navigate(detailPath);
                                }
                              }}
                            >
                              <div className="w-32 shrink-0 text-sm">
                                {it.round_no != null ? <span className="font-bold">ラウンド {it.round_no}</span> : <span className="text-muted-foreground">ラウンド -</span>}
                              </div>
                              <div className="flex-1">
                                <div className="text-sm">
                                  {it.home_team} vs {it.away_team}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(it.future_time).toLocaleString("ja-JP")}
                                  {it.link && (
                                    <>
                                      {" "}
                                      &middot;{" "}
                                      <button
                                        type="button"
                                        className="underline"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          window.open(it.link!, "_blank", "noopener,noreferrer");
                                        }}
                                      >
                                        詳細
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </section>
            )}
          </TabsContent>

          {/* ---- 選手タブ ---- */}
          <TabsContent value="players">
            <section className="space-y-6">
              {playersQ.isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : playersQ.isError ? (
                <div className="rounded-xl border bg-card p-6 shadow-sm text-sm text-destructive">選手データの取得に失敗しました。</div>
              ) : !playersQ.data || playersQ.data.length === 0 ? (
                <div className="rounded-xl border bg-card p-6 shadow-sm text-sm text-muted-foreground">選手データがありません。</div>
              ) : (
                Object.entries(groupedPlayers).map(([pos, members]) => (
                  <div key={pos} className="rounded-xl border bg-card p-4 shadow-sm">
                    <h3 className="mb-3 text-base font-semibold">{pos}</h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {members.map((m) => (
                        <li key={m.id} className="flex items-center gap-3 rounded-lg border p-3">
                          <div className="w-14 h-14 rounded-md overflow-hidden bg-muted shrink-0">{m.face ? <img src={m.face} alt={m.name} className="w-full h-full object-cover" /> : null}</div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              {m.jersey != null && <span className="inline-flex items-center justify-center rounded-md border text-xs px-1.5 py-0.5">#{m.jersey}</span>}
                              <span className="font-medium truncate">{m.name}</span>
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground space-x-2">
                              {m.age != null && <span>{m.age}歳</span>}
                              {m.height && <span>{m.height}</span>}
                              {m.weight && <span>{m.weight}</span>}
                              {m.market_value && <span>市場価値: {m.market_value}</span>}
                            </div>
                            <div className="mt-1 text-[11px] text-muted-foreground space-x-2">
                              {m.loan_belong && <span>レンタル元: {m.loan_belong}</span>}
                              {m.injury && <span>負傷: {m.injury}</span>}
                              {m.contract_until && <span>契約: {m.contract_until} まで</span>}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </section>
          </TabsContent>

          {/* ---- 月次サマリ（合算） ---- */}
          <TabsContent value="overview" className="space-y-6">
            {/* 順位推移（折れ線） */}
            <section className="rounded-xl border bg-card p-4 shadow-sm">
              <h3 className="mb-3 text-base font-semibold">順位の月次推移</h3>
              {monthlyQ.isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : monthlyQ.isError ? (
                <div className="text-muted-foreground text-sm">データ取得に失敗しました。</div>
              ) : !monthlyQ.data || monthlyQ.data.items.length === 0 ? (
                <div className="text-muted-foreground text-sm">表示するデータがありません。</div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyQ.data.items}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis allowDecimals={false} reversed /> {/* 1位が上 */}
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="rank" name="順位" dot />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            {/* 単系列（勝点 / 得点 / クリーンシート / 試合数） */}
            <section className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold">月次メトリクス</h3>
                <select value={singleMetric} onChange={(e) => setSingleMetric(e.target.value as SingleKey)} className="ml-auto rounded-md border px-2 py-1 text-sm bg-background">
                  {Object.entries(SINGLE_OPTIONS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>

              {monthlyQ.isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : monthlyQ.isError ? (
                <div className="text-muted-foreground text-sm">データ取得に失敗しました。</div>
              ) : !monthlyQ.data || monthlyQ.data.items.length === 0 ? (
                <div className="text-muted-foreground text-sm">表示するデータがありません。</div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyQ.data.items}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey={singleMetric} name={SINGLE_OPTIONS[singleMetric].label} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            {/* 勝・分・負（月） */}
            <section className="rounded-xl border bg-card p-4 shadow-sm">
              <h3 className="mb-3 text-base font-semibold">勝・分・負（月）</h3>
              {monthlyQ.isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : monthlyQ.isError ? (
                <div className="text-muted-foreground text-sm">データ取得に失敗しました。</div>
              ) : !monthlyQ.data || monthlyQ.data.items.length === 0 ? (
                <div className="text-muted-foreground text-sm">表示するデータがありません。</div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyQ.data.items}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      {/* 積み上げ表示にしたい場合は stackId を同じ値にする */}
                      <Bar dataKey="win" name="勝" /* stackId="result" */ />
                      <Bar dataKey="draw" name="分" /* stackId="result" */ />
                      <Bar dataKey="lose" name="負" /* stackId="result" */ />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
