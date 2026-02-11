import React, { useMemo, useState } from "react";

/** ===== 共通UI ===== */
type Mode = "create" | "update";

function TabButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "8px 12px",
        borderRadius: 999,
        border: "1px solid #e5e7eb",
        background: active ? "#111827" : "white",
        color: active ? "white" : "#111827",
        fontWeight: 800,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function Section({ title, children, open = true }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details open={open} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, background: "#fff" }}>
      <summary style={{ cursor: "pointer", fontWeight: 800, marginBottom: 10 }}>{title}</summary>
      <div style={{ display: "grid", gap: 12 }}>{children}</div>
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
    <div style={{ display: "grid", gap: 6 }}>
      <label style={{ fontWeight: 700 }}>
        {label} {required ? <span style={{ color: "#ef4444" }}>*</span> : null}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        disabled={disabled}
        style={{
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid #e5e7eb",
          background: disabled ? "#f9fafb" : "white",
        }}
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

/** --- DataEntity（前回のを再利用・ここでは最小定義）--- */
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
  // ※必要なら前回出した全項目版に差し替えOK
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
  switch (k) {
    case "DataEntity":
      return "DataEntity";
    case "CountryLeagueMaster":
      return "CountryLeagueMaster";
    case "CountryLeagueSeasonMaster":
      return "CountryLeagueSeasonMaster";
    case "TeamMemberMaster":
      return "TeamMemberMaster";
    case "FutureEntity":
      return "FutureEntity";
  }
}

/** ===== メインページ ===== */
export default function ManualDataConsolePage() {
  const [mode, setMode] = useState<Mode>("create");
  const [tab, setTab] = useState<TabKey>("DataEntity");

  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // update mode用キー
  const [updateKey, setUpdateKey] = useState({
    id: "",
    // DataEntity用
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
      setMsg("JSONを反映しました。");
    } catch {
      setMsg("JSONのパースに失敗しました。");
    }
  };

  /** ===== API方針（仮） =====
   * create:
   *  POST /api/admin/manual/{entity}
   * update:
   *  GET  /api/admin/manual/{entity}/{id...}
   *  PUT  /api/admin/manual/{entity}/{id...}
   *
   * ※ ここだけあなたのバックエンドに合わせて変更すればOK
   */
  const api = {
    DataEntity: {
      create: "/v1/api/admin/manual/data-entity",
      // キー例：gameId/matchId/seq
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
      // Futureはidがないので、例として file+seq で取る想定
      get: (file: string, seq: string) => `/v1/api/admin/manual/future-entity?file=${encodeURIComponent(file)}&seq=${encodeURIComponent(seq)}`,
      update: (file: string, seq: string) => `/v1/api/admin/manual/future-entity?file=${encodeURIComponent(file)}&seq=${encodeURIComponent(seq)}`,
    },
  } as const;

  const canFetchUpdate = useMemo(() => {
    if (mode !== "update") return false;
    if (tab === "DataEntity") return !!updateKey.gameId && !!updateKey.matchId && !!updateKey.seq;
    if (tab === "FutureEntity") return !!future.file && !!future.seq; // 例
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

      setMsg("取得しました。編集して更新してください。");
    } catch (e: any) {
      setMsg(`取得に失敗しました: ${e?.message ?? "unknown"}`);
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
        setMsg("登録しました。");
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

      setMsg("更新しました。");
    } catch (e: any) {
      setMsg(`${mode === "create" ? "登録" : "更新"}に失敗しました: ${e?.message ?? "unknown"}`);
    } finally {
      setBusy(false);
    }
  };

  /** ===== タブ別フォーム ===== */
  const renderForm = () => {
    if (tab === "CountryLeagueMaster") {
      return (
        <Section title="CountryLeagueMasterEntity">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Field label="id" value={clm.id} onChange={(v) => setClm((p) => ({ ...p, id: v }))} placeholder="updateは上のID欄推奨" />
            <Field label="country" value={clm.country} onChange={(v) => setClm((p) => ({ ...p, country: v }))} />
            <Field label="league" value={clm.league} onChange={(v) => setClm((p) => ({ ...p, league: v }))} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Field label="team" value={clm.team} onChange={(v) => setClm((p) => ({ ...p, team: v }))} />
            <Field label="link" value={clm.link} onChange={(v) => setClm((p) => ({ ...p, link: v }))} />
            <Field label="delFlg" value={clm.delFlg} onChange={(v) => setClm((p) => ({ ...p, delFlg: v }))} placeholder="0/1" />
          </div>
        </Section>
      );
    }

    if (tab === "CountryLeagueSeasonMaster") {
      return (
        <Section title="CountryLeagueSeasonMasterEntity">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Field label="id" value={cls.id} onChange={(v) => setCls((p) => ({ ...p, id: v }))} />
            <Field label="country" value={cls.country} onChange={(v) => setCls((p) => ({ ...p, country: v }))} />
            <Field label="league" value={cls.league} onChange={(v) => setCls((p) => ({ ...p, league: v }))} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Field label="seasonYear" value={cls.seasonYear} onChange={(v) => setCls((p) => ({ ...p, seasonYear: v }))} placeholder="例: 2025/2026" />
            <Field label="startSeasonDate" value={cls.startSeasonDate} onChange={(v) => setCls((p) => ({ ...p, startSeasonDate: v }))} placeholder="例: 2025-08-01" />
            <Field label="endSeasonDate" value={cls.endSeasonDate} onChange={(v) => setCls((p) => ({ ...p, endSeasonDate: v }))} placeholder="例: 2026-05-20" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
            <Field label="round" value={cls.round} onChange={(v) => setCls((p) => ({ ...p, round: v }))} />
            <Field label="path" value={cls.path} onChange={(v) => setCls((p) => ({ ...p, path: v }))} />
            <Field label="icon" value={cls.icon} onChange={(v) => setCls((p) => ({ ...p, icon: v }))} />
            <Field label="validFlg" value={cls.validFlg} onChange={(v) => setCls((p) => ({ ...p, validFlg: v }))} placeholder="0/1" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="delFlg" value={cls.delFlg} onChange={(v) => setCls((p) => ({ ...p, delFlg: v }))} placeholder="0/1" />
          </div>
        </Section>
      );
    }

    if (tab === "TeamMemberMaster") {
      return (
        <>
          <Section title="基本" open>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <Field label="id" value={tmm.id} onChange={(v) => setTmm((p) => ({ ...p, id: v }))} />
              <Field label="file" value={tmm.file} onChange={(v) => setTmm((p) => ({ ...p, file: v }))} />
              <Field label="member" value={tmm.member} onChange={(v) => setTmm((p) => ({ ...p, member: v }))} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <Field label="country" value={tmm.country} onChange={(v) => setTmm((p) => ({ ...p, country: v }))} />
              <Field label="league" value={tmm.league} onChange={(v) => setTmm((p) => ({ ...p, league: v }))} />
              <Field label="team" value={tmm.team} onChange={(v) => setTmm((p) => ({ ...p, team: v }))} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              <Field label="position" value={tmm.position} onChange={(v) => setTmm((p) => ({ ...p, position: v }))} />
              <Field label="jersey" value={tmm.jersey} onChange={(v) => setTmm((p) => ({ ...p, jersey: v }))} />
              <Field label="score" value={tmm.score} onChange={(v) => setTmm((p) => ({ ...p, score: v }))} />
              <Field label="loanBelong" value={tmm.loanBelong} onChange={(v) => setTmm((p) => ({ ...p, loanBelong: v }))} />
            </div>
          </Section>

          <Section title="詳細" open={false}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              <Field label="birth" value={tmm.birth} onChange={(v) => setTmm((p) => ({ ...p, birth: v }))} />
              <Field label="age" value={tmm.age} onChange={(v) => setTmm((p) => ({ ...p, age: v }))} />
              <Field label="height" value={tmm.height} onChange={(v) => setTmm((p) => ({ ...p, height: v }))} />
              <Field label="weight" value={tmm.weight} onChange={(v) => setTmm((p) => ({ ...p, weight: v }))} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              <Field label="marketValue" value={tmm.marketValue} onChange={(v) => setTmm((p) => ({ ...p, marketValue: v }))} />
              <Field label="injury" value={tmm.injury} onChange={(v) => setTmm((p) => ({ ...p, injury: v }))} />
              <Field label="facePicPath" value={tmm.facePicPath} onChange={(v) => setTmm((p) => ({ ...p, facePicPath: v }))} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="belongList" value={tmm.belongList} onChange={(v) => setTmm((p) => ({ ...p, belongList: v }))} />
              <Field label="versusTeamScoreData" value={tmm.versusTeamScoreData} onChange={(v) => setTmm((p) => ({ ...p, versusTeamScoreData: v }))} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              <Field label="retireFlg" value={tmm.retireFlg} onChange={(v) => setTmm((p) => ({ ...p, retireFlg: v }))} placeholder="0/1" />
              <Field label="deadline" value={tmm.deadline} onChange={(v) => setTmm((p) => ({ ...p, deadline: v }))} placeholder="0/1" />
              <Field label="deadlineContractDate" value={tmm.deadlineContractDate} onChange={(v) => setTmm((p) => ({ ...p, deadlineContractDate: v }))} />
              <Field label="latestInfoDate" value={tmm.latestInfoDate} onChange={(v) => setTmm((p) => ({ ...p, latestInfoDate: v }))} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              <Field label="updStamp" value={tmm.updStamp} onChange={(v) => setTmm((p) => ({ ...p, updStamp: v }))} />
              <Field label="delFlg" value={tmm.delFlg} onChange={(v) => setTmm((p) => ({ ...p, delFlg: v }))} placeholder="0/1" />
            </div>
          </Section>
        </>
      );
    }

    if (tab === "FutureEntity") {
      return (
        <>
          <Section title="基本" open>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <Field label="file" value={future.file} onChange={(v) => setFuture((p) => ({ ...p, file: v }))} />
              <Field label="seq" value={future.seq} onChange={(v) => setFuture((p) => ({ ...p, seq: v }))} />
              <Field label="futureTime" value={future.futureTime} onChange={(v) => setFuture((p) => ({ ...p, futureTime: v }))} placeholder="例: 2026-02-11 19:00" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="homeTeamName" value={future.homeTeamName} onChange={(v) => setFuture((p) => ({ ...p, homeTeamName: v }))} />
              <Field label="awayTeamName" value={future.awayTeamName} onChange={(v) => setFuture((p) => ({ ...p, awayTeamName: v }))} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              <Field label="gameTeamCategory" value={future.gameTeamCategory} onChange={(v) => setFuture((p) => ({ ...p, gameTeamCategory: v }))} />
              <Field label="homeRank" value={future.homeRank} onChange={(v) => setFuture((p) => ({ ...p, homeRank: v }))} />
              <Field label="awayRank" value={future.awayRank} onChange={(v) => setFuture((p) => ({ ...p, awayRank: v }))} />
              <Field label="startFlg" value={future.startFlg} onChange={(v) => setFuture((p) => ({ ...p, startFlg: v }))} placeholder="0/1" />
            </div>
          </Section>

          <Section title="成績・リンク・取得時刻" open={false}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              <Field label="homeMaxGettingScorer" value={future.homeMaxGettingScorer} onChange={(v) => setFuture((p) => ({ ...p, homeMaxGettingScorer: v }))} />
              <Field label="awayMaxGettingScorer" value={future.awayMaxGettingScorer} onChange={(v) => setFuture((p) => ({ ...p, awayMaxGettingScorer: v }))} />
              <Field label="gameLink" value={future.gameLink} onChange={(v) => setFuture((p) => ({ ...p, gameLink: v }))} />
              <Field label="dataTime" value={future.dataTime} onChange={(v) => setFuture((p) => ({ ...p, dataTime: v }))} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              <Field label="homeTeamHomeScore" value={future.homeTeamHomeScore} onChange={(v) => setFuture((p) => ({ ...p, homeTeamHomeScore: v }))} />
              <Field label="homeTeamHomeLost" value={future.homeTeamHomeLost} onChange={(v) => setFuture((p) => ({ ...p, homeTeamHomeLost: v }))} />
              <Field label="awayTeamHomeScore" value={future.awayTeamHomeScore} onChange={(v) => setFuture((p) => ({ ...p, awayTeamHomeScore: v }))} />
              <Field label="awayTeamHomeLost" value={future.awayTeamHomeLost} onChange={(v) => setFuture((p) => ({ ...p, awayTeamHomeLost: v }))} />

              <Field label="homeTeamAwayScore" value={future.homeTeamAwayScore} onChange={(v) => setFuture((p) => ({ ...p, homeTeamAwayScore: v }))} />
              <Field label="homeTeamAwayLost" value={future.homeTeamAwayLost} onChange={(v) => setFuture((p) => ({ ...p, homeTeamAwayLost: v }))} />
              <Field label="awayTeamAwayScore" value={future.awayTeamAwayScore} onChange={(v) => setFuture((p) => ({ ...p, awayTeamAwayScore: v }))} />
              <Field label="awayTeamAwayLost" value={future.awayTeamAwayLost} onChange={(v) => setFuture((p) => ({ ...p, awayTeamAwayLost: v }))} />
            </div>
          </Section>
        </>
      );
    }

    // DataEntity（簡易版）
    return (
      <>
        <Section title="DataEntity（基本）" open>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Field label="gameId" value={data.gameId} onChange={(v) => setData((p) => ({ ...p, gameId: v }))} required />
            <Field label="matchId" value={data.matchId} onChange={(v) => setData((p) => ({ ...p, matchId: v }))} required />
            <Field label="seq" value={data.seq} onChange={(v) => setData((p) => ({ ...p, seq: v }))} required />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="times" value={data.times} onChange={(v) => setData((p) => ({ ...p, times: v }))} placeholder="例: 2026-02-11 19:00" />
            <Field label="recordTime" value={data.recordTime} onChange={(v) => setData((p) => ({ ...p, recordTime: v }))} placeholder="例: 2026-02-11 21:00" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="homeTeamName" value={data.homeTeamName} onChange={(v) => setData((p) => ({ ...p, homeTeamName: v }))} required />
            <Field label="awayTeamName" value={data.awayTeamName} onChange={(v) => setData((p) => ({ ...p, awayTeamName: v }))} required />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            <Field label="homeScore" value={data.homeScore} onChange={(v) => setData((p) => ({ ...p, homeScore: v }))} />
            <Field label="awayScore" value={data.awayScore} onChange={(v) => setData((p) => ({ ...p, awayScore: v }))} />
            <Field label="noticeFlg" value={data.noticeFlg} onChange={(v) => setData((p) => ({ ...p, noticeFlg: v }))} placeholder="0/1" />
            <Field label="addManualFlg" value={data.addManualFlg} onChange={(v) => setData((p) => ({ ...p, addManualFlg: v }))} placeholder="手動=1推奨" />
          </div>
        </Section>

        <Section title="DataEntity（その他）" open={false}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            <Field label="file" value={data.file} onChange={(v) => setData((p) => ({ ...p, file: v }))} />
            <Field label="dataCategory" value={data.dataCategory} onChange={(v) => setData((p) => ({ ...p, dataCategory: v }))} />
            <Field label="gameLink" value={data.gameLink} onChange={(v) => setData((p) => ({ ...p, gameLink: v }))} />
            <Field label="judge" value={data.judge} onChange={(v) => setData((p) => ({ ...p, judge: v }))} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            <Field label="goalTime" value={data.goalTime} onChange={(v) => setData((p) => ({ ...p, goalTime: v }))} />
            <Field label="goalTeamMember" value={data.goalTeamMember} onChange={(v) => setData((p) => ({ ...p, goalTeamMember: v }))} />
            <Field label="probablity" value={data.probablity} onChange={(v) => setData((p) => ({ ...p, probablity: v }))} />
            <Field label="predictionScoreTime" value={data.predictionScoreTime} onChange={(v) => setData((p) => ({ ...p, predictionScoreTime: v }))} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="timeSortSeconds" value={data.timeSortSeconds} onChange={(v) => setData((p) => ({ ...p, timeSortSeconds: v === "" ? "" : Number(v) }))} type="number" />
            <Field label="fileCount" value={data.fileCount} onChange={(v) => setData((p) => ({ ...p, fileCount: v === "" ? "" : Number(v) }))} type="number" />
          </div>
        </Section>
      </>
    );
  };

  return (
    <div style={{ maxWidth: 1200 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>手動登録 / 更新</h1>
          <div style={{ color: "#6b7280" }}>タブでEntityを切り替え、登録/更新を同一画面で行います。</div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <TabButton active={mode === "create"} onClick={() => setMode("create")}>
            登録
          </TabButton>
          <TabButton active={mode === "update"} onClick={() => setMode("update")}>
            更新
          </TabButton>
          <button type="button" onClick={onPasteJson} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #e5e7eb", background: "white", fontWeight: 800 }}>
            JSON貼り付け
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
        {(["DataEntity", "CountryLeagueMaster", "CountryLeagueSeasonMaster", "TeamMemberMaster", "FutureEntity"] as TabKey[]).map((k) => (
          <TabButton key={k} active={tab === k} onClick={() => setTab(k)}>
            {entityLabel(k)}
          </TabButton>
        ))}
      </div>

      {mode === "update" ? (
        <div style={{ marginTop: 14, border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, background: "#fafafa" }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>更新：対象データ取得</div>

          {tab === "DataEntity" ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
              <Field label="gameId" value={updateKey.gameId} onChange={(v) => setUpdateKey((p) => ({ ...p, gameId: v }))} />
              <Field label="matchId" value={updateKey.matchId} onChange={(v) => setUpdateKey((p) => ({ ...p, matchId: v }))} />
              <Field label="seq" value={updateKey.seq} onChange={(v) => setUpdateKey((p) => ({ ...p, seq: v }))} />
              <button
                type="button"
                disabled={!canFetchUpdate || busy}
                onClick={onFetchForUpdate}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #111827",
                  background: !canFetchUpdate || busy ? "#e5e7eb" : "#111827",
                  color: !canFetchUpdate || busy ? "#6b7280" : "white",
                  fontWeight: 900,
                  cursor: !canFetchUpdate || busy ? "not-allowed" : "pointer",
                  height: 42,
                }}
              >
                取得
              </button>
            </div>
          ) : tab === "FutureEntity" ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "end" }}>
              <Field label="file（フォームの値を使います）" value={future.file} onChange={(v) => setFuture((p) => ({ ...p, file: v }))} />
              <Field label="seq（フォームの値を使います）" value={future.seq} onChange={(v) => setFuture((p) => ({ ...p, seq: v }))} />
              <button
                type="button"
                disabled={!canFetchUpdate || busy}
                onClick={onFetchForUpdate}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #111827",
                  background: !canFetchUpdate || busy ? "#e5e7eb" : "#111827",
                  color: !canFetchUpdate || busy ? "#6b7280" : "white",
                  fontWeight: 900,
                  cursor: !canFetchUpdate || busy ? "not-allowed" : "pointer",
                  height: 42,
                }}
              >
                取得
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "end" }}>
              <Field label="id" value={updateKey.id} onChange={(v) => setUpdateKey((p) => ({ ...p, id: v }))} />
              <button
                type="button"
                disabled={!canFetchUpdate || busy}
                onClick={onFetchForUpdate}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #111827",
                  background: !canFetchUpdate || busy ? "#e5e7eb" : "#111827",
                  color: !canFetchUpdate || busy ? "#6b7280" : "white",
                  fontWeight: 900,
                  cursor: !canFetchUpdate || busy ? "not-allowed" : "pointer",
                  height: 42,
                }}
              >
                取得
              </button>
            </div>
          )}

          <div style={{ marginTop: 8, color: "#6b7280", fontSize: 12 }}>※ 取得後に下のフォームを編集して「更新」を押してください。</div>
        </div>
      ) : null}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, marginTop: 14 }}>
        {renderForm()}

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            type="submit"
            disabled={busy}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #111827",
              background: busy ? "#e5e7eb" : "#111827",
              color: busy ? "#6b7280" : "white",
              cursor: busy ? "not-allowed" : "pointer",
              fontWeight: 900,
            }}
          >
            {busy ? "処理中..." : mode === "create" ? "登録" : "更新"}
          </button>

          <button type="button" onClick={clearCurrent} disabled={busy} style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #e5e7eb", background: "white", fontWeight: 800 }}>
            クリア
          </button>

          {msg ? <div style={{ color: "#111827" }}>{msg}</div> : null}
        </div>
      </form>
    </div>
  );
}
