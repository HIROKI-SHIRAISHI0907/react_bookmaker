import React, { useCallback, useEffect, useMemo, useState } from "react";

type FutureMatch = {
  id?: string;
  seq?: number;
  gameTeamCategory?: string;
  futureTime?: string;
  homeTeam?: string;
  awayTeam?: string;
  link?: string;
  roundNo?: number;
  status?: string; // "SCHEDULED" / "FINISHED"
};

type FutureMatchesResponse = {
  date?: string;
  offset?: number;
  limit?: number;
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

function formatDateTimeJst(value?: string): string {
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

function getStatusLabel(value?: string): string {
  const v = String(value ?? "")
    .trim()
    .toUpperCase();

  if (v === "SCHEDULED") return "予定";
  if (v === "FINISHED") return "終了済";

  // 旧データ互換
  if (v === "LIVE") return "ライブ";

  return v || "-";
}

function getStatusTone(value?: string): "gray" | "emerald" | "amber" | "rose" {
  const v = String(value ?? "")
    .trim()
    .toUpperCase();

  if (v === "SCHEDULED") return "emerald";
  if (v === "FINISHED") return "amber";

  // 旧データ互換
  if (v === "LIVE") return "rose";

  return "gray";
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const FUTURE_MATCHES_ENDPOINT = "/v1/api/future/admin/matches/date";
const PAGE_SIZE = 10;

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

const matchCardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: 14,
  background: "#fff",
};

const statusPillBaseStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 28,
  minWidth: 72,
  padding: "0 10px",
  borderRadius: 9999,
  fontSize: 12,
  fontWeight: 700,
};

const tabContainerStyle: React.CSSProperties = {
  display: "inline-flex",
  gap: 8,
  padding: 4,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
};

const tabBaseStyle: React.CSSProperties = {
  height: 36,
  padding: "0 14px",
  borderRadius: 10,
  border: "1px solid transparent",
  background: "transparent",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 700,
  color: "#475569",
};

function getTabStyle(active: boolean): React.CSSProperties {
  return active
    ? {
        ...tabBaseStyle,
        background: "#2563eb",
        color: "#ffffff",
        border: "1px solid #2563eb",
        boxShadow: "0 1px 2px rgba(37, 99, 235, 0.2)",
      }
    : {
        ...tabBaseStyle,
        background: "transparent",
        color: "#475569",
        border: "1px solid transparent",
      };
}

function getStatusPillStyle(tone: "gray" | "emerald" | "amber" | "rose"): React.CSSProperties {
  if (tone === "emerald") {
    return {
      ...statusPillBaseStyle,
      background: "#dcfce7",
      color: "#15803d",
      border: "1px solid #bbf7d0",
    };
  }
  if (tone === "amber") {
    return {
      ...statusPillBaseStyle,
      background: "#fef3c7",
      color: "#b45309",
      border: "1px solid #fde68a",
    };
  }
  if (tone === "rose") {
    return {
      ...statusPillBaseStyle,
      background: "#fee2e2",
      color: "#b91c1c",
      border: "1px solid #fecaca",
    };
  }
  return {
    ...statusPillBaseStyle,
    background: "#e2e8f0",
    color: "#475569",
    border: "1px solid #cbd5e1",
  };
}

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

  return (
    <div style={pageStyle}>
      <div style={sectionStyle}>
        <div style={{ marginBottom: 12 }}>
          <h1 style={{ margin: 0, fontSize: 24, lineHeight: 1.3 }}>指定日の試合予定一覧</h1>
          <p style={{ margin: "6px 0 0", color: "#475569", fontSize: 12 }}>指定日の future_master データを 10件ずつ OFFSET で表示します。</p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
          <input type="date" value={date} onChange={(e) => handleChangeDate(e.target.value)} style={{ ...inputStyle, width: 160 }} />

          <button type="button" onClick={handleReload} style={loading ? disabledButtonStyle : primaryButtonStyle} disabled={loading}>
            {loading ? "読込中..." : "再読み込み"}
          </button>

          <button type="button" onClick={handlePrev} style={canPrev ? buttonStyle : disabledButtonStyle} disabled={!canPrev}>
            前へ
          </button>

          <button type="button" onClick={handleNext} style={canNext ? buttonStyle : disabledButtonStyle} disabled={!canNext}>
            次へ
          </button>

          <span style={badgeStyle}>date: {toDisplay(response?.date ?? date)}</span>
          <span style={badgeStyle}>offset: {currentOffset}</span>
          <span style={badgeStyle}>limit: {currentLimit}</span>
          <span style={badgeStyle}>page: {currentPage}</span>
          <span style={badgeStyle}>件数: {matches.length}</span>
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
            <div style={infoLabelStyle}>対象日</div>
            <div style={infoValueStyle}>{toDisplay(response?.date ?? date)}</div>
          </div>

          <div style={infoCardStyle}>
            <div style={infoLabelStyle}>現在ページ</div>
            <div style={infoValueStyle}>{currentPage}</div>
            <div style={{ marginTop: 8, color: "#475569", fontSize: 12 }}>offset: {currentOffset}</div>
          </div>

          <div style={infoCardStyle}>
            <div style={infoLabelStyle}>表示件数</div>
            <div style={infoValueStyle}>{matches.length}</div>
            <div style={{ marginTop: 8, color: "#475569", fontSize: 12 }}>1ページ {currentLimit} 件</div>
          </div>
        </div>
      </div>

      <div style={sectionStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 12,
            alignItems: "flex-start",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 18 }}>表示切替</h2>
            <p style={{ margin: "6px 0 0", fontSize: 12, color: "#475569" }}>一覧テーブルとカード表示をタブで切り替えられます。</p>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={badgeStyle}>対象日: {toDisplay(response?.date ?? date)}</span>
            <span style={badgeStyle}>offset: {currentOffset}</span>

            <div style={tabContainerStyle}>
              <button type="button" style={getTabStyle(viewMode === "table")} onClick={() => setViewMode("table")}>
                一覧テーブル
              </button>
              <button type="button" style={getTabStyle(viewMode === "card")} onClick={() => setViewMode("card")}>
                カード表示
              </button>
            </div>
          </div>
        </div>

        {viewMode === "table" ? (
          <>
            <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>一覧テーブル</h3>

            <div style={tableWrapperStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>seq</th>
                    <th style={thStyle}>カテゴリ</th>
                    <th style={thStyle}>試合開始日時</th>
                    <th style={thStyle}>ホーム</th>
                    <th style={thStyle}>アウェイ</th>
                    <th style={thStyle}>状態</th>
                    <th style={thStyle}>リンク</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={thTdStyle}>
                        対象データがありません。
                      </td>
                    </tr>
                  ) : (
                    matches.map((match, index) => (
                      <tr key={`${match.seq ?? "seq"}-${index}`}>
                        <td style={thTdStyle}>{toDisplay(match.seq)}</td>
                        <td style={thTdStyle}>{toDisplay(match.gameTeamCategory)}</td>
                        <td style={thTdStyle}>{formatDateTimeJst(match.futureTime)}</td>
                        <td style={thTdStyle}>{toDisplay(match.homeTeam)}</td>
                        <td style={thTdStyle}>{toDisplay(match.awayTeam)}</td>
                        <td style={thTdStyle}>
                          <span style={getStatusPillStyle(getStatusTone(match.status))}>{getStatusLabel(match.status)}</span>
                        </td>
                        <td style={thTdStyle}>
                          {match.link ? (
                            <a
                              href={match.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: "#2563eb",
                                textDecoration: "none",
                                fontWeight: 600,
                              }}
                            >
                              開く
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>カード表示</h3>
            <p style={{ margin: "0 0 12px", fontSize: 12, color: "#475569" }}>管理画面で見やすいように試合ごとにカード表示しています。</p>

            {matches.length === 0 ? (
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
                {matches.map((match, index) => (
                  <div key={`${match.seq ?? "card"}-${index}`} style={matchCardStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div style={{ flex: "1 1 420px" }}>
                        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>
                          id: {toDisplay(match.id)} / seq: {toDisplay(match.seq)}
                        </div>

                        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>
                          {toDisplay(match.gameTeamCategory)} / round: {toDisplay(match.roundNo)}
                        </div>

                        <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.4 }}>
                          {toDisplay(match.homeTeam)} vs {toDisplay(match.awayTeam)}
                        </div>

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                          <span style={badgeStyle}>試合開始: {formatDateTimeJst(match.futureTime)}</span>
                          <span style={getStatusPillStyle(getStatusTone(match.status))}>{getStatusLabel(match.status)}</span>
                        </div>

                        {match.link && (
                          <div style={{ marginTop: 10 }}>
                            <a
                              href={match.link}
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FutureMatchesByDatePage;
