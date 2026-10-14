import { ReactNode } from "react";
import { X } from "lucide-react";

/** 結果・エラーなどのお知らせ（改行はそのまま表示） */
export type NoticeTone = "ok" | "warn" | "ng" | "info";

const TONE: Record<NoticeTone, string> = {
  ok: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warn: "border-amber-200 bg-amber-50 text-amber-800",
  ng: "border-red-200 bg-red-50 text-red-800",
  info: "border-indigo-200 bg-indigo-50 text-indigo-800",
};

type Props = {
  tone?: NoticeTone;
  title?: ReactNode;
  children?: ReactNode;
  onClose?: () => void;
  className?: string;
};

export default function ConsoleNotice({ tone = "info", title, children, onClose, className = "" }: Props) {
  return (
    <div className={`mb-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-[13px] ${TONE[tone]} ${className}`}>
      <div className="min-w-0 flex-1">
        {title != null && <div className="font-bold">{title}</div>}
        {children != null && <div className="max-h-60 overflow-auto whitespace-pre-wrap break-all text-xs leading-relaxed">{children}</div>}
      </div>
      {onClose && (
        <button type="button" onClick={onClose} className="shrink-0 rounded p-0.5 opacity-60 hover:opacity-100" aria-label="閉じる">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
