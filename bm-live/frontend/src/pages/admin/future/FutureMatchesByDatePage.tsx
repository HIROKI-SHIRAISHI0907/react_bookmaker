import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import { type BadgeTone, ConsoleButton, ConsoleColumn, ConsoleNotice, ConsoleTable, ConsoleToolbar, DateStepper, SegmentedTabs, StatChips, StatusBadge } from "../../../api/commonAdminDesign";

type FutureMatchSystemData = {
  finishedCount?: number;
  liveCount?: number;
};

type FutureMatchRealtimeData = {
  currentLiveCount?: number;
  lastUpdatedAt?: string | null;
  /** S3 の延期・遅延情報（delay_postpone_<日付>*.json）の status_type（延期 / 遅延）。該当しなければ null */
  delayStatusType?: string | null;
  /** 延期・遅延の元の文言（例: 延期 ミジョナリオス オンセ・カルダス - -） */
  delayStatusText?: string | null;
  /**
   * 画面に出す状態（バックエンドの RealtimeStatusResolver で決める）
   * 更新中 / 終了済 / 更新なし / 延期 / 中断 / 中止 / 遅延
   */
  status?: string | null;
  /** その状態になった理由（例: 試合開始から2時間30分を超えたため） */
  statusReason?: string | null;
};

type FutureMatch = {
  id?: string;
  seq?: number;
  gameTeamCategory?: string;
  futureTime?: string;
  homeTeam?: string;
  awayTeam?: string;
  link?: string;
  roundNo?: number;
  status?: string;
  systemData?: FutureMatchSystemData;
  realtimeData?: FutureMatchRealtimeData;
};

type FutureMatchesResponse = {
  date?: string;
  offset?: number;
  limit?: number;
  total?: number;
  matches?: FutureMatch[];
};

type ViewMode = "table" | "card";

async function fetchJsonStrict<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    credentials: "include",
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const contentType = response.headers.get("content-type") ?? "";
  const rawText = await response.text();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${rawText || response.statusText}`);
  }

  if (!contentType.includes("application/json")) {
    throw new Error(`JSON以外のレスポンスを受信しました: ${rawText.slice(0, 200)}`);
  }

  return JSON.parse(rawText) as T;
}

function toDisplay(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function getTodayJstString(): string {
  const now = new Date();
  const jst = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  const y = jst.getFullYear();
  const m = String(jst.getMonth() + 1).padStart(2, "0");
  const d = String(jst.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateTimeJst(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

function getSystemDataStatus(match: FutureMatch): { label: string; tone: BadgeTone } {
  const finished = match.systemData?.finishedCount ?? 0;
  const live = match.systemData?.liveCount ?? 0;

  if (finished > 0) return { label: "終了済", tone: "ok" };
  if (live > 0) return { label: "ライブ", tone: "ng" };
  return { label: "データなし", tone: "neutral" };
}

function getSystemDataCount(match: FutureMatch): number {
  const finished = match.systemData?.finishedCount ?? 0;
  const live = match.systemData?.liveCount ?? 0;
  return finished + live;
}

type RealtimeStatus = {
  label: string;
  tone: BadgeTone;
  /** 2行目に出す日時など */
  at: string | null;
  /** マウスを乗せたときに出す説明（延期・遅延の元の文言） */
  title?: string;
};

/** 状態ごとのバッジの色 */
const REALTIME_TONE: Record<string, BadgeTone> = {
  更新中: "ng",
  終了済: "ok",
  更新なし: "neutral",
  延期: "warn",
  中断: "warn",
  中止: "warn",
  遅延: "warn",
};

/**
 * リアルタイムデータの状態（日時は別に返して、表では2行目に出す）
 * 状態そのものはバックエンドで決めている（RealtimeStatusResolver）。
 *   1. 延期・中断・中止 … 時間に関係なくそのまま
 *   2. 試合開始から2時間30分を超えた … 強制的に終了済
 *   3. 最後の記録から40分以内 … 更新中
 *   4. 40分以上滞っている … 更新なし
 *   5. 記録が無く遅延の情報がある … 遅延
 *   6. それ以外 … 更新なし
 */
function getRealtimeDataStatus(match: FutureMatch): RealtimeStatus {
  const rt = match.realtimeData;
  const lastUpdatedAt = rt?.lastUpdatedAt;
  const status = rt?.status?.trim() || "更新なし";
  const tone = REALTIME_TONE[status] ?? "warn";

  // マウスオーバーの説明: 判定理由 ＋ 延期・遅延の元の文言
  const titleParts = [rt?.statusReason, rt?.delayStatusType ? `${rt.delayStatusType}: ${rt.delayStatusText ?? ""}` : null].filter((v): v is string => !!v && v.trim() !== "");
  const title = titleParts.length > 0 ? titleParts.join(" / ") : undefined;

  let at: string | null = null;
  if (lastUpdatedAt) {
    at = status === "更新中" ? `${formatDateTimeJst(lastUpdatedAt)} 更新` : `${formatDateTimeJst(lastUpdatedAt)} 最終更新`;
  }

  return { label: status, tone, at, title };
}

function getMatchKey(match: FutureMatch, index: number): string {
  return String(match.id ?? match.seq ?? `${match.gameTeamCategory ?? ""}-${match.homeTeam ?? ""}-${match.awayTeam ?? ""}-${match.futureTime ?? ""}-${index}`);
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const FUTURE_MATCHES_ENDPOINT = "/v1/api/future/admin/matches/date";
const PAGE_SIZE = 10;

const MatchLink: React.FC<{ href?: string; label?: string }> = ({ href, label = "開く" }) =>
  href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline">
      {label} <ExternalLink className="h-3 w-3" />
    </a>
  ) : (
    <span className="text-gray-300">-</span>
  );

/** リアルタイムデータのバッジ（延期・遅延の元の文言をマウスオーバーで出す） */
const RealtimeBadge: React.FC<{ status: RealtimeStatus }> = ({ status }) => (
  <span title={status.title} className={status.title ? "cursor-help" : undefined}>
    <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
  </span>
);

const FutureMatchesByDatePage: React.FC = () => {
  const [date, setDate] = useState(getTodayJstString());
  const [offset, setOffset] = useState(0);
  const [response, setResponse] = useState<FutureMatchesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const load = useCallback(async (targetDate: string, targetOffset: number) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        date: targetDate,
        offset: String(targetOffset),
      });

      const data = await fetchJsonStrict<FutureMatchesResponse>(`${API_BASE}${FUTURE_MATCHES_ENDPOINT}?${params.toString()}`, {
        method: "GET",
      });

      setResponse(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "試合予定データの取得に失敗しました。");
      setResponse(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(date, offset);
  }, [date, offset, load]);

  const matches = useMemo(() => response?.matches ?? [], [response]);
  const currentOffset = response?.offset ?? offset;
  const currentLimit = response?.limit ?? PAGE_SIZE;
  const currentPage = Math.floor(currentOffset / currentLimit) + 1;

  const canPrev = currentOffset > 0 && !loading;
  const canNext = matches.length >= currentLimit && !loading;

  const handleReload = () => {
    void load(date, offset);
  };

  const handleChangeDate = (nextDate: string) => {
    setDate(nextDate);
    setOffset(0);
  };

  const handlePrev = () => {
    if (!canPrev) return;
    setOffset((prev) => Math.max(0, prev - currentLimit));
  };

  const handleNext = () => {
    if (!canNext) return;
    setOffset((prev) => prev + currentLimit);
  };

  const columns: ConsoleColumn<FutureMatch>[] = [
    { key: "seq", header: "seq", mono: true, cell: (m) => <span className="text-gray-500">{toDisplay(m.seq)}</span> },
    { key: "category", header: "カテゴリ", wrap: true, className: "min-w-[200px]", cell: (m) => toDisplay(m.gameTeamCategory) },
    { key: "time", header: "試合開始日時", mono: true, cell: (m) => formatDateTimeJst(m.futureTime) },
    { key: "home", header: "ホーム", cell: (m) => toDisplay(m.homeTeam) },
    { key: "away", header: "アウェイ", cell: (m) => toDisplay(m.awayTeam) },
    {
      key: "system",
      header: "システムデータ",
      cell: (m) => {
        const s = getSystemDataStatus(m);
        return (
          <span className="inline-flex items-center gap-1.5">
            <StatusBadge tone={s.tone}>{s.label}</StatusBadge>
            <span className="text-xs tabular-nums text-gray-500">{getSystemDataCount(m)}件</span>
          </span>
        );
      },
    },
    {
      key: "realtime",
      header: "リアルタイムデータ",
      cell: (m) => {
        const s = getRealtimeDataStatus(m);
        return (
          <>
            <RealtimeBadge status={s} />
            {s.at && <div className="mt-0.5 font-mono text-[11px] text-gray-500">{s.at}</div>}
          </>
        );
      },
    },
    { key: "link", header: "リンク", cell: (m) => <MatchLink href={m.link} /> },
  ];

  const pager = (
    <>
      <span className="tabular-nums">
        {currentPage} ページ目（{matches.length}件 / 1ページ {currentLimit}件{response?.total != null ? ` / 全${response.total}件` : ""}）
      </span>
      <div className="flex gap-1.5">
        <ConsoleButton size="sm" onClick={handlePrev} disabled={!canPrev}>
          前へ
        </ConsoleButton>
        <ConsoleButton size="sm" onClick={handleNext} disabled={!canNext}>
          次へ
        </ConsoleButton>
      </div>
    </>
  );

  return (
    <div>
      <ConsoleToolbar title="指定日の試合予定一覧" info={`future_master・${PAGE_SIZE}件ずつ表示`}>
        <DateStepper value={date} onChange={handleChangeDate} disabled={loading} />
        <ConsoleButton variant="primary" onClick={handleReload} loading={loading}>
          {!loading && <RefreshCw className="h-3.5 w-3.5" />}
          再読み込み
        </ConsoleButton>
      </ConsoleToolbar>

      {error && (
        <ConsoleNotice tone="ng" onClose={() => setError(null)}>
          {error}
        </ConsoleNotice>
      )}

      <div className="flex flex-wrap items-start gap-2">
        <StatChips
          loading={loading && matches.length === 0}
          items={[
            { label: "対象日", value: toDisplay(response?.date ?? date) },
            { label: "ページ", value: currentPage },
            { label: "offset", value: currentOffset },
            { label: "表示件数", value: matches.length },
          ]}
        />
        <div className="ml-auto mb-2.5">
          <SegmentedTabs<ViewMode>
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: "table", label: "表" },
              { value: "card", label: "カード" },
            ]}
          />
        </div>
      </div>

      {viewMode === "table" ? (
        <ConsoleTable columns={columns} rows={matches} rowKey={getMatchKey} loading={loading} emptyText="対象データがありません。" footer={pager} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {matches.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-gray-400">{loading ? "読み込み中…" : "表示対象の試合がありません。"}</div>
          ) : (
            matches.map((match, index) => {
              const systemStatus = getSystemDataStatus(match);
              const realtimeStatus = getRealtimeDataStatus(match);
              return (
                <div key={getMatchKey(match, index)} className="grid grid-cols-[1fr_auto] gap-2 border-t border-gray-100 px-3 py-2.5 first:border-t-0">
                  <div className="min-w-0">
                    <div className="font-mono text-[11px] text-gray-500">
                      id: {toDisplay(match.id)} / seq: {toDisplay(match.seq)}
                    </div>
                    <div className="text-[14px] font-bold text-gray-900">
                      {toDisplay(match.homeTeam)} <span className="font-normal text-gray-400">vs</span> {toDisplay(match.awayTeam)}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {toDisplay(match.gameTeamCategory)} / round: {toDisplay(match.roundNo)}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-gray-500">システム</span>
                      <StatusBadge tone={systemStatus.tone}>{systemStatus.label}</StatusBadge>
                      <span className="tabular-nums text-gray-500">{getSystemDataCount(match)}件</span>
                      <span className="ml-2 text-gray-500">リアルタイム</span>
                      <RealtimeBadge status={realtimeStatus} />
                      {realtimeStatus.at && <span className="font-mono text-[11px] text-gray-500">{realtimeStatus.at}</span>}
                      {!realtimeStatus.at && realtimeStatus.title && <span className="text-[11px] text-amber-700">{realtimeStatus.title}</span>}
                    </div>
                  </div>
                  <div className="grid content-start justify-items-end gap-1">
                    <span className="font-mono text-xs text-gray-700">{formatDateTimeJst(match.futureTime)}</span>
                    <MatchLink href={match.link} label="試合ページ" />
                  </div>
                </div>
              );
            })
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 px-2.5 py-2 text-xs text-gray-500">{pager}</div>
        </div>
      )}
    </div>
  );
};

export default FutureMatchesByDatePage;
