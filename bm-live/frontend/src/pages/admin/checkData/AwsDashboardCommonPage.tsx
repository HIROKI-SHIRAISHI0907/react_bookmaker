import React, { useMemo, useState } from "react";
import type { ApiState } from "../../../api/checkData";
import { fmtDate } from "../../../api/checkData";

/**
 * AWS ダッシュボード共通部品（カード・表・バッジ・棒グラフ）。
 * 管理画面（AdminLayout）の配色に合わせてインラインスタイルで書いている。
 */

export const colors = {
  text: "#111827",
  muted: "#6b7280",
  border: "#e5e7eb",
  surface: "#ffffff",
  surface2: "#f9fafb",
  accent: "#4f46e5",
  accentSoft: "#eef2ff",
  ok: "#047857",
  okSoft: "#d1fae5",
  warn: "#b45309",
  warnSoft: "#fef3c7",
  bad: "#b91c1c",
  badSoft: "#fee2e2",
};

const mono: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  fontSize: 12.5,
};

export function Mono({ children }: { children: React.ReactNode }) {
  return <span style={mono}>{children}</span>;
}

// =====================================================================
// ローディング / エラー / 本体 の切替
// =====================================================================

export function Panel<T>({ state, children }: { state: ApiState<T>; children: (data: T) => React.ReactNode }) {
  if (state.loading && !state.data) {
    return <div style={{ padding: "48px 0", textAlign: "center", color: colors.muted }}>取得中…</div>;
  }
  if (state.error) {
    return (
      <div
        role="alert"
        style={{
          background: colors.badSoft,
          border: `1px solid #fecaca`,
          borderRadius: 12,
          padding: 16,
          display: "grid",
          gap: 8,
        }}
      >
        <strong style={{ color: colors.bad }}>取得に失敗しました</strong>
        <span style={{ ...mono, wordBreak: "break-all" }}>{state.error}</span>
        <span style={{ color: colors.muted, fontSize: 12.5 }}>401/403 の場合はログイン状態、AccessDenied の場合はサーバーの IAM 権限を確認してください。</span>
      </div>
    );
  }
  if (!state.data) return null;
  return (
    <div style={{ opacity: state.loading ? 0.55 : 1, transition: "opacity .15s" }}>
      {children(state.data)}
      {state.fetchedAt && <div style={{ color: colors.muted, fontSize: 12, textAlign: "right", marginTop: 12 }}>取得: {fmtDate(state.fetchedAt)}</div>}
    </div>
  );
}

// =====================================================================
// 数値カード
// =====================================================================

export function StatRow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
        gap: 12,
        marginBottom: 20,
      }}
    >
      {children}
    </div>
  );
}

export function Stat({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "ok" | "bad" }) {
  const color = tone === "ok" ? colors.ok : tone === "bad" ? colors.bad : colors.text;
  return (
    <div
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        padding: "12px 14px",
      }}
    >
      <div style={{ color: colors.muted, fontSize: 12.5 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color, fontVariantNumeric: "tabular-nums", marginTop: 2 }}>{value}</div>
    </div>
  );
}

// =====================================================================
// セクション見出し
// =====================================================================

export function Section({ title, right, children }: { title: React.ReactNode; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 10,
          flexWrap: "wrap",
        }}
      >
        <h2 style={{ fontSize: 15, margin: 0, fontWeight: 700 }}>{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

export function Note({ children }: { children: React.ReactNode }) {
  return <span style={{ color: colors.muted, fontSize: 12.5 }}>{children}</span>;
}

// =====================================================================
// バッジ
// =====================================================================

export type Tone = "ok" | "warn" | "bad" | "neutral";

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: Tone }) {
  const map: Record<Tone, { bg: string; fg: string }> = {
    ok: { bg: colors.okSoft, fg: colors.ok },
    warn: { bg: colors.warnSoft, fg: colors.warn },
    bad: { bg: colors.badSoft, fg: colors.bad },
    neutral: { bg: "#f3f4f6", fg: colors.muted },
  };
  const c = map[tone];
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 11.5,
        padding: "1px 8px",
        borderRadius: 999,
        fontWeight: 700,
        whiteSpace: "nowrap",
        background: c.bg,
        color: c.fg,
      }}
    >
      {children}
    </span>
  );
}

// =====================================================================
// 並べ替え・絞り込み付きテーブル
// =====================================================================

export type Column<T> = {
  key: string;
  label: string;
  align?: "right";
  render?: (row: T) => React.ReactNode;
  /** 並べ替えに使う値（省略時は row[key]） */
  sortValue?: (row: T) => string | number | null | undefined;
};

type SortState = { key: string; dir: "asc" | "desc" } | null;

export function DataTable<T>({
  columns,
  rows,
  searchKeys,
  initialSort = null,
  empty = "データがありません",
  rowKey,
  onRowClick,
  selectedKey,
}: {
  columns: Column<T>[];
  rows: T[];
  searchKeys?: (keyof T)[];
  initialSort?: SortState;
  empty?: string;
  rowKey?: (row: T) => string;
  onRowClick?: (row: T) => void;
  selectedKey?: string | null;
}) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortState>(initialSort);

  const valueOf = (row: T, col: Column<T> | undefined, key: string): unknown => (col?.sortValue ? col.sortValue(row) : (row as Record<string, unknown>)[key]);

  const filtered = useMemo(() => {
    let out = rows ?? [];
    if (q && searchKeys && searchKeys.length > 0) {
      const needle = q.toLowerCase();
      out = out.filter((r) =>
        searchKeys.some((k) =>
          String(r[k] ?? "")
            .toLowerCase()
            .includes(needle),
        ),
      );
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      out = [...out].sort((a, b) => {
        const va = valueOf(a, col, sort.key);
        const vb = valueOf(b, col, sort.key);
        if (va === vb) return 0;
        if (va === null || va === undefined) return 1;
        if (vb === null || vb === undefined) return -1;
        const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb), "ja");
        return sort.dir === "asc" ? cmp : -cmp;
      });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, q, sort, columns, searchKeys]);

  const toggle = (key: string) => setSort((s) => (s && s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));

  const th: React.CSSProperties = {
    position: "sticky",
    top: 0,
    background: colors.surface2,
    padding: "8px 12px",
    borderBottom: `1px solid ${colors.border}`,
    fontSize: 12.5,
    fontWeight: 700,
    whiteSpace: "nowrap",
    zIndex: 1,
  };
  const td: React.CSSProperties = {
    padding: "8px 12px",
    borderBottom: `1px solid ${colors.border}`,
    verticalAlign: "top",
  };

  return (
    <div
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {searchKeys && searchKeys.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 12px",
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <input
            type="search"
            placeholder="絞り込み…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="テーブルを絞り込み"
            style={{
              width: 260,
              maxWidth: "100%",
              padding: "6px 10px",
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              font: "inherit",
            }}
          />
          <span style={{ color: colors.muted, fontSize: 12.5 }}>
            {filtered.length} / {rows?.length ?? 0} 件
          </span>
        </div>
      )}
      <div style={{ overflow: "auto", maxHeight: 560 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} style={{ ...th, textAlign: c.align === "right" ? "right" : "left" }}>
                  <button
                    type="button"
                    onClick={() => toggle(c.key)}
                    style={{
                      font: "inherit",
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      color: colors.text,
                    }}
                  >
                    {c.label}
                    <span style={{ display: "inline-block", width: 12, fontSize: 10, color: colors.accent }}>{sort?.key === c.key ? (sort.dir === "asc" ? "▲" : "▼") : ""}</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ ...td, textAlign: "center", color: colors.muted, padding: 24 }}>
                  {empty}
                </td>
              </tr>
            ) : (
              filtered.map((r, i) => {
                const key = rowKey ? rowKey(r) : String(i);
                const selected = selectedKey != null && selectedKey === key;
                return (
                  <tr
                    key={key}
                    onClick={onRowClick ? () => onRowClick(r) : undefined}
                    style={{
                      cursor: onRowClick ? "pointer" : undefined,
                      background: selected ? colors.accentSoft : undefined,
                    }}
                  >
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        style={{
                          ...td,
                          textAlign: c.align === "right" ? "right" : "left",
                          fontVariantNumeric: c.align === "right" ? "tabular-nums" : undefined,
                          whiteSpace: c.align === "right" ? "nowrap" : undefined,
                        }}
                      >
                        {c.render ? c.render(r) : String((r as Record<string, unknown>)[c.key] ?? "—")}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =====================================================================
// 時間帯別の棒グラフ（0〜23時）
// =====================================================================

export function HourlyBars({ values, unit = "回" }: { values: number[]; unit?: string }) {
  const max = Math.max(1, ...values);
  return (
    <div
      role="img"
      aria-label="時間帯別の件数"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(24, 1fr)",
        gap: 3,
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        padding: "12px 14px 8px",
      }}
    >
      {values.map((v, h) => (
        <div key={h} title={`${h}時台: ${v}${unit}`} style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ height: 16, fontSize: 10.5, textAlign: "center", color: colors.muted }}>{v > 0 ? v : ""}</div>
          <div style={{ height: 110, display: "flex", alignItems: "flex-end" }}>
            <div
              style={{
                width: "100%",
                height: `${(v / max) * 100}%`,
                background: colors.accent,
                borderRadius: "3px 3px 0 0",
              }}
            />
          </div>
          <div style={{ height: 16, marginTop: 4, fontSize: 10.5, textAlign: "center", color: colors.muted }}>{h % 3 === 0 ? h : ""}</div>
        </div>
      ))}
    </div>
  );
}

/** 小さめのトグルボタン */
export function SmallButton({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        font: "inherit",
        padding: "6px 12px",
        borderRadius: 8,
        cursor: "pointer",
        border: `1px solid ${active ? colors.accent : colors.border}`,
        background: active ? colors.accent : colors.surface,
        color: active ? "#fff" : colors.text,
      }}
    >
      {children}
    </button>
  );
}
