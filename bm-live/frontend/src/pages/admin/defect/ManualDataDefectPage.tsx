"use client";

import React, { useMemo, useState } from "react";
import { Save, Search } from "lucide-react";
import {
  ConsoleButton,
  ConsoleCellInput,
  ConsoleColumn,
  ConsoleField,
  ConsoleInput,
  ConsoleNotice,
  ConsolePanel,
  ConsoleTable,
  ConsoleToolbar,
  NoticeTone,
  SegmentedTabs,
  StatusBadge,
} from "../../../api/commonAdminDesign";

/** ============ 共通 ============ */
type TabKey = "season" | "league" | "member";

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${text ? `: ${text}` : ""}`);
  }
  return (await res.json()) as T;
}

function buildQuery(params: Record<string, unknown>) {
  const q = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([k, v]) => {
    if (v == null) return;
    const s = String(v).trim();
    if (s === "") return;
    q.set(k, s);
  });
  const qs = q.toString();
  return qs ? `?${qs}` : "";
}

async function getJson<T>(url: string, params: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${url}${buildQuery(params ?? {})}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${text ? `: ${text}` : ""}`);
  }
  return (await res.json()) as T;
}

function normalizeInputValue(v: unknown): string {
  return v == null ? "" : String(v);
}

function toNullableString(v: string): string | null {
  const t = (v ?? "").trim();
  return t === "" ? null : t;
}

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e ?? "");
}

/** ============ データ型 ============ */

type SeasonCond = { country: string; league: string; seasonYear: string; path: string; delFlg: string };
type LeagueCond = { country: string; league: string; team: string; link: string; delFlg: string };
type MemberCond = { country: string; league: string; team: string; member: string; position: string; delFlg: string };

type SeasonRow = { id: string; country: string | null; league: string | null; seasonYear: string | null; path: string | null; delFlg: string | null };
type LeagueRow = { id: string; country: string | null; league: string | null; team: string | null; link: string | null; delFlg: string | null };
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

type SeasonRowUi = SeasonRow & { _dirty: boolean };
type LeagueRowUi = LeagueRow & { _dirty: boolean };
type MemberRowUi = MemberRow & { _dirty: boolean };

type SeasonKey = keyof SeasonRow;
type LeagueKey = keyof LeagueRow;
type MemberKey = keyof MemberRow;

/** ============ 検索条件・列の定義 ============ */

type CondField<C> = { key: keyof C & string; label: string; placeholder: string };

const SEASON_COND_FIELDS: CondField<SeasonCond>[] = [
  { key: "country", label: "Country", placeholder: "例: Japan" },
  { key: "league", label: "League", placeholder: "例: J1 League" },
  { key: "seasonYear", label: "Season Year", placeholder: "例: 2024" },
  { key: "path", label: "Path", placeholder: "部分一致" },
  { key: "delFlg", label: "Del Flag", placeholder: "0/1" },
];

const LEAGUE_COND_FIELDS: CondField<LeagueCond>[] = [
  { key: "country", label: "Country", placeholder: "例: Japan" },
  { key: "league", label: "League", placeholder: "例: J1 League" },
  { key: "team", label: "Team", placeholder: "例: Urawa Reds" },
  { key: "link", label: "Link", placeholder: "部分一致" },
  { key: "delFlg", label: "Del Flag", placeholder: "0/1" },
];

const MEMBER_COND_FIELDS: CondField<MemberCond>[] = [
  { key: "country", label: "Country", placeholder: "例: Japan" },
  { key: "league", label: "League", placeholder: "例: J1 League" },
  { key: "team", label: "Team", placeholder: "例: Urawa Reds" },
  { key: "member", label: "Member", placeholder: "部分一致" },
  { key: "position", label: "Position", placeholder: "例: Forward" },
  { key: "delFlg", label: "Del Flag", placeholder: "0/1" },
];

type EditField<R> = { key: keyof R & string; label: string; placeholder?: string; minWidth?: string };

const SEASON_EDIT_FIELDS: EditField<SeasonRow>[] = [
  { key: "country", label: "Country" },
  { key: "league", label: "League" },
  { key: "seasonYear", label: "Season Year" },
  { key: "path", label: "Path", minWidth: "min-w-[260px]" },
  { key: "delFlg", label: "Del Flag", placeholder: "0/1" },
];

const LEAGUE_EDIT_FIELDS: EditField<LeagueRow>[] = [
  { key: "country", label: "Country" },
  { key: "league", label: "League" },
  { key: "team", label: "Team" },
  { key: "link", label: "Link", minWidth: "min-w-[260px]" },
  { key: "delFlg", label: "Del Flag", placeholder: "0/1" },
];

const MEMBER_EDIT_FIELDS: EditField<MemberRow>[] = [
  { key: "country", label: "Country" },
  { key: "league", label: "League" },
  { key: "team", label: "Team" },
  { key: "jersey", label: "Jersey" },
  { key: "member", label: "Member" },
  { key: "position", label: "Position" },
];

/** 編集できる表の列を作る（ID / 各項目 / 状態） */
function buildEditableColumns<R extends { id: string; _dirty: boolean }>(fields: EditField<R>[], onUpdate: (index: number, key: keyof R & string, value: string) => void): ConsoleColumn<R>[] {
  return [
    { key: "id", header: "ID", mono: true, cell: (r) => <span className="text-gray-500">{r.id}</span> },
    ...fields.map<ConsoleColumn<R>>((f) => ({
      key: f.key,
      header: f.label,
      className: "py-1",
      cell: (r, i) => (
        <ConsoleCellInput dirty={r._dirty} value={normalizeInputValue(r[f.key])} placeholder={f.placeholder} onChange={(e) => onUpdate(i, f.key, e.target.value)} className={f.minWidth ?? ""} />
      ),
    })),
    {
      key: "_status",
      header: "状態",
      align: "center",
      cell: (r) => (r._dirty ? <StatusBadge tone="warn">編集中</StatusBadge> : <span className="text-gray-300">-</span>),
    },
  ];
}

/** 検索条件の入力欄 */
function CondFields<C extends Record<string, string>>({ fields, cond, onChange }: { fields: CondField<C>[]; cond: C; onChange: (next: C) => void }) {
  return (
    <>
      {fields.map((f) => (
        <ConsoleField key={f.key} label={f.label}>
          <ConsoleInput value={cond[f.key]} placeholder={f.placeholder} onChange={(e) => onChange({ ...cond, [f.key]: e.target.value })} className="w-full" />
        </ConsoleField>
      ))}
    </>
  );
}

const TAB_LABEL: Record<TabKey, string> = { season: "Season Master", league: "League Master", member: "Member Master" };

/** ============ メインページ ============ */
export default function ScrapeDefectPage() {
  const [tab, setTab] = useState<TabKey>("season");
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  /** ===== Season state ===== */
  const [seasonCond, setSeasonCond] = useState<SeasonCond>({ country: "", league: "", seasonYear: "", path: "", delFlg: "" });
  const [seasonRows, setSeasonRows] = useState<SeasonRowUi[]>([]);

  /** ===== League state ===== */
  const [leagueCond, setLeagueCond] = useState<LeagueCond>({ country: "", league: "", team: "", link: "", delFlg: "" });
  const [leagueRows, setLeagueRows] = useState<LeagueRowUi[]>([]);

  /** ===== Member state ===== */
  const [memberCond, setMemberCond] = useState<MemberCond>({ country: "", league: "", team: "", member: "", position: "", delFlg: "" });
  const [memberRows, setMemberRows] = useState<MemberRowUi[]>([]);

  const dirtyCount = useMemo<number>(() => {
    if (tab === "season") return seasonRows.filter((r) => r._dirty).length;
    if (tab === "league") return leagueRows.filter((r) => r._dirty).length;
    return memberRows.filter((r) => r._dirty).length;
  }, [tab, seasonRows, leagueRows, memberRows]);

  const rowCount = tab === "season" ? seasonRows.length : tab === "league" ? leagueRows.length : memberRows.length;

  /** ========================= 検索 ========================= */
  async function onSearch(): Promise<void> {
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
    } catch (e: unknown) {
      setMessage(getErrorMessage(e) || "検索でエラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  /** ========================= 保存（dirtyのみ） ========================= */
  async function onSaveDirty(): Promise<void> {
    setLoading(true);
    setMessage("");
    try {
      if (tab === "season") {
        const dirty = seasonRows.filter((r) => r._dirty);
        for (const r of dirty) {
          await postJson<unknown>("/v1/api/country-league-season-master/update", {
            ...r,
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
          await postJson<unknown>("/v1/api/country-league-master/update", {
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
          await postJson<unknown>("/v1/api/team-member-master/update", {
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
    } catch (e: unknown) {
      setMessage(getErrorMessage(e) || "保存でエラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  /** ========================= セル更新 ========================= */
  function updateSeasonCell(index: number, key: SeasonKey, value: string): void {
    setSeasonRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value, _dirty: true };
      return next;
    });
  }

  function updateLeagueCell(index: number, key: LeagueKey, value: string): void {
    setLeagueRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value, _dirty: true };
      return next;
    });
  }

  function updateMemberCell(index: number, key: MemberKey, value: string): void {
    setMemberRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value, _dirty: true };
      return next;
    });
  }

  const seasonColumns = useMemo(() => buildEditableColumns<SeasonRowUi>(SEASON_EDIT_FIELDS, (i, k, v) => updateSeasonCell(i, k as SeasonKey, v)), []);
  const leagueColumns = useMemo(() => buildEditableColumns<LeagueRowUi>(LEAGUE_EDIT_FIELDS, (i, k, v) => updateLeagueCell(i, k as LeagueKey, v)), []);
  const memberColumns = useMemo(() => buildEditableColumns<MemberRowUi>(MEMBER_EDIT_FIELDS, (i, k, v) => updateMemberCell(i, k as MemberKey, v)), []);

  const messageTone: NoticeTone = message.includes("エラー") || /^\d{3}\s/.test(message) ? "ng" : message.includes("完了") ? "ok" : "info";

  const dirtyRowClass = (r: { _dirty: boolean }) => (r._dirty ? "bg-amber-50/70" : "");
  const emptyText = "条件を入力して「検索」を押してください";

  /** ========================= 画面 ========================= */
  return (
    <div>
      <ConsoleToolbar title="スクレイピングデータ管理" info="欠陥値設定とデータメンテナンス">
        {dirtyCount > 0 ? <StatusBadge tone="warn">変更あり {dirtyCount}件</StatusBadge> : <StatusBadge tone="neutral">変更なし</StatusBadge>}
        <ConsoleButton variant="success" onClick={() => void onSaveDirty()} disabled={dirtyCount === 0} loading={loading && dirtyCount > 0}>
          {!(loading && dirtyCount > 0) && <Save className="h-3.5 w-3.5" />}
          変更を保存（{dirtyCount}件）
        </ConsoleButton>
      </ConsoleToolbar>

      {message && (
        <ConsoleNotice tone={messageTone} onClose={() => setMessage("")}>
          {message}
        </ConsoleNotice>
      )}

      <ConsolePanel
        title="検索条件"
        right={
          <SegmentedTabs<TabKey>
            value={tab}
            onChange={setTab}
            disabled={loading}
            options={[
              { value: "season", label: TAB_LABEL.season },
              { value: "league", label: TAB_LABEL.league },
              { value: "member", label: TAB_LABEL.member },
            ]}
          />
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void onSearch();
          }}
          className="flex flex-wrap items-end gap-2"
        >
          <div className={`grid flex-1 grid-cols-2 gap-2 ${tab === "member" ? "md:grid-cols-6" : "md:grid-cols-5"}`}>
            {tab === "season" && <CondFields fields={SEASON_COND_FIELDS} cond={seasonCond} onChange={setSeasonCond} />}
            {tab === "league" && <CondFields fields={LEAGUE_COND_FIELDS} cond={leagueCond} onChange={setLeagueCond} />}
            {tab === "member" && <CondFields fields={MEMBER_COND_FIELDS} cond={memberCond} onChange={setMemberCond} />}
          </div>
          <ConsoleButton type="submit" variant="primary" loading={loading}>
            {!loading && <Search className="h-3.5 w-3.5" />}
            検索
          </ConsoleButton>
        </form>
      </ConsolePanel>

      <div className="mb-1.5 flex items-center gap-2 px-0.5 text-xs text-gray-500">
        <b className="text-gray-900">{TAB_LABEL[tab]}</b>
        <span>全 {rowCount} 件</span>
        <span className="ml-auto">空欄で保存すると NULL で更新されます。変更後は「変更を保存」を押してください。</span>
      </div>

      {tab === "season" && (
        <ConsoleTable columns={seasonColumns} rows={seasonRows} rowKey={(r) => r.id} loading={loading} emptyText={emptyText} rowClassName={dirtyRowClass} plain maxHeight="calc(100vh - 300px)" />
      )}
      {tab === "league" && (
        <ConsoleTable columns={leagueColumns} rows={leagueRows} rowKey={(r) => r.id} loading={loading} emptyText={emptyText} rowClassName={dirtyRowClass} plain maxHeight="calc(100vh - 300px)" />
      )}
      {tab === "member" && (
        <ConsoleTable columns={memberColumns} rows={memberRows} rowKey={(r) => r.id} loading={loading} emptyText={emptyText} rowClassName={dirtyRowClass} plain maxHeight="calc(100vh - 300px)" />
      )}
    </div>
  );
}
