import { ReactNode } from "react";

/** タブ切替（すべて / 未対応 などの小さな切替） */
export type SegmentedOption<V extends string> = { value: V; label: ReactNode; count?: number };

type Props<V extends string> = {
  options: SegmentedOption<V>[];
  value: V;
  onChange: (v: V) => void;
  disabled?: boolean;
};

export default function SegmentedTabs<V extends string>({ options, value, onChange, disabled = false }: Props<V>) {
  return (
    <div className="inline-flex rounded-lg bg-gray-100 p-0.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className={[
              "inline-flex h-7 items-center gap-1 rounded-md px-2.5 text-xs font-bold transition-colors disabled:opacity-40",
              active ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900",
            ].join(" ")}
          >
            {o.label}
            {o.count != null && <span className={`tabular-nums ${active ? "text-indigo-600" : "text-gray-400"}`}>{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
