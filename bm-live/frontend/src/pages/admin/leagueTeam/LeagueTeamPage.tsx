// リーグ所属チーム付け替え設定  /admin/league-team
//  国を選ぶと、有効なリーグの一覧と、それぞれの所属チーム（country_league_master）が並ぶ。
//  リーグ名が変わったとき（新しいリーグ名はまずシーズンのマスタにだけ現れ、所属チームが 0）に、
//  旧リーグ名のチームを新リーグ名へ付け替える。リーグが1つしかない国は付け替えできない。
//  過去の所属が残っている・重複しているチームは「リーグから外す」（論理削除: del_flg = '1'）。
//  GET  /v1/api/admin/league-team/countries
//  GET  /v1/api/admin/league-team?country=
//  POST /v1/api/admin/league-team/move
//  POST /v1/api/admin/league-team/remove
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowRight, RefreshCw, Trash2 } from "lucide-react";
import {
  ConsoleButton,
  ConsoleCheck,
  ConsoleInput,
  ConsoleModal,
  ConsoleNotice,
  ConsolePanel,
  ConsoleSelect,
  ConsoleToolbar,
  StatChips,
  StatusBadge,
} from "../../../api/commonAdminDesign";

/** ================= Types ================= */
type CountryRow = { country: string; leagueCount: number };
type TeamRow = { id: number; league: string; team: string; link: string | null };
type LeagueRow = { league: string; inSeason: boolean; seasonYear: string | null; teams: TeamRow[] };
/** 重複（バリデーションエラー）: リンクの /team/xxx/yyy/ が同じ行が2行以上 */
type DuplicateRow = { link: string; team: string; leagues: string[]; ids: number[]; message: string };
type LeagueTeamResponse = { country: string; leagues: LeagueRow[]; duplicates: DuplicateRow[] };
type MoveRequest = { country: string; fromLeague: string; toLeague: string; teamIds: number[] };
type RemoveRequest = { country: string; league: string; teamIds: number[] };
type MoveResponse = { responseCode: string; message: string; movedCount: number; skippedTeams: string[] };
type Confirm = { mode: "move"; req: MoveRequest } | { mode: "remove"; req: RemoveRequest };

/** ================= API ================= */
const BASE = "/v1/api/admin/league-team";

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

/** 重複している行の id（サーバーのバリデーション結果。別リーグ・同じリーグの両方） */
function duplicateIdSet(dups: DuplicateRow[]): Set<number> {
  return new Set(dups.flatMap((d) => d.ids));
}

/** チーム名の比較キー（全角・半角・空白・大文字小文字の違いを無視） */
function teamKey(team: string) {
  return (team ?? "").normalize("NFKC").replace(/\s+/g, "").toLowerCase();
}

/** 同じリーグの中で、チーム名が同じ行が複数ある行の id（リンクが違っても印を付ける。バリデーションには使わない） */
function nameDuplicateIdSet(teams: TeamRow[]): Set<number> {
  const byName = new Map<string, number[]>();
  for (const t of teams) {
    const k = teamKey(t.team);
    byName.set(k, [...(byName.get(k) ?? []), t.id]);
  }
  return new Set(Array.from(byName.values()).filter((ids) => ids.length > 1).flat());
}

/**
 * このリーグの行のうち、重複グループの中で一番新しい行（id が一番大きい行）以外。
 * グループ = リンクが同じ行（別リーグを含む）と、同じリーグでチーム名が同じ行。
 */
function olderDuplicateIds(teams: TeamRow[], dups: DuplicateRow[]): number[] {
  const older = new Set<number>();
  const addGroup = (ids: number[]) => {
    const newest = Math.max(...ids);
    ids.filter((id) => id !== newest).forEach((id) => older.add(id));
  };
  for (const d of dups) addGroup(d.ids);
  const byName = new Map<string, number[]>();
  for (const t of teams) {
    const k = teamKey(t.team);
    byName.set(k, [...(byName.get(k) ?? []), t.id]);
  }
  for (const ids of byName.values()) if (ids.length > 1) addGroup(ids);
  return teams.filter((t) => older.has(t.id)).map((t) => t.id);
}

/** ================= Page ================= */
export default function LeagueTeamPage() {
  const [countryFilter, setCountryFilter] = useState("");
  const [country, setCountry] = useState<string | null>(null);
  /** 付け替えの選択: 移動元リーグ → 選んだチーム id */
  const [selected, setSelected] = useState<Record<string, Set<number>>>({});
  /** 移動元リーグ → 移動先リーグ */
  const [targets, setTargets] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "warn" | "ng"; title: string; body?: string } | null>(null);

  const countries = useQuery({ queryKey: ["league-team-countries"], queryFn: () => getJson<CountryRow[]>(`${BASE}/countries`) });

  const detail = useQuery({
    queryKey: ["league-team", country],
    queryFn: () => getJson<LeagueTeamResponse>(`${BASE}?country=${encodeURIComponent(country!)}`),
    enabled: !!country,
  });

  // 最初の国を選ぶ
  useEffect(() => {
    if (!country && countries.data && countries.data.length > 0) setCountry(countries.data[0].country);
  }, [country, countries.data]);

  // 国を変えたら選択を消す
  useEffect(() => {
    setSelected({});
    setTargets({});
  }, [country]);

  const filteredCountries = useMemo(() => {
    const q = countryFilter.trim();
    return (countries.data ?? []).filter((c) => !q || c.country.includes(q));
  }, [countries.data, countryFilter]);

  const leagues = detail.data?.leagues ?? [];
  const duplicates = detail.data?.duplicates ?? [];
  const dupIds = useMemo(() => duplicateIdSet(duplicates), [duplicates]);
  const hasDuplicates = duplicates.length > 0;
  // 重複が1件でもあれば付け替えはできない（リーグから外すことはできる）
  const canMove = leagues.length >= 2 && !hasDuplicates;
  const teamTotal = leagues.reduce((n, l) => n + l.teams.length, 0);
  const emptyLeagues = leagues.filter((l) => l.teams.length === 0).length;

  const move = useMutation({
    mutationFn: (c: Confirm) => (c.mode === "move" ? postJson<MoveResponse>(`${BASE}/move`, c.req) : postJson<MoveResponse>(`${BASE}/remove`, c.req)),
    onSuccess: async (r, c) => {
      const label = c.mode === "move" ? "付け替え" : "リーグから外す処理";
      setConfirm(null);
      if (r.responseCode !== "0") {
        setNotice({ tone: "ng", title: `${label}ができませんでした`, body: r.message });
        return;
      }
      setNotice({ tone: (r.skippedTeams ?? []).length > 0 ? "warn" : "ok", title: c.mode === "move" ? "付け替えました" : "リーグから外しました", body: r.message });
      const league = c.mode === "move" ? c.req.fromLeague : c.req.league;
      setSelected((s) => ({ ...s, [league]: new Set() }));
      await Promise.all([detail.refetch(), countries.refetch()]);
    },
    onError: (e, c) => {
      setConfirm(null);
      setNotice({ tone: "ng", title: c.mode === "move" ? "付け替えに失敗しました" : "リーグから外せませんでした", body: e instanceof Error ? e.message : String(e) });
    },
  });

  const toggleTeam = (league: string, id: number, on: boolean) =>
    setSelected((s) => {
      const next = new Set(s[league] ?? []);
      if (on) next.add(id);
      else next.delete(id);
      return { ...s, [league]: next };
    });

  const toggleAll = (l: LeagueRow, on: boolean) => setSelected((s) => ({ ...s, [l.league]: on ? new Set(l.teams.map((t) => t.id)) : new Set() }));

  const openMove = (l: LeagueRow) => {
    const to = targets[l.league];
    const ids = Array.from(selected[l.league] ?? []);
    if (!country || !to || ids.length === 0) return;
    setConfirm({ mode: "move", req: { country, fromLeague: l.league, toLeague: to, teamIds: ids } });
  };

  const openRemove = (l: LeagueRow) => {
    const ids = Array.from(selected[l.league] ?? []);
    if (!country || ids.length === 0) return;
    setConfirm({ mode: "remove", req: { country, league: l.league, teamIds: ids } });
  };

  const confirmTeams = useMemo(() => {
    if (!confirm) return [];
    const league = confirm.mode === "move" ? confirm.req.fromLeague : confirm.req.league;
    const l = leagues.find((x) => x.league === league);
    const ids = new Set(confirm.req.teamIds);
    return (l?.teams ?? []).filter((t) => ids.has(t.id));
  }, [confirm, leagues]);

  return (
    <div>
      <ConsoleToolbar title="リーグ所属チーム付け替え設定" info="リーグ名が変わったときに、旧リーグ名のチームを新しいリーグ名へ付け替えます">
        <ConsoleButton
          variant="primary"
          onClick={() => {
            void countries.refetch();
            void detail.refetch();
          }}
          loading={countries.isFetching || detail.isFetching}
        >
          {!(countries.isFetching || detail.isFetching) && <RefreshCw className="h-3.5 w-3.5" />}
          再取得
        </ConsoleButton>
      </ConsoleToolbar>

      {notice && (
        <ConsoleNotice tone={notice.tone} title={notice.title} onClose={() => setNotice(null)}>
          {notice.body}
        </ConsoleNotice>
      )}
      {countries.isError && (
        <ConsoleNotice tone="ng" title="国の一覧を読み込めませんでした">
          {(countries.error as Error)?.message}
        </ConsoleNotice>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-[240px_1fr]">
        {/* 国の一覧 */}
        <aside className="self-start overflow-hidden rounded-xl border border-gray-200 bg-white md:sticky md:top-2">
          <div className="flex items-center gap-2 border-b border-gray-200 px-3 py-2">
            <span className="text-sm font-bold text-gray-900">国</span>
            <span className="ml-auto text-xs tabular-nums text-gray-500">
              {filteredCountries.length}/{countries.data?.length ?? 0}
            </span>
          </div>
          <div className="border-b border-gray-100 p-2">
            <ConsoleInput value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)} placeholder="国で絞り込み" className="w-full" />
          </div>
          <div className="max-h-[65vh] overflow-auto py-1">
            {countries.isLoading ? (
              <div className="px-3 py-6 text-center text-xs text-gray-400">読み込み中…</div>
            ) : filteredCountries.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-gray-400">該当する国がありません</div>
            ) : (
              filteredCountries.map((c) => {
                const active = c.country === country;
                return (
                  <button
                    key={c.country}
                    type="button"
                    onClick={() => setCountry(c.country)}
                    disabled={move.isPending}
                    className={[
                      "flex w-full items-center gap-2 border-l-[3px] px-3 py-1.5 text-left text-[13px] transition-colors disabled:opacity-50",
                      active ? "border-indigo-600 bg-indigo-50 font-bold text-gray-900" : "border-transparent text-gray-700 hover:bg-gray-50",
                    ].join(" ")}
                  >
                    <span className="min-w-0 flex-1 truncate">{c.country}</span>
                    <span className={`text-[11px] tabular-nums ${c.leagueCount >= 2 ? "font-bold text-indigo-600" : "text-gray-400"}`} title="リーグ数">
                      {c.leagueCount}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* 選択中の国 */}
        <div className="min-w-0">
          <ConsolePanel title={country ?? "-"} info="リーグと、いま紐づいている所属チーム">
            <StatChips
              items={[
                { label: "リーグ", value: leagues.length },
                { label: "所属チーム", value: teamTotal },
                { label: "チームのいないリーグ", value: emptyLeagues, tone: emptyLeagues > 0 ? "warn" : "ok" },
              ]}
            />
            {!detail.isLoading && leagues.length === 1 && (
              <div className="mt-2 text-xs text-gray-500">この国のリーグは1つしかないため、付け替えはできません。</div>
            )}
          </ConsolePanel>

          {hasDuplicates && (
            <ConsoleNotice tone="ng" title={`重複しているチームがあります（${duplicates.length}件）。重複を解消するまで付け替えはできません`}>
              <ul className="list-disc space-y-0.5 pl-4">
                {duplicates.map((d) => (
                  <li key={d.link}>
                    {d.message}
                    <span className="ml-1 font-mono text-[11px] opacity-70">
                      {d.link}（id: {d.ids.join(", ")}）
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-1 text-[11px]">各リーグの「重複の古い行を選択」→「リーグから外す」で、一番新しい行（id が一番大きい行）だけを残せます。</div>
            </ConsoleNotice>
          )}

          {detail.isError ? (
            <ConsoleNotice tone="ng" title="リーグを読み込めませんでした">
              {(detail.error as Error)?.message}
            </ConsoleNotice>
          ) : detail.isLoading ? (
            <div className="rounded-xl border border-gray-200 bg-white px-3 py-8 text-center text-xs text-gray-400">読み込み中…</div>
          ) : (
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {leagues.map((l) => {
                const sel = selected[l.league] ?? new Set<number>();
                const others = leagues.filter((x) => x.league !== l.league);
                const to = targets[l.league] ?? "";
                const allOn = l.teams.length > 0 && sel.size === l.teams.length;
                const nameDupIds = nameDuplicateIdSet(l.teams);
                const dupCount = l.teams.filter((t) => dupIds.has(t.id) || nameDupIds.has(t.id)).length;
                const olderDups = olderDuplicateIds(l.teams, duplicates);
                return (
                  <section key={l.league} className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <header className="flex flex-wrap items-center gap-2 border-b border-gray-200 px-3 py-2">
                      <span className="text-sm font-bold text-gray-900">{l.league}</span>
                      {l.inSeason ? (
                        <StatusBadge tone="ok">シーズン {l.seasonYear ?? ""}</StatusBadge>
                      ) : (
                        <StatusBadge tone="neutral">シーズンなし</StatusBadge>
                      )}
                      {l.teams.length === 0 && <StatusBadge tone="warn">チームなし（新しいリーグ名の可能性）</StatusBadge>}
                      {dupCount > 0 && <StatusBadge tone="ng">重複 {dupCount} 行</StatusBadge>}
                      <span className="ml-auto text-xs tabular-nums text-gray-500">{l.teams.length} チーム</span>
                    </header>

                    <div className="max-h-[360px] flex-1 overflow-auto px-3 py-2">
                      {l.teams.length === 0 ? (
                        <div className="py-4 text-center text-xs text-gray-400">所属チームはいません</div>
                      ) : (
                        <>
                          <div className="mb-1 flex flex-wrap items-center gap-2 border-b border-gray-100 pb-1">
                            <ConsoleCheck checked={allOn} onChange={(v) => toggleAll(l, v)} disabled={move.isPending}>
                              <span className="text-xs text-gray-500">すべて選択</span>
                            </ConsoleCheck>
                            {olderDups.length > 0 && (
                              <ConsoleButton
                                size="sm"
                                variant="ghost"
                                disabled={move.isPending}
                                onClick={() => setSelected((s) => ({ ...s, [l.league]: new Set(olderDups) }))}
                                title="リンクが同じチームが複数行あるとき、一番新しい行（id が一番大きい行）以外を選びます"
                              >
                                重複の古い行を選択（{olderDups.length}）
                              </ConsoleButton>
                            )}
                          </div>
                          <ul className="space-y-0.5">
                            {l.teams.map((t) => {
                              const linkDup = dupIds.has(t.id);
                              const nameDup = nameDupIds.has(t.id);
                              const dup = linkDup || nameDup;
                              return (
                                <li key={t.id} className={`flex items-center gap-2 rounded text-[13px] ${dup ? "bg-red-50" : ""}`}>
                                  <ConsoleCheck checked={sel.has(t.id)} onChange={(v) => toggleTeam(l.league, t.id, v)} disabled={move.isPending}>
                                    <span className="font-semibold text-gray-900">{t.team}</span>
                                  </ConsoleCheck>
                                  {dup && (
                                    <span
                                      className="text-[10px] font-bold text-red-600"
                                      title={linkDup ? "リンク（/team/xxx/yyy/）が同じ行があります" : "同じリーグに同じ名前のチームがあります（リンクは別）"}
                                    >
                                      重複
                                    </span>
                                  )}
                                  <span className="ml-auto max-w-[45%] truncate font-mono text-[11px] text-gray-400" title={`id ${t.id}  ${t.link ?? ""}`}>
                                    <span className="mr-1 text-gray-300">#{t.id}</span>
                                    {t.link ?? ""}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </>
                      )}
                    </div>

                    {l.teams.length > 0 && (
                      <footer className="flex flex-wrap items-center gap-2 border-t border-gray-200 bg-gray-50 px-3 py-2">
                        <span className="text-xs text-gray-500">選択 {sel.size} チームを</span>
                        {canMove && (
                          <>
                            <ConsoleSelect
                              value={to}
                              onChange={(e) => setTargets((s) => ({ ...s, [l.league]: e.target.value }))}
                              disabled={move.isPending}
                              className="min-w-[10rem]"
                            >
                              <option value="">移動先のリーグ</option>
                              {others.map((o) => (
                                <option key={o.league} value={o.league}>
                                  {o.league}
                                  {o.teams.length === 0 ? "（チームなし）" : `（${o.teams.length}）`}
                                </option>
                              ))}
                            </ConsoleSelect>
                            <ConsoleButton variant="primary" size="sm" disabled={!to || sel.size === 0 || move.isPending} onClick={() => openMove(l)}>
                              <ArrowRight className="h-3.5 w-3.5" />
                              付け替え
                            </ConsoleButton>
                          </>
                        )}
                        <ConsoleButton variant="danger" size="sm" className="ml-auto" disabled={sel.size === 0 || move.isPending} onClick={() => openRemove(l)}>
                          <Trash2 className="h-3.5 w-3.5" />
                          リーグから外す
                        </ConsoleButton>
                      </footer>
                    )}
                  </section>
                );
              })}
            </div>
          )}

          <div className="mt-2 text-[11px] text-gray-400">
            ※ 付け替えは country_league_master のリーグ名だけを変えます。移動先に同じ名前のチームがいる場合、そのチームは付け替えません（重複させないため）。
            「リーグから外す」は論理削除（del_flg = 1）です。行は消さず、同じチームがまたそのリーグに来たときはチームの取り込み（B004）で元に戻ります。
          </div>
        </div>
      </div>

      <ConsoleModal
        open={confirm != null}
        title={confirm?.mode === "remove" ? "チームをリーグから外します" : "チームを付け替えます"}
        description={
          confirm == null
            ? undefined
            : confirm.mode === "move"
              ? `「${confirm.req.fromLeague}」→「${confirm.req.toLeague}」（${confirm.req.country}）`
              : `「${confirm.req.league}」（${confirm.req.country}）から外します。論理削除（del_flg = 1）で、行は消しません。`
        }
        onClose={() => !move.isPending && setConfirm(null)}
        busy={move.isPending}
        width={520}
        footer={
          <>
            <ConsoleButton onClick={() => setConfirm(null)} disabled={move.isPending}>
              やめる
            </ConsoleButton>
            <ConsoleButton variant={confirm?.mode === "remove" ? "danger" : "primary"} loading={move.isPending} onClick={() => confirm && move.mutate(confirm)}>
              {confirm?.mode === "remove" ? "外す" : "付け替える"}
            </ConsoleButton>
          </>
        }
      >
        <div className="mb-2 text-xs text-gray-500">{confirmTeams.length} チーム</div>
        <ul className="max-h-[50vh] space-y-0.5 overflow-auto text-[13px]">
          {confirmTeams.map((t) => (
            <li key={t.id} className="flex gap-2">
              <span>{t.team}</span>
              <span className="truncate font-mono text-[11px] text-gray-400">
                #{t.id} {t.link ?? ""}
              </span>
            </li>
          ))}
        </ul>
      </ConsoleModal>
    </div>
  );
}
