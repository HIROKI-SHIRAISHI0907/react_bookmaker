import React, { useEffect, useMemo, useState } from "react";

// バックエンドが /v1/api/... ならこちらに合わせる
// もしフロントのプロキシで /api -> /v1/api を吸収しているなら "/api" のままでOK
const API_BASE = "/v1/api";
// const API_BASE = "/api";

type TeamRow = {
  country: string;
  league: string;
  team: string;
  subLeague: string | null;
};

type BoardResponse = {
  items: TeamRow[];
};

type TargetCountry = {
  country: string;
  leagues: string[];
};

type TargetResponse = {
  countries: TargetCountry[];
};

type SaveRequest = {
  leagues: {
    country: string;
    league: string;
    team: string;
    subLeague: string | null;
  }[];
};

type AlertType = "info" | "success" | "error" | "warning";

const toTrimOrNull = (v?: string | null) => {
  const s = (v ?? "").trim();
  return s.length ? s : null;
};

const getErrorMessage = (e: unknown): string => {
  if (e instanceof Error) return e.message;
  return String(e);
};

const teamKeyOf = (x: { country: string; league: string; team: string }) => `${x.country}___${x.league}___${x.team}`;

const leagueKeyOf = (x: { country: string; league: string }) => `${x.country}___${x.league}`;

const normalizeSubLeague = (v?: string | null) => toTrimOrNull(v);

async function getJsonSafe<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "include",
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : {};

  if (!res.ok) {
    throw new Error(json?.message || text || `HTTP ${res.status}`);
  }
  return json as T;
}

async function postJsonSafe<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "include",
    body: JSON.stringify(body),
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : {};

  if (!res.ok) {
    throw new Error(json?.message || text || `HTTP ${res.status}`);
  }
  return json as T;
}

function buildTargetCountriesFromItems(items: TeamRow[]): TargetCountry[] {
  const countryMap = new Map<string, Set<string>>();

  for (const item of items) {
    const country = toTrimOrNull(item.country);
    const league = toTrimOrNull(item.league);
    if (!country || !league) continue;

    if (!countryMap.has(country)) {
      countryMap.set(country, new Set<string>());
    }
    countryMap.get(country)!.add(league);
  }

  return Array.from(countryMap.entries())
    .map(([country, leagues]) => ({
      country,
      leagues: Array.from(leagues).sort((a, b) => a.localeCompare(b, "ja")),
    }))
    .sort((a, b) => a.country.localeCompare(b.country, "ja"));
}

function Card(props: React.PropsWithChildren<{ title?: string; right?: React.ReactNode }>) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      {(props.title || props.right) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 18 }}>{props.title}</h3>
          <div>{props.right}</div>
        </div>
      )}
      {props.children}
    </div>
  );
}

function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    loading?: boolean;
    variant?: "primary" | "secondary" | "success" | "danger";
  },
) {
  const { loading, variant = "primary", children, ...rest } = props;

  const colorMap = {
    primary: "#2563eb",
    secondary: "#6b7280",
    success: "#16a34a",
    danger: "#dc2626",
  };

  return (
    <button
      {...rest}
      disabled={loading || rest.disabled}
      style={{
        border: "none",
        borderRadius: 8,
        padding: "10px 14px",
        color: "#fff",
        cursor: loading || rest.disabled ? "not-allowed" : "pointer",
        background: colorMap[variant],
        opacity: loading || rest.disabled ? 0.7 : 1,
      }}
    >
      {loading ? "処理中..." : children}
    </button>
  );
}

function Input(props: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontWeight: 600 }}>{props.label}</label>
      <input
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        style={{
          border: "1px solid #d1d5db",
          borderRadius: 8,
          padding: "10px 12px",
          fontSize: 14,
        }}
      />
      {props.hint && <div style={{ color: "#6b7280", fontSize: 12 }}>{props.hint}</div>}
    </div>
  );
}

function Alert(props: { type: AlertType; children: React.ReactNode }) {
  const colors = {
    info: ["#eff6ff", "#1d4ed8"],
    success: ["#f0fdf4", "#15803d"],
    error: ["#fef2f2", "#b91c1c"],
    warning: ["#fffbeb", "#b45309"],
  } as const;

  const [bg, fg] = colors[props.type];

  return (
    <div
      style={{
        background: bg,
        color: fg,
        borderRadius: 8,
        padding: 12,
        border: `1px solid ${fg}22`,
      }}
    >
      {props.children}
    </div>
  );
}

function Badge(props: { children: React.ReactNode; color?: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 8px",
        borderRadius: 999,
        background: props.color ?? "#eef2ff",
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {props.children}
    </span>
  );
}

function Modal(props: { open: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  if (!props.open) return null;

  return (
    <div
      onClick={props.onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 16,
          width: "min(1400px, 100%)",
          height: "min(90vh, 900px)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flex: "0 0 auto",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 20 }}>{props.title}</h2>
          <button
            type="button"
            onClick={props.onClose}
            style={{
              border: "none",
              background: "transparent",
              fontSize: 24,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            padding: 20,
            overflow: "auto",
            flex: 1,
            minHeight: 0,
          }}
        >
          {props.children}
        </div>
      </div>
    </div>
  );
}

export default function SubLeagueManualUpdatePage() {
  const [items, setItems] = useState<TeamRow[]>([]);
  const [targetCountries, setTargetCountries] = useState<TargetCountry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: AlertType; message: string } | null>(null);

  const [newSubLeagueName, setNewSubLeagueName] = useState("");
  const [subLeagueNames, setSubLeagueNames] = useState<string[]>([]);
  const [selectedSubLeague, setSelectedSubLeague] = useState<string | null>(null);

  const [selectedCountryMapBySubLeague, setSelectedCountryMapBySubLeague] = useState<Record<string, string[]>>({});

  const [selectedLeagueMapBySubLeague, setSelectedLeagueMapBySubLeague] = useState<Record<string, string[]>>({});

  const [draggingTeamKey, setDraggingTeamKey] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setAlert(null);

    try {
      const boardPromise = getJsonSafe<BoardResponse>(`${API_BASE}/admin/master/sub-league/board`);

      const targetsPromise = getJsonSafe<TargetResponse>(`${API_BASE}/admin/master/sub-league/targets`).catch(() => ({ countries: [] as TargetCountry[] }));

      const [boardData, targetData] = await Promise.all([boardPromise, targetsPromise]);

      const nextItems = boardData.items ?? [];

      // targets API が空でも board から fallback 生成
      const nextTargetCountries = targetData.countries && targetData.countries.length > 0 ? targetData.countries : buildTargetCountriesFromItems(nextItems);

      setItems(nextItems);
      setTargetCountries(nextTargetCountries);

      const names = Array.from(new Set(nextItems.map((x) => normalizeSubLeague(x.subLeague)).filter((x): x is string => !!x))).sort((a, b) => a.localeCompare(b, "ja"));

      setSubLeagueNames(names);
    } catch (e) {
      setAlert({
        type: "error",
        message: getErrorMessage(e),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openSubLeagueModal = (subLeague: string) => {
    setSelectedSubLeague(subLeague);
    setDraggingTeamKey(null);

    setSelectedCountryMapBySubLeague((prev) => {
      if (prev[subLeague]) return prev;

      const initialCountries = Array.from(new Set(items.filter((x) => normalizeSubLeague(x.subLeague) === subLeague).map((x) => x.country)));

      return {
        ...prev,
        [subLeague]: initialCountries,
      };
    });

    setSelectedLeagueMapBySubLeague((prev) => {
      if (prev[subLeague]) return prev;

      const initialLeagueKeys = Array.from(new Set(items.filter((x) => normalizeSubLeague(x.subLeague) === subLeague).map((x) => leagueKeyOf(x))));

      return {
        ...prev,
        [subLeague]: initialLeagueKeys,
      };
    });
  };

  const closeModal = () => {
    setSelectedSubLeague(null);
    setDraggingTeamKey(null);
  };

  const addSubLeagueName = () => {
    const v = toTrimOrNull(newSubLeagueName);
    if (!v) return;

    if (subLeagueNames.includes(v)) {
      setAlert({ type: "warning", message: `「${v}」は既に登録済みです。` });
      return;
    }

    setSubLeagueNames((prev) => [...prev, v].sort((a, b) => a.localeCompare(b, "ja")));
    setNewSubLeagueName("");

    setSelectedCountryMapBySubLeague((prev) => ({
      ...prev,
      [v]: prev[v] ?? [],
    }));

    setSelectedLeagueMapBySubLeague((prev) => ({
      ...prev,
      [v]: prev[v] ?? [],
    }));

    setAlert(null);
  };

  const currentCheckedCountries = useMemo(() => {
    if (!selectedSubLeague) return [];
    return selectedCountryMapBySubLeague[selectedSubLeague] ?? [];
  }, [selectedSubLeague, selectedCountryMapBySubLeague]);

  const currentCheckedLeagueKeys = useMemo(() => {
    if (!selectedSubLeague) return [];
    return selectedLeagueMapBySubLeague[selectedSubLeague] ?? [];
  }, [selectedSubLeague, selectedLeagueMapBySubLeague]);

  const toggleCountryChecked = (country: string) => {
    if (!selectedSubLeague) return;

    const currentCountries = selectedCountryMapBySubLeague[selectedSubLeague] ?? [];
    const exists = currentCountries.includes(country);

    const nextCountries = exists ? currentCountries.filter((x) => x !== country) : [...currentCountries, country];

    setSelectedCountryMapBySubLeague((prev) => ({
      ...prev,
      [selectedSubLeague]: nextCountries,
    }));

    if (exists) {
      const currentLeagues = selectedLeagueMapBySubLeague[selectedSubLeague] ?? [];
      const nextLeagues = currentLeagues.filter((leagueKey) => {
        const [c] = leagueKey.split("___");
        return c !== country;
      });

      setSelectedLeagueMapBySubLeague((prev) => ({
        ...prev,
        [selectedSubLeague]: nextLeagues,
      }));
    }
  };

  const toggleLeagueChecked = (leagueKey: string) => {
    if (!selectedSubLeague) return;

    const [country] = leagueKey.split("___");

    if (!currentCheckedCountries.includes(country)) {
      setAlert({
        type: "warning",
        message: `先に「${country}」をチェックしてください。`,
      });
      return;
    }

    const current = selectedLeagueMapBySubLeague[selectedSubLeague] ?? [];
    const exists = current.includes(leagueKey);

    setSelectedLeagueMapBySubLeague((prev) => ({
      ...prev,
      [selectedSubLeague]: exists ? current.filter((x) => x !== leagueKey) : [...current, leagueKey],
    }));
  };

  const candidateTeams = useMemo(() => {
    if (!selectedSubLeague) return [];

    const checkedLeagueSet = new Set(currentCheckedLeagueKeys);

    return items
      .filter((x) => checkedLeagueSet.has(leagueKeyOf(x)))
      .filter((x) => normalizeSubLeague(x.subLeague) !== selectedSubLeague)
      .sort((a, b) => {
        const c1 = a.country.localeCompare(b.country, "ja");
        if (c1 !== 0) return c1;
        const c2 = a.league.localeCompare(b.league, "ja");
        if (c2 !== 0) return c2;
        return a.team.localeCompare(b.team, "ja");
      });
  }, [items, selectedSubLeague, currentCheckedLeagueKeys]);

  const assignedTeams = useMemo(() => {
    if (!selectedSubLeague) return [];

    return items
      .filter((x) => normalizeSubLeague(x.subLeague) === selectedSubLeague)
      .sort((a, b) => {
        const c1 = a.country.localeCompare(b.country, "ja");
        if (c1 !== 0) return c1;
        const c2 = a.league.localeCompare(b.league, "ja");
        if (c2 !== 0) return c2;
        return a.team.localeCompare(b.team, "ja");
      });
  }, [items, selectedSubLeague]);

  const moveTeamToSubLeague = (target: { country: string; league: string; team: string }, subLeague: string | null) => {
    setItems((prev) => prev.map((x) => (x.country === target.country && x.league === target.league && x.team === target.team ? { ...x, subLeague } : x)));
  };

  const handleDropToSelectedSubLeague = () => {
    if (!draggingTeamKey || !selectedSubLeague) return;

    const [country, league, team] = draggingTeamKey.split("___");
    moveTeamToSubLeague({ country, league, team }, selectedSubLeague);
    setDraggingTeamKey(null);
  };

  const handleDropToUnassigned = () => {
    if (!draggingTeamKey) return;

    const [country, league, team] = draggingTeamKey.split("___");
    moveTeamToSubLeague({ country, league, team }, null);
    setDraggingTeamKey(null);
  };

  const onSave = async () => {
    setSaving(true);
    setAlert(null);

    try {
      const body: SaveRequest = {
        leagues: items.map((x) => ({
          country: x.country,
          league: x.league,
          team: x.team,
          subLeague: toTrimOrNull(x.subLeague),
        })),
      };

      await postJsonSafe(`${API_BASE}/admin/master/sub-league`, body);
      setAlert({ type: "success", message: "sub_league を保存しました。" });
      await load();
    } catch (e) {
      setAlert({ type: "error", message: getErrorMessage(e) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 24, background: "#f8fafc", minHeight: "100vh" }}>
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <Card title="Sub League 手動更新" right={<Badge color="#dbeafe">API: {API_BASE}</Badge>}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto auto",
              gap: 12,
              alignItems: "end",
            }}
          >
            <Input
              label="登録したいサブリーグ名"
              value={newSubLeagueName}
              onChange={setNewSubLeagueName}
              placeholder="例: EAST / WEST / 上位 / 下位"
              hint="先にサブリーグ名を作成し、その後クリックして対象の country / league / team を設定します。"
            />
            <Button variant="primary" onClick={addSubLeagueName}>
              追加
            </Button>
            <Button variant="secondary" onClick={load} loading={loading}>
              再読込
            </Button>
            <Button variant="success" onClick={onSave} loading={saving}>
              保存
            </Button>
          </div>

          <div style={{ marginTop: 16 }}>
            <Alert type="info">
              まずサブリーグ名を作成します。作成後、サブリーグカードをクリックするとモーダルが開きます。モーダル内では「country をチェック → league をチェック → team をドラッグ」で所属を設定できます。
            </Alert>
          </div>

          {alert && (
            <div style={{ marginTop: 12 }}>
              <Alert type={alert.type}>{alert.message}</Alert>
            </div>
          )}
        </Card>

        <Card title="サブリーグ一覧" right={<Badge>{subLeagueNames.length}件</Badge>}>
          {subLeagueNames.length === 0 ? (
            <Alert type="warning">まだサブリーグ名がありません。上の入力欄から追加してください。</Alert>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 12,
              }}
            >
              {subLeagueNames.map((name) => {
                const count = items.filter((x) => normalizeSubLeague(x.subLeague) === name).length;

                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => openSubLeagueModal(name)}
                    style={{
                      textAlign: "left",
                      border: "1px solid #dbeafe",
                      background: "#fff",
                      borderRadius: 12,
                      padding: 16,
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{name}</div>
                    <div style={{ marginTop: 8 }}>
                      <Badge color="#eff6ff">{count} teams</Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        <Modal open={!!selectedSubLeague} title={selectedSubLeague ? `サブリーグ設定: ${selectedSubLeague}` : ""} onClose={closeModal}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "340px 1fr 1fr",
              gap: 16,
              alignItems: "stretch",
              minHeight: 0,
              height: "100%",
            }}
          >
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 16,
                background: "#fafafa",
                minHeight: 0,
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <h3 style={{ marginTop: 0 }}>対象国・リーグ選択</h3>

              <div style={{ marginBottom: 12 }}>
                <Alert type="info">まず country をチェックし、そのあと league をチェックしてください。</Alert>
              </div>

              <div
                style={{
                  overflowY: "auto",
                  minHeight: 0,
                  flex: 1,
                  paddingRight: 4,
                }}
              >
                {targetCountries.length === 0 ? (
                  <Alert type="warning">対象の国・リーグがありません。</Alert>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {targetCountries.map((group) => {
                      const countryChecked = currentCheckedCountries.includes(group.country);

                      return (
                        <div
                          key={group.country}
                          style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: 10,
                            padding: 10,
                            background: "#fff",
                          }}
                        >
                          <label
                            style={{
                              display: "flex",
                              gap: 8,
                              alignItems: "center",
                              cursor: "pointer",
                              fontWeight: 700,
                            }}
                          >
                            <input type="checkbox" checked={countryChecked} onChange={() => toggleCountryChecked(group.country)} />
                            <span>{group.country}</span>
                          </label>

                          {countryChecked && (
                            <div
                              style={{
                                marginTop: 10,
                                marginLeft: 24,
                                display: "flex",
                                flexDirection: "column",
                                gap: 8,
                              }}
                            >
                              {group.leagues.map((league) => {
                                const leagueKey = `${group.country}___${league}`;
                                const checked = currentCheckedLeagueKeys.includes(leagueKey);

                                return (
                                  <label
                                    key={leagueKey}
                                    style={{
                                      display: "flex",
                                      gap: 8,
                                      alignItems: "center",
                                      cursor: "pointer",
                                    }}
                                  >
                                    <input type="checkbox" checked={checked} onChange={() => toggleLeagueChecked(leagueKey)} />
                                    <span>{league}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 16,
                minHeight: 0,
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                  flex: "0 0 auto",
                }}
              >
                <h3 style={{ margin: 0 }}>候補チーム</h3>
                <Badge>{candidateTeams.length}件</Badge>
              </div>

              <div style={{ flex: "0 0 auto" }}>
                <Alert type="info">左で league までチェックした配下のチームが表示されます。カードを右の「{selectedSubLeague}」へドラッグしてください。</Alert>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  marginTop: 12,
                  overflowY: "auto",
                  minHeight: 0,
                  flex: 1,
                  paddingRight: 4,
                }}
              >
                {candidateTeams.map((team) => (
                  <div
                    key={teamKeyOf(team)}
                    draggable
                    onDragStart={() => setDraggingTeamKey(teamKeyOf(team))}
                    onDragEnd={() => setDraggingTeamKey(null)}
                    style={{
                      background: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 10,
                      padding: 10,
                      cursor: "grab",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>{team.team}</div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                      {team.country} / {team.league}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <Badge color="#f3f4f6">現在: {normalizeSubLeague(team.subLeague) ?? "未設定"}</Badge>
                    </div>
                  </div>
                ))}

                {candidateTeams.length === 0 && (
                  <div style={{ marginTop: 8 }}>
                    <Alert type="warning">まだ候補チームがありません。左で country をチェックし、その後 league をチェックしてください。</Alert>
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                minHeight: 0,
                height: "100%",
              }}
            >
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDropToSelectedSubLeague}
                style={{
                  border: "2px dashed #60a5fa",
                  borderRadius: 12,
                  padding: 16,
                  background: "#eff6ff",
                  minHeight: 0,
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                    flex: "0 0 auto",
                  }}
                >
                  <h3 style={{ margin: 0 }}>{selectedSubLeague}</h3>
                  <Badge color="#dbeafe">{assignedTeams.length}件</Badge>
                </div>

                <div style={{ flex: "0 0 auto" }}>
                  <Alert type="info">ここにドロップすると、このサブリーグに所属します。</Alert>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    marginTop: 12,
                    overflowY: "auto",
                    minHeight: 0,
                    flex: 1,
                    paddingRight: 4,
                  }}
                >
                  {assignedTeams.map((team) => (
                    <div
                      key={teamKeyOf(team)}
                      draggable
                      onDragStart={() => setDraggingTeamKey(teamKeyOf(team))}
                      onDragEnd={() => setDraggingTeamKey(null)}
                      style={{
                        background: "#fff",
                        border: "1px solid #bfdbfe",
                        borderRadius: 10,
                        padding: 10,
                        cursor: "grab",
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>{team.team}</div>
                      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                        {team.country} / {team.league}
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <button
                          type="button"
                          onClick={() =>
                            moveTeamToSubLeague(
                              {
                                country: team.country,
                                league: team.league,
                                team: team.team,
                              },
                              null,
                            )
                          }
                          style={{
                            border: "none",
                            background: "#fee2e2",
                            color: "#b91c1c",
                            borderRadius: 8,
                            padding: "6px 10px",
                            cursor: "pointer",
                          }}
                        >
                          未設定に戻す
                        </button>
                      </div>
                    </div>
                  ))}

                  {assignedTeams.length === 0 && (
                    <div style={{ marginTop: 8 }}>
                      <Alert type="warning">まだこのサブリーグに所属するチームはありません。</Alert>
                    </div>
                  )}
                </div>
              </div>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDropToUnassigned}
                style={{
                  border: "2px dashed #fca5a5",
                  borderRadius: 12,
                  padding: 16,
                  background: "#fef2f2",
                  flex: "0 0 auto",
                }}
              >
                <div style={{ fontWeight: 700 }}>未設定に戻す</div>
                <div style={{ fontSize: 12, color: "#7f1d1d", marginTop: 6 }}>右側の所属チームをここへドラッグすると subLeague を解除します。</div>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
