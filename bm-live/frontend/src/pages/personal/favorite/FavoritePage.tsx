import React, { useEffect, useMemo, useState, useTransition } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import AppHeader from "../../../components/layout/AppHeader";
import { getAccessToken, clearAuthSession, isAuthenticated } from "../../../utils/auth";

type SelectedFavoriteItem = {
  country: string;
  league?: string | null;
  team?: string | null;
};

type FavoriteViewResponse = {
  allowAll: boolean;
  allowedCountries: { country: string }[];
  allowedLeaguesByCountry: { country: string; leagues: string[] }[];
  allowedTeamsByCountryLeague: { country: string; league: string; teams: string[] }[];
  selectedItems?: SelectedFavoriteItem[];
  responseCode: string;
  message: string;
};

type FavoriteItem = {
  country: string;
  league?: string | null;
  team?: string | null;
};

type FavoriteInsertRequest = {
  items: FavoriteItem[];
};

type FavoriteResponse = {
  responseCode: string;
  message: string;
};

class UnauthorizedError extends Error {
  constructor(message = "ログインが必要です") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

function isLoggedIn() {
  return isAuthenticated();
}

function uniqSorted(arr: string[]) {
  return Array.from(new Set(arr)).sort((a, b) => a.localeCompare(b, "ja"));
}

function makeKey(country: string, league: string) {
  return `${country}__${league}`;
}

function isUnauthorizedLike(status: number, message: string) {
  const m = (message || "").toLowerCase();

  if (status === 401 || status === 403) return true;

  return (
    m.includes("401 unauthorized") ||
    m.includes("unauthorized") ||
    m.includes("jwt token is invalid") ||
    m.includes("jwt token is missing") ||
    m.includes("authorization header is missing") ||
    m.includes("invalid authorization header") ||
    m.includes("jwt subject is missing") ||
    m.includes("user not found")
  );
}

async function readErrorMessage(res: Response, fallback: string) {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const json = await res.json().catch(() => null);
    const message = json?.message || json?.error || json?.reason || json?.detail;
    if (typeof message === "string" && message.trim()) {
      return message.trim();
    }
  }

  const text = await res.text().catch(() => "");
  if (text.trim()) {
    return text.trim();
  }

  return fallback;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const token = getAccessToken();

  if (!token?.trim()) {
    clearAuthSession();
    throw new UnauthorizedError("ログインが必要です");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const message = await readErrorMessage(res.clone(), `HTTP ${res.status}`);

    if (isUnauthorizedLike(res.status, message)) {
      clearAuthSession();
      throw new UnauthorizedError("ログインが必要です");
    }

    throw new Error(message);
  }

  return res.json();
}

export default function FavoritePage() {
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();

  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [selectedTeams, setSelectedTeams] = useState<Record<string, Set<string>>>({});
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!loggedIn) {
      navigate("/login", {
        replace: true,
        state: { from: "/favorite" },
      });
    }
  }, [loggedIn, navigate]);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["favoriteView"],
    queryFn: () => postJson<FavoriteViewResponse>("/v1/api/favorite/view", {}),
    enabled: loggedIn,
    retry: false,
  });

  useEffect(() => {
    if (error instanceof UnauthorizedError) {
      navigate("/login", {
        replace: true,
        state: { from: "/favorite" },
      });
    }
  }, [error, navigate]);

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

  useEffect(() => {
    if (!data || countries.length === 0) return;
    if (!selectedCountry) {
      setSelectedCountry(countries[0]);
    }
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

  useEffect(() => {
    if (!data?.selectedItems) return;

    const next: Record<string, Set<string>> = {};

    for (const item of data.selectedItems) {
      const country = (item.country ?? "").trim();
      const league = (item.league ?? "").trim();
      const team = (item.team ?? "").trim();

      if (!country || !league || !team) continue;

      const key = `${country}__${league}`;
      if (!next[key]) next[key] = new Set<string>();
      next[key].add(team);
    }

    setSelectedTeams(next);
  }, [data]);

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

  const upsertMutation = useMutation({
    mutationFn: (req: FavoriteInsertRequest) => postJson<FavoriteResponse>("/v1/api/favorites", req),
    onSuccess: async () => {
      await refetch();
    },
  });

  useEffect(() => {
    if (upsertMutation.error instanceof UnauthorizedError) {
      navigate("/login", {
        replace: true,
        state: { from: "/favorite" },
      });
    }
  }, [upsertMutation.error, navigate]);

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

    try {
      const res = await upsertMutation.mutateAsync({ items });

      if (res.responseCode !== "200") {
        alert(res.message);
        return;
      }

      if (items.length === 0) {
        alert("お気に入りをすべて解除しました。");
      } else {
        alert("最新化しました。");
      }
    } catch (e) {
      if (e instanceof UnauthorizedError) {
        navigate("/login", {
          replace: true,
          state: { from: "/favorite" },
        });
        return;
      }
      alert((e as Error).message);
    }
  }

  if (!loggedIn) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="お気に入り" subtitle="Favorite Settings" />
        <main className="container mx-auto px-4 py-6">
          <div style={{ padding: 16 }}>読み込み中…</div>
        </main>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="お気に入り" subtitle="Favorite Settings" />
        <main className="container mx-auto px-4 py-6">
          <div style={{ padding: 16 }}>
            <div style={{ marginBottom: 8 }}>読み込みに失敗: {(error as Error).message}</div>
            <button onClick={() => refetch()}>再読み込み</button>
          </div>
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="お気に入り" subtitle="Favorite Settings" />
        <main className="container mx-auto px-4 py-6">
          <div style={{ padding: 16 }}>データなし</div>
        </main>
      </div>
    );
  }

  const saving = upsertMutation.isPending;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="お気に入り" subtitle="Favorite Settings" />

      <main className="container mx-auto px-4 py-6">
        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 16 }}>
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

          <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontSize: 12, color: "#666" }}>選択中</div>
                <div style={{ fontWeight: 800 }}>
                  {selectedCountry ?? "-"} / {selectedLeague ?? "-"}
                  {isPending ? "（切替中…）" : ""}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={onClickLatest} disabled={saving}>
                  {saving ? "登録中…" : "最新化"}
                </button>
              </div>
            </div>

            {saving && (
              <div
                style={{
                  marginTop: 12,
                  padding: 10,
                  background: "#fff7ed",
                  border: "1px solid #fed7aa",
                  borderRadius: 8,
                }}
              >
                登録しています…
              </div>
            )}

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

            <div style={{ marginTop: 14, display: "flex", gap: 16, alignItems: "center" }}>
              <label
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
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

            <div style={{ marginTop: 12, borderTop: "1px solid #eee", paddingTop: 12 }}>
              {currentTeams.length === 0 ? (
                <div>チームがありません</div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: 8,
                  }}
                >
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

            {upsertMutation.isError && !(upsertMutation.error instanceof UnauthorizedError) && (
              <div style={{ marginTop: 12, color: "#b91c1c" }}>登録に失敗: {(upsertMutation.error as Error)?.message}</div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
