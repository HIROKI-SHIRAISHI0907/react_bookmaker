// Dashboard（トップ画面）の小さい部品（順位・◎○△・勝ち/分け/負けのバー・ゴール数の見込み）
import type { DashboardForecast, DashboardTeam, Grade } from "../../../api/dashboard/types";

const GRADE: Record<Grade, { mark: string; className: string }> = {
  A: { mark: "◎", className: "bg-emerald-500 text-white" },
  B: { mark: "○", className: "bg-slate-500/70 text-white" },
  C: { mark: "△", className: "bg-rose-500 text-white" },
};

export function RankBadge({ rank, className = "" }: { rank: number | null; className?: string }) {
  if (rank == null) return null;
  return <span className={`grid h-4 min-w-[1.1rem] place-items-center rounded bg-muted px-1 font-mono text-[10px] font-bold text-muted-foreground ${className}`}>{rank}</span>;
}

/** 攻（得点しやすさ）・守（失点しにくさ） */
export function GradeChip({ label, grade, value }: { label: string; grade: Grade | null; value: number | null }) {
  if (!grade) return null;
  const g = GRADE[grade];
  return (
    <span className="inline-flex items-center gap-0.5 whitespace-nowrap text-[10px] text-muted-foreground">
      {label}
      <span className={`rounded px-1 font-bold ${g.className}`}>{g.mark}</span>
      {value != null && <span className="font-mono text-foreground/80">{value.toFixed(1)}</span>}
    </span>
  );
}

export function TeamGrades({ team }: { team: DashboardTeam }) {
  return (
    <span className="flex shrink-0 gap-1.5">
      <GradeChip label="攻" grade={team.attackGrade} value={team.avgGoalsFor} />
      <GradeChip label="守" grade={team.defenseGrade} value={team.avgGoalsAgainst} />
    </span>
  );
}

/** 勝ち / 分け / 負け のバー（未ログインは % を出さない） */
export function WdlBar({ f, big = false }: { f: DashboardForecast; big?: boolean }) {
  return (
    <div>
      <div className={`flex overflow-hidden rounded-full ${big ? "h-2.5" : "h-1.5"}`}>
        <div className="bg-emerald-400" style={{ width: `${f.barHome}%` }} />
        <div className="bg-slate-400/70" style={{ width: `${f.barDraw}%` }} />
        <div className="bg-violet-400" style={{ width: `${f.barAway}%` }} />
      </div>
      {f.probHome != null && (
        <div className={`mt-0.5 flex justify-between font-mono text-muted-foreground ${big ? "text-xs" : "text-[10px]"}`}>
          <span className="text-emerald-500">{f.probHome}%</span>
          <span>{f.probDraw}%</span>
          <span className="text-violet-500">{f.probAway}%</span>
        </div>
      )}
    </div>
  );
}

const GOALS: Record<DashboardForecast["goalsLabel"], { text: string; className: string }> = {
  HIGH: { text: "ゴール多い", className: "bg-amber-400 text-slate-950" },
  MID: { text: "ゴール普通", className: "bg-muted text-foreground" },
  LOW: { text: "ゴール少ない", className: "bg-sky-500/20 text-sky-600 dark:text-sky-300" },
};

/** ゴール数の見込み（ライブは「あと n 点」、試合前は「n 点」） */
export function GoalsBadge({ f }: { f: DashboardForecast }) {
  const g = GOALS[f.goalsLabel];
  const num = f.expectedRestGoals != null ? `あと ${f.expectedRestGoals.toFixed(1)}` : f.expectedTotalGoals != null ? `${f.expectedTotalGoals.toFixed(1)} 点` : null;
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold ${g.className}`}>
      ⚽ {g.text}
      {num && <span className="font-mono font-normal">{num}</span>}
    </span>
  );
}

export function LiveDot() {
  return <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />;
}

/** "2026-10-07T10:00:00Z" → "19:00"（今日）/ "明日 04:00" / "10/9 19:00" */
export function formatKickoff(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const hm = d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return hm;
  if (d.toDateString() === tomorrow.toDateString()) return `明日 ${hm}`;
  return `${d.getMonth() + 1}/${d.getDate()} ${hm}`;
}
