import React, { useEffect, useMemo, useState } from "react";

/** ================= Types ================= */
type TableName = "FUTURE_MASTER" | "DATA";

type FutureMasterIngestSummaryDTO = {
  seq: number;
  gameTeamCategory: string | null;
  futureTime: string | null;
  homeTeamName: string | null;
  awayTeamName: string | null;
  gameLink: string | null;
  startFlg: string | null;
};

type DataIngestSummaryDTO = {
  seq: string;
  dataCategory: string | null;
  times: string | null;
  homeTeamName: string | null;
  awayTeamName: string | null;
  recordTime: string | null;
};

type IngestedRowDTO = {
  table: TableName;
  seq: string;
  registerTime: string; // OffsetDateTime ISO
  updateTime?: string | null;
  future?: FutureMasterIngestSummaryDTO | null;
  data?: DataIngestSummaryDTO | null;
};

type IngestedDataReferenceResponse = {
  from: string;
  to: string;
  rows: IngestedRowDTO[];
  total: number;
};

/** ================= Utils ================= */
function toDatetimeLocalValue(iso: string) {
  // ISO → datetime-local（秒落とし）
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function fromDatetimeLocalValue(v: string) {
  // datetime-local（ローカル）→ ISO（UTC）
  const d = new Date(v);
  return d.toISOString();
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDateTime(iso: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString();
}

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e ?? "unknown error");
}

/** ================= Small UI components (Tailwind) ================= */
type CardProps = { children: React.ReactNode; className?: string };
const Card = ({ children, className = "" }: CardProps) => <div className={`bg-white/90 backdrop-blur rounded-2xl shadow-sm border border-gray-100 ${className}`}>{children}</div>;

type BadgeTone = "gray" | "blue" | "emerald" | "amber" | "rose";
const Badge = ({ children, tone = "gray" }: { children: React.ReactNode; tone?: BadgeTone }) => {
  const classes: Record<BadgeTone, string> = {
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    emerald: "bg-emerald-100 text-emerald-800 border-emerald-200",
    amber: "bg-amber-100 text-amber-800 border-amber-200",
    rose: "bg-rose-100 text-rose-800 border-rose-200",
  };
  return <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${classes[tone]}`}>{children}</span>;
};

type ButtonVariant = "primary" | "secondary";
const Button = ({
  children,
  onClick,
  disabled,
  loading,
  variant = "primary",
  icon,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  icon?: React.ReactNode;
  className?: string;
}) => {
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white border-blue-600 focus:ring-blue-500",
    secondary: "bg-gray-50 hover:bg-gray-100 text-gray-900 border-gray-200 focus:ring-gray-300",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold
        transition-all duration-200 shadow-sm hover:shadow-md
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${variants[variant]}
        ${className}
      `}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {!loading && icon}
      {children}
    </button>
  );
};

const Input = ({ label, value, onChange, type = "text", className = "" }: { label: string; value: string; onChange: (v: string) => void; type?: React.HTMLInputTypeAttribute; className?: string }) => (
  <div className={className}>
    <label className="block text-sm font-semibold text-gray-800 mb-2">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="
        w-full px-4 py-3 rounded-xl border border-gray-200 bg-white
        transition-colors duration-200
        hover:border-gray-300
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
      "
    />
  </div>
);

type AlertType = "info" | "success" | "error" | "warning";
const Alert = ({ type, title, message, onClose }: { type: AlertType; title: string; message: string; onClose?: () => void }) => {
  const classes: Record<AlertType, string> = {
    info: "bg-blue-50 border-blue-200 text-blue-900",
    success: "bg-emerald-50 border-emerald-200 text-emerald-900",
    error: "bg-rose-50 border-rose-200 text-rose-900",
    warning: "bg-amber-50 border-amber-200 text-amber-900",
  };

  return (
    <div className={`border rounded-2xl p-4 flex gap-3 items-start ${classes[type]}`}>
      <div className="mt-0.5">
        {type === "info" && "💡"}
        {type === "success" && "✅"}
        {type === "error" && "❌"}
        {type === "warning" && "⚠️"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm">{title}</div>
        <pre className="mt-1 whitespace-pre-wrap text-xs leading-relaxed">{message}</pre>
      </div>
      {onClose && (
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors">
          ✕
        </button>
      )}
    </div>
  );
};

const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
  <label className="inline-flex items-center gap-2 select-none cursor-pointer">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
    <span className="text-sm font-semibold text-gray-800">{label}</span>
  </label>
);

/** ================= Page ================= */
export default function IngestedDataReferencePage() {
  // 初期：直近7日
  const now = useMemo(() => new Date(), []);
  const [fromLocal, setFromLocal] = useState(() => toDatetimeLocalValue(addDays(now, -7).toISOString()));
  const [toLocal, setToLocal] = useState(() => toDatetimeLocalValue(now.toISOString()));

  const [includeFuture, setIncludeFuture] = useState(true);
  const [includeData, setIncludeData] = useState(true);

  const [limit, setLimit] = useState(100);
  const [offset, setOffset] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [res, setRes] = useState<IngestedDataReferenceResponse | null>(null);

  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const canSearch = includeFuture || includeData;

  async function fetchRows(nextOffset: number) {
    if (!canSearch) return;

    // from <= to バリデーション
    const fromDate = new Date(fromLocal);
    const toDate = new Date(toLocal);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      setError("日時の形式が不正です。");
      return;
    }
    if (fromDate > toDate) {
      setError("From は To 以下にしてください。");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fromIso = fromDatetimeLocalValue(fromLocal);
      const toIso = fromDatetimeLocalValue(toLocal);

      const params = new URLSearchParams();
      params.set("from", fromIso);
      params.set("to", toIso);
      params.set("includeFutureMaster", String(includeFuture));
      params.set("includeData", String(includeData));
      params.set("limit", String(limit));
      params.set("offset", String(nextOffset));

      const r = await fetch(`/v1/api/admin/ingested?${params.toString()}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "include", // セッション運用なら便利。不要なら消してOK
      });

      if (!r.ok) {
        const txt = await r.text().catch(() => "");
        throw new Error(`HTTP ${r.status} ${r.statusText}${txt ? `: ${txt}` : ""}`);
      }

      const json = (await r.json()) as IngestedDataReferenceResponse;
      setRes(json);
      setOffset(nextOffset);
      setExpandedKey(null);
    } catch (e: unknown) {
      setError(getErrorMessage(e) || "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRows(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = res?.rows ?? [];
  const total = res?.total ?? 0;

  const page = Math.floor(offset / limit) + 1;
  const maxPage = Math.max(1, Math.ceil(total / limit));

  const selectedTables = useMemo(() => {
    const t: TableName[] = [];
    if (includeFuture) t.push("FUTURE_MASTER");
    if (includeData) t.push("DATA");
    return t;
  }, [includeFuture, includeData]);

  const preset = (days: number) => {
    const n = new Date();
    setToLocal(toDatetimeLocalValue(n.toISOString()));
    setFromLocal(toDatetimeLocalValue(addDays(n, -days).toISOString()));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start md:items-center justify-between gap-4 flex-col md:flex-row">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 rounded-2xl shadow-lg">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 00-4-4H3m6 6h12m0 0v-2a4 4 0 00-4-4h-2m6 6H9" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">投入済みデータ参照</h1>
              <p className="text-sm text-gray-600 mt-1">期間・テーブル条件で投入済みデータを追跡します（一覧クリックで詳細展開）</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge tone="blue">total: {total}</Badge>
            <Badge tone="gray">
              page: {page}/{maxPage}
            </Badge>
            {selectedTables.map((t) => (
              <Badge key={t} tone={t === "FUTURE_MASTER" ? "emerald" : "amber"}>
                {t}
              </Badge>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && <Alert type="error" title="エラー" message={error} onClose={() => setError(null)} />}

        {/* Search Panel */}
        <Card className="p-6">
          <div className="flex items-start md:items-center justify-between gap-4 flex-col md:flex-row">
            <div>
              <div className="text-lg font-extrabold text-gray-900">検索条件</div>
              <div className="text-sm text-gray-600 mt-1">
                From/To は <span className="font-semibold">ローカル日時入力</span> → APIへは ISO（UTC）で送信します
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button variant="secondary" onClick={() => preset(1)} disabled={loading} icon="🕐">
                24h
              </Button>
              <Button variant="secondary" onClick={() => preset(7)} disabled={loading} icon="📅">
                7d
              </Button>
              <Button variant="secondary" onClick={() => preset(30)} disabled={loading} icon="🗓️">
                30d
              </Button>
              <Button onClick={() => fetchRows(0)} disabled={loading || !canSearch} loading={loading} icon="🔍">
                検索
              </Button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="From" type="datetime-local" value={fromLocal} onChange={setFromLocal} />
            <Input label="To" type="datetime-local" value={toLocal} onChange={setToLocal} />
          </div>

          <div className="mt-5 flex items-center gap-4 flex-wrap">
            <Toggle checked={includeFuture} onChange={setIncludeFuture} label="FUTURE_MASTER" />
            <Toggle checked={includeData} onChange={setIncludeData} label="DATA" />

            <div className="ml-0 md:ml-auto flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800">limit</span>
              <select
                value={limit}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setLimit(v);
                  fetchRows(0);
                }}
                className="
                  px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold
                  hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                "
              >
                {[25, 50, 100, 200, 500].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!canSearch && (
            <div className="mt-4">
              <Alert type="warning" title="注意" message="テーブルを最低1つ選択してください。" />
            </div>
          )}
        </Card>

        {/* Table */}
        <Card className="p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
            <div className="font-extrabold text-gray-900">一覧（新しい順）</div>
            <div className="text-sm text-gray-500">
              offset: <span className="font-semibold text-gray-800">{offset}</span> / showing: <span className="font-semibold text-gray-800">{rows.length}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["table", "seq", "registerTime", "updateTime", "summary"].map((h) => (
                    <th key={h} className="text-left px-6 py-4 text-xs font-extrabold text-gray-600 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="px-6 py-4" colSpan={5}>
                          <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                        </td>
                      </tr>
                    ))}
                  </>
                )}

                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                      対象データがありません。
                    </td>
                  </tr>
                )}

                {!loading &&
                  rows.map((r) => {
                    const key = `${r.table}:${r.seq}:${r.registerTime}`;
                    const expanded = expandedKey === key;

                    const summary =
                      r.table === "FUTURE_MASTER"
                        ? `${r.future?.homeTeamName ?? "-"} vs ${r.future?.awayTeamName ?? "-"} / ${r.future?.gameTeamCategory ?? "-"}`
                        : `${r.data?.homeTeamName ?? "-"} vs ${r.data?.awayTeamName ?? "-"} / ${r.data?.dataCategory ?? "-"}`;

                    const tableTone: BadgeTone = r.table === "FUTURE_MASTER" ? "emerald" : "amber";

                    return (
                      <React.Fragment key={key}>
                        <tr
                          onClick={() => setExpandedKey(expanded ? null : key)}
                          className={`
                            border-b border-gray-100 cursor-pointer transition-colors
                            ${expanded ? "bg-blue-50/40" : "hover:bg-gray-50"}
                          `}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge tone={tableTone}>{r.table}</Badge>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <code className="text-xs font-semibold px-2 py-1 rounded-lg bg-white border border-gray-200">{r.seq}</code>
                              <Button
                                variant="secondary"
                                className="px-3 py-2 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(r.seq);
                                }}
                              >
                                コピー
                              </Button>
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{formatDateTime(r.registerTime)}</td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{r.updateTime ? formatDateTime(r.updateTime) : "-"}</td>

                          <td className="px-6 py-4 text-sm text-gray-800">
                            <div className="flex items-center justify-between gap-3">
                              <span className="min-w-0 truncate">{summary}</span>
                              <span className="text-xs text-gray-500">{expanded ? "▲" : "▼"}</span>
                            </div>
                          </td>
                        </tr>

                        {expanded && (
                          <tr className="border-b border-gray-100">
                            <td colSpan={5} className="px-6 py-5 bg-white">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                                  <div className="text-sm font-extrabold text-gray-900 mb-3">Meta</div>
                                  <div className="text-sm text-gray-800 space-y-1">
                                    <div>
                                      <span className="text-gray-500 text-xs">table</span> <span className="font-semibold">{r.table}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500 text-xs">seq</span> <span className="font-semibold">{r.seq}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500 text-xs">registerTime</span> <span className="font-semibold">{formatDateTime(r.registerTime)}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500 text-xs">updateTime</span> <span className="font-semibold">{r.updateTime ? formatDateTime(r.updateTime) : "-"}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                                  <div className="text-sm font-extrabold text-gray-900 mb-3">{r.table === "FUTURE_MASTER" ? "FUTURE_MASTER Summary" : "DATA Summary"}</div>

                                  {r.table === "FUTURE_MASTER" ? (
                                    <div className="text-sm text-gray-800 space-y-1">
                                      <div>
                                        <span className="text-gray-500 text-xs">gameTeamCategory</span> <span className="font-semibold">{r.future?.gameTeamCategory ?? "-"}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500 text-xs">futureTime</span> <span className="font-semibold">{r.future?.futureTime ?? "-"}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500 text-xs">home</span> <span className="font-semibold">{r.future?.homeTeamName ?? "-"}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500 text-xs">away</span> <span className="font-semibold">{r.future?.awayTeamName ?? "-"}</span>
                                      </div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-gray-500 text-xs">gameLink</span>
                                        <span className="font-semibold break-all">{r.future?.gameLink ?? "-"}</span>
                                        {r.future?.gameLink && (
                                          <Button
                                            variant="secondary"
                                            className="px-3 py-2 text-xs"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              navigator.clipboard.writeText(r.future!.gameLink!);
                                            }}
                                          >
                                            linkコピー
                                          </Button>
                                        )}
                                      </div>
                                      <div>
                                        <span className="text-gray-500 text-xs">startFlg</span> <span className="font-semibold">{r.future?.startFlg ?? "-"}</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-sm text-gray-800 space-y-1">
                                      <div>
                                        <span className="text-gray-500 text-xs">dataCategory</span> <span className="font-semibold">{r.data?.dataCategory ?? "-"}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500 text-xs">times</span> <span className="font-semibold">{r.data?.times ?? "-"}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500 text-xs">home</span> <span className="font-semibold">{r.data?.homeTeamName ?? "-"}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500 text-xs">away</span> <span className="font-semibold">{r.data?.awayTeamName ?? "-"}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500 text-xs">recordTime</span> <span className="font-semibold">{r.data?.recordTime ?? "-"}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="mt-4 text-xs text-gray-500">※ 行クリックで詳細を開閉します（コピー操作は行クリックを止めるようにしています）</div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 flex items-center justify-end gap-2 border-t border-gray-100">
            <Button variant="secondary" onClick={() => fetchRows(Math.max(0, offset - limit))} disabled={loading || offset <= 0} icon="⬅️">
              前へ
            </Button>
            <Button variant="secondary" onClick={() => fetchRows(offset + limit)} disabled={loading || offset + limit >= total} icon="➡️">
              次へ
            </Button>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">ブラウザで取得できない場合は、Spring側の CORS / 認証（credentials: include）/ 管理者権限をご確認ください。</div>
      </div>
    </div>
  );
}
