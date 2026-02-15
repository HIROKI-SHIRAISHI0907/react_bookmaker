// src/pages/teams/Team.tsx
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchTeamsInLeague, type TeamsInLeague } from "../../../api/leagues";
import { Skeleton } from "../../../components/ui/skeleton";
import AppHeader from "../../../components/layout/AppHeader";

export default function LeagueTeams() {
  // ✅ routingPath に切り替える前提：
  // Route は /league/:countrySlug/:leagueSlug みたいな形にしておくのがおすすめ
  // （今まだ /:country/:league なら param 名に合わせて変えてください）
  const { countrySlug = "", leagueSlug = "" } = useParams<{
    countrySlug: string;
    leagueSlug: string;
  }>();

  const { data, isLoading, isError } = useQuery<TeamsInLeague>({
    queryKey: ["teams-in-league", countrySlug, leagueSlug],
    queryFn: () => fetchTeamsInLeague(countrySlug, leagueSlug),
    staleTime: 60_000,
  });

  // 表示は API から返ってくる日本語名を使う（なければ slug）
  const countryLabel = data?.country ?? countrySlug;
  const leagueLabel = data?.league ?? leagueSlug;

  // ✅ “このリーグのroutingPath” を確定させる（APIが返す team.path を優先）
  // team.path を「/league/<countrySlug>/<leagueSlug>」で返す設計にしておくと完璧
  const leagueRoutingPath = data?.teams?.[0]?.path || `/league/${countrySlug}/${leagueSlug}`;

  // ✅ 順位表のルートは routingPath ベースで組み立て（日本語/スペース問題を完全排除）
  // 例: /league/japan/j1-league -> /ranking/league/japan/j1-league
  // ルーティング側は  <Route path="/ranking/*" element={<RankingPage/>} /> みたいにして受けるのが楽
  const rankingRoute = `/ranking${leagueRoutingPath}`;

  if (isError) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="チーム一覧" subtitle={`${countryLabel} / ${leagueLabel}`} />
        <main className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold mb-2">
            {countryLabel} / {leagueLabel}
          </h1>
          <p className="text-destructive">データの取得に失敗しました</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="チーム一覧" subtitle={`${countryLabel} / ${leagueLabel}`} />

      <main className="container mx-auto px-4 py-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">
              {countryLabel} / {leagueLabel}
            </h1>
            <p className="text-muted-foreground text-sm">Team List</p>
          </div>

          <Link to="/live" className="inline-flex items-center text-sm font-medium rounded-md border px-3 py-1.5 hover:bg-accent">
            現在開催中の試合 →
          </Link>

          <Link to={rankingRoute} className="inline-flex items-center text-sm font-medium rounded-md border px-3 py-1.5 hover:bg-accent">
            順位表 →
          </Link>
        </div>

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

        {data &&
          (data.teams.length === 0 ? (
            <div className="text-muted-foreground">表示するチームがありません。</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.teams.map((t) => (
                // ✅ ここが本命：routingPath をそのまま使う
                <Link key={t.routingPath} to={t.routingPath} className="group border rounded p-3 hover:bg-accent transition-colors">
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{t.routingPath}</div>
                </Link>
              ))}
            </div>
          ))}
      </main>
    </div>
  );
}
