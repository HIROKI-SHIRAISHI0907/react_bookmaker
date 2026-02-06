import React, { useMemo, useState, useTransition } from "react";
import { useQuery } from "@tanstack/react-query";

type FavoriteViewResponse = {
  allowAll: boolean;
  allowedCountries: { country: string }[];
  allowedLeaguesByCountry: { country: string; leagues: string[] }[];
  allowedTeamsByCountryLeague: { country: string; league: string; teams: string[] }[];
  responseCode: string;
  message: string;
};

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${text}`);
  }
  return res.json();
}

function uniqSorted(arr: string[]) {
  return Array.from(new Set(arr)).sort((a, b) => a.localeCompare(b, "ja"));
}

export default function FavoritePage() {
  // 本当はログインユーザーのIDをAuthContextなどから取るのが理想
  const userId = 1;

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["favoriteView", userId],
    queryFn: () => postJson<FavoriteViewResponse>("/v1/api/favorite/view", { userId }),
  });

  const countries = useMemo(() => {
    if (!data) return [];
    return data.allowedCountries.map((c) => c.country);
  }, [data]);

  const leaguesByCountry = useMemo(() => {
    const map = new Map<string, string[]>();
    if (!data) return map;
    for (const row of data.allowedLeaguesByCountry) {
      map.set(row.country, row.leagues);
    }
    return map;
  }, [data]);

  const teamsByCountryLeague = useMemo(() => {
    const map = new Map<string, string[]>();
    if (!data) return map;
    for (const row of data.allowedTeamsByCountryLeague) {
      map.set(`${row.country}__${row.league}`, row.teams);
    }
    return map;
  }, [data]);

  // UI state
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [selectedTeams, setSelectedTeams] = useState<Record<string, Set<string>>>({}); // key = country__league

  const [isPending, startTransition] = useTransition();

  // 初期選択
  React.useEffect(() => {
    if (!data || countries.length === 0) return;
    if (!selectedCountry) {
      setSelectedCountry(countries[0]);
    }
  }, [data, countries, selectedCountry]);

  React.useEffect(() => {
    if (!selectedCountry) return;
    const leagues = leaguesByCountry.get(selectedCountry) ?? [];
    if (leagues.length === 0) {
      setSelectedLeague(null);
      return;
    }
    if (!selectedLeague || !leagues.includes(selectedLeague)) {
      setSelectedLeague(leagues[0]);
    }
  }, [selectedCountry, selectedLeague, leaguesByCountry]);

  const currentLeagues = useMemo(() => {
    if (!selectedCountry) return [];
    return leaguesByCountry.get(selectedCountry) ?? [];
  }, [selectedCountry, leaguesByCountry]);

  const currentTeams = useMemo(() => {
    if (!selectedCountry || !selectedLeague) return [];
    return teamsByCountryLeague.get(`${selectedCountry}__${selectedLeague}`) ?? [];
  }, [selectedCountry, selectedLeague, teamsByCountryLeague]);

  const currentKey = selectedCountry && selectedLeague ? `${selectedCountry}__${selectedLeague}` : null;

  const checkedSet = useMemo(() => {
    if (!currentKey) return new Set<string>();
    return selectedTeams[currentKey] ?? new Set<string>();
  }, [selectedTeams, currentKey]);

  const allChecked = currentTeams.length > 0 && checkedSet.size === currentTeams.length;
  const noneChecked = checkedSet.size === 0;

  function switchCountry(country: string) {
    startTransition(() => {
      setSelectedCountry(country);
      // leagueはuseEffectで適切に入れ替わる
    });
  }

  function switchLeague(league: string) {
    startTransition(() => {
      setSelectedLeague(league);
    });
  }

  function toggleTeam(team: string) {
    if (!currentKey) return;
    setSelectedTeams((prev) => {
      const next = { ...prev };
      const set = new Set(next[currentKey] ?? []);
      if (set.has(team)) set.delete(team);
      else set.add(team);
      next[currentKey] = set;
      return next;
    });
  }

  function setAll(value: boolean) {
    if (!currentKey) return;
    setSelectedTeams((prev) => {
      const next = { ...prev };
      next[currentKey] = value ? new Set(currentTeams) : new Set<string>();
      return next;
    });
  }

  if (isLoading) return <div style={{ padding: 16 }}>読み込み中…</div>;
  if (isError) {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ marginBottom: 8 }}>読み込みに失敗: {(error as Error).message}</div>
        <button onClick={() => refetch()}>再読み込み</button>
      </div>
    );
  }
  if (!data) return <div style={{ padding: 16 }}>データなし</div>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 16, padding: 16 }}>
      {/* 左：国タブ */}
      <aside style={{ border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: 12, borderBottom: "1px solid #ddd", fontWeight: 700 }}>国 {isFetching ? "（更新中…）" : ""}</div>
        <div style={{ maxHeight: "70vh", overflow: "auto" }}>
          {countries.map((c) => {
            const active = c === selectedCountry;
            return (
              <button
                key={c}
                onClick={() => switchCountry(c)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  border: "none",
                  borderBottom: "1px solid #eee",
                  background: active ? "#f3f4f6" : "white",
                  cursor: "pointer",
                }}
              >
                {c}
              </button>
            );
          })}
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
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => refetch()}>最新化</button>
            {/* 保存APIがあるならここに保存ボタンを追加 */}
          </div>
        </div>

        {/* リーグ選択 */}
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>リーグ</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {currentLeagues.map((lg) => {
              const active = lg === selectedLeague;
              return (
                <button
                  key={lg}
                  onClick={() => switchLeague(lg)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 999,
                    border: "1px solid #ddd",
                    background: active ? "#111827" : "white",
                    color: active ? "white" : "black",
                    cursor: "pointer",
                  }}
                >
                  {lg}
                </button>
              );
            })}
            {currentLeagues.length === 0 && <div>リーグがありません</div>}
          </div>
        </div>

        {/* 全選択/解除 */}
        <div style={{ marginTop: 14, display: "flex", gap: 16, alignItems: "center" }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
            <input type="checkbox" checked={allChecked} onChange={(e) => setAll(e.target.checked)} disabled={currentTeams.length === 0} />
            全チーム選択
          </label>

          <button onClick={() => setAll(false)} disabled={noneChecked || currentTeams.length === 0}>
            全チーム非選択
          </button>

          <div style={{ marginLeft: "auto", fontSize: 12, color: "#666" }}>
            選択: {checkedSet.size} / {currentTeams.length}
          </div>
        </div>

        {/* チーム一覧 */}
        <div style={{ marginTop: 12, borderTop: "1px solid #eee", paddingTop: 12 }}>
          {currentTeams.length === 0 ? (
            <div>チームがありません</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
              {uniqSorted(currentTeams).map((t) => (
                <label
                  key={t}
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    padding: "8px 10px",
                    border: "1px solid #eee",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  <input type="checkbox" checked={checkedSet.has(t)} onChange={() => toggleTeam(t)} />
                  <span>{t}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
