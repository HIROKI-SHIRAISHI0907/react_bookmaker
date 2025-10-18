import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import AppHeader from "../../components/layout/AppHeader";
import { Skeleton } from "../../components/ui/skeleton";
import { fetchLeagueStanding, type LeagueStanding } from "../../api/standings";

export default function RankingPage() {
  const { country = "", league = "" } = useParams();
  const countryRaw = decodeURIComponent(country);
  const leagueRaw = decodeURIComponent(league);

  const { data, isLoading, isError } = useQuery<LeagueStanding>({
    queryKey: ["league-standing", countryRaw, leagueRaw],
    queryFn: () => fetchLeagueStanding(countryRaw, leagueRaw),
    staleTime: 60_000,
  });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="順位表" subtitle={`${countryRaw} / ${leagueRaw}`} />

      <main className="container mx-auto px-4 py-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">
              {countryRaw} / {leagueRaw}
            </h1>
            <p className="text-muted-foreground text-sm">Standings</p>
          </div>

          <Link to={`/live`} className="inline-flex items-center text-sm font-medium rounded-md border px-3 py-1.5 hover:bg-accent">
            現在開催中の試合 →
          </Link>
          <Link to={`/${country}/${league}`} className="inline-flex items-center text-sm font-medium rounded-md border px-3 py-1.5 hover:bg-accent">
            チーム一覧へ →
          </Link>
        </div>

        {isError && <div className="text-destructive">データの取得に失敗しました</div>}

        {/* ローディング */}
        {isLoading && (
          <div className="border rounded-md">
            <div className="grid grid-cols-12 gap-2 p-3 border-b text-xs sm:text-sm font-medium text-muted-foreground">
              <div className="col-span-1">#</div>
              <div className="col-span-6">チーム</div>
              <div className="col-span-1 text-right">試合</div>
              <div className="col-span-1 text-right">勝</div>
              <div className="col-span-1 text-right">分</div>
              <div className="col-span-1 text-right">負</div>
              <div className="col-span-1 text-right">勝点</div>
            </div>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 p-3 border-b">
                <div className="col-span-1">
                  <Skeleton className="h-4 w-6" />
                </div>
                <div className="col-span-6">
                  <Skeleton className="h-4 w-40" />
                </div>
                <div className="col-span-1">
                  <Skeleton className="h-4 w-10 ml-auto" />
                </div>
                <div className="col-span-1">
                  <Skeleton className="h-4 w-8 ml-auto" />
                </div>
                <div className="col-span-1">
                  <Skeleton className="h-4 w-8 ml-auto" />
                </div>
                <div className="col-span-1">
                  <Skeleton className="h-4 w-8 ml-auto" />
                </div>
                <div className="col-span-1">
                  <Skeleton className="h-4 w-10 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ヘッダー行 */}
        <div className="grid grid-cols-12 gap-2 p-3 border-b text-xs sm:text-sm font-medium text-muted-foreground bg-muted/40">
          <div className="col-span-1">#</div>
          <div className="col-span-6">チーム</div>
          <div className="col-span-1 text-right">試合</div>
          <div className="col-span-1 text-right">勝</div>
          <div className="col-span-1 text-right">分</div>
          <div className="col-span-1 text-right">負</div>
          <div className="col-span-1 text-right">勝点</div>
        </div>

        {/* データ行 */}
        {data.rows.map((r) => {
          const teamRoute = `/${country}/${league}/${encodeURIComponent(r.teamEnglish)}`;
          const posColor = r.position <= 4 ? "text-emerald-600" : r.position <= 6 ? "text-blue-600" : r.position >= data.rows.length - 2 ? "text-destructive" : "";
          return (
            <div key={`${r.position}-${r.teamEnglish}`} className="grid grid-cols-12 gap-2 p-3 border-b hover:bg-accent/40 transition-colors">
              <div className={`col-span-1 font-semibold ${posColor}`}>{r.position}</div>
              <div className="col-span-6">
                <Link to={teamRoute} className="font-medium hover:underline">
                  {r.teamName}
                </Link>
              </div>
              <div className="col-span-1 text-right tabular-nums">{r.game}</div>
              <div className="col-span-1 text-right tabular-nums">{r.win}</div>
              <div className="col-span-1 text-right tabular-nums">{r.draw}</div>
              <div className="col-span-1 text-right tabular-nums">{r.lose}</div>
              <div className="col-span-1 text-right font-semibold tabular-nums">{r.winningPoints}</div>
            </div>
          );
        })}

        {data &&
          (data.rows.length === 0 ? (
            <div className="text-muted-foreground">表示する順位表がありません。</div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              {/* ヘッダー行 */}
              <div className="grid grid-cols-12 gap-2 p-3 border-b text-xs sm:text-sm font-medium text-muted-foreground bg-muted/40">
                <div className="col-span-1">#</div>
                <div className="col-span-5 sm:col-span-4">チーム</div>
                <div className="col-span-2 text-right">試合</div>
                <div className="col-span-2 text-right">勝</div>
                <div className="col-span-2 text-right">分</div>
                <div className="col-span-2 text-right">負</div>
                <div className="col-span-2 text-right">勝点</div>
              </div>

              {/* データ行 */}
              {data.rows.map((r) => {
                const teamRoute = `/${country}/${league}/${encodeURIComponent(r.teamEnglish)}`;
                const posColor = r.position <= 4 ? "text-emerald-600" : r.position <= 6 ? "text-blue-600" : r.position >= data.rows.length - 2 ? "text-destructive" : "";
                return (
                  <div key={`${r.position}-${r.teamEnglish}`} className="grid grid-cols-12 gap-2 p-3 border-b hover:bg-accent/40 transition-colors">
                    <div className={`col-span-1 font-semibold ${posColor}`}>{r.position}</div>
                    <div className="col-span-5 sm:col-span-4">
                      <Link to={teamRoute} className="font-medium hover:underline">
                        {r.teamName}
                      </Link>
                    </div>
                    <div className="col-span-2 text-right tabular-nums">{r.game}</div>
                    <div className="col-span-2 text-right tabular-nums">{r.win}</div>
                    <div className="col-span-2 text-right tabular-nums">{r.draw}</div>
                    <div className="col-span-2 text-right tabular-nums">{r.lose}</div>
                    <div className="col-span-2 text-right font-semibold tabular-nums">{r.winningPoints}</div>
                  </div>
                );
              })}

              {/* フッター: 更新日時など */}
              <div className="p-3 text-xs text-muted-foreground">
                {data.updatedAt ? `更新: ${new Date(data.updatedAt).toLocaleString()}` : null}
                {data.season ? ` / シーズン: ${data.season}` : null}
              </div>
            </div>
          ))}
      </main>
    </div>
  );
}
