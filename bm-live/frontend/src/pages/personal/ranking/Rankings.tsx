// データ別のランキングと順位の変遷（/rankings。2026-11-28 追加）
//  国・リーグ → データを選ぶと、現在のランキング（左）と、ラウンドごとの順位の変遷グラフ（右）を出す。
//  ・グラフの点と線は team_color_master の色。2色のチームは点を左右で塗り分ける（左 = メイン、右 = サブ）。
//  ・そのラウンドの試合が無い（取れていない・未反映）ところは点を出さず、線もつなげない。
//  ・表の行・グラフの線・点を押すとそのチームを強調（複数可）。強調したチーム以外の線はほぼ見えなくする。もう一度押すと解除。
//  ・強調していないときは、線にカーソルを乗せたチームを一時的に強調する。
//  ・選んだ国・リーグ・データは URL（?country=&league=&metric=）に残す。
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import AppHeader from "../../../components/layout/AppHeader";
import { TeamLink } from "../teams/TeamForm";
import { fetchRanking, fetchRankingLeagues, fetchRankingMetrics } from "../../../api/ranking/rankingapi";
import type { RankingMetric, RankingResponse, RankingTeam } from "../../../api/ranking/rankingapi";

export const RANKINGS_PATH = "/rankings";

/** 色が無いチームの色 */
const FALLBACK = ["#64748b", "#94a3b8", "#475569", "#a1a1aa", "#71717a"];

/** 明るさ（0〜1）。白に近い色は線が見えないので使い分ける */
function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

type TeamColor = { main: string; sub: string | null; line: string };

function teamColor(t: RankingTeam, i: number): TeamColor {
  const main = t.colorMain ?? FALLBACK[i % FALLBACK.length];
  const sub = t.colorSub && t.colorSub.toUpperCase() !== main.toUpperCase() ? t.colorSub : null;
  // 線: メインが白に近いときはサブ（サブも白っぽければ灰色）
  let line = main;
  if (luminance(main) > 0.88) line = sub && luminance(sub) <= 0.88 ? sub : "#9ca3af";
  return { main, sub, line };
}

/** 点（2色なら左 = メイン・右 = サブの半円ずつ。白でも見えるよう灰色の縁） */
function ColorDot({ cx, cy, c, r = 4.5, dim = false }: { cx: number; cy: number; c: TeamColor; r?: number; dim?: boolean }) {
  const op = dim ? 0.08 : 1;
  if (!c.sub) {
    return <circle cx={cx} cy={cy} r={r} fill={c.main} stroke="#6b7280" strokeWidth={0.8} opacity={op} />;
  }
  return (
    <g opacity={op}>
      <path d={`M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy + r} Z`} fill={c.main} />
      <path d={`M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} Z`} fill={c.sub} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#6b7280" strokeWidth={0.8} />
    </g>
  );
}

/** 表・凡例用の色の丸 */
function Swatch({ c }: { c: TeamColor }) {
  return (
    <svg width={14} height={14} viewBox="0 0 14 14" className="shrink-0">
      <ColorDot cx={7} cy={7} r={6} c={c} />
    </svg>
  );
}

function fmt(v: number | null, scale: number, unit: string): string {
  if (v == null) return "-";
  const s = v.toFixed(scale);
  return unit && unit !== "%" ? `${s}` : unit === "%" ? `${s}%` : s;
}

export default function Rankings() {
  const [params, setParams] = useSearchParams();
  const country = params.get("country") ?? "";
  const league = params.get("league") ?? "";
  const metric = params.get("metric") ?? "";

  const leagues = useQuery({ queryKey: ["ranking-leagues"], queryFn: fetchRankingLeagues, staleTime: 10 * 60_000 });
  const metrics = useQuery({
    queryKey: ["ranking-metrics", country, league],
    queryFn: () => fetchRankingMetrics(country, league),
    enabled: !!country && !!league,
    staleTime: 5 * 60_000,
  });
  const ranking = useQuery({
    queryKey: ["ranking", country, league, metric],
    queryFn: () => fetchRanking(country, league, metric),
    enabled: !!country && !!league && !!metric,
    staleTime: 5 * 60_000,
  });

  const setLeague = (key: string) => {
    const [c, l] = key ? key.split("|") : ["", ""];
    const next = new URLSearchParams();
    if (c) next.set("country", c);
    if (l) next.set("league", l);
    if (metric) next.set("metric", metric);
    setParams(next, { replace: true });
  };
  const setMetric = (m: string) => {
    const next = new URLSearchParams(params);
    if (m) next.set("metric", m);
    else next.delete("metric");
    setParams(next, { replace: true });
  };

  const result = (metrics.data?.metrics ?? []).filter((m) => m.type === "RESULT");
  const stat = (metrics.data?.metrics ?? []).filter((m) => m.type === "STAT");
  const selectedMetric: RankingMetric | undefined = metrics.data?.metrics.find((m) => m.key === metric);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="ランキング" subtitle="データを選ぶと、今の順位と、ラウンドごとの順位の移り変わりを表示します" />
      <main className="container mx-auto max-w-6xl space-y-4 px-4 py-6">
        <div className="flex flex-wrap items-end gap-3 rounded-2xl border bg-card p-4">
          <label className="flex min-w-[14rem] flex-col gap-1 text-xs">
            <span className="text-muted-foreground">国・リーグ</span>
            <select
              value={country && league ? `${country}|${league}` : ""}
              onChange={(e) => setLeague(e.target.value)}
              className="rounded-md border bg-background px-2 py-1.5 text-sm"
              data-testid="select-league"
            >
              <option value="">選んでください</option>
              {(leagues.data ?? []).map((l) => (
                <option key={`${l.country}|${l.league}`} value={`${l.country}|${l.league}`}>
                  {l.country} / {l.league}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-[16rem] flex-col gap-1 text-xs">
            <span className="text-muted-foreground">データ</span>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              disabled={!country || !league || metrics.isLoading}
              className="rounded-md border bg-background px-2 py-1.5 text-sm disabled:opacity-50"
              data-testid="select-metric"
            >
              <option value="">選んでください</option>
              {result.length > 0 && (
                <optgroup label="結果">
                  {result.map((m) => (
                    <option key={m.key} value={m.key} disabled={!m.available}>
                      {m.label}
                    </option>
                  ))}
                </optgroup>
              )}
              {stat.length > 0 && (
                <optgroup label={metrics.data?.source === "STATS" ? "スタッツ" : "スタッツ（このリーグは統計ができてから）"}>
                  {stat.map((m) => (
                    <option key={m.key} value={m.key} disabled={!m.available}>
                      {m.label}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </label>
          {metrics.data?.source === "STATIC" && (
            <p className="text-[11px] text-muted-foreground">このリーグは統計がまだ無いため、終了済の試合から出せる「結果」のデータだけ選べます。</p>
          )}
        </div>

        {!country || !league ? (
          <Empty>国・リーグを選んでください</Empty>
        ) : !metric ? (
          <Empty>データを選んでください</Empty>
        ) : ranking.isLoading ? (
          <Empty>読込中...</Empty>
        ) : ranking.error ? (
          <Empty>取得に失敗しました: {(ranking.error as Error).message}</Empty>
        ) : ranking.data ? (
          <RankingView d={ranking.data} unitLabel={selectedMetric?.unit ?? ranking.data.unit} />
        ) : null}
      </main>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">{children}</div>;
}

function RankingView({ d, unitLabel }: { d: RankingResponse; unitLabel: string }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hovered, setHovered] = useState<string | null>(null);
  const toggle = (team: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(team)) n.delete(team);
      else n.add(team);
      return n;
    });

  const colors = useMemo(() => d.teams.map((t, i) => teamColor(t, i)), [d.teams]);
  const data = useMemo(
    () =>
      d.rounds.map((round, ri) => {
        const row: Record<string, number | null> = { round };
        d.teams.forEach((t, i) => {
          row[`t${i}`] = t.series[ri]?.rank ?? null;
          row[`v${i}`] = t.series[ri]?.value ?? null;
        });
        return row;
      }),
    [d],
  );
  const maxRank = Math.max(1, ...d.teams.flatMap((t) => t.series.map((p) => p.rank ?? 0)));
  const anySelected = selected.size > 0;
  // 強調するチーム（選んだチーム。選んでいなければカーソルを乗せたチーム）
  const focus: Set<string> = anySelected ? selected : hovered ? new Set([hovered]) : new Set();
  const anyFocus = focus.size > 0;
  // 強調するチームの線を最後に描く（ほかの線の上に出す）
  const order = d.teams.map((t, i) => i).sort((a, b) => Number(focus.has(d.teams[a].team)) - Number(focus.has(d.teams[b].team)));

  return (
    <div className="space-y-2">
      {d.notes.map((n) => (
        <p key={n} className="text-[11px] text-muted-foreground">
          ※ {n}
        </p>
      ))}
      {d.teams.length === 0 ? (
        <Empty>表示できるデータがありません</Empty>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(18rem,22rem)_1fr]">
          {/* 現在のランキング */}
          <div className="rounded-2xl border bg-card p-3">
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <div className="text-sm font-bold">{d.label}</div>
              <div className="text-[10px] text-muted-foreground">
                {d.source === "STATIC" ? "終了済の試合から" : d.season ? `${d.season} シーズン` : ""}
              </div>
            </div>
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-[10px] text-muted-foreground">
                  <th className="px-1 py-1 text-right font-normal">#</th>
                  <th className="px-1 py-1 text-left font-normal">チーム</th>
                  <th className="px-1 py-1 text-right font-normal">{unitLabel ? `値（${unitLabel}）` : "値"}</th>
                  <th className="px-1 py-1 text-right font-normal">試合</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {d.teams.map((t, i) => {
                  const on = selected.has(t.team);
                  return (
                    <tr
                      key={t.team}
                      onClick={() => toggle(t.team)}
                      className={`cursor-pointer hover:bg-accent/50 ${on ? "bg-accent" : ""} ${anySelected && !on ? "opacity-50" : ""}`}
                      onMouseEnter={() => setHovered(t.team)}
                      onMouseLeave={() => setHovered((h) => (h === t.team ? null : h))}
                      data-testid={`row-ranking-${i}`}
                    >
                      <td className="px-1 py-1 text-right font-mono font-bold">{t.rank ?? "-"}</td>
                      <td className="max-w-[11rem] px-1 py-1">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <Swatch c={colors[i]} />
                          <span className="truncate" onClick={(e) => e.stopPropagation()}>
                            <TeamLink country={d.country} league={d.league} team={t.team} className={`truncate ${on ? "font-bold" : ""}`} />
                          </span>
                        </div>
                      </td>
                      <td className="px-1 py-1 text-right font-mono">{fmt(t.value, d.scale, d.unit)}</td>
                      <td className="px-1 py-1 text-right font-mono text-muted-foreground">{t.games}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-2 text-[10px] text-muted-foreground">
              {d.higherBetter ? "値が大きいほど上位" : "値が小さいほど上位"}。行またはグラフの線・点を押すと、そのチームを強調します（複数可。もう一度押すと解除）。チーム名を押すとチームの結果へ。
            </p>
          </div>

          {/* 順位の変遷 */}
          <div className="rounded-2xl border bg-card p-3">
            <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
              <div className="text-sm font-bold">順位の変遷（ラウンドごと）</div>
              {anySelected && (
                <button type="button" onClick={() => setSelected(new Set())} className="text-[11px] font-bold text-muted-foreground hover:text-foreground">
                  強調を解除
                </button>
              )}
            </div>
            <div className="h-[420px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.4} />
                  <XAxis dataKey="round" tick={{ fontSize: 11 }} label={{ value: "ラウンド", position: "insideBottomRight", offset: -4, fontSize: 10 }} />
                  <YAxis reversed domain={[1, maxRank]} allowDecimals={false} tick={{ fontSize: 11 }} width={28} interval={0} ticks={Array.from({ length: maxRank }, (_, k) => k + 1)} />
                  <Tooltip content={<RankTooltip d={d} colors={colors} selected={selected} />} />
                  {order.map((i) => {
                    const t = d.teams[i];
                    const on = focus.has(t.team);
                    const dim = anyFocus && !on;
                    const onClick = () => toggle(t.team);
                    return (
                      <Line
                        key={t.team}
                        type="linear"
                        dataKey={`t${i}`}
                        name={t.team}
                        stroke={colors[i].line}
                        strokeWidth={on ? 3.5 : 1.5}
                        strokeOpacity={dim ? 0.07 : on ? 1 : 0.85}
                        connectNulls={false}
                        isAnimationActive={false}
                        style={{ cursor: "pointer" }}
                        onClick={onClick}
                        onMouseEnter={() => setHovered(t.team)}
                        onMouseLeave={() => setHovered((h) => (h === t.team ? null : h))}
                        dot={(p: { cx?: number; cy?: number; value?: number | null; index?: number }) =>
                          p.cx == null || p.cy == null || p.value == null ? (
                            <g key={`d${i}-${p.index}`} />
                          ) : (
                            <g
                              key={`d${i}-${p.index}`}
                              style={{ cursor: "pointer" }}
                              onClick={onClick}
                              onMouseEnter={() => setHovered(t.team)}
                              onMouseLeave={() => setHovered((h) => (h === t.team ? null : h))}
                            >
                              <ColorDot cx={p.cx} cy={p.cy} c={colors[i]} dim={dim} r={on ? 5.5 : 4.5} />
                            </g>
                          )
                        }
                        activeDot={false}
                      />
                    );
                  })}
                  {/* 押しやすいように、見えない太い線を重ねる（押す・カーソルを乗せる判定だけ） */}
                  {d.teams.map((t, i) => (
                    <Line
                      key={`hit-${t.team}`}
                      type="linear"
                      dataKey={`t${i}`}
                      stroke="transparent"
                      strokeWidth={10}
                      connectNulls={false}
                      isAnimationActive={false}
                      dot={false}
                      activeDot={false}
                      legendType="none"
                      style={{ cursor: "pointer" }}
                      onClick={() => toggle(t.team)}
                      onMouseEnter={() => setHovered(t.team)}
                      onMouseLeave={() => setHovered((h) => (h === t.team ? null : h))}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              点はチームカラー（2色のチームは左 = メイン、右 = サブ）。その節の試合が無い・まだ取れていないところは点を出さず、線もつなげていません。
              各節の順位は、その節までの{d.label}で付けています。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function RankTooltip({
  d,
  colors,
  selected,
  active,
  label,
  payload,
}: {
  d: RankingResponse;
  colors: TeamColor[];
  selected: Set<string>;
  active?: boolean;
  label?: number;
  payload?: { payload: Record<string, number | null> }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload;
  const items = d.teams
    .map((t, i) => ({ t, i, rank: row[`t${i}`], value: row[`v${i}`] }))
    .filter((x) => x.rank != null && (selected.size === 0 || selected.has(x.t.team)))
    .sort((a, b) => (a.rank as number) - (b.rank as number));
  return (
    <div className="max-h-80 overflow-y-auto rounded-lg border bg-background/95 p-2 text-[11px] shadow">
      <div className="mb-1 font-bold">ラウンド {label}</div>
      {items.length === 0 ? (
        <div className="text-muted-foreground">試合なし</div>
      ) : (
        items.map((x) => (
          <div key={x.t.team} className="flex items-center gap-1.5">
            <span className="w-5 text-right font-mono">{x.rank}</span>
            <Swatch c={colors[x.i]} />
            <span className="truncate">{x.t.team}</span>
            <span className="ml-auto pl-2 font-mono text-muted-foreground">{fmt(x.value as number | null, d.scale, d.unit)}</span>
          </div>
        ))
      )}
    </div>
  );
}
