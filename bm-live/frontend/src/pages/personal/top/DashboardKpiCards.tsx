// 数字カード（ライブ・今日のゴール・これから・終了）
import type { DashboardSummaryResponse } from "../../../api/dashboard/types";
import { LiveDot, formatKickoff } from "./parts";

export default function DashboardKpiCards({ s }: { s: DashboardSummaryResponse | undefined }) {
  const card = "rounded-xl border bg-card p-4";
  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <div className="rounded-xl border border-rose-500/30 bg-gradient-to-br from-rose-500/15 to-rose-500/5 p-4">
        <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-300">
          <LiveDot />
          ライブ中
        </div>
        <div className="mt-1 text-3xl font-black">
          {s?.liveCount ?? "-"}
          <span className="ml-1 text-sm font-medium text-muted-foreground">試合</span>
        </div>
        <div className="text-[11px] text-muted-foreground">ゴールが多い見込み {s?.highGoalLiveCount ?? 0} 試合</div>
      </div>
      <div className={card}>
        <div className="text-xs text-muted-foreground">今日のゴール</div>
        <div className="mt-1 text-3xl font-black">{s?.goalsToday ?? "-"}</div>
        <div className="text-[11px] text-muted-foreground">1試合平均 {s?.avgGoalsToday ?? "-"}</div>
      </div>
      <div className={card}>
        <div className="text-xs text-muted-foreground">今日これから</div>
        <div className="mt-1 text-3xl font-black">{s?.upcomingTodayCount ?? "-"}</div>
        <div className="truncate text-[11px] text-muted-foreground">{s?.nextKickoff ? `次 ${formatKickoff(s.nextKickoff)} ${s.nextHomeTeam} vs ${s.nextAwayTeam}` : "予定なし"}</div>
      </div>
      <div className={card}>
        <div className="text-xs text-muted-foreground">今日終了</div>
        <div className="mt-1 text-3xl font-black">{s?.finishedCount ?? "-"}</div>
        <div className="text-[11px] text-muted-foreground">
          番狂わせ {s?.upsetCount ?? 0} ・ 引き分け {s?.drawCount ?? 0}
        </div>
      </div>
    </section>
  );
}
