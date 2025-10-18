import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Trophy, TrendingUp, TrendingDown, Shield, Target, AlertTriangle } from "lucide-react";
import AppHeader from "../../components/layout/AppHeader";
import { Skeleton } from "../../components/ui/skeleton";
import { fetchMonthlyOverview, type MonthlyOverviewResponse } from "../../api/overviews";

function Badge({ icon, text, tone = "default" }: { icon: React.ReactNode; text: string; tone?: "default" | "good" | "bad" }) {
  const color = tone === "good" ? "text-green-700 bg-green-100 border-green-200" : tone === "bad" ? "text-red-700 bg-red-100 border-red-200" : "text-foreground bg-muted border-border";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${color}`}>
      {icon}
      {text}
    </span>
  );
}

function badgesFromSurface(s: MonthlyOverviewResponse) {
  const list: JSX.Element[] = [];
  if (s.consecutive_win_disp) list.push(<Badge key="win" icon={<TrendingUp className="w-3 h-3" />} text={s.consecutive_win_disp} tone="good" />);
  if (s.unbeaten_streak_disp) list.push(<Badge key="unbeat" icon={<Shield className="w-3 h-3" />} text={s.unbeaten_streak_disp} />);
  if (s.consecutive_score_count_disp) list.push(<Badge key="score" icon={<Target className="w-3 h-3" />} text={s.consecutive_score_count_disp} />);
  if (s.first_win_disp) list.push(<Badge key="first" icon={<Trophy className="w-3 h-3" />} text={s.first_win_disp} tone="good" />);
  if (s.lose_streak_disp || s.consecutive_lose_disp) {
    const t = s.lose_streak_disp ?? s.consecutive_lose_disp!;
    list.push(<Badge key="lose" icon={<TrendingDown className="w-3 h-3" />} text={t} tone="bad" />);
  }
  if (s.promote_disp) list.push(<Badge key="promote" icon={<TrendingUp className="w-3 h-3" />} text={s.promote_disp} tone="good" />);
  if (s.descend_disp) list.push(<Badge key="descend" icon={<TrendingDown className="w-3 h-3" />} text={s.descend_disp} tone="bad" />);
  if (s.home_adversity_disp) list.push(<Badge key="home_adv" icon={<AlertTriangle className="w-3 h-3" />} text={s.home_adversity_disp} />);
  if (s.away_adversity_disp) list.push(<Badge key="away_adv" icon={<AlertTriangle className="w-3 h-3" />} text={s.away_adversity_disp} />);
  return list;
}

export default function ScheduledDetail() {
  const { country = "", league = "", team = "", seq = "" } = useParams<{ country: string; league: string; team: string; seq: string }>();
  const countryRaw = decodeURIComponent(country);
  const leagueRaw = decodeURIComponent(league);
  const seqNum = Number(seq);

  const { data, isLoading, isError } = useQuery<ScheduleOverviewResponse>({
    queryKey: ["scheduled-overview", countryRaw, leagueRaw, seqNum],
    queryFn: () => fetchScheduleOverview(countryRaw, leagueRaw, seqNum),
    enabled: Number.isFinite(seqNum),
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
        ) : !data ? null : (
          <>
            <header className="space-y-1">
              <h1 className="text-2xl font-bold">
                {data.match.home_team} vs {data.match.away_team}
              </h1>
              <div className="text-sm text-muted-foreground">
                {data.match.round_no != null ? `ラウンド ${data.match.round_no} · ` : ""}
                {new Date(data.match.future_time).toLocaleString("ja-JP")}
                {` · ${data.match.game_year}年${data.match.game_month}月`}
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

                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="rounded-lg border p-3">
                      <div className="text-xs text-muted-foreground">順位</div>
                      <div className="text-xl font-bold">{s.rank ?? "-"}</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-xs text-muted-foreground">成績</div>
                      <div className="text-xl font-bold">
                        {s.win ?? 0}-{s.draw ?? 0}-{s.lose ?? 0}
                      </div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-xs text-muted-foreground">試合数</div>
                      <div className="text-xl font-bold">{s.games ?? "-"}</div>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
