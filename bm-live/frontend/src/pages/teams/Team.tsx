// frontend/src/pages/team/Teams.tsx
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchTeamsInLeague, type TeamsInLeague } from "../../api/leagues";
import { Skeleton } from "../../components/ui/skeleton";

export default function LeagueTeams() {
  // URL の country / league は encodeURIComponent 済みが来るので decode して表示にも使う
  const { country = "", league = "" } = useParams();

  const { data, isLoading, error } = useQuery<TeamsInLeague>({
    queryKey: ["teams-in-league", country, league],
    queryFn: () => fetchTeamsInLeague(country, league),
    staleTime: 60_000,
  });

  if (error) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold mb-2">チーム一覧</h1>
        <p className="text-destructive">データの取得に失敗しました</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* 見出し */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold">
          {decodeURIComponent(country)} / {decodeURIComponent(league)}
        </h1>
        <p className="text-muted-foreground text-sm">Team List</p>
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
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.teams.map((t) => {
            // チーム詳細ページへのアプリ内リンク（/country/league/<english> などにしたい場合）
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
      )}
    </div>
  );
}
