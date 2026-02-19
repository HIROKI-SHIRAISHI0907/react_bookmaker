import React, { useMemo, useState } from "react";

/** ===== 共通UI ===== */
type Mode = "create" | "update";

type Tone = "gray" | "blue" | "emerald" | "amber" | "rose";

function Badge({ children, tone = "gray" }: { children: React.ReactNode; tone?: Tone }) {
  const cls: Record<Tone, string> = {
    gray: "bg-gray-100 text-gray-700 ring-gray-200",
    blue: "bg-blue-100 text-blue-800 ring-blue-200",
    emerald: "bg-emerald-100 text-emerald-800 ring-emerald-200",
    amber: "bg-amber-100 text-amber-900 ring-amber-200",
    rose: "bg-rose-100 text-rose-800 ring-rose-200",
  };
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ring-1 ring-inset ${cls[tone]}`}>{children}</span>;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border bg-white/85 backdrop-blur shadow-sm ${className}`}>{children}</div>;
}

function Alert({ type, title, message, onClose }: { type: "info" | "success" | "error"; title: string; message: string; onClose?: () => void }) {
  const cls = type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : type === "error" ? "border-rose-200 bg-rose-50 text-rose-900" : "border-blue-200 bg-blue-50 text-blue-900";
  const icon = type === "success" ? "✅" : type === "error" ? "❌" : "💡";

  return (
    <div className={`rounded-2xl border p-4 flex items-start gap-3 ${cls}`}>
      <div className="mt-0.5">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-extrabold">{title}</div>
        <pre className="mt-1 text-xs whitespace-pre-wrap leading-relaxed">{message}</pre>
      </div>
      {onClose ? (
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors">
          ✕
        </button>
      ) : null}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

function Button({
  children,
  onClick,
  type = "button",
  disabled,
  loading,
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit";
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-extrabold transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const v = variant === "primary" ? "bg-gray-900 text-white border-gray-900 focus:ring-gray-400" : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50 focus:ring-gray-300";

  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} className={`${base} ${v}`}>
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}

function SegButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-4 py-2 text-sm font-extrabold transition-colors
        ${active ? "bg-gray-900 text-white" : "bg-white text-gray-900 hover:bg-gray-50"}
      `}
    >
      {children}
    </button>
  );
}

function PillTab({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-3 py-1.5 rounded-full border text-sm font-extrabold transition-all
        ${active ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"}
      `}
    >
      {children}
    </button>
  );
}

function Section({ title, children, open = true }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details open={open} className="rounded-2xl border bg-white overflow-hidden">
      <summary className="cursor-pointer select-none px-5 py-4 bg-gradient-to-r from-white to-gray-50 border-b font-extrabold text-gray-900">{title}</summary>
      <div className="p-5 grid gap-4">{children}</div>
    </details>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  disabled,
}: {
  label: string;
  value: string | number | "";
  onChange: (v: string) => void;
  placeholder?: string;
  type?: "text" | "number";
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-extrabold text-gray-900">
        {label} {required ? <span className="text-rose-600">*</span> : null}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        disabled={disabled}
        className={`
          w-full px-4 py-3 rounded-xl border bg-white text-sm
          transition-colors
          ${disabled ? "bg-gray-50 text-gray-500" : "hover:border-gray-300"}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        `}
      />
    </div>
  );
}

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

function entityLabel(k: TabKey) {
  return k;
}

/** ===== メインページ ===== */
export default function ManualDataConsolePage() {
  const [mode, setMode] = useState<Mode>("create");
  const [tab, setTab] = useState<TabKey>("DataEntity");

  const [msg, setMsg] = useState<{ type: "info" | "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

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

  const onPasteJson = () => {
    setMsg(null);
    const txt = window.prompt(`${entityLabel(tab)} のJSONを貼り付けてください`);
    if (!txt) return;
    try {
      const obj = JSON.parse(txt);
      setCurrent(obj);
      setMsg({ type: "success", text: "JSONを反映しました。" });
    } catch {
      setMsg({ type: "error", text: "JSONのパースに失敗しました。" });
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

      setMsg({ type: "success", text: "取得しました。編集して更新してください。" });
    } catch (e: any) {
      setMsg({ type: "error", text: `取得に失敗しました: ${e?.message ?? "unknown"}` });
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
        setMsg({ type: "success", text: "登録しました。" });
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

      setMsg({ type: "success", text: "更新しました。" });
    } catch (e: any) {
      setMsg({ type: "error", text: `${mode === "create" ? "登録" : "更新"}に失敗しました: ${e?.message ?? "unknown"}` });
    } finally {
      setBusy(false);
    }
  };

  /** ===== タブ別フォーム ===== */
  const renderForm = () => {
    if (tab === "CountryLeagueMaster") {
      return (
        <Section title="CountryLeagueMasterEntity">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="id" value={clm.id} onChange={(v) => setClm((p) => ({ ...p, id: v }))} placeholder="updateは上のID欄推奨" disabled={busy} />
            <Field label="country" value={clm.country} onChange={(v) => setClm((p) => ({ ...p, country: v }))} disabled={busy} />
            <Field label="league" value={clm.league} onChange={(v) => setClm((p) => ({ ...p, league: v }))} disabled={busy} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="team" value={clm.team} onChange={(v) => setClm((p) => ({ ...p, team: v }))} disabled={busy} />
            <Field label="link" value={clm.link} onChange={(v) => setClm((p) => ({ ...p, link: v }))} disabled={busy} />
            <Field label="delFlg" value={clm.delFlg} onChange={(v) => setClm((p) => ({ ...p, delFlg: v }))} placeholder="0/1" disabled={busy} />
          </div>
        </Section>
      );
    }

    if (tab === "CountryLeagueSeasonMaster") {
      return (
        <Section title="CountryLeagueSeasonMasterEntity">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="id" value={cls.id} onChange={(v) => setCls((p) => ({ ...p, id: v }))} disabled={busy} />
            <Field label="country" value={cls.country} onChange={(v) => setCls((p) => ({ ...p, country: v }))} disabled={busy} />
            <Field label="league" value={cls.league} onChange={(v) => setCls((p) => ({ ...p, league: v }))} disabled={busy} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="seasonYear" value={cls.seasonYear} onChange={(v) => setCls((p) => ({ ...p, seasonYear: v }))} placeholder="例: 2025/2026" disabled={busy} />
            <Field label="startSeasonDate" value={cls.startSeasonDate} onChange={(v) => setCls((p) => ({ ...p, startSeasonDate: v }))} placeholder="例: 2025-08-01" disabled={busy} />
            <Field label="endSeasonDate" value={cls.endSeasonDate} onChange={(v) => setCls((p) => ({ ...p, endSeasonDate: v }))} placeholder="例: 2026-05-20" disabled={busy} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Field label="round" value={cls.round} onChange={(v) => setCls((p) => ({ ...p, round: v }))} disabled={busy} />
            <Field label="path" value={cls.path} onChange={(v) => setCls((p) => ({ ...p, path: v }))} disabled={busy} />
            <Field label="icon" value={cls.icon} onChange={(v) => setCls((p) => ({ ...p, icon: v }))} disabled={busy} />
            <Field label="validFlg" value={cls.validFlg} onChange={(v) => setCls((p) => ({ ...p, validFlg: v }))} placeholder="0/1" disabled={busy} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="delFlg" value={cls.delFlg} onChange={(v) => setCls((p) => ({ ...p, delFlg: v }))} placeholder="0/1" disabled={busy} />
          </div>
        </Section>
      );
    }

    if (tab === "TeamMemberMaster") {
      return (
        <>
          <Section title="基本" open>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="id" value={tmm.id} onChange={(v) => setTmm((p) => ({ ...p, id: v }))} disabled={busy} />
              <Field label="file" value={tmm.file} onChange={(v) => setTmm((p) => ({ ...p, file: v }))} disabled={busy} />
              <Field label="member" value={tmm.member} onChange={(v) => setTmm((p) => ({ ...p, member: v }))} disabled={busy} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="country" value={tmm.country} onChange={(v) => setTmm((p) => ({ ...p, country: v }))} disabled={busy} />
              <Field label="league" value={tmm.league} onChange={(v) => setTmm((p) => ({ ...p, league: v }))} disabled={busy} />
              <Field label="team" value={tmm.team} onChange={(v) => setTmm((p) => ({ ...p, team: v }))} disabled={busy} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Field label="position" value={tmm.position} onChange={(v) => setTmm((p) => ({ ...p, position: v }))} disabled={busy} />
              <Field label="jersey" value={tmm.jersey} onChange={(v) => setTmm((p) => ({ ...p, jersey: v }))} disabled={busy} />
              <Field label="score" value={tmm.score} onChange={(v) => setTmm((p) => ({ ...p, score: v }))} disabled={busy} />
              <Field label="loanBelong" value={tmm.loanBelong} onChange={(v) => setTmm((p) => ({ ...p, loanBelong: v }))} disabled={busy} />
            </div>
          </Section>

          <Section title="詳細" open={false}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Field label="birth" value={tmm.birth} onChange={(v) => setTmm((p) => ({ ...p, birth: v }))} disabled={busy} />
              <Field label="age" value={tmm.age} onChange={(v) => setTmm((p) => ({ ...p, age: v }))} disabled={busy} />
              <Field label="height" value={tmm.height} onChange={(v) => setTmm((p) => ({ ...p, height: v }))} disabled={busy} />
              <Field label="weight" value={tmm.weight} onChange={(v) => setTmm((p) => ({ ...p, weight: v }))} disabled={busy} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="marketValue" value={tmm.marketValue} onChange={(v) => setTmm((p) => ({ ...p, marketValue: v }))} disabled={busy} />
              <Field label="injury" value={tmm.injury} onChange={(v) => setTmm((p) => ({ ...p, injury: v }))} disabled={busy} />
              <Field label="facePicPath" value={tmm.facePicPath} onChange={(v) => setTmm((p) => ({ ...p, facePicPath: v }))} disabled={busy} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="belongList" value={tmm.belongList} onChange={(v) => setTmm((p) => ({ ...p, belongList: v }))} disabled={busy} />
              <Field label="versusTeamScoreData" value={tmm.versusTeamScoreData} onChange={(v) => setTmm((p) => ({ ...p, versusTeamScoreData: v }))} disabled={busy} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Field label="retireFlg" value={tmm.retireFlg} onChange={(v) => setTmm((p) => ({ ...p, retireFlg: v }))} placeholder="0/1" disabled={busy} />
              <Field label="deadline" value={tmm.deadline} onChange={(v) => setTmm((p) => ({ ...p, deadline: v }))} placeholder="0/1" disabled={busy} />
              <Field label="deadlineContractDate" value={tmm.deadlineContractDate} onChange={(v) => setTmm((p) => ({ ...p, deadlineContractDate: v }))} disabled={busy} />
              <Field label="latestInfoDate" value={tmm.latestInfoDate} onChange={(v) => setTmm((p) => ({ ...p, latestInfoDate: v }))} disabled={busy} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="updStamp" value={tmm.updStamp} onChange={(v) => setTmm((p) => ({ ...p, updStamp: v }))} disabled={busy} />
              <Field label="delFlg" value={tmm.delFlg} onChange={(v) => setTmm((p) => ({ ...p, delFlg: v }))} placeholder="0/1" disabled={busy} />
            </div>
          </Section>
        </>
      );
    }

    if (tab === "FutureEntity") {
      return (
        <>
          <Section title="基本" open>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="file" value={future.file} onChange={(v) => setFuture((p) => ({ ...p, file: v }))} disabled={busy} />
              <Field label="seq" value={future.seq} onChange={(v) => setFuture((p) => ({ ...p, seq: v }))} disabled={busy} />
              <Field label="futureTime" value={future.futureTime} onChange={(v) => setFuture((p) => ({ ...p, futureTime: v }))} placeholder="例: 2026-02-11 19:00" disabled={busy} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="homeTeamName" value={future.homeTeamName} onChange={(v) => setFuture((p) => ({ ...p, homeTeamName: v }))} disabled={busy} />
              <Field label="awayTeamName" value={future.awayTeamName} onChange={(v) => setFuture((p) => ({ ...p, awayTeamName: v }))} disabled={busy} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Field label="gameTeamCategory" value={future.gameTeamCategory} onChange={(v) => setFuture((p) => ({ ...p, gameTeamCategory: v }))} disabled={busy} />
              <Field label="homeRank" value={future.homeRank} onChange={(v) => setFuture((p) => ({ ...p, homeRank: v }))} disabled={busy} />
              <Field label="awayRank" value={future.awayRank} onChange={(v) => setFuture((p) => ({ ...p, awayRank: v }))} disabled={busy} />
              <Field label="startFlg" value={future.startFlg} onChange={(v) => setFuture((p) => ({ ...p, startFlg: v }))} placeholder="0/1" disabled={busy} />
            </div>
          </Section>

          <Section title="成績・リンク・取得時刻" open={false}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Field label="homeMaxGettingScorer" value={future.homeMaxGettingScorer} onChange={(v) => setFuture((p) => ({ ...p, homeMaxGettingScorer: v }))} disabled={busy} />
              <Field label="awayMaxGettingScorer" value={future.awayMaxGettingScorer} onChange={(v) => setFuture((p) => ({ ...p, awayMaxGettingScorer: v }))} disabled={busy} />
              <Field label="gameLink" value={future.gameLink} onChange={(v) => setFuture((p) => ({ ...p, gameLink: v }))} disabled={busy} />
              <Field label="dataTime" value={future.dataTime} onChange={(v) => setFuture((p) => ({ ...p, dataTime: v }))} disabled={busy} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Field label="homeTeamHomeScore" value={future.homeTeamHomeScore} onChange={(v) => setFuture((p) => ({ ...p, homeTeamHomeScore: v }))} disabled={busy} />
              <Field label="homeTeamHomeLost" value={future.homeTeamHomeLost} onChange={(v) => setFuture((p) => ({ ...p, homeTeamHomeLost: v }))} disabled={busy} />
              <Field label="awayTeamHomeScore" value={future.awayTeamHomeScore} onChange={(v) => setFuture((p) => ({ ...p, awayTeamHomeScore: v }))} disabled={busy} />
              <Field label="awayTeamHomeLost" value={future.awayTeamHomeLost} onChange={(v) => setFuture((p) => ({ ...p, awayTeamHomeLost: v }))} disabled={busy} />

              <Field label="homeTeamAwayScore" value={future.homeTeamAwayScore} onChange={(v) => setFuture((p) => ({ ...p, homeTeamAwayScore: v }))} disabled={busy} />
              <Field label="homeTeamAwayLost" value={future.homeTeamAwayLost} onChange={(v) => setFuture((p) => ({ ...p, homeTeamAwayLost: v }))} disabled={busy} />
              <Field label="awayTeamAwayScore" value={future.awayTeamAwayScore} onChange={(v) => setFuture((p) => ({ ...p, awayTeamAwayScore: v }))} disabled={busy} />
              <Field label="awayTeamAwayLost" value={future.awayTeamAwayLost} onChange={(v) => setFuture((p) => ({ ...p, awayTeamAwayLost: v }))} disabled={busy} />
            </div>
          </Section>
        </>
      );
    }

    // DataEntity（簡易版）
    return (
      <>
        <Section title="DataEntity（基本）" open>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="gameId" value={data.gameId} onChange={(v) => setData((p) => ({ ...p, gameId: v }))} required disabled={busy} />
            <Field label="matchId" value={data.matchId} onChange={(v) => setData((p) => ({ ...p, matchId: v }))} required disabled={busy} />
            <Field label="seq" value={data.seq} onChange={(v) => setData((p) => ({ ...p, seq: v }))} required disabled={busy} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="times" value={data.times} onChange={(v) => setData((p) => ({ ...p, times: v }))} placeholder="例: 2026-02-11 19:00" disabled={busy} />
            <Field label="recordTime" value={data.recordTime} onChange={(v) => setData((p) => ({ ...p, recordTime: v }))} placeholder="例: 2026-02-11 21:00" disabled={busy} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="homeTeamName" value={data.homeTeamName} onChange={(v) => setData((p) => ({ ...p, homeTeamName: v }))} required disabled={busy} />
            <Field label="awayTeamName" value={data.awayTeamName} onChange={(v) => setData((p) => ({ ...p, awayTeamName: v }))} required disabled={busy} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Field label="homeScore" value={data.homeScore} onChange={(v) => setData((p) => ({ ...p, homeScore: v }))} disabled={busy} />
            <Field label="awayScore" value={data.awayScore} onChange={(v) => setData((p) => ({ ...p, awayScore: v }))} disabled={busy} />
            <Field label="noticeFlg" value={data.noticeFlg} onChange={(v) => setData((p) => ({ ...p, noticeFlg: v }))} placeholder="0/1" disabled={busy} />
            <Field label="addManualFlg" value={data.addManualFlg} onChange={(v) => setData((p) => ({ ...p, addManualFlg: v }))} placeholder="手動=1推奨" disabled={busy} />
          </div>
        </Section>

        <Section title="DataEntity（その他）" open={false}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Field label="file" value={data.file} onChange={(v) => setData((p) => ({ ...p, file: v }))} disabled={busy} />
            <Field label="dataCategory" value={data.dataCategory} onChange={(v) => setData((p) => ({ ...p, dataCategory: v }))} disabled={busy} />
            <Field label="gameLink" value={data.gameLink} onChange={(v) => setData((p) => ({ ...p, gameLink: v }))} disabled={busy} />
            <Field label="judge" value={data.judge} onChange={(v) => setData((p) => ({ ...p, judge: v }))} disabled={busy} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Field label="goalTime" value={data.goalTime} onChange={(v) => setData((p) => ({ ...p, goalTime: v }))} disabled={busy} />
            <Field label="goalTeamMember" value={data.goalTeamMember} onChange={(v) => setData((p) => ({ ...p, goalTeamMember: v }))} disabled={busy} />
            <Field label="probablity" value={data.probablity} onChange={(v) => setData((p) => ({ ...p, probablity: v }))} disabled={busy} />
            <Field label="predictionScoreTime" value={data.predictionScoreTime} onChange={(v) => setData((p) => ({ ...p, predictionScoreTime: v }))} disabled={busy} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="timeSortSeconds" value={data.timeSortSeconds} onChange={(v) => setData((p) => ({ ...p, timeSortSeconds: v === "" ? "" : Number(v) }))} type="number" disabled={busy} />
            <Field label="fileCount" value={data.fileCount} onChange={(v) => setData((p) => ({ ...p, fileCount: v === "" ? "" : Number(v) }))} type="number" disabled={busy} />
          </div>
        </Section>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start md:items-center justify-between gap-4 flex-col md:flex-row">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-gray-900 to-gray-700 text-white p-3 rounded-2xl shadow-lg">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">手動登録 / 更新コンソール</h1>
              <p className="text-sm text-gray-600 mt-1">Entityを切り替えて、登録（POST）/更新（GET→PUT）を実行します。</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge tone={mode === "create" ? "emerald" : "amber"}>{mode === "create" ? "CREATE" : "UPDATE"}</Badge>
            <Badge tone="blue">{tab}</Badge>

            <div className="inline-flex rounded-2xl border overflow-hidden bg-white">
              <SegButton active={mode === "create"} onClick={() => setMode("create")}>
                登録
              </SegButton>
              <SegButton active={mode === "update"} onClick={() => setMode("update")}>
                更新
              </SegButton>
            </div>

            <Button variant="secondary" onClick={onPasteJson} disabled={busy}>
              JSON貼り付け
            </Button>
          </div>
        </div>

        {/* Message */}
        {msg ? <Alert type={msg.type} title={msg.type === "success" ? "完了" : msg.type === "error" ? "エラー" : "情報"} message={msg.text} onClose={() => setMsg(null)} /> : null}

        {/* Entity tabs */}
        <Card className="p-5">
          <div className="flex items-center justify-between gap-4 flex-col md:flex-row">
            <div>
              <div className="text-lg font-extrabold text-gray-900">Entity</div>
              <div className="text-sm text-gray-600 mt-1">タブで対象テーブル（DTO）を切り替えます</div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {(["DataEntity", "CountryLeagueMaster", "CountryLeagueSeasonMaster", "TeamMemberMaster", "FutureEntity"] as TabKey[]).map((k) => (
                <PillTab key={k} active={tab === k} onClick={() => setTab(k)}>
                  {entityLabel(k)}
                </PillTab>
              ))}
            </div>
          </div>
        </Card>

        {/* Update fetch panel */}
        {mode === "update" ? (
          <Card className="p-5">
            <div className="flex items-start md:items-center justify-between gap-4 flex-col md:flex-row">
              <div>
                <div className="text-lg font-extrabold text-gray-900">更新：対象データ取得</div>
                <div className="text-sm text-gray-600 mt-1">キーを指定して GET → フォームに反映 → 編集 → PUT</div>
              </div>
              <Badge tone={canFetchUpdate ? "emerald" : "amber"}>{canFetchUpdate ? "READY" : "KEY REQUIRED"}</Badge>
            </div>

            <div className="mt-5">
              {tab === "DataEntity" ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <Field label="gameId" value={updateKey.gameId} onChange={(v) => setUpdateKey((p) => ({ ...p, gameId: v }))} disabled={busy} />
                  <Field label="matchId" value={updateKey.matchId} onChange={(v) => setUpdateKey((p) => ({ ...p, matchId: v }))} disabled={busy} />
                  <Field label="seq" value={updateKey.seq} onChange={(v) => setUpdateKey((p) => ({ ...p, seq: v }))} disabled={busy} />
                  <Button onClick={onFetchForUpdate} disabled={!canFetchUpdate} loading={busy}>
                    取得
                  </Button>
                </div>
              ) : tab === "FutureEntity" ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <Field label="file（フォームの値）" value={future.file} onChange={(v) => setFuture((p) => ({ ...p, file: v }))} disabled={busy} />
                  <Field label="seq（フォームの値）" value={future.seq} onChange={(v) => setFuture((p) => ({ ...p, seq: v }))} disabled={busy} />
                  <Button onClick={onFetchForUpdate} disabled={!canFetchUpdate} loading={busy}>
                    取得
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <Field label="id" value={updateKey.id} onChange={(v) => setUpdateKey((p) => ({ ...p, id: v }))} disabled={busy} />
                  <Button onClick={onFetchForUpdate} disabled={!canFetchUpdate} loading={busy}>
                    取得
                  </Button>
                </div>
              )}

              <div className="mt-3 text-xs text-gray-500">※ 取得後に下のフォームを編集して「更新」を押してください。</div>
            </div>
          </Card>
        ) : null}

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          {renderForm()}

          <Card className="p-5">
            <div className="flex items-center justify-between gap-3 flex-col md:flex-row">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge tone={mode === "create" ? "emerald" : "amber"}>{mode === "create" ? "POST" : "PUT"}</Badge>
                <Badge tone="blue">{tab}</Badge>
                {busy ? <Badge tone="amber">処理中…</Badge> : <Badge tone="gray">待機中</Badge>}
              </div>

              <div className="flex items-center gap-2">
                <Button type="submit" disabled={busy} loading={busy}>
                  {mode === "create" ? "登録" : "更新"}
                </Button>
                <Button variant="secondary" onClick={clearCurrent} disabled={busy}>
                  クリア
                </Button>
              </div>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
}
