import React, { useEffect, useMemo, useState, useTransition } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

/** ===== view API types（既存の /v1/api/favorite/view ） ===== */
type FavoriteViewResponse = {
  allowAll: boolean;
  allowedCountries: { country: string }[];
  allowedLeaguesByCountry: { country: string; leagues: string[] }[];
  allowedTeamsByCountryLeague: { country: string; league: string; teams: string[] }[];
  responseCode: string;
  message: string;
};

/** ===== upsert API types（あなたの /api/favorites ） ===== */
type FavoriteItem = {
  country: string; // 必須
  league?: string | null; // null OK
  team?: string | null; // null OK
};

type FavoriteInsertRequest = {
  userId: number;
  operatorId: string;
  items: FavoriteItem[];
};

type FavoriteResponse = {
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

function makeKey(country: string, league: string) {
  return `${country}__${league}`;
}

export default function FavoritePage() {
  /** 本当はログインユーザーのID/operatorIdをAuthContextなどから取る */
  const userId = 1;
  const operatorId = "system";

  /** ===== 1) view取得（画面の国/リーグ/チーム候補を作る） ===== */
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
      map.set(row.country, row.leagues ?? []);
    }
    return map;
  }, [data]);

  const teamsByCountryLeague = useMemo(() => {
    const map = new Map<string, string[]>();
    if (!data) return map;
    for (const row of data.allowedTeamsByCountryLeague) {
      map.set(makeKey(row.country, row.league), row.teams ?? []);
    }
    return map;
  }, [data]);

  /** ===== 2) UI state ===== */
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);

  // key = country__league
  const [selectedTeams, setSelectedTeams] = useState<Record<string, Set<string>>>({});

  const [isPending, startTransition] = useTransition();

  /** ===== 3) 初期選択 ===== */
  useEffect(() => {
    if (!data || countries.length === 0) return;
    if (!selectedCountry) setSelectedCountry(countries[0]);
  }, [data, countries, selectedCountry]);

  useEffect(() => {
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
    return teamsByCountryLeague.get(makeKey(selectedCountry, selectedLeague)) ?? [];
  }, [selectedCountry, selectedLeague, teamsByCountryLeague]);

  const currentKey = selectedCountry && selectedLeague ? makeKey(selectedCountry, selectedLeague) : null;

  const checkedSet = useMemo(() => {
    if (!currentKey) return new Set<string>();
    return selectedTeams[currentKey] ?? new Set<string>();
  }, [selectedTeams, currentKey]);

  const allChecked = currentTeams.length > 0 && checkedSet.size === currentTeams.length;
  const noneChecked = checkedSet.size === 0;

  function switchCountry(country: string) {
    startTransition(() => {
      setSelectedCountry(country);
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

  /**
   * POST /v1/api/favorites へ FavoriteInsertRequest を送る
   */
  const upsertMutation = useMutation({
    mutationFn: (req: FavoriteInsertRequest) => postJson<FavoriteResponse>("v1/api/favorites", req),
    onSuccess: async (res) => {
      // 必要ならメッセージ表示
      // alert(res.message);

      // viewを再取得（最新化）
      await refetch();
    },
  });

  /** selectedTeams → FavoriteItem[] に変換
   * - upsert側で親補完するので、ここでは「teamあり」の行だけ送ればOK
   * - teamありの場合 league必須なので country__league から必ずセットする
   */
  function buildUpsertItems(): FavoriteItem[] {
    const items: FavoriteItem[] = [];

    for (const [k, teamSet] of Object.entries(selectedTeams)) {
      const [country, league] = k.split("__");
      if (!country || !league) continue;

      for (const team of teamSet) {
        items.push({
          country,
          league,
          team,
        });
      }
    }
    return items;
  }

  async function onClickLatest() {
    const items = buildUpsertItems();

    if (items.length === 0) {
      alert("チームが選択されていません。");
      return;
    }

    try {
      const res = await upsertMutation.mutateAsync({
        userId,
        operatorId,
        items,
      });

      // サーバ側 responseCode が 200/400/404 の設計なので、200以外はここで弾く（任意）
      if (res.responseCode !== "200") {
        alert(res.message);
        return;
      }

      // 成功時メッセージ（任意）
      // alert(res.message);
    } catch (e) {
      alert((e as Error).message);
    }
  }

  /** ===== 5) render ===== */
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

  const saving = upsertMutation.isPending;

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
            {/* 最新化＝ upsert 呼び出し */}
            <button onClick={onClickLatest} disabled={saving}>
              {saving ? "登録中…" : "最新化"}
            </button>
          </div>
        </div>

        {/* 保存中 Loading */}
        {saving && <div style={{ marginTop: 12, padding: 10, background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8 }}>登録しています…</div>}

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

        {/* 全選択/解除 */}
        <div style={{ marginTop: 14, display: "flex", gap: 16, alignItems: "center" }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center", cursor: saving ? "not-allowed" : "pointer" }}>
            <input type="checkbox" checked={allChecked} onChange={(e) => setAll(e.target.checked)} disabled={saving || currentTeams.length === 0} />
            全チーム選択
          </label>

          <button onClick={() => setAll(false)} disabled={saving || noneChecked || currentTeams.length === 0}>
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
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  <input type="checkbox" checked={checkedSet.has(t)} onChange={() => toggleTeam(t)} disabled={saving} />
                  <span>{t}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* 保存エラー表示（任意） */}
        {upsertMutation.isError && <div style={{ marginTop: 12, color: "#b91c1c" }}>登録に失敗: {(upsertMutation.error as Error)?.message}</div>}
      </main>
    </div>
  );
}
