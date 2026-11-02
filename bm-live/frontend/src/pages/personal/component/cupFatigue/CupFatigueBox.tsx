// 直近の大会（ACL など）出場  今後の試合予定（UpcomingDetail）・試合中（MatchDetail）の画面に出す
//  「2 日前に ACL に出ていたので、ホームでも疲れているかも」を見るためのカード。
//  どちらのチームも大会の出場チームに登録されていなければ何も出さない。
//  GET /v1/api/cup-fatigue?country=&league=&home=&away=&at=
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BatteryLow, ChevronDown, ChevronRight, Trophy } from "lucide-react";
import { fetchCupFatigue, toJstMinute } from "../../../../api/cupFatigue/cupFatigueapi";
import type { CupFatigueMatch, CupTeamFatigue } from "../../../../api/cupFatigue/cupFatiguetypes";

type Props = {
  country: string | null | undefined;
  league: string | null | undefined;
  home: string | null | undefined;
  away: string | null | undefined;
  /** この試合の開始日時（ISO・"yyyy-MM-dd HH:mm" など）。無ければ今を基準にする */
  at?: string | null;
};

export default function CupFatigueBox({ country, league, home, away, at }: Props) {
  const atJst = toJstMinute(at ?? null);
  const q = useQuery({
    queryKey: ["cup-fatigue", country, league, home, away, atJst],
    queryFn: () => fetchCupFatigue({ country, league, home, away, at: atJst }),
    enabled: !!home || !!away,
    staleTime: 300_000,
  });
  const d = q.data;
  // 失敗・大会のチームでない → 何も出さない（試合の画面の邪魔をしない）
  if (!d || !d.found) return null;

  return (
    <section className="rounded-2xl border bg-card p-4" data-testid="cup-fatigue">
      <div className="mb-2 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-amber-500" />
        <h2 className="text-sm font-bold">大会の出場（疲労の目安）</h2>
        <span className="ml-auto text-[10px] text-muted-foreground">この試合の前後 {d.days} 日</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <TeamBlock t={d.home} label="HOME" />
        <TeamBlock t={d.away} label="AWAY" />
      </div>
      <div className="mt-2 text-[10px] text-muted-foreground">※ 大会の試合の出場選手は、試合日の翌日に取得します。取得前は人数が出ません。</div>
    </section>
  );
}

function TeamBlock({ t, label }: { t: CupTeamFatigue; label: string }) {
  return (
    <div className="min-w-0 rounded-xl border bg-background/60 p-3">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="text-[10px] font-bold text-muted-foreground">{label}</span>
        <span className="min-w-0 truncate text-sm font-bold">{t.team || "-"}</span>
      </div>
      {!t.cupTeam ? (
        <div className="text-xs text-muted-foreground">大会の出場チームではありません</div>
      ) : (
        <>
          {t.competitions && <div className="mb-1.5 truncate text-[11px] text-muted-foreground">{t.competitions}</div>}
          {t.recent.length === 0 && t.upcoming.length === 0 && <div className="text-xs text-muted-foreground">この前後に大会の試合はありません</div>}
          <ul className="space-y-1.5">
            {t.recent.map((m) => (
              <RecentMatch key={m.mid} m={m} />
            ))}
            {t.upcoming.map((m) => (
              <li key={m.mid} className="rounded-lg bg-muted/40 px-2 py-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-700">{dayLabel(m, false)}</span>
                  <span className="min-w-0 truncate">
                    {m.competitionName}
                    {m.round ? `・${m.round}` : ""}
                  </span>
                </div>
                <div className="mt-0.5 truncate text-muted-foreground">
                  {m.kickoff} {m.side === "HOME" ? "（H）" : "（A）"} vs {m.opponent}
                  <span className="ml-1 text-[10px]">次の試合を控えて主力を休ませる可能性</span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function RecentMatch({ m }: { m: CupFatigueMatch }) {
  const [open, setOpen] = useState(false);
  const tone = fatigueTone(m.days);
  const score = m.teamScore != null && m.opponentScore != null ? `${m.teamScore}-${m.opponentScore}` : null;
  const starters = m.players.filter((p) => p.lineupType === "スタメン");
  const subs = m.players.filter((p) => p.lineupType !== "スタメン");
  // 長く出た選手（60 分以上）
  const heavy = m.players.filter((p) => (p.minutes ?? 0) >= 60).length;
  return (
    <li className={`rounded-lg px-2 py-1.5 text-xs ${tone.bg}`}>
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold ${tone.badge}`}>
          {m.days <= 3 && <BatteryLow className="h-3 w-3" />}
          {dayLabel(m, true)}
        </span>
        <span className="min-w-0 truncate">
          {m.competitionName}
          {m.round ? `・${m.round}` : ""}
        </span>
      </div>
      <div className="mt-0.5 flex items-center gap-1 truncate text-muted-foreground">
        <span className="tabular-nums">{m.kickoff}</span>
        <span>{m.side === "HOME" ? "（H）" : "（A）"}</span>
        <span className="min-w-0 truncate">vs {m.opponent}</span>
        {score && <span className="font-bold text-foreground tabular-nums">{score}</span>}
      </div>
      {m.registered ? (
        <>
          <button type="button" onClick={() => setOpen((v) => !v)} className="mt-1 flex items-center gap-1 text-[11px] font-semibold hover:underline">
            {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            スタメン {m.starterCount} 人・出場 {m.playedCount} 人（60 分以上 {heavy} 人）
          </button>
          {open && (
            <div className="mt-1 space-y-1">
              <PlayerList title="スタメン" players={starters} />
              {subs.length > 0 && <PlayerList title="途中出場" players={subs} />}
            </div>
          )}
        </>
      ) : (
        <div className="mt-1 text-[11px] text-muted-foreground">出場選手はまだ取得されていません</div>
      )}
    </li>
  );
}

function PlayerList({ title, players }: { title: string; players: CupFatigueMatch["players"] }) {
  return (
    <div>
      <div className="text-[10px] font-bold text-muted-foreground">{title}</div>
      <ul className="grid grid-cols-1 gap-x-3 sm:grid-cols-2">
        {players.map((p, i) => (
          <li key={`${p.playerName}-${i}`} className="flex items-center gap-1 text-[11px]">
            <span className="w-5 text-right tabular-nums text-muted-foreground">{p.jerseyNumber}</span>
            <span className="min-w-0 flex-1 truncate">{p.playerName}</span>
            <span className="tabular-nums text-muted-foreground">{p.minutes != null ? `${p.minutes}分` : "-"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function dayLabel(m: CupFatigueMatch, past: boolean) {
  if (m.days === 0) return past ? `${m.hours}時間前` : `${m.hours}時間後`;
  return past ? `${m.days}日前` : `${m.days}日後`;
}

/** 中 2 日以内は赤、中 3〜4 日は黄、それより前は灰色 */
function fatigueTone(days: number) {
  if (days <= 3) return { bg: "bg-red-50 dark:bg-red-950/30", badge: "bg-red-100 text-red-700" };
  if (days <= 5) return { bg: "bg-amber-50 dark:bg-amber-950/30", badge: "bg-amber-100 text-amber-700" };
  return { bg: "bg-muted/40", badge: "bg-muted text-muted-foreground" };
}
