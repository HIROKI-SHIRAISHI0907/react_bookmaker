import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchTeamsInLeague, type TeamsInLeague } from "../../api/leagues";

export default function LeagueMenuPage() {
  const { countrySlug, leagueSlug } = useParams<{ countrySlug: string; leagueSlug: string }>();

  const isParamMissing = !countrySlug || !leagueSlug;

  const { data, isLoading, isError, error } = useQuery<TeamsInLeague>({
    queryKey: ["teams", countrySlug, leagueSlug],
    queryFn: () => fetchTeamsInLeague(countrySlug!, leagueSlug!),
    enabled: !isParamMissing,
    staleTime: 60_000,
  });

  if (isParamMissing) {
    return (
      <div className="min-h-screen bg-background text-foreground grid place-items-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">リーグが見つかりません</h1>
          <p className="text-muted-foreground mb-4">国またはリーグの URL パラメータが不足しています。</p>
          <Link className="underline" to="/top">
            トップへ戻る
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) return <div className="p-4">Loading...</div>;
  if (isError) return <div className="p-4 text-red-600">読み込みに失敗しました: {(error as Error)?.message}</div>;
  if (!data) return null;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">
        {data.country} / {data.league}
      </h1>

      <ul className="mt-4 space-y-2">
        {data.teams.map((t) => (
          <li key={t.hash} className="rounded border p-2">
            {t.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
