// frontend/src/pages/league/TeamDetail.tsx
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchTeamDetail, type TeamDetail as TeamDetailType } from "../../api/leagues";
import { fetchTeamCorrelations, type CorrelationsByScore } from "../../api/correlations";
import { Skeleton } from "../../components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import CorrelationTabs from "../../components/correlation/CorrelationTab";

export default function TeamDetail() {
  const {
    country = "",
    league = "",
    team = "",
  } = useParams<{
    country: string;
    league: string;
    team: string;
  }>();

  // team が空なら描画を止めておく（無限リトライ防止）
  if (!team) return <div>チームが指定されていません。</div>;
  const teamSlug = team;

  const detailQ = useQuery<TeamDetailType>({
    queryKey: ["team-detail", country, league, teamSlug],
    queryFn: () => fetchTeamDetail(country, league, teamSlug),
    staleTime: 60_000,
  });

  const corrQ = useQuery<CorrelationsByScore>({
    queryKey: ["team-correlations", country, league, team],
    queryFn: () => fetchTeamCorrelations(country, league, team),
    staleTime: 60_000,
  });

  const countryLabel = decodeURIComponent(country);
  const leagueLabel = decodeURIComponent(league);

  return (
    <div className="p-4 space-y-6">
      {/* パンくず */}
      <div className="mb-2 flex items-center gap-3">
        <Link to={`/${country}/${league}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline">
          <ArrowLeft className="w-4 h-4" />
          {countryLabel} / {leagueLabel} に戻る
        </Link>
      </div>

      {/* チーム見出し */}
      {detailQ.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-64" />
        </div>
      ) : detailQ.error ? (
        <div className="text-destructive">チーム情報の取得に失敗しました</div>
      ) : detailQ.data ? (
        <div>
          <h1 className="text-2xl font-bold">{detailQ.data.name}</h1>
          <p className="text-sm text-muted-foreground">
            英語スラッグ: <code>{detailQ.data.english}</code>
          </p>
        </div>
      ) : null}

      {/* 相関タブ */}
      <section>
        <h2 className="mb-2 text-xl font-bold">相関係数（上位5件）</h2>
        {corrQ.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : corrQ.error ? (
          <div className="text-destructive">相関データの取得に失敗しました</div>
        ) : corrQ.data ? (
          <CorrelationTabs data={corrQ.data} />
        ) : null}
      </section>
    </div>
  );
}
