// 試合詳細  /match-detail?seqKey=xxxx
//  GET /v1/api/match-detail?seqKey=（ライブ中・ハーフタイムは 30 秒ごとに更新）
//  上: スコア（チーム名 → チームページ）
//  左: 試合の流れ（xG の推移・ゴール）・スタッツ比較
//  右: 勝敗確率（このままなら・ライブ中だけ）・順位の変動表・試合情報・会場（地図）
//  統計詳細データ（GET /v1/api/match-detail/extra?matchId=。試合後に取得したもの）がある試合は、
//  左側を「概要 / タイムライン / メンバー / 選手スタッツ」のタブにする（無ければ今までどおり）
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, MapPin } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Skeleton } from "../../../components/ui/skeleton";
import AppHeader from "../../../components/layout/AppHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { fetchMatchDetail, fetchMatchDetailExtra } from "../../../api/match/matchapi";
import type { MatchDetailExtraResponse, MatchDetailResponse, MatchGoal, MatchRankChange, MatchStat } from "../../../api/match/matchtypes";
import type { DashboardForecast } from "../../../api/dashboard/types";
import { TeamLink } from "../teams/TeamForm";
import MatchFlowChart from "./MatchFlowChart";
import VenueBox from "../venue/VenueBox";
import { DetailGoalList, EventTimeline, HalfScores, LineupView, MomentumChart, PlayerStatsTable } from "./MatchDetailExtra";

export const MATCH_DETAIL_PATH = "/match-detail";
export const matchDetailUrl = (seqKey: string) => `${MATCH_DETAIL_PATH}?seqKey=${encodeURIComponent(seqKey)}`;

export default function MatchDetail() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const seqKey = params.get("seqKey") ?? "";

  const q = useQuery({
    queryKey: ["match-detail", seqKey],
    queryFn: () => fetchMatchDetail(seqKey),
    enabled: !!seqKey,
    staleTime: 15_000,
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s === "LIVE" || s === "HT" ? 30_000 : false;
    },
  });

  const d = q.data;

  // 統計詳細データ（試合後に取得するので、ライブ中・ハーフタイムは読まない。1回読んだら使い回す）
  const live = d?.status === "LIVE" || d?.status === "HT";
  const exq = useQuery({
    queryKey: ["match-detail-extra", d?.matchId],
    queryFn: () => fetchMatchDetailExtra(d!.matchId!),
    enabled: !!d?.found && !!d?.matchId && !live,
    staleTime: 10 * 60_000,
  });
  const ex: MatchDetailExtraResponse | null = exq.data?.found ? exq.data : null;

  const title = d?.found ? `${d.homeTeam ?? ""} vs ${d.awayTeam ?? ""}` : "試合詳細";

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title={title} subtitle={d?.leagueLabel ? `${d.leagueLabel}${d.roundLabel ? `・${d.roundLabel}` : ""}` : "Match Detail"} />

      <main className="container mx-auto max-w-5xl space-y-4 px-4 py-6">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)} data-testid="button-back">
          <ArrowLeft className="mr-1 h-4 w-4" />
          戻る
        </Button>

        {!seqKey ? (
          <Message>試合が指定されていません</Message>
        ) : q.isLoading ? (
          <Skeleton className="h-64 w-full rounded-2xl" />
        ) : q.error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">取得に失敗しました: {(q.error as Error).message}</div>
        ) : !d || !d.found ? (
          <Message>試合データが見つかりません（{seqKey}）</Message>
        ) : (
          <>
            <ScoreHeader d={d} ex={ex} />
            <div className="grid items-start gap-4 lg:grid-cols-[1fr_340px]">
              <div className="min-w-0 space-y-4">
                {ex ? (
                  <DetailTabs d={d} ex={ex} />
                ) : (
                  <>
                    <Card title="試合の流れ">
                      <MatchFlowChart timeline={d.timeline} goals={d.goals} homeTeam={d.homeTeam ?? "ホーム"} awayTeam={d.awayTeam ?? "アウェー"} />
                      <GoalList goals={d.goals} home={d.homeTeam ?? "ホーム"} away={d.awayTeam ?? "アウェー"} />
                    </Card>
                    <Card title="スタッツ比較">
                      <StatsTable stats={d.stats} home={d.homeTeam ?? "ホーム"} away={d.awayTeam ?? "アウェー"} />
                    </Card>
                  </>
                )}
              </div>
              <aside className="space-y-4">
                {d.forecast && (
                  <Card title="このままなら">
                    <ForecastBox f={d.forecast} home={d.homeTeam ?? "ホーム"} away={d.awayTeam ?? "アウェー"} loggedIn={d.loggedIn} />
                  </Card>
                )}
                <Card title="順位の変動">
                  <RankTable rows={d.rankChanges} home={d.homeTeam ?? "ホーム"} away={d.awayTeam ?? "アウェー"} />
                </Card>
                <Card title="試合情報">
                  <InfoList d={d} ex={ex} />
                </Card>
                {d.venue && (
                  <Card title="会場">
                    <VenueBox v={d.venue} fallbackName={d.info.stadium} />
                  </Card>
                )}
              </aside>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Message({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">{children}</div>;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-4">
      <h2 className="mb-3 text-sm font-bold">{title}</h2>
      {children}
    </section>
  );
}

// ===================== 統計詳細データのタブ =====================
function DetailTabs({ d, ex }: { d: MatchDetailResponse; ex: MatchDetailExtraResponse }) {
  const home = d.homeTeam ?? ex.homeTeam ?? "ホーム";
  const away = d.awayTeam ?? ex.awayTeam ?? "アウェー";
  return (
    <Tabs defaultValue="overview" className="space-y-3">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview" className="text-xs">概要</TabsTrigger>
        <TabsTrigger value="timeline" className="text-xs">タイムライン</TabsTrigger>
        <TabsTrigger value="lineup" className="text-xs">メンバー</TabsTrigger>
        <TabsTrigger value="players" className="text-xs">選手スタッツ</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-0 space-y-4">
        <Card title="試合の流れ">
          <MatchFlowChart timeline={d.timeline} goals={d.goals} homeTeam={home} awayTeam={away} />
          {ex.goals.length > 0 ? <DetailGoalList goals={ex.goals} /> : <GoalList goals={d.goals} home={home} away={away} />}
        </Card>
        {ex.momentum.length > 0 && (
          <Card title="勢い">
            <MomentumChart momentum={ex.momentum} incidents={ex.momentumIncidents} homeTeam={home} awayTeam={away} />
          </Card>
        )}
        <Card title="スタッツ比較">
          <StatsTable stats={d.stats} home={home} away={away} />
        </Card>
      </TabsContent>

      <TabsContent value="timeline" className="mt-0">
        <Card title="試合の出来事">
          <EventTimeline events={ex.events} halves={ex.halves} />
        </Card>
      </TabsContent>

      <TabsContent value="lineup" className="mt-0">
        <Card title="メンバー">
          <LineupView ex={ex} homeTeam={home} awayTeam={away} />
        </Card>
      </TabsContent>

      <TabsContent value="players" className="mt-0">
        <Card title="選手スタッツ">
          <PlayerStatsTable stats={ex.playerStats} homeTeam={home} awayTeam={away} />
        </Card>
      </TabsContent>
      {ex.scrapeErrors && <p className="text-[10px] text-muted-foreground">一部のデータは取得できませんでした（{ex.scrapeErrors}）。</p>}
    </Tabs>
  );
}

// ===================== スコア =====================
const STATUS: Record<string, { text: (m: string | null) => string; className: string }> = {
  LIVE: { text: (m) => `LIVE ${m ?? ""}`, className: "bg-rose-500 text-white" },
  HT: { text: () => "ハーフタイム", className: "bg-amber-500/20 text-amber-700 dark:text-amber-300" },
  FINISHED: { text: () => "試合終了", className: "bg-muted text-foreground" },
  OTHER: { text: (m) => m ?? "-", className: "bg-muted text-muted-foreground" },
};

function ScoreHeader({ d, ex }: { d: MatchDetailResponse; ex: MatchDetailExtraResponse | null }) {
  const st = STATUS[d.status ?? "OTHER"] ?? STATUS.OTHER;
  return (
    <section className="rounded-2xl border bg-gradient-to-br from-emerald-500/10 via-card to-violet-500/10 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="rounded-full bg-muted px-2.5 py-1">
          {d.leagueLabel ?? "-"}
          {d.roundLabel ? ` ・ ${d.roundLabel}` : ""}
        </span>
        <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 font-bold ${st.className}`}>
          {d.status === "LIVE" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />}
          {st.text(d.minuteLabel)}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TeamSide name={d.homeTeam} rank={d.homeRank} country={d.country} league={d.league} align="left" />
        <div className="text-center font-mono text-4xl font-black tracking-tight sm:text-5xl">
          {d.homeScore ?? "-"} <span className="text-muted-foreground">-</span> {d.awayScore ?? "-"}
        </div>
        <TeamSide name={d.awayTeam} rank={d.awayRank} country={d.country} league={d.league} align="right" />
      </div>
      {ex && <HalfScores ex={ex} />}
      {d.venue?.stadiumName && (
        <div className="mt-3 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {d.venue.stadiumName}
          {d.venue.homeCity ? `（${d.venue.homeCity}）` : ""}
        </div>
      )}
    </section>
  );
}

function TeamSide({ name, rank, country, league, align }: { name: string | null; rank: number | null; country: string | null; league: string | null; align: "left" | "right" }) {
  return (
    <div className={`min-w-0 ${align === "right" ? "text-right" : ""}`}>
      <TeamLink country={country} league={league} team={name ?? ""} className="block truncate text-lg font-bold sm:text-xl" />
      <div className="mt-0.5 text-[11px] text-muted-foreground">{rank != null ? `${rank}位` : "順位 -"}</div>
    </div>
  );
}

// ===================== ゴール =====================
function GoalList({ goals, home, away }: { goals: MatchGoal[]; home: string; away: string }) {
  if (goals.length === 0) return <div className="mt-3 text-xs text-muted-foreground">ゴールはまだありません</div>;
  return (
    <ol className="mt-3 divide-y rounded-lg border text-[13px]">
      {goals.map((g, i) => (
        <li key={i} className={`flex items-center gap-2 px-3 py-1.5 ${g.side === "A" ? "flex-row-reverse text-right" : ""}`}>
          <span className="w-12 shrink-0 font-mono text-[11px] text-muted-foreground">{g.label ?? `${Math.round(g.minute)}'`}</span>
          <span aria-hidden>⚽</span>
          <span className="min-w-0 flex-1 truncate font-semibold">{g.side === "H" ? home : away}</span>
          <span className="shrink-0 font-mono font-bold">
            {g.homeScore}-{g.awayScore}
          </span>
        </li>
      ))}
    </ol>
  );
}

// ===================== スタッツ比較 =====================
function StatsTable({ stats, home, away }: { stats: MatchStat[]; home: string; away: string }) {
  if (stats.length === 0) return <div className="text-xs text-muted-foreground">スタッツはまだありません</div>;
  return (
    <div className="space-y-2.5">
      <div className="flex justify-between text-[11px] font-bold text-muted-foreground">
        <span className="max-w-[45%] truncate">{home}</span>
        <span className="max-w-[45%] truncate">{away}</span>
      </div>
      {stats.map((s) => {
        const h = s.homeValue ?? 0;
        const a = s.awayValue ?? 0;
        const total = h + a;
        const hp = total > 0 ? (h / total) * 100 : 50;
        return (
          <div key={s.key}>
            <div className="mb-0.5 flex items-center justify-between font-mono text-[13px]">
              <span className={h > a ? "font-bold" : ""}>{s.home ?? "-"}</span>
              <span className="font-sans text-[11px] text-muted-foreground">{s.label}</span>
              <span className={a > h ? "font-bold" : ""}>{s.away ?? "-"}</span>
            </div>
            {/* 左右のバー（間に 2px の隙間） */}
            <div className="flex h-1.5 gap-0.5" title={`${s.label}: ${s.home ?? "-"} / ${s.away ?? "-"}`}>
              <div className="flex flex-1 justify-end overflow-hidden rounded-l-full bg-muted">
                <div className="rounded-l-full bg-emerald-600" style={{ width: `${total > 0 ? hp : 0}%` }} />
              </div>
              <div className="flex flex-1 overflow-hidden rounded-r-full bg-muted">
                <div className="rounded-r-full bg-violet-600 dark:bg-violet-500" style={{ width: `${total > 0 ? 100 - hp : 0}%` }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ===================== 勝敗確率 =====================
function ForecastBox({ f, home, away, loggedIn }: { f: DashboardForecast; home: string; away: string; loggedIn: boolean }) {
  const cells = [
    { label: `${home} 勝ち`, bar: f.barHome, prob: f.probHome, className: "bg-emerald-600" },
    { label: "引き分け", bar: f.barDraw, prob: f.probDraw, className: "bg-slate-400" },
    { label: `${away} 勝ち`, bar: f.barAway, prob: f.probAway, className: "bg-violet-600 dark:bg-violet-500" },
  ];
  return (
    <div>
      <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
        {cells.map((c) => (
          <div key={c.label} className={c.className} style={{ width: `${c.bar}%` }} title={c.label} />
        ))}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1 text-center">
        {cells.map((c) => (
          <div key={c.label} className="min-w-0">
            <div className="truncate text-[10px] text-muted-foreground">{c.label}</div>
            <div className="font-mono text-sm font-bold">{loggedIn && c.prob != null ? `${c.prob}%` : "🔒"}</div>
          </div>
        ))}
      </div>
      {f.expectedRestGoals != null && (
        <div className="mt-2 text-[11px] text-muted-foreground">
          残り時間の見込みゴール <b className="font-mono text-foreground">{f.expectedRestGoals.toFixed(1)}</b> 点
        </div>
      )}
      {!loggedIn && <div className="mt-1 text-[10px] text-muted-foreground">確率の数値はログインで表示されます</div>}
    </div>
  );
}

// ===================== 順位の変動表 =====================
function Delta({ v }: { v: number | null }) {
  if (v == null || v === 0) return null;
  // マイナス = 順位が上がった
  return <span className="ml-1 text-[10px] text-muted-foreground">{v < 0 ? `↑${-v}` : `↓${v}`}</span>;
}

function RankTable({ rows, home, away }: { rows: MatchRankChange[]; home: string; away: string }) {
  if (rows.length === 0) return <div className="text-xs text-muted-foreground">順位のデータがありません</div>;
  const first = rows[0];
  const last = rows[rows.length - 1];
  const diff = (a: number | null, b: number | null) => (a != null && b != null ? b - a : null);
  return (
    <div>
      {/* 試合開始時点 → 現在 */}
      <div className="mb-2 grid grid-cols-2 gap-2 text-center">
        {[
          { name: home, from: first.homeRank, to: last.homeRank },
          { name: away, from: first.awayRank, to: last.awayRank },
        ].map((t) => (
          <div key={t.name} className="rounded-lg bg-muted/60 px-2 py-1.5">
            <div className="truncate text-[10px] text-muted-foreground">{t.name}</div>
            <div className="font-mono text-sm font-bold">
              {t.from ?? "-"} → {t.to ?? "-"}位
              <Delta v={diff(t.from, t.to)} />
            </div>
          </div>
        ))}
      </div>
      <table className="w-full text-[12px]">
        <thead>
          <tr className="text-[10px] text-muted-foreground">
            <th className="py-1 text-left font-normal">時間</th>
            <th className="py-1 text-center font-normal">スコア</th>
            <th className="max-w-[5rem] truncate py-1 text-right font-normal">{home}</th>
            <th className="max-w-[5rem] truncate py-1 text-right font-normal">{away}</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="py-1 font-mono text-[11px] text-muted-foreground">{r.label ?? `${Math.round(r.minute)}'`}</td>
              <td className="py-1 text-center font-mono">
                {r.homeScore ?? "-"}-{r.awayScore ?? "-"}
              </td>
              <td className="py-1 text-right font-mono font-bold">
                {r.homeRank ?? "-"}
                <Delta v={r.homeDelta} />
              </td>
              <td className="py-1 text-right font-mono font-bold">
                {r.awayRank ?? "-"}
                <Delta v={r.awayDelta} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-1.5 text-[10px] text-muted-foreground">試合中の暫定順位（ライブ順位表）の変化です。</p>
    </div>
  );
}

// ===================== 試合情報 =====================
function InfoList({ d, ex }: { d: MatchDetailResponse; ex: MatchDetailExtraResponse | null }) {
  // 試合ページで取れなかった監督・フォーメーションは、統計詳細データ（match_detail_formation）で補う
  const fm = (home: boolean) => ex?.formations.find((f) => (f.side ?? "").toUpperCase() === (home ? "HOME" : "AWAY"));
  const i = {
    ...d.info,
    homeManager: d.info.homeManager ?? fm(true)?.coach ?? null,
    awayManager: d.info.awayManager ?? fm(false)?.coach ?? null,
    homeFormation: d.info.homeFormation ?? fm(true)?.formation ?? null,
    awayFormation: d.info.awayFormation ?? fm(false)?.formation ?? null,
  };
  const v = d.venue;
  const join = (...vals: (string | null)[]) => vals.filter(Boolean).join(" / ") || null;
  // スタジアム名で一致したときはマスタの名前（都市）を使う。それ以外は試合ページの表記のまま
  const stadium =
    v && v.matchedBy === "STADIUM" && v.stadiumName ? `${v.stadiumName}${v.homeCity ? `（${v.homeCity}）` : ""}` : join(i.stadium, i.location);
  const items: [string, string | null][] = [
    ["スタジアム", stadium],
    ["収容人数", i.capacity],
    ["観客数", i.audience],
    ["主審", i.referee],
    ["天気", join(i.weather, i.temperature, i.humidity)],
    [`監督（${d.homeTeam ?? "ホーム"}）`, i.homeManager],
    [`監督（${d.awayTeam ?? "アウェー"}）`, i.awayManager],
    ["フォーメーション", i.homeFormation || i.awayFormation ? `${i.homeFormation ?? "-"} vs ${i.awayFormation ?? "-"}` : null],
  ];
  const shown = items.filter(([, val]) => val);
  if (shown.length === 0) return <div className="text-xs text-muted-foreground">試合情報はまだありません</div>;
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[12px]">
      {shown.map(([k, val]) => (
        <div key={k} className="contents">
          <dt className="max-w-[8rem] truncate text-muted-foreground">{k}</dt>
          <dd className="min-w-0 break-words">{val}</dd>
        </div>
      ))}
    </dl>
  );
}
