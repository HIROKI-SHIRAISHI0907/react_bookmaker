import React, { useMemo, useState } from "react";

/** ============ 共通 ============ */
type TabKey = "season" | "league" | "member";

function hasText(s: any) {
  return s != null && String(s).trim() !== "";
}

async function postJson<T>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${text ? `: ${text}` : ""}`);
  }
  return res.json();
}

function normalizeInputValue(v: any) {
  // input value は null を渡せないので空文字にする
  return v == null ? "" : String(v);
}

function toNullableString(v: string) {
  // 「空欄にしたらDBもNULLにしたい」想定の場合はここを null に寄せる
  // もし「空欄は空文字で保存したい」なら return v; にしてください
  const t = v.trim();
  return t === "" ? null : t;
}

/** ============ Season ============ */
type SeasonCond = {
  country: string;
  league: string;
  seasonYear: string;
  path: string;
  delFlg: string;
};

type SeasonRow = {
  id: string;
  country: string | null;
  league: string | null;
  seasonYear: string | null;
  path: string | null;
  delFlg: string | null;
};

type SeasonRowUi = SeasonRow & { _dirty: boolean };

/** ============ League ============ */
type LeagueCond = {
  country: string;
  league: string;
  team: string;
  link: string;
  delFlg: string;
};

type LeagueRow = {
  id: string;
  country: string | null;
  league: string | null;
  team: string | null;
  link: string | null;
  delFlg: string | null;
};

type LeagueRowUi = LeagueRow & { _dirty: boolean };

/** ============ Member ============ */
type MemberCond = {
  country: string;
  league: string;
  team: string;
  member: string; // LIKE
  position: string;
  delFlg: string;
};

type MemberRow = {
  id: string;

  country: string | null;
  league: string | null;
  team: string | null;

  jersey: string | null;
  member: string | null;

  position: string | null;
  birth: string | null;
  age: string | null;

  height: string | null;
  weight: string | null;

  marketValue: string | null;
  injury: string | null;

  delFlg: string | null;
};

type MemberRowUi = MemberRow & { _dirty: boolean };

/** ============ UI共通 ============ */
const inputStyle: React.CSSProperties = {
  padding: "8px 10px",
  border: "1px solid #ddd",
  borderRadius: 8,
  width: "100%",
  background: "white",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: 10,
  borderBottom: "1px solid #eee",
  fontSize: 12,
  color: "#666",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: 10,
  borderBottom: "1px solid #f2f2f2",
  verticalAlign: "top",
};

function TabButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 12px",
        borderRadius: 10,
        border: "1px solid #ddd",
        background: active ? "#f3f4f6" : "white",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

export default function ScrapeDefectPage() {
  const [tab, setTab] = useState<TabKey>("season");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  /** ===== Season state ===== */
  const [seasonCond, setSeasonCond] = useState<SeasonCond>({
    country: "",
    league: "",
    seasonYear: "",
    path: "",
    delFlg: "",
  });
  const [seasonRows, setSeasonRows] = useState<SeasonRowUi[]>([]);

  /** ===== League state ===== */
  const [leagueCond, setLeagueCond] = useState<LeagueCond>({
    country: "",
    league: "",
    team: "",
    link: "",
    delFlg: "",
  });
  const [leagueRows, setLeagueRows] = useState<LeagueRowUi[]>([]);

  /** ===== Member state ===== */
  const [memberCond, setMemberCond] = useState<MemberCond>({
    country: "",
    league: "",
    team: "",
    member: "",
    position: "",
    delFlg: "",
  });
  const [memberRows, setMemberRows] = useState<MemberRowUi[]>([]);

  const dirtyCount = useMemo(() => {
    if (tab === "season") return seasonRows.filter((r) => r._dirty).length;
    if (tab === "league") return leagueRows.filter((r) => r._dirty).length;
    return memberRows.filter((r) => r._dirty).length;
  }, [tab, seasonRows, leagueRows, memberRows]);

  /** ========================= 検索 ========================= */
  async function onSearch() {
    setLoading(true);
    setMessage("");
    try {
      if (tab === "season") {
        const data = await getJson<SeasonRow[]>("/v1/api/country-league-season-master/search", seasonCond);
        setSeasonRows(data.map((r) => ({ ...r, _dirty: false })));
        setMessage(`Season 検索結果: ${data.length}件`);
      } else if (tab === "league") {
        const data = await getJson<LeagueRow[]>("/v1/api/country-league-master/search", leagueCond);
        setLeagueRows(data.map((r) => ({ ...r, _dirty: false })));
        setMessage(`League 検索結果: ${data.length}件`);
      } else {
        const data = await getJson<MemberRow[]>("/v1/api/team-member-master/search", memberCond);
        setMemberRows(data.map((r) => ({ ...r, _dirty: false })));
        setMessage(`Member 検索結果: ${data.length}件`);
      }
    } catch (e: any) {
      setMessage(e?.message ?? "検索でエラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  function buildQuery(params: Record<string, any>) {
    const q = new URLSearchParams();

    Object.entries(params ?? {}).forEach(([k, v]) => {
      if (v == null) return;

      // 空文字は送らない（必要ならこのif外してOK）
      const s = String(v).trim();
      if (s === "") return;

      q.set(k, s);
    });

    const qs = q.toString();
    return qs ? `?${qs}` : "";
  }

  async function getJson<T>(url: string, params?: Record<string, any>): Promise<T> {
    const res = await fetch(`${url}${buildQuery(params ?? {})}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`${res.status} ${res.statusText}${text ? `: ${text}` : ""}`);
    }
    return res.json();
  }

  /** ========================= 保存（dirtyのみ） ========================= */
  async function onSaveDirty() {
    setLoading(true);
    setMessage("");
    try {
      if (tab === "season") {
        const dirty = seasonRows.filter((r) => r._dirty);
        for (const r of dirty) {
          await postJson<number>("/v1/api/country-league-season-master/update", {
            ...r,
            // inputから来る値は string なので、空欄はNULLに寄せる
            country: toNullableString(normalizeInputValue(r.country)),
            league: toNullableString(normalizeInputValue(r.league)),
            seasonYear: toNullableString(normalizeInputValue(r.seasonYear)),
            path: toNullableString(normalizeInputValue(r.path)),
            delFlg: toNullableString(normalizeInputValue(r.delFlg)),
          });
        }
        await onSearch();
        setMessage(`Season 保存完了: ${dirty.length}件`);
      } else if (tab === "league") {
        const dirty = leagueRows.filter((r) => r._dirty);
        for (const r of dirty) {
          await postJson<number>("/v1/api/country-league-master/update", {
            ...r,
            country: toNullableString(normalizeInputValue(r.country)),
            league: toNullableString(normalizeInputValue(r.league)),
            team: toNullableString(normalizeInputValue(r.team)),
            link: toNullableString(normalizeInputValue(r.link)),
            delFlg: toNullableString(normalizeInputValue(r.delFlg)),
          });
        }
        await onSearch();
        setMessage(`League 保存完了: ${dirty.length}件`);
      } else {
        const dirty = memberRows.filter((r) => r._dirty);
        for (const r of dirty) {
          await postJson<number>("/v1/api/team-member-master/update", {
            ...r,
            country: toNullableString(normalizeInputValue(r.country)),
            league: toNullableString(normalizeInputValue(r.league)),
            team: toNullableString(normalizeInputValue(r.team)),
            jersey: toNullableString(normalizeInputValue(r.jersey)),
            member: toNullableString(normalizeInputValue(r.member)),
            position: toNullableString(normalizeInputValue(r.position)),
            birth: toNullableString(normalizeInputValue(r.birth)),
            age: toNullableString(normalizeInputValue(r.age)),
            height: toNullableString(normalizeInputValue(r.height)),
            weight: toNullableString(normalizeInputValue(r.weight)),
            marketValue: toNullableString(normalizeInputValue(r.marketValue)),
            injury: toNullableString(normalizeInputValue(r.injury)),
            delFlg: toNullableString(normalizeInputValue(r.delFlg)),
          });
        }
        await onSearch();
        setMessage(`Member 保存完了: ${dirty.length}件`);
      }
    } catch (e: any) {
      setMessage(e?.message ?? "保存でエラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  /** ========================= セル更新 ========================= */
  function updateSeasonCell(index: number, key: keyof SeasonRow, value: string) {
    setSeasonRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value, _dirty: true } as any;
      return next;
    });
  }

  function updateLeagueCell(index: number, key: keyof LeagueRow, value: string) {
    setLeagueRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value, _dirty: true } as any;
      return next;
    });
  }

  function updateMemberCell(index: number, key: keyof MemberRow, value: string) {
    setMemberRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value, _dirty: true } as any;
      return next;
    });
  }

  /** ========================= 画面 ========================= */
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ fontSize: 18, fontWeight: 800 }}>スクレイピングデータ欠陥値設定（DBメンテ）</div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <TabButton active={tab === "season"} onClick={() => setTab("season")}>
          Season Master
        </TabButton>
        <TabButton active={tab === "league"} onClick={() => setTab("league")}>
          Country League Master
        </TabButton>
        <TabButton active={tab === "member"} onClick={() => setTab("member")}>
          Team Member Master
        </TabButton>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={onSearch} disabled={loading} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #ddd" }}>
            検索
          </button>
          <button onClick={onSaveDirty} disabled={loading || dirtyCount === 0} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #ddd" }}>
            変更分を保存（{dirtyCount}件）
          </button>
        </div>
      </div>

      {/* Message */}
      {message && <div style={{ fontSize: 12, color: "#333", padding: "8px 10px", border: "1px solid #eee", borderRadius: 10 }}>{message}</div>}

      {/* Search form */}
      <div style={{ padding: 12, border: "1px solid #eee", borderRadius: 12 }}>
        {tab === "season" && (
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontWeight: 700 }}>検索条件（Season）</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
              <div>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>country</div>
                <input style={inputStyle} value={seasonCond.country} onChange={(e) => setSeasonCond({ ...seasonCond, country: e.target.value })} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>league</div>
                <input style={inputStyle} value={seasonCond.league} onChange={(e) => setSeasonCond({ ...seasonCond, league: e.target.value })} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>seasonYear</div>
                <input style={inputStyle} value={seasonCond.seasonYear} onChange={(e) => setSeasonCond({ ...seasonCond, seasonYear: e.target.value })} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>path（部分一致）</div>
                <input style={inputStyle} value={seasonCond.path} onChange={(e) => setSeasonCond({ ...seasonCond, path: e.target.value })} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>delFlg</div>
                <input style={inputStyle} value={seasonCond.delFlg} onChange={(e) => setSeasonCond({ ...seasonCond, delFlg: e.target.value })} placeholder="0/1" />
              </div>
            </div>
          </div>
        )}

        {tab === "league" && (
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontWeight: 700 }}>検索条件（CountryLeague）</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
              <div>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>country</div>
                <input style={inputStyle} value={leagueCond.country} onChange={(e) => setLeagueCond({ ...leagueCond, country: e.target.value })} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>league</div>
                <input style={inputStyle} value={leagueCond.league} onChange={(e) => setLeagueCond({ ...leagueCond, league: e.target.value })} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>team</div>
                <input style={inputStyle} value={leagueCond.team} onChange={(e) => setLeagueCond({ ...leagueCond, team: e.target.value })} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>link（部分一致）</div>
                <input style={inputStyle} value={leagueCond.link} onChange={(e) => setLeagueCond({ ...leagueCond, link: e.target.value })} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>delFlg</div>
                <input style={inputStyle} value={leagueCond.delFlg} onChange={(e) => setLeagueCond({ ...leagueCond, delFlg: e.target.value })} placeholder="0/1" />
              </div>
            </div>
          </div>
        )}

        {tab === "member" && (
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontWeight: 700 }}>検索条件（TeamMember）</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
              <div>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>country</div>
                <input style={inputStyle} value={memberCond.country} onChange={(e) => setMemberCond({ ...memberCond, country: e.target.value })} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>league</div>
                <input style={inputStyle} value={memberCond.league} onChange={(e) => setMemberCond({ ...memberCond, league: e.target.value })} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>team</div>
                <input style={inputStyle} value={memberCond.team} onChange={(e) => setMemberCond({ ...memberCond, team: e.target.value })} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>member（部分一致）</div>
                <input style={inputStyle} value={memberCond.member} onChange={(e) => setMemberCond({ ...memberCond, member: e.target.value })} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>position</div>
                <input style={inputStyle} value={memberCond.position} onChange={(e) => setMemberCond({ ...memberCond, position: e.target.value })} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>delFlg</div>
                <input style={inputStyle} value={memberCond.delFlg} onChange={(e) => setMemberCond({ ...memberCond, delFlg: e.target.value })} placeholder="0/1" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Result table */}
      <div style={{ overflowX: "auto", border: "1px solid #eee", borderRadius: 12 }}>
        {tab === "season" && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fafafa" }}>
                <th style={thStyle}>id</th>
                <th style={thStyle}>country</th>
                <th style={thStyle}>league</th>
                <th style={thStyle}>seasonYear</th>
                <th style={thStyle}>path</th>
                <th style={thStyle}>delFlg</th>
                <th style={thStyle}>changed</th>
              </tr>
            </thead>
            <tbody>
              {seasonRows.map((r, i) => (
                <tr key={r.id ?? i}>
                  <td style={tdStyle} title={r.id}>
                    {r.id}
                  </td>
                  <td style={tdStyle}>
                    <input style={inputStyle} value={normalizeInputValue(r.country)} onChange={(e) => updateSeasonCell(i, "country", e.target.value)} />
                  </td>
                  <td style={tdStyle}>
                    <input style={inputStyle} value={normalizeInputValue(r.league)} onChange={(e) => updateSeasonCell(i, "league", e.target.value)} />
                  </td>
                  <td style={tdStyle}>
                    <input style={inputStyle} value={normalizeInputValue(r.seasonYear)} onChange={(e) => updateSeasonCell(i, "seasonYear", e.target.value)} />
                  </td>
                  <td style={tdStyle}>
                    <input style={inputStyle} value={normalizeInputValue(r.path)} onChange={(e) => updateSeasonCell(i, "path", e.target.value)} />
                  </td>
                  <td style={tdStyle}>
                    <input style={inputStyle} value={normalizeInputValue(r.delFlg)} onChange={(e) => updateSeasonCell(i, "delFlg", e.target.value)} placeholder="0/1" />
                  </td>
                  <td style={{ ...tdStyle, fontSize: 12, color: r._dirty ? "#111" : "#999" }}>{r._dirty ? "●" : "-"}</td>
                </tr>
              ))}
              {seasonRows.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: 16, color: "#666", fontSize: 12 }}>
                    検索結果がここに表示されます
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {tab === "league" && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fafafa" }}>
                <th style={thStyle}>id</th>
                <th style={thStyle}>country</th>
                <th style={thStyle}>league</th>
                <th style={thStyle}>team</th>
                <th style={thStyle}>link</th>
                <th style={thStyle}>delFlg</th>
                <th style={thStyle}>changed</th>
              </tr>
            </thead>
            <tbody>
              {leagueRows.map((r, i) => (
                <tr key={r.id ?? i}>
                  <td style={tdStyle} title={r.id}>
                    {r.id}
                  </td>
                  <td style={tdStyle}>
                    <input style={inputStyle} value={normalizeInputValue(r.country)} onChange={(e) => updateLeagueCell(i, "country", e.target.value)} />
                  </td>
                  <td style={tdStyle}>
                    <input style={inputStyle} value={normalizeInputValue(r.league)} onChange={(e) => updateLeagueCell(i, "league", e.target.value)} />
                  </td>
                  <td style={tdStyle}>
                    <input style={inputStyle} value={normalizeInputValue(r.team)} onChange={(e) => updateLeagueCell(i, "team", e.target.value)} />
                  </td>
                  <td style={tdStyle}>
                    <input style={inputStyle} value={normalizeInputValue(r.link)} onChange={(e) => updateLeagueCell(i, "link", e.target.value)} />
                  </td>
                  <td style={tdStyle}>
                    <input style={inputStyle} value={normalizeInputValue(r.delFlg)} onChange={(e) => updateLeagueCell(i, "delFlg", e.target.value)} placeholder="0/1" />
                  </td>
                  <td style={{ ...tdStyle, fontSize: 12, color: r._dirty ? "#111" : "#999" }}>{r._dirty ? "●" : "-"}</td>
                </tr>
              ))}
              {leagueRows.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: 16, color: "#666", fontSize: 12 }}>
                    検索結果がここに表示されます
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {tab === "member" && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fafafa" }}>
                <th style={thStyle}>id</th>
                <th style={thStyle}>country</th>
                <th style={thStyle}>league</th>
                <th style={thStyle}>team</th>
                <th style={thStyle}>jersey</th>
                <th style={thStyle}>member</th>
                <th style={thStyle}>position</th>
                <th style={thStyle}>birth</th>
                <th style={thStyle}>age</th>
                <th style={thStyle}>height</th>
                <th style={thStyle}>weight</th>
                <th style={thStyle}>marketValue</th>
                <th style={thStyle}>injury</th>
                <th style={thStyle}>delFlg</th>
                <th style={thStyle}>changed</th>
              </tr>
            </thead>
            <tbody>
              {memberRows.map((r, i) => (
                <tr key={r.id ?? i}>
                  <td style={tdStyle} title={r.id}>
                    {r.id}
                  </td>

                  <td style={tdStyle}>
                    <input style={inputStyle} value={normalizeInputValue(r.country)} onChange={(e) => updateMemberCell(i, "country", e.target.value)} />
                  </td>
                  <td style={tdStyle}>
                    <input style={inputStyle} value={normalizeInputValue(r.league)} onChange={(e) => updateMemberCell(i, "league", e.target.value)} />
                  </td>
                  <td style={tdStyle}>
                    <input style={inputStyle} value={normalizeInputValue(r.team)} onChange={(e) => updateMemberCell(i, "team", e.target.value)} />
                  </td>

                  <td style={tdStyle}>
                    <input style={inputStyle} value={normalizeInputValue(r.jersey)} onChange={(e) => updateMemberCell(i, "jersey", e.target.value)} />
                  </td>
                  <td style={tdStyle}>
                    <input style={inputStyle} value={normalizeInputValue(r.member)} onChange={(e) => updateMemberCell(i, "member", e.target.value)} />
                  </td>

                  <td style={tdStyle}>
                    <input style={inputStyle} value={normalizeInputValue(r.position)} onChange={(e) => updateMemberCell(i, "position", e.target.value)} />
                  </td>
                  <td style={tdStyle}>
                    <input style={inputStyle} value={normalizeInputValue(r.birth)} onChange={(e) => updateMemberCell(i, "birth", e.target.value)} />
                  </td>
                  <td style={tdStyle}>
                    <input style={inputStyle} value={normalizeInputValue(r.age)} onChange={(e) => updateMemberCell(i, "age", e.target.value)} />
                  </td>

                  <td style={tdStyle}>
                    <input style={inputStyle} value={normalizeInputValue(r.height)} onChange={(e) => updateMemberCell(i, "height", e.target.value)} />
                  </td>
                  <td style={tdStyle}>
                    <input style={inputStyle} value={normalizeInputValue(r.weight)} onChange={(e) => updateMemberCell(i, "weight", e.target.value)} />
                  </td>

                  <td style={tdStyle}>
                    <input style={inputStyle} value={normalizeInputValue(r.marketValue)} onChange={(e) => updateMemberCell(i, "marketValue", e.target.value)} />
                  </td>
                  <td style={tdStyle}>
                    <input style={inputStyle} value={normalizeInputValue(r.injury)} onChange={(e) => updateMemberCell(i, "injury", e.target.value)} />
                  </td>

                  <td style={tdStyle}>
                    <input style={inputStyle} value={normalizeInputValue(r.delFlg)} onChange={(e) => updateMemberCell(i, "delFlg", e.target.value)} placeholder="0/1" />
                  </td>

                  <td style={{ ...tdStyle, fontSize: 12, color: r._dirty ? "#111" : "#999" }}>{r._dirty ? "●" : "-"}</td>
                </tr>
              ))}
              {memberRows.length === 0 && (
                <tr>
                  <td colSpan={15} style={{ padding: 16, color: "#666", fontSize: 12 }}>
                    検索結果がここに表示されます
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* hint */}
      <div style={{ fontSize: 12, color: "#666" }}>
        空欄で保存すると <b>NULL</b> で更新します（`toNullableString()` の仕様）。空文字で保存したい場合は `toNullableString()` を調整してください。
      </div>
    </div>
  );
}
