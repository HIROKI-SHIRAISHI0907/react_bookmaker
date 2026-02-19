import React, { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

type S3PrefixScope = "DEFAULT" | "ROOT" | "PARENT" | "CUSTOM";

type S3FileCountRequest = {
  batchCode: string;
  day?: string | null;
  scope?: S3PrefixScope | null;
  prefixOverride?: string | null;
};

type S3FileCountResponse = {
  batchCode?: string;
  bucket?: string | null;
  prefix?: string | null;
  recursive?: boolean | null;
  dayJst?: string | null;
  totalCount?: number | null;
  countOnDay?: number | null;
  message?: string | null;
};

type S3FileListRequest = {
  batchCode: string;
  scope?: S3PrefixScope | null;
  prefixOverride?: string | null;
  recursiveOverride?: boolean | null;
  limit?: number | null;
};

type S3FileListResponse = {
  batchCode: string;
  bucket: string;
  prefix: string;
  recursive: boolean;
  returnedCount: number;
  message: string;
  items: Array<{
    key: string;
    size: number;
    lastModifiedIso: string;
  }>;
};

const COUNT_URL = `/v1/api/admin/s3/files/count`;
const LIST_URL = `/v1/api/admin/s3/files/list`;

function defaultDate(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** ===== small UI ===== */
type Tone = "gray" | "blue" | "emerald" | "amber" | "rose";

function Badge({ children, tone = "gray" }: { children: React.ReactNode; tone?: Tone }) {
  const cls: Record<Tone, string> = {
    gray: "bg-gray-100 text-gray-700 ring-gray-200",
    blue: "bg-blue-100 text-blue-800 ring-blue-200",
    emerald: "bg-emerald-100 text-emerald-800 ring-emerald-200",
    amber: "bg-amber-100 text-amber-900 ring-amber-200",
    rose: "bg-rose-100 text-rose-800 ring-rose-200",
  };
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold ring-1 ring-inset ${cls[tone]}`}>{children}</span>;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border bg-white/85 backdrop-blur shadow-sm ${className}`}>{children}</div>;
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

function Btn({
  children,
  onClick,
  disabled,
  loading,
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-extrabold transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const v = variant === "primary" ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 focus:ring-blue-500" : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50 focus:ring-gray-300";

  return (
    <button onClick={onClick} disabled={disabled || loading} className={`${base} ${v}`}>
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}

function Alert({ type, title, message }: { type: "info" | "warning" | "error"; title: string; message: string }) {
  const cls = type === "error" ? "border-rose-200 bg-rose-50 text-rose-900" : type === "warning" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-blue-200 bg-blue-50 text-blue-900";

  const icon = type === "error" ? "❌" : type === "warning" ? "⚠️" : "💡";

  return (
    <div className={`rounded-2xl border p-4 flex items-start gap-3 ${cls}`}>
      <div className="mt-0.5">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-extrabold">{title}</div>
        <pre className="mt-1 text-xs whitespace-pre-wrap leading-relaxed">{message}</pre>
      </div>
    </div>
  );
}

/** ===== page ===== */
export default function S3FileCountPage() {
  const batchCodes = ["B002", "B003", "B004", "B005", "B006", "B008", "B009"];

  const [batchCode, setBatchCode] = useState(batchCodes[0]);
  const [scope, setScope] = useState<S3PrefixScope>("DEFAULT");
  const [useDate, setUseDate] = useState(true);
  const [day, setDay] = useState(defaultDate());

  const countReq = useMemo<S3FileCountRequest>(
    () => ({
      batchCode,
      scope,
      day: useDate ? day : null,
    }),
    [batchCode, scope, useDate, day],
  );

  const countQuery = useQuery({
    queryKey: ["s3-file-count", countReq],
    queryFn: async () => {
      const res = await fetch(COUNT_URL, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(countReq),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${text}`);
      }
      return (await res.json()) as S3FileCountResponse;
    },
  });

  const listMutation = useMutation({
    mutationFn: async () => {
      const listReq: S3FileListRequest = {
        batchCode,
        scope,
        limit: 100,
      };

      const res = await fetch(LIST_URL, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(listReq),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${text}`);
      }
      return (await res.json()) as S3FileListResponse;
    },
  });

  const totalCountText = typeof countQuery.data?.totalCount === "number" ? countQuery.data.totalCount.toLocaleString() : "-";
  const countOnDayText = typeof countQuery.data?.countOnDay === "number" ? countQuery.data.countOnDay.toLocaleString() : "-";

  const dayLabel = typeof countQuery.data?.dayJst === "string" && countQuery.data.dayJst ? `指定日（${countQuery.data.dayJst} / JST）` : "指定日";

  // ===== list 表示制限（描画は最大100件） =====
  const LIST_RENDER_LIMIT = 100;
  const listItems = listMutation.data?.items ?? [];

  const getTrailingNum = (key: string) => {
    const name = key.split("/").pop() ?? key;
    const m = name.match(/_(\d+)\.csv$/i);
    return m ? Number(m[1]) : Number.MAX_SAFE_INTEGER;
  };

  const sortedItems = useMemo(() => [...listItems].sort((a, b) => getTrailingNum(a.key) - getTrailingNum(b.key)), [listItems]);

  const isTruncatedForRender = sortedItems.length > LIST_RENDER_LIMIT;
  const renderItems = isTruncatedForRender ? sortedItems.slice(0, LIST_RENDER_LIMIT) : sortedItems;

  const busy = countQuery.isFetching || listMutation.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start md:items-center justify-between gap-4 flex-col md:flex-row">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-2xl shadow-lg">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">S3 フォルダ件数</h1>
              <p className="text-sm text-gray-600 mt-1">prefix 配下の総数と、指定日（JST）相当の件数を確認します。</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge tone="blue">Batch {batchCode}</Badge>
            <Badge tone="gray">Scope {scope}</Badge>
            {useDate ? <Badge tone="amber">{day}</Badge> : <Badge tone="gray">日付未指定</Badge>}
            {busy ? <Badge tone="amber">処理中…</Badge> : <Badge tone="emerald">待機中</Badge>}
          </div>
        </div>

        {/* Controls */}
        <Card className="p-6">
          <div className="flex items-start md:items-center justify-between gap-4 flex-col md:flex-row">
            <div>
              <div className="text-lg font-extrabold text-gray-900">条件</div>
              <div className="text-sm text-gray-600 mt-1">Batch / Prefix / 日付指定を切り替えて確認します</div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Btn variant="secondary" onClick={() => countQuery.refetch()} disabled={countQuery.isFetching} loading={countQuery.isFetching}>
                件数を更新
              </Btn>
              <Btn onClick={() => listMutation.mutate()} disabled={listMutation.isPending} loading={listMutation.isPending}>
                一覧を取得（最大100件）
              </Btn>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="grid gap-2">
              <label className="text-sm font-extrabold text-gray-900">Batch</label>
              <select
                value={batchCode}
                onChange={(e) => setBatchCode(e.target.value)}
                disabled={busy}
                className="w-full px-4 py-3 rounded-xl border bg-white text-sm font-semibold hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {batchCodes.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-extrabold text-gray-900">Prefix scope</label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as S3PrefixScope)}
                disabled={busy}
                className="w-full px-4 py-3 rounded-xl border bg-white text-sm font-semibold hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="DEFAULT">json/（DEFAULT）</option>
                <option value="ROOT">ルート（ROOT）</option>
                {/* 必要なら追加 */}
                {/* <option value="PARENT">PARENT</option> */}
                {/* <option value="CUSTOM">CUSTOM</option> */}
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-extrabold text-gray-900">日付指定</label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={useDate} onChange={(e) => setUseDate(e.target.checked)} disabled={busy} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-gray-700 font-semibold">未指定なら今日JST</span>
              </label>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-extrabold text-gray-900">day</label>
              <input
                type="date"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                disabled={!useDate || busy}
                className="w-full px-4 py-3 rounded-xl border bg-white text-sm font-semibold hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
            {countQuery.isError ? <Alert type="error" title="件数取得エラー" message={(countQuery.error as Error).message} /> : null}
            {listMutation.isError ? <Alert type="error" title="一覧取得エラー" message={(listMutation.error as Error).message} /> : null}
          </div>
        </Card>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-extrabold text-gray-900">Bucket</div>
              <Badge tone="gray">resolved</Badge>
            </div>
            <div className="mt-2 text-lg font-extrabold text-gray-900 break-all">{countQuery.data?.bucket ?? "-"}</div>
          </Card>

          <Card className="p-6 md:col-span-2">
            <div className="flex items-center justify-between gap-3 flex-col md:flex-row">
              <div className="w-full">
                <div className="text-sm font-extrabold text-gray-900">Prefix（解決後）</div>
                <div className="mt-2 text-sm font-semibold text-gray-800 break-all">
                  <code className="px-2 py-1 rounded-lg bg-gray-50 border border-gray-200">{countQuery.data?.prefix ?? "-"}</code>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Badge tone="blue">recursive: {String(countQuery.data?.recursive ?? "-")}</Badge>
                <Badge tone="gray">batch: {countQuery.data?.batchCode ?? batchCode}</Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Metrics */}
        <Card className="p-6">
          <div className="flex items-start md:items-center justify-between gap-4 flex-col md:flex-row">
            <div>
              <div className="text-lg font-extrabold text-gray-900">集計</div>
              <div className="text-sm text-gray-600 mt-1">Total は prefix 配下、指定日は day（JST）相当</div>
            </div>
            {countQuery.data?.message ? <Badge tone="blue">message</Badge> : <Badge tone="gray">no message</Badge>}
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border bg-gradient-to-br from-white to-gray-50 p-6">
              <div className="text-sm text-gray-600 font-semibold">Total（prefix配下）</div>
              <div className="mt-2 text-4xl font-extrabold text-gray-900">{totalCountText}</div>
            </div>

            <div className="rounded-2xl border bg-gradient-to-br from-white to-amber-50 p-6">
              <div className="text-sm text-gray-600 font-semibold">{dayLabel}</div>
              <div className="mt-2 text-4xl font-extrabold text-gray-900">{countOnDayText}</div>
            </div>
          </div>

          {countQuery.data?.message ? (
            <div className="mt-4 text-sm text-gray-700">
              <span className="font-extrabold">message:</span> {countQuery.data.message}
            </div>
          ) : null}
        </Card>

        {/* List */}
        {listMutation.data ? (
          <Card className="p-0 overflow-hidden">
            <div className="px-6 py-4 border-b bg-gradient-to-r from-white to-gray-50 flex items-start md:items-center justify-between gap-3 flex-col md:flex-row">
              <div>
                <div className="text-lg font-extrabold text-gray-900">一覧</div>
                <div className="text-sm text-gray-600 mt-1">
                  返却: <span className="font-extrabold">{listMutation.data.returnedCount.toLocaleString()}</span> 件 / limit=100
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge tone="gray">{listMutation.data.bucket}</Badge>
                <Badge tone="gray">{listMutation.data.prefix || "(root)"}</Badge>
                <Badge tone="blue">recursive {String(listMutation.data.recursive)}</Badge>
              </div>
            </div>

            {isTruncatedForRender ? (
              <div className="px-6 py-4">
                <Alert type="warning" title="表示制限" message={`表示負荷軽減のため、先頭 ${LIST_RENDER_LIMIT} 件のみ描画しています（実データ: ${listItems.length.toLocaleString()} 件）。`} />
              </div>
            ) : null}

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="text-left border-t border-b bg-gray-50">
                    <th className="px-6 py-3 text-xs font-extrabold text-gray-600 min-w-[520px]">key</th>
                    <th className="px-6 py-3 text-xs font-extrabold text-gray-600 min-w-[140px]">size</th>
                    <th className="px-6 py-3 text-xs font-extrabold text-gray-600 min-w-[220px]">lastModifiedIso</th>
                  </tr>
                </thead>

                <tbody>
                  {renderItems.map((it) => (
                    <tr key={it.key} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 align-top">
                        <code className="text-xs font-semibold break-all">{it.key}</code>
                      </td>
                      <td className="px-6 py-3 align-top">{typeof it.size === "number" ? it.size.toLocaleString() : "-"}</td>
                      <td className="px-6 py-3 align-top">{it.lastModifiedIso ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {listMutation.data.message ? (
              <div className="px-6 py-4 text-sm text-gray-700 border-t">
                <span className="font-extrabold">message:</span> {listMutation.data.message}
              </div>
            ) : null}
          </Card>
        ) : null}

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">取得できない場合は、管理者権限・セッション（credentials: include）・APIの到達性をご確認ください。</div>
      </div>
    </div>
  );
}
