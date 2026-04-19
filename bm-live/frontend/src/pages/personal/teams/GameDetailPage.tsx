import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchGameDetail, type GameDetail } from "../../../api/gameDetails";

type StatRow = {
  label: string;
  home: string;
  away: string;
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

function buildStatRows(detail: GameDetail): StatRow[] {
  const home = (detail.home ?? {}) as Record<string, unknown>;
  const away = (detail.away ?? {}) as Record<string, unknown>;

  const defs: Array<{
    label: string;
    keys: string[];
    formatter?: (value: unknown) => string;
  }> = [
    { label: "xG", keys: ["expGoal", "xg", "expectedGoals", "homeExp"], formatter: toText },
    { label: "シュート", keys: ["shoot", "shots", "totalShots"], formatter: toText },
    { label: "枠内シュート", keys: ["shootIn", "shotsOnTarget", "homeShootIn"], formatter: toText },
    { label: "支配率", keys: ["ballPossession", "possession", "possessionRate"], formatter: formatPercent },
    { label: "CK", keys: ["cornerKick", "corners"], formatter: toText },
    { label: "ファウル", keys: ["foul", "fouls"], formatter: toText },
    { label: "オフサイド", keys: ["offside", "offsides"], formatter: toText },
    { label: "警告", keys: ["yellowCard", "yellowCards"], formatter: toText },
    { label: "退場", keys: ["redCard", "redCards"], formatter: toText },
    { label: "パス成功率", keys: ["passSuccess", "passSuccessRate"], formatter: formatPercent },
  ];

  return defs
    .map((def) => {
      const homeValue = readValue(home, def.keys);
      const awayValue = readValue(away, def.keys);

      if (isNil(homeValue) && isNil(awayValue)) {
        return null;
      }

      const formatter = def.formatter ?? toText;
      return {
        label: def.label,
        home: formatter(homeValue),
        away: formatter(awayValue),
      };
    })
    .filter((row): row is StatRow => row !== null);
}

function LoadingBlock() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-slate-200" />
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 h-6 w-72 rounded bg-slate-200" />
          <div className="grid grid-cols-3 items-center gap-4">
            <div className="h-24 rounded bg-slate-100" />
            <div className="h-16 rounded bg-slate-100" />
            <div className="h-24 rounded bg-slate-100" />
          </div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="h-6 w-40 rounded bg-slate-200" />
          <div className="mt-4 space-y-3">
            <div className="h-12 rounded bg-slate-100" />
            <div className="h-12 rounded bg-slate-100" />
            <div className="h-12 rounded bg-slate-100" />
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
        <div className="mb-4 text-lg font-bold text-slate-900">試合スタッツ</div>

        {statRows.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">表示できるスタッツがありません。</div>
        ) : (
          <div className="space-y-3">
            {statRows.map((row) => (
              <div key={row.label} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                <div className="text-left text-base font-semibold text-slate-900">{row.home}</div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{row.label}</div>
                <div className="text-right text-base font-semibold text-slate-900">{row.away}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
