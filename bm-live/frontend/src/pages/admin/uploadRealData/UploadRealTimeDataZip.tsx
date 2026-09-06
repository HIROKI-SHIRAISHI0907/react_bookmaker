import React, { useEffect, useMemo, useState } from "react";

type UploadedRealTimeDataDownloadItem = {
  fileName: string;
  gameTeamName: string;
  gameProcess: string;
  size: string;
  lastUpdateDate: string;
};

const API_BASE = "/v1/api/admin/real-time-data/upload";
const PAGE_SIZE = 10;

function buildSearchQuery(params: { country: string; league: string; finFlg: boolean; uploadDate: string }) {
  const query = new URLSearchParams();

  if (params.country.trim() !== "") {
    query.set("country", params.country.trim());
  }
  if (params.league.trim() !== "") {
    query.set("league", params.league.trim());
  }
  if (params.finFlg) {
    query.set("finFlg", "true");
  }
  if (params.uploadDate !== "") {
    query.set("uploadDate", params.uploadDate);
  }

  return query.toString();
}

export default function UploadedRealTimeDataDownloadPage() {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [country, setCountry] = useState("");
  const [league, setLeague] = useState("");
  const [finFlg, setFinFlg] = useState(false);
  const [uploadDate, setUploadDate] = useState("");

  const [items, setItems] = useState<UploadedRealTimeDataDownloadItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));

  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, currentPage]);

  const visiblePageNumbers = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);

    for (let i = start; i <= end; i += 1) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

  const onMovePage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const loadInit = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(`${API_BASE}/init`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = (await response.json()) as UploadedRealTimeDataDownloadItem[];
      setItems(json ?? []);
      setCurrentPage(1);
    } catch (error) {
      console.error(error);
      setErrorMessage("一覧の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const onSearch = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const queryString = buildSearchQuery({ country, league, finFlg, uploadDate });
      const response = await fetch(`${API_BASE}/search${queryString ? `?${queryString}` : ""}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = (await response.json()) as UploadedRealTimeDataDownloadItem[];
      setItems(json ?? []);
      setCurrentPage(1);
    } catch (error) {
      console.error(error);
      setErrorMessage("検索に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const onClearAndReload = () => {
    setCountry("");
    setLeague("");
    setFinFlg(false);
    setUploadDate("");
    loadInit();
  };

  const onDownload = (fileName: string) => {
    const url = `${API_BASE}/download?fileName=${encodeURIComponent(fileName)}`;
    const anchor = document.createElement("a");
    anchor.href = url;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  useEffect(() => {
    loadInit();
  }, []);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 24 }}>アップロード済みリアルタイムデータ</h1>
        <p style={{ margin: "8px 0 0", color: "#6b7280" }}>S3にアップロードされている試合ごとのzipファイルを検索・ダウンロードします。</p>
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
          <label style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>国</label>
          <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="例: Japan" style={inputStyle} />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>リーグ</label>
          <input type="text" value={league} onChange={(e) => setLeague(e.target.value)} placeholder="例: J1" style={inputStyle} />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>アップロード日</label>
          <input type="date" value={uploadDate} onChange={(e) => setUploadDate(e.target.value)} style={inputStyle} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 10 }}>
          <input id="finFlg" type="checkbox" checked={finFlg} onChange={(e) => setFinFlg(e.target.checked)} style={{ width: 16, height: 16 }} />
          <label htmlFor="finFlg" style={{ fontSize: 14, color: "#374151", fontWeight: 700 }}>
            終了済のみ
          </label>
        </div>

        <button type="button" onClick={onSearch} disabled={loading} style={primaryButtonStyle}>
          {loading ? "読込中..." : "検索"}
        </button>

        <button type="button" onClick={onClearAndReload} disabled={loading} style={secondaryButtonStyle}>
          条件クリア
        </button>
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
          <div>アップロード済み一覧</div>
          <div style={{ fontSize: 13, color: "#6b7280" }}>
            {items.length} 件（{currentPage} / {totalPages} ページ）
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
            <thead style={{ background: "#f9fafb" }}>
              <tr>
                <th style={thStyle}>ファイル名</th>
                <th style={thStyle}>対戦情報</th>
                <th style={thStyle}>状態</th>
                <th style={thStyle}>サイズ</th>
                <th style={thStyle}>最終更新日時</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {pagedItems.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>
                    該当するデータはありません。
                  </td>
                </tr>
              ) : (
                pagedItems.map((item, index) => (
                  <tr key={`${item.fileName}-${index}`} style={{ borderTop: "1px solid #f3f4f6" }}>
                    <td style={tdStyle}>{item.fileName || "-"}</td>
                    <td style={tdStyle}>{item.gameTeamName || "-"}</td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 10px",
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 700,
                          background: item.gameProcess === "0" ? "#f3f4f6" : "#dcfce7",
                          color: item.gameProcess === "0" ? "#374151" : "#166534",
                        }}
                      >
                        {item.gameProcess === "0" ? "終了済" : "対戦中"}
                      </span>
                    </td>
                    <td style={tdStyle}>{item.size || "-"}</td>
                    <td style={tdStyle}>{item.lastUpdateDate || "-"}</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      <button type="button" onClick={() => onDownload(item.fileName)} style={downloadButtonStyle}>
                        ダウンロード
                      </button>
                    </td>
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

const inputStyle: React.CSSProperties = {
  border: "1px solid #d1d5db",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
  minWidth: 160,
};

const primaryButtonStyle: React.CSSProperties = {
  border: "1px solid #111827",
  background: "#111827",
  color: "#fff",
  padding: "10px 14px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700,
};

const secondaryButtonStyle: React.CSSProperties = {
  border: "1px solid #d1d5db",
  background: "#f9fafb",
  padding: "10px 14px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700,
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

const downloadButtonStyle: React.CSSProperties = {
  border: "1px solid #d1d5db",
  background: "#fff",
  padding: "6px 12px",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 13,
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
