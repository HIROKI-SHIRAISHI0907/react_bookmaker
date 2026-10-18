import { useEffect, useMemo, useState, useTransition } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Copy, RefreshCw } from "lucide-react";
import {
  ConsoleButton,
  ConsoleColumn,
  ConsoleInput,
  ConsoleNotice,
  ConsolePanel,
  ConsoleTable,
  ConsoleToolbar,
  NoticeTone,
  SegmentedTabs,
  StatChips,
  StatusBadge,
} from "../../../api/commonAdminDesign";

/** ================= Types ================= */
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

type ShowMode = "all" | "hidden";

/** ================= API ================= */
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

/** ================= Utils ================= */
function uniqSorted(arr: string[]) {
  return Array.from(new Set(arr)).sort((a, b) => a.localeCompare(b, "ja"));
}
function makeKey(country: string, league: string) {
  return `${country}__${league}`;
}
function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e ?? "");
}

/** ================= Page ================= */
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

  /** 全件（delFlg=1含む） */
  const allRows = useMemo(() => rows ?? [], [rows]);

  /** サイドバー用（国一覧） */
  const countries = useMemo(() => uniqSorted(allRows.map((r) => r.country)), [allRows]);

  const leaguesByCountry = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const r of allRows) map.set(r.country, [...(map.get(r.country) ?? []), r.league]);
    for (const [k, v] of map.entries()) map.set(k, uniqSorted(v));
    return map;
  }, [allRows]);

  /** 国×リーグ → チームDTO[] */
  const teamsByCountryLeague = useMemo(() => {
    const map = new Map<string, CountryLeagueDTO[]>();
    for (const r of allRows) {
      const key = makeKey(r.country, r.league);
      map.set(key, [...(map.get(key) ?? []), r]);
    }
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

  /** ===== selection state ===== */
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  /** ===== UI state ===== */
  const [countryFilter, setCountryFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [showMode, setShowMode] = useState<ShowMode>("all");
  const [toast, setToast] = useState<{ type: NoticeTone; title: string; message: string } | null>(null);

  /** 初期国 */
  useEffect(() => {
    if (!countries.length) return;
    if (!selectedCountry) setSelectedCountry(countries[0]);
  }, [countries, selectedCountry]);

  /** 国に応じてリーグの初期選択 */
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

  const currentTeamRowsRaw = useMemo(() => {
    if (!selectedCountry || !selectedLeague) return [];
    return teamsByCountryLeague.get(makeKey(selectedCountry, selectedLeague)) ?? [];
  }, [selectedCountry, selectedLeague, teamsByCountryLeague]);

  const currentTeamRows = useMemo(() => {
    const tf = teamFilter.trim().toLowerCase();
    return currentTeamRowsRaw.filter((r) => {
      if (showMode === "hidden" && r.delFlg !== "1") return false;
      if (!tf) return true;
      return r.team.toLowerCase().includes(tf) || (r.link ?? "").toLowerCase().includes(tf);
    });
  }, [currentTeamRowsRaw, teamFilter, showMode]);

  /** counts */
  const hiddenCount = useMemo(() => currentTeamRowsRaw.filter((r) => r.delFlg === "1").length, [currentTeamRowsRaw]);
  const totalCount = currentTeamRowsRaw.length;

  /** ===== mutation ===== */
  const toggleMutation = useMutation({
    mutationFn: async (req: ForceAdminRequest) => postJson<ForceAdminResponse>("/v1/api/admin/force/update/control", req),
    onSuccess: async () => {
      await refetch();
    },
  });

  const saving = toggleMutation.isPending;

  async function toggleDelFlg(row: CountryLeagueDTO) {
    const next: "0" | "1" = row.delFlg === "0" ? "1" : "0";
    const ok = window.confirm(`${row.country} / ${row.league} / ${row.team}\nを ${next === "1" ? "非表示(del_flg=1)" : "表示に戻す(del_flg=0)"} に更新します。\nよろしいですか？`);
    if (!ok) return;

    try {
      const res = await toggleMutation.mutateAsync({
        country: row.country,
        league: row.league,
        team: row.team,
        delFlg: next,
      });

      if (res.responseCode !== "0") {
        setToast({ type: "ng", title: "更新失敗", message: res.message });
        return;
      }

      setToast({
        type: "ok",
        title: "更新完了",
        message: `${row.team} を ${next === "1" ? "非表示" : "表示"} にしました`,
      });
    } catch (e) {
      setToast({ type: "ng", title: "更新失敗", message: getErrorMessage(e) });
    }
  }

  /** ===== filtered countries (sidebar) ===== */
  const filteredCountries = useMemo(() => {
    const f = countryFilter.trim().toLowerCase();
    if (!f) return countries;
    return countries.filter((c) => c.toLowerCase().includes(f));
  }, [countries, countryFilter]);

  const columns: ConsoleColumn<CountryLeagueDTO>[] = [
    {
      key: "team",
      header: "チーム",
      cell: (r) => <span className={`font-bold ${r.delFlg === "1" ? "text-gray-400 line-through" : ""}`}>{r.team}</span>,
    },
    {
      key: "state",
      header: "状態",
      cell: (r) => (r.delFlg === "1" ? <StatusBadge tone="neutral">非表示</StatusBadge> : <StatusBadge tone="ok">表示</StatusBadge>),
    },
    {
      key: "link",
      header: "link",
      mono: true,
      className: "max-w-[360px] truncate text-gray-500",
      cell: (r) => (r.link ? <span title={r.link}>{r.link}</span> : <span className="text-gray-300">-</span>),
    },
    { key: "id", header: "id", mono: true, cell: (r) => <span className="text-gray-500">{r.id}</span> },
    {
      key: "ops",
      header: "操作",
      align: "right",
      cell: (r) => {
        const hidden = r.delFlg === "1";
        return (
          <span className="inline-flex gap-1">
            <ConsoleButton size="sm" variant={hidden ? "primary" : "default"} onClick={() => void toggleDelFlg(r)} disabled={saving} loading={saving && toggleMutation.variables?.team === r.team}>
              {hidden ? "表示に戻す" : "非表示にする"}
            </ConsoleButton>
            <ConsoleButton size="sm" variant="ghost" disabled={!r.link} onClick={() => r.link && void navigator.clipboard.writeText(r.link)} title="linkコピー">
              <Copy className="h-3 w-3" />
            </ConsoleButton>
          </span>
        );
      },
    },
  ];

  return (
    <div>
      <ConsoleToolbar title="お気に入り国リーグ情報全体反映設定" info="管理者側でチーム名の表示 / 非表示を切り替えます">
        <StatusBadge tone={isFetching ? "warn" : "ok"}>{isFetching ? "更新中…" : "最新"}</StatusBadge>
        <ConsoleButton variant="primary" onClick={() => void refetch()} disabled={saving} loading={isFetching}>
          {!isFetching && <RefreshCw className="h-3.5 w-3.5" />}
          再取得
        </ConsoleButton>
      </ConsoleToolbar>

      {toast && (
        <ConsoleNotice tone={toast.type} title={toast.title} onClose={() => setToast(null)}>
          {toast.message}
        </ConsoleNotice>
      )}

      {isError ? (
        <ConsoleNotice tone="ng" title="読み込みに失敗">
          {(error as Error)?.message ?? "unknown error"}
        </ConsoleNotice>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[240px_1fr]">
          {/* 国の一覧 */}
          <aside className="self-start overflow-hidden rounded-xl border border-gray-200 bg-white md:sticky md:top-2">
            <div className="flex items-center gap-2 border-b border-gray-200 px-3 py-2">
              <span className="text-sm font-bold text-gray-900">国</span>
              <span className="ml-auto text-xs tabular-nums text-gray-500">
                {filteredCountries.length}/{countries.length}
              </span>
            </div>
            <div className="border-b border-gray-100 p-2">
              <ConsoleInput value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)} placeholder="国で絞り込み" className="w-full" />
            </div>
            <div className="max-h-[65vh] overflow-auto py-1">
              {isLoading ? (
                <div className="px-3 py-6 text-center text-xs text-gray-400">読み込み中…</div>
              ) : filteredCountries.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-gray-400">該当する国がありません</div>
              ) : (
                filteredCountries.map((c) => {
                  const active = c === selectedCountry;
                  const leagues = leaguesByCountry.get(c) ?? [];
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => startTransition(() => setSelectedCountry(c))}
                      disabled={saving}
                      className={[
                        "flex w-full items-center gap-2 border-l-[3px] px-3 py-1.5 text-left text-[13px] transition-colors disabled:opacity-50",
                        active ? "border-indigo-600 bg-indigo-50 font-bold text-gray-900" : "border-transparent text-gray-700 hover:bg-gray-50",
                      ].join(" ")}
                    >
                      <span className="min-w-0 flex-1 truncate">{c}</span>
                      <span className="text-[11px] tabular-nums text-gray-400">{leagues.length}</span>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* 選択中の国 */}
          <div className="min-w-0">
            <ConsolePanel
              title={
                <>
                  {selectedCountry ?? "-"} / {selectedLeague ?? "-"}
                  {isPending && <span className="ml-2 text-xs font-normal text-gray-500">（切替中…）</span>}
                </>
              }
              info="非表示はグレー・取り消し線。ボタンで即切替します"
            >
              <div className="mb-1 text-[11px] font-bold text-gray-500">リーグ</div>
              <div className="flex flex-wrap gap-1.5">
                {currentLeagues.length === 0 && <span className="text-xs text-gray-400">リーグがありません</span>}
                {currentLeagues.map((lg) => {
                  const active = lg === selectedLeague;
                  return (
                    <button
                      key={lg}
                      type="button"
                      onClick={() => startTransition(() => setSelectedLeague(lg))}
                      disabled={saving}
                      className={[
                        "h-7 rounded-full border px-3 text-xs font-bold transition-colors disabled:opacity-50",
                        active ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50",
                      ].join(" ")}
                    >
                      {lg}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <ConsoleInput
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                  placeholder="チーム / リンクで絞り込み（例: Reds / urawa / https...）"
                  className="min-w-[260px] flex-1"
                />
                <SegmentedTabs<ShowMode>
                  value={showMode}
                  onChange={setShowMode}
                  disabled={saving}
                  options={[
                    { value: "all", label: "すべて" },
                    { value: "hidden", label: "非表示のみ" },
                  ]}
                />
              </div>
            </ConsolePanel>

            <StatChips
              items={[
                { label: "総数", value: totalCount },
                { label: "非表示", value: hiddenCount, tone: hiddenCount > 0 ? "warn" : "ok" },
                { label: "表示中", value: currentTeamRows.length },
                { label: "全レコード", value: allRows.length },
              ]}
            />

            {toggleMutation.isError && (
              <ConsoleNotice tone="ng" title="更新に失敗">
                {(toggleMutation.error as Error)?.message ?? "unknown error"}
              </ConsoleNotice>
            )}

            <ConsoleTable
              columns={columns}
              rows={currentTeamRows}
              rowKey={(r) => r.id}
              loading={isLoading}
              emptyText={currentTeamRowsRaw.length === 0 ? "チームがありません" : "フィルター条件に一致するチームがありません"}
              rowClassName={(r) => (r.delFlg === "1" ? "!bg-gray-50" : "")}
              maxHeight="calc(100vh - 320px)"
            />

            <div className="mt-2 text-[11px] text-gray-400">
              ※ 更新は <b>country / league / team</b> をキーにして API に送ります。反映されない場合は、API側の認可（管理者権限）・CORS・セッション（credentials: include）を確認してください。
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
