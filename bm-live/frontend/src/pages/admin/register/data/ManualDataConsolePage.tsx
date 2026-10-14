import React, { useMemo, useState } from "react";
import { ChevronRight, ClipboardPaste, Download, Eraser, Save } from "lucide-react";
import {
  ConsoleButton,
  ConsoleField,
  ConsoleInput,
  ConsoleModal,
  ConsoleNotice,
  ConsolePanel,
  ConsoleTextarea,
  ConsoleToolbar,
  NoticeTone,
  SegmentedTabs,
  StatusBadge,
} from "../../../../api/commonAdminDesign";

/** ===== 共通 ===== */
type Mode = "create" | "update";

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || `HTTP ${res.status}`);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return null;
}

/** ===== Entity Forms ===== */

/** --- DataEntity（最小定義）--- */
type DataEntityForm = {
  file: string;
  seq: string;
  conditionResultDataSeqId: string;
  dataCategory: string;
  times: string;
  homeRank: string;
  homeTeamName: string;
  homeScore: string;
  awayRank: string;
  awayTeamName: string;
  awayScore: string;
  recordTime: string;
  noticeFlg: string;
  gameLink: string;
  goalTime: string;
  goalTeamMember: string;
  judge: string;
  probablity: string;
  predictionScoreTime: string;
  gameId: string;
  matchId: string;
  timeSortSeconds: number | "";
  addManualFlg: string;
  fileCount: number | "";
};
const initData: DataEntityForm = {
  file: "",
  seq: "",
  conditionResultDataSeqId: "",
  dataCategory: "",
  times: "",
  homeRank: "",
  homeTeamName: "",
  homeScore: "",
  awayRank: "",
  awayTeamName: "",
  awayScore: "",
  recordTime: "",
  noticeFlg: "",
  gameLink: "",
  goalTime: "",
  goalTeamMember: "",
  judge: "",
  probablity: "",
  predictionScoreTime: "",
  gameId: "",
  matchId: "",
  timeSortSeconds: "",
  addManualFlg: "1",
  fileCount: "",
};

/** --- CountryLeagueMasterEntity --- */
type CountryLeagueMasterForm = {
  id: string;
  country: string;
  league: string;
  team: string;
  link: string;
  delFlg: string;
};
const initCLM: CountryLeagueMasterForm = {
  id: "",
  country: "",
  league: "",
  team: "",
  link: "",
  delFlg: "0",
};

/** --- CountryLeagueSeasonMasterEntity --- */
type CountryLeagueSeasonForm = {
  id: string;
  country: string;
  league: string;
  seasonYear: string;
  startSeasonDate: string;
  endSeasonDate: string;
  round: string;
  path: string;
  icon: string;
  validFlg: string;
  delFlg: string;
};
const initCLS: CountryLeagueSeasonForm = {
  id: "",
  country: "",
  league: "",
  seasonYear: "",
  startSeasonDate: "",
  endSeasonDate: "",
  round: "",
  path: "",
  icon: "",
  validFlg: "1",
  delFlg: "0",
};

/** --- TeamMemberMasterEntity --- */
type TeamMemberMasterForm = {
  id: string;
  file: string;
  country: string;
  league: string;
  team: string;
  score: string;
  loanBelong: string;
  jersey: string;
  member: string;
  facePicPath: string;
  belongList: string;
  height: string;
  weight: string;
  position: string;
  birth: string;
  age: string;
  marketValue: string;
  injury: string;
  versusTeamScoreData: string;
  retireFlg: string;
  deadline: string;
  deadlineContractDate: string;
  latestInfoDate: string;
  updStamp: string;
  delFlg: string;
};
const initTMM: TeamMemberMasterForm = {
  id: "",
  file: "",
  country: "",
  league: "",
  team: "",
  score: "",
  loanBelong: "",
  jersey: "",
  member: "",
  facePicPath: "",
  belongList: "",
  height: "",
  weight: "",
  position: "",
  birth: "",
  age: "",
  marketValue: "",
  injury: "",
  versusTeamScoreData: "",
  retireFlg: "0",
  deadline: "0",
  deadlineContractDate: "",
  latestInfoDate: "",
  updStamp: "",
  delFlg: "0",
};

/** --- FutureEntity --- */
type FutureForm = {
  file: string;
  seq: string;
  gameTeamCategory: string;
  futureTime: string;
  homeRank: string;
  awayRank: string;
  homeTeamName: string;
  awayTeamName: string;
  homeMaxGettingScorer: string;
  awayMaxGettingScorer: string;
  homeTeamHomeScore: string;
  homeTeamHomeLost: string;
  awayTeamHomeScore: string;
  awayTeamHomeLost: string;
  homeTeamAwayScore: string;
  homeTeamAwayLost: string;
  awayTeamAwayScore: string;
  awayTeamAwayLost: string;
  gameLink: string;
  startFlg: string;
  dataTime: string;
};
const initFuture: FutureForm = {
  file: "",
  seq: "",
  gameTeamCategory: "",
  futureTime: "",
  homeRank: "",
  awayRank: "",
  homeTeamName: "",
  awayTeamName: "",
  homeMaxGettingScorer: "",
  awayMaxGettingScorer: "",
  homeTeamHomeScore: "",
  homeTeamHomeLost: "",
  awayTeamHomeScore: "",
  awayTeamHomeLost: "",
  homeTeamAwayScore: "",
  homeTeamAwayLost: "",
  awayTeamAwayScore: "",
  awayTeamAwayLost: "",
  gameLink: "",
  startFlg: "0",
  dataTime: "",
};

type TabKey = "DataEntity" | "CountryLeagueMaster" | "CountryLeagueSeasonMaster" | "TeamMemberMaster" | "FutureEntity";

const TABS: TabKey[] = ["DataEntity", "CountryLeagueMaster", "CountryLeagueSeasonMaster", "TeamMemberMaster", "FutureEntity"];

/** ===== 入力欄の定義（タブごと・まとまりごと） ===== */
type FieldDef = { key: string; label?: string; placeholder?: string; required?: boolean; type?: "text" | "number" };
type SectionDef = { title: string; open: boolean; cols: number; fields: FieldDef[] };

const SECTIONS: Record<TabKey, SectionDef[]> = {
  DataEntity: [
    {
      title: "DataEntity（基本）",
      open: true,
      cols: 4,
      fields: [
        { key: "gameId", required: true },
        { key: "matchId", required: true },
        { key: "seq", required: true },
        { key: "addManualFlg", placeholder: "手動=1推奨" },
        { key: "times", placeholder: "例: 2026-02-11 19:00" },
        { key: "recordTime", placeholder: "例: 2026-02-11 21:00" },
        { key: "homeTeamName", required: true },
        { key: "awayTeamName", required: true },
        { key: "homeScore" },
        { key: "awayScore" },
        { key: "noticeFlg", placeholder: "0/1" },
      ],
    },
    {
      title: "DataEntity（その他）",
      open: false,
      cols: 4,
      fields: [
        { key: "file" },
        { key: "dataCategory" },
        { key: "gameLink" },
        { key: "judge" },
        { key: "goalTime" },
        { key: "goalTeamMember" },
        { key: "probablity" },
        { key: "predictionScoreTime" },
        { key: "timeSortSeconds", type: "number" },
        { key: "fileCount", type: "number" },
      ],
    },
  ],
  CountryLeagueMaster: [
    {
      title: "CountryLeagueMasterEntity",
      open: true,
      cols: 3,
      fields: [{ key: "id", placeholder: "更新は上のID欄推奨" }, { key: "country" }, { key: "league" }, { key: "team" }, { key: "link" }, { key: "delFlg", placeholder: "0/1" }],
    },
  ],
  CountryLeagueSeasonMaster: [
    {
      title: "CountryLeagueSeasonMasterEntity",
      open: true,
      cols: 4,
      fields: [
        { key: "id" },
        { key: "country" },
        { key: "league" },
        { key: "seasonYear", placeholder: "例: 2025/2026" },
        { key: "startSeasonDate", placeholder: "例: 2025-08-01" },
        { key: "endSeasonDate", placeholder: "例: 2026-05-20" },
        { key: "round" },
        { key: "path" },
        { key: "icon" },
        { key: "validFlg", placeholder: "0/1" },
        { key: "delFlg", placeholder: "0/1" },
      ],
    },
  ],
  TeamMemberMaster: [
    {
      title: "基本",
      open: true,
      cols: 4,
      fields: [{ key: "id" }, { key: "file" }, { key: "member" }, { key: "country" }, { key: "league" }, { key: "team" }, { key: "position" }, { key: "jersey" }, { key: "score" }, { key: "loanBelong" }],
    },
    {
      title: "詳細",
      open: false,
      cols: 4,
      fields: [
        { key: "birth" },
        { key: "age" },
        { key: "height" },
        { key: "weight" },
        { key: "marketValue" },
        { key: "injury" },
        { key: "facePicPath" },
        { key: "belongList" },
        { key: "versusTeamScoreData" },
        { key: "retireFlg", placeholder: "0/1" },
        { key: "deadline", placeholder: "0/1" },
        { key: "deadlineContractDate" },
        { key: "latestInfoDate" },
        { key: "updStamp" },
        { key: "delFlg", placeholder: "0/1" },
      ],
    },
  ],
  FutureEntity: [
    {
      title: "基本",
      open: true,
      cols: 4,
      fields: [
        { key: "file" },
        { key: "seq" },
        { key: "futureTime", placeholder: "例: 2026-02-11 19:00" },
        { key: "gameTeamCategory" },
        { key: "homeTeamName" },
        { key: "awayTeamName" },
        { key: "homeRank" },
        { key: "awayRank" },
        { key: "startFlg", placeholder: "0/1" },
      ],
    },
    {
      title: "成績・リンク・取得時刻",
      open: false,
      cols: 4,
      fields: [
        { key: "homeMaxGettingScorer" },
        { key: "awayMaxGettingScorer" },
        { key: "gameLink" },
        { key: "dataTime" },
        { key: "homeTeamHomeScore" },
        { key: "homeTeamHomeLost" },
        { key: "awayTeamHomeScore" },
        { key: "awayTeamHomeLost" },
        { key: "homeTeamAwayScore" },
        { key: "homeTeamAwayLost" },
        { key: "awayTeamAwayScore" },
        { key: "awayTeamAwayLost" },
      ],
    },
  ],
};

const GRID_COLS: Record<number, string> = { 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-4" };

/** 開閉できるまとまり */
function FormSection({ title, open, children }: { title: string; open: boolean; children: React.ReactNode }) {
  return (
    <details open={open} className="group mb-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
      <summary className="flex cursor-pointer select-none list-none items-center gap-1.5 border-b border-transparent px-3.5 py-2 text-sm font-bold text-gray-900 group-open:border-gray-200 [&::-webkit-details-marker]:hidden">
        <ChevronRight className="h-3.5 w-3.5 text-gray-400 transition-transform group-open:rotate-90" />
        {title}
      </summary>
      <div className="px-3.5 py-3">{children}</div>
    </details>
  );
}

/** ===== メインページ ===== */
export default function ManualDataConsolePage() {
  const [mode, setMode] = useState<Mode>("create");
  const [tab, setTab] = useState<TabKey>("DataEntity");

  const [msg, setMsg] = useState<{ type: NoticeTone; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // JSON貼り付け（prompt の代わりにモーダルで入力）
  const [jsonOpen, setJsonOpen] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  // update mode用キー
  const [updateKey, setUpdateKey] = useState({
    id: "",
    gameId: "",
    matchId: "",
    seq: "",
  });

  // forms
  const [data, setData] = useState<DataEntityForm>(initData);
  const [clm, setClm] = useState<CountryLeagueMasterForm>(initCLM);
  const [cls, setCls] = useState<CountryLeagueSeasonForm>(initCLS);
  const [tmm, setTmm] = useState<TeamMemberMasterForm>(initTMM);
  const [future, setFuture] = useState<FutureForm>(initFuture);

  const current = useMemo(() => {
    switch (tab) {
      case "DataEntity":
        return data;
      case "CountryLeagueMaster":
        return clm;
      case "CountryLeagueSeasonMaster":
        return cls;
      case "TeamMemberMaster":
        return tmm;
      case "FutureEntity":
        return future;
    }
  }, [tab, data, clm, cls, tmm, future]);

  const setCurrent = (patch: any) => {
    switch (tab) {
      case "DataEntity":
        setData((p) => ({ ...p, ...patch }));
        break;
      case "CountryLeagueMaster":
        setClm((p) => ({ ...p, ...patch }));
        break;
      case "CountryLeagueSeasonMaster":
        setCls((p) => ({ ...p, ...patch }));
        break;
      case "TeamMemberMaster":
        setTmm((p) => ({ ...p, ...patch }));
        break;
      case "FutureEntity":
        setFuture((p) => ({ ...p, ...patch }));
        break;
    }
  };

  const clearCurrent = () => {
    switch (tab) {
      case "DataEntity":
        setData(initData);
        break;
      case "CountryLeagueMaster":
        setClm(initCLM);
        break;
      case "CountryLeagueSeasonMaster":
        setCls(initCLS);
        break;
      case "TeamMemberMaster":
        setTmm(initTMM);
        break;
      case "FutureEntity":
        setFuture(initFuture);
        break;
    }
  };

  const openPasteJson = () => {
    setMsg(null);
    setJsonText("");
    setJsonError(null);
    setJsonOpen(true);
  };

  const applyPasteJson = () => {
    if (!jsonText.trim()) return;
    try {
      const obj = JSON.parse(jsonText);
      setCurrent(obj);
      setJsonOpen(false);
      setMsg({ type: "ok", text: "JSONを反映しました。" });
    } catch {
      setJsonError("JSONのパースに失敗しました。");
    }
  };

  /** ===== API方針（仮） ===== */
  const api = {
    DataEntity: {
      create: "/v1/api/admin/manual/data-entity",
      get: (gameId: string, matchId: string, seq: string) =>
        `/v1/api/admin/manual/data-entity?gameId=${encodeURIComponent(gameId)}&matchId=${encodeURIComponent(matchId)}&seq=${encodeURIComponent(seq)}`,
      update: (gameId: string, matchId: string, seq: string) =>
        `/v1/api/admin/manual/data-entity?gameId=${encodeURIComponent(gameId)}&matchId=${encodeURIComponent(matchId)}&seq=${encodeURIComponent(seq)}`,
    },
    CountryLeagueMaster: {
      create: "/v1/api/admin/manual/country-league-master",
      get: (id: string) => `/v1/api/admin/manual/country-league-master/${encodeURIComponent(id)}`,
      update: (id: string) => `/v1/api/admin/manual/country-league-master/${encodeURIComponent(id)}`,
    },
    CountryLeagueSeasonMaster: {
      create: "/v1/api/admin/manual/country-league-season-master",
      get: (id: string) => `/v1/api/admin/manual/country-league-season-master/${encodeURIComponent(id)}`,
      update: (id: string) => `/v1/api/admin/manual/country-league-season-master/${encodeURIComponent(id)}`,
    },
    TeamMemberMaster: {
      create: "/v1/api/admin/manual/team-member-master",
      get: (id: string) => `/v1/api/admin/manual/team-member-master/${encodeURIComponent(id)}`,
      update: (id: string) => `/v1/api/admin/manual/team-member-master/${encodeURIComponent(id)}`,
    },
    FutureEntity: {
      create: "/v1/api/admin/manual/future-entity",
      get: (file: string, seq: string) => `/v1/api/admin/manual/future-entity?file=${encodeURIComponent(file)}&seq=${encodeURIComponent(seq)}`,
      update: (file: string, seq: string) => `/v1/api/admin/manual/future-entity?file=${encodeURIComponent(file)}&seq=${encodeURIComponent(seq)}`,
    },
  } as const;

  const canFetchUpdate = useMemo(() => {
    if (mode !== "update") return false;
    if (tab === "DataEntity") return !!updateKey.gameId && !!updateKey.matchId && !!updateKey.seq;
    if (tab === "FutureEntity") return !!future.file && !!future.seq;
    return !!updateKey.id;
  }, [mode, tab, updateKey, future.file, future.seq]);

  const onFetchForUpdate = async () => {
    setMsg(null);
    try {
      setBusy(true);

      if (tab === "DataEntity") {
        const obj = await fetchJson(api.DataEntity.get(updateKey.gameId, updateKey.matchId, updateKey.seq));
        setData((p) => ({ ...p, ...(obj ?? {}) }));
      } else if (tab === "CountryLeagueMaster") {
        const obj = await fetchJson(api.CountryLeagueMaster.get(updateKey.id));
        setClm((p) => ({ ...p, ...(obj ?? {}) }));
      } else if (tab === "CountryLeagueSeasonMaster") {
        const obj = await fetchJson(api.CountryLeagueSeasonMaster.get(updateKey.id));
        setCls((p) => ({ ...p, ...(obj ?? {}) }));
      } else if (tab === "TeamMemberMaster") {
        const obj = await fetchJson(api.TeamMemberMaster.get(updateKey.id));
        setTmm((p) => ({ ...p, ...(obj ?? {}) }));
      } else if (tab === "FutureEntity") {
        const obj = await fetchJson(api.FutureEntity.get(future.file, future.seq));
        setFuture((p) => ({ ...p, ...(obj ?? {}) }));
      }

      setMsg({ type: "ok", text: "取得しました。編集して更新してください。" });
    } catch (e: any) {
      setMsg({ type: "ng", text: `取得に失敗しました: ${e?.message ?? "unknown"}` });
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    try {
      setBusy(true);

      if (mode === "create") {
        const url = api[tab].create as string;
        await fetchJson(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(current),
        });
        setMsg({ type: "ok", text: "登録しました。" });
        clearCurrent();
        return;
      }

      // update
      if (tab === "DataEntity") {
        await fetchJson(api.DataEntity.update(updateKey.gameId, updateKey.matchId, updateKey.seq), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(current),
        });
      } else if (tab === "FutureEntity") {
        await fetchJson(api.FutureEntity.update(future.file, future.seq), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(current),
        });
      } else {
        const url = (api[tab] as any).update(updateKey.id) as string;
        await fetchJson(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(current),
        });
      }

      setMsg({ type: "ok", text: "更新しました。" });
    } catch (e: any) {
      setMsg({ type: "ng", text: `${mode === "create" ? "登録" : "更新"}に失敗しました: ${e?.message ?? "unknown"}` });
    } finally {
      setBusy(false);
    }
  };

  /** 1つの入力欄（値はタブの現在のフォームから取り出す） */
  const renderField = (f: FieldDef) => {
    const value = (current as any)?.[f.key] ?? "";
    return (
      <ConsoleField
        key={f.key}
        label={
          <>
            <span className="font-mono">{f.label ?? f.key}</span>
            {f.required && <span className="ml-0.5 text-red-600">*</span>}
          </>
        }
      >
        <ConsoleInput
          value={value}
          type={f.type ?? "text"}
          placeholder={f.placeholder}
          disabled={busy}
          onChange={(e) => {
            const v = e.target.value;
            setCurrent({ [f.key]: f.type === "number" ? (v === "" ? "" : Number(v)) : v });
          }}
          className="w-full"
        />
      </ConsoleField>
    );
  };

  /** 更新時のキー入力欄 */
  const keyInput = (label: string, value: string, onChange: (v: string) => void) => (
    <ConsoleField key={label} label={<span className="font-mono">{label}</span>}>
      <ConsoleInput value={value} onChange={(e) => onChange(e.target.value)} disabled={busy} className="w-44" />
    </ConsoleField>
  );

  return (
    <div>
      <ConsoleToolbar title="手動登録 / 更新コンソール" info="Entity を切り替えて、登録（POST）/ 更新（GET → PUT）を実行">
        <SegmentedTabs<Mode>
          value={mode}
          onChange={setMode}
          disabled={busy}
          options={[
            { value: "create", label: "登録" },
            { value: "update", label: "更新" },
          ]}
        />
        <ConsoleButton onClick={openPasteJson} disabled={busy}>
          <ClipboardPaste className="h-3.5 w-3.5" />
          JSON貼り付け
        </ConsoleButton>
      </ConsoleToolbar>

      {msg && (
        <ConsoleNotice tone={msg.type} title={msg.type === "ok" ? "完了" : msg.type === "ng" ? "エラー" : "情報"} onClose={() => setMsg(null)}>
          {msg.text}
        </ConsoleNotice>
      )}

      {/* 対象 Entity */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-bold text-gray-500">Entity</span>
        {TABS.map((k) => {
          const active = tab === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              disabled={busy}
              className={[
                "h-7 rounded-full border px-3 font-mono text-xs font-bold transition-colors disabled:opacity-50",
                active ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50",
              ].join(" ")}
            >
              {k}
            </button>
          );
        })}
      </div>

      {/* 更新: 対象データ取得 */}
      {mode === "update" && (
        <ConsolePanel
          title="更新：対象データ取得"
          info="キーを指定して GET → フォームに反映 → 編集 → PUT"
          right={<StatusBadge tone={canFetchUpdate ? "ok" : "warn"}>{canFetchUpdate ? "READY" : "KEY REQUIRED"}</StatusBadge>}
        >
          <div className="flex flex-wrap items-end gap-2">
            {tab === "DataEntity" ? (
              <>
                {keyInput("gameId", updateKey.gameId, (v) => setUpdateKey((p) => ({ ...p, gameId: v })))}
                {keyInput("matchId", updateKey.matchId, (v) => setUpdateKey((p) => ({ ...p, matchId: v })))}
                {keyInput("seq", updateKey.seq, (v) => setUpdateKey((p) => ({ ...p, seq: v })))}
              </>
            ) : tab === "FutureEntity" ? (
              <>
                {keyInput("file（フォームの値）", future.file, (v) => setFuture((p) => ({ ...p, file: v })))}
                {keyInput("seq（フォームの値）", future.seq, (v) => setFuture((p) => ({ ...p, seq: v })))}
              </>
            ) : (
              keyInput("id", updateKey.id, (v) => setUpdateKey((p) => ({ ...p, id: v })))
            )}
            <ConsoleButton variant="primary" onClick={() => void onFetchForUpdate()} disabled={!canFetchUpdate} loading={busy}>
              {!busy && <Download className="h-3.5 w-3.5" />}
              取得
            </ConsoleButton>
          </div>
          <div className="mt-2 text-[11px] text-gray-400">※ 取得後に下のフォームを編集して「更新」を押してください。</div>
        </ConsolePanel>
      )}

      {/* フォーム */}
      <form onSubmit={onSubmit}>
        {SECTIONS[tab].map((s) => (
          <FormSection key={`${tab}-${s.title}`} title={s.title} open={s.open}>
            <div className={`grid grid-cols-1 gap-2.5 ${GRID_COLS[s.cols] ?? "md:grid-cols-4"}`}>{s.fields.map(renderField)}</div>
          </FormSection>
        ))}

        <div className="sticky bottom-0 z-10 flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white/95 px-3.5 py-2.5 backdrop-blur">
          <StatusBadge tone={mode === "create" ? "ok" : "warn"} dot={false}>
            {mode === "create" ? "POST" : "PUT"}
          </StatusBadge>
          <span className="font-mono text-xs font-bold text-gray-700">{tab}</span>
          {busy ? <StatusBadge tone="warn">処理中…</StatusBadge> : <StatusBadge tone="neutral">待機中</StatusBadge>}
          <div className="ml-auto flex gap-1.5">
            <ConsoleButton onClick={clearCurrent} disabled={busy}>
              <Eraser className="h-3.5 w-3.5" />
              クリア
            </ConsoleButton>
            <ConsoleButton type="submit" variant="primary" loading={busy}>
              {!busy && <Save className="h-3.5 w-3.5" />}
              {mode === "create" ? "登録" : "更新"}
            </ConsoleButton>
          </div>
        </div>
      </form>

      {/* JSON貼り付け */}
      <ConsoleModal
        open={jsonOpen}
        title={`${tab} のJSONを貼り付け`}
        description="貼り付けた内容を今のフォームに上書きします（含まれない項目はそのまま）。"
        onClose={() => setJsonOpen(false)}
        width={720}
        footer={
          <div className="ml-auto flex gap-1.5">
            <ConsoleButton onClick={() => setJsonOpen(false)}>キャンセル</ConsoleButton>
            <ConsoleButton variant="primary" onClick={applyPasteJson} disabled={!jsonText.trim()}>
              反映する
            </ConsoleButton>
          </div>
        }
      >
        {jsonError && <ConsoleNotice tone="ng" title={jsonError} />}
        <ConsoleTextarea
          autoFocus
          value={jsonText}
          onChange={(e) => {
            setJsonText(e.target.value);
            setJsonError(null);
          }}
          rows={14}
          placeholder='{ "gameId": "...", "matchId": "..." }'
          className="w-full resize-y font-mono text-xs"
        />
      </ConsoleModal>
    </div>
  );
}
