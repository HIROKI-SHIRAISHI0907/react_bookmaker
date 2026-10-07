// 注目の試合（ライブ中でゴール数の見込みが一番多い試合）
import type { DashboardLiveMatch, DashboardTeam } from "../../../api/dashboard/types";
import { GoalsBadge, TeamGrades, WdlBar } from "./parts";

function Crest({ team, rankSide }: { team: DashboardTeam; rankSide: "left" | "right" }) {
  return (
    <div className="relative grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-lg font-black text-white">
      {team.name.slice(0, 1)}
      {team.rank != null && (
        <span
          className={`absolute -bottom-1 ${rankSide === "left" ? "-left-1" : "-right-1"} grid h-6 w-6 place-items-center rounded-full bg-background font-mono text-[11px] text-foreground ring-2 ring-emerald-400`}
        >
          {team.rank}
        </span>
      )}
    </div>
  );
}

function Stat({ label, home, away, ratio }: { label: string; home: string; away: string; ratio: number | null }) {
  return (
    <div className="rounded-lg bg-background/60 p-3">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-1 flex justify-between font-mono font-bold">
        <span>{home}</span>
        <span className="text-muted-foreground">{away}</span>
      </div>
      {ratio != null && (
        <div className="mt-1 flex h-1 overflow-hidden rounded">
          <div className="bg-emerald-400" style={{ width: `${Math.round(ratio * 100)}%` }} />
          <div className="flex-1 bg-muted" />
        </div>
      )}
    </div>
  );
}

const ratio = (h: number | null, a: number | null) => (h == null || a == null || h + a <= 0 ? null : h / (h + a));
const fmt = (v: number | null, digits = 0, suffix = "") => (v == null ? "-" : `${v.toFixed(digits)}${suffix}`);

export default function DashboardFeatured({ m, onOpen }: { m: DashboardLiveMatch; onOpen: (seq: number) => void }) {
  const f = m.forecast;
  return (
    <section className="relative cursor-pointer overflow-hidden rounded-2xl border bg-gradient-to-br from-emerald-500/15 via-card to-cyan-500/15 p-6" onClick={() => onOpen(m.seq)}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="rounded-full bg-muted px-2.5 py-1">
          注目の試合 ・ {m.leagueLabel}
          {m.roundLabel ? ` ・ ${m.roundLabel}` : ""}
        </span>
        <span className="flex items-center gap-2">
          <GoalsBadge f={f} />
          <span className="flex items-center gap-1.5 rounded-full bg-rose-500 px-2.5 py-1 font-bold text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            {m.status === "HT" ? "HT" : `LIVE ${m.minuteLabel}`}
          </span>
        </span>
      </div>

      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Crest team={m.home} rankSide="right" />
          <div className="min-w-0">
            <div className="truncate text-xl font-bold">{m.home.name}</div>
            <div className="mt-1 flex gap-2">
              <TeamGrades team={m.home} />
            </div>
          </div>
        </div>
        <div className="text-center">
          <div className="font-mono text-5xl font-black tracking-tight">
            {m.homeScore} <span className="text-muted-foreground">-</span> {m.awayScore}
          </div>
          {m.halftimeHomeScore != null && (
            <div className="mt-1 text-[11px] text-muted-foreground">
              前半 {m.halftimeHomeScore}-{m.halftimeAwayScore}
            </div>
          )}
        </div>
        <div className="flex min-w-0 items-center justify-end gap-3 text-right">
          <div className="min-w-0">
            <div className="truncate text-xl font-bold">{m.away.name}</div>
            <div className="mt-1 flex justify-end gap-2">
              <TeamGrades team={m.away} />
            </div>
          </div>
          <Crest team={m.away} rankSide="left" />
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
          <span>{m.home.name} 勝ち</span>
          <span>このままなら</span>
          <span>{m.away.name} 勝ち</span>
        </div>
        <WdlBar f={f} big />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="枠内シュート" home={fmt(m.homeShotsOnTarget)} away={fmt(m.awayShotsOnTarget)} ratio={ratio(m.homeShotsOnTarget, m.awayShotsOnTarget)} />
        <Stat label="ポゼッション" home={fmt(m.homePossession, 0, "%")} away={fmt(m.awayPossession, 0, "%")} ratio={ratio(m.homePossession, m.awayPossession)} />
        <Stat label="ゴール期待値 (xG)" home={fmt(m.homeXg, 2)} away={fmt(m.awayXg, 2)} ratio={ratio(m.homeXg, m.awayXg)} />
        <Stat
          label="今季の得点 / 失点（1試合平均）"
          home={m.home.avgGoalsFor != null ? `${m.home.avgGoalsFor.toFixed(1)} / ${fmt(m.home.avgGoalsAgainst, 1)}` : "🔒"}
          away={m.away.avgGoalsFor != null ? `${m.away.avgGoalsFor.toFixed(1)} / ${fmt(m.away.avgGoalsAgainst, 1)}` : "🔒"}
          ratio={null}
        />
      </div>
    </section>
  );
}
