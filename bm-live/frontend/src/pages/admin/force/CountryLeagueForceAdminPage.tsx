import React, { useEffect, useMemo, useState, useTransition } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

type CountryLeagueDTO = {
  id: string;
  country: string;
  league: string;
  team: string;
  link: string;
  delFlg: string; // "0" or "1"
};

type ForceAdminRequest = { country: string; league: string; team: string; delFlg: "0" | "1" };
type ForceAdminResponse = { responseCode: string; message: string };

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${await res.text().catch(() => "")}`);
  return res.json();
}
async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${await res.text().catch(() => "")}`);
  return res.json();
}

function uniqSorted(arr: string[]) {
  return Array.from(new Set(arr)).sort((a, b) => a.localeCompare(b, "ja"));
}
function makeKey(country: string, league: string) {
  return `${country}__${league}`;
}

export default function CountryLeagueForceAdminPage() {
  const {
    data: rows,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["countryLeagueMasterAll"],
    queryFn: () => getJson<CountryLeagueDTO[]>("/v1/api/country-league-master"),
  });

  /** ★全件表示（delFlg=1も含む） */
  const allRows = useMemo(() => rows ?? [], [rows]);

  const countries = useMemo(() => uniqSorted(allRows.map((r) => r.country)), [allRows]);

  const leaguesByCountry = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const r of allRows) {
      map.set(r.country, [...(map.get(r.country) ?? []), r.league]);
    }
    for (const [k, v] of map.entries()) map.set(k, uniqSorted(v));
    return map;
  }, [allRows]);

  /** 国×リーグ→ DTO配列（team, delFlg, link など保持したいので string[] ではなくDTO[]にする） */
  const teamsByCountryLeague = useMemo(() => {
    const map = new Map<string, CountryLeagueDTO[]>();
    for (const r of allRows) {
      const key = makeKey(r.country, r.league);
      map.set(key, [...(map.get(key) ?? []), r]);
    }
    // 表示順（team昇順、同名なら delFlg=0 を先に出す等）
    for (const [k, v] of map.entries()) {
      map.set(
        k,
        v.slice().sort((a, b) => {
          const t = a.team.localeCompare(b.team, "ja");
          if (t !== 0) return t;
          return a.delFlg.localeCompare(b.delFlg); // "0" が先
        }),
      );
    }
    return map;
  }, [allRows]);

  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!countries.length) return;
    if (!selectedCountry) setSelectedCountry(countries[0]);
  }, [countries, selectedCountry]);

  useEffect(() => {
    if (!selectedCountry) return;
    const leagues = leaguesByCountry.get(selectedCountry) ?? [];
    if (!leagues.length) {
      setSelectedLeague(null);
      return;
    }
    if (!selectedLeague || !leagues.includes(selectedLeague)) setSelectedLeague(leagues[0]);
  }, [selectedCountry, selectedLeague, leaguesByCountry]);

  const currentLeagues = useMemo(() => {
    if (!selectedCountry) return [];
    return leaguesByCountry.get(selectedCountry) ?? [];
  }, [selectedCountry, leaguesByCountry]);

  const currentTeamRows = useMemo(() => {
    if (!selectedCountry || !selectedLeague) return [];
    return teamsByCountryLeague.get(makeKey(selectedCountry, selectedLeague)) ?? [];
  }, [selectedCountry, selectedLeague, teamsByCountryLeague]);

  /** ★ delFlg 切替（0↔1）: APIは後述のどちらかに合わせて */
  const toggleMutation = useMutation({
    mutationFn: async (req: ForceAdminRequest) => {
      // 例：管理者APIで0/1両対応させた場合
      return postJson<ForceAdminResponse>("/v1/api/admin/force/update/control", req);
    },
    onSuccess: async () => {
      await refetch();
    },
  });

  async function toggleDelFlg(row: CountryLeagueDTO) {
    const next = row.delFlg === "0" ? "1" : "0";
    const ok = window.confirm(`${row.country} / ${row.league} / ${row.team}\nを ${next === "1" ? "非表示(del_flg=1)" : "表示に戻す(del_flg=0)"} に更新します。よろしいですか？`);
    if (!ok) return;

    const res = await toggleMutation.mutateAsync({
      country: row.country,
      league: row.league,
      team: row.team,
      delFlg: next,
    });

    if (res.responseCode !== "0") {
      alert(res.message);
    }
  }

  const saving = toggleMutation.isPending;

  if (isLoading) return <div style={{ padding: 16 }}>読み込み中…</div>;
  if (isError) {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ marginBottom: 8 }}>読み込みに失敗: {(error as Error).message}</div>
        <button onClick={() => refetch()}>再読み込み</button>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 16, padding: 16 }}>
      {/* 左：国タブ */}
      <aside style={{ border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: 12, borderBottom: "1px solid #ddd", fontWeight: 700 }}>管理者国リーグ強制制御 {isFetching ? "（更新中…）" : ""}</div>
        <div style={{ maxHeight: "70vh", overflow: "auto" }}>
          {countries.map((c) => {
            const active = c === selectedCountry;
            return (
              <button
                key={c}
                onClick={() => startTransition(() => setSelectedCountry(c))}
                disabled={saving}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  border: "none",
                  borderBottom: "1px solid #eee",
                  background: active ? "#f3f4f6" : "white",
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {c}
              </button>
            );
          })}
          {countries.length === 0 && <div style={{ padding: 12 }}>データがありません</div>}
        </div>
      </aside>

      {/* 右：リーグ/チーム */}
      <main style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: "#666" }}>選択中</div>
            <div style={{ fontWeight: 800 }}>
              {selectedCountry ?? "-"} / {selectedLeague ?? "-"}
              {isPending ? "（切替中…）" : ""}
            </div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>del_flg=1 は「非表示」扱い（グレー表示）。「表示に戻す」で del_flg=0 に戻せます。</div>
          </div>
        </div>

        {saving && <div style={{ marginTop: 12, padding: 10, background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8 }}>更新しています…</div>}

        {/* リーグ選択 */}
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>リーグ</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {currentLeagues.map((lg) => {
              const active = lg === selectedLeague;
              return (
                <button
                  key={lg}
                  onClick={() => startTransition(() => setSelectedLeague(lg))}
                  disabled={saving}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 999,
                    border: "1px solid #ddd",
                    background: active ? "#111827" : "white",
                    color: active ? "white" : "black",
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {lg}
                </button>
              );
            })}
            {currentLeagues.length === 0 && <div>リーグがありません</div>}
          </div>
        </div>

        {/* チーム一覧（delFlgで見た目を変える） */}
        <div style={{ marginTop: 12, borderTop: "1px solid #eee", paddingTop: 12 }}>
          {currentTeamRows.length === 0 ? (
            <div>チームがありません</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
              {currentTeamRows.map((r) => {
                const hidden = r.delFlg === "1";
                return (
                  <div
                    key={r.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      padding: "8px 10px",
                      border: "1px solid #eee",
                      borderRadius: 8,
                      background: hidden ? "#f9fafb" : "white",
                      opacity: hidden ? 0.6 : 1,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ textDecoration: hidden ? "line-through" : "none" }}>{r.team}</span>
                        {hidden && (
                          <span
                            style={{
                              fontSize: 12,
                              padding: "2px 8px",
                              borderRadius: 999,
                              background: "#e5e7eb",
                              color: "#374151",
                              whiteSpace: "nowrap",
                            }}
                          >
                            非表示
                          </span>
                        )}
                      </div>
                      {r.link && <div style={{ fontSize: 12, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.link}</div>}
                    </div>

                    <button
                      onClick={() => toggleDelFlg(r)}
                      disabled={saving}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 8,
                        border: "1px solid #ddd",
                        background: hidden ? "#111827" : "white",
                        color: hidden ? "white" : "black",
                        cursor: saving ? "not-allowed" : "pointer",
                        whiteSpace: "nowrap",
                        opacity: saving ? 0.7 : 1,
                      }}
                    >
                      {hidden ? "表示に戻す" : "非表示にする"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {toggleMutation.isError && <div style={{ marginTop: 12, color: "#b91c1c" }}>更新に失敗: {(toggleMutation.error as Error)?.message}</div>}
      </main>
    </div>
  );
}
