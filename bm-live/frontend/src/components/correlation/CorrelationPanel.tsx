// frontend/src/components/correlation/CorrelationPanel.tsx
import React, { useEffect, useMemo, useState } from "react";

/** ===== Types ===== */
type CorrelationItem = { metric: string; value: number };

export type CorrelationsBySideScore = {
  HOME: { "1st": CorrelationItem[]; "2nd": CorrelationItem[]; ALL: CorrelationItem[] };
  AWAY: { "1st": CorrelationItem[]; "2nd": CorrelationItem[]; ALL: CorrelationItem[] };
};

type Props = {
  data: CorrelationsBySideScore;

  /** 追加: 対戦相手の候補（空/undefined ならプルダウン非表示） */
  opponents?: string[];
  /** 追加: 現在選択中（空文字は「全相手」扱い） */
  opponent?: string;
  /** 追加: 選択変更ハンドラ */
  onOpponentChange?: (next: string) => void;
};

/** ===== Small UI Parts ===== */
type SegmentedOption<T extends string> = { key: T; label: string; disabled?: boolean };
function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: SegmentedOption<T>[] }) {
  return (
    <div className="inline-flex rounded-xl border bg-zinc-50/70 dark:bg-zinc-800/50 p-1">
      {options.map((opt) => {
        const active = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => !opt.disabled && onChange(opt.key)}
            disabled={!!opt.disabled}
            className={[
              "px-3 py-1.5 text-sm rounded-lg transition",
              active ? "bg-white dark:bg-zinc-900 shadow-sm border" : "text-muted-foreground hover:bg-white/70 hover:dark:bg-zinc-900/60",
              opt.disabled ? "opacity-40 cursor-not-allowed" : "",
            ].join(" ")}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

type TabKey = "1st" | "2nd" | "ALL";
function Tabs({ value, onChange, options }: { value: TabKey; onChange: (v: TabKey) => void; options: { key: TabKey; label: string; disabled?: boolean }[] }) {
  return (
    <div className="inline-flex rounded-xl border bg-zinc-50/70 dark:bg-zinc-800/50 p-1">
      {options.map((opt) => {
        const active = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => !opt.disabled && onChange(opt.key)}
            disabled={!!opt.disabled}
            className={[
              "px-3 py-1.5 text-sm rounded-lg transition",
              active ? "bg-white dark:bg-zinc-900 shadow-sm border" : "text-muted-foreground hover:bg-white/70 hover:dark:bg-zinc-900/60",
              opt.disabled ? "opacity-40 cursor-not-allowed" : "",
            ].join(" ")}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/** ===== Helpers ===== */
const SCORE_ORDER: TabKey[] = ["1st", "2nd", "ALL"];

function hasAny(items?: CorrelationItem[] | null) {
  return !!(items && items.length > 0);
}

function prettyMetric(metric: string) {
  if (metric.startsWith("home")) return metric.replace(/^home/, "");
  if (metric.startsWith("away")) return metric.replace(/^away/, "");
  return metric;
}

function formatValue(v: number) {
  return v.toFixed(5);
}

/** ===== Main Panel ===== */
const CorrelationPanel: React.FC<Props> = ({ data, opponents, opponent = "", onOpponentChange }) => {
  // 初期値: HOME / 1st
  const [side, setSide] = useState<"HOME" | "AWAY">("HOME");
  const [score, setScore] = useState<TabKey>("1st");

  // サイド別にデータがあるか
  const hasSide = useMemo(
    () => ({
      HOME: hasAny(data?.HOME?.["1st"]) || hasAny(data?.HOME?.["2nd"]) || hasAny(data?.HOME?.ALL),
      AWAY: hasAny(data?.AWAY?.["1st"]) || hasAny(data?.AWAY?.["2nd"]) || hasAny(data?.AWAY?.ALL),
    }),
    [data]
  );

  // 初期サイドの自動補正（HOMEが空ならAWAYへ）
  useEffect(() => {
    if (side === "HOME" && !hasSide.HOME && hasSide.AWAY) {
      setSide("AWAY");
    } else if (side === "AWAY" && !hasSide.AWAY && hasSide.HOME) {
      setSide("HOME");
    }
  }, [hasSide.HOME, hasSide.AWAY, side]);

  // スコアタブの有効/無効
  const scoreEnabled = useMemo(() => {
    const s = side;
    return {
      "1st": hasAny(data?.[s]?.["1st"]),
      "2nd": hasAny(data?.[s]?.["2nd"]),
      ALL: hasAny(data?.[s]?.ALL),
    };
  }, [data, side]);

  // 選択中のスコアが空だったら、あるものにフォールバック
  useEffect(() => {
    if (!scoreEnabled[score]) {
      const next = SCORE_ORDER.find((k) => scoreEnabled[k]);
      if (next) setScore(next);
    }
  }, [scoreEnabled, score]);

  const items: CorrelationItem[] = useMemo(() => {
    const arr = data?.[side]?.[score] ?? [];
    return arr;
  }, [data, side, score]);

  const noAnyData = !hasSide.HOME && !hasSide.AWAY;
  const noItemsInSelection = !hasAny(items);
  const hasOpponentSelect = !!(opponents && opponents.length > 0);

  return (
    <div className="rounded-2xl border bg-white/70 dark:bg-zinc-900/40 backdrop-blur-sm p-4 shadow-sm">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {hasOpponentSelect && (
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">対戦相手</span>
            <select className="rounded-md border px-2 py-1 bg-background" value={opponent} onChange={(e) => onOpponentChange?.(e.target.value)}>
              <option value="">（全相手）</option>
              {opponents!.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        )}

        <Segmented
          value={side}
          onChange={(v) => setSide(v)}
          options={[
            { key: "HOME", label: "HOME", disabled: !hasSide.HOME },
            { key: "AWAY", label: "AWAY", disabled: !hasSide.AWAY },
          ]}
        />
        <Tabs
          value={score}
          onChange={(v) => setScore(v)}
          options={[
            { key: "1st", label: "1st", disabled: !scoreEnabled["1st"] },
            { key: "2nd", label: "2nd", disabled: !scoreEnabled["2nd"] },
            { key: "ALL", label: "ALL", disabled: !scoreEnabled.ALL },
          ]}
        />
      </div>

      {/* Content */}
      {noAnyData ? (
        <div className="text-muted-foreground">表示するデータがありません。</div>
      ) : noItemsInSelection ? (
        <div className="text-muted-foreground">表示するデータがありません。</div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50/70 dark:bg-zinc-800/50">
              <tr>
                <th className="text-left px-3 py-2 w-16">Rank</th>
                <th className="text-left px-3 py-2">Metric</th>
                <th className="text-right px-3 py-2 w-28">Corr</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => {
                const rank = idx + 1;
                const isTop3 = rank <= 3;
                return (
                  <tr key={`${it.metric}-${idx}`} className="odd:bg-white even:bg-zinc-50/40 dark:odd:bg-zinc-900/40 dark:even:bg-zinc-900/20">
                    <td className={`px-3 py-2 ${isTop3 ? "font-bold" : ""}`}>{rank}</td>
                    <td className={`px-3 py-2 ${isTop3 ? "font-bold" : ""}`}>
                      <span className="text-xs text-muted-foreground mr-1">{side === "HOME" ? "home" : "away"}</span>
                      {prettyMetric(it.metric)}
                    </td>
                    <td className={`px-3 py-2 text-right tabular-nums ${isTop3 ? "font-bold" : ""}`}>{formatValue(it.value)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CorrelationPanel;
