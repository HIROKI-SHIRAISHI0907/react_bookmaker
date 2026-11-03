// 大会出場チーム登録設定  /admin/cup-competition
//  ACL など、各国のリーグのチームが出る大会と、その出場チームを登録する。
//  - 大会: Flashscore の大会ページ URL（例: https://www.flashscore.co.jp/soccer/asia/afc-champions-league/）
//  - 出場チーム: スクレイピング対象（b001_country_league.json）のリーグにいるチームから選ぶ
//  登録・変更のたびに S3（aws-s3-cup-schedule-csv）の b026_cup_competition.json を出力する。
//  日程は日程スクレイパー（cup-schedule-data）が b026_cup_schedule.json に出力し、
//  試合日の翌日に Lambda（cup-schedule-runner）が B016 の試合詳細スクレイピングへ出場選手の取得を依頼する。
//  GET  /v1/api/admin/cup-competition
//  POST /v1/api/admin/cup-competition/save | /delete | /export
//  GET  /v1/api/admin/cup-competition/candidates
//  GET  /v1/api/admin/cup-competition/teams?competitionId=
//  POST /v1/api/admin/cup-competition/teams/add | /teams/remove
//  GET  /v1/api/admin/cup-competition/schedule?competitionId=
//  POST /v1/api/admin/cup-competition/schedule/retry
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ExternalLink, Pencil, Plus, RefreshCw, RotateCcw, Trash2, Upload } from "lucide-react";
import {
  ConsoleButton,
  ConsoleCheck,
  ConsoleField,
  ConsoleInput,
  ConsoleModal,
  ConsoleNotice,
  ConsolePanel,
  ConsoleSelect,
  ConsoleToolbar,
  StatChips,
  StatusBadge,
} from "../../../api/commonAdminDesign";
import type { BadgeTone } from "../../../api/commonAdminDesign";

/** ================= Types ================= */
type Competition = {
  id: number;
  competitionName: string;
  region: string | null;
  competitionUrl: string;
  seasonYear: string | null;
  dispOrder: number;
  scrapeFlg: string;
  teamCount: number;
};
type CupTeam = { id: number; competitionId: number; country: string; league: string; team: string; link: string | null };
type CandidateTeam = { country: string; league: string; team: string; link: string | null };
type CandidateCountry = { country: string; leagues: { league: string; teams: CandidateTeam[] }[] };
type ScheduleStatus = "SCHEDULED" | "WAITING" | "REQUESTED" | "REGISTERED" | "EXPIRED";
type ScheduleMatch = {
  mid: string;
  url: string;
  date: string;
  kickoff: string;
  round: string;
  home: string;
  away: string;
  targetTeams: string;
  status: ScheduleStatus;
  requestedAt: string | null;
};
type Schedule = { exists: boolean; generatedAt: string | null; matches: ScheduleMatch[] };
type Result = { responseCode: string; message: string; count: number; id: number | null };
type SaveRequest = {
  id: number | null;
  competitionName: string;
  region: string;
  competitionUrl: string;
  seasonYear: string;
  dispOrder: number;
  scrapeFlg: string;
};

/** ================= API ================= */
const BASE = "/v1/api/admin/cup-competition";

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

const STATUS_LABEL: Record<ScheduleStatus, { label: string; tone: BadgeTone; title: string }> = {
  SCHEDULED: { label: "試合前", tone: "neutral", title: "試合日の翌日になったら出場選手を取ります" },
  WAITING: { label: "取得待ち", tone: "info", title: "次の Lambda の実行で、出場選手の取得を依頼します" },
  REQUESTED: { label: "取得依頼済", tone: "warn", title: "B016 の試合詳細スクレイピング → 登録待ちです。翌日になっても登録済みにならなければ「取り直す」" },
  REGISTERED: { label: "登録済", tone: "ok", title: "出場選手を登録しました（match_detail_lineup）" },
  EXPIRED: { label: "未取得", tone: "ng", title: "取る期間を過ぎました。「取り直す」で依頼できます" },
};

const EMPTY_FORM: SaveRequest = { id: null, competitionName: "", region: "", competitionUrl: "", seasonYear: "", dispOrder: 0, scrapeFlg: "1" };

/** ================= Page ================= */
export default function CupCompetitionPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<SaveRequest | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Competition | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "warn" | "ng"; title: string; body?: string } | null>(null);

  // 出場チームの追加
  const [addCountry, setAddCountry] = useState("");
  const [addLeague, setAddLeague] = useState("");
  const [addTeams, setAddTeams] = useState<Set<string>>(new Set());
  // 出場チームを外す
  const [removeIds, setRemoveIds] = useState<Set<number>>(new Set());
  // 取り直し
  const [retryMids, setRetryMids] = useState<Set<string>>(new Set());

  const competitions = useQuery({ queryKey: ["cup-competitions"], queryFn: () => getJson<Competition[]>(BASE) });
  const candidates = useQuery({ queryKey: ["cup-candidates"], queryFn: () => getJson<CandidateCountry[]>(`${BASE}/candidates`), staleTime: 300_000 });
  const teams = useQuery({
    queryKey: ["cup-teams", selectedId],
    queryFn: () => getJson<CupTeam[]>(`${BASE}/teams?competitionId=${selectedId}`),
    enabled: selectedId != null,
  });
  const schedule = useQuery({
    queryKey: ["cup-schedule", selectedId],
    queryFn: () => getJson<Schedule>(`${BASE}/schedule?competitionId=${selectedId}`),
    enabled: selectedId != null,
  });

  // 最初の大会を選ぶ・消えた大会を選んでいたら外す
  useEffect(() => {
    const list = competitions.data ?? [];
    if (list.length === 0) {
      if (selectedId != null && competitions.isSuccess) setSelectedId(null);
      return;
    }
    if (selectedId == null || !list.some((c) => c.id === selectedId)) setSelectedId(list[0].id);
  }, [competitions.data, competitions.isSuccess, selectedId]);

  // 大会を変えたら選択を消す
  useEffect(() => {
    setAddTeams(new Set());
    setRemoveIds(new Set());
    setRetryMids(new Set());
  }, [selectedId]);

  const selected = (competitions.data ?? []).find((c) => c.id === selectedId) ?? null;
  const registeredKeys = useMemo(() => new Set((teams.data ?? []).map((t) => `${t.country}\t${t.league}\t${t.team}`)), [teams.data]);
  const countryRow = (candidates.data ?? []).find((c) => c.country === addCountry);
  const leagueRow = countryRow?.leagues.find((l) => l.league === addLeague);
  const addable = (leagueRow?.teams ?? []).filter((t) => !registeredKeys.has(`${t.country}\t${t.league}\t${t.team}`));

  const matches = schedule.data?.matches ?? [];
  const counts = useMemo(() => {
    const c: Record<ScheduleStatus, number> = { SCHEDULED: 0, WAITING: 0, REQUESTED: 0, REGISTERED: 0, EXPIRED: 0 };
    matches.forEach((m) => (c[m.status] = (c[m.status] ?? 0) + 1));
    return c;
  }, [matches]);

  const refetchAll = async () => {
    await Promise.all([competitions.refetch(), teams.refetch(), schedule.refetch()]);
  };

  const showResult = (r: Result, okTitle: string, ngTitle: string) => {
    if (r.responseCode !== "0") setNotice({ tone: "ng", title: ngTitle, body: r.message });
    else setNotice({ tone: r.message.includes("ただし") || r.message.includes("登録しなかった") ? "warn" : "ok", title: okTitle, body: r.message });
  };

  const save = useMutation({
    mutationFn: (req: SaveRequest) => postJson<Result>(`${BASE}/save`, req),
    onSuccess: async (r) => {
      showResult(r, "大会を保存しました", "大会を保存できませんでした");
      if (r.responseCode === "0") {
        setForm(null);
        await competitions.refetch();
        if (r.id != null) setSelectedId(r.id);
      }
    },
    onError: (e) => setNotice({ tone: "ng", title: "大会を保存できませんでした", body: (e as Error).message }),
  });

  const remove = useMutation({
    mutationFn: (id: number) => postJson<Result>(`${BASE}/delete`, { id }),
    onSuccess: async (r) => {
      setDeleteTarget(null);
      showResult(r, "大会を削除しました", "大会を削除できませんでした");
      await competitions.refetch();
    },
    onError: (e) => {
      setDeleteTarget(null);
      setNotice({ tone: "ng", title: "大会を削除できませんでした", body: (e as Error).message });
    },
  });

  const add = useMutation({
    mutationFn: () =>
      postJson<Result>(`${BASE}/teams/add`, {
        competitionId: selectedId,
        teams: addable.filter((t) => addTeams.has(t.team)).map((t) => ({ country: t.country, league: t.league, team: t.team })),
      }),
    onSuccess: async (r) => {
      showResult(r, "出場チームを登録しました", "出場チームを登録できませんでした");
      setAddTeams(new Set());
      await refetchAll();
    },
    onError: (e) => setNotice({ tone: "ng", title: "出場チームを登録できませんでした", body: (e as Error).message }),
  });

  const removeTeams = useMutation({
    mutationFn: () => postJson<Result>(`${BASE}/teams/remove`, { competitionId: selectedId, ids: Array.from(removeIds) }),
    onSuccess: async (r) => {
      showResult(r, "出場チームから外しました", "出場チームから外せませんでした");
      setRemoveIds(new Set());
      await refetchAll();
    },
    onError: (e) => setNotice({ tone: "ng", title: "出場チームから外せませんでした", body: (e as Error).message }),
  });

  const exportJson = useMutation({
    mutationFn: () => postJson<Result>(`${BASE}/export`, {}),
    onSuccess: (r) => showResult(r, "JSON を出力しました", "JSON を出力できませんでした"),
    onError: (e) => setNotice({ tone: "ng", title: "JSON を出力できませんでした", body: (e as Error).message }),
  });

  const retry = useMutation({
    mutationFn: () => postJson<Result>(`${BASE}/schedule/retry`, { mids: Array.from(retryMids) }),
    onSuccess: async (r) => {
      showResult(r, "取り直しにしました", "取り直しにできませんでした");
      setRetryMids(new Set());
      await schedule.refetch();
    },
    onError: (e) => setNotice({ tone: "ng", title: "取り直しにできませんでした", body: (e as Error).message }),
  });

  const busy = save.isPending || remove.isPending || add.isPending || removeTeams.isPending || exportJson.isPending || retry.isPending;
  // 試合前・登録済みは取り直せない（取得待ちは依頼前なので不要）
  const retryable = (m: ScheduleMatch) => m.status === "REQUESTED" || m.status === "EXPIRED";

  return (
    <div>
      <ConsoleToolbar title="大会出場チーム登録設定" info="ACL など、各国のリーグのチームが出る大会と出場チームを登録します。試合日の翌日に出場選手を取ります">
        <ConsoleButton onClick={() => exportJson.mutate()} loading={exportJson.isPending} disabled={busy} title="大会と出場チームを S3 の b026_cup_competition.json へ出力し直します">
          {!exportJson.isPending && <Upload className="h-3.5 w-3.5" />}
          JSON を出力し直す
        </ConsoleButton>
        <ConsoleButton onClick={() => void refetchAll()} loading={competitions.isFetching || schedule.isFetching} disabled={busy}>
          {!(competitions.isFetching || schedule.isFetching) && <RefreshCw className="h-3.5 w-3.5" />}
          再取得
        </ConsoleButton>
        <ConsoleButton variant="primary" onClick={() => setForm({ ...EMPTY_FORM })} disabled={busy}>
          <Plus className="h-3.5 w-3.5" />
          大会を追加
        </ConsoleButton>
      </ConsoleToolbar>

      {notice && (
        <ConsoleNotice tone={notice.tone} title={notice.title} onClose={() => setNotice(null)}>
          {notice.body}
        </ConsoleNotice>
      )}
      {competitions.isError && (
        <ConsoleNotice tone="ng" title="大会の一覧を読み込めませんでした">
          {(competitions.error as Error)?.message}
        </ConsoleNotice>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-[260px_1fr]">
        {/* 大会の一覧 */}
        <aside className="self-start overflow-hidden rounded-xl border border-gray-200 bg-white md:sticky md:top-2">
          <div className="flex items-center gap-2 border-b border-gray-200 px-3 py-2">
            <span className="text-sm font-bold text-gray-900">大会</span>
            <span className="ml-auto text-xs tabular-nums text-gray-500">{competitions.data?.length ?? 0}</span>
          </div>
          <div className="max-h-[65vh] overflow-auto py-1">
            {competitions.isLoading ? (
              <div className="px-3 py-6 text-center text-xs text-gray-400">読み込み中…</div>
            ) : (competitions.data ?? []).length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-gray-400">大会が登録されていません。「大会を追加」から登録してください</div>
            ) : (
              (competitions.data ?? []).map((c) => {
                const active = c.id === selectedId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    disabled={busy}
                    className={[
                      "flex w-full flex-col gap-0.5 border-l-[3px] px-3 py-1.5 text-left text-[13px] transition-colors disabled:opacity-50",
                      active ? "border-indigo-600 bg-indigo-50 text-gray-900" : "border-transparent text-gray-700 hover:bg-gray-50",
                    ].join(" ")}
                  >
                    <span className={`truncate ${active ? "font-bold" : ""}`}>{c.competitionName}</span>
                    <span className="flex items-center gap-2 text-[11px] text-gray-500">
                      <span className="truncate">{c.region || "-"}</span>
                      {c.seasonYear && <span className="truncate">{c.seasonYear}</span>}
                      <span className="ml-auto tabular-nums" title="出場チーム数">
                        {c.teamCount} チーム
                      </span>
                      {c.scrapeFlg !== "1" && <span className="font-bold text-amber-600">停止中</span>}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* 選択中の大会 */}
        <div className="min-w-0 space-y-3">
          {!selected ? (
            <div className="rounded-xl border border-gray-200 bg-white px-3 py-8 text-center text-xs text-gray-400">大会を選んでください</div>
          ) : (
            <>
              <ConsolePanel
                title={selected.competitionName}
                info={selected.region || undefined}
                right={
                  <div className="flex gap-2">
                    <ConsoleButton
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        setForm({
                          id: selected.id,
                          competitionName: selected.competitionName,
                          region: selected.region ?? "",
                          competitionUrl: selected.competitionUrl,
                          seasonYear: selected.seasonYear ?? "",
                          dispOrder: selected.dispOrder,
                          scrapeFlg: selected.scrapeFlg,
                        })
                      }
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      編集
                    </ConsoleButton>
                    <ConsoleButton size="sm" variant="danger" disabled={busy} onClick={() => setDeleteTarget(selected)}>
                      <Trash2 className="h-3.5 w-3.5" />
                      削除
                    </ConsoleButton>
                  </div>
                }
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                  {selected.scrapeFlg === "1" ? <StatusBadge tone="ok">日程を取る</StatusBadge> : <StatusBadge tone="warn">日程を取らない（停止中）</StatusBadge>}
                  {selected.seasonYear && <StatusBadge tone="neutral">シーズン {selected.seasonYear}</StatusBadge>}
                  <a href={selected.competitionUrl} target="_blank" rel="noreferrer" className="inline-flex min-w-0 items-center gap-1 truncate font-mono text-[11px] text-indigo-600 hover:underline">
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    {selected.competitionUrl}
                  </a>
                </div>
              </ConsolePanel>

              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                {/* 出場チーム */}
                <section className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <header className="flex items-center gap-2 border-b border-gray-200 px-3 py-2">
                    <span className="text-sm font-bold text-gray-900">出場チーム</span>
                    <span className="ml-auto text-xs tabular-nums text-gray-500">{teams.data?.length ?? 0} チーム</span>
                  </header>
                  <div className="max-h-[320px] flex-1 overflow-auto px-3 py-2">
                    {teams.isLoading ? (
                      <div className="py-4 text-center text-xs text-gray-400">読み込み中…</div>
                    ) : (teams.data ?? []).length === 0 ? (
                      <div className="py-4 text-center text-xs text-gray-400">出場チームはまだ登録されていません。右の「チームを追加」から選んでください</div>
                    ) : (
                      <ul className="space-y-0.5">
                        {(teams.data ?? []).map((t) => (
                          <li key={t.id} className="flex items-center gap-2 text-[13px]">
                            <ConsoleCheck
                              checked={removeIds.has(t.id)}
                              onChange={(v) =>
                                setRemoveIds((s) => {
                                  const n = new Set(s);
                                  if (v) n.add(t.id);
                                  else n.delete(t.id);
                                  return n;
                                })
                              }
                              disabled={busy}
                            >
                              <span className="font-semibold text-gray-900">{t.team}</span>
                            </ConsoleCheck>
                            <span className="truncate text-[11px] text-gray-500">
                              {t.country} / {t.league}
                            </span>
                            {!t.link && (
                              <span className="text-[10px] font-bold text-amber-600" title="country_league_master にリンクが無いため、日程はチーム名で突き合わせます">
                                リンクなし
                              </span>
                            )}
                            <span className="ml-auto max-w-[35%] truncate font-mono text-[11px] text-gray-400" title={t.link ?? ""}>
                              {t.link ?? ""}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <footer className="flex items-center gap-2 border-t border-gray-200 bg-gray-50 px-3 py-2">
                    <span className="text-xs text-gray-500">選択 {removeIds.size} チームを</span>
                    <ConsoleButton variant="danger" size="sm" className="ml-auto" disabled={removeIds.size === 0 || busy} loading={removeTeams.isPending} onClick={() => removeTeams.mutate()}>
                      <Trash2 className="h-3.5 w-3.5" />
                      出場チームから外す
                    </ConsoleButton>
                  </footer>
                </section>

                {/* チームを追加 */}
                <section className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <header className="flex items-center gap-2 border-b border-gray-200 px-3 py-2">
                    <span className="text-sm font-bold text-gray-900">チームを追加</span>
                    <span className="ml-auto text-[11px] text-gray-400">スクレイピング対象のリーグのチーム</span>
                  </header>
                  <div className="flex flex-wrap gap-2 border-b border-gray-100 px-3 py-2">
                    <ConsoleSelect
                      value={addCountry}
                      onChange={(e) => {
                        setAddCountry(e.target.value);
                        setAddLeague("");
                        setAddTeams(new Set());
                      }}
                      disabled={busy || candidates.isLoading}
                      className="min-w-[8rem]"
                    >
                      <option value="">国</option>
                      {(candidates.data ?? []).map((c) => (
                        <option key={c.country} value={c.country}>
                          {c.country}
                        </option>
                      ))}
                    </ConsoleSelect>
                    <ConsoleSelect
                      value={addLeague}
                      onChange={(e) => {
                        setAddLeague(e.target.value);
                        setAddTeams(new Set());
                      }}
                      disabled={busy || !countryRow}
                      className="min-w-[10rem]"
                    >
                      <option value="">リーグ</option>
                      {(countryRow?.leagues ?? []).map((l) => (
                        <option key={l.league} value={l.league}>
                          {l.league}（{l.teams.length}）
                        </option>
                      ))}
                    </ConsoleSelect>
                  </div>
                  <div className="max-h-[260px] flex-1 overflow-auto px-3 py-2">
                    {candidates.isError ? (
                      <div className="py-4 text-center text-xs text-red-600">候補を読み込めませんでした: {(candidates.error as Error)?.message}</div>
                    ) : !leagueRow ? (
                      <div className="py-4 text-center text-xs text-gray-400">国とリーグを選んでください</div>
                    ) : addable.length === 0 ? (
                      <div className="py-4 text-center text-xs text-gray-400">このリーグのチームはすべて登録済みです</div>
                    ) : (
                      <>
                        <div className="mb-1 border-b border-gray-100 pb-1">
                          <ConsoleCheck
                            checked={addable.length > 0 && addable.every((t) => addTeams.has(t.team))}
                            onChange={(v) => setAddTeams(v ? new Set(addable.map((t) => t.team)) : new Set())}
                            disabled={busy}
                          >
                            <span className="text-xs text-gray-500">すべて選択</span>
                          </ConsoleCheck>
                        </div>
                        <ul className="grid grid-cols-1 gap-0.5 sm:grid-cols-2">
                          {addable.map((t) => (
                            <li key={t.team} className="text-[13px]">
                              <ConsoleCheck
                                checked={addTeams.has(t.team)}
                                onChange={(v) =>
                                  setAddTeams((s) => {
                                    const n = new Set(s);
                                    if (v) n.add(t.team);
                                    else n.delete(t.team);
                                    return n;
                                  })
                                }
                                disabled={busy}
                              >
                                <span className="text-gray-900">{t.team}</span>
                              </ConsoleCheck>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                  <footer className="flex items-center gap-2 border-t border-gray-200 bg-gray-50 px-3 py-2">
                    <span className="text-xs text-gray-500">選択 {addTeams.size} チームを</span>
                    <ConsoleButton variant="primary" size="sm" className="ml-auto" disabled={addTeams.size === 0 || busy} loading={add.isPending} onClick={() => add.mutate()}>
                      <Plus className="h-3.5 w-3.5" />
                      出場チームに追加
                    </ConsoleButton>
                  </footer>
                </section>
              </div>

              {/* 日程と出場選手の取得状況 */}
              <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <header className="flex flex-wrap items-center gap-2 border-b border-gray-200 px-3 py-2">
                  <span className="text-sm font-bold text-gray-900">日程と出場選手の取得状況</span>
                  <span className="text-[11px] text-gray-400">
                    {schedule.data?.exists ? `日程の取得: ${schedule.data.generatedAt ?? "-"}` : "日程はまだ取得されていません（チームを登録すると、次の Lambda の実行で日程を取ります）"}
                  </span>
                  <ConsoleButton size="sm" className="ml-auto" disabled={retryMids.size === 0 || busy} loading={retry.isPending} onClick={() => retry.mutate()} title="選んだ試合の出場選手を、次の Lambda の実行でもう一度取ります">
                    <RotateCcw className="h-3.5 w-3.5" />
                    選択 {retryMids.size} 試合を取り直す
                  </ConsoleButton>
                </header>
                <div className="px-3 py-2">
                  <StatChips
                    items={[
                      { label: "試合", value: matches.length },
                      { label: "試合前", value: counts.SCHEDULED },
                      { label: "取得待ち", value: counts.WAITING, tone: counts.WAITING > 0 ? "info" : undefined },
                      { label: "取得依頼済", value: counts.REQUESTED, tone: counts.REQUESTED > 0 ? "warn" : undefined },
                      { label: "登録済", value: counts.REGISTERED, tone: "ok" },
                      { label: "未取得", value: counts.EXPIRED, tone: counts.EXPIRED > 0 ? "ng" : undefined },
                    ]}
                  />
                </div>
                {schedule.isError ? (
                  <div className="px-3 pb-3 text-xs text-red-600">日程を読み込めませんでした: {(schedule.error as Error)?.message}</div>
                ) : schedule.isLoading ? (
                  <div className="px-3 py-6 text-center text-xs text-gray-400">読み込み中…</div>
                ) : matches.length === 0 ? (
                  <div className="px-3 py-6 text-center text-xs text-gray-400">登録した出場チームの試合はありません</div>
                ) : (
                  <div className="max-h-[420px] overflow-auto">
                    <table className="w-full text-[12px]">
                      <thead className="sticky top-0 bg-gray-50 text-left text-[11px] text-gray-500">
                        <tr>
                          <th className="w-8 px-2 py-1.5" />
                          <th className="px-2 py-1.5">開始日時</th>
                          <th className="px-2 py-1.5">ラウンド</th>
                          <th className="px-2 py-1.5">対戦</th>
                          <th className="px-2 py-1.5">出場チーム</th>
                          <th className="px-2 py-1.5">状態</th>
                          <th className="px-2 py-1.5">依頼日時</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matches.map((m) => {
                          const st = STATUS_LABEL[m.status] ?? STATUS_LABEL.SCHEDULED;
                          return (
                            <tr key={m.mid} className="border-t border-gray-100">
                              <td className="px-2 py-1">
                                {retryable(m) && (
                                  <ConsoleCheck
                                    checked={retryMids.has(m.mid)}
                                    onChange={(v) =>
                                      setRetryMids((s) => {
                                        const n = new Set(s);
                                        if (v) n.add(m.mid);
                                        else n.delete(m.mid);
                                        return n;
                                      })
                                    }
                                    disabled={busy}
                                  >
                                    <span className="sr-only">取り直す</span>
                                  </ConsoleCheck>
                                )}
                              </td>
                              <td className="whitespace-nowrap px-2 py-1 tabular-nums">{m.kickoff || m.date}</td>
                              <td className="max-w-[10rem] truncate px-2 py-1 text-gray-500" title={m.round}>
                                {m.round || "-"}
                              </td>
                              <td className="px-2 py-1">
                                <a href={m.url} target="_blank" rel="noreferrer" className="hover:underline">
                                  {m.home} <span className="text-gray-400">vs</span> {m.away}
                                </a>
                              </td>
                              <td className="px-2 py-1 font-semibold">{m.targetTeams}</td>
                              <td className="px-2 py-1" title={st.title}>
                                <StatusBadge tone={st.tone}>{st.label}</StatusBadge>
                              </td>
                              <td className="whitespace-nowrap px-2 py-1 tabular-nums text-gray-500">{m.requestedAt ?? "-"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <div className="text-[11px] text-gray-400">
                ※ 日程は Lambda（cup-schedule-runner）が日程スクレイパー（cup-schedule-data）を起動して取ります（大会・出場チームを変えたとき・前回から一定時間たったとき）。
                出場選手は試合日の翌日の朝に、B016 の試合詳細スクレイピングへ依頼します（ラインアップ → match_detail_lineup）。
                削除・「出場チームから外す」は論理削除（del_flg = 1）です。
              </div>
            </>
          )}
        </div>
      </div>

      {/* 大会の登録・編集 */}
      <ConsoleModal
        open={form != null}
        title={form?.id == null ? "大会を追加" : "大会を編集"}
        description="Flashscore の大会ページの URL を入れてください（日程・結果のページの URL でも構いません）"
        onClose={() => !save.isPending && setForm(null)}
        busy={save.isPending}
        width={560}
        footer={
          <>
            <ConsoleButton onClick={() => setForm(null)} disabled={save.isPending}>
              やめる
            </ConsoleButton>
            <ConsoleButton
              variant="primary"
              loading={save.isPending}
              disabled={!form || !form.competitionName.trim() || !form.competitionUrl.trim()}
              onClick={() => form && save.mutate(form)}
            >
              保存
            </ConsoleButton>
          </>
        }
      >
        {form && (
          <div className="space-y-3">
            <ConsoleField label="大会名" hint="例: AFCチャンピオンズリーグエリート">
              <ConsoleInput value={form.competitionName} onChange={(e) => setForm({ ...form, competitionName: e.target.value })} className="w-full" />
            </ConsoleField>
            <ConsoleField label="大会ページの URL" hint="例: https://www.flashscore.co.jp/soccer/asia/afc-champions-league/">
              <ConsoleInput value={form.competitionUrl} onChange={(e) => setForm({ ...form, competitionUrl: e.target.value })} className="w-full font-mono" />
            </ConsoleField>
            <div className="grid grid-cols-2 gap-3">
              <ConsoleField label="地域" hint="例: アジア">
                <ConsoleInput value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className="w-full" />
              </ConsoleField>
              <ConsoleField label="シーズン（任意）" hint="例: 2026/2027">
                <ConsoleInput value={form.seasonYear} onChange={(e) => setForm({ ...form, seasonYear: e.target.value })} className="w-full" />
              </ConsoleField>
              <ConsoleField label="表示順">
                <ConsoleInput type="number" value={form.dispOrder} onChange={(e) => setForm({ ...form, dispOrder: Number(e.target.value) || 0 })} className="w-full" />
              </ConsoleField>
              <ConsoleField label="日程の取得">
                <ConsoleSelect value={form.scrapeFlg} onChange={(e) => setForm({ ...form, scrapeFlg: e.target.value })} className="w-full">
                  <option value="1">取る</option>
                  <option value="0">取らない（停止）</option>
                </ConsoleSelect>
              </ConsoleField>
            </div>
          </div>
        )}
      </ConsoleModal>

      {/* 大会の削除 */}
      <ConsoleModal
        open={deleteTarget != null}
        title="大会を削除します"
        description={deleteTarget ? `「${deleteTarget.competitionName}」と出場チーム（${deleteTarget.teamCount} チーム）を論理削除します（del_flg = 1）。日程も取らなくなります。` : undefined}
        onClose={() => !remove.isPending && setDeleteTarget(null)}
        busy={remove.isPending}
        width={480}
        footer={
          <>
            <ConsoleButton onClick={() => setDeleteTarget(null)} disabled={remove.isPending}>
              やめる
            </ConsoleButton>
            <ConsoleButton variant="danger" loading={remove.isPending} onClick={() => deleteTarget && remove.mutate(deleteTarget.id)}>
              削除する
            </ConsoleButton>
          </>
        }
      >
        <div className="text-xs text-gray-500">登録済みの出場選手（match_detail_*）は消えません。</div>
      </ConsoleModal>
    </div>
  );
}
