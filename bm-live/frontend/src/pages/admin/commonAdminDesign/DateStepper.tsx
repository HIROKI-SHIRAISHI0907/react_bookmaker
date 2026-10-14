import { ChevronLeft, ChevronRight } from "lucide-react";
import ConsoleButton from "./ConsoleButton";

/**
 * 日付入力（‹ 前日 / 日付 / 翌日 › / 今日）
 *   value / onChange は "YYYY-MM-DD"（ブラウザのローカル日付）
 */
type Props = {
  value: string;
  onChange: (next: string) => void;
  showToday?: boolean;
  disabled?: boolean;
};

const pad = (n: number) => String(n).padStart(2, "0");

export const formatYmd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const todayYmd = () => formatYmd(new Date());

export const shiftYmd = (ymd: string, days: number) => {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return todayYmd();
  return formatYmd(new Date(y, m - 1, d + days));
};

export default function DateStepper({ value, onChange, showToday = true, disabled = false }: Props) {
  const isToday = value === todayYmd();
  return (
    <div className="flex items-center gap-1">
      <ConsoleButton variant="ghost" size="md" aria-label="前日" disabled={disabled} onClick={() => onChange(shiftYmd(value, -1))}>
        <ChevronLeft className="h-4 w-4" />
      </ConsoleButton>
      <input
        type="date"
        value={value}
        disabled={disabled}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className="h-8 rounded-lg border border-gray-300 bg-white px-2.5 text-[13px] text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      />
      <ConsoleButton variant="ghost" size="md" aria-label="翌日" disabled={disabled} onClick={() => onChange(shiftYmd(value, 1))}>
        <ChevronRight className="h-4 w-4" />
      </ConsoleButton>
      {showToday && (
        <ConsoleButton disabled={disabled || isToday} onClick={() => onChange(todayYmd())}>
          今日
        </ConsoleButton>
      )}
    </div>
  );
}
