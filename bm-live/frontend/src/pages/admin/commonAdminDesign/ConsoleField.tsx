import { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

/** 入力欄の共通見た目 */
const BASE =
  "h-8 rounded-lg border border-gray-300 bg-white px-2.5 text-[13px] text-gray-900 placeholder:text-gray-400 " +
  "focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-50 disabled:text-gray-400";

/** ラベル付きの入力欄の枠 */
export function ConsoleField({ label, hint, children, className = "" }: { label: ReactNode; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={`grid gap-1 text-[11px] font-bold text-gray-500 ${className}`}>
      <span>{label}</span>
      {children}
      {hint != null && <span className="text-[11px] font-normal text-gray-400">{hint}</span>}
    </label>
  );
}

export function ConsoleInput({ className = "", ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${BASE} ${className}`} {...rest} />;
}

export function ConsoleSelect({ className = "", children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${BASE} pr-7 ${className}`} {...rest}>
      {children}
    </select>
  );
}

export function ConsoleTextarea({ className = "", ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${BASE} h-auto py-1.5 ${className}`} {...rest} />;
}

/** 表の中で直接編集する小さな入力欄（変更ありは黄色） */
export function ConsoleCellInput({ dirty = false, className = "", ...rest }: InputHTMLAttributes<HTMLInputElement> & { dirty?: boolean }) {
  return (
    <input
      className={[
        "h-7 w-full min-w-[90px] rounded-md border px-2 text-[12.5px] text-gray-900",
        "focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100",
        dirty ? "border-amber-300 bg-amber-50" : "border-gray-200 bg-white hover:border-gray-300",
        className,
      ].join(" ")}
      {...rest}
    />
  );
}

/** チェックボックス + 文言 */
export function ConsoleCheck({ checked, onChange, children, disabled }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode; disabled?: boolean }) {
  return (
    <label className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-2.5 text-[13px] text-gray-900">
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="accent-indigo-600" />
      {children}
    </label>
  );
}
