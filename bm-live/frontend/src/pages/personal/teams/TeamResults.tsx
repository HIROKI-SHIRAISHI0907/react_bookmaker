// チームの過去の結果・メンバー  /team-results?country=&league=&team=
//  GET /v1/api/team-results（surface_overview_match → 無いラウンドは static_data の「終了済」→ それも無ければ空欄）
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Skeleton } from "../../../components/ui/skeleton";
import AppHeader from "../../../components/layout/AppHeader";
import { fetchTeamResults } from "../../../api/team/teamapi";
import type { TeamResultItem } from "../../../api/team/teamtypes";
import { TeamFormDots, TeamLink } from "./TeamForm";
import TeamMembers from "../teamMembers/TeamMembers";

const LIMITS = [5, 10, 20] as const;

export default function TeamResults() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const country = params.get("country") ?? "";
  const league = params.get("league") ?? "";
  const team = params.get("team") ?? "";
  const limit = Number(params.get("limit")) || 5;

  const q = useQuery({
    queryKey: ["team-results", country, league, team, limit],
    queryFn: () => fetchTeamResults(country, league, team, limit),
    enabled: !!country && !!league && !!team,
    staleTime: 60_000,
  });

  const setLimit = (n: number) => {
    const next = new URLSearchParams(params);
    if (n === 5) next.delete("limit");
    else next.set("limit", String(n));
    setParams(next, { replace: true });
  };

  const d = q.data;
  const played = d ? d.wins + d.draws + d.losses : 0;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title={team || "チーム"} subtitle={`${country} / ${league}${d?.season ? `・${d.season}` : ""}`} />

      <main className="container mx-auto max-w-3xl space-y-4 px-4 py-6">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} data-testid="button-back">
            <ArrowLeft className="mr-1 h-4 w-4" />
            戻る
          </Button>
          <div className="ml-auto flex gap-1">
            {LIMITS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setLimit(n)}
                className={`rounded-full px-3 py-1 text-xs font-bold ${limit === n ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"}`}
              >
                直近{n}
              </button>
            ))}
          </div>
        </div>

        {!country || !league || !team ? (
          <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">国・リーグ・チームを指定してください</div>
        ) : q.isLoading ? (
          <Skeleton className="h-64 w-full rounded-2xl" />
        ) : q.error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">取得に失敗しました: {(q.error as Error).message}</div>
        ) : !d || d.items.length === 0 ? (
          <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
            ラウンド番号のある試合結果がまだありません（{country} / {league}）
          </div>
        ) : (
          <>
            {/* まとめ */}
            <div className="rounded-2xl border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <TeamFormDots form={d.items.map((i) => i.result)} size="md" />
                <div className="flex gap-4 text-sm">
                  <span>
                    <b className="text-emerald-600">{d.wins}</b>勝 <b>{d.draws}</b>分 <b className="text-rose-600">{d.losses}</b>敗
                  </span>
                  <span className="font-mono text-muted-foreground">
                    得点 {d.goalsFor} / 失点 {d.goalsAgainst}
                    {played > 0 && `（1試合 ${(d.goalsFor / played).toFixed(1)} / ${(d.goalsAgainst / played).toFixed(1)}）`}
                  </span>
                </div>
              </div>
            </div>

            {/* ラウンドごと */}
            <div className="divide-y rounded-2xl border bg-card">
              {d.items.map((i) => (
                <ResultRow key={i.roundNo} i={i} country={country} league={league} />
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">空欄のラウンドは試合結果が見つからなかったラウンドです（試合が無い・データ未取得）。</p>
          </>
        )}

        {/* メンバー（結果が無くても表示） */}
        {country && league && team && <TeamMembers country={country} league={league} team={team} />}
      </main>
    </div>
  );
}

const RESULT_STYLE: Record<"W" | "D" | "L", string> = {
  W: "bg-emerald-500 text-white",
  D: "bg-slate-400 text-white",
  L: "bg-rose-500 text-white",
};

function ResultRow({ i, country, league }: { i: TeamResultItem; country: string; league: string }) {
  if (i.source === "NONE") {
    return (
      <div className="flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground">
        <span className="w-16 shrink-0 font-mono text-xs">R{i.roundNo}</span>
        <span className="text-xs">―</span>
      </div>
    );
  }
  const date = i.matchTime ? i.matchTime.slice(5, 16).replace("-", "/") : "";
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="w-16 shrink-0">
        <span className="block font-mono text-xs font-bold">R{i.roundNo}</span>
        <span className="block font-mono text-[10px] text-muted-foreground">{date}</span>
      </span>
      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${i.result ? RESULT_STYLE[i.result] : "border border-dashed text-muted-foreground"}`}>
        {i.result ?? "?"}
      </span>
      <span className="font-mono text-base font-bold">
        {i.goalsFor ?? "-"} - {i.goalsAgainst ?? "-"}
        {i.pk && i.pkGoalsFor != null && (
          <span className="ml-1 text-[11px] font-normal text-muted-foreground">
            (PK {i.pkGoalsFor}-{i.pkGoalsAgainst})
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm">
        <span className={`mr-1.5 rounded px-1 text-[10px] font-bold ${i.homeAway === "H" ? "bg-emerald-500/15 text-emerald-600" : "bg-violet-500/15 text-violet-600"}`}>
          {i.homeAway === "H" ? "ホーム" : "アウェー"}
        </span>
        vs <TeamLink country={country} league={league} team={i.opponent ?? ""} className="font-semibold" />
      </span>
      {i.source === "STATIC" && (
        <span className="shrink-0 text-[10px] text-muted-foreground" title="集計前の試合データ（終了済）から">
          速報
        </span>
      )}
    </div>
  );
}
