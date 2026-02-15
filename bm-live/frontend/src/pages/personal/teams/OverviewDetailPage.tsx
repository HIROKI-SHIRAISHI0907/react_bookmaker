// src/pages/teams/OverviewDetail.tsx
import { Link, useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, TrendingUp, TrendingDown, ShieldCheck, Flame, Award, AlertTriangle, ArrowUp, ArrowDown, Home as HomeIcon, Plane, Activity, Flag, Rocket } from "lucide-react";
import AppHeader from "../../../components/layout/AppHeader";
import { Skeleton } from "../../../components/ui/skeleton";
import { fetchScheduleOverview, type ScheduleOverviewApi, type ScheduleOverviewResponse, type SurfaceSnapshot } from "../../../api/scheduled_overviews";

// ★ Recharts 追加
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

// ---- 追加: API の 200/空 を安全に扱うためのローカル型 ----
const isOverviewOK = (d: ScheduleOverviewApi): d is ScheduleOverviewResponse => !!d && Array.isArray((d as any).surfaces);

// ---- 既存: バッジ ----
function Badge({ icon, text, tone = "default" }: { icon: React.ReactNode; text: string; tone?: "default" | "good" | "bad" }) {
  const color = tone === "good" ? "text-green-700 bg-green-100 border-green-200" : tone === "bad" ? "text-red-700 bg-red-100 border-red-200" : "text-foreground bg-muted border-border";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${color}`}>
      {icon}
      {text}
    </span>
  );
}

// ---- 修正: バッジ生成 ----
function badgesFromSurface(s: SurfaceSnapshot, opts?: { isHome?: boolean; isAway?: boolean }): React.ReactNode {
  const list: JSX.Element[] = [];

  // 直近連勝表示（3連勝以上）
  if (s.consecutiveWinDisp) {
    list.push(<Badge key="consecutive-win" icon={<TrendingUp className="w-3 h-3" />} text={s.consecutiveWinDisp} tone="good" />);
  }

  // 直近連敗表示（3連敗以上）
  if (s.consecutiveLoseDisp) {
    list.push(<Badge key="consecutive-lose" icon={<TrendingDown className="w-3 h-3" />} text={s.consecutiveLoseDisp} tone="bad" />);
  }

  // 無敗記録表示（無敗が3回連続）
  if (s.unbeatenStreakDisp) {
    list.push(<Badge key="unbeaten" icon={<ShieldCheck className="w-3 h-3" />} text={s.unbeatenStreakDisp} />);
  }

  // 得点継続表示（3試合連続得点）
  if (s.consecutiveScoreCountDisp) {
    list.push(<Badge key="scoring-streak" icon={<Flame className="w-3 h-3" />} text={s.consecutiveScoreCountDisp} tone="good" />);
  }

  // 序盤好調（勝率7割以上）
  if (s.firstWeekGameWinDisp) {
    list.push(<Badge key="first-week-hot" icon={<Rocket className="w-3 h-3" />} text={s.firstWeekGameWinDisp} tone="good" />);
  }

  // 中盤好調（勝率7割以上）
  if (s.midWeekGameWinDisp) {
    list.push(<Badge key="mid-week-hot" icon={<Activity className="w-3 h-3" />} text={s.midWeekGameWinDisp} tone="good" />);
  }

  // 終盤好調（勝率7割以上）
  if (s.lastWeekGameWinDisp) {
    list.push(<Badge key="last-week-hot" icon={<Flag className="w-3 h-3" />} text={s.lastWeekGameWinDisp} tone="good" />);
  }

  // 初勝利表示（5試合以上未勝利→初勝利）
  if (s.firstWinDisp) {
    list.push(<Badge key="first-win" icon={<Award className="w-3 h-3" />} text={s.firstWinDisp} tone="good" />);
  }

  // 負けが混んだ時（4連敗以上）
  if (s.loseStreakDisp) {
    list.push(<Badge key="lose-streak" icon={<AlertTriangle className="w-3 h-3" />} text={s.loseStreakDisp} tone="bad" />);
  }

  // 昇格表示（昇格組）
  if (s.promoteDisp) {
    list.push(<Badge key="promote" icon={<ArrowUp className="w-3 h-3" />} text={s.promoteDisp} tone="good" />);
  }

  // 降格表示（降格組）
  if (s.descendDisp) {
    list.push(<Badge key="descend" icon={<ArrowDown className="w-3 h-3" />} text={s.descendDisp} tone="bad" />);
  }

  // 逆境系（3割以上逆転勝利）※ホーム/アウェーで出し分け
  if (opts?.isHome && s.homeAdversityDisp) {
    list.push(<Badge key="home-adversity" icon={<HomeIcon className="w-3 h-3" />} text={s.homeAdversityDisp} tone="good" />);
  }
  if (opts?.isAway && s.awayAdversityDisp) {
    list.push(<Badge key="away-adversity" icon={<Plane className="w-3 h-3" />} text={s.awayAdversityDisp} tone="good" />);
  }

  return list.length ? list : null;
}

// 追加：1枚にまとめた横棒チャート
function StatsSummaryChart({ s }: { s: SurfaceSnapshot }) {
  const toNum = (v: unknown) => (v == null ? null : Number.isFinite(Number(v)) ? Number(v) : null);

  const rows = [
    { label: "合計得点", value: toNum(s.goalsFor) },
    { label: "クリーンシート", value: toNum(s.cleanSheets) },
    { label: "前半得点", value: toNum(s.firstHalfScore) },
    { label: "後半得点", value: toNum(s.secondHalfScore) },
    { label: "先制回数", value: toNum(s.firstGoalCount) },
    { label: "逆転勝利数", value: toNum(s.winBehindCount) },
    { label: "逆転敗北数", value: toNum(s.loseBehindCount) },
    { label: "該当側勝利数", value: toNum(s.winCountRole) },
    { label: "該当側敗北数", value: toNum(s.loseCountRole) },
    { label: "無得点試合数", value: toNum(s.failToScoreGameCount) },
  ].filter((r) => r.value !== null);

  if (rows.length === 0 || rows.every((r) => (r.value ?? 0) === 0)) {
    return <div className="text-xs text-muted-foreground">表示できるスタッツのデータがありません。</div>;
  }

  const data = rows.map((r) => ({ label: r.label, value: r.value ?? 0 })).sort((a, b) => b.value - a.value);

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 10, right: 20, bottom: 10, left: 40 }} barCategoryGap={40} barGap={8}>
          <CartesianGrid vertical strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" domain={[0, 20]} allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
          <YAxis dataKey="label" type="category" width={84} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="value" fill="#000000" barSize={12} radius={[4, 4, 4, 4]} minPointSize={2} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function OverviewDetail() {
  const { country = "", league = "", team = "", seq = "" } = useParams<{ country: string; league: string; team: string; seq: string }>();
  const loc = useLocation();
  const sp = new URLSearchParams(loc.search);
  const home = sp.get("home") ?? undefined;
  const away = sp.get("away") ?? undefined;

  const countryRaw = decodeURIComponent(country);
  const leagueRaw = decodeURIComponent(league);
  const seqNum = Number(seq);

  // ★ ここを ScheduleOverviewApi に（ローカル型）
  const { data, isLoading, isError } = useQuery<ScheduleOverviewApi>({
    queryKey: ["scheduled-overview", countryRaw, leagueRaw, seqNum, home, away],
    queryFn: () => fetchScheduleOverview(countryRaw, leagueRaw, seqNum, { home, away }) as Promise<ScheduleOverviewApi>,
    enabled: Number.isFinite(seqNum) && (!!home || !!away),
    staleTime: 30_000,
  });

  const backTo = `/${country}/${league}/${team}`;

  // ★ 「試合データがありません」判定
  const noData =
    !!data &&
    ("message" in data || // { message: "..."} のケース
      (isOverviewOK(data) && data.surfaces.length === 0)); // surfaces 空配列

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="開催予定 詳細" subtitle={`${countryRaw} / ${leagueRaw}`} />
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="mb-2">
          <Link to={backTo} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline">
            <ArrowLeft className="w-4 h-4" /> 戻る
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-80" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : isError ? (
          <div className="text-destructive">データ取得に失敗しました。</div>
        ) : !data ? (
          <div className="text-sm text-muted-foreground">パラメータが不足しています（home / away）。</div>
        ) : noData ? (
          // ★ 例外扱いにせず、明示文言で表示
          <div className="text-sm text-muted-foreground">試合データがありません。</div>
        ) : (
          // ★ ここからは通常データがある場合のみ描画
          <>
            <header className="space-y-1">
              <h1 className="text-2xl font-bold">
                {data.match.home_team} vs {data.match.away_team}
              </h1>
              <div className="text-sm text-muted-foreground">
                {data.match.round_no != null ? `ラウンド ${data.match.round_no} · ` : ""}
                {data.match.future_time ? `開催予定: ${new Date(data.match.future_time).toLocaleString("ja-JP")}` : "日程情報なし"}
                {data.match.game_year && data.match.game_month ? ` · ${data.match.game_year}年${data.match.game_month}月` : ""}
              </div>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.surfaces.map((s) => {
                const isHome = s.team === data.match.home_team;
                const isAway = s.team === data.match.away_team;

                // 値の取得（camelCase → snake_case → 役割依存のフォールバックの順）
                const homeWins = s.homeWinCount ?? (s as any).homeWinCount ?? (isHome ? s.winCountRole : null) ?? 0;
                const homeLoses = s.homeLoseCount ?? (s as any).homeLoseCount ?? (isHome ? s.loseCountRole : null) ?? 0;
                const awayWins = s.awayWinCount ?? (s as any).awayWinCount ?? (isAway ? s.winCountRole : null) ?? 0;
                const awayLoses = s.awayLoseCount ?? (s as any).awayLoseCount ?? (isAway ? s.loseCountRole : null) ?? 0;

                return (
                  <div key={s.team} className="rounded-xl border bg-card p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-lg font-semibold">
                        {s.team} {isHome ? "(HOME)" : isAway ? "(AWAY)" : ""}
                      </h2>

                      {/* ★ 勝・敗（メインデータ） */}
                      <div className="text-sm text-muted-foreground flex items-center gap-3">
                        {isHome ? (
                          <>
                            <span className="font-medium">HOME</span>
                            <span>勝 {homeWins}</span>
                            <span>敗 {homeLoses}</span>
                          </>
                        ) : (
                          <>
                            <span className="font-medium">AWAY</span>
                            <span>勝 {awayWins}</span>
                            <span>敗 {awayLoses}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* バッジ（home/away逆境は opts で出し分け） */}
                    <div className="flex flex-wrap gap-2 mb-3">{badgesFromSurface(s, { isHome, isAway })}</div>

                    {/* ▼ ランキング（順位は surface_overview.rank を s.rank に入れて返す想定） */}
                    <div className="grid grid-cols-3 gap-3 text-sm mb-4">
                      <div className="rounded-lg border p-3">
                        <div className="text-xs text-muted-foreground">順位</div>
                        <div className="text-xl font-bold">{s.rank ?? "—"}</div>
                      </div>
                      <div className="rounded-lg border p-3">
                        <div className="text-xs text-muted-foreground">成績</div>
                        <div className="text-xl font-bold">
                          {s.win ?? 0}勝-{s.draw ?? 0}分-{s.lose ?? 0}敗
                        </div>
                      </div>
                      <div className="rounded-lg border p-3">
                        <div className="text-xs text-muted-foreground">試合数</div>
                        <div className="text-xl font-bold">{s.games ?? "—"}</div>
                      </div>
                    </div>

                    {/* 主要スタッツ（そのまま） */}
                    <div className="rounded-lg border p-3 mt-2">
                      <div className="text-xs text-muted-foreground mb-1">主要スタッツ（役割に応じて自動切替）</div>
                      <StatsSummaryChart s={s} />
                    </div>
                  </div>
                );
              })}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
