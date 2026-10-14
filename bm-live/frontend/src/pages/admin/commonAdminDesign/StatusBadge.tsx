import { ReactNode } from "react";

/** 状態バッジ（完了 / 未確認 / エラー など） */
export type BadgeTone = "ok" | "warn" | "ng" | "info" | "neutral";

const TONE: Record<BadgeTone, string> = {
  ok: "bg-emerald-50 text-emerald-700",
  warn: "bg-amber-50 text-amber-700",
  ng: "bg-red-50 text-red-700",
  info: "bg-indigo-50 text-indigo-700",
  neutral: "bg-gray-100 text-gray-600",
};

type Props = {
  tone?: BadgeTone;
  children: ReactNode;
  dot?: boolean;
};

export default function StatusBadge({ tone = "neutral", children, dot = true }: Props) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-px text-xs font-bold ${TONE[tone]}`}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/** "1" / true / 1 を完了とみなすフラグ用バッジ */
export function FlagBadge({
  value,
  onLabel = "完了",
  offLabel = "未確認",
}: {
  value: unknown;
  onLabel?: string;
  offLabel?: string;
}) {
  const on = value === true || value === 1 || String(value ?? "").trim() === "1";
  return <StatusBadge tone={on ? "ok" : "warn"}>{on ? onLabel : offLabel}</StatusBadge>;
}
