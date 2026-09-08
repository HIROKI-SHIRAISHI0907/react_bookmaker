import React, { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "../../../components/ui/button";
import { Skeleton } from "../../../components/ui/skeleton";

/**
 * AWS利用料金ダウンロード画面。
 *
 * セキュリティ上の設計方針:
 * - AWSのアクセスキーID/シークレットアクセスキーは、この画面の React state
 *   (メモリ上)にのみ保持し、localStorage/sessionStorageや外部ストレージには
 *   一切保存しない(リロードすると消える)。
 * - サーバー側もこれらの認証情報を保存せず、リクエストの都度AWSへ渡すだけ。
 * - そのため「画面にログインさえすれば誰でも料金を見られる」状態にはならず、
 *   有効なAWS認証情報を持つ人だけが実際にデータを取得できる。
 * - 通信は必ずHTTPS環境で行うこと(社内プロキシ等でHTTP終端しない)。
 */

const API_BASE = "/v1/api/aws-cost";

type Granularity = "MONTHLY" | "DAILY";

type Credentials = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
};

type VerifyResponse = {
  valid: boolean;
  accountId?: string;
  arn?: string;
  userId?: string;
};

type ServiceCostItem = {
  serviceName: string;
  amount: string | number;
  unit: string;
};

type PeriodCost = {
  periodStart: string;
  periodEnd: string;
  amount: string | number;
  services: ServiceCostItem[];
};

type CostQueryResponse = {
  startDate: string;
  endDate: string;
  granularity: string;
  currency: string;
  totalAmount: string | number;
  servicesSummary: ServiceCostItem[];
  timeline: PeriodCost[];
};

function safeText(s: unknown): string {
  return typeof s === "string" ? s : "";
}

function toNumber(v: string | number | undefined | null): number {
  if (v === undefined || v === null) return 0;
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(v: string | number | undefined | null, currency?: string): string {
  const n = toNumber(v);
  const formatted = n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  return currency ? `${formatted} ${currency}` : formatted;
}

/** JSONレスポンス用。OK: json、NG: 本文を含めてthrow */
async function fetchJsonOrThrow(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const ct = res.headers.get("content-type") ?? "";
  const isJson = ct.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : await res.text().catch(() => "");

  if (!res.ok) {
    const bodyText = typeof body === "string" ? body : ((body as any)?.message ?? JSON.stringify(body));
    console.error(`[HTTP ${res.status}] ${url}`, body);
    throw new Error(bodyText || `HTTP ${res.status}`);
  }
  return body;
}

/** ファイルダウンロード用。OK: Blobとファイル名、NG: 本文を読んでthrow */
async function fetchFileOrThrow(url: string, init: RequestInit, fallbackFileName: string): Promise<{ blob: Blob; fileName: string }> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const ct = res.headers.get("content-type") ?? "";
    const body = ct.includes("application/json") ? await res.json().catch(() => null) : await res.text().catch(() => "");
    const message = typeof body === "string" ? body : ((body as any)?.message ?? `HTTP ${res.status}`);
    console.error(`[HTTP ${res.status}] ${url}`, body);
    throw new Error(message);
  }
  const disposition = res.headers.get("content-disposition") ?? "";
  const match = /filename\*=UTF-8''([^;]+)/.exec(disposition) ?? /filename="?([^";]+)"?/.exec(disposition);
  const fileName = match ? decodeURIComponent(match[1]) : fallbackFileName;
  const blob = await res.blob();
  return { blob, fileName };
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** ================= UI helpers(参考UIのスタイルに合わせた最小限のコンポーネント) ================= */
type Tone = "gray" | "blue" | "emerald" | "amber" | "rose" | "violet";

function Badge({ children, tone = "gray" }: { children: React.ReactNode; tone?: Tone }) {
  const cls: Record<Tone, string> = {
    gray: "bg-gray-100 text-gray-700 ring-gray-200",
    blue: "bg-blue-100 text-blue-800 ring-blue-200",
    emerald: "bg-emerald-100 text-emerald-800 ring-emerald-200",
    amber: "bg-amber-100 text-amber-900 ring-amber-200",
    rose: "bg-rose-100 text-rose-800 ring-rose-200",
    violet: "bg-violet-100 text-violet-800 ring-violet-200",
  };
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${cls[tone]}`}>{children}</span>;
}

function Panel({ title, desc, right, children }: { title: string; desc?: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white/80 backdrop-blur shadow-sm">
      <div className="px-5 py-4 border-b bg-gradient-to-r from-white to-gray-50 rounded-t-2xl">
        <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
          <div>
            <div className="text-base font-extrabold text-gray-900">{title}</div>
            {desc ? <div className="text-sm text-muted-foreground mt-1">{desc}</div> : null}
          </div>
          {right ? <div className="shrink-0">{right}</div> : null}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Alert({ type, title, message, onClose }: { type: "info" | "success" | "error"; title: string; message: string; onClose?: () => void }) {
  const cls = type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : type === "error" ? "border-rose-200 bg-rose-50 text-rose-900" : "border-blue-200 bg-blue-50 text-blue-900";
  const icon = type === "success" ? "✅" : type === "error" ? "❌" : "💡";

  return (
    <div className={`rounded-2xl border p-4 flex items-start gap-3 ${cls}`}>
      <div className="mt-0.5">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-extrabold">{title}</div>
        <pre className="mt-1 text-xs whitespace-pre-wrap leading-relaxed">{message}</pre>
      </div>
      {onClose ? (
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors">
          ✕
        </button>
      ) : null}
    </div>
  );
}

function defaultStartDate(): string {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

function defaultEndDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** ================= Page ================= */
export default function AwsCostPage() {
  // --- 認証情報(メモリ上のみ、リロードで消える) ---
  const [accessKeyId, setAccessKeyId] = useState("");
  const [secretAccessKey, setSecretAccessKey] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [verified, setVerified] = useState(false);
  const [identity, setIdentity] = useState<VerifyResponse | null>(null);

  // --- 検索条件 ---
  const [startDate, setStartDate] = useState(defaultStartDate());
  const [endDate, setEndDate] = useState(defaultEndDate());
  const [granularity, setGranularity] = useState<Granularity>("MONTHLY");

  const [result, setResult] = useState<CostQueryResponse | null>(null);
  const [toast, setToast] = useState<{ type: "info" | "success" | "error"; title: string; message: string } | null>(null);

  const credentials: Credentials = useMemo(() => ({ accessKeyId: accessKeyId.trim(), secretAccessKey, sessionToken: sessionToken.trim() }), [accessKeyId, secretAccessKey, sessionToken]);

  const canVerify = credentials.accessKeyId.length > 0 && credentials.secretAccessKey.length > 0;

  // --- Mutations ---
  const verifyMutation = useMutation({
    mutationFn: async () => {
      return (await fetchJsonOrThrow(`${API_BASE}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(credentials),
      })) as VerifyResponse;
    },
    onSuccess: (data) => {
      setVerified(true);
      setIdentity(data);
      setToast({ type: "success", title: "認証確認OK", message: `AWSアカウント ${data.accountId ?? ""} として認証されました。` });
    },
    onError: (e) => {
      setVerified(false);
      setIdentity(null);
      setToast({ type: "error", title: "認証に失敗しました", message: safeText((e as any)?.message) || "アクセスキー/シークレットキーを確認してください。" });
    },
  });

  const queryMutation = useMutation({
    mutationFn: async () => {
      return (await fetchJsonOrThrow(`${API_BASE}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...credentials, startDate, endDate, granularity, groupByService: true }),
      })) as CostQueryResponse;
    },
    onSuccess: (data) => {
      setResult(data);
      setToast({ type: "success", title: "取得完了", message: "AWS利用料金を取得しました。" });
    },
    onError: (e) => {
      setResult(null);
      setToast({ type: "error", title: "取得失敗", message: safeText((e as any)?.message) || "料金データの取得に失敗しました。" });
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async (kind: "csv" | "pdf") => {
      const { blob, fileName } = await fetchFileOrThrow(
        `${API_BASE}/download/${kind}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: kind === "csv" ? "text/csv" : "application/pdf" },
          body: JSON.stringify({ ...credentials, startDate, endDate, granularity, groupByService: true }),
        },
        `aws-cost.${kind}`,
      );
      triggerDownload(blob, fileName);
      return kind;
    },
    onSuccess: (kind) => {
      setToast({ type: "success", title: "ダウンロード完了", message: `${(kind as string).toUpperCase()} ファイルをダウンロードしました。` });
    },
    onError: (e) => {
      setToast({ type: "error", title: "ダウンロード失敗", message: safeText((e as any)?.message) || "ダウンロードに失敗しました。" });
    },
  });

  const handleClearCredentials = () => {
    setAccessKeyId("");
    setSecretAccessKey("");
    setSessionToken("");
    setVerified(false);
    setIdentity(null);
    setResult(null);
  };

  const canQuery = verified && startDate && endDate && startDate <= endDate;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-start md:items-center justify-between gap-4 flex-col md:flex-row">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-3 rounded-2xl shadow-lg">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-3.314 0-6 1.79-6 4s2.686 4 6 4 6-1.79 6-4-2.686-4-6-4zm0 0V4m0 12v4" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">AWS利用料金ダウンロード</h1>
              <p className="text-sm text-muted-foreground mt-1">AWSアクセスキーを入力して認証すると、期間・サービス別の利用料金を確認し、CSV/PDFでダウンロードできます。</p>
            </div>
          </div>

          {verified ? <Badge tone="emerald">認証済み: {identity?.accountId}</Badge> : <Badge tone="amber">未認証</Badge>}
        </div>

        {/* Toast */}
        {toast ? <Alert type={toast.type} title={toast.title} message={toast.message} onClose={() => setToast(null)} /> : null}

        {/* Step 1: 認証 */}
        <Panel
          title="① AWS認証情報の入力"
          desc="この画面はサーバー側に認証情報を保存しません。入力した内容はメモリ上にのみ保持され、ページを再読み込みすると消えます。"
          right={verified ? <Badge tone="emerald">認証済み</Badge> : <Badge tone="gray">未確認</Badge>}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-800">アクセスキーID</div>
              <input
                className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                value={accessKeyId}
                onChange={(e) => {
                  setAccessKeyId(e.target.value);
                  setVerified(false);
                }}
                placeholder="AKIAXXXXXXXXXXXXXXXX"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-800">シークレットアクセスキー</div>
              <input
                type="password"
                className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                value={secretAccessKey}
                onChange={(e) => {
                  setSecretAccessKey(e.target.value);
                  setVerified(false);
                }}
                placeholder="••••••••••••••••••••••••••••••••••••••••"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          </div>

          <div className="mt-3">
            <button type="button" className="text-xs text-blue-700 underline" onClick={() => setShowAdvanced((v) => !v)}>
              {showAdvanced ? "詳細設定を閉じる" : "詳細設定(STS一時認証情報を使う場合)"}
            </button>
            {showAdvanced ? (
              <div className="mt-2 space-y-2">
                <div className="text-sm font-semibold text-gray-800">セッショントークン(任意)</div>
                <input
                  className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                  value={sessionToken}
                  onChange={(e) => {
                    setSessionToken(e.target.value);
                    setVerified(false);
                  }}
                  placeholder="一時的な認証情報を使う場合のみ入力"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            ) : null}
          </div>

          <div className="mt-5 flex items-center gap-3 flex-wrap">
            <Button onClick={() => verifyMutation.mutate()} disabled={!canVerify || verifyMutation.isPending}>
              {verifyMutation.isPending ? "確認中..." : "認証を確認"}
            </Button>
            <Button variant="outline" onClick={handleClearCredentials} disabled={verifyMutation.isPending}>
              クリア
            </Button>
            {identity?.arn ? <div className="text-xs text-muted-foreground break-all">ARN: {identity.arn}</div> : null}
          </div>
        </Panel>

        {/* Step 2: 検索条件 & 結果(認証済みのときだけ表示) */}
        {verified ? (
          <Panel
            title="② 期間・粒度を指定して取得"
            desc="Cost Explorer APIの呼び出しには料金が発生します(1リクエストあたり少額)。連打しないようご注意ください。"
            right={
              <Button size="sm" onClick={() => queryMutation.mutate()} disabled={!canQuery || queryMutation.isPending}>
                {queryMutation.isPending ? "取得中..." : "取得"}
              </Button>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-800">開始日</div>
                <input
                  type="date"
                  className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-800">終了日(この日を含む)</div>
                <input
                  type="date"
                  className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-800">粒度</div>
                <select
                  className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={granularity}
                  onChange={(e) => setGranularity(e.target.value as Granularity)}
                >
                  <option value="MONTHLY">月別</option>
                  <option value="DAILY">日別</option>
                </select>
              </div>
            </div>

            {!canQuery && startDate > endDate ? <div className="mt-2 text-xs text-amber-700">終了日は開始日以降を指定してください。</div> : null}

            {queryMutation.isPending ? (
              <div className="mt-6 space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-2/3" />
              </div>
            ) : result ? (
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge tone="blue">
                    {result.startDate} 〜 {result.endDate}
                  </Badge>
                  <Badge tone="violet">{result.granularity === "DAILY" ? "日別" : "月別"}</Badge>
                  <Badge tone="emerald">合計 {formatMoney(result.totalAmount, result.currency)}</Badge>
                </div>

                <div>
                  <div className="text-sm font-bold text-gray-800 mb-2">サービス別内訳</div>
                  {result.servicesSummary.length === 0 ? (
                    <div className="text-sm text-muted-foreground">この期間の利用料金データはありません。</div>
                  ) : (
                    <div className="rounded-xl border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left px-3 py-2 font-semibold text-gray-700">サービス名</th>
                            <th className="text-right px-3 py-2 font-semibold text-gray-700">金額</th>
                            <th className="text-right px-3 py-2 font-semibold text-gray-700">比率</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.servicesSummary.map((svc) => {
                            const total = toNumber(result.totalAmount);
                            const ratio = total > 0 ? (toNumber(svc.amount) / total) * 100 : 0;
                            return (
                              <tr key={svc.serviceName} className="border-t">
                                <td className="px-3 py-2 text-gray-900">{svc.serviceName}</td>
                                <td className="px-3 py-2 text-right font-mono">{formatMoney(svc.amount, svc.unit)}</td>
                                <td className="px-3 py-2 text-right text-muted-foreground">{ratio.toFixed(1)}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 flex-wrap pt-2">
                  <Button variant="outline" onClick={() => downloadMutation.mutate("csv")} disabled={downloadMutation.isPending}>
                    {downloadMutation.isPending && downloadMutation.variables === "csv" ? "生成中..." : "CSVダウンロード"}
                  </Button>
                  <Button variant="outline" onClick={() => downloadMutation.mutate("pdf")} disabled={downloadMutation.isPending}>
                    {downloadMutation.isPending && downloadMutation.variables === "pdf" ? "生成中..." : "PDFダウンロード"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-6 text-sm text-muted-foreground">「取得」を押すとこの期間の利用料金を表示します。</div>
            )}
          </Panel>
        ) : (
          <Panel title="② 期間・粒度を指定して取得" desc="先にAWSアクセスキーの認証を完了してください。">
            <div className="text-sm text-muted-foreground">認証が完了すると、ここに期間指定と料金データが表示されます。</div>
          </Panel>
        )}
      </div>
    </div>
  );
}
