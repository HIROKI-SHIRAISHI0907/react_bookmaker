// これからの試合（トップ画面・コンパクト版）
//  リーグごとに直近 3 試合、最初の試合が早いリーグから 5 リーグ。残りは「全試合」画面（/upcoming）へ。
//  チーム名 → チームの過去の結果（/team-results）
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { DashboardForecast, DashboardUpcomingLeague, DashboardUpcomingMatch } from "../../../api/dashboard/types";
import { RankBadge, formatKickoff } from "./parts";
import { TeamLink } from "../teams/TeamForm";

export const UPCOMING_PATH = "/upcoming";

const upcomingLink = (leagueLabel?: string) => (leagueLabel ? `${UPCOMING_PATH}?league=${encodeURIComponent(leagueLabel)}` : UPCOMING_PATH);

type Props = {
  leagues: DashboardUpcomingLeague[];
  totalCount: number;
  totalLeagueCount: number;
  loading: boolean;
  favoriteTeams: Set<string>;
};

export default function DashboardUpcoming({ leagues, totalCount, totalLeagueCount, loading, favoriteTeams }: Props) {
  const shownCount = leagues.reduce((n, l) => n + l.matches.length, 0);
  const restLeagues = Math.max(0, totalLeagueCount - leagues.length);
  const restMatches = Math.max(0, totalCount - shownCount);

  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-bold">これからの試合</div>
        <Link to={upcomingLink()} className="inline-flex items-center text-[11px] text-muted-foreground hover:text-foreground" data-testid="link-upcoming-all">
          今日・明日 {totalCount > 0 && `全${totalCount}試合`}
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {loading ? (
        <div className="text-xs text-muted-foreground">読込中...</div>
      ) : leagues.length === 0 ? (
        <div className="text-xs text-muted-foreground">予定されている試合はありません</div>
      ) : (
        <div className="space-y-3">
          {leagues.map((l) => (
            <section key={l.leagueLabel}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="truncate text-[11px] font-bold text-muted-foreground">{l.leagueLabel}</span>
                {l.totalCount > l.matches.length && (
                  <Link to={upcomingLink(l.leagueLabel)} className="shrink-0 text-[10px] text-muted-foreground hover:text-foreground">
                    他{l.totalCount - l.matches.length}試合 →
                  </Link>
                )}
              </div>
              <div className="divide-y rounded-lg border">
                {l.matches.map((m) => (
                  <UpcomingRow key={`${m.kickoff}-${m.home.name}-${m.away.name}`} m={m} favoriteTeams={favoriteTeams} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {!loading && (restLeagues > 0 || restMatches > 0) && (
        <Link
          to={upcomingLink()}
          className="mt-3 flex items-center justify-center gap-1 rounded-lg border border-dashed py-2 text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          data-testid="link-upcoming-more"
        >
          {restLeagues > 0 ? `ほか ${restLeagues} リーグ・` : ""}
          {restMatches} 試合 → 全試合を見る
        </Link>
      )}
    </div>
  );
}

/** 1試合 = 2行（時刻 | ホーム/アウェー | 勝ち分け負けの細いバー・ゴール見込み） */
function UpcomingRow({ m, favoriteTeams }: { m: DashboardUpcomingMatch; favoriteTeams: Set<string> }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5">
      <span className="w-10 shrink-0 font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-300">{formatKickoff(m.kickoff)}</span>
      <div className="min-w-0 flex-1 space-y-0.5 text-[13px] leading-tight">
        {[m.home, m.away].map((t, i) => (
          <div key={i} className="flex min-w-0 items-center gap-1">
            <RankBadge rank={t.rank} />
            <TeamLink country={m.country} league={m.league} team={t.name} className="truncate font-semibold">
              {favoriteTeams.has(t.name) && <span className="text-amber-500">★</span>}
              {t.name}
            </TeamLink>
          </div>
        ))}
      </div>
      <div className="flex w-16 shrink-0 flex-col items-end gap-1">
        <MiniWdl f={m.forecast} />
        <GoalsMini f={m.forecast} />
      </div>
    </div>
  );
}

/** 勝ち/分け/負けの細いバー（数字なし） */
function MiniWdl({ f }: { f: DashboardForecast }) {
  return (
    <div className="flex h-1.5 w-full overflow-hidden rounded-full" title={f.probHome != null ? `${f.probHome}% / ${f.probDraw}% / ${f.probAway}%` : undefined}>
      <div className="bg-emerald-400" style={{ width: `${f.barHome}%` }} />
      <div className="bg-slate-400/70" style={{ width: `${f.barDraw}%` }} />
      <div className="bg-violet-400" style={{ width: `${f.barAway}%` }} />
    </div>
  );
}

const GOALS_MINI: Record<DashboardForecast["goalsLabel"], { text: string; className: string }> = {
  HIGH: { text: "多い", className: "bg-amber-400 text-slate-950" },
  MID: { text: "普通", className: "bg-muted text-foreground" },
  LOW: { text: "少ない", className: "bg-sky-500/20 text-sky-600 dark:text-sky-300" },
};

/** ゴール見込み（短い表記） */
function GoalsMini({ f }: { f: DashboardForecast }) {
  const g = GOALS_MINI[f.goalsLabel];
  return (
    <span
      className={`whitespace-nowrap rounded-full px-1.5 text-[10px] font-bold leading-4 ${g.className}`}
      title={f.expectedTotalGoals != null ? `ゴール見込み ${f.expectedTotalGoals.toFixed(1)} 点` : undefined}
    >
      ⚽{g.text}
    </span>
  );
}
