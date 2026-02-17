// src/pages/admin/DataFetchAdminPage.tsx
import React, { useMemo, useState } from "react";

type StatRequestResource = {
  country?: string;
  league?: string;
  season?: string;
  // ここはあなたのDTOに合わせて増やしてOK
};

type StatResponseResource = {
  returnCd?: string;
  taskArn?: string;
  // 追加フィールドがあるならここも増やす
};

type TaskDef = {
  key: string;
  title: string;
  description: string;
  endpoint: string; // Springの@PostMappingのパス
  defaultBody?: StatRequestResource;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ""; // 例: http://localhost:8080 など

export default function DataFetchAdminPage() {
  const tasks: TaskDef[] = useMemo(
    () => [
      {
        key: "B002",
        title: "選手情報取得（B002）",
        description: "POST /v1/api/admin/exec/task/country-league-team-member → B002 を起動",
        endpoint: "/v1/api/admin/exec/task/country-league-team-member",
      },
      {
        key: "B003",
        title: "国リーグ別シーズン開始情報取得（B003）",
        description: "POST /v1/api/admin/exec/task/country-league-season → B003 を起動",
        endpoint: "/v1/api/admin/exec/task/country-league-season",
      },
      {
        key: "B004",
        title: "チーム名情報取得（B004）",
        description: "POST /v1/api/admin/exec/task/country-league → B004 を起動",
        endpoint: "/v1/api/admin/exec/task/country-league",
      },
      {
        key: "B005",
        title: "試合予定データ取得（B005）",
        description: "POST /v1/api/admin/exec/task/future → B005 を起動",
        endpoint: "/v1/api/admin/exec/task/future",
      },
      {
        key: "B006",
        title: "統計CSVデータ生成（B006）",
        description: "POST /v1/api/admin/export/statCsv → B006 を起動",
        endpoint: "/v1/api/admin/export/statCsv",
      },
      {
        key: "B006",
        title: "統計CSVデータ取り入れ実行（B006）",
        description: "POST /v1/api/stat → applicationのB006 を起動",
        endpoint: "/v1/api/stat",
      },
      {
        key: "B008",
        title: "開催中データ取得（B008）",
        description: "POST /v1/api/admin/exec/task/bm-data → B008 を起動",
        endpoint: "/v1/api/admin/exec/task/bm-data",
      },
    ],
    [],
  );

  const [country, setCountry] = useState("");
  const [league, setLeague] = useState("");
  const [season, setSeason] = useState("");

  // 実行結果をタスクごとに保持
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, StatResponseResource | null>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const buildBody = (): StatRequestResource => {
    // 空文字は送らない（nullも送らない想定）
    const body: StatRequestResource = {};
    if (country.trim()) body.country = country.trim();
    if (league.trim()) body.league = league.trim();
    if (season.trim()) body.season = season.trim();
    return body;
  };

  const runTask = async (t: TaskDef) => {
    setLoadingKey(t.key);
    setErrors((p) => ({ ...p, [t.key]: null }));

    try {
      const res = await fetch(`${API_BASE}${t.endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // 認証/セッション使ってるなら必要。不要なら消してOK
        body: JSON.stringify(buildBody()),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${res.statusText}${text ? `: ${text}` : ""}`);
      }

      const json = (await res.json()) as StatResponseResource;
      setResults((p) => ({ ...p, [t.key]: json }));
    } catch (e: any) {
      setErrors((p) => ({ ...p, [t.key]: e?.message ?? "unknown error" }));
      setResults((p) => ({ ...p, [t.key]: null }));
    } finally {
      setLoadingKey(null);
    }
  };

  const cardStyle: React.CSSProperties = {
    border: "1px solid #eee",
    borderRadius: 12,
    padding: 14,
    background: "white",
  };

  const labelStyle: React.CSSProperties = { fontSize: 12, color: "#666" };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h2 style={{ margin: 0 }}>データ取得管理</h2>

      <div style={{ ...cardStyle, display: "grid", gap: 10 }}>
        <div style={{ fontWeight: 700 }}>リクエストパラメータ（任意）</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <div>
            <div style={labelStyle}>country</div>
            <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="例: JP" style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }} />
          </div>
          <div>
            <div style={labelStyle}>league</div>
            <input value={league} onChange={(e) => setLeague(e.target.value)} placeholder="例: J1" style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }} />
          </div>
          <div>
            <div style={labelStyle}>season</div>
            <input value={season} onChange={(e) => setSeason(e.target.value)} placeholder="例: 2025" style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }} />
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#666" }}>※ Spring側で env に詰める想定なら、ここで入力 → request body に入れて送る → runner 側で env 反映、の流れにできます。</div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {tasks.map((t) => {
          const isLoading = loadingKey === t.key;
          const result = results[t.key];
          const err = errors[t.key];

          return (
            <div key={t.key} style={{ ...cardStyle, display: "grid", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 800 }}>{t.title}</div>
                  <div style={{ fontSize: 12, color: "#666" }}>{t.description}</div>
                  <div style={{ fontSize: 12, color: "#666" }}>
                    Endpoint: <code>{t.endpoint}</code>
                  </div>
                </div>

                <button
                  onClick={() => runTask(t)}
                  disabled={isLoading}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid #ddd",
                    background: isLoading ? "#f3f4f6" : "white",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    fontWeight: 700,
                  }}
                >
                  {isLoading ? "実行中..." : "実行"}
                </button>
              </div>

              {err && (
                <div style={{ padding: 10, borderRadius: 10, background: "#fff5f5", border: "1px solid #ffd6d6" }}>
                  <div style={{ fontWeight: 700, color: "#b00020" }}>エラー</div>
                  <div style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>{err}</div>
                </div>
              )}

              {result && (
                <div style={{ padding: 10, borderRadius: 10, background: "#f8fafc", border: "1px solid #e5e7eb" }}>
                  <div style={{ fontWeight: 700 }}>結果</div>
                  <div style={{ display: "grid", gap: 6, marginTop: 6, fontSize: 13 }}>
                    <div>
                      returnCd: <code>{result.returnCd ?? "-"}</code>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      taskArn: <code style={{ wordBreak: "break-all" }}>{result.taskArn ?? "-"}</code>
                      {result.taskArn && (
                        <button
                          onClick={() => navigator.clipboard.writeText(result.taskArn!)}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 10,
                            border: "1px solid #ddd",
                            background: "white",
                            cursor: "pointer",
                            fontWeight: 700,
                            fontSize: 12,
                          }}
                        >
                          コピー
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: 12, color: "#666" }}>もしブラウザで叩けない場合は、Spring側の CORS 設定（または認証/CSRF）を確認してください。 例: 別ドメインで叩いてるなら CORS 許可が必要です。</div>
    </div>
  );
}
