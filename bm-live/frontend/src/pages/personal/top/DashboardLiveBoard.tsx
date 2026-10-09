// ライブ（リーグごとの1行表示。国・お気に入りで絞り込み、ゴールが多い順に並べ替え）
//  行をクリック → onOpen(seqKey)（static_data の seq_key。例: "0drkxQrA-12"）
import { useMemo, useState } from "react";
import type { DashboardLiveLeague, DashboardLiveMatch } from "../../../api/dashboard/types";
import { GoalsBadge, LiveDot, RankBadge, TeamGrades, WdlBar } from "./parts";

type Props = {
  leagues: DashboardLiveLeague[];
  count: number;
  favoriteTeams: Set<string>;
  loggedIn: boolean;
  onOpen: (seqKey: string, match: DashboardLiveMatch) => void;
};

const GOAL_ORDER = { HIGH: 0, MID: 1, LOW: 2 } as const;

function Row({ m, fav, onOpen }: { m: DashboardLiveMatch; fav: boolean; onOpen: Props["onOpen"] }) {
  const teams = [
    { t: m.home, s: m.homeScore, o: m.awayScore },
    { t: m.away, s: m.awayScore, o: m.homeScore },
  ];
  return (
    <button
      type="button"
      onClick={() => onOpen(m.seqKey, m)}
      data-testid={`live-row-${m.seqKey}`}
      className="grid w-full grid-cols-[52px_1fr_auto] items-center gap-3 px-3 py-2.5 text-left transition hover:bg-muted/50 md:grid-cols-[52px_1fr_auto_150px]"
    >
      <div className="text-center">
        {m.status === "HT" ? (
          <div className="rounded bg-amber-500/20 font-mono text-xs font-bold text-amber-600 dark:text-amber-300">HT</div>
        ) : (
          <>
            <div className="font-mono text-sm font-bold text-rose-500">{m.minuteLabel}</div>
            <div className="mt-1 h-0.5 rounded bg-muted">
              <div className="h-0.5 rounded bg-rose-400" style={{ width: `${m.progress}%` }} />
            </div>
          </>
        )}
      </div>
      <div className="min-w-0 space-y-1 text-sm">
        {teams.map(({ t, s, o }, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <RankBadge rank={t.rank} />
              <span className={`truncate ${s >= o ? "font-semibold" : "text-muted-foreground"}`}>
                {fav && i === 0 && <span className="text-amber-500">★ </span>}
                {t.name}
              </span>
            </div>
            <TeamGrades team={t} />
          </div>
        ))}
      </div>
      <div className="text-right font-mono text-lg font-black leading-6">
        {m.homeScore}
        <br />
        {m.awayScore}
      </div>
      <div className="col-span-3 space-y-1 md:col-span-1">
        <WdlBar f={m.forecast} />
        <div className="text-right">
          <GoalsBadge f={m.forecast} />
        </div>
      </div>
    </button>
  );
}

export default function DashboardLiveBoard({ leagues, count, favoriteTeams, loggedIn, onOpen }: Props) {
  const [filter, setFilter] = useState<string>("ALL");
  const [sortByGoals, setSortByGoals] = useState(false);

  const isFav = (m: DashboardLiveMatch) => favoriteTeams.has(m.home.name) || favoriteTeams.has(m.away.name);

  const countries = useMemo(() => {
    const map = new Map<string, number>();
    leagues.forEach((g) => map.set(g.country, (map.get(g.country) ?? 0) + g.matches.length));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [leagues]);

  const favCount = useMemo(() => leagues.reduce((n, g) => n + g.matches.filter(isFav).length, 0), [leagues, favoriteTeams]);

  const shown = useMemo(() => {
    let list = leagues
      .map((g) => ({
        ...g,
        matches: g.matches.filter((m) => (filter === "ALL" ? true : filter === "FAV" ? isFav(m) : g.country === filter)),
      }))
      .filter((g) => g.matches.length > 0);
    if (sortByGoals) {
      const all = list.flatMap((g) => g.matches);
      all.sort((a, b) => GOAL_ORDER[a.forecast.goalsLabel] - GOAL_ORDER[b.forecast.goalsLabel]);
      list = [{ leagueLabel: "ゴールが多い順", country: "", matches: all }];
    }
    return list;
  }, [leagues, filter, sortByGoals, favoriteTeams]);

  const chip = (active: boolean) => `rounded-full px-3 py-1 text-xs transition ${active ? "bg-foreground font-semibold text-background" : "bg-muted hover:bg-muted/70"}`;

  return (
    <section className="rounded-2xl border bg-card p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <LiveDot />
          ライブ
        </h2>
        <div className="flex flex-wrap gap-1">
          <button type="button" className={chip(filter === "ALL")} onClick={() => setFilter("ALL")}>
            すべて {count}
          </button>
          {loggedIn && favCount > 0 && (
            <button type="button" className={chip(filter === "FAV")} onClick={() => setFilter("FAV")}>
              ★ お気に入り {favCount}
            </button>
          )}
          <button type="button" className={chip(sortByGoals)} onClick={() => setSortByGoals((v) => !v)}>
            ゴールが多い順
          </button>
          {countries.map(([c, n]) => (
            <button key={c} type="button" className={chip(filter === c)} onClick={() => setFilter(c)}>
              {c} {n}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
        <span>
          <b className="text-foreground">攻</b> 得点しやすさ　<b className="text-foreground">守</b> 失点しにくさ
        </span>
        <span>
          <span className="rounded bg-emerald-500 px-1 font-bold text-white">◎</span> 上位　
          <span className="rounded bg-slate-500/70 px-1 font-bold text-white">○</span> 平均　
          <span className="rounded bg-rose-500 px-1 font-bold text-white">△</span> 下位
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-flex h-1.5 w-12 overflow-hidden rounded">
            <span className="w-1/2 bg-emerald-400" />
            <span className="w-1/5 bg-slate-400/70" />
            <span className="flex-1 bg-violet-400" />
          </span>
          ホーム勝ち / 分け / アウェー勝ち（このままなら）
        </span>
      </div>

      {shown.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">現在ライブ中の試合はありません</div>
      ) : (
        shown.map((g) => (
          <div key={`${g.country}|${g.leagueLabel}`}>
            <div className="mb-1 mt-3 px-1 text-xs font-semibold">{g.leagueLabel}</div>
            <div className="divide-y overflow-hidden rounded-xl border">
              {g.matches.map((m) => (
                <Row key={m.seqKey} m={m} fav={loggedIn && isFav(m)} onOpen={onOpen} />
              ))}
            </div>
          </div>
        ))
      )}
    </section>
  );
}
