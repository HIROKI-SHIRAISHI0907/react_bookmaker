import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * ページ送り（page は 1 始まり）
 *   1 … 4 5 [6] 7 8 … 20 のように前後2ページを表示
 */
type Props = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  disabled?: boolean;
};

function pageItems(page: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set<number>([1, total, page - 2, page - 1, page, page + 1, page + 2]);
  const nums = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push("…");
    out.push(n);
  });
  return out;
}

const BTN = "inline-flex h-7 min-w-7 items-center justify-center rounded-md border px-1.5 text-xs font-bold tabular-nums transition-colors disabled:cursor-not-allowed disabled:opacity-40";

export default function ConsolePager({ page, totalPages, onChange, disabled = false }: Props) {
  if (totalPages <= 1) return null;
  const go = (p: number) => onChange(Math.min(Math.max(1, p), totalPages));
  return (
    <div className="flex items-center gap-1">
      <button type="button" className={`${BTN} border-gray-300 bg-white hover:bg-gray-50`} disabled={disabled || page <= 1} onClick={() => go(page - 1)} aria-label="前のページ">
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      {pageItems(page, totalPages).map((it, i) =>
        it === "…" ? (
          <span key={`e${i}`} className="px-1 text-xs text-gray-400">
            …
          </span>
        ) : (
          <button
            key={it}
            type="button"
            disabled={disabled}
            onClick={() => go(it)}
            className={`${BTN} ${it === page ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 bg-white hover:bg-gray-50"}`}
          >
            {it}
          </button>
        ),
      )}
      <button type="button" className={`${BTN} border-gray-300 bg-white hover:bg-gray-50`} disabled={disabled || page >= totalPages} onClick={() => go(page + 1)} aria-label="次のページ">
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
