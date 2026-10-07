// お気に入り（ログイン時）／ログインの案内（未ログイン時）
import { Link } from "react-router-dom";
import type { DashboardFavoriteItem } from "../../../api/dashboard/types";
import { RankBadge, formatKickoff } from "./parts";

export function DashboardLoginCta({ from }: { from: string }) {
  return (
    <div className="rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 p-5">
      <div className="text-sm font-bold">ログインするともっと見られます</div>
      <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
        <li>★ お気に入りチームの試合・次の試合時間</li>
        <li>📊 勝ち・分け・負けの確率（%）</li>
        <li>⚽ 得点・失点の平均と見込みゴール数</li>
      </ul>
      <Link to="/login" state={{ from }} className="mt-3 block w-full rounded-lg bg-emerald-500 py-2 text-center text-sm font-bold text-white">
        ログイン / 新規登録
      </Link>
    </div>
  );
}

export default function DashboardFavorites({ items, loading, onOpen }: { items: DashboardFavoriteItem[]; loading: boolean; onOpen: (seq: number) => void }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-bold">★ お気に入り</div>
        <Link to="/favorite" className="text-[11px] text-muted-foreground">
          編集 →
        </Link>
      </div>
      {loading ? (
        <div className="text-xs text-muted-foreground">読込中...</div>
      ) : items.length === 0 ? (
        <div className="text-xs text-muted-foreground">お気に入りのチームがありません</div>
      ) : (
        <div className="space-y-2">
          {items.map((f) => (
            <button
              key={f.teamName}
              type="button"
              disabled={f.status !== "LIVE" || f.seq == null}
              onClick={() => f.seq != null && onOpen(f.seq)}
              className={`w-full rounded-lg bg-muted/60 px-3 py-2 text-left ${f.status === "LIVE" ? "ring-1 ring-rose-500/40 hover:bg-muted" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5">
                  <RankBadge rank={f.rank} />
                  <span className="truncate text-sm font-semibold">{f.teamName}</span>
                </div>
                {f.winProb != null && <span className={`shrink-0 font-mono text-[11px] ${f.winProb >= 50 ? "text-emerald-500" : "text-violet-500"}`}>勝つ確率 {f.winProb}%</span>}
              </div>
              <div className={`mt-1 text-xs ${f.status === "LIVE" ? "font-bold text-rose-500" : "text-emerald-600 dark:text-emerald-300"}`}>
                {f.status === "LIVE" && `LIVE ${f.minuteLabel}　${f.teamScore} - ${f.opponentScore}　vs ${f.opponent}`}
                {f.status === "NEXT" && `${formatKickoff(f.kickoff)}　vs ${f.opponent}（${f.homeAway === "H" ? "ホーム" : "アウェー"}）`}
                {f.status === "NONE" && <span className="text-muted-foreground">予定なし</span>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
