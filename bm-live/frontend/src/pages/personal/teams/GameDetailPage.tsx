import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchGameDetail, type GameDetail } from "../../../api/gameDetails";

type CardBadgeProps = {
  color: "yellow" | "red";
  count?: unknown;
};

type TeamCardSummaryProps = {
  yellow?: unknown;
  red?: unknown;
  align?: "left" | "center" | "right";
};

type StatRow = {
  label: string;
  home: string;
  away: string;
  homeValue: number | null;
  awayValue: number | null;
};

type StatBarRowProps = {
  row: StatRow;
};

const GAME_DETAIL_SEQ_KEY = "game-detail-seq";

function isNil(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

function toText(value: unknown, fallback = "-"): string {
  if (isNil(value)) return fallback;
  const text = String(value).trim();
  return text.length > 0 ? text : fallback;
}

function toScoreText(value: unknown): string {
  if (isNil(value)) return "-";
  const text = String(value).trim();
  return text === "" ? "-" : text;
}

function toCount(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const n = Number(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function toNumeric(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  const raw = String(value).trim();
  if (!raw) return null;

  const normalized = raw.replace(/[%％,]/g, "").trim();
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function formatDateTime(value: unknown): string {
  if (isNil(value)) return "-";
  const raw = String(value).trim();
  if (!raw) return "-";

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatNumber(value: unknown): string {
  if (isNil(value)) return "-";

  const num = typeof value === "number" ? value : Number(String(value).replace(/,/g, "").trim());

  if (Number.isNaN(num)) {
    return toText(value);
  }

  return num.toLocaleString("ja-JP");
}

function formatPercent(value: unknown): string {
  if (isNil(value)) return "-";
  const raw = String(value).trim();
  if (!raw) return "-";
  return raw.endsWith("%") ? raw : `${raw}%`;
}

function formatMatchTime(value: unknown): string {
  if (isNil(value)) return "-";
  const text = String(value).trim();
  if (!text) return "-";
  return text;
}

function getWinnerLabel(winner: unknown): string {
  const value = String(winner ?? "").toUpperCase();
  switch (value) {
    case "HOME":
      return "ホーム勝利";
    case "AWAY":
      return "アウェイ勝利";
    case "DRAW":
      return "引き分け";
    case "LIVE":
      return "LIVE";
    default:
      return "-";
  }
}

function getWinnerTone(winner: unknown): string {
  const value = String(winner ?? "").toUpperCase();
  switch (value) {
    case "HOME":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "AWAY":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "DRAW":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "LIVE":
      return "bg-rose-100 text-rose-700 border-rose-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

function isLiveTimes(times: unknown): boolean {
  const text = String(times ?? "").trim();
  if (!text) return false;

  if (/終了|FT|AET|PEN|ABAN|CANC|POSTPONED/i.test(text)) {
    return false;
  }
  return true;
}

function readValue(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    const value = record[key];
    if (!isNil(value) && String(value).trim() !== "") {
      return value;
    }
  }
  return null;
}

function CardBadge({ color, count }: CardBadgeProps) {
  const safeCount = toCount(count);

  const cardClass = color === "yellow" ? "bg-yellow-400 border-yellow-500" : "bg-red-500 border-red-600";

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 shadow-sm">
      <span className={`inline-block h-4 w-3 rounded-[2px] border ${cardClass}`} aria-hidden="true" />
      <span className="text-xs font-semibold text-slate-700">{safeCount}</span>
    </div>
  );
}

function TeamCardSummary({ yellow, red, align = "center" }: TeamCardSummaryProps) {
  const justify = align === "left" ? "justify-start" : align === "right" ? "justify-end" : "justify-center";

  return (
    <div className={`flex items-center gap-2 ${justify}`}>
      <CardBadge color="yellow" count={yellow} />
      <CardBadge color="red" count={red} />
    </div>
  );
}

function StatBarRow({ row }: StatBarRowProps) {
  const homeVal = row.homeValue ?? 0;
  const awayVal = row.awayValue ?? 0;
  const total = homeVal + awayVal;

  const homeRate = total > 0 ? (homeVal / total) * 100 : 50;
  const awayRate = total > 0 ? (awayVal / total) * 100 : 50;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 grid grid-cols-[64px_1fr_64px] items-center gap-2 text-sm">
        <div className="text-left text-base font-bold text-slate-900">{row.home}</div>
        <div className="text-center text-xs font-semibold text-slate-500">{row.label}</div>
        <div className="text-right text-base font-bold text-slate-900">{row.away}</div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex justify-end">
          <div className="h-3 w-full max-w-[240px] overflow-hidden rounded-full bg-slate-100">
            <div className="ml-auto h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${homeRate}%` }} />
          </div>
        </div>

        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">VS</div>

        <div className="flex justify-start">
          <div className="h-3 w-full max-w-[240px] overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${awayRate}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function toRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }
  return {};
}

function buildStatRows(detail: GameDetail): StatRow[] {
  const home = toRecord(detail.home);
  const away = toRecord(detail.away);

  const defs = [
    { label: "xG", keys: ["xg", "inGoalXg"] },
    { label: "支配率", keys: ["possession"] },
    { label: "シュート", keys: ["shots"] },
    { label: "枠内シュート", keys: ["shotsOn", "shotsOnTarget"] },
    { label: "枠外シュート", keys: ["shotsOff"] },
    { label: "ブロックシュート", keys: ["blocks"] },
    { label: "PA内シュート", keys: ["boxShotsIn"] },
    { label: "PA外シュート", keys: ["boxShotsOut"] },
    { label: "CK", keys: ["corners"] },
    { label: "オフサイド", keys: ["offsides", "offside"] },
    { label: "ファウル", keys: ["fouls", "foul"] },
    { label: "FK", keys: ["freeKicks"] },
    { label: "スローイン", keys: ["throwIns"] },
    { label: "ボックスタッチ", keys: ["boxTouches"] },
    { label: "ビッグチャンス", keys: ["bigChances"] },
    { label: "GKセーブ", keys: ["saves"] },
    { label: "パス成功率", keys: ["passSuccess", "passesAcc", "accuratePassesRate"] },
    { label: "パス数", keys: ["passes"] },
    { label: "ロングパス", keys: ["longPasses"] },
    { label: "クロス", keys: ["crosses"] },
    { label: "タックル", keys: ["tackles"] },
    { label: "クリア", keys: ["clearances"] },
    { label: "デュエル", keys: ["duels"] },
    { label: "インターセプト", keys: ["interceptions"] },
    { label: "ポスト直撃", keys: ["goalPost"] },
    { label: "ヘディング得点", keys: ["headGoals"] },
    { label: "イエロー", keys: ["yc", "yellowCard", "yellowCards"] },
    { label: "レッド", keys: ["rc", "redCard", "redCards"] },
  ] as const;

  return defs.reduce<StatRow[]>((rows, def) => {
    const hRaw = readValue(home, [...def.keys]);
    const aRaw = readValue(away, [...def.keys]);

    if (isNil(hRaw) && isNil(aRaw)) {
      return rows;
    }

    const isPercent = def.label === "支配率" || def.label === "パス成功率";

    rows.push({
      label: def.label,
      home: isPercent ? formatPercent(hRaw) : toText(hRaw),
      away: isPercent ? formatPercent(aRaw) : toText(aRaw),
      homeValue: toNumeric(hRaw),
      awayValue: toNumeric(aRaw),
    });

    return rows;
  }, []);
}

function LoadingBlock() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-slate-200" />
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 h-6 w-72 rounded bg-slate-200" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="h-28 rounded bg-slate-100" />
            <div className="h-20 rounded bg-slate-100" />
            <div className="h-28 rounded bg-slate-100" />
          </div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="h-6 w-40 rounded bg-slate-200" />
          <div className="mt-4 space-y-3">
            <div className="h-16 rounded bg-slate-100" />
            <div className="h-16 rounded bg-slate-100" />
            <div className="h-16 rounded bg-slate-100" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GameDetailPage() {
  const navigate = useNavigate();

  const seq = useMemo(() => {
    const raw = sessionStorage.getItem(GAME_DETAIL_SEQ_KEY);
    if (!raw) return null;

    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, []);

  const {
    data: detail,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<GameDetail, Error>({
    queryKey: ["game-detail", seq],
    queryFn: () => fetchGameDetail(seq!),
    enabled: !!seq,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const statRows = useMemo(() => {
    if (!detail) return [];
    return buildStatRows(detail);
  }, [detail]);

  if (!seq) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-4">
          <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center text-sm font-medium text-sky-700 hover:text-sky-900">
            ← 前の画面へ戻る
          </button>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800">試合情報が見つかりません。ライブ一覧から対象試合を選択して開いてください。</div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingBlock />;
  }

  if (isError || !detail) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center text-sm font-medium text-sky-700 hover:text-sky-900">
            ← 前の画面へ戻る
          </button>

          <button type="button" onClick={() => refetch()} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            再読み込み
          </button>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
          試合詳細の取得に失敗しました。
          <div className="mt-2 text-sm opacity-80">{error?.message ?? "unknown error"}</div>
        </div>
      </div>
    );
  }

  const isLive = String(detail.winner ?? "").toUpperCase() === "LIVE" || isLiveTimes(detail.times);

  const homeName = toText(detail.home?.name);
  const awayName = toText(detail.away?.name);
  const homeScore = toScoreText(detail.home?.score);
  const awayScore = toScoreText(detail.away?.score);

  const homeCardYellow = (detail.home as Record<string, unknown> | undefined) ? readValue(detail.home as Record<string, unknown>, ["yc", "yellowCard", "yellowCards"]) : null;
  const homeCardRed = (detail.home as Record<string, unknown> | undefined) ? readValue(detail.home as Record<string, unknown>, ["rc", "redCard", "redCards"]) : null;
  const awayCardYellow = (detail.away as Record<string, unknown> | undefined) ? readValue(detail.away as Record<string, unknown>, ["yc", "yellowCard", "yellowCards"]) : null;
  const awayCardRed = (detail.away as Record<string, unknown> | undefined) ? readValue(detail.away as Record<string, unknown>, ["rc", "redCard", "redCards"]) : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center text-sm font-medium text-sky-700 hover:text-sky-900">
          ← 前の画面へ戻る
        </button>

        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <span className={isFetching ? "animate-spin" : ""}>↻</span>
          再読み込み
        </button>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{toText(detail.competition)}</span>

          {detail.roundNo !== null && detail.roundNo !== undefined && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Round {detail.roundNo}</span>}

          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getWinnerTone(detail.winner)}`}>{getWinnerLabel(detail.winner)}</span>

          {isLive && <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">ライブ</span>}
        </div>

        <div className="mb-6 text-sm text-slate-500">
          試合時間: <span className="font-medium text-slate-700">{formatMatchTime(detail.times)}</span>
          <span className="mx-2 text-slate-300">|</span>
          更新時刻: <span className="font-medium text-slate-700">{formatDateTime(detail.recordedAt)}</span>
        </div>

        <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl bg-slate-50 p-6 text-center">
            <div className="mb-2 text-sm text-slate-500">HOME</div>

            <div className="mb-4">
              <TeamCardSummary yellow={homeCardYellow} red={homeCardRed} align="center" />
            </div>

            <div className="text-xl font-bold text-slate-900 md:text-2xl">{homeName}</div>

            {detail.home?.manager && <div className="mt-2 text-sm text-slate-500">監督: {toText(detail.home.manager)}</div>}
          </div>

          <div className="text-center">
            <div className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
              {homeScore}
              <span className="mx-3 text-slate-300">-</span>
              {awayScore}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-6 text-center">
            <div className="mb-2 text-sm text-slate-500">AWAY</div>

            <div className="mb-4">
              <TeamCardSummary yellow={awayCardYellow} red={awayCardRed} align="center" />
            </div>

            <div className="text-xl font-bold text-slate-900 md:text-2xl">{awayName}</div>

            {detail.away?.manager && <div className="mt-2 text-sm text-slate-500">監督: {toText(detail.away.manager)}</div>}
          </div>
        </div>

        {(detail.link || detail.venue?.stadium || detail.venue?.audience || detail.venue?.capacity) && (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="mb-3 text-sm font-semibold text-slate-700">会場情報</div>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">スタジアム</dt>
                  <dd className="text-right font-medium text-slate-800">{toText(detail.venue?.stadium)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">観客数</dt>
                  <dd className="text-right font-medium text-slate-800">{formatNumber(detail.venue?.audience)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">収容人数</dt>
                  <dd className="text-right font-medium text-slate-800">{formatNumber(detail.venue?.capacity)}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="mb-3 text-sm font-semibold text-slate-700">関連リンク</div>
              {detail.link ? (
                <a href={detail.link} target="_blank" rel="noreferrer" className="inline-flex items-center text-sm font-medium text-sky-700 hover:text-sky-900">
                  外部リンクを開く ↗
                </a>
              ) : (
                <div className="text-sm text-slate-500">リンクはありません</div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-1 text-lg font-bold text-slate-900">試合スタッツ</div>
        <div className="mb-4 text-sm text-slate-500">数値比較をバーグラフで表示しています</div>

        {statRows.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">表示できるスタッツがありません。</div>
        ) : (
          <div className="space-y-3">
            {statRows.map((row) => (
              <StatBarRow key={row.label} row={row} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
