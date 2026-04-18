// src/pages/humberger/LeagueMenuPage.tsx
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchTeamsInLeague, type TeamsInLeague } from "../../api/leagues";
import AppHeader from "../../components/layout/AppHeader";

function normalizeText(v?: string | null) {
  return (v ?? "").trim();
}

function normalizeSubLeagueLabel(v?: string | null) {
  const s = normalizeText(v);
  if (!s) return "";
  return s.startsWith("▶︎") ? s : `▶︎${s}`;
}

export default function LeagueMenuPage() {
  const { countrySlug, leagueSlug } = useParams<{
    countrySlug: string;
    leagueSlug: string;
  }>();

  const [searchParams] = useSearchParams();

  const subLeague = useMemo(() => {
    const v = searchParams.get("subLeague");
    return v?.trim() ? v.trim() : null;
  }, [searchParams]);

  const isParamMissing = !countrySlug || !leagueSlug;

  const { data, isLoading, isError, error } = useQuery<TeamsInLeague>({
    queryKey: ["teams", countrySlug, leagueSlug, subLeague],
    queryFn: () => fetchTeamsInLeague(countrySlug!, leagueSlug!, subLeague),
    enabled: !isParamMissing,
    staleTime: 60_000,
  });

  if (isParamMissing) {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-6 text-foreground">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold">リーグが見つかりません</h1>
          <p className="mb-4 text-muted-foreground">国またはリーグの URL パラメータが不足しています。</p>
          <Link className="underline" to="/top">
            トップへ戻る
          </Link>
        </div>
      </div>
    );
  }

  const pageCountry = data?.country ?? countrySlug;
  const pageLeague = data?.league ?? leagueSlug;
  const pageSubLeague = data?.subLeague ?? subLeague;

  const subtitle = pageSubLeague ? `${pageCountry} / ${pageLeague} / ${normalizeSubLeagueLabel(pageSubLeague)}` : `${pageCountry} / ${pageLeague}`;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="リーグ" subtitle={subtitle} />

      <main className="container mx-auto px-4 py-6">
        {isLoading && <div className="p-4">Loading...</div>}

        {isError && <div className="p-4 text-red-600">読み込みに失敗しました: {(error as Error)?.message}</div>}

        {data && (
          <>
            <h1 className="mb-4 text-xl font-bold">
              {data.country} / {data.league}
              {pageSubLeague ? ` / ${normalizeSubLeagueLabel(pageSubLeague)}` : ""}
            </h1>

            {/* 親リーグ：subLeague未指定時だけ variants を表示 */}
            {!pageSubLeague && Array.isArray(data.variants) && data.variants.length > 0 ? (
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.variants.map((v) => {
                  const to = v.path || v.routingPath || "#";
                  return (
                    <li key={`${v.name}__${to}`}>
                      <Link to={to} className="block rounded-lg border p-4 hover:bg-accent hover:text-accent-foreground">
                        <div className="font-medium">{v.name}</div>
                        <div className="mt-1 text-xs text-muted-foreground">teams: {v.teamCount}</div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : null}

            {/* subLeague指定時 or 子リーグ時：teams を表示 */}
            {Array.isArray(data.teams) && data.teams.length > 0 ? (
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.teams.map((t) => (
                  <li key={t.hash}>
                    <Link to={t.routingPath} className="block rounded-lg border p-4 hover:bg-accent hover:text-accent-foreground">
                      <div className="font-medium">{t.name}</div>
                      <div className="mt-1 truncate text-xs text-muted-foreground">{t.routingPath}</div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}

            {!isLoading && (!data.teams || data.teams.length === 0) && (!data.variants || data.variants.length === 0) && (
              <div className="rounded-lg border p-4 text-sm text-muted-foreground">表示できるデータがありません。</div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
