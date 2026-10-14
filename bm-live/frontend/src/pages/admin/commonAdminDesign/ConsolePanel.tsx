import { ReactNode } from "react";

/**
 * 枠付きのまとまり（見出し行 + 中身）
 *   title / right を省略すると見出し行は出さない
 */
type Props = {
  title?: ReactNode;
  info?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  /** 中身の余白を消す（表をそのまま入れるときなど） */
  flush?: boolean;
  className?: string;
};

export default function ConsolePanel({ title, info, right, children, flush = false, className = "" }: Props) {
  const hasHeader = title != null || right != null;
  return (
    <section className={`mb-3 rounded-xl border border-gray-200 bg-white ${className}`}>
      {hasHeader && (
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 px-3.5 py-2">
          {title != null && <h2 className="m-0 text-sm font-bold text-gray-900">{title}</h2>}
          {info != null && <span className="text-xs text-gray-500">{info}</span>}
          {right != null && <div className="ml-auto flex flex-wrap items-center gap-1.5">{right}</div>}
        </div>
      )}
      <div className={flush ? "" : "px-3.5 py-3"}>{children}</div>
    </section>
  );
}
