import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMailInfoListApi, MailInfoMasterEntity } from "../../../api/mailinfo";

/**
 * メール情報一覧画面
 * 現在登録されているメール情報マスタの内容を取得して表示する。
 * 「検索」ボタン押下でGET /v1/api/admin/mailinfoを叩き直す。
 */

function formatBodyPreview(body: string): string {
  if (!body) return "";
  // テーブル内で改行が視認できるよう、改行を「 ↵ 」に変換して1行表示にする
  return body.split(/\r\n|\r|\n/).join(" ↵ ");
}

export default function MailInfoListPage() {
  const [list, setList] = useState<MailInfoMasterEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMailInfoListApi();
      setList(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "取得に失敗しました。");
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.headerRow}>
          <h1 style={styles.title}>メール情報一覧</h1>
          <Link to="/admin/mailinfo/new" style={styles.primaryButtonLink}>
            新規登録
          </Link>
        </div>

        <div style={{ marginBottom: 16 }}>
          <button type="button" onClick={handleSearch} disabled={loading} style={styles.secondaryButton}>
            {loading ? "検索中..." : "検索"}
          </button>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>メールID</th>
                <th style={styles.th}>メール件名</th>
                <th style={styles.th}>メール本文</th>
                <th style={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && !loading && (
                <tr>
                  <td style={styles.tdEmpty} colSpan={4}>
                    データがありません。
                  </td>
                </tr>
              )}
              {list.map((item) => (
                <tr key={item.mailId}>
                  <td style={styles.td}>{item.mailId}</td>
                  <td style={styles.td}>{item.mailSubject}</td>
                  <td style={styles.td}>{formatBodyPreview(item.mailBody)}</td>
                  <td style={styles.td}>
                    <Link to={`/admin/mailinfo/${encodeURIComponent(item.mailId)}/edit`} style={styles.linkButton}>
                      更新
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: 24,
    background: "#f6f7fb",
  },
  card: {
    maxWidth: 960,
    margin: "0 auto",
    background: "white",
    border: "1px solid #e6e8ef",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: { margin: 0, fontSize: 22 },
  secondaryButton: {
    padding: "8px 16px",
    borderRadius: 10,
    border: "1px solid #d7dbe7",
    background: "white",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
  },
  primaryButtonLink: {
    display: "inline-block",
    padding: "8px 16px",
    borderRadius: 10,
    border: "none",
    background: "#111827",
    color: "white",
    fontWeight: 600,
    fontSize: 14,
    textDecoration: "none",
  },
  errorBox: {
    padding: 10,
    borderRadius: 10,
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    fontSize: 13,
    marginBottom: 16,
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 14,
  },
  th: {
    textAlign: "left",
    padding: "10px 12px",
    borderBottom: "2px solid #e6e8ef",
    color: "#4b5563",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  td: {
    padding: "10px 12px",
    borderBottom: "1px solid #eef0f5",
    verticalAlign: "top",
  },
  tdEmpty: {
    padding: "20px 12px",
    textAlign: "center",
    color: "#9ca3af",
  },
  linkButton: {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: 8,
    border: "1px solid #d7dbe7",
    color: "#111827",
    fontSize: 13,
    textDecoration: "none",
    whiteSpace: "nowrap",
  },
};
