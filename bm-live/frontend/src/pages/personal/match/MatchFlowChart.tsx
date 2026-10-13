// 試合の流れ: xG（無ければシュート数）の推移 2 本線 + ゴールの点 + ハーフタイムの線
//  ホーム = emerald / アウェー = violet（パレット検証済み: light #059669 / #7c3aed、dark #059669 / #8b5cf6）
//  ホバーで縦線とツールチップ（時間・スコア・両チームの値）
import { useMemo, useRef, useState } from "react";
import type { MatchGoal, MatchTimelinePoint } from "../../../api/match/matchtypes";

const W = 640;
const H = 220;
const PAD = { top: 14, right: 44, bottom: 26, left: 34 };
const IW = W - PAD.left - PAD.right;
const IH = H - PAD.top - PAD.bottom;

const HOME_STROKE = "stroke-emerald-600";
const AWAY_STROKE = "stroke-violet-600 dark:stroke-violet-500";
const HOME_FILL = "fill-emerald-600";
const AWAY_FILL = "fill-violet-600 dark:fill-violet-500";

type Series = { minute: number; home: number | null; away: number | null; p: MatchTimelinePoint };

function niceMax(v: number, isXg: boolean): number {
  if (isXg) return Math.max(1, Math.ceil(v * 2) / 2);
  return Math.max(5, Math.ceil(v / 5) * 5);
}

export default function MatchFlowChart({ timeline, goals, homeTeam, awayTeam }: { timeline: MatchTimelinePoint[]; goals: MatchGoal[]; homeTeam: string; awayTeam: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<Series | null>(null);

  const { series, isXg, xMax, yMax } = useMemo(() => {
    const hasXg = timeline.some((p) => p.homeXg != null || p.awayXg != null);
    let lh: number | null = null;
    let la: number | null = null;
    const s: Series[] = timeline.map((p) => {
      const h = hasXg ? p.homeXg : p.homeShots;
      const a = hasXg ? p.awayXg : p.awayShots;
      if (h != null) lh = h;
      if (a != null) la = a;
      return { minute: p.minute, home: lh, away: la, p };
    });
    const maxV = Math.max(0, ...s.map((x) => Math.max(x.home ?? 0, x.away ?? 0)));
    const lastMin = s.length ? s[s.length - 1].minute : 90;
    return { series: s, isXg: hasXg, xMax: Math.max(90, Math.ceil(lastMin / 5) * 5), yMax: niceMax(maxV, hasXg) };
  }, [timeline]);

  if (series.length < 2) {
    return <div className="text-xs text-muted-foreground">試合の流れのデータがまだありません</div>;
  }

  const x = (m: number) => PAD.left + (Math.min(m, xMax) / xMax) * IW;
  const y = (v: number) => PAD.top + IH - (v / yMax) * IH;

  const path = (key: "home" | "away") => {
    let d = "";
    for (const s of series) {
      const v = s[key];
      if (v == null) continue;
      d += `${d ? "L" : "M"}${x(s.minute).toFixed(1)},${y(v).toFixed(1)}`;
    }
    return d;
  };

  const valueAt = (m: number, key: "home" | "away") => {
    let v: number | null = null;
    for (const s of series) {
      if (s.minute > m) break;
      if (s[key] != null) v = s[key];
    }
    return v ?? 0;
  };

  const yTicks = [0, yMax / 2, yMax];
  const xTicks = [0, 15, 30, 45, 60, 75, 90].filter((t) => t <= xMax);
  const last = series[series.length - 1];
  const fmt = (v: number | null) => (v == null ? "-" : isXg ? v.toFixed(2) : String(v));

  const onMove = (e: React.MouseEvent<SVGRectElement>) => {
    const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const m = ((px - PAD.left) / IW) * xMax;
    let best = series[0];
    for (const s of series) if (Math.abs(s.minute - m) < Math.abs(best.minute - m)) best = s;
    setHover(best);
  };

  const tipLeft = hover ? (x(hover.minute) / W) * 100 : 0;

  return (
    <div ref={wrapRef} className="relative">
      {/* 凡例（2 系列なので凡例 + 線の端に直接ラベル） */}
      <div className="mb-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <span className="font-bold text-foreground">{isXg ? "ゴール期待値（xG）の推移" : "シュート数の推移"}</span>
        <span className="flex items-center gap-1">
          <svg width="16" height="8" aria-hidden>
            <line x1="0" y1="4" x2="16" y2="4" className={HOME_STROKE} strokeWidth="2" strokeLinecap="round" />
          </svg>
          {homeTeam}
        </span>
        <span className="flex items-center gap-1">
          <svg width="16" height="8" aria-hidden>
            <line x1="0" y1="4" x2="16" y2="4" className={AWAY_STROKE} strokeWidth="2" strokeLinecap="round" strokeDasharray="4 3" />
          </svg>
          {awayTeam}
        </span>
        <span className="flex items-center gap-1">
          <svg width="10" height="10" aria-hidden>
            <circle cx="5" cy="5" r="4" className="fill-foreground" />
          </svg>
          ゴール
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={`${homeTeam} と ${awayTeam} の${isXg ? "xG" : "シュート数"}の推移`}>
        {/* グリッド（控えめ） */}
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="stroke-border" strokeWidth="1" />
            <text x={PAD.left - 6} y={y(t) + 3} textAnchor="end" className="fill-muted-foreground text-[10px]">
              {isXg ? t.toFixed(1) : t}
            </text>
          </g>
        ))}
        {xTicks.map((t) => (
          <text key={t} x={x(t)} y={H - 8} textAnchor="middle" className="fill-muted-foreground text-[10px]">
            {t}'
          </text>
        ))}
        {/* ハーフタイム */}
        <line x1={x(45)} x2={x(45)} y1={PAD.top} y2={PAD.top + IH} className="stroke-muted-foreground/40" strokeWidth="1" strokeDasharray="3 3" />
        <text x={x(45) + 3} y={PAD.top + 9} className="fill-muted-foreground text-[9px]">
          HT
        </text>

        {/* 線（アウェーは破線: 色だけに頼らない） */}
        <path d={path("home")} fill="none" className={HOME_STROKE} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <path d={path("away")} fill="none" className={AWAY_STROKE} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="5 4" />

        {/* 線の端に直接ラベル */}
        {last.home != null && (
          <text x={x(last.minute) + 5} y={y(last.home) + 3} className="fill-foreground text-[10px] font-bold">
            {fmt(last.home)}
          </text>
        )}
        {last.away != null && (
          <text x={x(last.minute) + 5} y={y(last.away) + (Math.abs((last.home ?? -99) - last.away) < yMax * 0.06 ? 13 : 3)} className="fill-foreground text-[10px] font-bold">
            {fmt(last.away)}
          </text>
        )}

        {/* ゴール（その時点の線の上に点。背景色のリングで線と分ける） */}
        {goals.map((g, i) => {
          const key = g.side === "H" ? "home" : "away";
          return (
            <circle key={i} cx={x(g.minute)} cy={y(valueAt(g.minute, key))} r="5" className={`${g.side === "H" ? HOME_FILL : AWAY_FILL} stroke-background`} strokeWidth="2">
              <title>{`${g.label ?? `${g.minute}'`} ゴール（${g.side === "H" ? homeTeam : awayTeam}） ${g.homeScore}-${g.awayScore}`}</title>
            </circle>
          );
        })}

        {/* ホバー */}
        {hover && <line x1={x(hover.minute)} x2={x(hover.minute)} y1={PAD.top} y2={PAD.top + IH} className="stroke-foreground/40" strokeWidth="1" />}
        <rect x={PAD.left} y={PAD.top} width={IW} height={IH} fill="transparent" onMouseMove={onMove} onMouseLeave={() => setHover(null)} />
      </svg>

      {hover && (
        <div
          className="pointer-events-none absolute top-6 z-10 -translate-x-1/2 rounded-lg border bg-popover px-2.5 py-1.5 text-[11px] shadow-md"
          style={{ left: `${Math.min(85, Math.max(15, tipLeft))}%` }}
        >
          <div className="font-mono font-bold">
            {hover.p.label ?? `${hover.minute}'`}　{hover.p.homeScore ?? "-"} - {hover.p.awayScore ?? "-"}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 rounded bg-emerald-600" />
            <span className="max-w-[9rem] truncate">{homeTeam}</span>
            <span className="ml-auto font-mono font-bold">{fmt(hover.home)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 rounded bg-violet-600 dark:bg-violet-500" />
            <span className="max-w-[9rem] truncate">{awayTeam}</span>
            <span className="ml-auto font-mono font-bold">{fmt(hover.away)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
