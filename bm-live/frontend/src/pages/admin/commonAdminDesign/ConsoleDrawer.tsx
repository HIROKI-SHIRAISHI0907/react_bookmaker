import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

/** 右から出る詳細パネル（Esc・背景クリックで閉じる） */
type Props = {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  actions?: ReactNode;
  children: ReactNode;
  width?: number;
};

export default function ConsoleDrawer({ open, title, onClose, actions, children, width = 720 }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex justify-end bg-slate-900/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="flex h-full flex-col bg-white shadow-2xl"
        style={{ width: `min(${width}px, 100%)` }}
      >
        <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-2.5">
          <h2 className="m-0 text-[15px] font-bold text-gray-900">{title}</h2>
          <div className="ml-auto flex items-center gap-1.5">
            {actions}
            <button type="button" onClick={onClose} className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900" aria-label="閉じる">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3">{children}</div>
      </div>
    </div>
  );
}
