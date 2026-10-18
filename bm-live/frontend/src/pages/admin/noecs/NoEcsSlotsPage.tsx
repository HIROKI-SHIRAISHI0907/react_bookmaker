import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import {
  BadgeTone,
  ConsoleButton,
  ConsoleColumn,
  ConsoleInput,
  ConsoleNotice,
  ConsolePanel,
  ConsoleTable,
  ConsoleToolbar,
  MetricGrid,
  SegmentedTabs,
  StatChips,
  StatusBadge,
} from "../../../api/commonAdminDesign";

type EcsStopInterval = {
  start?: string;
  end?: string;
};

type NoEcsGame = {
  category?: string;
  home?: string;
  away?: string;
  start?: string;
  busy_end?: string;
  url?: string;
};

type RuntimeNote = {
  when_checking_runtime_after_22?: boolean;
  recommended_related_json_dates?: string[];
};

type NoEcsSlotsBody = {
  generated_at?: string;
  timezone?: string;
  today_flg?: boolean;
  target_day?: string;
  target_date?: string;
  min_gap_minutes?: number;
  match_duration_minutes?: number;
  match_delay_buffer_minutes?: number;
  match_busy_minutes?: number;
  post_match_buffer_minutes?: number;
  pre_match_buffer_minutes?: number;
  last_match_buffer_minutes?: number;
  target_leagues_count?: number;
  calculation_window_start?: string;
  calculation_window_end?: string;
  ecs_stop_intervals?: EcsStopInterval[];
  matched_games_count?: number;
  matched_game_start_times?: string[];
  matched_games?: NoEcsGame[];
  prev_day_overlap_games_count?: number;
  prev_day_overlap_games?: NoEcsGame[];
  next_day_lookahead_games_count?: number;
  next_day_lookahead_games?: NoEcsGame[];
  runtime_note?: RuntimeNote;
};

type NoEcsSlotsResponse = {
  bucket?: string;
  key?: string;
  fileName?: string;
  body?: NoEcsSlotsBody;
  message?: string;
};

type GameTabType = "matched" | "nextDay" | "prevDay";
type TimeState = "before" | "active" | "after" | "unknown";

/** 状態 → バッジの色（停止中 / BUSY中は赤、開始前は青、終了後は緑） */
const STATE_TONE: Record<TimeState, BadgeTone> = { active: "ng", before: "info", after: "ok", unknown: "neutral" };

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

function formatDateTimeJst(value?: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

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

function formatShortDateTimeJst(value?: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

function formatDiff(ms: number): string {
  const abs = Math.abs(ms);
  const totalSeconds = Math.floor(abs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getIntervalStatus(interval: EcsStopInterval, now: Date): { label: string; remaining: string; state: TimeState } {
  const start = interval.start ? new Date(interval.start) : null;
  const end = interval.end ? new Date(interval.end) : null;

  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { label: "判定不可", remaining: "-", state: "unknown" };
  }

  if (now < start) {
    return { label: "停止開始まで", remaining: formatDiff(start.getTime() - now.getTime()), state: "before" };
  }

  if (now >= start && now < end) {
    return { label: "停止終了まで", remaining: formatDiff(end.getTime() - now.getTime()), state: "active" };
  }

  return { label: "停止終了後", remaining: formatDiff(now.getTime() - end.getTime()), state: "after" };
}

function getGlobalEcsStatus(body: NoEcsSlotsBody | undefined, now: Date) {
  const intervals = body?.ecs_stop_intervals ?? [];
  const validIntervals = intervals
    .map((v) => ({
      start: v.start ? new Date(v.start) : null,
      end: v.end ? new Date(v.end) : null,
      raw: v,
    }))
    .filter((v) => v.start && v.end && !Number.isNaN(v.start.getTime()) && !Number.isNaN(v.end.getTime()));

  const active = validIntervals.find((v) => now >= (v.start as Date) && now < (v.end as Date));

  if (active) {
    return {
      status: "STOPPED" as const,
      label: "いま ECS停止中",
      nextLabel: "再開まで",
      nextTime: active.end as Date,
    };
  }

  const nextStart = validIntervals
    .map((v) => v.start as Date)
    .filter((v) => v > now)
    .sort((a, b) => a.getTime() - b.getTime())[0];

  return {
    status: "RUNNABLE" as const,
    label: "いま 実行可能",
    nextLabel: nextStart ? "次の停止まで" : "次の切替なし",
    nextTime: nextStart ?? null,
  };
}

function getGameStatus(game: NoEcsGame, now: Date): { label: string; remaining: string; state: TimeState } {
  const start = game.start ? new Date(game.start) : null;
  const busyEnd = game.busy_end ? new Date(game.busy_end) : null;

  if (!start || !busyEnd || Number.isNaN(start.getTime()) || Number.isNaN(busyEnd.getTime())) {
    return { label: "判定不可", remaining: "-", state: "unknown" };
  }

  if (now < start) {
    return { label: "開始まで", remaining: formatDiff(start.getTime() - now.getTime()), state: "before" };
  }

  if (now >= start && now < busyEnd) {
    return { label: "BUSY終了まで", remaining: formatDiff(busyEnd.getTime() - now.getTime()), state: "active" };
  }

  return { label: "終了後", remaining: formatDiff(now.getTime() - busyEnd.getTime()), state: "after" };
}

const NoEcsSlotsPage: React.FC = () => {
  const [batchCode, setBatchCode] = useState("B009");
  const [day, setDay] = useState<string>(() => getTodayJstString());
  const [response, setResponse] = useState<NoEcsSlotsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<GameTabType>("matched");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const body = {
        batchCode,
        ...(day ? { day } : {}),
      };

      const data = await fetchJsonStrict<NoEcsSlotsResponse>("/v1/api/admin/noecs/slots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });

      setResponse(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "JSONの取得に失敗しました。");
      setResponse(null);
    } finally {
      setLoading(false);
    }
  }, [batchCode, day]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const slotsBody = response?.body;
  const globalStatus = useMemo(() => getGlobalEcsStatus(slotsBody, now), [slotsBody, now]);
  const stopped = globalStatus.status === "STOPPED";

  const nextChangeText = useMemo(() => {
    if (!globalStatus.nextTime) return "-";
    return formatDiff(globalStatus.nextTime.getTime() - now.getTime());
  }, [globalStatus, now]);

  const activeGames = useMemo(() => {
    if (!slotsBody) return [];
    if (activeTab === "matched") return slotsBody.matched_games ?? [];
    if (activeTab === "nextDay") return slotsBody.next_day_lookahead_games ?? [];
    return slotsBody.prev_day_overlap_games ?? [];
  }, [slotsBody, activeTab]);

  const intervals = slotsBody?.ecs_stop_intervals ?? [];

  const intervalColumns: ConsoleColumn<EcsStopInterval>[] = [
    { key: "no", header: "No", mono: true, align: "right", cell: (_v, i) => <span className="text-gray-500">{i + 1}</span> },
    { key: "start", header: "開始", mono: true, cell: (v) => formatDateTimeJst(v.start) },
    { key: "end", header: "終了", mono: true, cell: (v) => formatDateTimeJst(v.end) },
    {
      key: "state",
      header: "状態",
      cell: (v) => {
        const s = getIntervalStatus(v, now);
        return <StatusBadge tone={STATE_TONE[s.state]}>{s.label}</StatusBadge>;
      },
    },
    { key: "remaining", header: "残り / 経過", mono: true, align: "right", cell: (v) => <b>{getIntervalStatus(v, now).remaining}</b> },
  ];

  const gameColumns: ConsoleColumn<NoEcsGame>[] = [
    {
      key: "match",
      header: "試合",
      wrap: true,
      className: "min-w-[260px]",
      cell: (g) => (
        <>
          <div className="font-bold">
            {toDisplay(g.home)} <span className="font-normal text-gray-400">vs</span> {toDisplay(g.away)}
          </div>
          <div className="text-[11px] text-gray-500">{toDisplay(g.category)}</div>
        </>
      ),
    },
    { key: "start", header: "開始", mono: true, cell: (g) => formatShortDateTimeJst(g.start) },
    { key: "busy", header: "BUSY終了", mono: true, cell: (g) => formatShortDateTimeJst(g.busy_end) },
    {
      key: "state",
      header: "状態",
      cell: (g) => {
        const s = getGameStatus(g, now);
        return <StatusBadge tone={STATE_TONE[s.state]}>{s.label}</StatusBadge>;
      },
    },
    { key: "remaining", header: "残り / 経過", mono: true, align: "right", cell: (g) => <b className="text-[13px]">{getGameStatus(g, now).remaining}</b> },
    {
      key: "url",
      header: "リンク",
      cell: (g) =>
        g.url ? (
          <a href={g.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline">
            開く <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span className="text-gray-300">-</span>
        ),
    },
  ];

  return (
    <div>
      <ConsoleToolbar title="非稼働ECS管理" info="noEcsRun が出力した JSON から、ECS停止時間と試合時間をリアルタイム表示">
        <ConsoleInput value={batchCode} onChange={(e) => setBatchCode(e.target.value)} placeholder="batchCode" className="w-24 font-mono" />
        <ConsoleInput type="date" value={day} onChange={(e) => setDay(e.target.value)} />
        <ConsoleButton variant="primary" onClick={() => void load()} loading={loading}>
          {!loading && <RefreshCw className="h-3.5 w-3.5" />}
          再読み込み
        </ConsoleButton>
      </ConsoleToolbar>

      {error && (
        <ConsoleNotice tone="ng" onClose={() => setError(null)}>
          {error}
        </ConsoleNotice>
      )}

      {/* 現在の実行状態（大きく表示） */}
      <div className={`mb-3 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border px-4 py-3 ${stopped ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"}`}>
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${stopped ? "animate-pulse bg-red-500" : "bg-emerald-500"}`} />
          <span className={`text-[17px] font-bold ${stopped ? "text-red-800" : "text-emerald-800"}`}>{globalStatus.label}</span>
          <StatusBadge tone={stopped ? "ng" : "ok"} dot={false}>
            {globalStatus.status}
          </StatusBadge>
        </div>
        <div className="text-[13px] text-gray-700">
          {globalStatus.nextLabel}
          <b className="ml-2 font-mono text-[17px] tabular-nums text-gray-900">{nextChangeText}</b>
          {globalStatus.nextTime && <span className="ml-2 font-mono text-xs text-gray-500">（{formatDateTimeJst(globalStatus.nextTime.toISOString())}）</span>}
        </div>
        <div className="ml-auto font-mono text-xs tabular-nums text-gray-500">現在 {formatDateTimeJst(now.toISOString())}</div>
      </div>

      <StatChips
        loading={loading && !slotsBody}
        items={[
          { label: "対象日", value: toDisplay(slotsBody?.target_date) },
          { label: "target_day", value: toDisplay(slotsBody?.target_day) },
          { label: "today_flg", value: String(slotsBody?.today_flg ?? "-") },
          { label: "対象リーグ数", value: toDisplay(slotsBody?.target_leagues_count) },
          { label: "timezone", value: toDisplay(slotsBody?.timezone) },
          { label: "bucket", value: toDisplay(response?.bucket) },
          { label: "file", value: toDisplay(response?.fileName) },
        ]}
      />

      <ConsolePanel title="計算条件 / 実行情報">
        <MetricGrid
          minWidth={200}
          items={[
            { label: "generated_at", value: formatDateTimeJst(slotsBody?.generated_at), mono: true },
            { label: "window_start", value: formatDateTimeJst(slotsBody?.calculation_window_start), mono: true },
            { label: "window_end", value: formatDateTimeJst(slotsBody?.calculation_window_end), mono: true },
            { label: "min_gap_minutes", value: toDisplay(slotsBody?.min_gap_minutes) },
            { label: "match_duration_minutes", value: toDisplay(slotsBody?.match_duration_minutes) },
            { label: "match_delay_buffer_minutes", value: toDisplay(slotsBody?.match_delay_buffer_minutes) },
            { label: "match_busy_minutes", value: toDisplay(slotsBody?.match_busy_minutes) },
            { label: "pre_match_buffer_minutes", value: toDisplay(slotsBody?.pre_match_buffer_minutes) },
            { label: "post_match_buffer_minutes", value: toDisplay(slotsBody?.post_match_buffer_minutes) },
            { label: "last_match_buffer_minutes", value: toDisplay(slotsBody?.last_match_buffer_minutes) },
          ]}
        />

        {slotsBody?.runtime_note && (
          <ConsoleNotice tone="info" className="mb-0 mt-2.5">
            {`when_checking_runtime_after_22: ${String(slotsBody.runtime_note.when_checking_runtime_after_22)}\nrelated_json_dates: ${(slotsBody.runtime_note.recommended_related_json_dates ?? []).join(", ") || "-"}`}
          </ConsoleNotice>
        )}
      </ConsolePanel>

      <div className="mb-1.5 flex items-center gap-2">
        <h2 className="m-0 text-sm font-bold text-gray-900">ECS 停止時間</h2>
        <span className="text-xs text-gray-500">{intervals.length}件</span>
      </div>
      <div className="mb-3">
        <ConsoleTable columns={intervalColumns} rows={intervals} rowKey={(v, i) => `${v.start ?? "start"}-${v.end ?? "end"}-${i}`} loading={loading} emptyText="停止時間データがありません。" />
      </div>

      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <h2 className="m-0 text-sm font-bold text-gray-900">試合一覧</h2>
        <span className="text-xs text-gray-500">start と busy_end から、開始前 / BUSY中 / 終了後をリアルタイム表示</span>
        <div className="ml-auto">
          <SegmentedTabs<GameTabType>
            value={activeTab}
            onChange={setActiveTab}
            options={[
              { value: "matched", label: "当日対象", count: slotsBody?.matched_games_count ?? 0 },
              { value: "nextDay", label: "翌日先読み", count: slotsBody?.next_day_lookahead_games_count ?? 0 },
              { value: "prevDay", label: "前日重複", count: slotsBody?.prev_day_overlap_games_count ?? 0 },
            ]}
          />
        </div>
      </div>
      <ConsoleTable
        columns={gameColumns}
        rows={activeGames}
        rowKey={(g, i) => `${g.url ?? "game"}-${i}`}
        loading={loading}
        emptyText="表示対象の試合がありません。"
        rowClassName={(g) => (getGameStatus(g, now).state === "active" ? "!bg-red-50/60" : "")}
      />
    </div>
  );
};

export default NoEcsSlotsPage;
