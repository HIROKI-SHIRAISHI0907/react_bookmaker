// 試合詳細の統計詳細データ（GET /v1/api/match-detail/extra?matchId=）を表示する部品
//  - MomentumChart   : マッチモメンタム（1分ごとの勢い。上 = ホーム、下 = アウェー）
//  - DetailGoalList  : ゴール（得点者・アシスト・PK・オウンゴール）
//  - EventTimeline   : 試合の出来事（ハーフごと。ゴール・カード・交代など）
//  - LineupView      : フォーメーション図・交代・控え・欠場者
//  - PlayerStatsTable: 選手スタッツ（並べ替え・チーム切り替え）
//  ホーム = emerald / アウェー = violet（MatchFlowChart と同じ）
import { useMemo, useState } from "react";
import type {
  DetailEvent,
  DetailFormation,
  DetailGoal,
  DetailLineup,
  DetailMissing,
  DetailMomentum,
  DetailMomentumIncident,
  DetailPlayerStat,
  MatchDetailExtraResponse,
} from "../../../api/match/matchtypes";

// ===================== 共通 =====================
/** "12" / "6.8" / "35/40 (88%)" → 先頭の数値。無ければ null */
export function num(v: string | null | undefined): number | null {
  if (v == null) return null;
  const m = String(v).match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
}

const isHome = (side: string | null | undefined) => (side ?? "").toUpperCase() === "HOME";

/** 出来事の種類 → 表示用のアイコンと名前 */
function incidentIcon(type: string | null | undefined): { icon: string; label: string } {
  const t = (type ?? "").toLowerCase();
  if (t.includes("own")) return { icon: "⚽", label: "オウンゴール" };
  if (t.includes("penalty") && t.includes("miss")) return { icon: "✕", label: "PK失敗" };
  if (t.includes("disallow") || t.includes("cancel")) return { icon: "✕", label: "ゴール取り消し" };
  if (t.includes("soccer") || t.includes("goal")) return { icon: "⚽", label: "ゴール" };
  if (t.includes("yellow") && t.includes("red")) return { icon: "🟨🟥", label: "2枚目のイエロー" };
  if (t.includes("red")) return { icon: "🟥", label: "レッドカード" };
  if (t.includes("yellow")) return { icon: "🟨", label: "イエローカード" };
  if (t.includes("sub")) return { icon: "⇄", label: "交代" };
  if (t.includes("var")) return { icon: "VAR", label: "VAR" };
  return { icon: "•", label: type ?? "" };
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="text-xs text-muted-foreground">{children}</div>;
}

// ===================== ハーフのスコア =====================
/** 「前半 1-0」などの短い表記（スコアの下に出す） */
export function HalfScores({ ex }: { ex: MatchDetailExtraResponse }) {
  const halves = ex.halves.filter((h) => h.score);
  if (halves.length === 0) return null;
  return (
    <div className="mt-1 flex flex-wrap justify-center gap-x-3 text-[11px] text-muted-foreground">
      {halves.map((h, i) => (
        <span key={i}>
          {h.half ?? `第${i + 1}ハーフ`} <b className="font-mono text-foreground">{h.score}</b>
        </span>
      ))}
    </div>
  );
}

// ===================== マッチモメンタム =====================
const MW = 640;
const MH = 170;
const MPAD = { top: 18, right: 10, bottom: 22, left: 10 };

export function MomentumChart({
  momentum,
  incidents,
  homeTeam,
  awayTeam,
}: {
  momentum: DetailMomentum[];
  incidents: DetailMomentumIncident[];
  homeTeam: string;
  awayTeam: string;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const bars = useMemo(
    () =>
      momentum
        .map((m) => {
          const signed = num(m.signedValue) ?? (isHome(m.side) ? num(m.value) : -(num(m.value) ?? 0));
          return { label: m.minuteLabel ?? m.minute ?? "", half: m.half ?? "", v: signed ?? 0 };
        })
        .filter((b) => b.label),
    [momentum],
  );

  if (bars.length < 2) return <Empty>マッチモメンタムのデータがありません</Empty>;

  const n = bars.length;
  const iw = MW - MPAD.left - MPAD.right;
  const ih = MH - MPAD.top - MPAD.bottom;
  const mid = MPAD.top + ih / 2;
  const maxAbs = Math.max(1, ...bars.map((b) => Math.abs(b.v)));
  const bw = iw / n;
  const bx = (i: number) => MPAD.left + i * bw;
  const bh = (v: number) => (Math.abs(v) / maxAbs) * (ih / 2 - 2);

  // ハーフの切れ目
  const halfBreaks: number[] = [];
  for (let i = 1; i < n; i++) if (bars[i].half !== bars[i - 1].half) halfBreaks.push(i);

  // アイコン → 同じ分の棒の位置
  const indexOfLabel = new Map<string, number>();
  bars.forEach((b, i) => {
    if (!indexOfLabel.has(b.label)) indexOfLabel.set(b.label, i);
  });
  const marks = incidents
    .map((inc) => {
      const i = indexOfLabel.get(inc.minuteLabel ?? "");
      if (i == null) return null;
      return { i, home: isHome(inc.side), ...incidentIcon(inc.type), minute: inc.minuteLabel ?? "" };
    })
    .filter((m): m is NonNullable<typeof m> => m != null);

  const ticks = bars.map((b, i) => ({ i, m: num(b.label) })).filter((t) => t.m != null && t.m % 15 === 0 && !bars[t.i].label.includes("+"));
  const h = hover != null ? bars[hover] : null;

  const onMove = (e: React.MouseEvent<SVGRectElement>) => {
    const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * MW;
    const i = Math.floor((px - MPAD.left) / bw);
    setHover(i >= 0 && i < n ? i : null);
  };

  return (
    <div className="relative">
      <div className="mb-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <span className="font-bold text-foreground">マッチモメンタム</span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-600" />
          {homeTeam}（上）
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-violet-600 dark:bg-violet-500" />
          {awayTeam}（下）
        </span>
      </div>
      <svg viewBox={`0 0 ${MW} ${MH}`} className="block h-auto w-full" role="img" aria-label={`${homeTeam} と ${awayTeam} のマッチモメンタム`}>
        <line x1={MPAD.left} x2={MW - MPAD.right} y1={mid} y2={mid} className="stroke-border" strokeWidth="1" />
        {halfBreaks.map((i) => (
          <line key={i} x1={bx(i)} x2={bx(i)} y1={MPAD.top} y2={MPAD.top + ih} className="stroke-muted-foreground/40" strokeWidth="1" strokeDasharray="3 3" />
        ))}
        {bars.map((b, i) => {
          const hgt = bh(b.v);
          const up = b.v >= 0;
          return (
            <rect
              key={i}
              x={bx(i) + 0.5}
              y={up ? mid - hgt : mid}
              width={Math.max(1, bw - 1)}
              height={Math.max(0.5, hgt)}
              rx={1}
              className={`${up ? "fill-emerald-600" : "fill-violet-600 dark:fill-violet-500"} ${hover === i ? "opacity-100" : "opacity-85"}`}
            />
          );
        })}
        {marks.map((m, k) => (
          <text key={k} x={bx(m.i) + bw / 2} y={m.home ? MPAD.top - 4 : MPAD.top + ih + 12} textAnchor="middle" className="text-[10px]">
            <title>{`${m.minute}' ${m.label}（${m.home ? homeTeam : awayTeam}）`}</title>
            {m.icon}
          </text>
        ))}
        {ticks.map((t) => (
          <text key={t.i} x={bx(t.i) + bw / 2} y={MH - 2} textAnchor="middle" className="fill-muted-foreground text-[9px]">
            {t.m}'
          </text>
        ))}
        <rect x={MPAD.left} y={MPAD.top} width={iw} height={ih} fill="transparent" onMouseMove={onMove} onMouseLeave={() => setHover(null)} />
      </svg>
      {h && hover != null && (
        <div
          className="pointer-events-none absolute top-6 z-10 -translate-x-1/2 rounded-lg border bg-popover px-2.5 py-1.5 text-[11px] shadow-md"
          style={{ left: `${Math.min(85, Math.max(15, ((bx(hover) + bw / 2) / MW) * 100))}%` }}
        >
          <div className="font-mono font-bold">{h.label}'</div>
          <div>
            {h.v >= 0 ? homeTeam : awayTeam} が優勢 <b className="font-mono">{Math.abs(h.v).toFixed(0)}</b>
          </div>
        </div>
      )}
    </div>
  );
}

// ===================== ゴール =====================
export function DetailGoalList({ goals }: { goals: DetailGoal[] }) {
  if (goals.length === 0) return <div className="mt-3 text-xs text-muted-foreground">ゴールはありません</div>;
  return (
    <ol className="mt-3 divide-y rounded-lg border text-[13px]">
      {goals.map((g, i) => {
        const away = !isHome(g.side);
        return (
          <li key={i} className={`flex items-center gap-2 px-3 py-1.5 ${away ? "flex-row-reverse text-right" : ""}`}>
            <span className="w-12 shrink-0 font-mono text-[11px] text-muted-foreground">{g.timeLabel ?? (g.minute ? `${g.minute}'` : "")}</span>
            <span aria-hidden>⚽</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">
                {g.scorer ?? "-"}
                {g.penalty && <span className="ml-1 rounded bg-muted px-1 text-[10px] font-normal">PK</span>}
                {g.ownGoal && <span className="ml-1 rounded bg-muted px-1 text-[10px] font-normal">OG</span>}
              </span>
              {g.assist && <span className="block truncate text-[11px] text-muted-foreground">アシスト：{g.assist}</span>}
            </span>
            <span className="shrink-0 font-mono font-bold">{g.score ?? ""}</span>
          </li>
        );
      })}
    </ol>
  );
}

// ===================== 試合の出来事 =====================
export function EventTimeline({ events, halves }: { events: DetailEvent[]; halves: MatchDetailExtraResponse["halves"] }) {
  const groups = useMemo(() => {
    const m = new Map<string, DetailEvent[]>();
    for (const e of events) {
      const k = e.half ?? "";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(e);
    }
    return Array.from(m.entries());
  }, [events]);

  if (events.length === 0) return <Empty>試合の出来事のデータがありません</Empty>;
  const scoreOf = (half: string) => halves.find((h) => (h.half ?? "") === half)?.score;

  return (
    <div className="space-y-3">
      {groups.map(([half, list]) => (
        <section key={half}>
          <h3 className="mb-1 flex items-center justify-between rounded-md bg-muted/60 px-3 py-1 text-[12px] font-bold">
            <span>{half || "-"}</span>
            {scoreOf(half) && <span className="font-mono">{scoreOf(half)}</span>}
          </h3>
          <ol className="divide-y text-[13px]">
            {list.map((e, i) => {
              const away = !isHome(e.side);
              const ic = incidentIcon(e.type);
              const sub = ic.label === "交代";
              return (
                <li key={i} className={`flex items-start gap-2 px-2 py-1.5 ${away ? "flex-row-reverse text-right" : ""}`}>
                  <span className="w-12 shrink-0 pt-0.5 font-mono text-[11px] text-muted-foreground">{e.timeLabel ?? ""}</span>
                  <span className="shrink-0 text-[12px]" title={ic.label} aria-label={ic.label}>
                    {ic.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    {sub ? (
                      <>
                        <span className="block truncate">
                          <span className="text-emerald-700 dark:text-emerald-400">IN</span> <b>{e.player ?? "-"}</b>
                        </span>
                        {e.subOutPlayer && (
                          <span className="block truncate text-[11px] text-muted-foreground">
                            <span className="text-rose-600 dark:text-rose-400">OUT</span> {e.subOutPlayer}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="block truncate font-semibold">{e.player ?? ic.label}</span>
                        {(e.assist || e.note) && <span className="block truncate text-[11px] text-muted-foreground">{e.assist ?? e.note}</span>}
                      </>
                    )}
                  </span>
                  {e.score && <span className="shrink-0 font-mono font-bold">{e.score}</span>}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
      <p className="text-[10px] text-muted-foreground">左がホーム、右がアウェーの出来事です。</p>
    </div>
  );
}

// ===================== メンバー =====================
function ratingClass(r: number | null): string {
  if (r == null) return "bg-muted text-muted-foreground";
  if (r >= 7.5) return "bg-emerald-600 text-white";
  if (r >= 6.5) return "bg-sky-600 text-white";
  if (r >= 6.0) return "bg-amber-500 text-white";
  return "bg-rose-600 text-white";
}

function EventBadges({ events }: { events: string | null }) {
  if (!events) return null;
  const parts = events.split("/").filter(Boolean);
  const out: string[] = [];
  for (const p of parts) {
    const [type, count] = p.split("×");
    const ic = incidentIcon(type);
    if (ic.icon === "•" || ic.label === "交代") continue;
    out.push(count ? `${ic.icon}×${count}` : ic.icon);
  }
  if (out.length === 0) return null;
  return <span className="text-[9px] leading-none">{out.join(" ")}</span>;
}

function PitchPlayer({ p, left, top, home }: { p: DetailLineup; left: number; top: number; home: boolean }) {
  const r = num(p.rating);
  return (
    <div className="absolute flex w-[4.5rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center" style={{ left: `${left}%`, top: `${top}%` }}>
      <div className="relative">
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-white/80 text-[11px] font-bold text-white shadow ${
            home ? "bg-emerald-700" : "bg-violet-700"
          }`}
        >
          {p.number ?? ""}
        </div>
        {r != null && <span className={`absolute -right-4 -top-1 rounded px-1 font-mono text-[9px] font-bold ${ratingClass(r)}`}>{r.toFixed(1)}</span>}
        {p.subOutMinute && <span className="absolute -left-3 -top-1 rounded bg-rose-600 px-0.5 text-[8px] text-white">↓{p.subOutMinute}</span>}
      </div>
      <div className="mt-0.5 max-w-full truncate rounded bg-black/35 px-1 text-[10px] text-white">{p.name ?? ""}</div>
      <EventBadges events={p.events} />
    </div>
  );
}

/** 横向きのピッチ（左半分 = ホーム、右半分 = アウェー）。行 1 = GK でゴール側から並べる */
function Pitch({ starters }: { starters: DetailLineup[] }) {
  const sides = [true, false].map((home) => {
    const list = starters.filter((p) => isHome(p.side) === home && num(p.pitchRow) != null);
    const rows = new Map<number, DetailLineup[]>();
    for (const p of list) {
      const r = num(p.pitchRow)!;
      if (!rows.has(r)) rows.set(r, []);
      rows.get(r)!.push(p);
    }
    const rowKeys = Array.from(rows.keys()).sort((a, b) => a - b);
    return { home, rows, rowKeys };
  });

  if (sides.every((s) => s.rowKeys.length === 0)) return null;

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-emerald-800/90 dark:bg-emerald-950" style={{ aspectRatio: "3 / 2" }}>
      {/* ライン */}
      <div className="absolute inset-2 rounded-md border border-white/30" />
      <div className="absolute bottom-2 left-1/2 top-2 border-l border-white/30" />
      <div className="absolute left-1/2 top-1/2 h-[22%] w-[15%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30" />
      <div className="absolute left-2 top-1/2 h-[44%] w-[12%] -translate-y-1/2 border border-l-0 border-white/30" />
      <div className="absolute right-2 top-1/2 h-[44%] w-[12%] -translate-y-1/2 border border-r-0 border-white/30" />
      {sides.map(({ home, rows, rowKeys }) =>
        rowKeys.map((rk, ri) => {
          const players = [...rows.get(rk)!].sort((a, b) => (num(a.pitchCol) ?? 0) - (num(b.pitchCol) ?? 0));
          // 行の位置: ホームは左のゴールから中央へ、アウェーは右のゴールから中央へ
          const depth = ((ri + 0.5) / rowKeys.length) * 46 + 2;
          const left = home ? depth : 100 - depth;
          return players.map((p, ci) => {
            let top = ((ci + 0.5) / players.length) * 100;
            if (!home) top = 100 - top; // 向かい合わせになるよう上下を反転
            return <PitchPlayer key={`${home}-${rk}-${ci}`} p={p} left={left} top={8 + top * 0.84} home={home} />;
          });
        }),
      )}
    </div>
  );
}

function TeamLineupList({
  title,
  home,
  formation,
  lineups,
  missing,
}: {
  title: string;
  home: boolean;
  formation: DetailFormation | undefined;
  lineups: DetailLineup[];
  missing: DetailMissing[];
}) {
  const mine = lineups.filter((p) => isHome(p.side) === home);
  const subs = mine.filter((p) => p.subInMinute);
  const bench = mine.filter((p) => p.lineupType !== "スタメン" && !p.played);
  const out = missing.filter((m) => isHome(m.side) === home);
  return (
    <div className="min-w-0 space-y-2 text-[12px]">
      <div className="flex items-baseline justify-between gap-2">
        <span className={`truncate font-bold ${home ? "text-emerald-700 dark:text-emerald-400" : "text-violet-700 dark:text-violet-400"}`}>{title}</span>
        <span className="shrink-0 font-mono">{formation?.formation ?? ""}</span>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-[11px]">
        {formation?.coach && (
          <>
            <dt className="text-muted-foreground">監督</dt>
            <dd className="truncate">{formation.coach}</dd>
          </>
        )}
        {formation?.averageRating && (
          <>
            <dt className="text-muted-foreground">平均評価点</dt>
            <dd className="font-mono">{formation.averageRating}</dd>
          </>
        )}
      </dl>
      {subs.length > 0 && (
        <div>
          <div className="mb-0.5 text-[11px] font-bold text-muted-foreground">交代</div>
          <ul className="space-y-0.5">
            {subs.map((p, i) => (
              <li key={i} className="flex items-center gap-1.5">
                <span className="w-9 shrink-0 font-mono text-[11px] text-muted-foreground">{p.subInMinute}</span>
                <span className="min-w-0 flex-1 truncate">
                  <span className="text-emerald-700 dark:text-emerald-400">↑</span> {p.name}
                  {p.subInFor && <span className="text-muted-foreground"> ← {p.subInFor}</span>}
                </span>
                {num(p.rating) != null && <span className={`rounded px-1 font-mono text-[10px] font-bold ${ratingClass(num(p.rating))}`}>{num(p.rating)!.toFixed(1)}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {bench.length > 0 && (
        <div>
          <div className="mb-0.5 text-[11px] font-bold text-muted-foreground">控え（出場なし）</div>
          <div className="text-[11px] leading-relaxed">{bench.map((p) => `${p.number ? `${p.number} ` : ""}${p.name ?? ""}`).join("、")}</div>
        </div>
      )}
      {out.length > 0 && (
        <div>
          <div className="mb-0.5 text-[11px] font-bold text-muted-foreground">欠場</div>
          <ul className="space-y-0.5 text-[11px]">
            {out.map((m, i) => (
              <li key={i} className="flex justify-between gap-2">
                <span className="truncate">{m.name}</span>
                <span className="shrink-0 text-muted-foreground">{m.reason ?? ""}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function LineupView({ ex, homeTeam, awayTeam }: { ex: MatchDetailExtraResponse; homeTeam: string; awayTeam: string }) {
  const starters = ex.lineups.filter((p) => p.lineupType === "スタメン");
  if (ex.lineups.length === 0 && ex.missing.length === 0) return <Empty>メンバーのデータがありません</Empty>;
  const fm = (home: boolean) => ex.formations.find((f) => isHome(f.side) === home);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-[12px] font-bold">
        <span className="truncate text-emerald-700 dark:text-emerald-400">
          {homeTeam} {fm(true)?.formation ?? ""}
        </span>
        <span className="truncate text-right text-violet-700 dark:text-violet-400">
          {fm(false)?.formation ?? ""} {awayTeam}
        </span>
      </div>
      <Pitch starters={starters} />
      <p className="text-[10px] text-muted-foreground">数字は背番号、右上は評価点、↓は途中交代の時間です。</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <TeamLineupList title={homeTeam} home formation={fm(true)} lineups={ex.lineups} missing={ex.missing} />
        <TeamLineupList title={awayTeam} home={false} formation={fm(false)} lineups={ex.lineups} missing={ex.missing} />
      </div>
    </div>
  );
}

// ===================== 選手スタッツ =====================
type ColDef = { key: keyof DetailPlayerStat; label: string; title: string };

const COLS: ColDef[] = [
  { key: "rating", label: "評価", title: "評価点" },
  { key: "minutes", label: "分", title: "出場時間" },
  { key: "goals", label: "G", title: "ゴール" },
  { key: "assists", label: "A", title: "アシスト" },
  { key: "xg", label: "xG", title: "ゴール期待値" },
  { key: "xa", label: "xA", title: "アシスト期待値" },
  { key: "shots", label: "S", title: "シュート" },
  { key: "shotsOnTarget", label: "枠内", title: "枠内シュート" },
  { key: "keyPasses", label: "KP", title: "キーパス" },
  { key: "passesAccurate", label: "パス", title: "パス成功" },
  { key: "touches", label: "タッチ", title: "ボールタッチ" },
  { key: "dribblesWon", label: "ドリブル", title: "ドリブル成功" },
  { key: "duelsWon", label: "デュエル", title: "デュエル勝利" },
  { key: "tacklesWon", label: "タックル", title: "タックル成功" },
  { key: "interceptions", label: "INT", title: "インターセプト" },
  { key: "clearances", label: "クリア", title: "クリア" },
  { key: "saves", label: "セーブ", title: "セーブ（GK）" },
];

export function PlayerStatsTable({ stats, homeTeam, awayTeam }: { stats: DetailPlayerStat[]; homeTeam: string; awayTeam: string }) {
  const [team, setTeam] = useState<"ALL" | "HOME" | "AWAY">("ALL");
  const [sortKey, setSortKey] = useState<keyof DetailPlayerStat>("rating");
  const [desc, setDesc] = useState(true);

  // 値が1つも無い列は出さない
  const cols = useMemo(() => COLS.filter((c) => stats.some((s) => num(s[c.key] as string | null) != null)), [stats]);
  const best = useMemo(() => {
    let b: DetailPlayerStat | null = null;
    for (const s of stats) if (num(s.rating) != null && (b == null || num(s.rating)! > num(b.rating)!)) b = s;
    return b;
  }, [stats]);

  const rows = useMemo(() => {
    const list = stats.filter((s) => team === "ALL" || (team === "HOME" ? isHome(s.side) : !isHome(s.side)));
    return [...list].sort((a, b) => {
      const va = sortKey === "name" ? null : num(a[sortKey] as string | null);
      const vb = sortKey === "name" ? null : num(b[sortKey] as string | null);
      if (sortKey === "name") return (a.name ?? "").localeCompare(b.name ?? "") * (desc ? -1 : 1);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      return desc ? vb - va : va - vb;
    });
  }, [stats, team, sortKey, desc]);

  if (stats.length === 0) return <Empty>選手スタッツのデータがありません</Empty>;

  const onSort = (k: keyof DetailPlayerStat) => {
    if (k === sortKey) setDesc(!desc);
    else {
      setSortKey(k);
      setDesc(true);
    }
  };
  const arrow = (k: keyof DetailPlayerStat) => (k === sortKey ? (desc ? "▼" : "▲") : "");

  return (
    <div>
      <div className="mb-2 inline-flex rounded-lg border p-0.5 text-[12px]">
        {(
          [
            ["ALL", "両チーム"],
            ["HOME", homeTeam],
            ["AWAY", awayTeam],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTeam(k)}
            className={`max-w-[9rem] truncate rounded-md px-2.5 py-1 ${team === k ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[640px] text-[12px]">
          <thead className="bg-muted/60 text-[11px] text-muted-foreground">
            <tr>
              <th className="sticky left-0 z-10 bg-muted px-2 py-1.5 text-left font-semibold">
                <button type="button" onClick={() => onSort("name")}>
                  選手 {arrow("name")}
                </button>
              </th>
              {cols.map((c) => (
                <th key={c.key} className="whitespace-nowrap px-1.5 py-1.5 text-right font-semibold" title={c.title}>
                  <button type="button" onClick={() => onSort(c.key)}>
                    {c.label}
                    {arrow(c.key)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((s, i) => (
              <tr key={`${s.playerId ?? s.name}-${i}`} className="hover:bg-muted/40">
                <td className="sticky left-0 z-10 max-w-[11rem] bg-card px-2 py-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${isHome(s.side) ? "bg-emerald-600" : "bg-violet-600 dark:bg-violet-500"}`} />
                    <span className="truncate font-semibold">{s.name}</span>
                    {best === s && (
                      <span className="shrink-0 text-amber-500" title="この試合の最高評価">
                        ★
                      </span>
                    )}
                  </div>
                  {s.position && <div className="pl-3.5 text-[10px] text-muted-foreground">{s.position}</div>}
                </td>
                {cols.map((c) => {
                  const raw = s[c.key] as string | null;
                  if (c.key === "rating") {
                    const r = num(raw);
                    return (
                      <td key={c.key} className="px-1.5 py-1 text-right">
                        {r != null ? <span className={`rounded px-1 font-mono text-[11px] font-bold ${ratingClass(r)}`}>{r.toFixed(1)}</span> : "-"}
                      </td>
                    );
                  }
                  return (
                    <td key={c.key} className="whitespace-nowrap px-1.5 py-1 text-right font-mono">
                      {raw ?? "-"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-1.5 text-[10px] text-muted-foreground">見出しを押すと並べ替えます。★はこの試合で評価点が一番高い選手です。</p>
    </div>
  );
}
