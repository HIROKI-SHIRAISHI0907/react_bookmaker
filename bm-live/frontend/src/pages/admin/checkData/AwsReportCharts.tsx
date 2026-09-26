/**
 * 月次レポート用の SVG グラフ（PDF にそのまま載る、紙＝白背景前提）。
 *
 * - 1 グラフ 1 系列なので色は 1 色（カテゴリ色の 1 番: 青）。凡例は付けず、見出しで系列を示す
 * - 棒は細め・上端だけ丸め・ベースラインから立てる。目盛り線は薄く
 * - 「未集計の日」は 0 と区別して、ベースライン上の灰色の短い線で示す
 * - プレビュー時はマウスを乗せると値が出る（<title>）
 */

export const chart = {
  series: "#2a78d6",
  text: "#0b0b0b",
  text2: "#52514e",
  muted: "#8a8984",
  grid: "#e7e6e2",
  axis: "#c9c8c2",
  missing: "#c9c8c2",
  surface: "#ffffff",
};

const nf = new Intl.NumberFormat("ja-JP");
const fmt = (v: number) => nf.format(v);

/** 目盛り用に「きりのいい」最大値と刻み */
function niceScale(max: number, ticks = 4): { max: number; step: number } {
  if (max <= 0) return { max: 1, step: 1 };
  const raw = max / ticks;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  return { max: Math.ceil(max / step) * step, step };
}

/** 上端だけ丸めた棒のパス（ベースライン側は角） */
function barPath(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.max(0, Math.min(r, w / 2, h));
  return [`M${x},${y + h}`, `L${x},${y + rr}`, `Q${x},${y} ${x + rr},${y}`, `L${x + w - rr},${y}`, `Q${x + w},${y} ${x + w},${y + rr}`, `L${x + w},${y + h}`, "Z"].join(" ");
}

// =====================================================================
// 日別の棒グラフ（1 か月）
// =====================================================================

export function DailyBarChart({
  values,
  covered,
  days,
  unit = "回",
  width = 720,
  height = 220,
}: {
  values: number[];
  covered: boolean[];
  days: string[];
  unit?: string;
  width?: number;
  height?: number;
}) {
  const pad = { top: 22, right: 8, bottom: 26, left: 52 };
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;
  const n = values.length;
  const { max, step } = niceScale(Math.max(0, ...values));
  const slot = w / n;
  const gap = 2;
  const bw = Math.max(2, slot - gap * 2);
  const y = (v: number) => pad.top + h - (v / max) * h;

  // 直接ラベルは最大値の 1 本だけ
  let maxIdx = -1;
  values.forEach((v, i) => {
    if (covered[i] && (maxIdx < 0 || v > values[maxIdx])) maxIdx = i;
  });

  const ticks: number[] = [];
  for (let t = 0; t <= max + 1e-9; t += step) ticks.push(t);

  return (
    <svg width={width} height={height} role="img" aria-label="日別の件数" style={{ display: "block" }}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.left} x2={pad.left + w} y1={y(t)} y2={y(t)} stroke={t === 0 ? chart.axis : chart.grid} strokeWidth={1} />
          <text x={pad.left - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill={chart.text2}>
            {fmt(t)}
          </text>
        </g>
      ))}
      {values.map((v, i) => {
        const x = pad.left + i * slot + gap;
        const day = i + 1;
        const label = `${days[i]}: ${covered[i] ? `${fmt(v)}${unit}` : "未集計"}`;
        return (
          <g key={i}>
            <title>{label}</title>
            {/* ヒット領域は棒より広く */}
            <rect x={pad.left + i * slot} y={pad.top} width={slot} height={h} fill="transparent" />
            {covered[i] ? (
              v > 0 && <path d={barPath(x, y(v), bw, pad.top + h - y(v), 4)} fill={chart.series} />
            ) : (
              <line x1={x} x2={x + bw} y1={pad.top + h - 2} y2={pad.top + h - 2} stroke={chart.missing} strokeWidth={2} strokeDasharray="2 2" />
            )}
            {(day === 1 || day % 5 === 0) && (
              <text x={x + bw / 2} y={pad.top + h + 16} textAnchor="middle" fontSize={11} fill={chart.text2}>
                {day}
              </text>
            )}
          </g>
        );
      })}
      {maxIdx >= 0 && values[maxIdx] > 0 && (
        <text x={pad.left + maxIdx * slot + gap + bw / 2} y={y(values[maxIdx]) - 6} textAnchor="middle" fontSize={11} fontWeight={600} fill={chart.text}>
          {fmt(values[maxIdx])}
        </text>
      )}
    </svg>
  );
}

// =====================================================================
// 月別の合計（数本の棒・全本にラベル）
// =====================================================================

export function MonthlyBarChart({ items, highlight, width = 720, height = 190 }: { items: { month: string; total: number; dataDays: number }[]; highlight: string; width?: number; height?: number }) {
  const pad = { top: 22, right: 8, bottom: 30, left: 52 };
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;
  const { max, step } = niceScale(Math.max(0, ...items.map((i) => i.total)));
  const slot = w / Math.max(1, items.length);
  const bw = Math.min(56, slot - 16);
  const y = (v: number) => pad.top + h - (v / max) * h;
  const ticks: number[] = [];
  for (let t = 0; t <= max + 1e-9; t += step) ticks.push(t);

  return (
    <svg width={width} height={height} role="img" aria-label="月別の合計" style={{ display: "block" }}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.left} x2={pad.left + w} y1={y(t)} y2={y(t)} stroke={t === 0 ? chart.axis : chart.grid} />
          <text x={pad.left - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill={chart.text2}>
            {fmt(t)}
          </text>
        </g>
      ))}
      {items.map((it, i) => {
        const x = pad.left + i * slot + (slot - bw) / 2;
        const isCur = it.month === highlight;
        const noData = it.dataDays === 0;
        return (
          <g key={it.month}>
            <title>{`${it.month}: ${noData ? "データなし" : `${fmt(it.total)}回（${it.dataDays}日分）`}`}</title>
            {!noData && it.total > 0 && <path d={barPath(x, y(it.total), bw, pad.top + h - y(it.total), 4)} fill={chart.series} fillOpacity={isCur ? 1 : 0.45} />}
            <text x={x + bw / 2} y={noData ? pad.top + h - 6 : y(it.total) - 6} textAnchor="middle" fontSize={11} fontWeight={isCur ? 700 : 500} fill={noData ? chart.muted : chart.text}>
              {noData ? "—" : fmt(it.total)}
            </text>
            <text x={x + bw / 2} y={pad.top + h + 18} textAnchor="middle" fontSize={11} fontWeight={isCur ? 700 : 400} fill={isCur ? chart.text : chart.text2}>
              {it.month.replace("-", "/")}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// =====================================================================
// 折れ線（RDS スキーマ合計件数の推移）
// =====================================================================

export function LineChart({ values, days, width = 720, height = 190, unit = "件" }: { values: (number | null)[]; days: string[]; width?: number; height?: number; unit?: string }) {
  const pad = { top: 18, right: 16, bottom: 26, left: 72 };
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;
  const present = values.filter((v): v is number => v !== null);
  if (present.length === 0) return null;

  // 件数の推移なので 0 始まりにせず、最小〜最大をきりのいい目盛りで囲む
  const rawLo = Math.min(...present);
  const rawHi = Math.max(...present);
  const span = rawHi - rawLo || Math.max(1, Math.abs(rawHi) * 0.02);
  const { step } = niceScale(span, 3);
  const lo = Math.max(0, Math.floor((rawLo - span * 0.1) / step) * step);
  const hi = Math.ceil((rawHi + span * 0.1) / step) * step;
  const n = values.length;
  const x = (i: number) => pad.left + (n <= 1 ? w / 2 : (i / (n - 1)) * w);
  const y = (v: number) => pad.top + h - ((v - lo) / (hi - lo)) * h;

  // 欠けている日で線を切る
  const segments: string[] = [];
  let cur = "";
  values.forEach((v, i) => {
    if (v === null) {
      if (cur) segments.push(cur);
      cur = "";
    } else {
      cur += `${cur ? "L" : "M"}${x(i)},${y(v)} `;
    }
  });
  if (cur) segments.push(cur);

  const ticks: number[] = [];
  for (let t = lo; t <= hi + step / 1000; t += step) ticks.push(t);
  const lastIdx =
    values
      .map((v, i) => (v === null ? -1 : i))
      .filter((i) => i >= 0)
      .pop() ?? -1;

  return (
    <svg width={width} height={height} role="img" aria-label="件数の推移" style={{ display: "block" }}>
      {ticks.map((t, k) => (
        <g key={k}>
          <line x1={pad.left} x2={pad.left + w} y1={y(t)} y2={y(t)} stroke={chart.grid} />
          <text x={pad.left - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill={chart.text2}>
            {fmt(Math.round(t))}
          </text>
        </g>
      ))}
      {values.map((_, i) =>
        i === 0 || (i + 1) % 5 === 0 ? (
          <text key={i} x={x(i)} y={pad.top + h + 16} textAnchor="middle" fontSize={11} fill={chart.text2}>
            {i + 1}
          </text>
        ) : null,
      )}
      {segments.map((d, k) => (
        <path key={k} d={d} fill="none" stroke={chart.series} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      ))}
      {values.map((v, i) =>
        v === null ? null : (
          <g key={i}>
            <title>{`${days[i]}: ${fmt(v)}${unit}`}</title>
            <circle cx={x(i)} cy={y(v)} r={8} fill="transparent" />
            {(i === lastIdx || present.length <= 3) && <circle cx={x(i)} cy={y(v)} r={4} fill={chart.series} stroke={chart.surface} strokeWidth={2} />}
          </g>
        ),
      )}
      {lastIdx >= 0 && (
        <text x={x(lastIdx) - 6} y={y(values[lastIdx] as number) - 10} textAnchor="end" fontSize={11} fontWeight={600} fill={chart.text}>
          {fmt(values[lastIdx] as number)}
        </text>
      )}
    </svg>
  );
}

// =====================================================================
// 表の中の小さなグラフ
// =====================================================================

/** 日別の小さな棒（タスク定義別・関数別の行に添える） */
export function MiniBars({ values, width = 150, height = 24 }: { values: number[]; width?: number; height?: number }) {
  const max = Math.max(1, ...values);
  const slot = width / values.length;
  const bw = Math.max(1, slot - 1);
  return (
    <svg width={width} height={height} aria-hidden="true" style={{ display: "block" }}>
      <line x1={0} x2={width} y1={height - 0.5} y2={height - 0.5} stroke={chart.axis} />
      {values.map((v, i) => {
        const bh = (v / max) * (height - 2);
        return v > 0 ? <rect key={i} x={i * slot} y={height - 1 - bh} width={bw} height={bh} rx={1} fill={chart.series} /> : null;
      })}
    </svg>
  );
}

/** 件数推移の小さな線（RDS テーブルの行に添える） */
export function Sparkline({ values, width = 150, height = 24 }: { values: (number | null)[]; width?: number; height?: number }) {
  const present = values.filter((v): v is number => v !== null);
  if (present.length === 0) return <span style={{ color: chart.muted }}>—</span>;
  const lo = Math.min(...present);
  const hi = Math.max(...present);
  const n = values.length;
  const x = (i: number) => (n <= 1 ? width / 2 : (i / (n - 1)) * (width - 4) + 2);
  const y = (v: number) => (hi === lo ? height / 2 : height - 3 - ((v - lo) / (hi - lo)) * (height - 6));
  let d = "";
  let pen = false;
  values.forEach((v, i) => {
    if (v === null) {
      pen = false;
    } else {
      d += `${pen ? "L" : "M"}${x(i)},${y(v)} `;
      pen = true;
    }
  });
  const last = values
    .map((v, i) => (v === null ? -1 : i))
    .filter((i) => i >= 0)
    .pop() as number;
  return (
    <svg width={width} height={height} aria-hidden="true" style={{ display: "block" }}>
      <path d={d} fill="none" stroke={chart.series} strokeWidth={1.5} strokeLinejoin="round" />
      <circle cx={x(last)} cy={y(values[last] as number)} r={2.5} fill={chart.series} />
    </svg>
  );
}

/** 横棒（全体に対する割合） */
export function ShareBar({ value, max, width = 120 }: { value: number; max: number; width?: number }) {
  const w = max > 0 ? Math.max(value > 0 ? 2 : 0, (value / max) * width) : 0;
  return (
    <svg width={width} height={10} aria-hidden="true" style={{ display: "block" }}>
      <rect x={0} y={1} width={width} height={8} rx={4} fill={chart.grid} />
      {w > 0 && <rect x={0} y={1} width={w} height={8} rx={4} fill={chart.series} />}
    </svg>
  );
}

export const reportNumber = fmt;
