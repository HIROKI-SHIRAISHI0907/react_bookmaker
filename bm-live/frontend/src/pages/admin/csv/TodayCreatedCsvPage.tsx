import React, { useEffect, useMemo, useState } from "react";

type TodayCreatedCsvItem = {
  csvId: string;
  dataCategory: string;
  season: string;
  homeTeamName: string;
  awayTeamName: string;
  checkFinFlg: string;
  registerTime: string;
};

type TodayCreatedCsvListResponse = {
  targetDate: string;
  count: number;
  totalCount: number;
  startOffset: number;
  endOffset: number;
  items: TodayCreatedCsvItem[];
};

const PAGE_SIZE = 50;

function todayString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function TodayCreatedCsvPage() {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [targetDate, setTargetDate] = useState(todayString());
  const [currentPage, setCurrentPage] = useState(1);

  const [data, setData] = useState<TodayCreatedCsvListResponse>({
    targetDate: todayString(),
    count: 0,
    totalCount: 0,
    startOffset: 0,
    endOffset: PAGE_SIZE,
    items: [],
  });

  const totalPages = Math.max(1, Math.ceil((data.totalCount || 0) / PAGE_SIZE));

  const visiblePageNumbers = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);

    for (let i = start; i <= end; i += 1) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

  const load = async (date: string, page: number) => {
    setLoading(true);
    setErrorMessage("");

    const startOffset = (page - 1) * PAGE_SIZE;
    const endOffset = startOffset + PAGE_SIZE;

    try {
      const response = await fetch(`/v1/api/admin/csv/today?targetDate=${encodeURIComponent(date)}&startOffset=${startOffset}&endOffset=${endOffset}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = (await response.json()) as TodayCreatedCsvListResponse;

      setData({
        targetDate: json.targetDate ?? date,
        count: json.count ?? 0,
        totalCount: json.totalCount ?? 0,
        startOffset: json.startOffset ?? startOffset,
        endOffset: json.endOffset ?? endOffset,
        items: json.items ?? [],
      });

      setCurrentPage(page);
    } catch (error) {
      console.error(error);
      setErrorMessage("作成CSV情報の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(targetDate, 1);
  }, []);

  const onSearch = () => {
    load(targetDate, 1);
  };

  const onClickToday = () => {
    const today = todayString();
    setTargetDate(today);
    load(today, 1);
  };

  const onMovePage = (page: number) => {
    if (loading) return;
    if (page < 1 || page > totalPages) return;
    load(targetDate, page);
  };

  const displayStart = data.totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const displayEnd = Math.min(currentPage * PAGE_SIZE, data.totalCount);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 24 }}>作成CSV情報</h1>
          <p style={{ margin: "8px 0 0", color: "#6b7280" }}>csv_detail_manage の register_time を基準に、指定日の作成CSVを表示します。</p>
        </div>
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
          <label style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>対象日</label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            style={{
              border: "1px solid #d1d5db",
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 14,
              minWidth: 180,
            }}
          />
        </div>

        <button
          type="button"
          onClick={onSearch}
          disabled={loading}
          style={{
            border: "1px solid #d1d5db",
            background: "#fff",
            padding: "10px 14px",
            borderRadius: 10,
            cursor: loading ? "default" : "pointer",
            fontWeight: 700,
          }}
        >
          {loading ? "読込中..." : "検索"}
        </button>

        <button
          type="button"
          onClick={onClickToday}
          disabled={loading}
          style={{
            border: "1px solid #d1d5db",
            background: "#f9fafb",
            padding: "10px 14px",
            borderRadius: 10,
            cursor: loading ? "default" : "pointer",
            fontWeight: 700,
          }}
        >
          今日
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 16,
            background: "#fff",
            minWidth: 220,
          }}
        >
          <div style={{ fontSize: 12, color: "#6b7280" }}>対象日</div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{data.targetDate}</div>
        </div>

        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 16,
            background: "#fff",
            minWidth: 180,
          }}
        >
          <div style={{ fontSize: 12, color: "#6b7280" }}>総件数</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{data.totalCount}</div>
        </div>

        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 16,
            background: "#fff",
            minWidth: 220,
          }}
        >
          <div style={{ fontSize: 12, color: "#6b7280" }}>表示範囲</div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>
            {displayStart} - {displayEnd}
          </div>
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
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>作成CSV一覧</div>
          <div style={{ fontSize: 13, color: "#6b7280" }}>
            {currentPage} / {totalPages} ページ
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 980 }}>
            <thead style={{ background: "#f9fafb" }}>
              <tr>
                <th style={thStyle}>登録日時</th>
                <th style={thStyle}>CSV ID</th>
                <th style={thStyle}>データカテゴリ</th>
                <th style={thStyle}>シーズン</th>
                <th style={thStyle}>ホーム</th>
                <th style={thStyle}>アウェイ</th>
                <th style={thStyle}>checkFinFlg</th>
              </tr>
            </thead>
            <tbody>
              {data.items.length === 0 && !loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>
                    指定日に作成されたデータはありません。
                  </td>
                </tr>
              ) : (
                data.items.map((item, index) => (
                  <tr key={`${item.csvId}-${index}`} style={{ borderTop: "1px solid #f3f4f6" }}>
                    <td style={tdStyle}>{item.registerTime || "-"}</td>
                    <td style={tdStyle}>{item.csvId || "-"}</td>
                    <td style={tdStyle}>{item.dataCategory || "-"}</td>
                    <td style={tdStyle}>{item.season || "-"}</td>
                    <td style={tdStyle}>{item.homeTeamName || "-"}</td>
                    <td style={tdStyle}>{item.awayTeamName || "-"}</td>
                    <td style={tdStyle}>{item.checkFinFlg || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div
          style={{
            borderTop: "1px solid #e5e7eb",
            padding: 16,
            display: "flex",
            justifyContent: "center",
            gap: 8,
            flexWrap: "wrap",
            background: "#fff",
          }}
        >
          <button type="button" onClick={() => onMovePage(1)} disabled={loading || currentPage === 1} style={pageButtonStyle}>
            先頭
          </button>

          <button type="button" onClick={() => onMovePage(currentPage - 1)} disabled={loading || currentPage === 1} style={pageButtonStyle}>
            前へ
          </button>

          {visiblePageNumbers[0] > 1 && (
            <>
              <button type="button" onClick={() => onMovePage(1)} disabled={loading} style={pageButtonStyle}>
                1
              </button>
              {visiblePageNumbers[0] > 2 && <span style={{ alignSelf: "center", color: "#6b7280" }}>...</span>}
            </>
          )}

          {visiblePageNumbers.map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => onMovePage(page)}
              disabled={loading}
              style={{
                ...pageButtonStyle,
                background: page === currentPage ? "#111827" : "#fff",
                color: page === currentPage ? "#fff" : "#111827",
                borderColor: page === currentPage ? "#111827" : "#d1d5db",
              }}
            >
              {page}
            </button>
          ))}

          {visiblePageNumbers[visiblePageNumbers.length - 1] < totalPages && (
            <>
              {visiblePageNumbers[visiblePageNumbers.length - 1] < totalPages - 1 && <span style={{ alignSelf: "center", color: "#6b7280" }}>...</span>}
              <button type="button" onClick={() => onMovePage(totalPages)} disabled={loading} style={pageButtonStyle}>
                {totalPages}
              </button>
            </>
          )}

          <button type="button" onClick={() => onMovePage(currentPage + 1)} disabled={loading || currentPage === totalPages} style={pageButtonStyle}>
            次へ
          </button>

          <button type="button" onClick={() => onMovePage(totalPages)} disabled={loading || currentPage === totalPages} style={pageButtonStyle}>
            末尾
          </button>
        </div>
      </div>
    </div>
  );
}

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

const pageButtonStyle: React.CSSProperties = {
  border: "1px solid #d1d5db",
  background: "#fff",
  padding: "8px 12px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700,
  minWidth: 44,
};
