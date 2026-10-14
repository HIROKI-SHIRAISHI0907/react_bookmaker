/**
 * クリックするとその場で編集できるセル
 *   Enter / フォーカスアウトで確定、Esc で取り消し
 *   編集中かどうか・入力中の値は呼び出し側で持つ（表全体で1セルだけ編集する想定）
 */
type Props = {
  value: unknown;
  editing: boolean;
  editingValue: string;
  onStart: () => void;
  onChange: (v: string) => void;
  onCommit: () => void;
  onCancel: () => void;
  /** 表示時の最大幅（px） */
  maxWidth?: number;
  disabled?: boolean;
};

const toText = (v: unknown) => {
  if (v === null || v === undefined || v === "") return "-";
  if (typeof v === "boolean") return v ? "true" : "false";
  return String(v);
};

export default function ClickEditCell({ value, editing, editingValue, onStart, onChange, onCommit, onCancel, maxWidth = 160, disabled = false }: Props) {
  if (editing) {
    return (
      <input
        autoFocus
        value={editingValue}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onCommit}
        onKeyDown={(e) => {
          if (e.key === "Enter") onCommit();
          if (e.key === "Escape") onCancel();
        }}
        className="h-7 w-full min-w-[160px] rounded-md border border-indigo-400 bg-white px-2 text-[12.5px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      />
    );
  }

  const text = toText(value);
  return (
    <button
      type="button"
      onClick={onStart}
      disabled={disabled}
      title={text}
      className="block w-full rounded px-1 py-0.5 -mx-1 text-left text-[12.5px] text-gray-900 hover:bg-indigo-50 hover:ring-1 hover:ring-indigo-200 disabled:cursor-default disabled:hover:bg-transparent disabled:hover:ring-0"
    >
      <span className={`block truncate ${text === "-" ? "text-gray-300" : ""}`} style={{ maxWidth }}>
        {text}
      </span>
    </button>
  );
}
