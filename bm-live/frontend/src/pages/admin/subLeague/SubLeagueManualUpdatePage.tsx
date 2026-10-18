import React, { useEffect, useMemo, useState } from "react";
import { GripVertical, Plus, RefreshCw, Save, Undo2 } from "lucide-react";
import { ConsoleButton, ConsoleField, ConsoleInput, ConsoleModal, ConsoleNotice, ConsolePanel, ConsoleToolbar, NoticeTone, StatusBadge } from "../../../api/commonAdminDesign";

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

const ALERT_TONE: Record<AlertType, NoticeTone> = { info: "info", success: "ok", error: "ng", warning: "warn" };

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

const sortTeams = (a: TeamRow, b: TeamRow) => {
  const c1 = a.country.localeCompare(b.country, "ja");
  if (c1 !== 0) return c1;
  const c2 = a.league.localeCompare(b.league, "ja");
  if (c2 !== 0) return c2;
  return a.team.localeCompare(b.team, "ja");
};

/** ドラッグできるチームの行 */
function TeamChip({
  team,
  onDragStart,
  onDragEnd,
  right,
  tone = "default",
}: {
  team: TeamRow;
  onDragStart: () => void;
  onDragEnd: () => void;
  right?: React.ReactNode;
  tone?: "default" | "assigned";
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={[
        "flex cursor-grab items-center gap-2 rounded-lg border bg-white px-2.5 py-1.5 active:cursor-grabbing",
        tone === "assigned" ? "border-indigo-200" : "border-gray-200 hover:border-gray-300",
      ].join(" ")}
    >
      <GripVertical className="h-3.5 w-3.5 shrink-0 text-gray-300" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-bold text-gray-900">{team.team}</div>
        <div className="truncate text-[11px] text-gray-500">
          {team.country} / {team.league}
        </div>
      </div>
      {right}
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
  const [dropHover, setDropHover] = useState<"assign" | "unassign" | null>(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setDropHover(null);
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
      .sort(sortTeams);
  }, [items, selectedSubLeague, currentCheckedLeagueKeys]);

  const assignedTeams = useMemo(() => {
    if (!selectedSubLeague) return [];

    return items.filter((x) => normalizeSubLeague(x.subLeague) === selectedSubLeague).sort(sortTeams);
  }, [items, selectedSubLeague]);

  const countBySubLeague = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach((x) => {
      const s = normalizeSubLeague(x.subLeague);
      if (s) map.set(s, (map.get(s) ?? 0) + 1);
    });
    return map;
  }, [items]);

  const moveTeamToSubLeague = (target: { country: string; league: string; team: string }, subLeague: string | null) => {
    setItems((prev) => prev.map((x) => (x.country === target.country && x.league === target.league && x.team === target.team ? { ...x, subLeague } : x)));
  };

  const handleDropToSelectedSubLeague = () => {
    setDropHover(null);
    if (!draggingTeamKey || !selectedSubLeague) return;

    const [country, league, team] = draggingTeamKey.split("___");
    moveTeamToSubLeague({ country, league, team }, selectedSubLeague);
    setDraggingTeamKey(null);
  };

  const handleDropToUnassigned = () => {
    setDropHover(null);
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

  const dragProps = (team: TeamRow) => ({
    onDragStart: () => setDraggingTeamKey(teamKeyOf(team)),
    onDragEnd: () => {
      setDraggingTeamKey(null);
      setDropHover(null);
    },
  });

  return (
    <div>
      <ConsoleToolbar title="サブリーグ名反映設定" info={<span className="font-mono">API: {API_BASE}</span>}>
        <ConsoleButton onClick={() => void load()} loading={loading}>
          {!loading && <RefreshCw className="h-3.5 w-3.5" />}
          再読み込み
        </ConsoleButton>
        <ConsoleButton variant="success" onClick={() => void onSave()} loading={saving}>
          {!saving && <Save className="h-3.5 w-3.5" />}
          保存
        </ConsoleButton>
      </ConsoleToolbar>

      {alert && (
        <ConsoleNotice tone={ALERT_TONE[alert.type]} onClose={() => setAlert(null)}>
          {alert.message}
        </ConsoleNotice>
      )}

      <ConsolePanel title="サブリーグ名の追加" info="先にサブリーグ名を作成し、カードをクリックして対象の country / league / team を設定します">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addSubLeagueName();
          }}
          className="flex flex-wrap items-end gap-2"
        >
          <ConsoleField label="登録したいサブリーグ名">
            <ConsoleInput value={newSubLeagueName} onChange={(e) => setNewSubLeagueName(e.target.value)} placeholder="例: EAST / WEST / 上位 / 下位" className="w-72" />
          </ConsoleField>
          <ConsoleButton type="submit" variant="primary" disabled={!newSubLeagueName.trim()}>
            <Plus className="h-3.5 w-3.5" />
            追加
          </ConsoleButton>
        </form>
        <div className="mt-2 text-[11px] text-gray-500">手順: サブリーグ名を作成 → カードをクリック → 「country をチェック → league をチェック → team をドラッグ」 → 最後に「保存」。</div>
      </ConsolePanel>

      <ConsolePanel title="サブリーグ一覧" info={`${subLeagueNames.length}件`}>
        {subLeagueNames.length === 0 ? (
          <div className="py-6 text-center text-sm text-gray-400">まだサブリーグ名がありません。上の入力欄から追加してください。</div>
        ) : (
          <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
            {subLeagueNames.map((name) => {
              const count = countBySubLeague.get(name) ?? 0;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => openSubLeagueModal(name)}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50/50"
                >
                  <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-gray-900">{name}</span>
                  <StatusBadge tone={count > 0 ? "info" : "neutral"} dot={false}>
                    {count} teams
                  </StatusBadge>
                </button>
              );
            })}
          </div>
        )}
      </ConsolePanel>

      <ConsoleModal
        open={!!selectedSubLeague}
        title={selectedSubLeague ? `サブリーグ設定: ${selectedSubLeague}` : ""}
        description="country をチェック → league をチェック → 候補チームを右へドラッグ。変更は画面を閉じても残り、「保存」で反映されます。"
        onClose={closeModal}
        width={1400}
        footer={
          <div className="ml-auto flex gap-1.5">
            <ConsoleButton onClick={closeModal}>閉じる</ConsoleButton>
          </div>
        }
      >
        {alert && alert.type !== "success" && (
          <ConsoleNotice tone={ALERT_TONE[alert.type]} onClose={() => setAlert(null)}>
            {alert.message}
          </ConsoleNotice>
        )}
        <div className="grid h-[64vh] min-h-0 grid-cols-1 gap-3 lg:grid-cols-[300px_1fr_1fr]">
          {/* 対象国・リーグ */}
          <div className="flex min-h-0 flex-col rounded-xl border border-gray-200 bg-gray-50">
            <div className="border-b border-gray-200 px-3 py-2 text-[13px] font-bold text-gray-900">対象国・リーグ選択</div>
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {targetCountries.length === 0 ? (
                <div className="py-6 text-center text-xs text-gray-400">対象の国・リーグがありません。</div>
              ) : (
                <div className="grid gap-1.5">
                  {targetCountries.map((group) => {
                    const countryChecked = currentCheckedCountries.includes(group.country);
                    return (
                      <div key={group.country} className={`rounded-lg border bg-white px-2.5 py-1.5 ${countryChecked ? "border-indigo-200" : "border-gray-200"}`}>
                        <label className="flex cursor-pointer items-center gap-2 text-[13px] font-bold text-gray-900">
                          <input type="checkbox" checked={countryChecked} onChange={() => toggleCountryChecked(group.country)} className="accent-indigo-600" />
                          <span>{group.country}</span>
                          <span className="ml-auto text-[11px] font-normal text-gray-400">{group.leagues.length}</span>
                        </label>
                        {countryChecked && (
                          <div className="ml-5 mt-1 grid gap-1">
                            {group.leagues.map((league) => {
                              const leagueKey = `${group.country}___${league}`;
                              return (
                                <label key={leagueKey} className="flex cursor-pointer items-center gap-2 text-xs text-gray-700">
                                  <input type="checkbox" checked={currentCheckedLeagueKeys.includes(leagueKey)} onChange={() => toggleLeagueChecked(leagueKey)} className="accent-indigo-600" />
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

          {/* 候補チーム */}
          <div className="flex min-h-0 flex-col rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center gap-2 border-b border-gray-200 px-3 py-2">
              <span className="text-[13px] font-bold text-gray-900">候補チーム</span>
              <span className="text-xs tabular-nums text-gray-500">{candidateTeams.length}件</span>
              <span className="ml-auto text-[11px] text-gray-400">右の「{selectedSubLeague}」へドラッグ</span>
            </div>
            <div className="grid min-h-0 flex-1 content-start gap-1.5 overflow-y-auto p-2">
              {candidateTeams.map((team) => (
                <TeamChip
                  key={teamKeyOf(team)}
                  team={team}
                  {...dragProps(team)}
                  right={
                    <StatusBadge tone="neutral" dot={false}>
                      {normalizeSubLeague(team.subLeague) ?? "未設定"}
                    </StatusBadge>
                  }
                />
              ))}
              {candidateTeams.length === 0 && <div className="py-8 text-center text-xs text-gray-400">左で country をチェックし、その後 league をチェックすると、配下のチームが表示されます。</div>}
            </div>
          </div>

          {/* 所属チーム + 未設定に戻す */}
          <div className="flex min-h-0 flex-col gap-2">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDropHover("assign");
              }}
              onDragLeave={() => setDropHover(null)}
              onDrop={handleDropToSelectedSubLeague}
              className={[
                "flex min-h-0 flex-1 flex-col rounded-xl border-2 border-dashed transition-colors",
                dropHover === "assign" ? "border-indigo-500 bg-indigo-100/60" : "border-indigo-300 bg-indigo-50/60",
              ].join(" ")}
            >
              <div className="flex items-center gap-2 px-3 py-2">
                <span className="text-[13px] font-bold text-indigo-900">{selectedSubLeague}</span>
                <span className="text-xs tabular-nums text-indigo-700">{assignedTeams.length}件</span>
                <span className="ml-auto text-[11px] text-indigo-700/70">ここにドロップすると所属します</span>
              </div>
              <div className="grid min-h-0 flex-1 content-start gap-1.5 overflow-y-auto px-2 pb-2">
                {assignedTeams.map((team) => (
                  <TeamChip
                    key={teamKeyOf(team)}
                    team={team}
                    tone="assigned"
                    {...dragProps(team)}
                    right={
                      <ConsoleButton
                        size="sm"
                        variant="ghost"
                        className="hover:!bg-red-50 hover:!text-red-700"
                        onClick={() => moveTeamToSubLeague({ country: team.country, league: team.league, team: team.team }, null)}
                        title="未設定に戻す"
                      >
                        <Undo2 className="h-3 w-3" />
                        戻す
                      </ConsoleButton>
                    }
                  />
                ))}
                {assignedTeams.length === 0 && <div className="py-8 text-center text-xs text-indigo-700/60">まだこのサブリーグに所属するチームはありません。</div>}
              </div>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDropHover("unassign");
              }}
              onDragLeave={() => setDropHover(null)}
              onDrop={handleDropToUnassigned}
              className={["shrink-0 rounded-xl border-2 border-dashed px-3 py-2.5 transition-colors", dropHover === "unassign" ? "border-red-500 bg-red-100/70" : "border-red-300 bg-red-50/60"].join(
                " ",
              )}
            >
              <div className="text-[13px] font-bold text-red-800">未設定に戻す</div>
              <div className="text-[11px] text-red-700/80">所属チームをここへドラッグすると subLeague を解除します。</div>
            </div>
          </div>
        </div>
      </ConsoleModal>
    </div>
  );
}
