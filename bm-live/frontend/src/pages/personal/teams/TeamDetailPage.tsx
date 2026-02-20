import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

type MatchStatus = "SCHEDULED" | "LIVE" | "FINISHED";

type TeamMeta = {
  id: string;
  name: string;
  country: string;
  league: string;
  season: string;
  crestText?: string; // 画像がない想定のためテキストロゴ
};

// --- API response (Spring DTO に合わせる) ---
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

type MatchRow = {
  id: string;
  dateISO: string; // "2026-02-01T12:00:00Z"
  opponent: string;
  isHome: boolean;
  gf: number;
  ga: number;
  status: MatchStatus;
  minute?: number; // LIVE用
};

type LiveStats = {
  matchId: string;
  minute: number;
  scoreHome: number;
  scoreAway: number;
  possessionHome: number;
  shotsHome: number;
  shotsAway: number;
  shotsOnTargetHome: number;
  shotsOnTargetAway: number;
  updatedAtISO: string;
};

type Kpi = { label: string; value: string; delta?: string; hint?: string };

type CorrelationItem = {
  feature: string;
  r: number; // -1..1
};

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function fmtJstDate(iso: string) {
  const d = new Date(iso);
  // ざっくり表示（厳密なJST変換は後ででOK）
  return d.toLocaleString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function rColor(r: number) {
  // 相関の色（-1..1）
  // 負：rose、正：emerald、0付近：slate
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

function Badge(props: { children: React.ReactNode; tone?: "slate" | "indigo" | "emerald" | "amber" | "rose" }) {
  const tone = props.tone ?? "slate";
  const map: Record<string, string> = {
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

/** JSON専用フェッチ（HTML返却: proxy/認証リダイレクト を明確化） */
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

function MiniLineChart(props: { points: Array<{ x: number; y: number }>; height?: number }) {
  const h = props.height ?? 90;
  const w = 520;

  const pad = 12;

  // ✅ 空配列ガード（last/first を安全に扱う）
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

      {/* grid */}
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1={pad} x2={w - pad} y1={pad + ((h - pad * 2) * i) / 3} y2={pad + ((h - pad * 2) * i) / 3} stroke="rgb(226 232 240)" />
      ))}

      {/* area */}
      <path d={`${d} L ${X(last.x).toFixed(2)} ${(h - pad).toFixed(2)} L ${X(first.x).toFixed(2)} ${(h - pad).toFixed(2)} Z`} fill="url(#g)" />

      {/* line */}
      <path d={d} fill="none" stroke="rgb(79 70 229)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />

      {/* last point */}
      <circle cx={X(last.x)} cy={Y(last.y)} r="4.8" fill="white" stroke="rgb(79 70 229)" strokeWidth="2.5" />
    </svg>
  );
}

function BarsByMatch(props: { rows: Array<{ label: string; gf: number; ga: number; status: MatchStatus }> }) {
  const max = Math.max(1, ...props.rows.map((r) => Math.max(r.gf, r.ga)));
  return (
    <div className="space-y-2">
      {props.rows.map((r, idx) => (
        <div key={idx} className="grid grid-cols-[120px_1fr] items-center gap-3">
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
      <div className="pt-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-6 rounded-full bg-indigo-500/80" /> 得点（GF）
        </span>
        <span className="ml-4 inline-flex items-center gap-2">
          <span className="h-2 w-6 rounded-full bg-rose-500/75" /> 失点（GA）
        </span>
      </div>
    </div>
  );
}

function MonthBars(props: { rows: Array<{ month: string; games: number; gf: number; ga: number }> }) {
  const max = Math.max(1, ...props.rows.map((r) => Math.max(r.gf, r.ga)));
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {props.rows.map((r) => (
        <div key={r.month} className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-900">{r.month}</div>
            <Badge tone="slate">{r.games}試合</Badge>
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-12 text-xs text-slate-500">GF</div>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-indigo-500/80" style={{ width: `${(r.gf / max) * 100}%` }} />
              </div>
              <div className="w-8 text-right text-xs font-semibold text-slate-900">{r.gf}</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-12 text-xs text-slate-500">GA</div>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-rose-500/75" style={{ width: `${(r.ga / max) * 100}%` }} />
              </div>
              <div className="w-8 text-right text-xs font-semibold text-slate-900">{r.ga}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TeamDetailMockPage() {
  // -----------------------------------------
  // URL から teamEnglish / teamHash を取得
  //   例: /team/avispa-fukuoka/SdMQZTB5/
  // -----------------------------------------
  const { teamEnglish, teamHash } = useParams<{ teamEnglish?: string; teamHash?: string }>();

  // -----------------------------------------
  // TEAM 部分のみ API 化（UI/導線の mock は維持）
  // -----------------------------------------
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
        const url = `/v1/api/leagues/${encodeURIComponent(teamEnglish)}/${encodeURIComponent(teamHash)}/teamDetail`;
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

  // ---------------------------
  // MOCK DATA（TEAM以外は後でAPIに差し替え）
  // ---------------------------
  const TEAM: TeamMeta = useMemo(() => {
    const fallback: TeamMeta = {
      id: "team_001",
      name: "Blue Harbor FC",
      country: "JP",
      league: "J1",
      season: "2026", // season は TeamDetailResponse に無いので当面固定
      crestText: "BHF",
    };

    if (!teamApi) return fallback;

    return {
      id: String(teamApi.id ?? fallback.id),
      name: teamApi.name || fallback.name,
      country: teamApi.country || fallback.country,
      league: teamApi.league || fallback.league,
      season: fallback.season,
      crestText: makeCrestText(teamApi.name, teamApi.english),
    };
  }, [teamApi]);

  const LIVE: LiveStats | null = {
    matchId: "m_live_001",
    minute: 63,
    scoreHome: 1,
    scoreAway: 0,
    possessionHome: 54,
    shotsHome: 10,
    shotsAway: 7,
    shotsOnTargetHome: 4,
    shotsOnTargetAway: 2,
    updatedAtISO: new Date().toISOString(),
  };

  const MOCK_MATCHES: MatchRow[] = [
    { id: "m_next", dateISO: "2026-02-23T06:00:00Z", opponent: "Red Valley", isHome: true, gf: 0, ga: 0, status: "SCHEDULED" },
    { id: "m_live_001", dateISO: "2026-02-19T10:00:00Z", opponent: "Green United", isHome: false, gf: 1, ga: 0, status: "LIVE", minute: 63 },
    { id: "m_01", dateISO: "2026-02-12T10:00:00Z", opponent: "Sunrise SC", isHome: true, gf: 2, ga: 1, status: "FINISHED" },
    { id: "m_02", dateISO: "2026-02-05T10:00:00Z", opponent: "North City", isHome: false, gf: 0, ga: 0, status: "FINISHED" },
    { id: "m_03", dateISO: "2026-01-29T10:00:00Z", opponent: "Lake Town", isHome: true, gf: 3, ga: 2, status: "FINISHED" },
    { id: "m_04", dateISO: "2026-01-22T10:00:00Z", opponent: "Oceanica", isHome: false, gf: 1, ga: 2, status: "FINISHED" },
    { id: "m_05", dateISO: "2026-01-15T10:00:00Z", opponent: "Ironworks", isHome: true, gf: 2, ga: 0, status: "FINISHED" },
    { id: "m_06", dateISO: "2026-01-08T10:00:00Z", opponent: "Royal Stars", isHome: false, gf: 1, ga: 1, status: "FINISHED" },
    { id: "m_07", dateISO: "2025-12-18T10:00:00Z", opponent: "Metro FC", isHome: true, gf: 4, ga: 1, status: "FINISHED" },
  ];

  const KPIS: Kpi[] = [
    { label: "勝点/試合", value: "1.78", delta: "+0.12", hint: "直近10試合" },
    { label: "得失点差", value: "+11", delta: "+3", hint: "今季累計" },
    { label: "平均得点", value: "1.65", delta: "+0.10", hint: "今季" },
    { label: "平均失点", value: "0.95", delta: "-0.08", hint: "今季" },
  ];

  const CORR: CorrelationItem[] = [
    { feature: "xG差", r: 0.71 },
    { feature: "被シュート", r: -0.52 },
    { feature: "枠内シュート", r: 0.44 },
    { feature: "支配率", r: 0.18 },
    { feature: "セットプレー失点", r: -0.36 },
    { feature: "カウンター成功", r: 0.33 },
  ];

  // ---------------------------
  // UI STATE（mockだけど導線確認のため）
  // ---------------------------
  const [tab, setTab] = useState<"stats" | "matches" | "players">("stats");
  const [period, setPeriod] = useState<"5" | "10" | "season">("10");
  const [ha, setHa] = useState<"all" | "home" | "away">("all");
  const [corrTarget, setCorrTarget] = useState<"勝点" | "得点" | "失点" | "得失点差">("勝点");

  const filteredMatches = useMemo(() => {
    let rows = [...MOCK_MATCHES].filter((m) => m.status !== "SCHEDULED"); // stats用
    if (ha !== "all") rows = rows.filter((m) => (ha === "home" ? m.isHome : !m.isHome));
    if (period === "5") rows = rows.slice(0, 5);
    if (period === "10") rows = rows.slice(0, 10);
    // season はそのまま
    return rows;
  }, [MOCK_MATCHES, period, ha]);

  const trendPoints = useMemo(() => {
    // ざっくり：試合indexに対する「勝点累積」をmock計算（見た目確認用）
    let pts = 0;
    const rows = [...filteredMatches].reverse(); // 古い→新しい
    return rows.map((m, i) => {
      const win = m.gf > m.ga;
      const draw = m.gf === m.ga;
      pts += win ? 3 : draw ? 1 : 0;
      return { x: i, y: pts };
    });
  }, [filteredMatches]);

  const goalsByMatch = useMemo(() => {
    // 新しい順で上位6試合だけ表示
    const rows = [...MOCK_MATCHES].slice(0, 6);
    return rows.map((m) => ({
      label: new Date(m.dateISO).toLocaleDateString("ja-JP", { month: "2-digit", day: "2-digit" }),
      gf: m.gf,
      ga: m.ga,
      status: m.status,
    }));
  }, [MOCK_MATCHES]);

  const monthAgg = useMemo(() => {
    // mock月集計
    return [
      { month: "2026-02", games: 4, gf: 5, ga: 1 },
      { month: "2026-01", games: 4, gf: 7, ga: 5 },
      { month: "2025-12", games: 2, gf: 4, ga: 1 },
    ];
  }, []);

  const nextMatch = useMemo(() => MOCK_MATCHES.find((m) => m.status === "SCHEDULED") ?? null, [MOCK_MATCHES]);
  const liveMatch = useMemo(() => MOCK_MATCHES.find((m) => m.status === "LIVE") ?? null, [MOCK_MATCHES]);

  // ---------------------------
  // RENDER
  // ---------------------------
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

                  <span className="text-xs text-slate-500">{teamApiLoading ? "（Team API 読み込み中…）" : teamApi ? "（Team API）" : "（Mockデータ表示）"}</span>

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

          {/* Top actions / status */}
          <div className="flex flex-wrap items-center gap-2">
            {LIVE ? <Badge tone="rose">LIVE更新中（mock）</Badge> : <Badge tone="slate">LIVEなし</Badge>}
            <Badge tone="slate">統計優先</Badge>
          </div>
        </div>

        {/* LIVE banner */}
        {LIVE && liveMatch && (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge tone="rose">LIVE</Badge>
                  <div className="text-sm font-semibold text-rose-900">
                    {liveMatch.isHome ? TEAM.name : liveMatch.opponent} {LIVE.scoreHome} - {LIVE.scoreAway} {liveMatch.isHome ? liveMatch.opponent : TEAM.name}
                    <span className="ml-2 text-rose-700">({LIVE.minute}’)</span>
                  </div>
                </div>
                <div className="mt-1 text-xs text-rose-800">
                  possession {LIVE.possessionHome}% / shots {LIVE.shotsHome}-{LIVE.shotsAway} / SOT {LIVE.shotsOnTargetHome}-{LIVE.shotsOnTargetAway}
                </div>
              </div>
              <div className="text-xs text-rose-700">updated: {fmtJstDate(LIVE.updatedAtISO)}</div>
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
                <div className="text-sm font-semibold text-slate-900">勝点累積（見た目確認用のmock推移）</div>
                <div className="text-xs text-slate-500">フィルタに追従</div>
              </div>
              <MiniLineChart points={trendPoints} />
            </div>
          </Card>

          <Card
            className="lg:col-span-4"
            title={
              <div className="flex items-center gap-2">
                <span>次の試合</span>
                <Badge tone="amber">Next</Badge>
              </div>
            }
          >
            {nextMatch ? (
              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-semibold text-slate-500">Kickoff</div>
                  <div className="mt-1 text-sm font-bold text-slate-900">{fmtJstDate(nextMatch.dateISO)}</div>

                  <div className="mt-3 grid grid-cols-2 items-center gap-3">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <div className="text-xs text-slate-500">{nextMatch.isHome ? "HOME" : "AWAY"}</div>
                      <div className="mt-1 font-black text-slate-900">{nextMatch.isHome ? TEAM.name : nextMatch.opponent}</div>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <div className="text-xs text-slate-500">{nextMatch.isHome ? "AWAY" : "HOME"}</div>
                      <div className="mt-1 font-black text-slate-900">{nextMatch.isHome ? nextMatch.opponent : TEAM.name}</div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-slate-800" type="button">
                      プレビュー（mock）
                    </button>
                    <button className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50" type="button">
                      対戦比較へ（mock）
                    </button>
                  </div>
                </div>

                {LIVE && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-rose-900">現在試合中</div>
                      <Badge tone="rose">{LIVE.minute}’</Badge>
                    </div>
                    <div className="mt-2 text-xs text-rose-800">
                      possession {LIVE.possessionHome}% / shots {LIVE.shotsHome}-{LIVE.shotsAway}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-slate-600">次戦情報なし（mock）</div>
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

        {/* Tab contents */}
        <div className="mt-4 space-y-4">
          {tab === "stats" && (
            <>
              {/* Filters */}
              <Card title="フィルタ（mock）" right={<span className="text-xs text-slate-500">統計の全カードがこの条件に追従する想定</span>}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-xs font-semibold text-slate-500">期間</div>
                    {(["5", "10", "season"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={cx(
                          "rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition",
                          period === p ? "bg-slate-900 text-white ring-slate-900" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50",
                        )}
                        type="button"
                      >
                        {p === "5" ? "直近5" : p === "10" ? "直近10" : "今季"}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-xs font-semibold text-slate-500">Home/Away</div>
                    {(["all", "home", "away"] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => setHa(v)}
                        className={cx(
                          "rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition",
                          ha === v ? "bg-slate-900 text-white ring-slate-900" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50",
                        )}
                        type="button"
                      >
                        {v === "all" ? "全" : v === "home" ? "Home" : "Away"}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>

              <div className="grid gap-4 lg:grid-cols-12">
                {/* Goals by match */}
                <Card className="lg:col-span-7" title="各試合ごとの得点 / 失点（mock）">
                  <BarsByMatch rows={goalsByMatch} />
                </Card>

                {/* Month aggregate */}
                <Card className="lg:col-span-5" title="月毎の得点 / 失点（mock）" right={<Badge tone="slate">集計</Badge>}>
                  <MonthBars rows={monthAgg} />
                </Card>
              </div>

              {/* Correlation */}
              <Card
                title={
                  <div className="flex items-center gap-2">
                    <span>相関（mock）</span>
                    <Badge tone="indigo">Correlation</Badge>
                  </div>
                }
                right={
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Target</span>
                    <select
                      value={corrTarget}
                      onChange={(e) => setCorrTarget(e.target.value as any)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm"
                    >
                      <option value="勝点">勝点</option>
                      <option value="得点">得点</option>
                      <option value="失点">失点</option>
                      <option value="得失点差">得失点差</option>
                    </select>
                  </div>
                }
              >
                <div className="grid gap-4 lg:grid-cols-12">
                  <div className="lg:col-span-6">
                    <div className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-900">{corrTarget}</span> に対する相関ランキング（上位）
                      <span className="ml-2 text-slate-500">※mockなので係数はダミー</span>
                    </div>
                    <div className="mt-3 space-y-2">
                      {CORR.sort((a, b) => Math.abs(b.r) - Math.abs(a.r)).map((c) => (
                        <div key={c.feature} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
                          <div className="text-sm font-semibold text-slate-900">{c.feature}</div>
                          <span className={cx("rounded-full px-2 py-1 text-xs font-bold ring-1", rColor(c.r))}>r={c.r.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-6">
                    <div className="text-xs text-slate-600">簡易ヒート表示（見た目確認用）</div>
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {CORR.map((c) => (
                        <div key={c.feature} className={cx("rounded-2xl p-3 ring-1", rColor(c.r))}>
                          <div className="text-xs font-semibold">{c.feature}</div>
                          <div className="mt-2 text-lg font-black">r {c.r.toFixed(2)}</div>
                          <div className="mt-1 text-[11px] opacity-80">n=10（mock）</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                  相関は因果ではありません。サンプル数（試合数）が少ないとブレます（ここは後で実データの n を表示すると良いです）。
                </div>
              </Card>
            </>
          )}

          {tab === "matches" && (
            <>
              <div className="grid gap-4 lg:grid-cols-12">
                <Card className="lg:col-span-5" title="次戦（mock）">
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
                      <div className="flex gap-2">
                        <button className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-slate-800" type="button">
                          詳細（mock）
                        </button>
                        <button className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50" type="button">
                          統計へ戻る
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-600">次戦なし（mock）</div>
                  )}
                </Card>

                <Card className="lg:col-span-7" title="直近試合（mock）" right={<Badge tone="slate">Timeline</Badge>}>
                  <div className="space-y-3">
                    {MOCK_MATCHES.filter((m) => m.status !== "SCHEDULED")
                      .slice(0, 6)
                      .map((m) => {
                        const win = m.gf > m.ga;
                        const draw = m.gf === m.ga;
                        const tone = m.status === "LIVE" ? "rose" : win ? "emerald" : draw ? "amber" : "slate";
                        return (
                          <div key={m.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge tone={tone as any}>{m.status}</Badge>
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
                              <button className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50" type="button">
                                試合詳細（mock）
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </Card>
              </div>
            </>
          )}

          {tab === "players" && (
            <Card title="選手（mock・低優先）" right={<Badge tone="slate">後で強化</Badge>}>
              <div className="text-sm text-slate-600">ここは低優先のため、まずは軽量な検索＋一覧だけ置くのがおすすめです（詳細は Drawer/Sheet で後付け）。</div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { no: 9, name: "K. Sato", pos: "FW" },
                  { no: 10, name: "R. Tanaka", pos: "MF" },
                  { no: 1, name: "H. Ito", pos: "GK" },
                  { no: 4, name: "M. Suzuki", pos: "DF" },
                  { no: 7, name: "T. Watanabe", pos: "MF" },
                  { no: 11, name: "Y. Nakamura", pos: "FW" },
                ].map((p) => (
                  <div key={p.no} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-xs font-semibold text-slate-500">
                      #{p.no} <span className="ml-2">{p.pos}</span>
                    </div>
                    <div className="mt-1 text-sm font-black text-slate-900">{p.name}</div>
                    <div className="mt-2 text-xs text-slate-500">出場/得点/市場価値…（mock）</div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-xs text-slate-500">※ これは導線確認用の mock ページです。実データ化する際は、MOCK_* を API（TanStack Query）に置き換えます。</div>
      </div>
    </div>
  );
}
