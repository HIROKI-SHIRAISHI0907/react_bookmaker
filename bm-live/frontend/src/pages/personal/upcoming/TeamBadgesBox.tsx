// 試合予定の詳細: チームのアイコン（連勝中・前節ホーム初勝利・ボール保持率リーグ1位 など。2026-11-27 追加）
//  GET /v1/api/upcoming-detail/badges。B006（統計CSV取り込み）のデータから作る。
//  ラウンドがつながっていない（前節が未反映など）ときは、連勝・前節などのアイコンは出さない（notes に理由）。
import { useQuery } from "@tanstack/react-query";
import { Flame, Info, TrendingDown, TrendingUp } from "lucide-react";
import { Skeleton } from "../../../components/ui/skeleton";
import { fetchUpcomingBadges } from "../../../api/upcoming/upcomingDetailapi";
import type { BadgeTone, TeamBadge } from "../../../api/upcoming/upcomingDetailtypes";

const TONE_CLASS: Record<BadgeTone, string> = {
  GOOD: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200",
  BAD: "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-700 dark:bg-rose-950/40 dark:text-rose-200",
  INFO: "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-700 dark:bg-sky-950/40 dark:text-sky-200",
};

/** 表示の順（分類） */
const CATEGORY_ORDER = ["順位", "流れ", "前節", "今季", "リーグ順位", "スタイル"];

function ToneIcon({ b }: { b: TeamBadge }) {
  if (b.code.endsWith("_STREAK") && b.tone === "GOOD") return <Flame className="h-3 w-3 shrink-0" />;
  if (b.tone === "GOOD") return <TrendingUp className="h-3 w-3 shrink-0" />;
  if (b.tone === "BAD") return <TrendingDown className="h-3 w-3 shrink-0" />;
  return <Info className="h-3 w-3 shrink-0" />;
}

function BadgeList({ team, badges }: { team: string; badges: TeamBadge[] }) {
  const sorted = [...badges].sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category));
  return (
    <div className="min-w-0">
      <div className="mb-2 truncate text-xs font-bold">{team}</div>
      {sorted.length === 0 ? (
        <div className="text-[11px] text-muted-foreground">表示できるアイコンはありません</div>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {sorted.map((b) => (
            <li
              key={b.code}
              title={`${b.category}：${b.detail}`}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold ${TONE_CLASS[b.tone] ?? TONE_CLASS.INFO}`}
              data-testid={`badge-${b.code}`}
            >
              <ToneIcon b={b} />
              <span>{b.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function TeamBadgesBox({ country, league, home, away, round }: { country: string; league: string; home: string; away: string; round: string | null }) {
  const q = useQuery({
    queryKey: ["upcoming-badges", country, league, home, away, round],
    queryFn: () => fetchUpcomingBadges({ country, league, home, away, round }),
    enabled: !!home && !!away && !!country && !!league,
    staleTime: 300_000,
  });
  if (!country || !league) return null;
  if (q.isLoading) return <Skeleton className="h-20 w-full rounded-2xl" />;
  if (q.error || !q.data) return null; // アイコンは補助なので、取れなくても画面は止めない
  const d = q.data;
  if (d.homeBadges.length === 0 && d.awayBadges.length === 0 && d.notes.length === 0) return null;
  return (
    <section className="rounded-2xl border bg-card p-4" data-testid="team-badges">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-bold">チームの今の状態</h2>
        <span className="text-[10px] text-muted-foreground">{d.season ? `${d.season} シーズン・` : ""}アイコンにカーソルを合わせると根拠</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <BadgeList team={`${home}（ホーム）`} badges={d.homeBadges} />
        <BadgeList team={`${away}（アウェー）`} badges={d.awayBadges} />
      </div>
      {d.notes.length > 0 && (
        <ul className="mt-3 space-y-0.5 text-[10px] text-muted-foreground">
          {d.notes.map((n) => (
            <li key={n}>※ {n}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
