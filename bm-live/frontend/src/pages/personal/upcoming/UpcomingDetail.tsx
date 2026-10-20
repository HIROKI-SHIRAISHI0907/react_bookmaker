// これからの試合の詳細  /upcoming-detail?country=&league=&home=&away=&kickoff=&round=
//  GET /v1/api/upcoming-detail（未ログインでも可）
//  上: 対戦カード（キックオフ・順位・会場。一覧から来たときは勝敗の見込みも）
//  左: 過去の対戦成績・ゴール数などの統計・順位表
//  右: 試合情報・会場（地図）
//  一覧（/upcoming・トップ画面）のカードから遷移。一覧の試合データは location.state.match で受け取る（再読込したときは無い）
import { useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarClock, MapPin } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Skeleton } from "../../../components/ui/skeleton";
import AppHeader from "../../../components/layout/AppHeader";
import { fetchUpcomingDetail } from "../../../api/upcoming/upcomingDetailapi";
import type { GoalStats, HeadToHeadMatch, HeadToHeadResponse, StandingRow, TeamGoalStats, UpcomingDetailResponse } from "../../../api/upcoming/upcomingDetailtypes";
import type { DashboardUpcomingMatch } from "../../../api/dashboard/types";
import { TeamFormDots, TeamLink } from "../teams/TeamForm";
import { GoalsBadge, RankBadge, WdlBar, formatKickoff } from "../top/parts";
import VenueBox from "../venue/VenueBox";

export const UPCOMING_DETAIL_PATH = "/upcoming-detail";

/** 一覧の試合 → 詳細の URL */
export function upcomingDetailUrl(m: DashboardUpcomingMatch): string {
  const q = new URLSearchParams({ country: m.country, league: m.league, home: m.home.name, away: m.away.name });
  if (m.kickoff) q.set("kickoff", m.kickoff);
  if (m.roundLabel) q.set("round", m.roundLabel);
  return `${UPCOMING_DETAIL_PATH}?${q.toString()}`;
}

/** 直近の対戦の表示件数 */
const H2H_LIMIT = 10;

export default function UpcomingDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const country = params.get("country") ?? "";
  const league = params.get("league") ?? "";
  const home = params.get("home") ?? "";
  const away = params.get("away") ?? "";
  const kickoff = params.get("kickoff");
  const round = params.get("round");
  // 一覧から来たときだけある（見込み・順位）
  const match = (location.state as { match?: DashboardUpcomingMatch } | null)?.match ?? null;

  const q = useQuery({
    queryKey: ["upcoming-detail", country, league, home, away],
    queryFn: () => fetchUpcomingDetail({ country, league, home, away, h2hLimit: H2H_LIMIT }),
    enabled: !!home && !!away,
    staleTime: 300_000,
  });
  const d = q.data;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title={home && away ? `${home} vs ${away}` : "試合の詳細"} subtitle={`${country && country !== "その他" ? `${country} / ` : ""}${league}${round ? `・${round}` : ""}`} />

      <main className="container mx-auto max-w-5xl space-y-4 px-4 py-6">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)} data-testid="button-back">
          <ArrowLeft className="mr-1 h-4 w-4" />
          戻る
        </Button>

        {!home || !away ? (
          <Message>試合が指定されていません</Message>
        ) : (
          <>
            <MatchHeader country={country} league={league} home={home} away={away} kickoff={kickoff} round={round} match={match} d={d} />
            {q.isLoading ? (
              <Skeleton className="h-64 w-full rounded-2xl" />
            ) : q.error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">取得に失敗しました: {(q.error as Error).message}</div>
            ) : !d ? (
              <Message>データがありません</Message>
            ) : (
              <div className="grid items-start gap-4 lg:grid-cols-[1fr_340px]">
                <div className="min-w-0 space-y-4">
                  <Card title="過去の対戦成績" note="全シーズン・全大会">
                    <HeadToHeadBox h={d.headToHead} home={home} away={away} />
                  </Card>
                  <Card title="ゴール数などの統計">
                    <StatsCompare hs={d.homeStats} aw={d.awayStats} />
                  </Card>
                  <Card title="順位表" note={d.standingSeason ? `${d.standingSeason} シーズン` : undefined}>
                    <StandingsTable rows={d.standings} country={d.country} league={d.league} />
                  </Card>
                </div>
                <aside className="space-y-4">
                  <Card title="試合情報">
                    <InfoList d={d} kickoff={kickoff} round={round} />
                  </Card>
                  <Card title="会場">
                    {d.venue ? <VenueBox v={d.venue} /> : <div className="text-xs text-muted-foreground">{home} のホームスタジアムが登録されていません</div>}
                  </Card>
                </aside>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function Message({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">{children}</div>;
}

function Card({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-4">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-bold">{title}</h2>
        {note && <span className="text-[10px] text-muted-foreground">{note}</span>}
      </div>
      {children}
    </section>
  );
}

const pct = (n: number, d: number): number | null => (d > 0 ? Math.round((n * 100) / d) : null);
const avg = (n: number, d: number): number | null => (d > 0 ? n / d : null);

/** "2026-10-07T10:00:00Z" → "2026/10/07(水) 19:00" */
function fullKickoff(iso: string | null): string | null {
  if (!iso) return null;
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return null;
  const w = "日月火水木金土"[t.getDay()];
  const ymd = `${t.getFullYear()}/${String(t.getMonth() + 1).padStart(2, "0")}/${String(t.getDate()).padStart(2, "0")}`;
  return `${ymd}(${w}) ${t.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}`;
}

// ===================== 対戦カード =====================
function MatchHeader({
  country,
  league,
  home,
  away,
  kickoff,
  round,
  match,
  d,
}: {
  country: string;
  league: string;
  home: string;
  away: string;
  kickoff: string | null;
  round: string | null;
  match: DashboardUpcomingMatch | null;
  d: UpcomingDetailResponse | undefined;
}) {
  // 順位: 一覧の値（サイト表示）→ 無ければ順位表の計算
  const rankOf = (side: "H" | "A") => {
    const fromList = side === "H" ? match?.home.rank : match?.away.rank;
    if (fromList != null) return fromList;
    return d?.standings.find((r) => r.side === side)?.rank ?? null;
  };
  return (
    <section className="rounded-2xl border bg-gradient-to-br from-emerald-500/10 via-card to-violet-500/10 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="rounded-full bg-muted px-2.5 py-1">
          {d?.leagueLabel ?? league}
          {round ? ` ・ ${round}` : ""}
        </span>
        {kickoff && (
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 font-bold text-emerald-700 dark:text-emerald-300">
            <CalendarClock className="h-3.5 w-3.5" />
            {formatKickoff(kickoff)}
          </span>
        )}
      </div>
      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TeamSide name={home} rank={rankOf("H")} country={country} league={league} align="left" label="HOME" />
        <div className="text-center font-mono text-2xl font-black text-muted-foreground sm:text-3xl">vs</div>
        <TeamSide name={away} rank={rankOf("A")} country={country} league={league} align="right" label="AWAY" />
      </div>
      {d?.venue?.stadiumName && (
        <div className="mt-3 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {d.venue.stadiumName}
          {d.venue.homeCity ? `（${d.venue.homeCity}）` : ""}
        </div>
      )}
      {match && (
        <div className="mx-auto mt-4 max-w-md space-y-1.5">
          <div className="flex justify-center">
            <GoalsBadge f={match.forecast} />
          </div>
          <WdlBar f={match.forecast} big />
        </div>
      )}
    </section>
  );
}

function TeamSide({ name, rank, country, league, align, label }: { name: string; rank: number | null; country: string; league: string; align: "left" | "right"; label: string }) {
  return (
    <div className={`min-w-0 ${align === "right" ? "text-right" : ""}`}>
      <div className="text-[10px] font-bold tracking-wider text-muted-foreground">{label}</div>
      <TeamLink country={country} league={league} team={name} className="block truncate text-lg font-bold sm:text-xl" />
      <div className="mt-0.5 text-[11px] text-muted-foreground">{rank != null ? `${rank}位` : "順位 -"}</div>
    </div>
  );
}

// ===================== 過去の対戦成績 =====================
function HeadToHeadBox({ h, home, away }: { h: HeadToHeadResponse; home: string; away: string }) {
  const [scope, setScope] = useState<"total" | "home">("total");
  if (h.total.matches === 0) return <div className="text-xs text-muted-foreground">過去の対戦はありません</div>;
  const r = scope === "total" ? h.total : h.home;
  const n = r.matches;
  const cells = [
    { label: `${home} 勝ち`, v: r.wins, className: "bg-emerald-600" },
    { label: "引分", v: r.draws, className: "bg-slate-400" },
    { label: `${away} 勝ち`, v: r.losses, className: "bg-violet-600 dark:bg-violet-500" },
  ];
  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        <ScopeButton active={scope === "total"} onClick={() => setScope("total")}>
          通算 {h.total.matches}試合
        </ScopeButton>
        <ScopeButton active={scope === "home"} onClick={() => setScope("home")}>
          {home} のホーム {h.home.matches}試合
        </ScopeButton>
      </div>

      {n === 0 ? (
        <div className="text-xs text-muted-foreground">この条件の対戦はありません</div>
      ) : (
        <>
          <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
            {cells.map((c) => (c.v > 0 ? <div key={c.label} className={c.className} style={{ width: `${(c.v * 100) / n}%` }} title={`${c.label} ${c.v}`} /> : null))}
          </div>
          <div className="grid grid-cols-3 gap-1 text-center">
            {cells.map((c) => (
              <div key={c.label} className="min-w-0">
                <div className="truncate text-[10px] text-muted-foreground">{c.label}</div>
                <div className="font-mono text-lg font-black">{c.v}</div>
                <div className="font-mono text-[10px] text-muted-foreground">{pct(c.v, n)}%</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
            <MiniStat label="得点（平均）" value={`${r.goalsFor} - ${r.goalsAgainst}`} sub={`${avg(r.goalsFor, n)?.toFixed(1)} - ${avg(r.goalsAgainst, n)?.toFixed(1)}`} />
            {scope === "total" && (
              <>
                <MiniStat label="両チーム得点" value={`${pct(h.bothScored, n)}%`} sub={`${h.bothScored}試合`} />
                <MiniStat label={`${home} 先制`} value={`${pct(h.scoredFirst, n)}%`} sub={`${away} 先制 ${h.concededFirst}`} />
                <MiniStat label="PK 決着" value={`${h.pkWins + h.pkLosses}`} sub={`${home} ${h.pkWins}勝${h.pkLosses}敗`} />
              </>
            )}
          </div>
        </>
      )}

      <div>
        <div className="mb-1 text-[11px] font-bold text-muted-foreground">直近の対戦</div>
        <ol className="divide-y rounded-lg border text-[12px]">
          {h.matches.map((m, i) => (
            <H2hRow key={i} m={m} />
          ))}
        </ol>
        <div className="mt-1 text-[10px] text-muted-foreground">
          {h.seasons}シーズン・{h.firstMatchTime?.slice(0, 10).replace(/-/g, "/") ?? "-"} 〜 {h.lastMatchTime?.slice(0, 10).replace(/-/g, "/") ?? "-"}
        </div>
      </div>
    </div>
  );
}

const RESULT: Record<string, string> = {
  W: "bg-emerald-500 text-white",
  D: "bg-slate-400 text-white",
  L: "bg-rose-500 text-white",
};

function H2hRow({ m }: { m: HeadToHeadMatch }) {
  // 勝ち（緑）のチームを太字に
  const homeWon = m.result === (m.ha === "H" ? "W" : "L");
  const awayWon = m.result === (m.ha === "H" ? "L" : "W");
  return (
    <li className="flex items-center gap-2 px-2.5 py-1.5">
      <div className="w-[4.5rem] shrink-0 leading-tight">
        <div className="font-mono text-[11px]">{m.matchTime?.slice(0, 10).replace(/-/g, "/") ?? "-"}</div>
        <div className="truncate text-[9px] text-muted-foreground" title={`${m.league}${m.roundNo != null ? ` ラウンド ${m.roundNo}` : ""}`}>
          {m.league}
        </div>
      </div>
      <span className={`min-w-0 flex-1 truncate text-right ${homeWon ? "font-bold" : ""}`}>{m.homeTeamName}</span>
      <span className="shrink-0 rounded bg-muted px-1.5 font-mono font-bold">
        {m.homeScore ?? "-"}-{m.awayScore ?? "-"}
        {m.pk && <span className="ml-0.5 text-[9px] font-normal text-muted-foreground">PK</span>}
      </span>
      <span className={`min-w-0 flex-1 truncate ${awayWon ? "font-bold" : ""}`}>{m.awayTeamName}</span>
      <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] font-bold ${RESULT[m.result] ?? "bg-muted"}`} title="この試合のホームチームから見た結果">
        {m.result}
      </span>
    </li>
  );
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg bg-muted/60 px-2 py-1.5">
      <div className="truncate text-[10px] text-muted-foreground">{label}</div>
      <div className="font-mono text-sm font-bold">{value}</div>
      {sub && <div className="truncate font-mono text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function ScopeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`max-w-[50%] truncate rounded-full px-3 py-1 text-[11px] font-bold ${active ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"}`}
    >
      {children}
    </button>
  );
}

// ===================== ゴール数などの統計 =====================
type StatLine = {
  label: string;
  /** 表示 */
  h: string;
  a: string;
  /** バーの比較用（null はバーなし） */
  hv: number | null;
  av: number | null;
  /** 小さいほど良い（失点など）。太字の判定に使う */
  lowerIsBetter?: boolean;
};

function statLines(h: GoalStats, a: GoalStats): StatLine[] {
  const fmtAvg = (v: number | null) => (v == null ? "-" : v.toFixed(2));
  const fmtPct = (v: number | null) => (v == null ? "-" : `${v}%`);
  const half = (s: GoalStats, v: number) => avg(v, s.halfKnownGames);
  const line = (label: string, hv: number | null, av: number | null, fmt: (v: number | null) => string, lowerIsBetter = false): StatLine => ({
    label,
    h: fmt(hv),
    a: fmt(av),
    hv,
    av,
    lowerIsBetter,
  });
  return [
    line("1試合の勝ち点", avg(h.points, h.games), avg(a.points, a.games), fmtAvg),
    line("平均得点", h.avgGoalsFor, a.avgGoalsFor, fmtAvg),
    line("平均失点", h.avgGoalsAgainst, a.avgGoalsAgainst, fmtAvg, true),
    line("前半の平均得点", half(h, h.goalsFor1st), half(a, a.goalsFor1st), fmtAvg),
    line("後半の平均得点", half(h, h.goalsFor2nd), half(a, a.goalsFor2nd), fmtAvg),
    line("前半の平均失点", half(h, h.goalsAgainst1st), half(a, a.goalsAgainst1st), fmtAvg, true),
    line("後半の平均失点", half(h, h.goalsAgainst2nd), half(a, a.goalsAgainst2nd), fmtAvg, true),
    line("無失点", pct(h.cleanSheets, h.games), pct(a.cleanSheets, a.games), fmtPct),
    line("無得点", pct(h.failedToScore, h.games), pct(a.failedToScore, a.games), fmtPct, true),
    line("先制", pct(h.scoredFirst, h.games), pct(a.scoredFirst, a.games), fmtPct),
    line("両チーム得点", pct(h.bothScored, h.games), pct(a.bothScored, a.games), fmtPct),
    line("合計 2 点以上", pct(h.over15, h.games), pct(a.over15, a.games), fmtPct),
    line("合計 3 点以上", pct(h.over25, h.games), pct(a.over25, a.games), fmtPct),
    line("合計 4 点以上", pct(h.over35, h.games), pct(a.over35, a.games), fmtPct),
  ];
}

function StatsCompare({ hs, aw }: { hs: TeamGoalStats; aw: TeamGoalStats }) {
  const [scope, setScope] = useState<"all" | "venue">("all");
  const h = scope === "all" ? hs.all : hs.home;
  const a = scope === "all" ? aw.all : aw.away;
  if (hs.all.games === 0 && aw.all.games === 0) return <div className="text-xs text-muted-foreground">統計のデータがありません</div>;
  const lines = statLines(h, a);
  const record = (s: GoalStats) => (s.games > 0 ? `${s.games}試合 ${s.win}勝${s.draw}分${s.lose}敗` : "データなし");
  const source = (t: TeamGoalStats) => (t.season ? `${t.season}${t.otherLeague ? `・${t.league}` : ""}` : null);

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        <ScopeButton active={scope === "all"} onClick={() => setScope("all")}>
          今季の全試合
        </ScopeButton>
        <ScopeButton active={scope === "venue"} onClick={() => setScope("venue")}>
          ホーム時 / アウェー時
        </ScopeButton>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        {[
          { t: hs, s: h, align: "" },
          { t: aw, s: a, align: "text-right" },
        ].map(({ t, s, align }) => (
          <div key={t.team} className={`min-w-0 rounded-lg bg-muted/60 px-2 py-1.5 ${align}`}>
            <div className="truncate font-bold">{t.team}</div>
            <div className="truncate font-mono text-[10px] text-muted-foreground">{record(s)}</div>
            <div className={`mt-1 flex ${align ? "justify-end" : ""}`}>
              <TeamFormDots form={s.form} />
            </div>
            {source(t) && <div className="mt-0.5 truncate text-[9px] text-muted-foreground">{source(t)}</div>}
          </div>
        ))}
      </div>

      <div className="space-y-2.5">
        {lines.map((s) => (
          <CompareBar key={s.label} s={s} />
        ))}
      </div>
      {(hs.otherLeague || aw.otherLeague) && <p className="text-[10px] text-muted-foreground">この大会のデータが無いチームは、最後に試合をしたリーグ・シーズンで集計しています。</p>}
      <p className="text-[10px] text-muted-foreground">前半・後半は、前半のスコアが分かる試合だけで計算しています。</p>
    </div>
  );
}

function CompareBar({ s }: { s: StatLine }) {
  const h = s.hv ?? 0;
  const a = s.av ?? 0;
  const total = h + a;
  const hp = total > 0 ? (h / total) * 100 : 50;
  const better = (x: number | null, y: number | null) => x != null && y != null && x !== y && (s.lowerIsBetter ? x < y : x > y);
  return (
    <div>
      <div className="mb-0.5 flex items-center justify-between font-mono text-[13px]">
        <span className={better(s.hv, s.av) ? "font-bold" : ""}>{s.h}</span>
        <span className="font-sans text-[11px] text-muted-foreground">{s.label}</span>
        <span className={better(s.av, s.hv) ? "font-bold" : ""}>{s.a}</span>
      </div>
      <div className="flex h-1.5 gap-0.5">
        <div className="flex flex-1 justify-end overflow-hidden rounded-l-full bg-muted">
          <div className="rounded-l-full bg-emerald-600" style={{ width: `${total > 0 ? hp : 0}%` }} />
        </div>
        <div className="flex flex-1 overflow-hidden rounded-r-full bg-muted">
          <div className="rounded-r-full bg-violet-600 dark:bg-violet-500" style={{ width: `${total > 0 ? 100 - hp : 0}%` }} />
        </div>
      </div>
    </div>
  );
}

// ===================== 順位表 =====================
/** 2 チームの前後に出すチーム数（例: 15位なら 13〜17位） */
const STANDING_AROUND = 2;

type StandingItem = { kind: "row"; r: StandingRow } | { kind: "gap"; from: number; to: number; count: number };

/**
 * 表示する行を決める: 2 チームと、その前後 STANDING_AROUND チーム。間が空くところは省略（…）にする。
 * 例: ホーム 15位・アウェー 2位 → 1〜4位、…、13〜17位、…
 * どちらのチームも順位表に無ければ全チーム。
 */
function pickStandings(rows: StandingRow[]): StandingItem[] {
  const keep = new Set<number>();
  rows.forEach((r, i) => {
    if (!r.side) return;
    for (let j = Math.max(0, i - STANDING_AROUND); j <= Math.min(rows.length - 1, i + STANDING_AROUND); j++) keep.add(j);
  });
  if (keep.size === 0) return rows.map((r) => ({ kind: "row", r }));
  const items: StandingItem[] = [];
  let gapStart = -1;
  const flushGap = (end: number) => {
    if (gapStart < 0) return;
    items.push({ kind: "gap", from: rows[gapStart].rank, to: rows[end].rank, count: end - gapStart + 1 });
    gapStart = -1;
  };
  rows.forEach((r, i) => {
    if (keep.has(i)) {
      flushGap(i - 1);
      items.push({ kind: "row", r });
    } else if (gapStart < 0) {
      gapStart = i;
    }
  });
  flushGap(rows.length - 1);
  return items;
}

function StandingsTable({ rows, country, league }: { rows: StandingRow[]; country: string | null; league: string | null }) {
  const [showAll, setShowAll] = useState(false);
  if (rows.length === 0) return <div className="text-xs text-muted-foreground">このリーグの順位のデータがありません（カップ戦など）</div>;
  const sideClass = (s: StandingRow["side"]) => (s === "H" ? "bg-emerald-500/10" : s === "A" ? "bg-violet-500/10" : "");
  const items: StandingItem[] = showAll ? rows.map((r) => ({ kind: "row", r })) : pickStandings(rows);
  const omitted = items.some((x) => x.kind === "gap");
  return (
    <div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-[12px]">
          <thead className="bg-card">
            <tr className="text-[10px] text-muted-foreground">
              <th className="px-1.5 py-1 text-right font-normal">#</th>
              <th className="px-1.5 py-1 text-left font-normal">チーム</th>
              <th className="px-1 py-1 text-right font-normal">試</th>
              <th className="px-1 py-1 text-right font-normal">勝</th>
              <th className="px-1 py-1 text-right font-normal">分</th>
              <th className="px-1 py-1 text-right font-normal">負</th>
              <th className="hidden px-1 py-1 text-right font-normal sm:table-cell">得失</th>
              <th className="px-1 py-1 text-right font-normal">差</th>
              <th className="px-1.5 py-1 text-right font-normal">点</th>
              <th className="hidden px-1.5 py-1 text-left font-normal md:table-cell">直近</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((x) =>
              x.kind === "gap" ? (
                <tr key={`gap-${x.from}-${x.to}`}>
                  <td colSpan={10} className="py-0.5 text-center text-[10px] text-muted-foreground" title={`${x.from}〜${x.to}位（${x.count}チーム）を省略`}>
                    ⋮ {x.count}チーム
                  </td>
                </tr>
              ) : (
                <tr key={x.r.team} className={sideClass(x.r.side)}>
                  <td className="px-1.5 py-1 text-right font-mono font-bold">{x.r.rank}</td>
                  <td className="max-w-[10rem] px-1.5 py-1">
                    <div className="flex min-w-0 items-center gap-1">
                      {x.r.side && (
                        <span className={`shrink-0 rounded px-1 text-[9px] font-bold text-white ${x.r.side === "H" ? "bg-emerald-600" : "bg-violet-600"}`}>{x.r.side}</span>
                      )}
                      <TeamLink country={country} league={league} team={x.r.team} className={`truncate ${x.r.side ? "font-bold" : ""}`} />
                      {x.r.siteRank != null && x.r.siteRank !== x.r.rank && <RankBadge rank={x.r.siteRank} className="shrink-0" />}
                    </div>
                  </td>
                  <td className="px-1 py-1 text-right font-mono">{x.r.games}</td>
                  <td className="px-1 py-1 text-right font-mono">{x.r.win}</td>
                  <td className="px-1 py-1 text-right font-mono">{x.r.draw}</td>
                  <td className="px-1 py-1 text-right font-mono">{x.r.lose}</td>
                  <td className="hidden px-1 py-1 text-right font-mono sm:table-cell">
                    {x.r.goalsFor}:{x.r.goalsAgainst}
                  </td>
                  <td className="px-1 py-1 text-right font-mono">{x.r.goalDiff > 0 ? `+${x.r.goalDiff}` : x.r.goalDiff}</td>
                  <td className="px-1.5 py-1 text-right font-mono font-bold">{x.r.points}</td>
                  <td className="hidden px-1.5 py-1 md:table-cell">
                    <TeamFormDots form={x.r.form} />
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-1.5 flex items-start justify-between gap-2">
        <p className="text-[10px] text-muted-foreground">集計済みの試合から計算した順位です（勝ち点 → 得失点差 → 得点）。灰色の数字はサイト表示の順位（違うときだけ）。</p>
        {(omitted || showAll) && (
          <button type="button" onClick={() => setShowAll(!showAll)} className="shrink-0 text-[10px] font-bold text-muted-foreground hover:text-foreground" data-testid="button-standings-all">
            {showAll ? "2チームの周りだけ" : `全${rows.length}チーム`}
          </button>
        )}
      </div>
    </div>
  );
}

// ===================== 試合情報 =====================
function InfoList({ d, kickoff, round }: { d: UpcomingDetailResponse; kickoff: string | null; round: string | null }) {
  const items: [string, string | null][] = [
    ["キックオフ", fullKickoff(kickoff)],
    ["大会", d.leagueLabel],
    ["ラウンド", round],
    ["スタジアム", d.venue?.stadiumName ? `${d.venue.stadiumName}${d.venue.homeCity ? `（${d.venue.homeCity}）` : ""}` : null],
    ["過去の対戦", d.headToHead.total.matches > 0 ? `${d.headToHead.total.matches}試合（最後 ${d.headToHead.lastMatchTime?.slice(0, 10).replace(/-/g, "/") ?? "-"}）` : "なし"],
  ];
  const shown = items.filter(([, v]) => v);
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[12px]">
      {shown.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="min-w-0 break-words">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
