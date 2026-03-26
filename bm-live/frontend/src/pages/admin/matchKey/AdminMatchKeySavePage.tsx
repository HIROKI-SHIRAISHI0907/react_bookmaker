import React, { useEffect, useState } from "react";
type MatchKeySaveListResponse = { count: number; matchKeys: string[] };
async function fetchJsonStrict<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: "include", ...init, headers: { Accept: "application/json", ...(init?.headers ?? {}) } });
  const ct = res.headers.get("content-type") ?? "";
  const text = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error([`HTTP ${res.status} ${res.statusText}`, `url: ${res.url}`, `content-type: ${ct}`, text ? `body(snippet):\n${text.slice(0, 400)}` : ""].filter(Boolean).join("\n"));
  }
  if (!ct.includes("application/json")) {
    const hint = text.includes("<!DOCTYPE") || text.includes("<html") ? "HTMLが返っています（proxy未設定 or 認証リダイレクトの可能性）" : "JSON以外が返っています";
    throw new Error([`Expected JSON but got: ${ct}`, `hint: ${hint}`, `url: ${res.url}`, text ? `body(snippet):\n${text.slice(0, 400)}` : ""].filter(Boolean).join("\n"));
  }
  return JSON.parse(text) as T;
}

export default function AdminMatchKeySavePage() {
  const [data, setData] = useState<MatchKeySaveListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchJsonStrict<MatchKeySaveListResponse>("/v1/api/admin/match-key-save", { method: "GET" });
      setData(res);
    } catch (e: any) {
      setError(String(e?.message ?? e));
      setData(null);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const matchKeys = data?.matchKeys ?? [];
  return (
    <div style={{ display: "grid", gap: 16 }}>
      {" "}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        {" "}
        <div>
          {" "}
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}> マッチキーチェック </h1>{" "}
          <div style={{ marginTop: 6, color: "#666", fontSize: 14 }}> match_key_save テーブルに登録されている match_key を確認します。 </div>{" "}
        </div>{" "}
        <button
          type="button"
          onClick={load}
          disabled={loading}
          style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", background: loading ? "#f3f4f6" : "#fff", cursor: loading ? "default" : "pointer", fontWeight: 700 }}
        >
          {" "}
          {loading ? "読み込み中..." : "再読み込み"}{" "}
        </button>{" "}
      </div>{" "}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        {" "}
        <div style={{ padding: "6px 10px", borderRadius: 999, background: "#eef2ff", color: "#3730a3", fontWeight: 700, fontSize: 13 }}> 件数: {data?.count ?? 0} </div>{" "}
        {loading && <div style={{ padding: "6px 10px", borderRadius: 999, background: "#f3f4f6", color: "#374151", fontWeight: 700, fontSize: 13 }}> 取得中 </div>}{" "}
        {error && <div style={{ padding: "6px 10px", borderRadius: 999, background: "#fef2f2", color: "#991b1b", fontWeight: 700, fontSize: 13 }}> 取得失敗 </div>}{" "}
      </div>{" "}
      {error && (
        <pre style={{ margin: 0, whiteSpace: "pre-wrap", padding: 12, borderRadius: 12, border: "1px solid #fecaca", background: "#fef2f2", color: "#7f1d1d", fontSize: 12, overflowX: "auto" }}>
          {" "}
          {error}{" "}
        </pre>
      )}{" "}
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 16, background: "#fff", overflow: "hidden" }}>
        {" "}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", fontWeight: 800, background: "#f9fafb" }}> match_key 一覧 </div>{" "}
        {matchKeys.length === 0 ? (
          <div style={{ padding: 16, color: "#666", fontSize: 14 }}> {loading ? "読み込み中です..." : "データがありません。"} </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            {" "}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              {" "}
              <thead style={{ background: "#f9fafb" }}>
                {" "}
                <tr>
                  {" "}
                  <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "1px solid #e5e7eb", width: 80 }}> No </th>{" "}
                  <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "1px solid #e5e7eb" }}> match_key </th>{" "}
                </tr>{" "}
              </thead>{" "}
              <tbody>
                {" "}
                {matchKeys.map((key, idx) => (
                  <tr key={`${key}_${idx}`}>
                    {" "}
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", color: "#64748b" }}> {idx + 1} </td>{" "}
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", fontWeight: 600 }}>
                      {" "}
                      {key}{" "}
                    </td>{" "}
                  </tr>
                ))}{" "}
              </tbody>{" "}
            </table>{" "}
          </div>
        )}{" "}
      </div>{" "}
    </div>
  );
}
