import React, { useEffect, useMemo, useRef, useState } from "react";

type FinGettingRequest = {
  matches: Array<{
    matchDate: string; // "YYYY-MM-DD"
    matchId: string;
    matchUrl?: string;
  }>;
};

type ExecTaskResponse = {
  returnCd?: string;
  taskArn?: string;
  message?: string;
};

function extractMidFromUrl(url: string | null | undefined): string | null {
  const s = (url ?? "").trim();
  if (!s) return null;
  const m = s.match(/[?&]mid=([A-Za-z0-9]+)/);
  return m?.[1] ?? null;
}

function isoToJstDateKey(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;

  // JST固定で "YYYY-MM-DD" を作る（PCのローカルTZに依存しない）
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);

  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const dd = parts.find((p) => p.type === "day")?.value;
  if (!y || !m || !dd) return null;
  return `${y}-${m}-${dd}`;
}

/** =========================
 * Types (API DTO)
 * ========================= */
type ApiEnvelope = {
  offset: number;
  limit: number;
  total: number;
  rows: IngestedRowDTO[];
};

type IngestedRowDTO = {
  seq: number;
  table: string; // "data" | "future_master" | etc
  registerTime: string; // ISO string
  updateTime?: string | null;

  /** backend enrich (あれば使う) */
  futureExists?: boolean;
  hasFinishedTimes?: boolean;
  timesList?: string[];

  /** payload */
  data?: DataRowDTO | null;
  future?: FutureMasterRowDTO | null;
};

type DataRowDTO = {
  // data table (必要な分だけ)
  gameId?: string | number | null; // ← あなたが「dataはgame_idが良い」と言っていたので最優先で使う
  gameLink?: string | null;

  dataCategory?: string | null;
  times?: string | null;

  homeTeamName?: string | null;
  awayTeamName?: string | null;
};

type FutureMasterRowDTO = {
  // future_master (必要な分だけ)
  gameLink?: string | null;
  gameTeamCategory?: string | null;
  homeTeamName?: string | null;
  awayTeamName?: string | null;
  futureTime?: string | null;
};

/** =========================
 * UI Small Components
 * ========================= */
function normKeyPart(s: string | null | undefined) {
  // NFKCで半角カナ等を寄せる + 全角スペースを普通のスペースへ + 連続空白圧縮
  return (s ?? "")
    .normalize("NFKC")
    .replace(/\u3000/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function makeCompositeKey(home: string, away: string, category: string) {
  const h = normKeyPart(home);
  const a = normKeyPart(away);
  const c = normKeyPart(category);
  // 3つ揃っていれば複合キーを採用（matchKeyより優先）
  if (h && a && c) return `H:${h}|||A:${a}|||C:${c}`;
  return null;
}

function Card(props: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${props.className ?? ""}`}>
      {props.title && <div className="mb-3 text-base font-semibold text-slate-900">{props.title}</div>}
      {props.children}
    </div>
  );
}

type BadgeTone = "slate" | "emerald" | "rose" | "amber" | "blue" | "gray";
function Badge(props: { tone?: BadgeTone; children: React.ReactNode; className?: string }) {
  const tone = props.tone ?? "slate";
  const map: Record<BadgeTone, string> = {
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    gray: "bg-gray-100 text-gray-700 border-gray-200",
  };
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${map[tone]} ${props.className ?? ""}`}>{props.children}</span>;
}

function Button(props: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; tone?: "primary" | "ghost"; className?: string }) {
  const tone = props.tone ?? "primary";
  const base = "inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed";
  const cls = tone === "primary" ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-white text-slate-800 border border-slate-200 hover:bg-slate-50";
  return (
    <button className={`${base} ${cls} ${props.className ?? ""}`} onClick={props.onClick} disabled={props.disabled}>
      {props.children}
    </button>
  );
}

function Input(props: { value: string; onChange: (v: string) => void; type?: string; placeholder?: string; className?: string }) {
  return (
    <input
      className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 ${props.className ?? ""}`}
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      type={props.type ?? "text"}
      placeholder={props.placeholder}
    />
  );
}

function Alert(props: { tone?: "info" | "error"; title: string; children?: React.ReactNode }) {
  const tone = props.tone ?? "info";
  const cls = tone === "error" ? "border-rose-200 bg-rose-50 text-rose-800" : "border-slate-200 bg-slate-50 text-slate-800";
  return (
    <div className={`rounded-xl border p-3 ${cls}`}>
      <div className="text-sm font-semibold">{props.title}</div>
      {props.children && <div className="mt-1 text-sm opacity-90">{props.children}</div>}
    </div>
  );
}

/** =========================
 * Utils
 * ========================= */
function toISODateInputValue(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function fmtJstLike(iso: string | null | undefined) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  // ローカル表示（あなたの環境がJSTならJST表示）
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${y}/${m}/${day} ${hh}:${mi}:${ss}`;
}

async function fetchJsonStrict<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { method: "GET", signal, headers: { Accept: "application/json" } });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}${text ? `: ${text}` : ""}`);
  }
  return (await res.json()) as T;
}

function norm(s: string | null | undefined) {
  return (s ?? "").trim();
}

/**
 * "3:45" / "39:19" / "63'" をソート可能な数値にする
 * - mm:ss => seconds
 * - 63' => 63*60
 * - "終了済" => Infinity（最後に回す）
 */
function timesSortKey(t: string): number | null {
  const x = t.trim();
  if (!x) return null;
  if (x === "終了済") return Number.POSITIVE_INFINITY;

  // 63'
  const m1 = x.match(/^(\d+)\s*'$/);
  if (m1) {
    const mm = Number(m1[1]);
    if (Number.isFinite(mm)) return mm * 60;
  }

  // mm:ss
  const m2 = x.match(/^(\d{1,3}):(\d{1,2})$/);
  if (m2) {
    const mm = Number(m2[1]);
    const ss = Number(m2[2]);
    if (Number.isFinite(mm) && Number.isFinite(ss)) return mm * 60 + ss;
  }

  return null;
}

function isAllowedTimes(t: string) {
  const k = timesSortKey(t);
  return k !== null; // mm:ss / 63' / 終了済 だけを残す
}

function sortTimesAscWithFinishedLast(list: string[]) {
  const uniq = Array.from(new Set(list.map((s) => s.trim()).filter(Boolean)));
  const allowed = uniq.filter(isAllowedTimes);
  allowed.sort((a, b) => {
    const ka = timesSortKey(a)!;
    const kb = timesSortKey(b)!;
    return ka - kb;
  });
  return allowed;
}

/** =========================
 * Aggregation Types (Front)
 * ========================= */
type IngestLog = {
  seq: number;
  table: string;
  registerTime: string;
  updateTime?: string | null;
  times?: string | null;
};

type MatchGroupRow = {
  groupKey: string;

  home: string;
  away: string;
  category: string;

  matchId: string | null;
  matchUrl: string | null;

  // flags
  futureExists: boolean;
  hasFinished: boolean;

  // times aggregated from ALL data rows (and timesList if provided)
  timesAllSorted: string[];

  // logs (all data rows)
  ingestsSortedAsc: IngestLog[];

  // sorting key (newest first for list)
  latestRegisterTime: string;
};

/** =========================
 * Page
 * ========================= */
export default function IngestedDataReferencePage() {
  // ---- filters
  const today = useMemo(() => new Date(), []);
  const [fromDate, setFromDate] = useState(() => toISODateInputValue(new Date(today.getTime() - 7 * 86400 * 1000)));
  const [toDate, setToDate] = useState(() => toISODateInputValue(today));
  const [keyword, setKeyword] = useState("");

  const [execLoading, setExecLoading] = useState(false);
  const [execError, setExecError] = useState<string | null>(null);
  const [execResult, setExecResult] = useState<ExecTaskResponse | null>(null);

  // ---- paging (matchKey単位)
  const [offset, setOffset] = useState(0);
  const [pageSize, setPageSize] = useState(100);

  // ---- fetch state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [envelope, setEnvelope] = useState<ApiEnvelope | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  // NOTE:
  // backendが raw rows を offset/limit で返す場合、ページ跨ぎで同一試合が分断される可能性があります。
  // ここでは「フロントで確実に集約したい」ので、サーバへは大きめ limit で取りに行き、
  // その後 matchKey単位でフロント側 pagination します。
  const FETCH_LIMIT_RAW = 5000;

  const runB008FinGettingTask = async () => {
    setExecLoading(true);
    setExecError(null);
    setExecResult(null);

    try {
      const req = buildFinGettingRequestFromGroups(groupedFiltered, fromDate, toDate);

      // guard：空なら叩かない
      if (req.matches.length === 0) {
        setExecError("対象が0件です（matchIdが取れない or フィルタで空）");
        return;
      }

      // 注意：envで渡す方式は大量だと上限に当たる可能性があるので、ひとまずUIでも警告
      if (req.matches.length > 300) {
        // ここは運用に合わせて閾値調整
        throw new Error(`対象が多すぎます（${req.matches.length}件）。日付/keywordで絞ってから実行してください。`);
      }

      const res = await postFinGettingJson(req);
      setExecResult(res);
    } catch (e: any) {
      setExecError(e?.message ?? String(e));
    } finally {
      setExecLoading(false);
    }
  };

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();

    const from = toOffsetDateTimeParam(fromDate, false);
    const to = toOffsetDateTimeParam(toDate, true);

    params.set("from", from);
    params.set("to", to);
    params.set("offset", "0");
    params.set("limit", String(FETCH_LIMIT_RAW));
    if (keyword.trim()) params.set("q", keyword.trim()); // backendが対応していれば有効
    return `/v1/api/admin/ingested?${params.toString()}`;
  }, [fromDate, toDate, keyword]);

  function resolveMatchIdPreferUrlMid(matchId: string | null, matchUrl: string | null): string | null {
    const u = (matchUrl ?? "").trim();
    const mid = extractMidFromUrl(u);
    if (mid) return mid; // URLがあるならmidを正とする
    const m = (matchId ?? "").trim();
    return m || null;
  }

  function buildFinGettingRequestFromGroups(groups: MatchGroupRow[], fromDate: string, toDate: string): FinGettingRequest {
    const singleDay = fromDate === toDate;

    // dateごとに (matchId) 重複排除
    const perDate = new Map<string, Map<string, { matchDate: string; matchId: string; matchUrl?: string }>>();

    for (const g of groups) {
      const dk = singleDay ? fromDate : (isoToJstDateKey(g.latestRegisterTime) ?? fromDate);

      const mid = resolveMatchIdPreferUrlMid(g.matchId, g.matchUrl);
      if (!mid) continue;

      const url = (g.matchUrl ?? "").trim();
      const row: { matchDate: string; matchId: string; matchUrl?: string } = { matchDate: dk, matchId: mid };
      if (url) row.matchUrl = url;

      if (!perDate.has(dk)) perDate.set(dk, new Map());
      // 同一matchIdは最後のもの優先（URL付きが来たら上書きされる）
      perDate.get(dk)!.set(mid, row);
    }

    const matches: FinGettingRequest["matches"] = [];
    for (const [, m] of perDate) {
      matches.push(...Array.from(m.values()));
    }

    // 任意：安定のためソート
    matches.sort((a, b) => (a.matchDate + a.matchId).localeCompare(b.matchDate + b.matchId));

    return { matches };
  }

  async function postFinGettingJson(req: FinGettingRequest, signal?: AbortSignal): Promise<ExecTaskResponse> {
    const res = await fetch("/v1/api/admin/exec/task/fin-getting-json", {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${res.statusText}${text ? `: ${text}` : ""}`);
    }
    return (await res.json()) as ExecTaskResponse;
  }

  const refetch = () => {
    setOffset(0);
    void doFetch();
  };

  const doFetch = async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    setError(null);

    try {
      const res = await fetchJsonStrict<ApiEnvelope>(apiUrl, ac.signal);
      setEnvelope(res);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setError(e?.message ?? String(e));
      setEnvelope(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void doFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl]);

  const rawRows = envelope?.rows ?? [];

  /** =========================
   * ここが「全処理」の核：matchKey単位に集約
   *
   * groupKey 優先順位:
   *  1) data.gameId があれば gid:{gameId}
   *  2) それ以外は home|||away|||category
   *     (future/dataのどちらかに情報があれば埋める)
   * ========================= */
  const groupedAll: MatchGroupRow[] = useMemo(() => {
    type Acc = Omit<MatchGroupRow, "timesAllSorted" | "ingestsSortedAsc"> & {
      timesSet: Set<string>;
      ingests: IngestLog[];
      futureCount: number;
      dataCount: number;
    };

    const map = new Map<string, Acc>();

    for (const r of rawRows) {
      const homeRaw = norm(r.data?.homeTeamName) || norm(r.future?.homeTeamName) || "-";
      const awayRaw = norm(r.data?.awayTeamName) || norm(r.future?.awayTeamName) || "-";
      const catRaw = norm(r.data?.dataCategory) || norm(r.future?.gameTeamCategory) || "-";

      // ★同一試合の判定は「複合キー」を最優先（表記ゆれ対策は normKeyPart 内）
      const composite = makeCompositeKey(homeRaw, awayRaw, catRaw);

      // matchKeyは補助（デバッグ用/後で統合用）
      const matchKey =
        norm(r.data?.gameId as any) ||
        norm(r.data?.gameLink) ||
        (() => {
          const gl = norm(r.future?.gameLink);
          const m = gl.match(/mid=([A-Za-z0-9]+)/);
          return m?.[1] ?? gl;
        })();

      const dataGameId = r.data?.gameId != null ? String(r.data.gameId) : "";
      const dataLink = norm(r.data?.gameLink);
      const futureLink = norm(r.future?.gameLink);

      // matchId（優先順：data.gameId > gameLink(mid) > futureLink(mid)）
      const matchId = (dataGameId && normKeyPart(dataGameId)) || extractMidFromUrl(dataLink) || extractMidFromUrl(futureLink) || null;

      // matchUrl（取れるなら URL を。無ければ null）
      // できるだけ /match/ を含むほうを優先
      const matchUrl = (dataLink.includes("/match/") ? dataLink : "") || (futureLink.includes("/match/") ? futureLink : "") || null;

      // 最終キー：複合キーが作れるならそれ。無理なら matchKey。どっちも無理なら seq fallback
      const groupKey = composite ?? (matchKey ? `MK:${normKeyPart(matchKey)}` : null) ?? `fallback:${r.seq}`;

      const futureExists = Boolean(r.futureExists) || r.table === "FUTURE_MASTER" || Boolean(r.future);

      // times候補（data.times + timesList）
      const timesCandidates: string[] = [];
      if (r.data?.times) timesCandidates.push(r.data.times);
      if (Array.isArray(r.timesList)) timesCandidates.push(...r.timesList);

      const hasFinished = Boolean(r.hasFinishedTimes) || timesCandidates.some((t) => (t ?? "").trim() === "終了済");

      const ingest: IngestLog = {
        seq: Number(r.seq),
        table: String(r.table),
        registerTime: r.registerTime,
        updateTime: r.updateTime ?? null,
        times: r.data?.times ?? null,
      };

      const existing = map.get(groupKey);
      if (!existing) {
        const timesSet = new Set<string>();
        for (const t of timesCandidates) {
          const tt = (t ?? "").trim();
          if (tt) timesSet.add(tt);
        }

        map.set(groupKey, {
          groupKey,
          home: homeRaw,
          away: awayRaw,
          category: catRaw,
          matchId,
          matchUrl,
          futureExists,
          hasFinished,
          latestRegisterTime: r.registerTime,
          timesSet,
          ingests: [ingest],
          futureCount: r.table === "FUTURE_MASTER" ? 1 : 0,
          dataCount: r.table === "DATA" ? 1 : 0,
        });
      } else {
        // 欠けている情報を埋める
        if (existing.home === "-" && homeRaw !== "-") existing.home = homeRaw;
        if (existing.away === "-" && awayRaw !== "-") existing.away = awayRaw;
        if (existing.category === "-" && catRaw !== "-") existing.category = catRaw;

        if (!existing.matchId && matchId) existing.matchId = matchId;
        if (!existing.matchUrl && matchUrl) existing.matchUrl = matchUrl;

        for (const t of timesCandidates) {
          const tt = (t ?? "").trim();
          if (tt) existing.timesSet.add(tt);
        }

        existing.ingests.push(ingest);
        existing.futureExists = existing.futureExists || futureExists;
        existing.hasFinished = existing.hasFinished || hasFinished;

        if (new Date(r.registerTime).getTime() > new Date(existing.latestRegisterTime).getTime()) {
          existing.latestRegisterTime = r.registerTime;
        }

        if (r.table === "FUTURE_MASTER") existing.futureCount += 1;
        if (r.table === "DATA") existing.dataCount += 1;

        map.set(groupKey, existing);
      }
    }

    const out: MatchGroupRow[] = [];
    for (const v of map.values()) {
      const timesAllSorted = sortTimesAscWithFinishedLast(Array.from(v.timesSet));
      const ingestsSortedAsc = v.ingests.slice().sort((a, b) => new Date(a.registerTime).getTime() - new Date(b.registerTime).getTime());

      out.push({
        groupKey: v.groupKey,
        home: v.home,
        away: v.away,
        category: v.category,
        matchId: v.matchId ?? null,
        matchUrl: v.matchUrl ?? null,
        futureExists: v.futureExists,
        hasFinished: v.hasFinished,
        timesAllSorted,
        ingestsSortedAsc,
        latestRegisterTime: v.latestRegisterTime,
      });
    }

    // 一覧は新しい順
    out.sort((a, b) => new Date(b.latestRegisterTime).getTime() - new Date(a.latestRegisterTime).getTime());
    return out;
  }, [rawRows]);

  // keyword は backend q が効かない可能性があるので、フロントでも絞り込み（保険）
  const groupedFiltered: MatchGroupRow[] = useMemo(() => {
    const q = keyword.trim();
    if (!q) return groupedAll;
    return groupedAll.filter((g) => {
      const s = `${g.home} ${g.away} ${g.category} ${g.groupKey}`.toLowerCase();
      return s.includes(q.toLowerCase());
    });
  }, [groupedAll, keyword]);

  const totalGroups = groupedFiltered.length;
  const showingGroups = groupedFiltered.slice(offset, offset + pageSize);

  // expand state
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
  const toggleExpand = (k: string) => setExpandedKeys((p) => ({ ...p, [k]: !p[k] }));

  const canPrev = offset > 0;
  const canNext = offset + pageSize < totalGroups;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xl font-bold text-slate-900">Ingested Data Reference</div>
          <div className="mt-1 text-sm text-slate-600">
            一覧（新しい順 / matchKey単位） &nbsp;|&nbsp; offset: {offset} / showing: {showingGroups.length} / total: {totalGroups}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {loading ? <Badge tone="slate">取得中…</Badge> : <Badge tone="gray">raw rows: {rawRows.length}</Badge>}
          <Badge tone="gray">raw fetch limit: {FETCH_LIMIT_RAW}</Badge>
        </div>
      </div>

      <Card title="検索条件">
        <Button onClick={runB008FinGettingTask} disabled={loading || execLoading || groupedFiltered.length === 0}>
          {execLoading ? "B008起動中…" : "B008（fin-getting-json）起動"}
        </Button>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div>
            <div className="mb-1 text-xs font-medium text-slate-600">from</div>
            <Input type="date" value={fromDate} onChange={setFromDate} />
          </div>
          <div>
            <div className="mb-1 text-xs font-medium text-slate-600">to</div>
            <Input type="date" value={toDate} onChange={setToDate} />
          </div>
          <div className="md:col-span-2">
            <div className="mb-1 text-xs font-medium text-slate-600">keyword（フロント側でも絞り込み）</div>
            <Input value={keyword} onChange={setKeyword} placeholder="例: 東京ヴェルディ / J1 / round 1 ..." />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button onClick={refetch} disabled={loading}>
            再取得
          </Button>
          <Button
            tone="ghost"
            onClick={() => {
              setKeyword("");
              setOffset(0);
            }}
          >
            keywordクリア
          </Button>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-slate-600">page size</span>
            <select
              className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setOffset(0);
              }}
            >
              {[50, 100, 200].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {execError && (
        <Alert tone="error" title="B008起動に失敗しました">
          {execError}
        </Alert>
      )}

      {execResult && (
        <Alert tone="info" title="B008を起動しました">
          returnCd: {execResult.returnCd ?? "-"}
          <br />
          taskArn: {execResult.taskArn ?? "-"}
        </Alert>
      )}

      {error && (
        <Alert tone="error" title="取得に失敗しました">
          {error}
        </Alert>
      )}

      <Card title="一覧">
        <div className="divide-y divide-slate-200 rounded-xl border border-slate-200">
          {showingGroups.length === 0 && !loading && <div className="p-4 text-sm text-slate-600">データがありません</div>}

          {showingGroups.map((g) => {
            const expanded = Boolean(expandedKeys[g.groupKey]);
            const summary = `${g.home} vs ${g.away} / ${g.category}`;

            const timesText = g.timesAllSorted.length ? g.timesAllSorted.join(", ") : null;

            return (
              <div key={g.groupKey} className="p-4">
                <button className="w-full text-left" onClick={() => toggleExpand(g.groupKey)} type="button">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">{summary}</div>

                      {/* Badges: ここがあなたの「future_masterにあるか / 終了済があるか」 */}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {g.futureExists ? <Badge tone="emerald">future_masterに存在</Badge> : <Badge tone="rose">future_masterに存在しない</Badge>}

                        {g.hasFinished ? <Badge tone="blue">終了済あり</Badge> : <Badge tone="amber">終了済なし</Badge>}

                        {g.timesAllSorted.length > 0 && <Badge tone="gray">times {g.timesAllSorted.length}種</Badge>}

                        {/* groupKey を表示（gid優先） */}
                        <Badge tone="gray">{g.groupKey}</Badge>
                      </div>
                    </div>

                    <div className="shrink-0 text-xs text-slate-500">{expanded ? "▲" : "▼"}</div>
                  </div>
                </button>

                {expanded && (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="rounded-lg border border-slate-200 bg-white p-3">
                        <div className="text-xs font-semibold text-slate-800">Meta</div>
                        <div className="mt-2 space-y-1 text-sm text-slate-700">
                          <div>
                            <span className="text-slate-500">home</span> {g.home}
                          </div>
                          <div>
                            <span className="text-slate-500">away</span> {g.away}
                          </div>
                          <div>
                            <span className="text-slate-500">category</span> {g.category}
                          </div>
                          <div>
                            <span className="text-slate-500">latestRegisterTime</span> {fmtJstLike(g.latestRegisterTime)}
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {g.futureExists ? <Badge tone="emerald">future_masterに存在</Badge> : <Badge tone="rose">future_masterに存在しない</Badge>}
                          {g.hasFinished ? <Badge tone="blue">終了済あり</Badge> : <Badge tone="amber">終了済なし</Badge>}
                        </div>
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-white p-3">
                        <div className="text-xs font-semibold text-slate-800">times 一覧（昇順 → 終了済）</div>
                        <div className="mt-2 text-sm text-slate-700">
                          {g.timesAllSorted.length ? (
                            <div className="flex flex-wrap gap-2">
                              {g.timesAllSorted.map((t) => (
                                <Badge key={t} tone={t === "終了済" ? "blue" : "slate"}>
                                  {t}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <div className="text-slate-500">times がありません</div>
                          )}
                        </div>

                        {timesText && <div className="mt-3 text-xs text-slate-500">{timesText}</div>}
                      </div>
                    </div>

                    <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold text-slate-800">data 行（この試合に紐づくものを全部 / 昇順）</div>

                        {/* コピー（行クリックを止める） */}
                        <div className="flex items-center gap-2">
                          <Button
                            tone="ghost"
                            onClick={() => {
                              navigator.clipboard?.writeText(g.groupKey).catch(() => {});
                            }}
                            className="px-2 py-1 text-xs"
                          >
                            keyコピー
                          </Button>
                        </div>
                      </div>

                      <div className="mt-2 overflow-x-auto">
                        <table className="w-full border-collapse text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                              <th className="py-2 pr-3">seq</th>
                              <th className="py-2 pr-3">table</th>
                              <th className="py-2 pr-3">registerTime</th>
                              <th className="py-2 pr-3">updateTime</th>
                              <th className="py-2 pr-3">times</th>
                            </tr>
                          </thead>
                          <tbody>
                            {g.ingestsSortedAsc.map((it) => (
                              <tr key={`${it.table}:${it.seq}`} className="border-b border-slate-100 last:border-b-0">
                                <td className="py-2 pr-3 font-mono text-xs text-slate-700">{it.seq}</td>
                                <td className="py-2 pr-3 text-xs text-slate-700">{it.table}</td>
                                <td className="py-2 pr-3 text-xs text-slate-700">{fmtJstLike(it.registerTime)}</td>
                                <td className="py-2 pr-3 text-xs text-slate-700">{fmtJstLike(it.updateTime ?? null)}</td>
                                <td className="py-2 pr-3 text-xs text-slate-700">
                                  {it.times ? <Badge tone={it.times.trim() === "終了済" ? "blue" : "slate"}>{it.times}</Badge> : <span className="text-slate-400">-</span>}
                                </td>
                              </tr>
                            ))}
                            {g.ingestsSortedAsc.length === 0 && (
                              <tr>
                                <td className="py-3 text-slate-500" colSpan={5}>
                                  該当する data 行がありません
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-2 text-xs text-slate-500">※ 行クリックで詳細を開閉します（コピー操作は行クリックを止めるようにしています）</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Pagination (matchKey単位) */}
        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-slate-600">
            offset: {offset} / showing: {showingGroups.length} / total: {totalGroups}
          </div>

          <div className="flex items-center gap-2">
            <Button tone="ghost" disabled={!canPrev} onClick={() => setOffset((v) => Math.max(0, v - pageSize))}>
              Prev
            </Button>
            <Button tone="ghost" disabled={!canNext} onClick={() => setOffset((v) => Math.min(totalGroups, v + pageSize))}>
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function toOffsetDateTimeParam(dateOnly: string, endOfDay: boolean): string {
  // dateOnly: "YYYY-MM-DD"
  // JSTで範囲検索したい前提（必要なら "+00:00" や "Z" に変えてOK）
  return endOfDay ? `${dateOnly}T23:59:59+09:00` : `${dateOnly}T00:00:00+09:00`;
}
