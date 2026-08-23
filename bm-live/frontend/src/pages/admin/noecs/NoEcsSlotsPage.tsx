import React, { useCallback, useEffect, useMemo, useState } from "react";

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

function getIntervalStatus(interval: EcsStopInterval, now: Date) {
  const start = interval.start ? new Date(interval.start) : null;
  const end = interval.end ? new Date(interval.end) : null;

  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return {
      label: "判定不可",
      remaining: "-",
      state: "unknown" as const,
    };
  }

  if (now < start) {
    return {
      label: "停止開始まで",
      remaining: formatDiff(start.getTime() - now.getTime()),
      state: "before" as const,
    };
  }

  if (now >= start && now < end) {
    return {
      label: "停止終了まで",
      remaining: formatDiff(end.getTime() - now.getTime()),
      state: "active" as const,
    };
  }

  return {
    label: "停止終了後",
    remaining: formatDiff(now.getTime() - end.getTime()),
    state: "after" as const,
  };
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

function getGameStatus(game: NoEcsGame, now: Date) {
  const start = game.start ? new Date(game.start) : null;
  const busyEnd = game.busy_end ? new Date(game.busy_end) : null;

  if (!start || !busyEnd || Number.isNaN(start.getTime()) || Number.isNaN(busyEnd.getTime())) {
    return {
      label: "判定不可",
      remaining: "-",
      state: "unknown" as const,
    };
  }

  if (now < start) {
    return {
      label: "開始まで",
      remaining: formatDiff(start.getTime() - now.getTime()),
      state: "before" as const,
    };
  }

  if (now >= start && now < busyEnd) {
    return {
      label: "BUSY終了まで",
      remaining: formatDiff(busyEnd.getTime() - now.getTime()),
      state: "active" as const,
    };
  }

  return {
    label: "終了後",
    remaining: formatDiff(now.getTime() - busyEnd.getTime()),
    state: "after" as const,
  };
}

const pageStyle: React.CSSProperties = {
  padding: 16,
  fontSize: 12,
  color: "#0f172a",
  background: "#f8fafc",
  minHeight: "100vh",
  boxSizing: "border-box",
};

const sectionStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: 16,
  marginBottom: 16,
};

const buttonStyle: React.CSSProperties = {
  height: 32,
  padding: "0 12px",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  background: "#fff",
  cursor: "pointer",
  fontSize: 12,
  whiteSpace: "nowrap",
};

const primaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: "#2563eb",
  color: "#fff",
  border: "1px solid #2563eb",
};

const disabledButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  opacity: 0.45,
  cursor: "not-allowed",
};

const inputStyle: React.CSSProperties = {
  height: 32,
  border: "1px solid #94a3b8",
  borderRadius: 8,
  padding: "4px 8px",
  fontSize: 12,
  boxSizing: "border-box",
};

const badgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 28,
  padding: "0 10px",
  borderRadius: 9999,
  background: "#f1f5f9",
  color: "#334155",
  fontSize: 12,
  border: "1px solid #e2e8f0",
};

const infoCardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: 14,
  minWidth: 180,
  flex: "1 1 180px",
};

const infoLabelStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#64748b",
  marginBottom: 6,
};

const infoValueStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  color: "#0f172a",
  lineHeight: 1.3,
};

const tableWrapperStyle: React.CSSProperties = {
  overflowX: "auto",
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  marginTop: 10,
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 12,
};

const thTdStyle: React.CSSProperties = {
  borderBottom: "1px solid #e2e8f0",
  padding: "8px 10px",
  fontSize: 12,
  verticalAlign: "top",
  lineHeight: 1.5,
  textAlign: "left",
};

const thStyle: React.CSSProperties = {
  ...thTdStyle,
  background: "#f8fafc",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const tabStyle: React.CSSProperties = {
  ...buttonStyle,
  minWidth: 120,
};

const activeTabStyle: React.CSSProperties = {
  ...buttonStyle,
  minWidth: 120,
  background: "#0f172a",
  color: "#fff",
  border: "1px solid #0f172a",
};

const statusPillBaseStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 28,
  minWidth: 96,
  padding: "0 10px",
  borderRadius: 9999,
  fontSize: 12,
  fontWeight: 700,
};

function getStatusPillStyle(state: "before" | "active" | "after" | "unknown"): React.CSSProperties {
  if (state === "active") {
    return {
      ...statusPillBaseStyle,
      background: "#fee2e2",
      color: "#b91c1c",
      border: "1px solid #fecaca",
    };
  }
  if (state === "before") {
    return {
      ...statusPillBaseStyle,
      background: "#dbeafe",
      color: "#1d4ed8",
      border: "1px solid #bfdbfe",
    };
  }
  if (state === "after") {
    return {
      ...statusPillBaseStyle,
      background: "#dcfce7",
      color: "#15803d",
      border: "1px solid #bbf7d0",
    };
  }
  return {
    ...statusPillBaseStyle,
    background: "#e2e8f0",
    color: "#475569",
    border: "1px solid #cbd5e1",
  };
}

const gameCardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: 14,
  background: "#fff",
};

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

  const nextChangeText = useMemo(() => {
    if (!globalStatus.nextTime) return "-";
    return `${globalStatus.nextLabel} ${formatDiff(globalStatus.nextTime.getTime() - now.getTime())}`;
  }, [globalStatus, now]);

  const activeGames = useMemo(() => {
    if (!slotsBody) return [];
    if (activeTab === "matched") return slotsBody.matched_games ?? [];
    if (activeTab === "nextDay") return slotsBody.next_day_lookahead_games ?? [];
    return slotsBody.prev_day_overlap_games ?? [];
  }, [slotsBody, activeTab]);

  const activeGamesCount = useMemo(() => {
    if (!slotsBody) return 0;
    if (activeTab === "matched") return slotsBody.matched_games_count ?? 0;
    if (activeTab === "nextDay") return slotsBody.next_day_lookahead_games_count ?? 0;
    return slotsBody.prev_day_overlap_games_count ?? 0;
  }, [slotsBody, activeTab]);

  return (
    <div style={pageStyle}>
      <div style={sectionStyle}>
        <div style={{ marginBottom: 12 }}>
          <h1 style={{ margin: 0, fontSize: 24, lineHeight: 1.3 }}>No ECS Runtime Monitor</h1>
          <p style={{ margin: "6px 0 0", color: "#475569", fontSize: 12 }}>noEcsRun が出力した JSON を使って、ECS停止時間と試合時間をリアルタイム表示します。</p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
          <input value={batchCode} onChange={(e) => setBatchCode(e.target.value)} placeholder="batchCode" style={{ ...inputStyle, width: 120 }} />

          <input type="date" value={day} onChange={(e) => setDay(e.target.value)} style={{ ...inputStyle, width: 160 }} />

          <button type="button" onClick={() => void load()} style={loading ? disabledButtonStyle : primaryButtonStyle} disabled={loading}>
            {loading ? "読込中..." : "再読み込み"}
          </button>

          <span style={badgeStyle}>現在時刻: {formatDateTimeJst(now.toISOString())}</span>
          <span style={badgeStyle}>bucket: {toDisplay(response?.bucket)}</span>
          <span style={badgeStyle}>file: {toDisplay(response?.fileName)}</span>
        </div>

        {error && (
          <div
            style={{
              marginBottom: 12,
              color: "#b91c1c",
              background: "#fee2e2",
              padding: 10,
              borderRadius: 8,
              fontSize: 12,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <div style={infoCardStyle}>
            <div style={infoLabelStyle}>現在の実行状態</div>
            <div style={infoValueStyle}>{globalStatus.label}</div>
            <div style={{ marginTop: 8 }}>
              <span style={getStatusPillStyle(globalStatus.status === "STOPPED" ? "active" : "after")}>{globalStatus.status === "STOPPED" ? "STOPPED" : "RUNNABLE"}</span>
            </div>
          </div>

          <div style={infoCardStyle}>
            <div style={infoLabelStyle}>次の切替</div>
            <div style={infoValueStyle}>{nextChangeText}</div>
            <div style={{ marginTop: 8, color: "#475569", fontSize: 12 }}>{globalStatus.nextTime ? formatDateTimeJst(globalStatus.nextTime.toISOString()) : "-"}</div>
          </div>

          <div style={infoCardStyle}>
            <div style={infoLabelStyle}>対象日</div>
            <div style={infoValueStyle}>{toDisplay(slotsBody?.target_date)}</div>
            <div style={{ marginTop: 8, color: "#475569", fontSize: 12 }}>
              {toDisplay(slotsBody?.target_day)} / today_flg: {String(slotsBody?.today_flg)}
            </div>
          </div>

          <div style={infoCardStyle}>
            <div style={infoLabelStyle}>対象リーグ数</div>
            <div style={infoValueStyle}>{toDisplay(slotsBody?.target_leagues_count)}</div>
            <div style={{ marginTop: 8, color: "#475569", fontSize: 12 }}>timezone: {toDisplay(slotsBody?.timezone)}</div>
          </div>
        </div>
      </div>

      <div style={sectionStyle}>
        <h2 style={{ margin: "0 0 12px", fontSize: 18 }}>計算条件 / 実行情報</h2>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <span style={badgeStyle}>generated_at: {formatDateTimeJst(slotsBody?.generated_at)}</span>
          <span style={badgeStyle}>window_start: {formatDateTimeJst(slotsBody?.calculation_window_start)}</span>
          <span style={badgeStyle}>window_end: {formatDateTimeJst(slotsBody?.calculation_window_end)}</span>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span style={badgeStyle}>min_gap_minutes: {toDisplay(slotsBody?.min_gap_minutes)}</span>
          <span style={badgeStyle}>match_duration_minutes: {toDisplay(slotsBody?.match_duration_minutes)}</span>
          <span style={badgeStyle}>match_delay_buffer_minutes: {toDisplay(slotsBody?.match_delay_buffer_minutes)}</span>
          <span style={badgeStyle}>match_busy_minutes: {toDisplay(slotsBody?.match_busy_minutes)}</span>
          <span style={badgeStyle}>pre_match_buffer_minutes: {toDisplay(slotsBody?.pre_match_buffer_minutes)}</span>
          <span style={badgeStyle}>post_match_buffer_minutes: {toDisplay(slotsBody?.post_match_buffer_minutes)}</span>
          <span style={badgeStyle}>last_match_buffer_minutes: {toDisplay(slotsBody?.last_match_buffer_minutes)}</span>
        </div>

        {slotsBody?.runtime_note && (
          <div
            style={{
              marginTop: 12,
              background: "#eff6ff",
              color: "#1d4ed8",
              padding: 12,
              borderRadius: 10,
              fontSize: 12,
            }}
          >
            <div>when_checking_runtime_after_22: {String(slotsBody.runtime_note.when_checking_runtime_after_22)}</div>
            <div style={{ marginTop: 6 }}>related_json_dates: {(slotsBody.runtime_note.recommended_related_json_dates ?? []).join(", ") || "-"}</div>
          </div>
        )}
      </div>

      <div style={sectionStyle}>
        <h2 style={{ margin: "0 0 12px", fontSize: 18 }}>ECS 停止時間</h2>

        <div style={tableWrapperStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>No</th>
                <th style={thStyle}>開始</th>
                <th style={thStyle}>終了</th>
                <th style={thStyle}>状態</th>
                <th style={thStyle}>残り/経過</th>
              </tr>
            </thead>
            <tbody>
              {(slotsBody?.ecs_stop_intervals ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} style={thTdStyle}>
                    停止時間データがありません。
                  </td>
                </tr>
              ) : (
                (slotsBody?.ecs_stop_intervals ?? []).map((interval, index) => {
                  const status = getIntervalStatus(interval, now);

                  return (
                    <tr key={`${interval.start ?? "start"}-${interval.end ?? "end"}-${index}`}>
                      <td style={thTdStyle}>{index + 1}</td>
                      <td style={thTdStyle}>{formatDateTimeJst(interval.start)}</td>
                      <td style={thTdStyle}>{formatDateTimeJst(interval.end)}</td>
                      <td style={thTdStyle}>
                        <span style={getStatusPillStyle(status.state)}>{status.label}</span>
                      </td>
                      <td style={thTdStyle}>{status.remaining}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18 }}>試合一覧</h2>
            <p style={{ margin: "6px 0 0", fontSize: 12, color: "#475569" }}>start と busy_end を使って、開始前 / BUSY中 / 終了後をリアルタイム表示します。</p>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" style={activeTab === "matched" ? activeTabStyle : tabStyle} onClick={() => setActiveTab("matched")}>
              当日対象 ({toDisplay(slotsBody?.matched_games_count)})
            </button>
            <button type="button" style={activeTab === "nextDay" ? activeTabStyle : tabStyle} onClick={() => setActiveTab("nextDay")}>
              翌日先読み ({toDisplay(slotsBody?.next_day_lookahead_games_count)})
            </button>
            <button type="button" style={activeTab === "prevDay" ? activeTabStyle : tabStyle} onClick={() => setActiveTab("prevDay")}>
              前日重複 ({toDisplay(slotsBody?.prev_day_overlap_games_count)})
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <span style={badgeStyle}>表示件数: {activeGamesCount}</span>
        </div>

        {activeGames.length === 0 ? (
          <div
            style={{
              color: "#475569",
              background: "#f8fafc",
              padding: 12,
              borderRadius: 10,
              fontSize: 12,
            }}
          >
            表示対象の試合がありません。
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {activeGames.map((game, index) => {
              const status = getGameStatus(game, now);

              return (
                <div key={`${game.url ?? "game"}-${index}`} style={gameCardStyle}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ flex: "1 1 420px" }}>
                      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>{toDisplay(game.category)}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.4 }}>
                        {toDisplay(game.home)} vs {toDisplay(game.away)}
                      </div>

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                        <span style={badgeStyle}>開始: {formatShortDateTimeJst(game.start)}</span>
                        <span style={badgeStyle}>BUSY終了: {formatShortDateTimeJst(game.busy_end)}</span>
                      </div>

                      {game.url && (
                        <div style={{ marginTop: 10 }}>
                          <a
                            href={game.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#2563eb",
                              textDecoration: "none",
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            試合ページを開く
                          </a>
                        </div>
                      )}
                    </div>

                    <div style={{ minWidth: 220 }}>
                      <div style={{ marginBottom: 8 }}>
                        <span style={getStatusPillStyle(status.state)}>{status.label}</span>
                      </div>
                      <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.2 }}>{status.remaining}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NoEcsSlotsPage;
