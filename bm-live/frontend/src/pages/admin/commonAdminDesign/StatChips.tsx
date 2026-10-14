import { ReactNode } from "react";

/** 集計チップ（カードの代わりに1行で件数を並べる） */
export type StatChipTone = "default" | "ok" | "warn" | "ng" | "info";

export type StatChipItem = {
  label: string;
  value: ReactNode;
  tone?: StatChipTone;
};

const VALUE_TONE: Record<StatChipTone, string> = {
  default: "text-gray-900",
  ok: "text-emerald-700",
  warn: "text-amber-700",
  ng: "text-red-700",
  info: "text-indigo-700",
};

export const fmtNum = (n: number | null | undefined) => (n == null ? "-" : n.toLocaleString("ja-JP"));

export default function StatChips({ items, loading = false }: { items: StatChipItem[]; loading?: boolean }) {
  return (
    <div className="mb-2.5 flex flex-wrap gap-2">
      {items.map((it) => (
        <span key={it.label} className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-500">
          {it.label}
          <b className={`ml-1 text-[13px] tabular-nums ${VALUE_TONE[it.tone ?? "default"]}`}>{loading ? "…" : it.value}</b>
        </span>
      ))}
    </div>
  );
}
