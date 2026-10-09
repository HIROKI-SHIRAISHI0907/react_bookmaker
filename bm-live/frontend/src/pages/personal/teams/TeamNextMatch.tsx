// チームページ右側: 次節（大きめ）＋その後の試合（1行ずつ）
//  GET /v1/api/team-upcoming?country=&league=&team=&limit=3
import { useQuery } from "@tanstack/react-query";
import { fetchTeamUpcoming } from "../../../api/team/teamapi";
import type { TeamUpcomingItem } from "../../../api/team/teamtypes";
import type { DashboardForecast } from "../../../api/dashboard/types";
import { Skeleton } from "../../../components/ui/skeleton";
import { TeamFormDots, TeamLink } from "./TeamForm";

const WEEK = ["日", "月", "火", "水", "木", "金", "土"];

/** "2026-10-12T04:00:00Z" → { date: "10/12(日)", time: "13:00", rest: "あと2日" } */
function kickoffParts(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: iso, rest: "" };
  const jst = new Date(d.getTime() + 9 * 3600_000);
  const date = `${jst.getUTCMonth() + 1}/${jst.getUTCDate()}(${WEEK[jst.getUTCDay()]})`;
  const time = `${String(jst.getUTCHours()).padStart(2, "0")}:${String(jst.getUTCMinutes()).padStart(2, "0")}`;
  const mins = Math.round((d.getTime() - Date.now()) / 60_000);
  const rest = mins <= 0 ? "まもなく" : mins < 60 ? `あと${mins}分` : mins < 24 * 60 ? `あと${Math.floor(mins / 60)}時間` : `あと${Math.floor(mins / 1440)}日`;
  return { date, time, rest };
}

const GOALS: Record<DashboardForecast["goalsLabel"], { text: string; className: string }> = {
  HIGH: { text: "⚽ ゴール多め", className: "bg-amber-400 text-slate-950" },
  MID: { text: "⚽ 普通", className: "bg-muted text-foreground" },
  LOW: { text: "⚽ ゴール少なめ", className: "bg-sky-500/20 text-sky-600 dark:text-sky-300" },
};

export default function TeamNextMatch({ country, league, team }: { country: string; league: string; team: string }) {
  const q = useQuery({
    queryKey: ["team-upcoming", country, league, team],
    queryFn: () => fetchTeamUpcoming(country, league, team, 3),
    enabled: !!country && !!league && !!team,
    staleTime: 5 * 60_000,
  });

  const items = q.data?.items ?? [];
  const [next, ...later] = items;

  return (
    <section className="rounded-2xl border bg-card p-4" data-testid="team-next-match">
      <h2 className="mb-2 text-sm font-bold">次節</h2>
      {q.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : q.error ? (
        <div className="text-xs text-red-600">取得に失敗しました: {(q.error as Error).message}</div>
      ) : !next ? (
        <div className="text-xs text-muted-foreground">試合情報が確定するまでしばらくお待ちください。</div>
      ) : (
        <>
          <NextCard i={next} team={team} loggedIn={!!q.data?.loggedIn} />
          {later.length > 0 && (
            <div className="mt-3">
              <div className="mb-1 text-[11px] font-bold text-muted-foreground">その後</div>
              <div className="divide-y rounded-lg border">
                {later.map((i) => (
                  <LaterRow key={`${i.match.kickoff}-${i.opponent}`} i={i} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function HA({ ha }: { ha: "H" | "A" }) {
  return (
    <span className={`shrink-0 rounded px-1 text-[10px] font-bold ${ha === "H" ? "bg-emerald-500/15 text-emerald-600" : "bg-violet-500/15 text-violet-600"}`}>
      {ha === "H" ? "ホーム" : "アウェー"}
    </span>
  );
}

function NextCard({ i, team, loggedIn }: { i: TeamUpcomingItem; team: string; loggedIn: boolean }) {
  const m = i.match;
  const k = kickoffParts(m.kickoff);
  const f = m.forecast;
  const self = i.homeAway === "H" ? m.home : m.away;
  const opp = i.homeAway === "H" ? m.away : m.home;
  const g = GOALS[f.goalsLabel];

  return (
    <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <div className="font-mono text-lg font-black">
          {k.date} <span className="text-emerald-600 dark:text-emerald-300">{k.time}</span>
        </div>
        <span className="shrink-0 text-[11px] font-bold text-muted-foreground">{k.rest}</span>
      </div>
      <div className="truncate text-[11px] text-muted-foreground">
        {m.leagueLabel}
        {m.roundLabel ? ` ・ ${m.roundLabel}` : ""}
      </div>

      <div className="mt-3 space-y-1.5 text-sm">
        <Line rank={self.rank} name={team} strong />
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <HA ha={i.homeAway} /> vs
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <Rank rank={opp.rank} />
            <TeamLink country={m.country} league={m.league} team={i.opponent} className="truncate font-semibold" />
          </div>
          <TeamFormDots form={i.opponentForm} />
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
          <span>{m.home.name} 勝ち</span>
          <span>分け</span>
          <span>{m.away.name} 勝ち</span>
        </div>
        <div className="flex h-2 overflow-hidden rounded-full">
          <div className="bg-emerald-400" style={{ width: `${f.barHome}%` }} />
          <div className="bg-slate-400/70" style={{ width: `${f.barDraw}%` }} />
          <div className="bg-violet-400" style={{ width: `${f.barAway}%` }} />
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          {loggedIn && i.winProb != null ? (
            <span className={`font-mono text-xs font-bold ${i.winProb >= 50 ? "text-emerald-600" : "text-violet-600"}`}>勝つ確率 {i.winProb}%</span>
          ) : (
            <span className="text-[10px] text-muted-foreground">🔒 確率はログインで表示</span>
          )}
          <span className={`whitespace-nowrap rounded-full px-1.5 text-[10px] font-bold leading-4 ${g.className}`}>
            {g.text}
            {f.expectedTotalGoals != null && ` ${f.expectedTotalGoals.toFixed(1)}`}
          </span>
        </div>
      </div>
    </div>
  );
}

function LaterRow({ i }: { i: TeamUpcomingItem }) {
  const k = kickoffParts(i.match.kickoff);
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 text-[13px]">
      <span className="w-[72px] shrink-0 font-mono text-[11px] leading-tight">
        {k.date}
        <span className="ml-1 text-emerald-600 dark:text-emerald-300">{k.time}</span>
      </span>
      <HA ha={i.homeAway} />
      <TeamLink country={i.match.country} league={i.match.league} team={i.opponent} className="min-w-0 flex-1 truncate font-semibold" />
      {i.winProb != null && <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{i.winProb}%</span>}
    </div>
  );
}

function Rank({ rank }: { rank: number | null }) {
  return <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-muted font-mono text-[10px] font-bold">{rank ?? "-"}</span>;
}

function Line({ rank, name, strong }: { rank: number | null; name: string; strong?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <Rank rank={rank} />
      <span className={`truncate ${strong ? "font-bold" : ""}`}>{name}</span>
    </div>
  );
}
