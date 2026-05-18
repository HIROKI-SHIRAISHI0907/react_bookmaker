import React, { useEffect, useMemo, useState } from "react";

type MatchDataByDateItem = {
  matchKey: string;
  matchId: string;
  gameId: string;
  dataCategory: string;
  homeTeamName: string;
  awayTeamName: string;
  addManualFlg: string;
  recordTime: string;
};

type MatchDataByDateListResponse = {
  targetDate: string;
  count: number;
  items: MatchDataByDateItem[];
};

function todayString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildTargetBadge(addManualFlg?: string) {
  const flag = String(addManualFlg ?? "");

  if (flag === "1") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 10px",
          borderRadius: 999,
          background: "#fef3c7",
          color: "#92400e",
          border: "1px solid #fcd34d",
          fontWeight: 700,
          fontSize: 12,
          whiteSpace: "nowrap",
        }}
      >
        🖐 手動スクレイピング対象
      </span>
    );
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 999,
        background: "#dbeafe",
        color: "#1d4ed8",
        border: "1px solid #93c5fd",
        fontWeight: 700,
        fontSize: 12,
        whiteSpace: "nowrap",
      }}
    >
      📄 CSV作成対象
    </span>
  );
}

async function getJsonSafe<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    if (isJson) {
      try {
        const body = await response.json();
        detail = body?.message || body?.error || detail;
      } catch {
        // ignore
      }
    } else {
      try {
        const text = await response.text();
        if (text) {
          detail = text;
        }
      } catch {
        // ignore
      }
    }
    throw new Error(detail);
  }

  if (!isJson) {
    throw new Error("JSONレスポンスではありません。");
  }

  return (await response.json()) as T;
}

export default function MatchDataByDatePage() {
  const [targetDate, setTargetDate] = useState<string>(todayString());
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [response, setResponse] = useState<MatchDataByDateListResponse>({
    targetDate: todayString(),
    count: 0,
    items: [],
  });

  const items = useMemo(() => response.items ?? [], [response.items]);

  const fetchMatchData = async (date: string) => {
    setLoading(true);
    setErrorMessage("");

    try {
      const data = await getJsonSafe<MatchDataByDateListResponse>(`/v1/api/admin/matches/by-date?targetDate=${encodeURIComponent(date)}`);

      setResponse({
        targetDate: data.targetDate ?? date,
        count: data.count ?? 0,
        items: Array.isArray(data.items) ? data.items : [],
      });
    } catch (error) {
      console.error(error);
      setResponse({
        targetDate: date,
        count: 0,
        items: [],
      });
      setErrorMessage(error instanceof Error ? error.message : "対戦データの取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatchData(targetDate);
  }, []);

  const handleSearch = async () => {
    await fetchMatchData(targetDate);
  };

  const handleTodayClick = async () => {
    const today = todayString();
    setTargetDate(today);
    await fetchMatchData(today);
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 24 }}>対戦データ検索</h1>
        <p style={{ margin: "8px 0 0", color: "#6b7280" }}>DBに登録された対戦データを日付ごとに取得します。</p>
      </div>

      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 16,
          background: "#fff",
          display: "flex",
          gap: 12,
          alignItems: "end",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "grid", gap: 6 }}>
          <label style={labelStyle}>対象日</label>
          <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} style={inputStyle} />
        </div>

        <button type="button" onClick={handleSearch} disabled={loading} style={primaryButtonStyle}>
          {loading ? "検索中..." : "検索"}
        </button>

        <button type="button" onClick={handleTodayClick} disabled={loading} style={secondaryButtonStyle}>
          今日
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={summaryCardStyle}>
          <div style={summaryLabelStyle}>対象日</div>
          <div style={summaryValueStyle}>{response.targetDate || "-"}</div>
        </div>

        <div style={summaryCardStyle}>
          <div style={summaryLabelStyle}>件数</div>
          <div style={summaryValueStyle}>{response.count}</div>
        </div>
      </div>

      {errorMessage && (
        <div
          style={{
            border: "1px solid #fecaca",
            background: "#fef2f2",
            color: "#991b1b",
            borderRadius: 10,
            padding: 12,
            fontWeight: 600,
          }}
        >
          {errorMessage}
        </div>
      )}

      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          background: "#fff",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid #e5e7eb",
            fontWeight: 800,
          }}
        >
          対戦データ一覧
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1200 }}>
            <thead style={{ background: "#f9fafb" }}>
              <tr>
                <th style={thStyle}>記録時間</th>
                <th style={thStyle}>対象区分</th>
                <th style={thStyle}>matchId</th>
                <th style={thStyle}>gameId</th>
                <th style={thStyle}>dataCategory</th>
                <th style={thStyle}>home</th>
                <th style={thStyle}>away</th>
                <th style={thStyle}>matchKey</th>
              </tr>
            </thead>

            <tbody>
              {!loading && items.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>
                    指定日の対戦データはありません。
                  </td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <tr key={`${item.matchKey || "row"}-${index}`} style={{ borderTop: "1px solid #f3f4f6" }}>
                    <td style={tdStyle}>{item.recordTime || "-"}</td>
                    <td style={tdStyle}>{buildTargetBadge(item.addManualFlg)}</td>
                    <td style={tdStyle}>{item.matchId || "-"}</td>
                    <td style={tdStyle}>{item.gameId || "-"}</td>
                    <td style={tdStyle}>{item.dataCategory || "-"}</td>
                    <td style={tdStyle}>{item.homeTeamName || "-"}</td>
                    <td style={tdStyle}>{item.awayTeamName || "-"}</td>
                    <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: 12 }}>{item.matchKey || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "#374151",
};

const inputStyle: React.CSSProperties = {
  border: "1px solid #d1d5db",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
  minWidth: 180,
};

const primaryButtonStyle: React.CSSProperties = {
  border: "1px solid #2563eb",
  background: "#2563eb",
  color: "#fff",
  padding: "10px 14px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700,
};

const secondaryButtonStyle: React.CSSProperties = {
  border: "1px solid #d1d5db",
  background: "#fff",
  color: "#111827",
  padding: "10px 14px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700,
};

const summaryCardStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 16,
  background: "#fff",
  minWidth: 180,
};

const summaryLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#6b7280",
};

const summaryValueStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 800,
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px 14px",
  fontSize: 13,
  color: "#374151",
  borderBottom: "1px solid #e5e7eb",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 14px",
  fontSize: 14,
  color: "#111827",
  verticalAlign: "top",
};
