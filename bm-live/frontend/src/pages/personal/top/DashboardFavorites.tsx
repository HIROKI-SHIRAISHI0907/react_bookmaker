// お気に入り（ログイン時）／ログインの案内（未ログイン時）
//  チーム名 → チームの過去の結果（/team-results）、直近5ラウンドの W/D/L、ライブ中ならスコア、次の試合
//  未ログインで「編集」「追加する」を押した場合はログインページへ。ログイン後は /favorite-edit に戻る
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import type { DashboardFavoriteItem } from "../../../api/dashboard/types";
import { isAuthenticated } from "../../../utils/auth";
import { RankBadge, formatKickoff } from "./parts";
import { TeamFormDots, TeamLink } from "../teams/TeamForm";

export const FAVORITE_EDIT_PATH = "/favorite-edit";
export const LOGIN_PATH = "/login";

/** ログインが必要なページへのリンク。未ログインならログインページへ飛ばし、ログイン後に to へ戻す */
export function LoginRequiredLink({ to, loggedIn, className, children, testId }: { to: string; loggedIn: boolean; className?: string; children: ReactNode; testId?: string }) {
  return loggedIn ? (
    <Link to={to} className={className} data-testid={testId}>
      {children}
    </Link>
  ) : (
    <Link to={LOGIN_PATH} state={{ from: to }} className={className} data-testid={testId}>
      {children}
    </Link>
  );
}

export function DashboardLoginCta({ from }: { from: string }) {
  return (
    <div className="rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 p-5">
      <div className="text-sm font-bold">ログインするともっと見られます</div>
      <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
        <li>★ お気に入りチームの試合・次の試合時間</li>
        <li>📊 勝ち・分け・負けの確率（%）</li>
        <li>⚽ 得点・失点の平均と見込みゴール数</li>
      </ul>
      <Link to={LOGIN_PATH} state={{ from }} className="mt-3 block w-full rounded-lg bg-emerald-500 py-2 text-center text-sm font-bold text-white">
        ログイン / 新規登録
      </Link>
    </div>
  );
}

export default function DashboardFavorites({ items, loading, loggedIn = isAuthenticated() }: { items: DashboardFavoriteItem[]; loading: boolean; loggedIn?: boolean }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-bold">★ お気に入り</div>
        <LoginRequiredLink to={FAVORITE_EDIT_PATH} loggedIn={loggedIn} className="text-[11px] text-muted-foreground hover:text-foreground" testId="link-favorite-edit">
          {loggedIn ? "編集 →" : "ログインして編集 →"}
        </LoginRequiredLink>
      </div>
      {!loggedIn ? (
        <div className="text-xs text-muted-foreground">
          お気に入りを使うにはログインが必要です。
          <LoginRequiredLink to={FAVORITE_EDIT_PATH} loggedIn={false} className="ml-1 font-bold text-emerald-600 hover:underline" testId="link-favorite-login">
            ログインして追加する
          </LoginRequiredLink>
        </div>
      ) : loading ? (
        <div className="text-xs text-muted-foreground">読込中...</div>
      ) : items.length === 0 ? (
        <div className="text-xs text-muted-foreground">
          お気に入りのチームがありません。
          <Link to={FAVORITE_EDIT_PATH} className="ml-1 font-bold text-emerald-600 hover:underline" data-testid="link-favorite-add">
            追加する
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((f) => (
            <div key={`${f.country}|${f.league}|${f.teamName}`} className={`rounded-lg bg-muted/60 px-3 py-2 ${f.status === "LIVE" ? "ring-1 ring-rose-500/40" : ""}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5">
                  <RankBadge rank={f.rank} />
                  <TeamLink country={f.country} league={f.league} team={f.teamName} className="truncate text-sm font-semibold" />
                </div>
                <TeamFormDots form={f.recentForm} />
              </div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <div className={`min-w-0 truncate text-xs ${f.status === "LIVE" ? "font-bold text-rose-500" : "text-emerald-600 dark:text-emerald-300"}`}>
                  {f.status === "LIVE" && `LIVE ${f.minuteLabel}　${f.teamScore} - ${f.opponentScore}　vs ${f.opponent}`}
                  {f.status === "NEXT" && `${formatKickoff(f.kickoff)}　vs ${f.opponent}（${f.homeAway === "H" ? "ホーム" : "アウェー"}）`}
                  {f.status === "NONE" && <span className="text-muted-foreground">予定なし</span>}
                </div>
                {f.winProb != null && <span className={`shrink-0 font-mono text-[11px] ${f.winProb >= 50 ? "text-emerald-500" : "text-violet-500"}`}>勝つ確率 {f.winProb}%</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
