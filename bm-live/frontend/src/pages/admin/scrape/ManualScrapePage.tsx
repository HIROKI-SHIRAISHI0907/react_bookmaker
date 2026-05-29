import { useMutation, useQuery } from "@tanstack/react-query";
import React, { useEffect, useMemo, useState } from "react";

type StatExecuteRequest = {
  country?: string;
  league?: string;
  season?: string;
};

type StatExecuteResponse = {
  taskArn?: string;
  batchCd?: string;
};

type StatCountryLeagueOption = {
  country: string;
  leagues: string[];
};

type StatCountryLeagueOptionsResponse = {
  countries: StatCountryLeagueOption[];
};

type EcsRunRequest = {
  batchCd: string;
};

type EcsRunResponse = {
  taskArn?: string;
};

type ProgressRes = {
  taskId?: string;
  status?: "RUNNING" | "STOPPED" | "NOT_FOUND" | string;
  percent?: number | null;
  teamsDone?: number | null;
  teamsTotal?: number | null;
  logLine?: string | null;
  logTime?: string | null;
  message?: string | null;
};

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
const RUN_URL = `/v1/api/admin/scrape/ecs/run`;
const STAT_EACH_URL = `/v1/api/stat/each`;
const STAT_OPTIONS_URL = `/v1/api/admin/stat/options`;

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${text}`);
  }
  return res.json();
}

async function postJson<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: body != null ? { "Content-Type": "application/json" } : undefined,
    body: body != null ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${text}`);
  }
  return res.json();
}

/** ===================== UI（小さめ部品） ===================== */
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

function Button({
  children,
  onClick,
  disabled,
  loading,
  variant = "primary",
  title,
  className = "",
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger";
  title?: string;
  className?: string;
  type?: "button" | "submit";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-extrabold transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const v =
    variant === "primary"
      ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 focus:ring-blue-500"
      : variant === "danger"
        ? "bg-rose-600 text-white border-rose-600 hover:bg-rose-700 focus:ring-rose-500"
        : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50 focus:ring-gray-300";
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} title={title} className={`${base} ${v} ${className}`}>
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

function statusTone(status?: string): Tone {
  const s = (status ?? "").toUpperCase();
  if (s === "RUNNING") return "emerald";
  if (s === "STOPPED") return "gray";
  if (s === "NOT_FOUND") return "amber";
  if (!s) return "gray";
  return "blue";
}

function ConfirmModal(props: {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onClose: () => void;
  isLoading?: boolean;
  confirmDisabled?: boolean;
}) {
  const { open, title = "確認", message, confirmText = "OK", cancelText = "キャンセル", onConfirm, onClose, isLoading, confirmDisabled } = props;
  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" onClick={onClose} className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl border bg-white shadow-xl">
        <div className="px-5 py-4 border-b bg-gradient-to-r from-white to-gray-50 rounded-t-2xl">
          <div className="text-base font-extrabold text-gray-900">{title}</div>
        </div>

        <div className="p-5">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{message}</pre>

          <div className="mt-5 flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={onClose} disabled={isLoading}>
              {cancelText}
            </Button>
            <Button variant="primary" onClick={onConfirm} disabled={isLoading || confirmDisabled} loading={isLoading} title={confirmDisabled ? "条件を満たしていないため実行できません" : undefined}>
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** ===================== Page ===================== */
export default function ManualScrapePage() {
  const batchCodes = ["B002", "B003", "B004", "B005", "B007", "B008", "B009", "B010", "B014"];
  const [batchCode, setBatchCode] = useState(batchCodes[0]);

  const isB007 = batchCode === "B007";
  const isB014 = batchCode === "B014";

  const [lastTaskArn, setLastTaskArn] = useState<string | null>(null);

  // ===== B007 =====
  const [scope, setScope] = useState<S3PrefixScope>("DEFAULT");
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);

  // ===== B014 =====
  const [country, setCountry] = useState("");
  const [league, setLeague] = useState("");
  const [season, setSeason] = useState("");

  // ===== Progress =====
  const progressQuery = useQuery({
    queryKey: ["progress", batchCode],
    queryFn: () => getJson<ProgressRes>(`/v1/api/admin/scrape/ecs/${batchCode}/latest/progress`),
    refetchInterval: 5000,
  });

  const isRunning = useMemo(() => progressQuery.data?.status === "RUNNING", [progressQuery.data]);

  // ===== B014 options =====
  const statOptionsQuery = useQuery({
    queryKey: ["stat-country-league-options"],
    enabled: isB014,
    queryFn: () => getJson<StatCountryLeagueOptionsResponse>(STAT_OPTIONS_URL),
    staleTime: 5 * 60 * 1000,
  });

  const countryOptions = useMemo(() => statOptionsQuery.data?.countries ?? [], [statOptionsQuery.data]);

  const leagueOptions = useMemo(() => {
    const selected = countryOptions.find((x) => x.country === country);
    return selected?.leagues ?? [];
  }, [countryOptions, country]);

  useEffect(() => {
    if (!country) {
      setLeague("");
      return;
    }
    if (!leagueOptions.includes(league)) {
      setLeague("");
    }
  }, [country, leagueOptions, league]);

  useEffect(() => {
    if (!isB014) {
      setCountry("");
      setLeague("");
      setSeason("");
    }
    if (!isB007) {
      setIsMasterModalOpen(false);
    }
  }, [isB014, isB007]);

  const b014CanRun = !isB014 || (country.trim() !== "" && league.trim() !== "" && !statOptionsQuery.isLoading && !statOptionsQuery.isError);

  // ===== B007 request =====
  const countReq = useMemo<S3FileCountRequest>(
    () => ({
      batchCode,
      scope,
      day: null,
    }),
    [batchCode, scope],
  );

  const listReq = useMemo<S3FileListRequest>(
    () => ({
      batchCode,
      scope,
      limit: 100,
    }),
    [batchCode, scope],
  );

  const s3CountQuery = useQuery({
    queryKey: ["s3-file-count", countReq],
    enabled: isB007,
    queryFn: () => postJson<S3FileCountResponse>(COUNT_URL, countReq),
    refetchInterval: isB007 ? 15000 : false,
  });

  const s3ListQuery = useQuery({
    queryKey: ["s3-file-list", listReq],
    enabled: isB007,
    queryFn: () => postJson<S3FileListResponse>(LIST_URL, listReq),
    refetchInterval: isB007 ? 15000 : false,
  });

  const csvItems = useMemo(() => {
    const items = s3ListQuery.data?.items ?? [];
    return items.filter((it) => it.key.toLowerCase().endsWith(".csv"));
  }, [s3ListQuery.data]);

  const canRegisterMaster = isB007 && csvItems.length === 1;

  // ===== Run =====
  const runMutation = useMutation({
    mutationFn: async () => {
      if (isB014) {
        const body: StatExecuteRequest = {
          country: country.trim() || undefined,
          league: league.trim() || undefined,
          season: season.trim() || undefined,
        };
        return await postJson<StatExecuteResponse>(STAT_EACH_URL, body);
      }

      const body: EcsRunRequest = { batchCd: batchCode };
      return await postJson<EcsRunResponse>(RUN_URL, body);
    },
    onSuccess: async (res) => {
      setLastTaskArn(res?.taskArn ?? null);
      await progressQuery.refetch();
    },
  });

  const masterMutation = useMutation({
    mutationFn: async () => {
      await postJson(`/v1/api/admin/exec/task/all-league-scrape-master`, {});
    },
    onSuccess: async () => {
      setIsMasterModalOpen(false);
      await Promise.all([progressQuery.refetch(), s3CountQuery.refetch(), s3ListQuery.refetch()]);
    },
  });

  const busy = runMutation.isPending || masterMutation.isPending;

  const percent = progressQuery.data?.percent ?? null;
  const percentSafe = Math.min(100, Math.max(0, typeof percent === "number" ? percent : 0));

  const teamsDone = progressQuery.data?.teamsDone ?? null;
  const teamsTotal = progressQuery.data?.teamsTotal ?? null;

  const s3TotalText = typeof s3CountQuery.data?.totalCount === "number" ? s3CountQuery.data.totalCount.toLocaleString() : "-";
  const s3CountOnDayText = typeof s3CountQuery.data?.countOnDay === "number" ? s3CountQuery.data.countOnDay.toLocaleString() : "-";
  const s3ReturnedText = typeof s3ListQuery.data?.returnedCount === "number" ? s3ListQuery.data.returnedCount.toLocaleString() : "-";

  const runButtonDisabled = runMutation.isPending || isRunning || masterMutation.isPending || !b014CanRun;

  const runButtonTitle = isRunning
    ? "RUNNING中のため実行できません"
    : isB014 && statOptionsQuery.isLoading
      ? "B014 の選択肢を読み込み中です"
      : isB014 && statOptionsQuery.isError
        ? "B014 の選択肢取得に失敗しています"
        : isB014 && !country.trim()
          ? "B014 は国を選択してください"
          : isB014 && !league.trim()
            ? "B014 はリーグを選択してください"
            : undefined;

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
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">スクレイピング管理</h1>
              <p className="text-sm text-gray-600 mt-1">ECS起動（RUN）と進捗監視、B007はS3成果物からマスタ登録まで、B014は国・リーグ指定実行に対応</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge tone="blue">Batch {batchCode}</Badge>
            <Badge tone={statusTone(progressQuery.data?.status)}>{progressQuery.data?.status ?? "-"}</Badge>
            {busy ? <Badge tone="amber">処理中…</Badge> : <Badge tone="emerald">待機中</Badge>}
            {lastTaskArn ? <Badge tone="gray">lastTaskArn: {lastTaskArn}</Badge> : null}
          </div>
        </div>

        {/* Controls */}
        <Card className="p-6">
          <div className="flex items-start md:items-center justify-between gap-4 flex-col md:flex-row">
            <div>
              <div className="text-lg font-extrabold text-gray-900">操作</div>
              <div className="text-sm text-gray-600 mt-1">RUN/更新、B007はS3確認・マスタ登録、B014は国とリーグを指定して実行</div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => runMutation.mutate()} disabled={runButtonDisabled} loading={runMutation.isPending} title={runButtonTitle}>
                {isRunning ? "実行中" : "実行"}
              </Button>

              <Button variant="secondary" onClick={() => progressQuery.refetch()} disabled={progressQuery.isFetching || busy} loading={progressQuery.isFetching}>
                更新
              </Button>

              {isB007 ? (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      s3CountQuery.refetch();
                      s3ListQuery.refetch();
                    }}
                    disabled={busy || s3CountQuery.isFetching || s3ListQuery.isFetching}
                    loading={s3CountQuery.isFetching || s3ListQuery.isFetching}
                    title="S3のファイル状況を再取得します"
                  >
                    S3確認
                  </Button>

                  <Button
                    variant="danger"
                    onClick={() => setIsMasterModalOpen(true)}
                    disabled={busy || isRunning || !canRegisterMaster}
                    title={isRunning ? "RUNNING中はマスタ登録できません" : !canRegisterMaster ? "S3にcsvがちょうど1つ必要です" : undefined}
                  >
                    マスタ登録
                  </Button>
                </>
              ) : null}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
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

            {isB007 ? (
              <div className="grid gap-2">
                <label className="text-sm font-extrabold text-gray-900">Prefix scope（B007）</label>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value as S3PrefixScope)}
                  disabled={busy}
                  className="w-full px-4 py-3 rounded-xl border bg-white text-sm font-semibold hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="DEFAULT">json/（DEFAULT）</option>
                  <option value="ROOT">ルート（ROOT）</option>
                </select>
              </div>
            ) : (
              <div className="hidden md:block" />
            )}

            {isB007 ? (
              <div className="flex items-center gap-2 flex-wrap">
                <Badge tone={canRegisterMaster ? "emerald" : "rose"}>判定: {canRegisterMaster ? "OK（csv=1）" : `NG（csv=${csvItems.length}）`}</Badge>
                <Badge tone="gray">scope: {scope}</Badge>
              </div>
            ) : isB014 ? (
              <div className="flex items-center gap-2 flex-wrap">
                <Badge tone={country ? "blue" : "gray"}>country: {country || "-"}</Badge>
                <Badge tone={league ? "violet" : "gray"}>league: {league || "-"}</Badge>
                <Badge tone="gray">season: {season || "-"}</Badge>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <Badge tone="gray">progress poll: 5s</Badge>
              </div>
            )}
          </div>

          {isB014 ? (
            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-extrabold text-gray-900">Country</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  disabled={busy || statOptionsQuery.isLoading}
                  className="w-full px-4 py-3 rounded-xl border bg-white text-sm font-semibold hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">選択してください</option>
                  {countryOptions.map((c) => (
                    <option key={c.country} value={c.country}>
                      {c.country}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-extrabold text-gray-900">League</label>
                <select
                  value={league}
                  onChange={(e) => setLeague(e.target.value)}
                  disabled={busy || statOptionsQuery.isLoading || !country}
                  className="w-full px-4 py-3 rounded-xl border bg-white text-sm font-semibold hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">選択してください</option>
                  {leagueOptions.map((lg) => (
                    <option key={lg} value={lg}>
                      {lg}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-extrabold text-gray-900">Season（任意）</label>
                <input
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  disabled={busy}
                  placeholder="例: 2025"
                  className="w-full px-4 py-3 rounded-xl border bg-white text-sm font-semibold hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          ) : null}

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            {runMutation.isError ? <Alert type="error" title="起動エラー" message={(runMutation.error as Error).message} /> : null}
            {progressQuery.isError ? <Alert type="error" title="進捗取得エラー" message={(progressQuery.error as Error).message} /> : null}
            {masterMutation.isError ? <Alert type="error" title="マスタ登録エラー" message={(masterMutation.error as Error).message} /> : null}
          </div>

          {isB014 && statOptionsQuery.isError ? (
            <div className="mt-4">
              <Alert type="error" title="B014選択肢取得エラー" message={(statOptionsQuery.error as Error).message} />
            </div>
          ) : null}

          {isB014 && !statOptionsQuery.isLoading && !statOptionsQuery.isError && !countryOptions.length ? (
            <div className="mt-4">
              <Alert type="warning" title="B014選択肢なし" message="国・リーグの選択肢が取得できませんでした。マスタデータをご確認ください。" />
            </div>
          ) : null}

          {isB014 && !b014CanRun && !statOptionsQuery.isLoading && !statOptionsQuery.isError ? (
            <div className="mt-4">
              <Alert type="warning" title="B014の実行条件" message="B014を実行するには、国とリーグの両方を選択してください。" />
            </div>
          ) : null}
        </Card>

        {/* Progress */}
        <Card className="p-6">
          <div className="flex items-start md:items-center justify-between gap-4 flex-col md:flex-row">
            <div>
              <div className="text-lg font-extrabold text-gray-900">進捗</div>
              <div className="text-sm text-gray-600 mt-1">最新の進捗とログを表示します（5秒ごとに更新）</div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge tone={statusTone(progressQuery.data?.status)}>{progressQuery.data?.status ?? "-"}</Badge>
              <Badge tone="gray">task: {progressQuery.data?.taskId ?? "-"}</Badge>
              <Badge tone="gray">time: {progressQuery.data?.logTime ?? "-"}</Badge>
            </div>
          </div>

          <div className="mt-5">
            <div className="text-sm font-extrabold text-gray-900">Progress</div>
            <div className="mt-1 text-sm text-gray-700 font-semibold">
              {percent != null ? `${percent.toFixed(1)}% ${teamsDone != null && teamsTotal != null ? `(${teamsDone}/${teamsTotal})` : ""}` : (progressQuery.data?.message ?? "進捗情報なし")}
            </div>

            <div className="mt-3 h-3 rounded-full bg-gray-200 overflow-hidden">
              <div className="h-full bg-blue-600 transition-[width] duration-300" style={{ width: `${percentSafe}%` }} />
            </div>
          </div>

          {progressQuery.data?.logLine ? (
            <div className="mt-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-extrabold text-gray-900">Latest Log</div>
                <Button variant="secondary" className="px-3 py-2 text-xs" onClick={() => navigator.clipboard.writeText(String(progressQuery.data?.logLine ?? ""))}>
                  ログコピー
                </Button>
              </div>

              <pre className="mt-3 rounded-2xl border border-gray-900/10 bg-[#0b1020] text-gray-100 p-4 text-xs leading-relaxed whitespace-pre-wrap">{progressQuery.data.logLine}</pre>
            </div>
          ) : null}
        </Card>

        {/* S3 Panel（B007 only） */}
        {isB007 ? (
          <Card className="p-6">
            <div className="flex items-start md:items-center justify-between gap-4 flex-col md:flex-row">
              <div>
                <div className="text-lg font-extrabold text-gray-900">S3 成果物確認（B007）</div>
                <div className="text-sm text-gray-600 mt-1">prefix 配下の件数と list（最大100）を確認します</div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge tone="gray">{s3CountQuery.data?.bucket ?? "-"}</Badge>
                <Badge tone="gray">{s3CountQuery.data?.prefix ?? "-"}</Badge>
                <Badge tone="blue">recursive {String(s3CountQuery.data?.recursive ?? "-")}</Badge>
              </div>
            </div>

            {s3CountQuery.isError || s3ListQuery.isError ? (
              <div className="mt-4">
                <Alert type="error" title="S3取得エラー" message={((s3CountQuery.error as Error)?.message || (s3ListQuery.error as Error)?.message) ?? "unknown"} />
              </div>
            ) : null}

            <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="rounded-2xl border bg-gradient-to-br from-white to-gray-50 p-5">
                <div className="text-xs text-gray-600 font-semibold">Total（prefix配下）</div>
                <div className="mt-2 text-3xl font-extrabold text-gray-900">{s3TotalText}</div>
              </div>

              <div className="rounded-2xl border bg-gradient-to-br from-white to-amber-50 p-5">
                <div className="text-xs text-gray-600 font-semibold">指定日（countOnDay）</div>
                <div className="mt-2 text-3xl font-extrabold text-gray-900">{s3CountOnDayText}</div>
              </div>

              <div className="rounded-2xl border bg-gradient-to-br from-white to-blue-50 p-5">
                <div className="text-xs text-gray-600 font-semibold">CSV files</div>
                <div className="mt-2 text-3xl font-extrabold text-gray-900">{csvItems.length.toLocaleString()}</div>
              </div>

              <div className="rounded-2xl border bg-gradient-to-br from-white to-gray-50 p-5">
                <div className="text-xs text-gray-600 font-semibold">Returned（list）</div>
                <div className="mt-2 text-3xl font-extrabold text-gray-900">{s3ReturnedText}</div>
              </div>
            </div>

            {!canRegisterMaster ? (
              <div className="mt-4">
                <Alert type="warning" title="マスタ登録の条件" message={`マスタ登録するには、S3に csv がちょうど 1つ必要です（現在: ${csvItems.length}）。`} />
              </div>
            ) : null}

            {s3CountQuery.data?.message ? (
              <div className="mt-4 text-sm text-gray-700">
                <span className="font-extrabold">count message:</span> {s3CountQuery.data.message}
              </div>
            ) : null}

            {s3ListQuery.data?.message ? (
              <div className="mt-2 text-sm text-gray-700">
                <span className="font-extrabold">list message:</span> {s3ListQuery.data.message}
              </div>
            ) : null}

            <div className="mt-5 overflow-x-auto rounded-2xl border bg-white">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="text-left border-b bg-gray-50">
                    <th className="px-5 py-3 text-xs font-extrabold text-gray-600 min-w-[520px]">key</th>
                    <th className="px-5 py-3 text-xs font-extrabold text-gray-600 min-w-[140px]">size</th>
                    <th className="px-5 py-3 text-xs font-extrabold text-gray-600 min-w-[220px]">lastModifiedIso</th>
                  </tr>
                </thead>
                <tbody>
                  {(s3ListQuery.data?.items ?? []).map((it) => {
                    const isCsv = it.key.toLowerCase().endsWith(".csv");
                    return (
                      <tr key={it.key} className={`border-b hover:bg-gray-50 transition-colors ${isCsv ? "bg-blue-50/60" : ""}`}>
                        <td className="px-5 py-3 align-top">
                          <code className="text-xs font-semibold break-all">{it.key}</code>
                        </td>
                        <td className="px-5 py-3 align-top">{typeof it.size === "number" ? it.size.toLocaleString() : "-"}</td>
                        <td className="px-5 py-3 align-top">{it.lastModifiedIso ?? "-"}</td>
                      </tr>
                    );
                  })}
                  {(s3ListQuery.data?.items ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-5 py-6 text-sm text-gray-500">
                        ファイルがありません
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </Card>
        ) : null}

        {/* Confirm Modal */}
        <ConfirmModal
          open={isMasterModalOpen}
          title="マスタ登録"
          message={canRegisterMaster ? `マスタに登録しますか？\n対象CSV: ${csvItems[0]?.key ?? ""}` : `マスタ登録できません。\nS3に csv がちょうど 1つ必要です（現在: ${csvItems.length}）。`}
          onClose={() => {
            if (!masterMutation.isPending) setIsMasterModalOpen(false);
          }}
          onConfirm={() => masterMutation.mutate()}
          isLoading={masterMutation.isPending}
          confirmText="登録する"
          cancelText="やめる"
          confirmDisabled={!canRegisterMaster}
        />

        <div className="text-center text-xs text-gray-500">取得できない場合は、管理者権限・セッション（credentials: include）・API到達性をご確認ください。</div>
      </div>
    </div>
  );
}
