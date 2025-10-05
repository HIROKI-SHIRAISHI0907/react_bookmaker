// src/components/feature/TeamFeaturePanel.tsx
import React, { useMemo, useRef, useLayoutEffect, useState } from "react";
import { ScoreKey, SideKey, TeamStatsResponse } from "../../api/eachstats";
import { ResponsiveContainer, ComposedChart, XAxis, YAxis, Tooltip, Bar, Scatter, CartesianGrid, LabelList } from "recharts";

// 親要素の表示幅を監視して取得
function useContainerWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (cr?.width != null) setW(cr.width);
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

// ---- ラベル幅を測るユーティリティ（オフスクリーンCanvas使用）----
const measureText = (() => {
  let canvas: HTMLCanvasElement | null = null;
  return (text: string, font = "500 14px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial") => {
    if (!canvas) canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return text.length * 8; // フォールバック
    ctx.font = font;
    return ctx.measureText(text).width;
  };
})();

type Props = {
  data: TeamStatsResponse["stats"]; // ← normalize 済み（配列）
  metricsOrder?: string[];
};

const SCORE_PREF: ScoreKey[] = ["1st", "2nd", "ALL"];

function useControls(stats: Props["data"]) {
  const [side, setSide] = useState<SideKey>("HOME");

  // sideごとに存在するスコアキーを動的抽出
  const availableScores = useMemo<ScoreKey[]>(() => {
    const keys = Object.keys(stats?.[side] ?? {}) as ScoreKey[];
    // 1st,2nd,ALL を先頭に、それ以外は名前順
    const rest = keys.filter((k) => !SCORE_PREF.includes(k)).sort((a, b) => String(a).localeCompare(String(b), "ja"));
    return [...SCORE_PREF.filter((k) => keys.includes(k)), ...rest];
  }, [stats, side]);

  const firstScore = availableScores[0] ?? ("ALL" as ScoreKey);
  const [score, setScore] = useState<ScoreKey>(firstScore);

  // side変更時に score フォールバック
  React.useEffect(() => {
    if (!availableScores.includes(score)) {
      setScore(firstScore);
    }
  }, [availableScores.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps

  return { side, setSide, score, setScore, availableScores };
}

export default function TeamFeaturePanel({ data, metricsOrder }: Props) {
  const { side, setSide, score, setScore, availableScores } = useControls(data);
  const [hostRef, hostWidth] = useContainerWidth<HTMLDivElement>();

  const rows = useMemo(() => {
    const items = data?.[side]?.[score] ?? [];
    const sorted = metricsOrder ? [...items].sort((a, b) => metricsOrder.indexOf(a.metric) - metricsOrder.indexOf(b.metric)) : items;
    return sorted.map((it) => ({
      name: it.metric,
      min: it.min,
      avg: it.avg,
      max: it.max,
      variance: it.variance,
      skewness: it.skewness,
      kurtosis: it.kurtosis,
    }));
  }, [data, side, score, metricsOrder]);

  const chartData = rows.filter((r) => r.min !== null && r.max !== null && r.avg !== null);

  // ---- Y軸幅を“ちょうど”に（長いラベルを採寸）----
  const yAxisWidth = useMemo(() => {
    const longest = chartData.reduce((m, r) => (r.name.length > m.length ? r.name : m), "");
    const px = measureText(longest);
    // 文字の尻が切れないように少しだけ余裕（+10）
    return Math.min(200, Math.max(80, Math.ceil(px) + 10));
  }, [chartData]);

  // ーーー レイアウト計算（可変幅）ーーー
  const { chartWidth } = useMemo(() => {
    // Yラベルの最長文字数を測って幅を見積もり（1文字 ≒ 9〜10px 目安）
    const longestName = rows.reduce((m, r) => Math.max(m, r.name?.length ?? 0), 0);
    const yWidth = Math.min(320, Math.max(160, longestName * 10 + 28)); // 160〜320pxの範囲で可変

    // 棒の本数 × 1本あたりの必要高さから、横方向に必要な余白を見積もる
    // ここでは凡例・値ラベルなども考慮して固定分を足す
    const minContent = 320; // XAxis, 右側の余白など
    const base = 980; // これ以下なら横スクロールなしでも見やすい基準幅
    const dynamic = yWidth + minContent; // ラベル幅 + 右側余白
    const width = Math.max(base, dynamic);
    return { chartWidth: width, yAxisWidth: yWidth };
  }, [rows]);

  // ーーー 縦方向の高さをデータ数で自動調整 ーーー
  const chartHeight = useMemo(() => {
    const rowHeight = 34; // 1 指標あたりの縦ピッチ（ラベル+余白）
    const padding = 90; // X軸/余白ぶん
    // 最小高さを確保しつつ、件数に応じて増やす
    return Math.max(360, chartData.length * rowHeight + padding);
  }, [chartData.length]);

  return (
    <div className="rounded-2xl border bg-white/70 dark:bg-zinc-900/40 p-4 space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="inline-flex rounded-xl border bg-zinc-50/70 dark:bg-zinc-800/50 p-1">
          {(["HOME", "AWAY"] as SideKey[]).map((s) => (
            <button
              key={s}
              onClick={() => setSide(s)}
              className={[
                "px-3 py-1.5 text-sm rounded-lg transition",
                side === s ? "bg-white dark:bg-zinc-900 shadow-sm border" : "text-muted-foreground hover:bg-white/70 hover:dark:bg-zinc-900/60",
              ].join(" ")}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="inline-flex rounded-xl border bg-zinc-50/70 dark:bg-zinc-800/50 p-1">
          {availableScores.map((k) => (
            <button
              key={k}
              onClick={() => setScore(k)}
              className={[
                "px-3 py-1.5 text-sm rounded-lg transition",
                score === k ? "bg-white dark:bg-zinc-900 shadow-sm border" : "text-muted-foreground hover:bg-white/70 hover:dark:bg-zinc-900/60",
              ].join(" ")}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {/* 親幅 >= 計算幅 ならフルワイド、足りなければ横スクロール */}
      <div ref={hostRef} className="w-full overflow-x-auto">
        <div style={{ width: Math.max(chartWidth, hostWidth), height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart layout="vertical" data={chartData} margin={{ left: 0, right: 24, top: 12, bottom: 12 }}>
              <CartesianGrid strokeDasharray="3 3" />
              {/* 0〜100固定 */}
              <XAxis type="number" domain={[0, 100]} ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={yAxisWidth}
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                // 文字とプロットの隙間をさらに詰める
                tick={{ dx: -2 }}
                interval={0}
              />
              <Tooltip formatter={(v: any, k) => [v, k]} labelFormatter={(l) => l as string} />
              <Bar dataKey="max" barSize={12} opacity={0.15} />
              <Scatter dataKey="avg" shape="circle" />
              <LabelList dataKey="avg" position="right" formatter={(v: any) => (Number.isFinite(v) ? (v as number).toFixed(2) : "")} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50/70 dark:bg-zinc-800/50">
            <tr>
              <th className="text-left px-3 py-2">Metric</th>
              <th className="text-right px-3 py-2">Min</th>
              <th className="text-right px-3 py-2">Avg</th>
              <th className="text-right px-3 py-2">Max</th>
              <th className="text-right px-3 py-2">Var</th>
              <th className="text-right px-3 py-2">Skew</th>
              <th className="text-right px-3 py-2">Kurt</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="odd:bg-white even:bg-zinc-50/40 dark:odd:bg-zinc-900/40 dark:even:bg-zinc-900/20">
                <td className="px-3 py-2">{r.name}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.min ?? "-"}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.avg ?? "-"}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.max ?? "-"}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.variance ?? "-"}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.skewness ?? "-"}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.kurtosis ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
