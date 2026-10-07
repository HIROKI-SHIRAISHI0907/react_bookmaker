// これからの試合（future_master）
import type { DashboardUpcomingMatch } from "../../../api/dashboard/types";
import { GoalsBadge, RankBadge, TeamGrades, WdlBar, formatKickoff } from "./parts";

export default function DashboardUpcoming({ matches, loading, favoriteTeams }: { matches: DashboardUpcomingMatch[]; loading: boolean; favoriteTeams: Set<string> }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-bold">これからの試合</div>
        <span className="text-[11px] text-muted-foreground">今日・明日</span>
      </div>
      {loading ? (
        <div className="text-xs text-muted-foreground">読込中...</div>
      ) : matches.length === 0 ? (
        <div className="text-xs text-muted-foreground">予定されている試合はありません</div>
      ) : (
        <div className="divide-y">
          {matches.map((m) => (
            <div key={`${m.kickoff}-${m.home.name}-${m.away.name}`} className="py-3 first:pt-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-300">{formatKickoff(m.kickoff)}</span>
                <span className="flex min-w-0 items-center gap-2">
                  <GoalsBadge f={m.forecast} />
                  <span className="truncate text-[10px] text-muted-foreground">
                    {m.league}
                    {m.roundLabel ? ` ${m.roundLabel}` : ""}
                  </span>
                </span>
              </div>
              <div className="mt-1.5 space-y-1 text-sm">
                {[m.home, m.away].map((t, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <RankBadge rank={t.rank} />
                      <span className="truncate font-semibold">
                        {favoriteTeams.has(t.name) && <span className="text-amber-500">★ </span>}
                        {t.name}
                      </span>
                    </div>
                    <TeamGrades team={t} />
                  </div>
                ))}
              </div>
              <div className="mt-2">
                <WdlBar f={m.forecast} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
