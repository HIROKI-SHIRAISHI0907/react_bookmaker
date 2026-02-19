import React, { useEffect, useMemo, useState } from "react";

type TableName = "FUTURE_MASTER" | "DATA";

type FutureMasterIngestSummaryDTO = {
  seq: number;
  gameTeamCategory: string | null;
  futureTime: string | null;
  homeTeamName: string | null;
  awayTeamName: string | null;
  gameLink: string | null;
  startFlg: string | null;
};

type DataIngestSummaryDTO = {
  seq: string;
  dataCategory: string | null;
  times: string | null;
  homeTeamName: string | null;
  awayTeamName: string | null;
  recordTime: string | null;
};

type IngestedRowDTO = {
  table: TableName;
  seq: string;
  registerTime: string; // OffsetDateTime をISO文字列で受け取る想定
  updateTime?: string | null;
  future?: FutureMasterIngestSummaryDTO | null;
  data?: DataIngestSummaryDTO | null;
};

type IngestedDataReferenceResponse = {
  from: string;
  to: string;
  rows: IngestedRowDTO[];
  total: number;
};

function toDatetimeLocalValue(iso: string) {
  // ISO → datetime-local 形式（秒は落とす）
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function fromDatetimeLocalValue(v: string) {
  // datetime-local はローカルタイム扱い → ISO化
  // 例: 2026-02-19T10:00 → new Date(...) でローカルとして解釈 → toISOString() はUTC
  const d = new Date(v);
  return d.toISOString();
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export default function IngestedDataReferencePage() {
  // 初期：直近7日
  const now = useMemo(() => new Date(), []);
  const [fromLocal, setFromLocal] = useState(() => toDatetimeLocalValue(addDays(now, -7).toISOString()));
  const [toLocal, setToLocal] = useState(() => toDatetimeLocalValue(now.toISOString()));

  const [includeFuture, setIncludeFuture] = useState(true);
  const [includeData, setIncludeData] = useState(true);

  const [limit, setLimit] = useState(100);
  const [offset, setOffset] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [res, setRes] = useState<IngestedDataReferenceResponse | null>(null);

  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const tableFilter: TableName[] = useMemo(() => {
    const t: TableName[] = [];
    if (includeFuture) t.push("FUTURE_MASTER");
    if (includeData) t.push("DATA");
    return t;
  }, [includeFuture, includeData]);

  const canSearch = tableFilter.length > 0;

  async function fetchRows(nextOffset: number) {
    if (!canSearch) return;

    setLoading(true);
    setError(null);

    try {
      const fromIso = fromDatetimeLocalValue(fromLocal);
      const toIso = fromDatetimeLocalValue(toLocal);

      const params = new URLSearchParams();
      params.set("from", fromIso);
      params.set("to", toIso);
      params.set("includeFutureMaster", String(includeFuture));
      params.set("includeData", String(includeData));
      params.set("limit", String(limit));
      params.set("offset", String(nextOffset));

      const r = await fetch(`/v1/api/admin/ingested?${params.toString()}`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (!r.ok) {
        const txt = await r.text().catch(() => "");
        throw new Error(`HTTP ${r.status} ${r.statusText} ${txt}`);
      }

      const json = (await r.json()) as IngestedDataReferenceResponse;
      setRes(json);
      setOffset(nextOffset);
      setExpandedKey(null);
    } catch (e: any) {
      setError(e?.message ?? "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // 初回ロード
    fetchRows(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = res?.rows ?? [];
  const total = res?.total ?? 0;

  const page = Math.floor(offset / limit) + 1;
  const maxPage = Math.max(1, Math.ceil(total / limit));

  const headerStyle: React.CSSProperties = { fontWeight: 800, fontSize: 18, marginBottom: 12 };
  const cardStyle: React.CSSProperties = {
    border: "1px solid #eee",
    borderRadius: 12,
    padding: 12,
    background: "white",
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={headerStyle}>投入済みデータ参照管理</div>

      <div style={{ ...cardStyle }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "end" }}>
          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, color: "#555" }}>From</div>
            <input type="datetime-local" value={fromLocal} onChange={(e) => setFromLocal(e.target.value)} style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd" }} />
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, color: "#555" }}>To</div>
            <input type="datetime-local" value={toLocal} onChange={(e) => setToLocal(e.target.value)} style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd" }} />
          </div>

          <button
            onClick={() => fetchRows(0)}
            disabled={loading || !canSearch}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: loading || !canSearch ? "#f3f4f6" : "white",
              cursor: loading || !canSearch ? "not-allowed" : "pointer",
              fontWeight: 700,
            }}
          >
            検索
          </button>
        </div>

        <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" checked={includeFuture} onChange={(e) => setIncludeFuture(e.target.checked)} />
            FUTURE_MASTER
          </label>

          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" checked={includeData} onChange={(e) => setIncludeData(e.target.checked)} />
            DATA
          </label>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#555" }}>limit</span>
            <select
              value={limit}
              onChange={(e) => {
                const v = Number(e.target.value);
                setLimit(v);
                // limit変更は先頭から見直すのが自然
                fetchRows(0);
              }}
              style={{ padding: 6, borderRadius: 8, border: "1px solid #ddd" }}
            >
              {[25, 50, 100, 200, 500].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginLeft: "auto", fontSize: 12, color: "#555" }}>
            total: <b>{total}</b> / page: <b>{page}</b> / <b>{maxPage}</b>
          </div>
        </div>

        {!canSearch && <div style={{ marginTop: 10, color: "#b91c1c", fontSize: 13 }}>テーブルを最低1つ選択してください。</div>}

        {error && <div style={{ marginTop: 10, color: "#b91c1c", fontSize: 13 }}>{error}</div>}
      </div>

      <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: 12, borderBottom: "1px solid #eee", fontWeight: 800 }}>一覧（新しい順）</div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fafafa" }}>
                {["table", "seq", "registerTime", "updateTime", "summary"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: 10,
                      borderBottom: "1px solid #eee",
                      fontSize: 12,
                      color: "#555",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} style={{ padding: 12 }}>
                    読み込み中…
                  </td>
                </tr>
              )}

              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 12 }}>
                    対象データがありません。
                  </td>
                </tr>
              )}

              {!loading &&
                rows.map((r) => {
                  const key = `${r.table}:${r.seq}:${r.registerTime}`;
                  const expanded = expandedKey === key;

                  const summary =
                    r.table === "FUTURE_MASTER"
                      ? `${r.future?.homeTeamName ?? "-"} vs ${r.future?.awayTeamName ?? "-"} / ${r.future?.gameTeamCategory ?? "-"}`
                      : `${r.data?.homeTeamName ?? "-"} vs ${r.data?.awayTeamName ?? "-"} / ${r.data?.dataCategory ?? "-"}`;

                  return (
                    <React.Fragment key={key}>
                      <tr onClick={() => setExpandedKey(expanded ? null : key)} style={{ cursor: "pointer" }}>
                        <td style={{ padding: 10, borderBottom: "1px solid #eee", whiteSpace: "nowrap" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "2px 8px",
                              borderRadius: 999,
                              border: "1px solid #ddd",
                              fontSize: 12,
                              background: "white",
                            }}
                          >
                            {r.table}
                          </span>
                        </td>

                        <td style={{ padding: 10, borderBottom: "1px solid #eee", whiteSpace: "nowrap" }}>{r.seq}</td>

                        <td style={{ padding: 10, borderBottom: "1px solid #eee", whiteSpace: "nowrap" }}>{new Date(r.registerTime).toLocaleString()}</td>

                        <td style={{ padding: 10, borderBottom: "1px solid #eee", whiteSpace: "nowrap" }}>{r.updateTime ? new Date(r.updateTime).toLocaleString() : "-"}</td>

                        <td style={{ padding: 10, borderBottom: "1px solid #eee" }}>{summary}</td>
                      </tr>

                      {expanded && (
                        <tr>
                          <td colSpan={5} style={{ padding: 12, borderBottom: "1px solid #eee", background: "#fcfcfc" }}>
                            {r.table === "FUTURE_MASTER" ? (
                              <div style={{ display: "grid", gap: 6 }}>
                                <div>
                                  <b>gameTeamCategory</b>: {r.future?.gameTeamCategory ?? "-"}
                                </div>
                                <div>
                                  <b>futureTime</b>: {r.future?.futureTime ?? "-"}
                                </div>
                                <div>
                                  <b>home</b>: {r.future?.homeTeamName ?? "-"}
                                </div>
                                <div>
                                  <b>away</b>: {r.future?.awayTeamName ?? "-"}
                                </div>
                                <div>
                                  <b>gameLink</b>: {r.future?.gameLink ?? "-"}
                                </div>
                                <div>
                                  <b>startFlg</b>: {r.future?.startFlg ?? "-"}
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: "grid", gap: 6 }}>
                                <div>
                                  <b>dataCategory</b>: {r.data?.dataCategory ?? "-"}
                                </div>
                                <div>
                                  <b>times</b>: {r.data?.times ?? "-"}
                                </div>
                                <div>
                                  <b>home</b>: {r.data?.homeTeamName ?? "-"}
                                </div>
                                <div>
                                  <b>away</b>: {r.data?.awayTeamName ?? "-"}
                                </div>
                                <div>
                                  <b>recordTime</b>: {r.data?.recordTime ?? "-"}
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", gap: 8, padding: 12, justifyContent: "flex-end" }}>
          <button
            onClick={() => fetchRows(Math.max(0, offset - limit))}
            disabled={loading || offset <= 0}
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: "white",
              cursor: loading || offset <= 0 ? "not-allowed" : "pointer",
              fontWeight: 700,
            }}
          >
            前へ
          </button>

          <button
            onClick={() => fetchRows(offset + limit)}
            disabled={loading || offset + limit >= total}
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: "white",
              cursor: loading || offset + limit >= total ? "not-allowed" : "pointer",
              fontWeight: 700,
            }}
          >
            次へ
          </button>
        </div>
      </div>
    </div>
  );
}
