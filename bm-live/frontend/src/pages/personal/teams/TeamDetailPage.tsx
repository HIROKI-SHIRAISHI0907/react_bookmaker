import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

type MatchStatus = "SCHEDULED" | "LIVE" | "FINISHED";
type Tone = "slate" | "indigo" | "emerald" | "amber" | "rose";

type TeamMeta = {
  id: string;
  name: string;
  country: string;
  league: string;
  season: string;
  crestText?: string;
};

// --- Team member API (/api/team-member-master/{teamEnglish}/{teamHash}) ---
type TeamMemberDTO = {
  id: string;
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

// --- Team detail ---
type TeamDetailResponse = {
  id: number;
  country: string;
  league: string;
  name: string;
  english: string;
  hash: string;
  link: string;
  paths: unknown;
};

// --- History API (/v1/api/history/{teamEnglish}/{teamHash}) ---
type HistoryMatchDTO = {
  seq: number;
  matchTime: string;
  gameTeamCategory: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  roundNo: number | null;
  link: string | null;
};
type HistoryEnvelope = { matches: HistoryMatchDTO[] };

// --- ScoredLost API (/v1/api/scoredLost/{teamEnglish}/{teamHash}) ---
type EachScoreLostDataResponseDTO = {
  seq: number;
  dataCategory: string;
  roundNo: string | null;
  recordTime: string | null;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number | null;
  awayScore: number | null;
  link: string | null;
  status: string | null;
};
type ScoredLostEnvelope = { matches: EachScoreLostDataResponseDTO[] };

// --- Each Team Score API (/api/each-team-score?teamEnglish=...&teamHash=...) ---
type StatSummaryDTO = {
  min: string;
  minCount: string;

  max: string;
  maxCount: string;

  avg: string;
  avgCount: string;

  stddev: string;
  stddevCount: string;

  minTime: string;
  minTimeCount: string;

  maxTime: string;
  maxTimeCount: string;

  skewness: string;
  skewnessCount: string;

  kurtosis: string;
  kurtosisCount: string;
};

type EachTeamScoreStatField =
  | "homeExpStat"
  | "awayExpStat"
  | "homeInGoalExpStat"
  | "awayInGoalExpStat"
  | "homeDonationStat"
  | "awayDonationStat"
  | "homeShootAllStat"
  | "awayShootAllStat"
  | "homeShootInStat"
  | "awayShootInStat"
  | "homeShootOutStat"
  | "awayShootOutStat"
  | "homeBlockShootStat"
  | "awayBlockShootStat"
  | "homeBigChanceStat"
  | "awayBigChanceStat"
  | "homeCornerStat"
  | "awayCornerStat"
  | "homeBoxShootInStat"
  | "awayBoxShootInStat"
  | "homeBoxShootOutStat"
  | "awayBoxShootOutStat"
  | "homeGoalPostStat"
  | "awayGoalPostStat"
  | "homeGoalHeadStat"
  | "awayGoalHeadStat"
  | "homeKeeperSaveStat"
  | "awayKeeperSaveStat"
  | "homeFreeKickStat"
  | "awayFreeKickStat"
  | "homeOffsideStat"
  | "awayOffsideStat"
  | "homeFoulStat"
  | "awayFoulStat"
  | "homeYellowCardStat"
  | "awayYellowCardStat"
  | "homeRedCardStat"
  | "awayRedCardStat"
  | "homeSlowInStat"
  | "awaySlowInStat"
  | "homeBoxTouchStat"
  | "awayBoxTouchStat"
  | "homePassCountStat"
  | "awayPassCountStat"
  | "homeLongPassCountStat"
  | "awayLongPassCountStat"
  | "homeFinalThirdPassCountStat"
  | "awayFinalThirdPassCountStat"
  | "homeCrossCountStat"
  | "awayCrossCountStat"
  | "homeTackleCountStat"
  | "awayTackleCountStat"
  | "homeClearCountStat"
  | "awayClearCountStat"
  | "homeDuelCountStat"
  | "awayDuelCountStat"
  | "homeInterceptCountStat"
  | "awayInterceptCountStat";

type EachTeamScoreResponseDTO = {
  id: string;
  situation: string;
  score: string;
  country: string;
  league: string;
  team: string;

  logicFlg: string;
  registerId: string;
  registerTime?: string | null;
  updateId: string;
  updateTime?: string | null;
} & Record<EachTeamScoreStatField, StatSummaryDTO>;

type EachTeamScoreStatPair = {
  label: string;
  homeKey: EachTeamScoreStatField;
  awayKey: EachTeamScoreStatField;
};

const EACH_TEAM_SCORE_STAT_PAIRS: EachTeamScoreStatPair[] = [
  { label: "期待値(xG)", homeKey: "homeExpStat", awayKey: "awayExpStat" },
  { label: "枠内期待値", homeKey: "homeInGoalExpStat", awayKey: "awayInGoalExpStat" },
  { label: "ポゼッション値", homeKey: "homeDonationStat", awayKey: "awayDonationStat" },
  { label: "総シュート", homeKey: "homeShootAllStat", awayKey: "awayShootAllStat" },
  { label: "枠内シュート", homeKey: "homeShootInStat", awayKey: "awayShootInStat" },
  { label: "枠外シュート", homeKey: "homeShootOutStat", awayKey: "awayShootOutStat" },
  { label: "ブロックシュート", homeKey: "homeBlockShootStat", awayKey: "awayBlockShootStat" },
  { label: "ビッグチャンス", homeKey: "homeBigChanceStat", awayKey: "awayBigChanceStat" },
  { label: "コーナーキック", homeKey: "homeCornerStat", awayKey: "awayCornerStat" },
  { label: "PA内シュート", homeKey: "homeBoxShootInStat", awayKey: "awayBoxShootInStat" },
  { label: "PA外シュート", homeKey: "homeBoxShootOutStat", awayKey: "awayBoxShootOutStat" },
  { label: "ポスト直撃", homeKey: "homeGoalPostStat", awayKey: "awayGoalPostStat" },
  { label: "ヘディング得点", homeKey: "homeGoalHeadStat", awayKey: "awayGoalHeadStat" },
  { label: "GKセーブ", homeKey: "homeKeeperSaveStat", awayKey: "awayKeeperSaveStat" },
  { label: "FK", homeKey: "homeFreeKickStat", awayKey: "awayFreeKickStat" },
  { label: "オフサイド", homeKey: "homeOffsideStat", awayKey: "awayOffsideStat" },
  { label: "ファウル", homeKey: "homeFoulStat", awayKey: "awayFoulStat" },
  { label: "黄カード", homeKey: "homeYellowCardStat", awayKey: "awayYellowCardStat" },
  { label: "赤カード", homeKey: "homeRedCardStat", awayKey: "awayRedCardStat" },
  { label: "スローイン", homeKey: "homeSlowInStat", awayKey: "awaySlowInStat" },
  { label: "PAタッチ", homeKey: "homeBoxTouchStat", awayKey: "awayBoxTouchStat" },
  { label: "パス本数", homeKey: "homePassCountStat", awayKey: "awayPassCountStat" },
  { label: "ロングパス本数", homeKey: "homeLongPassCountStat", awayKey: "awayLongPassCountStat" },
  { label: "敵陣3分の1パス", homeKey: "homeFinalThirdPassCountStat", awayKey: "awayFinalThirdPassCountStat" },
  { label: "クロス", homeKey: "homeCrossCountStat", awayKey: "awayCrossCountStat" },
  { label: "タックル", homeKey: "homeTackleCountStat", awayKey: "awayTackleCountStat" },
  { label: "クリア", homeKey: "homeClearCountStat", awayKey: "awayClearCountStat" },
  { label: "デュエル", homeKey: "homeDuelCountStat", awayKey: "awayDuelCountStat" },
  { label: "インターセプト", homeKey: "homeInterceptCountStat", awayKey: "awayInterceptCountStat" },
];

// --- LiveMatches API (/v1/api/live-matches/{teamEnglish}/{teamHash}) ---
type LiveMatchDTO = {
  seq: number;
  dataCategory: string;
  times: string;
  homeTeamName: string;
  awayTeamName: string;

  homeScore: number | null;
  awayScore: number | null;

  homeExp: number | null;
  awayExp: number | null;

  homeShootIn: number | null;
  awayShootIn: number | null;

  recordTime: string;
  link: string | null;

  homeSlug: string | null;
  awaySlug: string | null;
};

type MultiLiveMatchesResponse = {
  matches: LiveMatchDTO[];
  count: number;
};

type LiveBannerModel = {
  homeName: string;
  awayName: string;
  scoreHome: number;
  scoreAway: number;

  minuteText: string;
  minuteValue: number | null;

  updatedAtISO: string;

  sotHome?: number;
  sotAway?: number;
  xgHome?: number;
  xgAway?: number;

  link?: string | null;
};

// --- Future API (/v1/api/future/{teamEnglish}/{teamHash}) ---
type FuturesResponseDTO = {
  id?: string | null;
  seq: number;
  gameTeamCategory: string;
  futureTime: string | null;
  homeTeam: string;
  awayTeam: string;
  link: string | null;
  roundNo: number | null;
  status: string;
};
type FutureMatchesEnvelope = { matches: FuturesResponseDTO[] };

// --- Overview summary (/v1/api/overview/{teamEnglish}/{teamHash}/stats/summary) ---
type OverviewSummaryDTO = {
  year: number;

  gamesAll: number;
  pointsPerGameAll: number | null;
  goalDiffAll: number | null;
  avgGoalsForAll: number | null;
  avgGoalsAgainstAll: number | null;

  gamesHome?: number;
  gamesAway?: number;
};

type MatchRow = {
  id: string;
  dateISO: string;
  opponent: string;
  isHome: boolean;
  gf: number;
  ga: number;
  status: MatchStatus;
  minute?: number;
};

// 順位DTO
type TeamStandingsRowDTO = {
  country: string;
  league: string;
  seasonYear: string;
  match: number;
  rank: number;
  team: string;
  win: number | null;
  lose: number | null;
  draw: number | null;
  winningPoints: number | null;
  // trendにも currentTeam が付いてくる場合があるので optional で受ける
  currentTeam?: boolean;
};

type TeamStandingsRowViewDTO = {
  rank: number;
  match: number;
  team: string;
  win: number | null;
  lose: number | null;
  draw: number | null;
  winningPoints: number | null;
  currentTeam: boolean;
};

type TeamsStandingsResponse = {
  seasonYear: string;
  latestMatch: number;
  standings: TeamStandingsRowViewDTO[];
  trend: TeamStandingsRowDTO[];
};

type Kpi = { label: string; value: string; delta?: string; hint?: string };
type CorrelationItem = { feature: string; r: number };

// =====================
// utils
// =====================
function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function normalizeName(s?: string | null) {
  return (s ?? "").replace(/\s+/g, " ").trim();
}

function fmtJstDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtJstDateOnly(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("ja-JP", { month: "2-digit", day: "2-digit" });
}

function rColor(r: number) {
  const a = Math.abs(r);
  if (a < 0.15) return "bg-slate-100 text-slate-700 ring-slate-200";
  if (r > 0) {
    if (a < 0.35) return "bg-emerald-50 text-emerald-800 ring-emerald-200";
    if (a < 0.6) return "bg-emerald-100 text-emerald-900 ring-emerald-300";
    return "bg-emerald-200 text-emerald-950 ring-emerald-400";
  } else {
    if (a < 0.35) return "bg-rose-50 text-rose-800 ring-rose-200";
    if (a < 0.6) return "bg-rose-100 text-rose-900 ring-rose-300";
    return "bg-rose-200 text-rose-950 ring-rose-400";
  }
}

function toNumOrNull(v?: string | null): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function fmtNum(v?: string | null, digits = 2) {
  const n = toNumOrNull(v);
  if (n == null) return "—";
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(digits).replace(/\.?0+$/, "");
}

function fetchTextSnippet(text: string, len = 400) {
  return text ? text.slice(0, len) : "";
}

function makeCrestText(name?: string, english?: string) {
  const base = (english || name || "").trim();
  if (!base) return "TEAM";

  const ascii = base.replace(/[^A-Za-z0-9 ]/g, " ").trim();
  if (ascii) {
    const parts = ascii.split(/\s+/).filter(Boolean);
    const initials = parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("");
    return (initials || ascii.slice(0, 3).toUpperCase()).slice(0, 3);
  }
  return base.slice(0, 2);
}

// --- LIVE time parsing ---
function parseMinuteValue(times?: string): number | null {
  if (!times) return null;

  const m1 = times.match(/^(\d{1,3})(?::\d{2})/);
  if (m1) return Number(m1[1]);

  const m2 = times.match(/^(\d{1,3})\+(\d{1,2})/);
  if (m2) return Number(m2[1]) + Number(m2[2]);

  const m3 = times.match(/^(\d{1,3})\s*['’]/);
  if (m3) return Number(m3[1]);

  if (times.includes("ハーフ")) return 45;

  return null;
}

function toMinuteText(times?: string): string {
  const v = parseMinuteValue(times);
  if (v != null) return `${v}’`;
  return times ? String(times) : "";
}

/** JSON専用フェッチ */
async function fetchJsonStrict<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const ct = res.headers.get("content-type") ?? "";
  const text = await res.text().catch(() => "");

  if (!res.ok) {
    throw new Error([`HTTP ${res.status} ${res.statusText}`, `url: ${res.url}`, `content-type: ${ct}`, text ? `body(snippet):\n${text.slice(0, 400)}` : ""].filter(Boolean).join("\n"));
  }

  if (!ct.includes("application/json")) {
    const hint = text.includes("<!DOCTYPE") || text.includes("<html") ? "HTMLが返っています（proxy未設定 or 認証リダイレクトの可能性）" : "JSON以外が返っています";
    throw new Error([`Expected JSON but got: ${ct}`, `hint: ${hint}`, `url: ${res.url}`, text ? `body(snippet):\n${text.slice(0, 400)}` : ""].filter(Boolean).join("\n"));
  }

  return JSON.parse(text) as T;
}

// =====================
// UI parts
// =====================
function MultiLineChart(props: {
  series: Array<{
    name: string;
    points: Array<{ x: number; y: number | null }>;
    highlight?: boolean;
  }>;
  height?: number;
  xLabel?: string; // 追加
  yLabel?: string; // 追加
}) {
  const h = props.height ?? 260;
  const w = 740;

  // 余白（軸ラベル/目盛りのため）
  const m = { top: 16, right: 18, bottom: 42, left: 56 };

  const allPoints = props.series.flatMap((s) => s.points);
  const valid = allPoints.filter((p) => p.y != null) as Array<{ x: number; y: number }>;

  if (props.series.length === 0 || valid.length === 0) {
    return <div className="grid h-[260px] place-items-center rounded-xl bg-slate-50 text-xs text-slate-500">no data</div>;
  }

  const xs = valid.map((p) => p.x);
  const ys = valid.map((p) => p.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const plotW = w - m.left - m.right;
  const plotH = h - m.top - m.bottom;

  const denomX = Math.max(1e-9, maxX - minX);
  const denomY = Math.max(1e-9, maxY - minY);

  const X = (x: number) => m.left + ((x - minX) / denomX) * plotW;

  // 順位: 1が上に来るように（minY=1 を上へ）
  const Y = (y: number) => m.top + ((y - minY) / denomY) * plotH;

  // ---- 色（凡例にも使う）：チームごとに色を振る ----
  const palette = [
    "#1d4ed8",
    "#0f766e",
    "#9333ea",
    "#b45309",
    "#be123c",
    "#047857",
    "#6d28d9",
    "#0369a1",
    "#a21caf",
    "#b91c1c",
    "#2563eb",
    "#059669",
    "#7c3aed",
    "#ca8a04",
    "#e11d48",
    "#0891b2",
    "#16a34a",
    "#f97316",
    "#64748b",
    "#334155",
  ];

  const colorFor = (name: string, i: number, highlight?: boolean) => {
    if (highlight) return "rgb(79 70 229)"; // indigo
    return palette[i % palette.length];
  };

  // ---- 目盛り（tick） ----
  const xSpan = Math.max(1, maxX - minX);
  const xStep = Math.max(1, Math.ceil(xSpan / 8)); // だいたい8個くらいに間引く

  let yTicks = 5; // 5本くらい
  const yTickVals = Array.from({ length: yTicks }, (_, i) => {
    const t = yTicks === 1 ? 0 : i / (yTicks - 1);
    // minY..maxY を等分
    const v = minY + t * (maxY - minY);
    return Math.round(v); // 順位は整数なので丸め
  }).filter((v, idx, arr) => idx === 0 || v !== arr[idx - 1]);

  function buildPath(points: Array<{ x: number; y: number | null }>) {
    let d = "";
    let penDown = false;

    for (const p of points) {
      if (p.y == null) {
        penDown = false;
        continue;
      }
      const xx = X(p.x).toFixed(2);
      const yy = Y(p.y).toFixed(2);

      if (!penDown) {
        d += `M ${xx} ${yy} `;
        penDown = true;
      } else {
        d += `L ${xx} ${yy} `;
      }
    }
    return d.trim();
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      {/* ===== 軸（X/Y） ===== */}
      {/* Y軸 */}
      <line x1={m.left} x2={m.left} y1={m.top} y2={m.top + plotH} stroke="rgb(148 163 184)" />
      {/* X軸 */}
      <line x1={m.left} x2={m.left + plotW} y1={m.top + plotH} y2={m.top + plotH} stroke="rgb(148 163 184)" />

      {/* ===== グリッド & Y目盛り ===== */}
      {yTickVals.map((v) => {
        const yy = Y(v);
        return (
          <g key={`y-${v}`}>
            <line x1={m.left} x2={m.left + plotW} y1={yy} y2={yy} stroke="rgb(226 232 240)" />
            <text x={m.left - 8} y={yy + 4} textAnchor="end" fontSize="11" fill="rgb(100 116 139)">
              {v}
            </text>
          </g>
        );
      })}

      {/* ===== X目盛り ===== */}
      {Array.from({ length: Math.floor((maxX - minX) / xStep) + 1 }, (_, i) => minX + i * xStep).map((v) => {
        const xx = X(v);
        return (
          <g key={`x-${v}`}>
            <line x1={xx} x2={xx} y1={m.top + plotH} y2={m.top + plotH + 6} stroke="rgb(203 213 225)" />
            <text x={xx} y={m.top + plotH + 20} textAnchor="middle" fontSize="11" fill="rgb(100 116 139)">
              {v}
            </text>
          </g>
        );
      })}

      {/* ===== 軸ラベル ===== */}
      <text x={m.left + plotW / 2} y={h - 10} textAnchor="middle" fontSize="12" fill="rgb(51 65 85)">
        {props.xLabel ?? "節"}
      </text>

      {/* Yラベル（縦書き風：回転） */}
      <text x={14} y={m.top + plotH / 2} textAnchor="middle" fontSize="12" fill="rgb(51 65 85)" transform={`rotate(-90 14 ${m.top + plotH / 2})`}>
        {props.yLabel ?? "順位（1が上位）"}
      </text>

      {/* ===== 線 + 点 ===== */}
      {props.series.map((s, idx) => {
        const d = buildPath(s.points);
        const stroke = colorFor(s.name, idx, s.highlight);
        const strokeWidth = s.highlight ? 3.4 : 1.8;
        const opacity = s.highlight ? 1.0 : 0.55;

        const validPoints = s.points.filter((p) => p.y != null) as Array<{ x: number; y: number }>;

        return (
          <g key={s.name}>
            {d && <path d={d} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" opacity={opacity} />}

            {/* 点（1点しかなくても見える） */}
            {validPoints.map((p, i2) => (
              <circle key={i2} cx={X(p.x)} cy={Y(p.y)} r={s.highlight ? 4.4 : 3.0} fill="white" stroke={stroke} strokeWidth={s.highlight ? 2.2 : 1.4} opacity={s.highlight ? 1.0 : 0.75} />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

function Badge(props: { children: React.ReactNode; tone?: Tone }) {
  const tone = props.tone ?? "slate";
  const map: Record<Tone, string> = {
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
    indigo: "bg-indigo-50 text-indigo-800 ring-indigo-200",
    emerald: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    amber: "bg-amber-50 text-amber-900 ring-amber-200",
    rose: "bg-rose-50 text-rose-800 ring-rose-200",
  };
  return <span className={cx("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1", map[tone])}>{props.children}</span>;
}

function Card(props: { title?: React.ReactNode; right?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cx("rounded-2xl border border-white/10 bg-white/70 backdrop-blur shadow-sm", props.className)}>
      {(props.title || props.right) && (
        <header className="flex items-center justify-between gap-3 border-b border-slate-200/60 px-5 py-4">
          <div className="min-w-0">{props.title && <div className="truncate text-sm font-semibold text-slate-900">{props.title}</div>}</div>
          {props.right && <div className="shrink-0">{props.right}</div>}
        </header>
      )}
      <div className="px-5 py-4">{props.children}</div>
    </section>
  );
}

function TabButton(props: { active: boolean; onClick: () => void; children: React.ReactNode; badge?: React.ReactNode }) {
  return (
    <button
      onClick={props.onClick}
      className={cx(
        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
        props.active ? "bg-slate-900 text-white shadow" : "bg-white/70 text-slate-700 ring-1 ring-slate-200 hover:bg-white hover:text-slate-900",
      )}
      type="button"
    >
      {props.children}
      {props.badge}
    </button>
  );
}

function MiniLineChart(props: { points: Array<{ x: number; y: number }>; height?: number }) {
  const h = props.height ?? 90;
  const w = 520;
  const pad = 12;

  if (!props.points || props.points.length === 0) {
    return <div className="grid h-[90px] place-items-center rounded-xl bg-slate-50 text-xs text-slate-500">no data</div>;
  }

  const first = props.points[0];
  const last = props.points[props.points.length - 1];

  const xs = props.points.map((p) => p.x);
  const ys = props.points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const X = (x: number) => pad + ((x - minX) / Math.max(1e-9, maxX - minX)) * (w - pad * 2);
  const Y = (y: number) => pad + (1 - (y - minY) / Math.max(1e-9, maxY - minY)) * (h - pad * 2);

  const d = props.points.map((p, i) => `${i === 0 ? "M" : "L"} ${X(p.x).toFixed(2)} ${Y(p.y).toFixed(2)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      <defs>
        <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgb(99 102 241)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="rgb(99 102 241)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1={pad} x2={w - pad} y1={pad + ((h - pad * 2) * i) / 3} y2={pad + ((h - pad * 2) * i) / 3} stroke="rgb(226 232 240)" />
      ))}

      <path d={`${d} L ${X(last.x).toFixed(2)} ${(h - pad).toFixed(2)} L ${X(first.x).toFixed(2)} ${(h - pad).toFixed(2)} Z`} fill="url(#g)" />
      <path d={d} fill="none" stroke="rgb(79 70 229)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={X(last.x)} cy={Y(last.y)} r="4.8" fill="white" stroke="rgb(79 70 229)" strokeWidth="2.5" />
    </svg>
  );
}

function BarsByMatch(props: { rows: Array<{ label: string; gf: number; ga: number; status: MatchStatus; opponent?: string; isHome?: boolean }> }) {
  const max = Math.max(1, ...props.rows.map((r) => Math.max(r.gf, r.ga)));
  return (
    <div className="space-y-2">
      {props.rows.map((r, idx) => (
        <div key={idx} className="grid grid-cols-[160px_1fr] items-center gap-3">
          {/* ← 140px → 160px に広げて2行に */}
          <div className="min-w-0 text-xs text-slate-600">
            <div className="truncate font-medium">
              {r.label}
              {r.status === "LIVE" && <Badge tone="rose">LIVE</Badge>}
              {r.status === "SCHEDULED" && <Badge tone="amber">NEXT</Badge>}
            </div>
            {r.opponent && (
              <div className="truncate text-slate-400">
                <span className="mr-1 font-semibold text-slate-500">{r.isHome ? "H" : "A"}</span>
                vs {r.opponent}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-indigo-500/80" style={{ width: `${(r.gf / max) * 100}%` }} />
            </div>
            <div className="w-10 text-right text-xs font-semibold text-slate-900">{r.gf}</div>

            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-rose-500/75" style={{ width: `${(r.ga / max) * 100}%` }} />
            </div>
            <div className="w-10 text-right text-xs font-semibold text-slate-900">{r.ga}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatDetailCard(props: { title: string; stat: StatSummaryDTO | null | undefined; tone?: Tone }) {
  const tone = props.tone ?? "slate";
  const stat = props.stat;

  const rows: Array<{
    label: string;
    value: string;
    count: string;
  }> = [
    { label: "min", value: fmtNum(stat?.min), count: stat?.minCount ?? "" },
    { label: "max", value: fmtNum(stat?.max), count: stat?.maxCount ?? "" },
    { label: "avg", value: fmtNum(stat?.avg), count: stat?.avgCount ?? "" },
    { label: "stddev", value: fmtNum(stat?.stddev), count: stat?.stddevCount ?? "" },
    { label: "minTime", value: fmtNum(stat?.minTime), count: stat?.minTimeCount ?? "" },
    { label: "maxTime", value: fmtNum(stat?.maxTime), count: stat?.maxTimeCount ?? "" },
    { label: "skewness", value: fmtNum(stat?.skewness), count: stat?.skewnessCount ?? "" },
    { label: "kurtosis", value: fmtNum(stat?.kurtosis), count: stat?.kurtosisCount ?? "" },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="text-sm font-black text-slate-900">{props.title}</div>
        <Badge tone={tone}>detail</Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {rows.map((r) => (
          <div key={r.label} className="rounded-xl bg-slate-50 px-3 py-2">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{r.label}</div>
            <div className="mt-1 text-sm font-black text-slate-900">{r.value}</div>
            <div className="mt-1 text-[11px] text-slate-500">count: {r.count || "—"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =====================
// page
// =====================
export default function TeamDetailMockPage() {
  const { teamEnglish, teamHash } = useParams<{ teamEnglish?: string; teamHash?: string }>();

  // ====== API base ======
  const API_V1 = "/v1/api";

  // =========================
  // STANDINGS API (/api/standings/.../front/border)
  // =========================
  const [standingsApi, setStandingsApi] = useState<TeamsStandingsResponse | null>(null);
  const [standingsLoading, setStandingsLoading] = useState(false);
  const [standingsError, setStandingsError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamEnglish || !teamHash) return;
    let cancelled = false;

    (async () => {
      setStandingsLoading(true);
      setStandingsError(null);

      // まず /api を試し、ダメなら /v1/api を試す（環境差吸収）
      const paths = [`${API_V1}/standings/${encodeURIComponent(teamEnglish)}/${encodeURIComponent(teamHash)}/front/border`];

      try {
        let lastErr: any = null;

        for (const p of paths) {
          try {
            const data = await fetchJsonStrict<TeamsStandingsResponse>(p, { method: "GET" });
            if (!cancelled) setStandingsApi(data);
            lastErr = null;
            break;
          } catch (e: any) {
            lastErr = e;
          }
        }

        if (lastErr) throw lastErr;
      } catch (e: any) {
        if (!cancelled) {
          setStandingsError(String(e?.message ?? e));
          setStandingsApi(null);
        }
      } finally {
        if (!cancelled) setStandingsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [teamEnglish, teamHash, API_V1]);

  // =========================
  // TEAM API
  // =========================
  const [teamApi, setTeamApi] = useState<TeamDetailResponse | null>(null);
  const [teamApiLoading, setTeamApiLoading] = useState(false);
  const [teamApiError, setTeamApiError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamEnglish || !teamHash) return;
    let cancelled = false;

    (async () => {
      setTeamApiLoading(true);
      setTeamApiError(null);
      try {
        const url = `${API_V1}/leagues/${encodeURIComponent(teamEnglish)}/${encodeURIComponent(teamHash)}/teamDetail`;
        const data = await fetchJsonStrict<TeamDetailResponse>(url, { method: "GET" });
        if (!cancelled) setTeamApi(data);
      } catch (e: any) {
        if (!cancelled) setTeamApiError(String(e?.message ?? e));
      } finally {
        if (!cancelled) setTeamApiLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [teamEnglish, teamHash]);

  // =========================
  // TEAM (UI)
  // =========================
  const TEAM: TeamMeta = useMemo(() => {
    const fallback: TeamMeta = {
      id: `${teamEnglish ?? "team"}_${teamHash ?? "hash"}`,
      name: teamApi?.name ?? teamEnglish ?? "TEAM",
      country: teamApi?.country ?? "JP",
      league: teamApi?.league ?? "J1",
      season: "2026",
      crestText: makeCrestText(teamApi?.name, teamApi?.english),
    };
    return fallback;
  }, [teamApi, teamEnglish, teamHash]);

  // =========================
  // standings: derived（TEAM確定後に作る）
  // =========================
  // 表示中チーム名（trend照合用）
  const currentTeamNameForStandings = useMemo(() => {
    return normalizeName(teamApi?.name ?? TEAM.name);
  }, [teamApi?.name, TEAM.name]);

  const currentTeamNameFromStandings = useMemo(() => {
    const s = standingsApi?.standings?.find((r) => r.currentTeam)?.team ?? "";
    return normalizeName(s);
  }, [standingsApi?.standings]);

  const currentTeamKey = useMemo(() => {
    const s = standingsApi?.standings?.find((r) => r.currentTeam)?.team ?? "";
    return normalizeName(s) || normalizeName(teamApi?.name ?? TEAM.name);
  }, [standingsApi?.standings, teamApi?.name, TEAM.name]);

  // リーグ最大節（横軸の上限）
  const leagueMaxMatch = useMemo(() => {
    return Number(standingsApi?.latestMatch ?? 0) || 0;
  }, [standingsApi?.latestMatch]);

  const allTeamsRankSeries = useMemo(() => {
    const rows = standingsApi?.trend ?? [];
    if (!rows.length || leagueMaxMatch <= 0) return [];

    // team一覧（trendに出てきたチーム）
    const teams = Array.from(new Set(rows.map((r) => normalizeName(r.team)))).filter(Boolean);

    // team -> (match -> rank)
    const index = new Map<string, Map<number, number>>();
    for (const r of rows) {
      const t = normalizeName(r.team);
      const m = Number(r.match ?? 0);
      const rk = Number(r.rank ?? 0);
      if (!t || !m || !rk) continue;
      if (!index.has(t)) index.set(t, new Map());
      index.get(t)!.set(m, rk);
    }

    // x=1..leagueMaxMatch を必ず作り、欠損は null
    const xs = Array.from({ length: leagueMaxMatch }, (_, i) => i + 1);

    return teams
      .sort((a, b) => a.localeCompare(b, "ja"))
      .map((team) => {
        const idx = index.get(team);
        const points = xs.map((x) => ({ x, y: idx?.get(x) ?? null })); // 欠損はnull→線が切れる
        return { name: team, points, highlight: team === currentTeamKey };
      });
  }, [standingsApi?.trend, leagueMaxMatch, currentTeamKey]);

  // 表示中チームが持っている「最大の節」= 最新順位表の節
  const teamLatestMatch = useMemo(() => {
    const rows = standingsApi?.trend ?? [];
    const nm = currentTeamNameForStandings;
    let mx = 0;

    for (const r of rows) {
      if (normalizeName(r.team) !== nm) continue;
      mx = Math.max(mx, Number(r.match ?? 0));
    }
    return mx; // 0 の場合はデータなし
  }, [standingsApi?.trend, currentTeamNameForStandings]);

  // (B) latestMatch（APIが返す値が基本。無ければtrendから算出）
  const latestMatchFromTrend = useMemo(() => {
    const rows = standingsApi?.trend ?? [];
    if (!rows.length) return 0;
    return rows.reduce((mx, r) => Math.max(mx, Number(r.match ?? 0)), 0);
  }, [standingsApi?.trend]);

  const latestMatchSafe = useMemo(() => {
    return Number(standingsApi?.latestMatch ?? 0) || latestMatchFromTrend || 0;
  }, [standingsApi?.latestMatch, latestMatchFromTrend]);

  // (C) trend から「表示中チーム」だけ抽出（チーム個別のミニグラフ用：任意）
  const myTrend = useMemo(() => {
    const rows = standingsApi?.trend ?? [];
    const nm = currentTeamNameForStandings;

    return rows
      .filter((r) => normalizeName(r.team) === nm)
      .slice()
      .sort((a, b) => (a.match ?? 0) - (b.match ?? 0));
  }, [standingsApi?.trend, currentTeamNameForStandings]);

  // 表示中チーム：match -> rank
  const myRankIndex = useMemo(() => {
    const rows = standingsApi?.trend ?? [];
    const key = currentTeamKey;
    const map = new Map<number, number>();

    for (const r of rows) {
      if (normalizeName(r.team) !== key) continue;
      const m = Number(r.match ?? 0);
      const rk = Number(r.rank ?? 0);
      if (!m || !rk) continue;
      map.set(m, rk);
    }
    return map;
  }, [standingsApi?.trend, currentTeamKey]);

  const myRankSeries = useMemo(() => {
    if (!leagueMaxMatch) return [];

    const points = Array.from({ length: leagueMaxMatch }, (_, i) => {
      const x = i + 1;
      const y = myRankIndex.get(x) ?? null; // 欠損は null（線を切る）
      return { x, y };
    });

    return [{ name: currentTeamKey || "team", points, highlight: true }];
  }, [leagueMaxMatch, myRankIndex, currentTeamKey]);

  const pointsTrendPoints = useMemo(() => {
    return myTrend.map((r) => ({ x: r.match, y: Number(r.winningPoints ?? 0) }));
  }, [myTrend]);

  // 順位は “小さいほど上位” なので、MiniLineChartで上向きにしたいなら反転（任意）
  const rankTrendPoints = useMemo(() => {
    return myTrend.map((r) => ({ x: r.match, y: -Number(r.rank ?? 0) }));
  }, [myTrend]);

  // (D) 全チーム順位推移（リーグ全体）
  //  1) 全チーム集合
  const allTeamsInTrend = useMemo(() => {
    const rows = standingsApi?.trend ?? [];
    const set = new Set<string>();
    for (const r of rows) set.add(normalizeName(r.team));
    return Array.from(set)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "ja"));
  }, [standingsApi?.trend]);

  //  2) team -> (match -> rank) インデックス
  const rankIndexByTeam = useMemo(() => {
    const rows = standingsApi?.trend ?? [];
    const map = new Map<string, Map<number, number>>();

    for (const r of rows) {
      const team = normalizeName(r.team);
      const m = Number(r.match ?? 0);
      const rk = Number(r.rank ?? 0);
      if (!team || !m || !rk) continue;

      if (!map.has(team)) map.set(team, new Map());
      map.get(team)!.set(m, rk);
    }
    return map;
  }, [standingsApi?.trend]);

  const standingsForTable = useMemo((): TeamStandingsRowViewDTO[] => {
    const rows = standingsApi?.trend ?? [];
    if (!rows.length || !teamLatestMatch) return [];

    return rows
      .filter((r) => Number(r.match ?? 0) === teamLatestMatch)
      .slice()
      .sort((a, b) => Number(a.rank ?? 9999) - Number(b.rank ?? 9999))
      .map((r) => ({
        rank: Number(r.rank ?? 0),
        match: r.match,
        team: r.team,
        win: r.win ?? null,
        lose: r.lose ?? null,
        draw: r.draw ?? null,
        winningPoints: r.winningPoints ?? null,
        currentTeam: normalizeName(r.team) === currentTeamNameForStandings,
      }));
  }, [standingsApi?.trend, teamLatestMatch, currentTeamNameForStandings]);

  // =========================
  // OVERVIEW SUMMARY API
  // =========================
  const [summaryRows, setSummaryRows] = useState<OverviewSummaryDTO[] | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamEnglish || !teamHash) return;
    let cancelled = false;

    (async () => {
      setSummaryLoading(true);
      setSummaryError(null);
      try {
        const url = `${API_V1}/overview/${encodeURIComponent(teamEnglish)}/${encodeURIComponent(teamHash)}/stats/summary`;
        const rows = await fetchJsonStrict<OverviewSummaryDTO[]>(url, { method: "GET" });
        if (!cancelled) setSummaryRows(rows);
      } catch (e: any) {
        if (!cancelled) setSummaryError(String(e?.message ?? e));
      } finally {
        if (!cancelled) setSummaryLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [teamEnglish, teamHash]);

  const selectedYear = useMemo(() => {
    const ys = (summaryRows ?? []).map((r) => r.year);
    return ys.length ? Math.max(...ys) : null;
  }, [summaryRows]);

  const summary = useMemo(() => {
    if (!summaryRows || selectedYear == null) return null;
    return summaryRows.find((r) => r.year === selectedYear) ?? null;
  }, [summaryRows, selectedYear]);

  // =========================
  // TEAM MEMBER API
  // =========================
  const [teamMembers, setTeamMembers] = useState<TeamMemberDTO[] | null>(null);
  const [teamMembersLoading, setTeamMembersLoading] = useState(false);
  const [teamMembersError, setTeamMembersError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamEnglish || !teamHash) return;
    let cancelled = false;

    (async () => {
      setTeamMembersLoading(true);
      setTeamMembersError(null);

      // 候補URL：まず /v1/api を試し、404等なら /api を試す
      const urls = [`${API_V1}/team-member-master/${encodeURIComponent(teamEnglish)}/${encodeURIComponent(teamHash)}`];

      try {
        let lastErr: any = null;

        for (const url of urls) {
          try {
            const data = await fetchJsonStrict<TeamMemberDTO[]>(url, { method: "GET" });
            if (!cancelled) setTeamMembers(data);
            lastErr = null;
            break;
          } catch (e: any) {
            lastErr = e;
            // 次のURLへ
          }
        }

        if (lastErr) throw lastErr;
      } catch (e: any) {
        if (!cancelled) {
          setTeamMembersError(String(e?.message ?? e));
          setTeamMembers(null);
        }
      } finally {
        if (!cancelled) setTeamMembersLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [teamEnglish, teamHash]);

  // =========================
  // LIVE API
  // =========================
  const [liveApi, setLiveApi] = useState<MultiLiveMatchesResponse | null>(null);
  const [liveApiLoading, setLiveApiLoading] = useState(false);
  const [liveApiError, setLiveApiError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamEnglish || !teamHash) return;
    let cancelled = false;

    (async () => {
      setLiveApiLoading(true);
      setLiveApiError(null);
      try {
        const url = `${API_V1}/live-matches/${encodeURIComponent(teamEnglish)}/${encodeURIComponent(teamHash)}`;
        const data = await fetchJsonStrict<MultiLiveMatchesResponse>(url, { method: "GET" });
        if (!cancelled) setLiveApi(data);
      } catch (e: any) {
        if (!cancelled) {
          setLiveApiError(String(e?.message ?? e));
          setLiveApi(null);
        }
      } finally {
        if (!cancelled) setLiveApiLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [teamEnglish, teamHash]);

  const visibleTeamMembers = useMemo(() => {
    const xs = teamMembers ?? [];

    // delFlg = "1" を除外したい場合（要件に合わせて）
    const filtered = xs.filter((m) => (m.delFlg ?? "0") !== "1");

    // 背番号でソート（数値っぽいもの優先）
    const toNum = (s: string) => {
      const n = Number(String(s ?? "").trim());
      return Number.isFinite(n) ? n : 9999;
    };

    return [...filtered].sort((a, b) => toNum(a.jersey) - toNum(b.jersey));
  }, [teamMembers]);

  const liveBanner: LiveBannerModel | null = useMemo(() => {
    if (!teamEnglish) return null;

    const liveMatches = liveApi?.matches ?? [];
    if (liveMatches.length === 0) return null;

    let hit = liveMatches.find((r) => r.homeSlug === teamEnglish || r.awaySlug === teamEnglish) ?? null;

    if (!hit && teamApi?.name) {
      const nm = teamApi.name;
      hit = liveMatches.find((r) => r.homeTeamName === nm || r.awayTeamName === nm) ?? null;
    }

    if (!hit) return null;

    return {
      homeName: hit.homeTeamName,
      awayName: hit.awayTeamName,
      scoreHome: Number(hit.homeScore ?? 0),
      scoreAway: Number(hit.awayScore ?? 0),
      minuteText: toMinuteText(hit.times),
      minuteValue: parseMinuteValue(hit.times),
      updatedAtISO: hit.recordTime ?? new Date().toISOString(),
      sotHome: hit.homeShootIn ?? undefined,
      sotAway: hit.awayShootIn ?? undefined,
      xgHome: hit.homeExp ?? undefined,
      xgAway: hit.awayExp ?? undefined,
      link: hit.link,
    };
  }, [liveApi, teamEnglish, teamApi]);

  // =========================
  // FUTURE API
  // =========================
  const [futureApi, setFutureApi] = useState<FutureMatchesEnvelope | null>(null);
  const [futureApiLoading, setFutureApiLoading] = useState(false);
  const [futureApiError, setFutureApiError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamEnglish || !teamHash) return;
    let cancelled = false;

    (async () => {
      setFutureApiLoading(true);
      setFutureApiError(null);
      try {
        const url = `${API_V1}/future/${encodeURIComponent(teamEnglish)}/${encodeURIComponent(teamHash)}`;
        const data = await fetchJsonStrict<FutureMatchesEnvelope>(url, { method: "GET" });
        if (!cancelled) setFutureApi(data);
      } catch (e: any) {
        if (!cancelled) {
          setFutureApiError(String(e?.message ?? e));
          setFutureApi(null);
        }
      } finally {
        if (!cancelled) setFutureApiLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [teamEnglish, teamHash]);

  const nextFuture = useMemo(() => {
    const rows = futureApi?.matches ?? [];
    const scheduled = rows.filter((m) => (m.status ?? "").toUpperCase().includes("SCHED")).filter((m) => !!m.futureTime);

    if (!scheduled.length) return null;

    return [...scheduled].sort((a, b) => new Date(a.futureTime!).getTime() - new Date(b.futureTime!).getTime())[0];
  }, [futureApi]);

  const nextMatchFromFuture: MatchRow | null = useMemo(() => {
    if (!nextFuture || !nextFuture.futureTime) return null;

    const teamName = normalizeName(TEAM.name);
    const isHome = normalizeName(nextFuture.homeTeam) === teamName;

    return {
      id: `next_${nextFuture.seq}`,
      dateISO: nextFuture.futureTime,
      opponent: isHome ? nextFuture.awayTeam : nextFuture.homeTeam,
      isHome,
      gf: 0,
      ga: 0,
      status: "SCHEDULED",
    };
  }, [nextFuture, TEAM.name]);

  // =========================
  // SCORED LOST API
  // =========================
  const [scoredLostApi, setScoredLostApi] = useState<ScoredLostEnvelope | null>(null);
  const [scoredLostLoading, setScoredLostLoading] = useState(false);
  const [scoredLostError, setScoredLostError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamEnglish || !teamHash) return;
    let cancelled = false;

    (async () => {
      setScoredLostLoading(true);
      setScoredLostError(null);
      try {
        const url = `${API_V1}/scoredLost/${encodeURIComponent(teamEnglish)}/${encodeURIComponent(teamHash)}`;
        const data = await fetchJsonStrict<ScoredLostEnvelope>(url, { method: "GET" });
        if (!cancelled) setScoredLostApi(data);
      } catch (e: any) {
        if (!cancelled) {
          setScoredLostError(String(e?.message ?? e));
          setScoredLostApi(null);
        }
      } finally {
        if (!cancelled) setScoredLostLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [teamEnglish, teamHash, API_V1]);

  function labelRoundXAndDate(m: EachScoreLostDataResponseDTO) {
    const r = (m.roundNo ?? "").trim() || (m.dataCategory ?? "").match(/ラウンド\s*([0-9０-９]+)/)?.[1] || "?";
    const dt = m.recordTime ? fmtJstDateOnly(m.recordTime) : "--/--";
    return `${dt} ラウンド${r}`;
  }

  const scoredLostBarsRows = useMemo(() => {
    const ms = scoredLostApi?.matches ?? [];
    if (!ms.length) return [];

    const teamName = normalizeName(teamApi?.name ?? TEAM.name);

    return ms
      .filter((m) => (m.status ?? "FINISHED") === "FINISHED")
      .filter((m) => !!m.recordTime)
      .slice()
      .sort((a, b) => {
        const ra = parseInt(a.roundNo ?? "0", 10) || 0;
        const rb = parseInt(b.roundNo ?? "0", 10) || 0;
        return rb - ra;
      })
      .map((m) => {
        const isHome = normalizeName(m.homeTeamName) === teamName;
        const isAway = normalizeName(m.awayTeamName) === teamName;

        const hs = Number(m.homeScore ?? 0);
        const as_ = Number(m.awayScore ?? 0);

        const gf = isAway ? as_ : isHome ? hs : hs;
        const ga = isAway ? hs : isHome ? as_ : as_;

        // ✅ 対戦相手名を導出
        const opponent = isHome
          ? m.awayTeamName // 自チームがホームなら相手はアウェイ
          : isAway
            ? m.homeTeamName // 自チームがアウェイなら相手はホーム
            : m.awayTeamName; // どちらでも判定不能のときはとりあえずアウェイ側

        return {
          label: labelRoundXAndDate(m),
          gf,
          ga,
          status: "FINISHED" as MatchStatus,
          opponent: opponent ?? undefined,
          isHome,
        };
      });
  }, [scoredLostApi, teamApi?.name, TEAM.name]);

  // =========================
  // EACH TEAM SCORE API
  // =========================
  const [eachTeamScoreApi, setEachTeamScoreApi] = useState<EachTeamScoreResponseDTO[] | null>(null);
  const [eachTeamScoreLoading, setEachTeamScoreLoading] = useState(false);
  const [eachTeamScoreError, setEachTeamScoreError] = useState<string | null>(null);

  const [selectedEachTeamScoreIndex, setSelectedEachTeamScoreIndex] = useState(0);
  const [selectedEachTeamScoreStatIndex, setSelectedEachTeamScoreStatIndex] = useState(0);

  useEffect(() => {
    if (!teamEnglish || !teamHash) return;
    let cancelled = false;

    (async () => {
      setEachTeamScoreLoading(true);
      setEachTeamScoreError(null);

      try {
        const url = `${API_V1}/each-team-score/` + `${encodeURIComponent(teamEnglish)}/` + `${encodeURIComponent(teamHash)}`;

        const res = await fetch(url, {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        });

        if (res.status === 404) {
          if (!cancelled) setEachTeamScoreApi([]);
          return;
        }

        const ct = res.headers.get("content-type") ?? "";
        const text = await res.text().catch(() => "");

        if (!res.ok) {
          throw new Error([`HTTP ${res.status} ${res.statusText}`, `url: ${res.url}`, `content-type: ${ct}`, text ? `body(snippet):\n${fetchTextSnippet(text)}` : ""].filter(Boolean).join("\n"));
        }

        if (!ct.includes("application/json")) {
          throw new Error([`Expected JSON but got: ${ct}`, `url: ${res.url}`, text ? `body(snippet):\n${fetchTextSnippet(text)}` : ""].filter(Boolean).join("\n"));
        }

        const data = JSON.parse(text) as EachTeamScoreResponseDTO[];
        if (!cancelled) {
          setEachTeamScoreApi(Array.isArray(data) ? data : []);
        }
      } catch (e: any) {
        if (!cancelled) {
          setEachTeamScoreError(String(e?.message ?? e));
          setEachTeamScoreApi(null);
        }
      } finally {
        if (!cancelled) setEachTeamScoreLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [teamEnglish, teamHash]);

  useEffect(() => {
    setSelectedEachTeamScoreIndex(0);
    setSelectedEachTeamScoreStatIndex(0);
  }, [eachTeamScoreApi]);

  const eachTeamScoreRows = useMemo(() => {
    return eachTeamScoreApi ?? [];
  }, [eachTeamScoreApi]);

  const selectedEachTeamScore = useMemo(() => {
    if (!eachTeamScoreRows.length) return null;
    const idx = Math.min(selectedEachTeamScoreIndex, eachTeamScoreRows.length - 1);
    return eachTeamScoreRows[idx] ?? null;
  }, [eachTeamScoreRows, selectedEachTeamScoreIndex]);

  const selectedEachTeamScoreStatPair = useMemo(() => {
    if (!EACH_TEAM_SCORE_STAT_PAIRS.length) return null;
    const idx = Math.min(selectedEachTeamScoreStatIndex, EACH_TEAM_SCORE_STAT_PAIRS.length - 1);
    return EACH_TEAM_SCORE_STAT_PAIRS[idx] ?? null;
  }, [selectedEachTeamScoreStatIndex]);

  const selectedHomeStat = useMemo(() => {
    if (!selectedEachTeamScore || !selectedEachTeamScoreStatPair) return null;
    return selectedEachTeamScore[selectedEachTeamScoreStatPair.homeKey];
  }, [selectedEachTeamScore, selectedEachTeamScoreStatPair]);

  const selectedAwayStat = useMemo(() => {
    if (!selectedEachTeamScore || !selectedEachTeamScoreStatPair) return null;
    return selectedEachTeamScore[selectedEachTeamScoreStatPair.awayKey];
  }, [selectedEachTeamScore, selectedEachTeamScoreStatPair]);

  // =========================
  // HISTORY API
  // =========================
  const [historyApi, setHistoryApi] = useState<HistoryEnvelope | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamEnglish || !teamHash) return;
    let cancelled = false;

    (async () => {
      setHistoryLoading(true);
      setHistoryError(null);
      try {
        const url = `${API_V1}/history/${encodeURIComponent(teamEnglish)}/${encodeURIComponent(teamHash)}`;
        const data = await fetchJsonStrict<HistoryEnvelope>(url, { method: "GET" });
        if (!cancelled) setHistoryApi(data);
      } catch (e: any) {
        if (!cancelled) {
          setHistoryError(String(e?.message ?? e));
          setHistoryApi(null);
        }
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [teamEnglish, teamHash]);

  const finishedFromHistory = useMemo((): MatchRow[] => {
    const items = historyApi?.matches ?? [];
    const teamName = normalizeName(TEAM.name);

    const rows: MatchRow[] = items.map((m) => {
      const home = normalizeName(m.homeTeam);
      const away = normalizeName(m.awayTeam);

      const isHome = home === teamName ? true : away === teamName ? false : false;

      const hs = Number(m.homeScore ?? 0);
      const as = Number(m.awayScore ?? 0);

      return {
        id: `hist_${m.seq}`,
        dateISO: m.matchTime,
        opponent: isHome ? m.awayTeam : m.homeTeam,
        isHome,
        gf: isHome ? hs : as,
        ga: isHome ? as : hs,
        status: "FINISHED", // ← これが string にワイド化しにくくなる
      };
    });

    rows.sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime());
    return rows;
  }, [historyApi, TEAM.name]);

  // =========================
  // MatchRow composition
  // =========================
  const liveMatchRow: MatchRow | null = useMemo(() => {
    if (!liveBanner) return null;

    const teamName = normalizeName(TEAM.name);
    const isHome = normalizeName(liveBanner.homeName) === teamName;

    const hs = Number(liveBanner.scoreHome ?? 0);
    const as = Number(liveBanner.scoreAway ?? 0);

    return {
      id: `live_${liveBanner.updatedAtISO}`,
      dateISO: liveBanner.updatedAtISO,
      opponent: isHome ? liveBanner.awayName : liveBanner.homeName,
      isHome,
      gf: isHome ? hs : as,
      ga: isHome ? as : hs,
      status: "LIVE",
      minute: liveBanner.minuteValue ?? undefined,
    };
  }, [liveBanner, TEAM.name]);

  const MATCHES = useMemo((): MatchRow[] => {
    const out: MatchRow[] = [];
    if (nextMatchFromFuture) out.push(nextMatchFromFuture);
    if (liveMatchRow) out.push(liveMatchRow);
    out.push(...finishedFromHistory);
    return out;
  }, [nextMatchFromFuture, liveMatchRow, finishedFromHistory]);

  // =========================
  // KPI / Corr / UI state
  // =========================
  const KPIS: Kpi[] = useMemo(() => {
    if (!summary) {
      return [
        { label: "勝点/試合", value: "—", hint: "ALL（取得中）" },
        { label: "得失点差", value: "—", hint: "ALL（取得中）" },
        { label: "平均得点", value: "—", hint: "ALL（取得中）" },
        { label: "平均失点", value: "—", hint: "ALL（取得中）" },
      ];
    }

    const fmt = (v: number | null | undefined) => (v == null ? "—" : String(v));
    const fmtSigned = (v: number | null | undefined) => (v == null ? "—" : v > 0 ? `+${v}` : String(v));

    return [
      { label: "勝点/試合", value: fmt(summary.pointsPerGameAll), hint: `ALL / ${summary.year} / ${summary.gamesAll}試合` },
      { label: "得失点差", value: fmtSigned(summary.goalDiffAll), hint: `ALL / ${summary.year} 合計` },
      { label: "平均得点", value: fmt(summary.avgGoalsForAll), hint: `ALL / ${summary.year}` },
      { label: "平均失点", value: fmt(summary.avgGoalsAgainstAll), hint: `ALL / ${summary.year}` },
    ];
  }, [summary]);

  const CORR: CorrelationItem[] = useMemo(
    () => [
      { feature: "xG差", r: 0.71 },
      { feature: "被シュート", r: -0.52 },
      { feature: "枠内シュート", r: 0.44 },
      { feature: "支配率", r: 0.18 },
      { feature: "セットプレー失点", r: -0.36 },
      { feature: "カウンター成功", r: 0.33 },
    ],
    [],
  );

  const [tab, setTab] = useState<"stats" | "matches" | "players" | "standings">("stats");
  const [period, setPeriod] = useState<"5" | "10" | "season">("10");
  const [ha, setHa] = useState<"all" | "home" | "away">("all");

  const filteredMatches = useMemo(() => {
    let rows = [...MATCHES].filter((m) => m.status !== "SCHEDULED");
    if (ha !== "all") rows = rows.filter((m) => (ha === "home" ? m.isHome : !m.isHome));
    if (period === "5") rows = rows.slice(0, 5);
    if (period === "10") rows = rows.slice(0, 10);
    return rows;
  }, [MATCHES, period, ha]);

  const trendPoints = useMemo(() => {
    let pts = 0;
    const rows = [...filteredMatches].reverse();
    return rows.map((m, i) => {
      const win = m.gf > m.ga;
      const draw = m.gf === m.ga;
      pts += win ? 3 : draw ? 1 : 0;
      return { x: i, y: pts };
    });
  }, [filteredMatches]);

  const nextMatch = useMemo(() => MATCHES.find((m) => m.status === "SCHEDULED") ?? null, [MATCHES]);

  // =========================
  // RENDER
  // =========================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-900 text-white shadow">
                <div className="text-sm font-black tracking-wide">{TEAM.crestText ?? "TEAM"}</div>
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-black text-slate-900">{TEAM.name}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                  <Badge tone="indigo">
                    {TEAM.country} / {TEAM.league}
                  </Badge>
                  <Badge tone="slate">Season {TEAM.season}</Badge>
                  <span className="text-xs text-slate-500">{teamApiLoading ? "（Team API 読み込み中…）" : teamApi ? "（Team API）" : "（Mock）"}</span>
                  {teamEnglish && teamHash && (
                    <span className="text-xs text-slate-400">
                      / {teamEnglish} / {teamHash}
                    </span>
                  )}
                </div>

                {teamApi?.link && (
                  <div className="mt-1 text-xs text-slate-500">
                    link:{" "}
                    <a className="underline hover:text-slate-700" href={teamApi.link} target="_blank" rel="noreferrer">
                      {teamApi.link}
                    </a>
                  </div>
                )}

                {teamApiError && <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">{teamApiError}</pre>}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {liveApiLoading && <Badge tone="slate">LIVE取得中…</Badge>}
            {liveApiError && <Badge tone="rose">LIVE取得失敗</Badge>}
            {liveBanner ? <Badge tone="rose">LIVE更新中</Badge> : <Badge tone="slate">LIVEなし</Badge>}
          </div>
        </div>

        {/* LIVE banner：liveBanner があるときだけ表示 */}
        {liveBanner && (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge tone="rose">LIVE</Badge>
                  <div className="text-sm font-semibold text-rose-900">
                    {liveBanner.homeName} {liveBanner.scoreHome} - {liveBanner.scoreAway} {liveBanner.awayName}
                    {liveBanner.minuteText && <span className="ml-2 text-rose-700">({liveBanner.minuteText})</span>}
                  </div>
                </div>

                {(liveBanner.sotHome != null && liveBanner.sotAway != null) || (liveBanner.xgHome != null && liveBanner.xgAway != null) || !!liveBanner.link ? (
                  <div className="mt-1 text-xs text-rose-800">
                    {liveBanner.sotHome != null && liveBanner.sotAway != null && (
                      <span>
                        SOT {liveBanner.sotHome}-{liveBanner.sotAway}
                      </span>
                    )}
                    {liveBanner.xgHome != null && liveBanner.xgAway != null && (
                      <span>
                        {liveBanner.sotHome != null && liveBanner.sotAway != null ? " / " : ""}
                        xG {liveBanner.xgHome.toFixed(2)}-{liveBanner.xgAway.toFixed(2)}
                      </span>
                    )}
                    {liveBanner.link && (
                      <span>
                        {(liveBanner.sotHome != null && liveBanner.sotAway != null) || (liveBanner.xgHome != null && liveBanner.xgAway != null) ? " / " : ""}
                        <a className="underline hover:text-rose-900" href={liveBanner.link} target="_blank" rel="noreferrer">
                          details
                        </a>
                      </span>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="text-xs text-rose-700">updated: {fmtJstDate(liveBanner.updatedAtISO)}</div>
            </div>
          </div>
        )}

        {/* Hero KPI */}
        <div className="mt-5 grid gap-4 lg:grid-cols-12">
          <Card
            className="lg:col-span-8"
            title={
              <div className="flex items-center gap-2">
                <span>統計サマリ</span>
                <Badge tone="indigo">Dashboard</Badge>
              </div>
            }
            right={
              <div className="flex items-center gap-2">
                {summaryLoading && <Badge tone="slate">summary取得中</Badge>}
                {summaryError && <Badge tone="rose">summary失敗</Badge>}
                <Badge tone="slate">期間: {period === "5" ? "直近5" : period === "10" ? "直近10" : "今季"}</Badge>
                <Badge tone="slate">対象: {ha === "all" ? "全" : ha === "home" ? "Home" : "Away"}</Badge>
              </div>
            }
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {KPIS.map((k) => (
                <div key={k.label} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-semibold text-slate-500">{k.label}</div>
                  <div className="mt-2 text-2xl font-black text-slate-900">{k.value}</div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-500">{k.hint}</span>
                    {k.delta && <Badge tone={k.delta.startsWith("-") ? "rose" : "emerald"}>{k.delta}</Badge>}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">勝点累積（表示確認）</div>
                <div className="text-xs text-slate-500">フィルタに追従</div>
              </div>
              <MiniLineChart points={trendPoints} />
            </div>
          </Card>

          {/* Next match */}
          <Card
            className="lg:col-span-4"
            title={
              <div className="flex items-center gap-2">
                <span>次の試合</span>
                <Badge tone="amber">Next</Badge>
              </div>
            }
            right={
              <div className="flex items-center gap-2">
                {futureApiLoading && <Badge tone="slate">取得中</Badge>}
                {futureApiError && <Badge tone="rose">取得失敗</Badge>}
              </div>
            }
          >
            {nextFuture ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-semibold text-slate-500">Kickoff</div>
                <div className="mt-1 text-sm font-bold text-slate-900">{nextFuture.futureTime ? fmtJstDate(nextFuture.futureTime) : "未定"}</div>

                <div className="mt-3 grid grid-cols-2 items-center gap-3">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-xs text-slate-500">HOME</div>
                    <div className="mt-1 font-black text-slate-900">{nextFuture.homeTeam}</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-xs text-slate-500">AWAY</div>
                    <div className="mt-1 font-black text-slate-900">{nextFuture.awayTeam}</div>
                  </div>
                </div>

                {nextFuture.link && (
                  <div className="mt-2 text-xs text-slate-500">
                    link:{" "}
                    <a className="underline hover:text-slate-700" href={nextFuture.link} target="_blank" rel="noreferrer">
                      {nextFuture.link}
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-slate-600">次戦情報なし</div>
            )}
          </Card>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex flex-wrap gap-2">
          <TabButton active={tab === "stats"} onClick={() => setTab("stats")} badge={<Badge tone="indigo">優先</Badge>}>
            統計
          </TabButton>
          <TabButton active={tab === "matches"} onClick={() => setTab("matches")}>
            試合
          </TabButton>
          <TabButton active={tab === "standings"} onClick={() => setTab("standings")} badge={standingsLoading ? <Badge tone="slate">取得中</Badge> : undefined}>
            順位表
          </TabButton>
          <TabButton active={tab === "players"} onClick={() => setTab("players")} badge={<Badge tone="slate">低</Badge>}>
            選手
          </TabButton>
        </div>

        <div className="mt-4 space-y-4">
          {tab === "stats" && (
            <>
              <div className="grid gap-4 lg:grid-cols-12">
                <Card
                  className="lg:col-span-7"
                  title="各試合ごとの得点 / 失点"
                  right={
                    <div className="flex items-center gap-2">
                      {scoredLostLoading && <Badge tone="slate">取得中</Badge>}
                      {scoredLostError && <Badge tone="rose">取得失敗</Badge>}
                      {scoredLostApi?.matches?.length != null && <Badge tone="slate">{scoredLostApi.matches.length}件</Badge>}
                    </div>
                  }
                >
                  <BarsByMatch rows={scoredLostBarsRows} />
                </Card>

                <Card
                  className="lg:col-span-5"
                  title={
                    <div className="flex items-center gap-2">
                      <span>相関（mock）</span>
                      <Badge tone="indigo">Correlation</Badge>
                    </div>
                  }
                >
                  <div className="grid gap-2">
                    {CORR.map((c) => (
                      <div key={c.feature} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
                        <div className="text-sm font-semibold text-slate-900">{c.feature}</div>
                        <span className={cx("rounded-full px-2 py-1 text-xs font-bold ring-1", rColor(c.r))}>r={c.r.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </Card>
                <Card
                  className="lg:col-span-12"
                  title={
                    <div className="flex items-center gap-2">
                      <span>スコア別スタッツ</span>
                      <Badge tone="indigo">/api/each-team-score</Badge>
                    </div>
                  }
                  right={
                    <div className="flex items-center gap-2">
                      {eachTeamScoreLoading && <Badge tone="slate">取得中</Badge>}
                      {eachTeamScoreError && <Badge tone="rose">取得失敗</Badge>}
                      <Badge tone="slate">{eachTeamScoreRows.length}件</Badge>
                    </div>
                  }
                >
                  {eachTeamScoreError && <pre className="mb-4 whitespace-pre-wrap rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">{eachTeamScoreError}</pre>}

                  {!eachTeamScoreLoading && eachTeamScoreRows.length === 0 ? (
                    <div className="text-sm text-slate-600">試合別スタッツデータがありません</div>
                  ) : (
                    <div className="grid gap-4 lg:grid-cols-12">
                      {/* 左: 試合選択 */}
                      <div className="lg:col-span-4">
                        <div className="max-h-[520px] space-y-2 overflow-auto pr-1">
                          {eachTeamScoreRows.map((row, idx) => {
                            const active = idx === selectedEachTeamScoreIndex;
                            return (
                              <button
                                key={`${row.id}_${idx}`}
                                type="button"
                                onClick={() => {
                                  setSelectedEachTeamScoreIndex(idx);
                                  setSelectedEachTeamScoreStatIndex(0);
                                }}
                                className={cx(
                                  "w-full rounded-2xl border px-4 py-3 text-left transition",
                                  active ? "border-indigo-300 bg-indigo-50 shadow-sm" : "border-slate-200 bg-white hover:bg-slate-50",
                                )}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="text-sm font-black text-slate-900">{row.situation || `row-${idx + 1}`}</div>
                                  <Badge tone={active ? "indigo" : "slate"}>{row.score || "score -"}</Badge>
                                </div>

                                <div className="mt-2 text-xs text-slate-600">
                                  {row.country} / {row.league}
                                </div>
                                <div className="mt-1 text-xs text-slate-500">{row.team}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 右: 選択した試合のスタッツ */}
                      <div className="lg:col-span-8">
                        {selectedEachTeamScore ? (
                          <div className="space-y-4">
                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge tone="indigo">{selectedEachTeamScore.situation || "situation"}</Badge>
                                <Badge tone="slate">{selectedEachTeamScore.score || "score -"}</Badge>
                              </div>

                              <div className="mt-3 text-lg font-black text-slate-900">{selectedEachTeamScore.team}</div>

                              <div className="mt-1 text-sm text-slate-600">
                                {selectedEachTeamScore.country} / {selectedEachTeamScore.league}
                              </div>
                            </div>

                            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                              <table className="min-w-[980px] w-full text-sm">
                                <thead className="bg-slate-50 text-slate-600">
                                  <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-left">
                                    <th>指標</th>
                                    <th className="text-right">Home avg</th>
                                    <th className="text-right">Away avg</th>
                                    <th className="text-right">Home std</th>
                                    <th className="text-right">Away std</th>
                                    <th className="text-right">Home skew</th>
                                    <th className="text-right">Away skew</th>
                                    <th className="text-right">Home kurt</th>
                                    <th className="text-right">Away kurt</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {EACH_TEAM_SCORE_STAT_PAIRS.map((pair, idx) => {
                                    const hs = selectedEachTeamScore[pair.homeKey];
                                    const as = selectedEachTeamScore[pair.awayKey];
                                    const active = idx === selectedEachTeamScoreStatIndex;

                                    return (
                                      <tr key={pair.label} className={cx("cursor-pointer hover:bg-slate-50", active && "bg-indigo-50/60")} onClick={() => setSelectedEachTeamScoreStatIndex(idx)}>
                                        <td className={cx("px-3 py-2 font-medium", active && "font-black text-slate-900")}>{pair.label}</td>
                                        <td className="px-3 py-2 text-right">{fmtNum(hs?.avg)}</td>
                                        <td className="px-3 py-2 text-right">{fmtNum(as?.avg)}</td>
                                        <td className="px-3 py-2 text-right">{fmtNum(hs?.stddev)}</td>
                                        <td className="px-3 py-2 text-right">{fmtNum(as?.stddev)}</td>
                                        <td className="px-3 py-2 text-right">{fmtNum(hs?.skewness)}</td>
                                        <td className="px-3 py-2 text-right">{fmtNum(as?.skewness)}</td>
                                        <td className="px-3 py-2 text-right">{fmtNum(hs?.kurtosis)}</td>
                                        <td className="px-3 py-2 text-right">{fmtNum(as?.kurtosis)}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>

                            {selectedEachTeamScoreStatPair && (
                              <div className="space-y-3">
                                <div className="text-sm font-semibold text-slate-900">詳細: {selectedEachTeamScoreStatPair.label}</div>

                                <div className="grid gap-4 lg:grid-cols-2">
                                  <StatDetailCard title={`HOME - ${selectedEachTeamScoreStatPair.label}`} stat={selectedHomeStat} tone="indigo" />
                                  <StatDetailCard title={`AWAY - ${selectedEachTeamScoreStatPair.label}`} stat={selectedAwayStat} tone="emerald" />
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-slate-600">表示できるスタッツがありません</div>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            </>
          )}

          {tab === "matches" && (
            <div className="grid gap-4 lg:grid-cols-12">
              <Card className="lg:col-span-5" title="次戦（MatchRow）">
                {nextMatch ? (
                  <div className="space-y-3">
                    <div className="text-sm font-semibold text-slate-900">{fmtJstDate(nextMatch.dateISO)}</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <div className="text-xs text-slate-500">{nextMatch.isHome ? "HOME" : "AWAY"}</div>
                        <div className="mt-1 font-black text-slate-900">{nextMatch.isHome ? TEAM.name : nextMatch.opponent}</div>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <div className="text-xs text-slate-500">{nextMatch.isHome ? "AWAY" : "HOME"}</div>
                        <div className="mt-1 font-black text-slate-900">{nextMatch.isHome ? nextMatch.opponent : TEAM.name}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-600">次戦なし</div>
                )}
              </Card>

              <Card
                className="lg:col-span-7"
                title="直近試合（history + live）"
                right={
                  <div className="flex items-center gap-2">
                    {historyLoading && <Badge tone="slate">history取得中</Badge>}
                    {historyError && <Badge tone="rose">history失敗</Badge>}
                  </div>
                }
              >
                <div className="space-y-3">
                  {MATCHES.filter((m) => m.status !== "SCHEDULED")
                    .slice(0, 8)
                    .map((m) => {
                      const win = m.gf > m.ga;
                      const draw = m.gf === m.ga;
                      const tone: Tone = m.status === "LIVE" ? "rose" : win ? "emerald" : draw ? "amber" : "slate";
                      return (
                        <div key={m.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge tone={tone}>{m.status}</Badge>
                                <div className="text-sm font-semibold text-slate-900">{fmtJstDate(m.dateISO)}</div>
                                <div className="text-xs text-slate-500">
                                  {m.isHome ? "HOME" : "AWAY"} vs {m.opponent}
                                </div>
                              </div>
                              <div className="mt-2 text-lg font-black text-slate-900">
                                {m.gf} - {m.ga}
                                {m.status === "LIVE" && m.minute != null && <span className="ml-2 text-sm text-rose-700">({m.minute}’)</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </Card>
            </div>
          )}
          {tab === "standings" && (
            <div className="space-y-4">
              {/* 順位表（最新節） */}
              <Card
                title="順位表（最新節）"
                right={
                  <div className="flex items-center gap-2">
                    {standingsLoading && <Badge tone="slate">取得中</Badge>}
                    {standingsError && <Badge tone="rose">取得失敗</Badge>}
                  </div>
                }
              >
                {standingsError && <pre className="mb-4 whitespace-pre-wrap rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">{standingsError}</pre>}
                {!standingsApi || standingsApi.standings.length === 0 ? (
                  <div className="text-sm text-slate-600">順位表データがありません</div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                    <table className="min-w-[720px] w-full text-sm">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-left">
                          <th className="w-14">順位</th>
                          <th>チーム</th>
                          <th className="w-16 text-right">節</th>
                          <th className="w-16 text-right">試合</th>
                          <th className="w-16 text-right">勝点</th>
                          <th className="w-14 text-right">勝</th>
                          <th className="w-14 text-right">分</th>
                          <th className="w-14 text-right">負</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {standingsApi.standings.map((r) => {
                          const played = (r.win ?? 0) + (r.draw ?? 0) + (r.lose ?? 0);
                          return (
                            <tr key={`${r.rank}_${r.team}`} className={cx("hover:bg-slate-50", r.currentTeam && "bg-indigo-50/60")}>
                              <td className={cx("px-3 py-2 text-slate-600", r.currentTeam && "font-bold text-slate-900")}>{r.rank}</td>
                              <td className={cx("px-3 py-2", r.currentTeam ? "font-black text-slate-900" : "font-medium text-slate-800")}>{r.team}</td>
                              <td className="px-3 py-2 text-right">{r.match ?? "-"}</td>
                              <td className="px-3 py-2 text-right">{played}</td>
                              <td className={cx("px-3 py-2 text-right", r.currentTeam && "font-black")}>{r.winningPoints ?? "-"}</td>
                              <td className="px-3 py-2 text-right">{r.win ?? "-"}</td>
                              <td className="px-3 py-2 text-right">{r.draw ?? "-"}</td>
                              <td className="px-3 py-2 text-right">{r.lose ?? "-"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              {/* 順位推移（全チーム） */}
              <Card title="順位推移（全チーム）">
                {!standingsApi || allTeamsRankSeries.length === 0 ? (
                  <div className="text-sm text-slate-600">推移データがありません</div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-sm font-semibold text-slate-900">リーグ全体の順位推移（太線＝表示中チーム）</div>
                      <div className="text-xs text-slate-500">x=節（1〜{leagueMaxMatch}） / y=順位（上が1位）</div>
                    </div>

                    <MultiLineChart series={allTeamsRankSeries} height={260} />

                    {/* 凡例 */}
                    <div className="mt-3 max-h-28 overflow-auto rounded-xl border border-slate-200 bg-white p-3">
                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-700">
                        {allTeamsRankSeries.map((s, i) => {
                          const palette = [
                            "#1d4ed8",
                            "#0f766e",
                            "#9333ea",
                            "#b45309",
                            "#be123c",
                            "#047857",
                            "#6d28d9",
                            "#0369a1",
                            "#a21caf",
                            "#b91c1c",
                            "#2563eb",
                            "#059669",
                            "#7c3aed",
                            "#ca8a04",
                            "#e11d48",
                            "#0891b2",
                            "#16a34a",
                            "#f97316",
                            "#64748b",
                            "#334155",
                          ];
                          const color = s.highlight ? "rgb(79 70 229)" : palette[i % palette.length];
                          return (
                            <div key={s.name} className="inline-flex items-center gap-2">
                              <span className="inline-block h-2.5 w-6 rounded" style={{ backgroundColor: color, opacity: s.highlight ? 1 : 0.65 }} />
                              <span className={cx("whitespace-nowrap", s.highlight && "font-bold text-slate-900")}>{s.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-slate-500">線が切れている箇所＝その節のデータ未取得（欠損）</div>
                  </div>
                )}
              </Card>
            </div>
          )}
          {tab === "players" && (
            <Card
              title={
                <div className="flex items-center gap-2">
                  <span>選手</span>
                  <Badge tone="indigo">team-member-master</Badge>
                </div>
              }
              right={
                <div className="flex items-center gap-2">
                  {teamMembersLoading && <Badge tone="slate">取得中</Badge>}
                  {teamMembersError && <Badge tone="rose">取得失敗</Badge>}
                  {visibleTeamMembers && <Badge tone="slate">{visibleTeamMembers.length}人</Badge>}
                </div>
              }
            >
              {teamMembersError && <pre className="mb-4 whitespace-pre-wrap rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">{teamMembersError}</pre>}

              {!teamMembersLoading && (!visibleTeamMembers || visibleTeamMembers.length === 0) ? (
                <div className="text-sm text-slate-600">選手データがありません</div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleTeamMembers.map((m) => {
                    const jersey = (m.jersey ?? "").trim();
                    const pos = (m.position ?? "").trim();
                    const age = (m.age ?? "").trim();
                    const score = (m.score ?? "").trim();
                    const injury = (m.injury ?? "").trim();
                    const isLoan = (m.deadline ?? "").trim() === "1";
                    const isRetired = (m.retireFlg ?? "").trim() === "1";

                    return (
                      <div key={m.id ?? `${m.member}_${m.jersey}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start gap-3">
                          <div className="h-12 w-12 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200">
                            {m.facePicPath ? (
                              <img
                                src={m.facePicPath}
                                alt={m.member}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  // 画像が無い/URL違いでも崩さない
                                  (e.currentTarget as HTMLImageElement).style.display = "none";
                                }}
                              />
                            ) : null}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {jersey && <Badge tone="slate">#{jersey}</Badge>}
                              {pos && <Badge tone="indigo">{pos}</Badge>}
                              {isLoan && <Badge tone="amber">期限付き</Badge>}
                              {isRetired && <Badge tone="rose">引退</Badge>}
                            </div>

                            <div className="mt-2 truncate text-sm font-black text-slate-900">{m.member}</div>

                            <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-600">
                              {age && <span>年齢: {age}</span>}
                              {score && <span>得点: {score}</span>}
                              {m.marketValue && <span>市場価値: {m.marketValue}</span>}
                            </div>

                            {injury && <div className="mt-2 text-xs font-semibold text-rose-700">{injury}</div>}

                            {m.latestInfoDate && <div className="mt-2 text-[11px] text-slate-500">latest: {m.latestInfoDate}</div>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          )}
        </div>

        <div className="mt-8 text-xs text-slate-500">
          ※ scoredLost のURLだけは環境差が出やすいので、ファイル上部の <code>SCORED_LOST_BASE</code> を合わせてください。
        </div>
      </div>
    </div>
  );
}
