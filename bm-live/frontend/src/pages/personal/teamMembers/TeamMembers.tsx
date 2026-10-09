// チームメンバー（コンパクト表示）
//  ポジションで絞り込み・2列・最初は 12 人まで（「全員を見る」で展開）
//  GET /v1/api/team-results/members?country=&league=&team=
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchTeamMembers } from "../../../api/team/teamapi";
import type { PositionGroup, TeamMember } from "../../../api/team/teamtypes";
import { Skeleton } from "../../../components/ui/skeleton";

const INITIAL = 12;

const POS: Record<PositionGroup, { label: string; className: string }> = {
  GK: { label: "GK", className: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  DF: { label: "DF", className: "bg-sky-500/15 text-sky-700 dark:text-sky-300" },
  MF: { label: "MF", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  FW: { label: "FW", className: "bg-rose-500/15 text-rose-700 dark:text-rose-300" },
  OTHER: { label: "他", className: "bg-muted text-muted-foreground" },
};
const FILTERS: ("ALL" | PositionGroup)[] = ["ALL", "GK", "DF", "MF", "FW"];

export default function TeamMembers({ country, league, team }: { country: string; league: string; team: string }) {
  const [filter, setFilter] = useState<"ALL" | PositionGroup>("ALL");
  const [expanded, setExpanded] = useState(false);

  const q = useQuery({
    queryKey: ["team-members", country, league, team],
    queryFn: () => fetchTeamMembers(country, league, team),
    enabled: !!country && !!league && !!team,
    staleTime: 10 * 60_000,
  });

  const members = q.data?.members ?? [];
  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: members.length };
    members.forEach((m) => (c[m.positionGroup] = (c[m.positionGroup] ?? 0) + 1));
    return c;
  }, [members]);

  const filtered = filter === "ALL" ? members : members.filter((m) => m.positionGroup === filter);
  const shown = expanded ? filtered : filtered.slice(0, INITIAL);
  const rest = filtered.length - shown.length;

  return (
    <section className="rounded-2xl border bg-card p-4" data-testid="team-members">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-bold">メンバー</h2>
        {members.length > 0 && <span className="text-xs text-muted-foreground">{members.length}人</span>}
        {(q.data?.injuredCount ?? 0) > 0 && <span className="rounded-full bg-rose-500/15 px-2 text-[10px] font-bold leading-5 text-rose-600">負傷 {q.data?.injuredCount}</span>}
        {members.length > 0 && (
          <div className="ml-auto flex gap-1">
            {FILTERS.filter((f) => f === "ALL" || counts[f]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => {
                  setFilter(f);
                  setExpanded(false);
                }}
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${filter === f ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"}`}
              >
                {f === "ALL" ? "全員" : f} <span className="font-normal opacity-70">{counts[f] ?? 0}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {q.isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : q.error ? (
        <div className="text-xs text-red-600">取得に失敗しました: {(q.error as Error).message}</div>
      ) : members.length === 0 ? (
        <div className="text-xs text-muted-foreground">メンバー情報がありません</div>
      ) : (
        <>
          <div className="grid gap-x-4 sm:grid-cols-2">
            {shown.map((m) => (
              <MemberRow key={`${m.name}-${m.jersey ?? ""}`} m={m} />
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
            {rest > 0 || expanded ? (
              <button type="button" onClick={() => setExpanded((v) => !v)} className="font-bold hover:text-foreground">
                {expanded ? "閉じる" : `全員を見る（あと ${rest} 人）`}
              </button>
            ) : (
              <span />
            )}
            {q.data?.latestInfoDate && <span>情報 {q.data.latestInfoDate}</span>}
          </div>
        </>
      )}
    </section>
  );
}

/** 1人 = 1行（背番号・ポジション・名前・負傷/レンタル・年齢・市場価値） */
function MemberRow({ m }: { m: TeamMember }) {
  const pos = POS[m.positionGroup] ?? POS.OTHER;
  const detail = [m.position, m.age != null ? `${m.age}歳` : null, m.height != null ? `${m.height}cm` : null, m.marketValue].filter(Boolean).join(" ・ ");
  return (
    <div className="flex h-7 min-w-0 items-center gap-1.5 rounded px-1 text-[13px] hover:bg-muted/50" title={detail}>
      <span className="w-6 shrink-0 text-right font-mono text-[11px] text-muted-foreground">{m.jersey ?? "-"}</span>
      <span className={`w-6 shrink-0 rounded text-center text-[9px] font-bold leading-4 ${pos.className}`}>{pos.label}</span>
      <span className={`min-w-0 flex-1 truncate ${m.injury ? "text-muted-foreground line-through decoration-rose-400/60" : ""}`}>{m.name}</span>
      {m.injury && (
        <span className="shrink-0 rounded bg-rose-500 px-1 text-[9px] font-bold leading-4 text-white" title={`負傷: ${m.injury}`}>
          負傷
        </span>
      )}
      {m.loanFrom && (
        <span className="shrink-0 rounded bg-violet-500/15 px-1 text-[9px] font-bold leading-4 text-violet-600" title={`レンタル（${m.loanFrom}）`}>
          L
        </span>
      )}
      <span className="w-8 shrink-0 text-right font-mono text-[10px] text-muted-foreground">{m.age ?? ""}</span>
      <span className="hidden w-12 shrink-0 text-right font-mono text-[10px] text-muted-foreground md:inline">{m.marketValue ?? ""}</span>
    </div>
  );
}
