// src/pages/teams/OverviewDetail.tsx
import { Link, useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Trophy, TrendingUp, TrendingDown, Shield, Target, AlertTriangle } from "lucide-react";
import AppHeader from "../../components/layout/AppHeader";
import { Skeleton } from "../../components/ui/skeleton";
import { fetchScheduleOverview, type ScheduleOverviewResponse, type SurfaceSnapshot } from "../../api/scheduled_overviews";

// ★ Recharts 追加
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

function Badge({ icon, text, tone = "default" }: { icon: React.ReactNode; text: string; tone?: "default" | "good" | "bad" }) {
  const color = tone === "good" ? "text-green-700 bg-green-100 border-green-200" : tone === "bad" ? "text-red-700 bg-red-100 border-red-200" : "text-foreground bg-muted border-border";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${color}`}>
      {icon}
      {text}
    </span>
  );
}

function badgesFromSurface(s: SurfaceSnapshot) {
  const list: JSX.Element[] = [];
  if (s.consecutive_win_disp) list.push(<Badge key="win" icon={<TrendingUp className="w-3 h-3" />} text={s.consecutive_win_disp} tone="good" />);
  if (s.consecutive_lose_disp) list.push(<Badge key="lose-b" icon={<TrendingDown className="w-3 h-3" />} text={s.consecutive_lose_disp} tone="bad" />);
  if (s.unbeaten_streak_disp) list.push(<Badge key="unbeat" icon={<Shield className="w-3 h-3" />} text={s.unbeaten_streak_disp} />);
  if (s.consecutive_score_count_disp) list.push(<Badge key="score" icon={<Target className="w-3 h-3" />} text={s.consecutive_score_count_disp} />);
  if (s.first_week_game_win_disp) list.push(<Badge key="first" icon={<Trophy className="w-3 h-3" />} text={s.first_week_game_win_disp} tone="good" />);
  if (s.mid_week_game_win_disp) list.push(<Badge key="mid" icon={<Trophy className="w-3 h-3" />} text={s.mid_week_game_win_disp} tone="good" />);
  if (s.last_week_game_win_disp) list.push(<Badge key="last" icon={<Trophy className="w-3 h-3" />} text={s.last_week_game_win_disp} tone="good" />);
  return list;
}

// ===== 置き換え: ユーティリティ =====
const toNum = (v: number | null | undefined) => (v == null ? null : Number(v));

// 軽い共通Tooltip
const SimpleTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border bg-popover px-2 py-1 text-xs shadow-sm">
      <div className="font-medium">{payload[0].payload.label}</div>
      <div className="tabular-nums">{payload[0].value}</div>
    </div>
  );
};

// 追加：ユーティリティ
const num = (v: unknown): number | null => {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

// 追加：1枚にまとめた横棒チャート
function StatsSummaryChart({ s }: { s: SurfaceSnapshot }) {
  const toNum = (v: unknown) => (v == null ? null : Number.isFinite(Number(v)) ? Number(v) : null);

  const rows = [
    { label: "合計得点", value: toNum(s.goals_for) },
    { label: "クリーンシート", value: toNum(s.clean_sheets) },
    { label: "前半得点", value: toNum(s.first_half_score) },
    { label: "後半得点", value: toNum(s.second_half_score) },
    { label: "先制回数", value: toNum(s.first_goal_count) },
    { label: "逆転勝利数", value: toNum(s.win_behind_count) },
    { label: "逆転敗北数", value: toNum(s.lose_behind_count) },
    { label: "該当側勝利数", value: toNum(s.win_count_role) },
    { label: "該当側敗北数", value: toNum(s.lose_count_role) },
    { label: "無得点試合数", value: toNum(s.fail_to_score_game_count) },
  ].filter((r) => r.value !== null);

  if (rows.length === 0 || rows.every((r) => (r.value ?? 0) === 0)) {
    return <div className="text-xs text-muted-foreground">表示できるスタッツのデータがありません。</div>;
  }

  const data = rows.map((r) => ({ label: r.label, value: r.value ?? 0 })).sort((a, b) => b.value - a.value);

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 20, bottom: 10, left: 40 }}
          barCategoryGap={40} // ← スタッツ同士の間隔を拡大
          barGap={8} // ← 同じカテゴリ内のバー間隔（今回は単一バーなので軽めに）
        >
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

  const { data, isLoading, isError } = useQuery<ScheduleOverviewResponse>({
    queryKey: ["scheduled-overview", countryRaw, leagueRaw, seqNum, home, away],
    queryFn: () => fetchScheduleOverview(countryRaw, leagueRaw, seqNum, { home, away }),
    enabled: Number.isFinite(seqNum) && (!!home || !!away),
    staleTime: 30_000,
  });

  const backTo = `/${country}/${league}/${team}`;

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
        ) : (
          <>
            <header className="space-y-1">
              <h1 className="text-2xl font-bold">
                {data.match.home_team} vs {data.match.away_team}
              </h1>
              <div className="text-sm text-muted-foreground">
                {data.match.round_no != null ? `ラウンド ${data.match.round_no} · ` : ""}
                {data.match.future_time ? new Date(data.match.future_time).toLocaleString("ja-JP") : "日程情報なし"}
                {data.match.game_year && data.match.game_month ? ` · ${data.match.game_year}年${data.match.game_month}月` : ""}
              </div>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.surfaces.map((s) => (
                <div key={s.team} className="rounded-xl border bg-card p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-semibold">{s.team}</h2>
                    <div className="text-sm text-muted-foreground">
                      勝点 {s.winning_points ?? "-"} / {s.games ?? "-"}試合
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">{badgesFromSurface(s)}</div>

                  <div className="grid grid-cols-3 gap-3 text-sm mb-4">
                    <div className="rounded-lg border p-3">
                      <div className="text-xs text-muted-foreground">順位</div>
                      <div className="text-xl font-bold">{s.rank ?? "-"}</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-xs text-muted-foreground">成績</div>
                      <div className="text-xl font-bold">
                        {s.win ?? 0}勝-{s.draw ?? 0}分-{s.lose ?? 0}敗
                      </div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-xs text-muted-foreground">試合数</div>
                      <div className="text-xl font-bold">{s.games ?? "-"}</div>
                    </div>
                  </div>

                  {/* ▼ ここから追加：ミニ棒グラフ */}
                  <div className="rounded-lg border p-3 mt-2">
                    <div className="text-xs text-muted-foreground mb-1">主要スタッツ（役割に応じて自動切替）</div>
                    <StatsSummaryChart s={s} />
                  </div>
                  {/* ▲ 追加ここまで */}
                </div>
              ))}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
