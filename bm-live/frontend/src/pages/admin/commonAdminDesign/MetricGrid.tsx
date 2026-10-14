import { ReactNode } from "react";

/** ラベルと値を詰めて並べる（設定値・統計値の一覧） */
export type MetricItem = {
  label: ReactNode;
  value: ReactNode;
  tone?: "default" | "ok" | "warn" | "ng";
  mono?: boolean;
};

const TONE = {
  default: "text-gray-900",
  ok: "text-emerald-700",
  warn: "text-amber-700",
  ng: "text-red-700",
} as const;

export default function MetricGrid({ items, minWidth = 180 }: { items: MetricItem[]; minWidth?: number }) {
  return (
    <dl className="m-0 grid gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${minWidth}px, 1fr))` }}>
      {items.map((it, i) => (
        <div key={i} className="bg-white px-3 py-2">
          <dt className="truncate text-[11px] text-gray-500">{it.label}</dt>
          <dd className={`m-0 mt-0.5 break-all text-[15px] font-bold tabular-nums ${TONE[it.tone ?? "default"]} ${it.mono ? "font-mono text-[13px]" : ""}`}>{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** 詳細画面用: 左ラベル・右値の行 */
export function DetailRow({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-2 border-b border-gray-100 py-1.5 text-[12.5px]">
      <div className="text-gray-500">{label}</div>
      <div className="min-w-0 break-all text-gray-900">{children}</div>
    </div>
  );
}
