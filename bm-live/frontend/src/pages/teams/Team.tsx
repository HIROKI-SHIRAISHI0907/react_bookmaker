// src/pages/teams/Team.tsx
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchTeamsInLeague, type TeamsInLeague } from "../../api/leagues";
import { Skeleton } from "../../components/ui/skeleton";
import AppHeader from "../../components/layout/AppHeader"; // ← 追加

export default function LeagueTeams() {
  // URLの country / league は既に encodeURIComponent 済みなので、表示・API の両方で raw を用意
  const { country = "", league = "" } = useParams();

  const countryRaw = decodeURIComponent(country);
  const leagueRaw = decodeURIComponent(league);

  const { data, isLoading, isError } = useQuery<TeamsInLeague>({
    // キャッシュキーも raw に統一
    queryKey: ["teams-in-league", countryRaw, leagueRaw],
    // API 側で encode する想定なので、ここでは raw を渡す
    queryFn: () => fetchTeamsInLeague(countryRaw, leagueRaw),
    staleTime: 60_000,
  });

  if (isError) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="チーム一覧" subtitle={`${countryRaw} / ${leagueRaw}`} />
        <main className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold mb-2">
            {countryRaw} / {leagueRaw}
          </h1>
          <p className="text-destructive">データの取得に失敗しました</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ← ハンバーガー付きヘッダー */}
      <AppHeader title="チーム一覧" subtitle={`${countryRaw} / ${leagueRaw}`} />

      <main className="container mx-auto px-4 py-6">
        {/* 見出し + 右上に「現在開催中の試合」ボタン */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">
              {countryRaw} / {leagueRaw}
            </h1>
            <p className="text-muted-foreground text-sm">Team List</p>
          </div>

          {/* ← TeamDetailの「過去の対戦履歴を見る」と同じクラスを使用 */}
          <Link to={`/live`} className="inline-flex items-center text-sm font-medium rounded-md border px-3 py-1.5 hover:bg-accent">
            現在開催中の試合 →
          </Link>
        </div>

        {/* ローディング */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="border rounded p-3">
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </div>
        )}

        {/* データ */}
        {data &&
          (data.teams.length === 0 ? (
            <div className="text-muted-foreground">表示するチームがありません。</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.teams.map((t) => {
                // params の country / league はすでにエンコード済みなので、それを使って OK
                const teamRoute = `/${country}/${league}/${t.english}`;
                return (
                  <Link key={t.link} to={teamRoute} className="group border rounded p-3 hover:bg-accent transition-colors">
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      /team/{t.english}/{t.hash}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
      </main>
    </div>
  );
}
