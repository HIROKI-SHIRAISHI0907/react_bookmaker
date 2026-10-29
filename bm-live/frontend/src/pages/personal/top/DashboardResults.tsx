// 本日の試合結果（トップ画面）
//  GET /v1/api/dashboard/results（今日 JST に終了した試合。リーグごと・終わった時刻の新しい順）
//  行 → 試合詳細（/match-detail?seqKey=）。統計詳細データがある試合は「詳細」の印（メンバー・選手スタッツなどのタブが出る）
//  リーグが多いときは最初の数リーグだけ出し、「すべて表示」で広げる
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { DashboardResultLeague, DashboardResultMatch } from "../../../api/dashboard/types";

const INITIAL_LEAGUES = 6;

type Props = {
  leagues: DashboardResultLeague[];
  count: number;
  detailCount: number;
  loading: boolean;
  error: Error | null;
  favoriteTeams: Set<string>;
  onOpen: (seqKey: string) => void;
};

export default function DashboardResults({ leagues, count, detailCount, loading, error, favoriteTeams, onOpen }: Props) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? leagues : leagues.slice(0, INITIAL_LEAGUES);
  const rest = leagues.length - shown.length;

  return (
    <section className="rounded-2xl border bg-card p-4" data-testid="section-results">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-bold">本日の試合結果</h2>
        {count > 0 && (
          <span className="text-[11px] text-muted-foreground">
            {count}試合{detailCount > 0 ? `（詳細データあり ${detailCount}）` : ""}
          </span>
        )}
      </div>

      {loading ? (
        <div className="text-xs text-muted-foreground">読込中...</div>
      ) : error ? (
        <div className="text-xs text-red-700">試合結果の取得に失敗しました: {error.message}</div>
      ) : leagues.length === 0 ? (
        <div className="text-xs text-muted-foreground">今日終了した試合はまだありません</div>
      ) : (
        <div className="space-y-3">
          {shown.map((l) => (
            <div key={l.label}>
              <div className="mb-1 truncate text-[11px] font-bold text-muted-foreground">{l.label}</div>
              <div className="divide-y rounded-lg border">
                {l.matches.map((m) => (
                  <ResultRow key={m.seqKey} m={m} favoriteTeams={favoriteTeams} onOpen={onOpen} />
                ))}
              </div>
            </div>
          ))}
          {rest > 0 && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed py-2 text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              data-testid="button-results-more"
            >
              ほか {rest} リーグ・{leagues.slice(INITIAL_LEAGUES).reduce((n, x) => n + x.matches.length, 0)} 試合をすべて表示
            </button>
          )}
        </div>
      )}
    </section>
  );
}

/** 1試合 = 1行（終了時刻 | ホーム スコア アウェー | 詳細の印 | ›）。勝ったチームを太字にする */
function ResultRow({ m, favoriteTeams, onOpen }: { m: DashboardResultMatch; favoriteTeams: Set<string>; onOpen: (seqKey: string) => void }) {
  const h = m.homeScore;
  const a = m.awayScore;
  const homeWin = h != null && a != null && h > a;
  const awayWin = h != null && a != null && a > h;
  const time = m.recordTime ? m.recordTime.slice(11, 16) : "";
  const fav = (t: string | null) => !!t && favoriteTeams.has(t);
  const ht = m.halftimeHomeScore != null && m.halftimeAwayScore != null ? `前半 ${m.halftimeHomeScore}-${m.halftimeAwayScore}` : null;

  return (
    <button
      type="button"
      onClick={() => onOpen(m.seqKey)}
      className="grid w-full grid-cols-[2.6rem_1fr_auto_1fr_auto] items-center gap-2 px-2.5 py-2 text-left text-[13px] hover:bg-muted/50"
      data-testid={`row-result-${m.seqKey}`}
    >
      <span className="font-mono text-[11px] text-muted-foreground" title="終了時刻（最後の記録）">
        {time}
      </span>
      <span className={`min-w-0 truncate text-right ${homeWin ? "font-bold" : ""}`}>
        {fav(m.homeTeam) && <span className="mr-0.5 text-amber-500">★</span>}
        {m.homeTeam ?? "-"}
      </span>
      <span className="flex flex-col items-center">
        <span className="rounded-md bg-muted px-2 py-0.5 font-mono font-black tabular-nums">
          {h ?? "-"} - {a ?? "-"}
        </span>
        {ht && <span className="mt-0.5 text-[9px] text-muted-foreground">{ht}</span>}
      </span>
      <span className={`min-w-0 truncate ${awayWin ? "font-bold" : ""}`}>
        {m.awayTeam ?? "-"}
        {fav(m.awayTeam) && <span className="ml-0.5 text-amber-500">★</span>}
      </span>
      <span className="flex items-center gap-1">
        {m.hasDetail && (
          <span className="rounded-full bg-emerald-600/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400" title="メンバー・選手スタッツなどの詳細データがあります">
            詳細
          </span>
        )}
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
      </span>
    </button>
  );
}
