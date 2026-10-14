import { ReactNode } from "react";
import ConsolePager from "./ConsolePager";

/**
 * 高密度テーブル（見出し固定・縞模様・等幅列・読み込み/エラー/0件表示・ページ送り付き）
 */
export type ConsoleColumn<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T, index: number) => ReactNode;
  /** ID・日時など等幅で出したい列 */
  mono?: boolean;
  /** 長い文字列を折り返す列（既定は折り返さない） */
  wrap?: boolean;
  align?: "left" | "center" | "right";
  className?: string;
  headerClassName?: string;
};

export type ConsolePaging = {
  page: number; // 1 始まり
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
};

type Props<T> = {
  columns: ConsoleColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string | number;
  loading?: boolean;
  error?: ReactNode;
  emptyText?: ReactNode;
  /** 総件数が分かるときのページ送り */
  paging?: ConsolePaging;
  /** 総件数が分からないときなど、表の下に自由に出す内容（paging より優先） */
  footer?: ReactNode;
  /** 表の高さ上限（見出し固定でスクロール）。例: "calc(100vh - 220px)" */
  maxHeight?: string;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
  /** 縞模様を消す（行の色で状態を表す表など） */
  plain?: boolean;
};

const ALIGN = { left: "text-left", center: "text-center", right: "text-right" } as const;

export default function ConsoleTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  error,
  emptyText = "データがありません",
  paging,
  footer,
  maxHeight,
  onRowClick,
  rowClassName,
  plain = false,
}: Props<T>) {
  const totalPages = paging ? Math.max(1, Math.ceil(paging.total / paging.pageSize)) : 1;
  const from = paging && paging.total > 0 ? (paging.page - 1) * paging.pageSize + 1 : 0;
  const to = paging ? Math.min(paging.page * paging.pageSize, paging.total) : rows.length;

  let body: ReactNode;
  if (error) {
    body = <Message tone="ng" colSpan={columns.length}>{error}</Message>;
  } else if (loading && rows.length === 0) {
    body = <Message colSpan={columns.length}>読み込み中…</Message>;
  } else if (rows.length === 0) {
    body = <Message colSpan={columns.length}>{emptyText}</Message>;
  } else {
    body = rows.map((row, i) => (
      <tr
        key={rowKey(row, i)}
        onClick={onRowClick ? () => onRowClick(row) : undefined}
        className={[
          plain ? "" : "even:bg-gray-50/60",
          onRowClick ? "cursor-pointer hover:bg-indigo-50/60" : "hover:bg-gray-50",
          rowClassName?.(row) ?? "",
        ].join(" ")}
      >
        {columns.map((c) => (
          <td
            key={c.key}
            className={[
              "border-t border-gray-100 px-2.5 py-1.5 align-top text-[12.5px] text-gray-900",
              c.wrap ? "whitespace-normal break-words" : "whitespace-nowrap",
              c.mono ? "font-mono text-[12px] tabular-nums" : "",
              ALIGN[c.align ?? "left"],
              c.className ?? "",
            ].join(" ")}
          >
            {c.cell(row, i)}
          </td>
        ))}
      </tr>
    ));
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="overflow-auto" style={maxHeight ? { maxHeight } : undefined}>
        <table className={`w-full border-collapse ${loading && rows.length > 0 ? "opacity-60" : ""}`}>
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={[
                    "sticky top-0 z-[1] whitespace-nowrap bg-gray-100 px-2.5 py-1.5 text-[11px] font-bold tracking-wide text-gray-500",
                    ALIGN[c.align ?? "left"],
                    c.headerClassName ?? "",
                  ].join(" ")}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{body}</tbody>
        </table>
      </div>
      {footer != null ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 px-2.5 py-2 text-xs text-gray-500">{footer}</div>
      ) : (
        paging && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 px-2.5 py-2 text-xs text-gray-500">
            <span className="tabular-nums">
              {paging.total.toLocaleString("ja-JP")} 件中 {from.toLocaleString("ja-JP")}–{to.toLocaleString("ja-JP")} 件
            </span>
            <ConsolePager page={paging.page} totalPages={totalPages} onChange={paging.onChange} disabled={loading} />
          </div>
        )
      )}
    </div>
  );
}

function Message({ children, colSpan, tone }: { children: ReactNode; colSpan: number; tone?: "ng" }) {
  return (
    <tr>
      <td colSpan={colSpan} className={`whitespace-pre-wrap px-4 py-10 text-center text-sm ${tone === "ng" ? "text-red-700" : "text-gray-400"}`}>
        {children}
      </td>
    </tr>
  );
}
