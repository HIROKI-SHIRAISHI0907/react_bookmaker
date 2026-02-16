// src/pages/humberger/LeagueMenuPage.tsx
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchTeamsInLeague, type TeamsInLeague } from "../../api/leagues";
import AppHeader from "../../components/layout/AppHeader";

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

  return (
    <div className="min-h-screen bg-background">
      {/* Dashboard と同じヘッダー（ハンバーガー付き） */}
      <AppHeader title="リーグ" subtitle={`${data?.country ?? countrySlug} / ${data?.league ?? leagueSlug}`} />

      <main className="container mx-auto px-4 py-6">
        {isLoading && <div className="p-4">Loading...</div>}
        {isError && <div className="p-4 text-red-600">読み込みに失敗しました: {(error as Error)?.message}</div>}

        {data && (
          <>
            <h1 className="text-xl font-bold mb-4">
              {data.country} / {data.league}
            </h1>

            {/* ✅ カード風リスト */}
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.teams.map((t) => (
                <li key={t.hash}>
                  <Link
                    to={t.routingPath}
                    className="
                      block rounded-lg border p-4
                      transition-colors duration-150
                      hover:bg-accent hover:text-accent-foreground
                      cursor-pointer
                      focus:outline-none focus:ring-2 focus:ring-ring
                    "
                  >
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-muted-foreground mt-1 truncate">{t.routingPath}</div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}
