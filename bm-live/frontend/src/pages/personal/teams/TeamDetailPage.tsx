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

// --- LiveMatches API (/v1/api/live-matches/{teamEnglish}/{teamHash}) ---
type LiveMatchResponse = {
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

function BarsByMatch(props: { rows: Array<{ label: string; gf: number; ga: number; status: MatchStatus }> }) {
  const max = Math.max(1, ...props.rows.map((r) => Math.max(r.gf, r.ga)));
  return (
    <div className="space-y-2">
      {props.rows.map((r, idx) => (
        <div key={idx} className="grid grid-cols-[140px_1fr] items-center gap-3">
          <div className="truncate text-xs text-slate-600">
            {r.label} {r.status === "LIVE" && <Badge tone="rose">LIVE</Badge>}
            {r.status === "SCHEDULED" && <Badge tone="amber">NEXT</Badge>}
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

// =====================
// page
// =====================
export default function TeamDetailMockPage() {
  const { teamEnglish, teamHash } = useParams<{ teamEnglish?: string; teamHash?: string }>();

  // ====== API base ======
  const API_V1 = "/v1/api";

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
  // LIVE API
  // =========================
  const [liveApi, setLiveApi] = useState<LiveMatchResponse[] | null>(null);
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
        const data = await fetchJsonStrict<LiveMatchResponse[]>(url, { method: "GET" });
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

  const liveBanner: LiveBannerModel | null = useMemo(() => {
    if (!teamEnglish) return null;
    if (!liveApi || liveApi.length === 0) return null;

    let hit = liveApi.find((r) => r.homeSlug === teamEnglish || r.awaySlug === teamEnglish) ?? null;

    if (!hit && teamApi?.name) {
      const nm = teamApi.name;
      hit = liveApi.find((r) => r.homeTeamName === nm || r.awayTeamName === nm) ?? null;
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

    const rows = ms
      .filter((m) => (m.status ?? "FINISHED") === "FINISHED")
      .filter((m) => !!m.recordTime)
      .slice()
      .sort((a, b) => new Date(b.recordTime!).getTime() - new Date(a.recordTime!).getTime())
      .map((m) => {
        const isHome = normalizeName(m.homeTeamName) === teamName;
        const isAway = normalizeName(m.awayTeamName) === teamName;

        const hs = Number(m.homeScore ?? 0);
        const as = Number(m.awayScore ?? 0);

        // 判定できなければ “home扱い” に倒す（表示崩れ防止）
        const gf = isAway ? as : isHome ? hs : hs;
        const ga = isAway ? hs : isHome ? as : as;

        return {
          label: labelRoundXAndDate(m),
          gf,
          ga,
          status: "FINISHED" as MatchStatus,
        };
      });

    return rows;
  }, [scoredLostApi, teamApi?.name, TEAM.name]);

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

  const [tab, setTab] = useState<"stats" | "matches" | "players">("stats");
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
                  title="各試合ごとの得点 / 失点（scoredLost）"
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

          {tab === "players" && (
            <Card title="選手（mock）" right={<Badge tone="slate">後で強化</Badge>}>
              <div className="text-sm text-slate-600">（略）</div>
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
