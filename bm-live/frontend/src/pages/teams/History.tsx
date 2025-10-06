// frontend/src/pages/History.tsx
import { Link, useParams } from "react-router-dom";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPastMatches, type PastMatch } from "../../api/histories";
import AppHeader from "../../components/layout/AppHeader";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "../../components/ui/skeleton";

function resultOf(teamNameJa: string, m: PastMatch): "WIN" | "LOSE" | "DRAW" {
  const isHome = m.home_team === teamNameJa;
  const my = isHome ? m.home_score : m.away_score;
  const opp = isHome ? m.away_score : m.home_score;
  if (my > opp) return "WIN";
  if (my < opp) return "LOSE";
  return "DRAW";
}

export default function TeamHeadToHead() {
  const params = useParams<{ country?: string; league?: string; team?: string; teams?: string }>();
  const countryParam = params.country ?? "";
  const leagueParam = params.league ?? "";
  const teamSlug = params.team ?? params.teams ?? "";

  const safeDecode = (s: string) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  };
  const countryLabel = safeDecode(countryParam);
  const leagueLabel = safeDecode(leagueParam);

  const { data, isLoading, isError } = useQuery<PastMatch[]>({
    queryKey: ["team-history", countryLabel, leagueLabel, teamSlug],
    queryFn: () => fetchPastMatches(countryLabel, leagueLabel, teamSlug),
    enabled: !!countryLabel && !!leagueLabel && !!teamSlug,
    staleTime: 60_000,
  });

  const sorted = useMemo(() => {
    const xs = (data ?? []).slice();
    // 新しい順（直近が上）
    xs.sort((a, b) => new Date(b.match_time).getTime() - new Date(a.match_time).getTime());
    return xs;
  }, [data]);

  const toBack = `/${encodeURIComponent(countryLabel)}/${encodeURIComponent(leagueLabel)}/${encodeURIComponent(teamSlug)}?tab=matches`;

  // チーム名（list から最初に出現する側を採用）
  const myName = sorted[0]?.home_team || sorted[0]?.away_team || "";

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="過去の対戦履歴" subtitle={`${countryLabel} / ${leagueLabel}`} />
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="mb-2 flex items-center gap-3">
          <Link to={toBack} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline">
            <ArrowLeft className="w-4 h-4" />
            戻る
          </Link>
        </div>

        {isLoading ? (
          <div className="rounded-xl border bg-card p-4 shadow-sm space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <Skeleton className="h-4 w-24" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-3 w-40 mt-1" />
                </div>
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="text-muted-foreground">過去の対戦履歴を取得できませんでした。</div>
        ) : !sorted.length ? (
          <div className="text-muted-foreground">表示する対戦履歴がありません。</div>
        ) : (
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <ul className="divide-y">
              {sorted.map((it) => {
                const res = resultOf(myName, it);
                const scoreText = `${it.home_score} - ${it.away_score}`;
                const resClass = res === "WIN" ? "text-red-600 font-bold" : res === "LOSE" ? "text-blue-600 font-bold" : "text-green-600 font-bold";

                return (
                  <li key={it.seq} className="flex items-center gap-3 py-2">
                    {/* 左：ラウンド */}
                    <div className="w-32 shrink-0 text-sm">
                      {it.round_no != null ? <span className="font-bold">ラウンド {it.round_no}</span> : <span className="text-muted-foreground">ラウンド -</span>}
                    </div>

                    {/* 中央：カード本体 */}
                    <div className="flex-1">
                      <div className="text-sm">
                        {it.home_team} vs {it.away_team}
                        {it.link ? (
                          <>
                            {" "}
                            ·{" "}
                            <a href={it.link} target="_blank" rel="noreferrer" className="underline">
                              詳細
                            </a>
                          </>
                        ) : null}
                      </div>
                      <div className="text-xs text-muted-foreground">{new Date(it.match_time).toLocaleString()}</div>
                    </div>

                    {/* 右：最終スコア + 結果 */}
                    <div className="w-28 shrink-0 text-right">
                      <div className="text-sm tabular-nums">{scoreText}</div>
                      <div className={`text-xs ${resClass}`}>{res}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
