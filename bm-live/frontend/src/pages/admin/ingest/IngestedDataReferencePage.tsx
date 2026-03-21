import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Skeleton } from "../../../components/ui/skeleton";

/** =========================
 * Types
 * ========================= */
type FinGettingRequest = {
  matches: Array<{
    matchDate: string; // "YYYY-MM-DD"
    matchId: string; // mid
    matchUrl?: string;
  }>;
};

type ExecTaskResponse = {
  returnCd?: string;
  taskArn?: string;
  message?: string;
};

type ApiEnvelope = {
  offset: number;
  limit: number;
  total: number;
  rows: IngestedRowDTO[];
};

type IngestedRowDTO = {
  seq: string; // ★バックエンドは String
  table: "FUTURE_MASTER" | "DATA"; // ★enumに合わせる

  registerTime: string; // OffsetDateTimeのISO文字列想定
  updateTime?: string | null;

  futureExists?: boolean;
  hasFinishedTimes?: boolean;
  timesList?: string[];

  data?: DataRowDTO | null;
  future?: FutureMasterRowDTO | null;

  matchKey?: string | null;
};

type DataRowDTO = {
  seq?: string | null;
  dataCategory?: string | null;
  times?: string | null;
  homeTeamName?: string | null;
  awayTeamName?: string | null;

  recordTime?: string | null; // ★追加：これを record_time として使う

  gameId?: string | number | null;
  gameLink?: string | null;
};

type FutureMasterRowDTO = {
  gameLink?: string | null;
  gameTeamCategory?: string | null;
  homeTeamName?: string | null;
  awayTeamName?: string | null;

  futureTime?: string | null; // ★既存のまま（future_master.future_time）
};

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

  matchStartTimeIso: string | null; // future_master.future_time（ISO想定）
  dataRecordTime: string | null; // ★data.recordTime（record_time）

  matchId: string | null; // mid想定
  matchUrl: string | null;

  futureExists: boolean;
  hasFinished: boolean;
  hasPenalty: boolean;
  timesAllSorted: string[];
  ingestsSortedAsc: IngestLog[];

  latestRegisterTime: string;
};

/** =========================
 * UI helpers (NoticeAdminPage風)
 * ========================= */
type Tone = "gray" | "blue" | "emerald" | "amber" | "rose" | "violet";

function Badge({ children, tone = "gray" }: { children: React.ReactNode; tone?: Tone }) {
  const cls: Record<Tone, string> = {
    gray: "bg-gray-100 text-gray-700 ring-gray-200",
    blue: "bg-blue-100 text-blue-800 ring-blue-200",
    emerald: "bg-emerald-100 text-emerald-800 ring-emerald-200",
    amber: "bg-amber-100 text-amber-900 ring-amber-200",
    rose: "bg-rose-100 text-rose-800 ring-rose-200",
    violet: "bg-violet-100 text-violet-800 ring-violet-200",
  };
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${cls[tone]}`}>{children}</span>;
}

function recordTimeToJstDateKey(recordTime: string | null | undefined): string | null {
  const s = (recordTime ?? "").trim();
  if (!s) return null;

  // すでに日付だけならそれを採用
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // Dateで解釈できる形式（ISOなど）
  let d = new Date(s);
  if (!Number.isNaN(d.getTime())) return isoToJstDateKey(d.toISOString());

  // "YYYY-MM-DD HH:mm:ss" っぽい場合は JST とみなして +09:00 を付与
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}$/.test(s)) {
    const isoLike = s.replace(" ", "T") + "+09:00";
    d = new Date(isoLike);
    if (!Number.isNaN(d.getTime())) return isoToJstDateKey(d.toISOString());
  }

  return null;
}

function Panel({ title, desc, right, children }: { title: string; desc?: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white/80 backdrop-blur shadow-sm">
      <div className="px-5 py-4 border-b bg-gradient-to-r from-white to-gray-50 rounded-t-2xl">
        <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
          <div>
            <div className="text-base font-extrabold text-gray-900">{title}</div>
            {desc ? <div className="text-sm text-muted-foreground mt-1">{desc}</div> : null}
          </div>
          {right ? <div className="shrink-0">{right}</div> : null}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Alert({ type, title, message, onClose }: { type: "info" | "success" | "error"; title: string; message: string; onClose?: () => void }) {
  const cls = type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : type === "error" ? "border-rose-200 bg-rose-50 text-rose-900" : "border-blue-200 bg-blue-50 text-blue-900";

  return (
    <div className={`rounded-2xl border p-4 flex items-start gap-3 ${cls}`}>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-extrabold">{title}</div>
        <pre className="mt-1 text-xs whitespace-pre-wrap leading-relaxed">{message}</pre>
      </div>
      {onClose ? (
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors" type="button">
          ✕
        </button>
      ) : null}
    </div>
  );
}

/** =========================
 * Utils
 * ========================= */
function safeText(s: unknown): string {
  return typeof s === "string" ? s : "";
}

async function fetchJsonStrict<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { method: "GET", signal, headers: { Accept: "application/json" } });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}${text ? `: ${text}` : ""}`);
  }
  return (await res.json()) as T;
}

function extractMidFromUrl(url: string | null | undefined): string | null {
  const s = (url ?? "").trim();
  if (!s) return null;
  const m = s.match(/[?&]mid=([A-Za-z0-9]+)/);
  return m?.[1] ?? null;
}

function norm(s: string | null | undefined) {
  return (s ?? "").trim();
}

function normKeyPart(s: string | null | undefined) {
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
  if (h && a && c) return `H:${h}|||A:${a}|||C:${c}`;
  return null;
}

function fmtJstFixed(iso: string | null | undefined, withSeconds = false) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: withSeconds ? "2-digit" : undefined,
  }).format(d);
}

function isoToJstDateKey(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;

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

function isPenaltyLikeTimes(t: string | null | undefined): boolean {
  const x = (t ?? "").trim();
  if (!x) return false;
  // 空白揺れを吸収して「ペナルティ」を含むか
  const norm = x.replace(/\s+/g, "");
  return norm.includes("ペナルティ");
}

function isFinishedLikeTimes(t: string | null | undefined): boolean {
  const x = (t ?? "").trim();
  if (!x) return false;
  return x === "終了済" || isPenaltyLikeTimes(x);
}

/**
 * times sort (昇順 → 終了済最後)
 */
function timesSortKey(t: string): number | null {
  const x = t.trim();
  if (!x) return null;
  if (isFinishedLikeTimes(x)) return Number.POSITIVE_INFINITY;

  const m1 = x.match(/^(\d+)\s*'$/);
  if (m1) {
    const mm = Number(m1[1]);
    if (Number.isFinite(mm)) return mm * 60;
  }

  const m2 = x.match(/^(\d{1,3}):(\d{1,2})$/);
  if (m2) {
    const mm = Number(m2[1]);
    const ss = Number(m2[2]);
    if (Number.isFinite(mm) && Number.isFinite(ss)) return mm * 60 + ss;
  }
  return null;
}

function sortTimesAscWithFinishedLast(list: string[]) {
  const uniq = Array.from(new Set(list.map((s) => s.trim()).filter(Boolean)));
  const allowed = uniq.filter((t) => timesSortKey(t) !== null);
  allowed.sort((a, b) => timesSortKey(a)! - timesSortKey(b)!);
  return allowed;
}

/** =========================
 * Page
 * ========================= */
export default function IngestedDataReferenceAdminPage() {
  // 手入力 matchUrl（groupKey単位で上書き）
  const [manualMatchUrlByGroupKey, setManualMatchUrlByGroupKey] = useState<Record<string, string>>({});

  // サーバ絞り込み（国）
  const [country, setCountry] = useState("日本");

  // フロント絞り込み（追加）
  const [keyword, setKeyword] = useState("");

  // 追加：フィルタ
  const [onlyMissingMatchUrl, setOnlyMissingMatchUrl] = useState(false);

  // 追加：要対応のみ（future_masterに無い OR 終了済が無い）
  const [onlyNeedsAttention, setOnlyNeedsAttention] = useState(false);

  // B008
  const [execLoading, setExecLoading] = useState(false);
  const [execError, setExecError] = useState<string | null>(null);
  const [execResult, setExecResult] = useState<ExecTaskResponse | null>(null);

  // paging (group単位)
  const [offset, setOffset] = useState(0);
  const [pageSize, setPageSize] = useState(100);

  // fetch state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [envelope, setEnvelope] = useState<ApiEnvelope | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const FETCH_LIMIT_RAW = 5000;

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("offset", "0");
    params.set("limit", String(FETCH_LIMIT_RAW));
    if (country.trim()) params.set("country", country.trim());
    if (keyword.trim()) params.set("keyword", keyword.trim());
    if (onlyNeedsAttention) params.set("onlyNeedsAttention", "true");
    return `/v1/api/admin/ingested?${params.toString()}`;
  }, [country, keyword, onlyNeedsAttention, offset, pageSize]);

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

  const groupedAll: MatchGroupRow[] = useMemo(() => {
    type Acc = Omit<MatchGroupRow, "timesAllSorted" | "ingestsSortedAsc"> & {
      timesSet: Set<string>;
      ingests: IngestLog[];
      matchStartTimeSourceRegisterTime: string | null;
      // ★追加：data.recordTime の「最新DATA行」の値を保持
      dataRecordTimeSourceRegisterTime: string | null;
    };

    const map = new Map<string, Acc>();

    for (const r of rawRows) {
      const homeRaw = norm(r.data?.homeTeamName) || norm(r.future?.homeTeamName) || "-";
      const awayRaw = norm(r.data?.awayTeamName) || norm(r.future?.awayTeamName) || "-";
      const catRaw = norm(r.data?.dataCategory) || norm(r.future?.gameTeamCategory) || "-";

      const dataGameId = r.data?.gameId != null ? String(r.data.gameId) : "";
      const gid = normKeyPart(dataGameId);

      const dataLink = norm(r.data?.gameLink);
      const futureLink = norm(r.future?.gameLink);
      const mid = extractMidFromUrl(dataLink) || extractMidFromUrl(futureLink) || null;

      const ftIso = norm(r.future?.futureTime) || null;

      const dataRecordTime = norm(r.data?.recordTime) || null; // ★record_time
      const isDataRow = String(r.table).toUpperCase() === "DATA";

      const composite = makeCompositeKey(homeRaw, awayRaw, catRaw);

      // ★分裂しにくい順に
      const groupKey = (gid ? `gid:${gid}` : null) ?? (mid ? `mid:${mid}` : null) ?? (composite ? `cmp:${composite}` : null) ?? `fallback:${r.seq}`;

      const matchId = mid || (gid ? gid : null);

      const matchUrl = (dataLink && dataLink.includes("/match/") ? dataLink : "") || (futureLink && futureLink.includes("/match/") ? futureLink : "") || dataLink || futureLink || null;

      const futureExists = Boolean(r.futureExists) || String(r.table).toUpperCase() === "FUTURE_MASTER" || Boolean(r.future);

      const timesCandidates: string[] = [];
      if (r.data?.times) timesCandidates.push(r.data.times);
      if (Array.isArray(r.timesList)) timesCandidates.push(...r.timesList);

      const hasPenalty = timesCandidates.some((t) => isPenaltyLikeTimes(t));
      const hasFinished =
        Boolean(r.hasFinishedTimes) || // サーバが立ててくれてる場合はそれを優先
        timesCandidates.some((t) => isFinishedLikeTimes(t));

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

          matchStartTimeIso: ftIso,
          matchStartTimeSourceRegisterTime: ftIso ? r.registerTime : null,
          dataRecordTime: isDataRow ? dataRecordTime : null, //
          dataRecordTimeSourceRegisterTime: isDataRow && dataRecordTime ? r.registerTime : null,

          matchId,
          matchUrl,
          hasPenalty,
          futureExists,
          hasFinished,
          latestRegisterTime: r.registerTime,

          timesSet,
          ingests: [ingest],
        });
      } else {
        if (existing.home === "-" && homeRaw !== "-") existing.home = homeRaw;
        if (existing.away === "-" && awayRaw !== "-") existing.away = awayRaw;
        if (existing.category === "-" && catRaw !== "-") existing.category = catRaw;

        if (!existing.matchId && matchId) existing.matchId = matchId;
        if (!existing.matchUrl && matchUrl) existing.matchUrl = matchUrl;

        if (ftIso) {
          if (!existing.matchStartTimeIso) {
            existing.matchStartTimeIso = ftIso;
            existing.matchStartTimeSourceRegisterTime = r.registerTime;
          } else {
            const prev = existing.matchStartTimeSourceRegisterTime ? new Date(existing.matchStartTimeSourceRegisterTime).getTime() : -1;
            const cur = new Date(r.registerTime).getTime();
            if (cur > prev) {
              existing.matchStartTimeIso = ftIso;
              existing.matchStartTimeSourceRegisterTime = r.registerTime;
            }
          }
        }

        if (isDataRow && dataRecordTime) {
          if (!existing.dataRecordTime) {
            existing.dataRecordTime = dataRecordTime;
            existing.dataRecordTimeSourceRegisterTime = r.registerTime;
          } else {
            const prev = existing.dataRecordTimeSourceRegisterTime ? new Date(existing.dataRecordTimeSourceRegisterTime).getTime() : -1;
            const cur = new Date(r.registerTime).getTime();
            if (cur > prev) {
              existing.dataRecordTime = dataRecordTime;
              existing.dataRecordTimeSourceRegisterTime = r.registerTime;
            }
          }
        }

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

        map.set(groupKey, existing);
      }
    }

    const out: MatchGroupRow[] = [];
    for (const v of map.values()) {
      out.push({
        groupKey: v.groupKey,
        home: v.home,
        away: v.away,
        category: v.category,
        matchStartTimeIso: v.matchStartTimeIso ?? null,

        dataRecordTime: v.dataRecordTime ?? null, // ★追加

        matchId: v.matchId ?? null,
        matchUrl: v.matchUrl ?? null,
        futureExists: v.futureExists,
        hasPenalty: v.hasPenalty,
        hasFinished: v.hasFinished,
        timesAllSorted: sortTimesAscWithFinishedLast(Array.from(v.timesSet)),
        ingestsSortedAsc: v.ingests.slice().sort((a, b) => new Date(a.registerTime).getTime() - new Date(b.registerTime).getTime()),
        latestRegisterTime: v.latestRegisterTime,
      });
    }

    out.sort((a, b) => new Date(b.latestRegisterTime).getTime() - new Date(a.latestRegisterTime).getTime());
    return out;
  }, [rawRows]);

  const groupedFiltered = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    let list = groupedAll;

    // (A) matchUrl 空のみ
    if (onlyMissingMatchUrl) {
      list = list.filter((g) => !getEffectiveMatchUrl(g));
    }

    // (B) future_masterにない OR 終了済がない
    if (onlyNeedsAttention) {
      list = list.filter((g) => !g.futureExists || !g.hasFinished);
    }

    // (C) keyword
    if (q) {
      list = list.filter((g) => `${g.home} ${g.away} ${g.category} ${g.groupKey}`.toLowerCase().includes(q));
    }

    return list;
  }, [groupedAll, keyword, onlyMissingMatchUrl, onlyNeedsAttention, manualMatchUrlByGroupKey]);

  const totalGroups = groupedFiltered.length;
  const showingGroups = groupedFiltered.slice(offset, offset + pageSize);

  // expand
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
  const toggleExpand = (k: string) => setExpandedKeys((p) => ({ ...p, [k]: !p[k] }));

  const canPrev = offset > 0;
  const canNext = offset + pageSize < totalGroups;

  // stats (header badges)
  const stats = useMemo(() => {
    const total = groupedFiltered.length;
    const futureOk = groupedFiltered.filter((g) => g.futureExists).length;
    const finished = groupedFiltered.filter((g) => g.hasFinished).length;
    return { total, futureOk, finished };
  }, [groupedFiltered]);

  const missingUrlCount = useMemo(() => groupedAll.filter((g) => !getEffectiveMatchUrl(g)).length, [groupedAll, manualMatchUrlByGroupKey]);

  const needsAttentionCount = useMemo(() => groupedAll.filter((g) => !g.futureExists || !g.hasFinished).length, [groupedAll]);

  function resolveMatchIdPreferUrlMid(matchId: string | null, matchUrl: string | null): string | null {
    const mid = extractMidFromUrl(matchUrl);
    if (mid) return mid;
    const m = (matchId ?? "").trim();
    return m || null;
  }

  function computeMatchDateKeyForB008(g: MatchGroupRow): string | null {
    // 1) future_master.future_time を最優先
    const d1 = g.matchStartTimeIso ? isoToJstDateKey(g.matchStartTimeIso) : null;
    if (d1) return d1;

    // 2) future_timeが無ければ data.recordTime（record_time）
    const d2 = recordTimeToJstDateKey(g.dataRecordTime);
    if (d2) return d2;

    return null;
  }

  function buildFinGettingRequestFromGroups(groups: MatchGroupRow[]): FinGettingRequest {
    const perDate = new Map<string, Map<string, { matchDate: string; matchId: string; matchUrl?: string }>>();

    for (const g of groups) {
      const matchDate = computeMatchDateKeyForB008(g);
      if (!matchDate) continue;

      const mid = resolveMatchIdPreferUrlMid(g.matchId, g.matchUrl);
      if (!mid) continue;

      const url = getEffectiveMatchUrl(g); // ★手入力を優先
      const row: { matchDate: string; matchId: string; matchUrl?: string } = { matchDate, matchId: mid };
      if (url) row.matchUrl = url;

      if (!perDate.has(matchDate)) perDate.set(matchDate, new Map());
      perDate.get(matchDate)!.set(mid, row);
    }

    function isMissingMatchUrl(g: MatchGroupRow): boolean {
      return !getEffectiveMatchUrl(g); // manualもautoも空なら true
    }

    const matches: FinGettingRequest["matches"] = [];
    for (const [, m] of perDate) matches.push(...Array.from(m.values()));
    matches.sort((a, b) => (a.matchDate + a.matchId).localeCompare(b.matchDate + b.matchId));
    return { matches };
  }

  function getEffectiveMatchUrl(g: MatchGroupRow): string | null {
    const manual = (manualMatchUrlByGroupKey[g.groupKey] ?? "").trim();
    if (manual) return manual;

    const auto = (g.matchUrl ?? "").trim();
    return auto || null;
  }

  async function postFinGettingJson(req: FinGettingRequest, signal?: AbortSignal): Promise<ExecTaskResponse> {
    const res = await fetch("/v1/api/admin/fin-getting-json", {
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

  const runB008 = async () => {
    setExecLoading(true);
    setExecError(null);
    setExecResult(null);

    try {
      // ★ここで検証（レンダリング中ではなく、クリック時）
      const badUrls = Object.entries(manualMatchUrlByGroupKey)
        .filter(([, url]) => url.trim())
        .filter(([, url]) => {
          try {
            new URL(url.trim());
            return false;
          } catch {
            return true;
          }
        });

      if (badUrls.length) {
        setExecError(
          `不正なURLがあります: ${badUrls
            .slice(0, 5)
            .map(([k]) => k)
            .join(", ")} ...`,
        );
        return; // ★ここで終了（finally は走って execLoading は false に戻る）
      }

      const req = buildFinGettingRequestFromGroups(groupedFiltered);

      if (req.matches.length === 0) {
        setExecError("対象が0件です（midが取れない/日付が作れない/フィルタで空）");
        return;
      }
      if (req.matches.length > 300) {
        throw new Error(`対象が多すぎます（${req.matches.length}件）。keywordで絞ってから実行してください。`);
      }

      const res = await postFinGettingJson(req);
      setExecResult(res);
    } catch (e: any) {
      setExecError(e?.message ?? String(e));
    } finally {
      setExecLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
        {/* Header (NoticeAdminPage と同じ構造) */}
        <div className="flex items-start md:items-center justify-between gap-4 flex-col md:flex-row">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-violet-600 to-blue-600 text-white p-3 rounded-2xl shadow-lg">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16v16H4zM7 8h10M7 12h10M7 16h10" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">投入済データ参照管理</h1>
              <p className="text-sm text-muted-foreground mt-1">国フィルタで投入済データを参照し、future_master がある場合は試合日時も表示します。B008（fin-getting-json）起動も可能です。</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge tone="blue">total {stats.total}</Badge>
            <Badge tone="emerald">future_master {stats.futureOk}</Badge>
            <Badge tone="violet">finished {stats.finished}</Badge>
            <Badge tone="gray">raw {rawRows.length}</Badge>
            <Badge tone="amber">url空 {missingUrlCount}</Badge>
            <Badge tone="rose">要対応 {needsAttentionCount}</Badge>
          </div>
        </div>

        {/* Alerts */}
        {execError ? <Alert type="error" title="B008起動に失敗しました" message={execError} onClose={() => setExecError(null)} /> : null}
        {execResult ? <Alert type="success" title="JSONを作成してS3へアップロードしました" message={`returnCd: ${execResult.returnCd ?? "-"}`} onClose={() => setExecResult(null)} /> : null}
        {error ? <Alert type="error" title="取得に失敗しました" message={error} onClose={() => setError(null)} /> : null}

        {/* Filter Panel */}
        <Panel
          title="検索条件"
          desc="from/to（登録日時）は使いません。国で取得して、keywordはフロント側で絞り込みます。"
          right={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setOffset(0);
                  void doFetch();
                }}
                disabled={loading}
              >
                {loading ? "更新中..." : "再取得"}
              </Button>
              <Button size="sm" onClick={runB008} disabled={loading || execLoading || groupedFiltered.length === 0}>
                {execLoading ? "B008起動中..." : "B008起動"}
              </Button>
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-800">country（サーバ絞り込み）</div>
              <input
                className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  setOffset(0);
                }}
                placeholder="例）日本"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="text-sm font-semibold text-gray-800">keyword（フロント側絞り込み）</div>
              <input
                className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setOffset(0);
                }}
                placeholder="例）高知 / J2 / ラウンド3 ..."
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={onlyMissingMatchUrl}
                onChange={(e) => {
                  setOnlyMissingMatchUrl(e.target.checked);
                  setOffset(0);
                }}
              />
              matchUrl 未入力のみ
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={onlyNeedsAttention}
                onChange={(e) => {
                  setOnlyNeedsAttention(e.target.checked);
                  setOffset(0);
                }}
              />
              要対応のみ（futureなし または 終了済なし）
            </label>
          </div>

          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <Badge tone="gray">raw fetch limit {FETCH_LIMIT_RAW}</Badge>
            {envelope && envelope.total > rawRows.length ? (
              <Badge tone="amber">
                注意: total={envelope.total} / 取得={rawRows.length}（limitで打ち切り）
              </Badge>
            ) : (
              <Badge tone="emerald">取得OK</Badge>
            )}

            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-muted-foreground">page size</span>
              <select
                className="rounded-xl border bg-white px-3 py-2 text-sm"
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
        </Panel>

        {/* List Panel */}
        <Panel
          title="一覧"
          desc="新しい順。カードをクリックで詳細を開閉します。future_master がある場合は試合日時を表示。"
          right={
            <div className="flex items-center gap-2">
              <Badge tone="gray">
                offset {offset} / showing {Math.min(pageSize, Math.max(0, totalGroups - offset))} / total {totalGroups}
              </Badge>
              <Button variant="outline" size="sm" disabled={!canPrev} onClick={() => setOffset((v) => Math.max(0, v - pageSize))}>
                Prev
              </Button>
              <Button variant="outline" size="sm" disabled={!canNext} onClick={() => setOffset((v) => Math.min(totalGroups, v + pageSize))}>
                Next
              </Button>
            </div>
          }
        >
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-2/3" />
            </div>
          ) : showingGroups.length === 0 ? (
            <div className="text-sm text-muted-foreground">データがありません。</div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {showingGroups.map((g) => {
                const expanded = Boolean(expandedKeys[g.groupKey]);
                const summary = `${g.home} vs ${g.away} / ${g.category}`;

                return (
                  <div key={g.groupKey} className="rounded-2xl border bg-white hover:shadow-sm transition-shadow p-4">
                    <button type="button" className="w-full text-left" onClick={() => toggleExpand(g.groupKey)}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-lg font-extrabold text-gray-900 truncate">{summary}</div>

                          <div className="mt-1 text-sm text-muted-foreground">
                            試合日時:{" "}
                            {g.futureExists && g.matchStartTimeIso ? <span className="font-semibold text-gray-900">{fmtJstFixed(g.matchStartTimeIso)}</span> : <span className="text-gray-400">-</span>}
                          </div>

                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            {g.futureExists ? <Badge tone="emerald">future_masterに存在</Badge> : <Badge tone="rose">future_masterに存在しない</Badge>}
                            {g.hasFinished ? <Badge tone="violet">終了済あり</Badge> : <Badge tone="amber">終了済なし</Badge>}
                            {g.hasPenalty ? <Badge tone="violet">ペナルティあり</Badge> : null}
                            {g.timesAllSorted.length ? <Badge tone="gray">times {g.timesAllSorted.length}</Badge> : <Badge tone="gray">times 0</Badge>}
                            <Badge tone="gray">{g.groupKey}</Badge>
                          </div>
                        </div>

                        <div className="shrink-0 text-xs text-muted-foreground">{expanded ? "▲" : "▼"}</div>
                      </div>
                    </button>

                    {expanded ? (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="rounded-2xl border bg-gray-50 px-4 py-3">
                          <div className="text-sm font-extrabold text-gray-900">Meta</div>
                          <div className="mt-2 text-sm text-gray-800 space-y-1">
                            <div>
                              <span className="text-muted-foreground">home</span> {g.home}
                            </div>
                            <div>
                              <span className="text-muted-foreground">away</span> {g.away}
                            </div>
                            <div>
                              <span className="text-muted-foreground">category</span> {g.category}
                            </div>
                            <div>
                              <span className="text-muted-foreground">matchStartTime</span> {fmtJstFixed(g.matchStartTimeIso, true)}
                            </div>
                            <div>
                              <span className="text-muted-foreground">latestRegisterTime</span> {fmtJstFixed(g.latestRegisterTime, true)}
                            </div>
                            <div>
                              <span className="text-muted-foreground">matchId(mid)</span> {g.matchId ?? "-"}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">matchUrl（手動入力可）</div>

                            <input
                              className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-xs font-mono"
                              placeholder="https://www.flashscore.co.jp/match/.../?mid=XXXX"
                              value={manualMatchUrlByGroupKey[g.groupKey] ?? g.matchUrl ?? ""}
                              onChange={(e) => {
                                const v = e.target.value;
                                setManualMatchUrlByGroupKey((p) => ({ ...p, [g.groupKey]: v }));
                              }}
                            />

                            <div className="mt-2 flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setManualMatchUrlByGroupKey((p) => {
                                    const next = { ...p };
                                    delete next[g.groupKey]; // 手入力上書きを解除 → 自動取得に戻る
                                    return next;
                                  });
                                }}
                              >
                                手入力を解除
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const v = (manualMatchUrlByGroupKey[g.groupKey] ?? g.matchUrl ?? "").trim();
                                  navigator.clipboard?.writeText(v).catch(() => {});
                                }}
                                disabled={!(manualMatchUrlByGroupKey[g.groupKey] ?? g.matchUrl ?? "").trim()}
                              >
                                URLコピー
                              </Button>
                            </div>

                            <div className="mt-1 text-xs text-muted-foreground">JSON には手入力が優先で載ります（空なら自動取得を使用）</div>
                          </div>
                        </div>

                        <div className="rounded-2xl border bg-gray-50 px-4 py-3">
                          <div className="text-sm font-extrabold text-gray-900">times</div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {g.timesAllSorted.length ? (
                              g.timesAllSorted.map((t) => (
                                <Badge key={t} tone={isFinishedLikeTimes(t) ? "violet" : "gray"}>
                                  {t}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">times がありません</span>
                            )}
                          </div>
                        </div>

                        <div className="md:col-span-2 rounded-2xl border bg-white px-4 py-3">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-extrabold text-gray-900">投入ログ（昇順）</div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard?.writeText(g.groupKey).catch(() => {});
                              }}
                            >
                              keyコピー
                            </Button>
                          </div>

                          <div className="mt-3 overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b text-xs text-muted-foreground">
                                  <th className="py-2 pr-3 text-left">seq</th>
                                  <th className="py-2 pr-3 text-left">table</th>
                                  <th className="py-2 pr-3 text-left">registerTime(JST)</th>
                                  <th className="py-2 pr-3 text-left">updateTime(JST)</th>
                                  <th className="py-2 pr-3 text-left">times</th>
                                </tr>
                              </thead>
                              <tbody>
                                {g.ingestsSortedAsc.map((it) => (
                                  <tr key={`${it.table}:${it.seq}`} className="border-b last:border-b-0">
                                    <td className="py-2 pr-3 font-mono text-xs">{it.seq}</td>
                                    <td className="py-2 pr-3 text-xs">{it.table}</td>
                                    <td className="py-2 pr-3 text-xs">{fmtJstFixed(it.registerTime, true)}</td>
                                    <td className="py-2 pr-3 text-xs">{fmtJstFixed(it.updateTime ?? null, true)}</td>
                                    <td className="py-2 pr-3 text-xs">
                                      {it.times ? <Badge tone={isFinishedLikeTimes(it.times) ? "violet" : "gray"}>{it.times}</Badge> : <span className="text-gray-400">-</span>}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
