import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/**
 * 画面中央のモーダル（Esc・背景クリックで閉じる。busy の間は閉じない）
 *   footer に下部のボタン列を渡す
 */
type Props = {
  open: boolean;
  title: ReactNode;
  description?: ReactNode;
  onClose: () => void;
  busy?: boolean;
  footer?: ReactNode;
  children: ReactNode;
  width?: number;
};

export default function ConsoleModal({ open, title, description, onClose, busy = false, footer, children, width = 980 }: Props) {
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, busy, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-slate-900/40 p-3"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div className="flex max-h-[88vh] w-full flex-col overflow-hidden rounded-xl bg-white shadow-2xl" style={{ maxWidth: width }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 border-b border-gray-200 px-4 py-2.5">
          <div className="min-w-0 flex-1">
            <h2 className="m-0 text-[15px] font-bold text-gray-900">{title}</h2>
            {description != null && <p className="m-0 mt-0.5 text-xs text-gray-500">{description}</p>}
          </div>
          <button type="button" onClick={onClose} disabled={busy} className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40" aria-label="閉じる">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto px-4 py-3">{children}</div>
        {footer != null && <div className="flex flex-wrap items-center gap-2 border-t border-gray-200 px-4 py-2.5">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
