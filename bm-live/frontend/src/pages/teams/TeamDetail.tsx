// frontend/src/pages/league/TeamDetail.tsx
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, useMemo } from "react";
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

  const countryLabel = decodeURIComponent(country);
  const leagueLabel = decodeURIComponent(league);

  // ---- Queries ----
  const detailQ = useQuery<TeamDetailType>({
    queryKey: ["team-detail", country, league, team],
    queryFn: () => fetchTeamDetail(country, league, team),
    enabled: !!country && !!league && !!team,
    staleTime: 60_000,
  });

  const corrQ = useQuery<CorrelationsByScore>({
    queryKey: ["team-correlations", country, league, team],
    queryFn: () => fetchTeamCorrelations(country, league, team),
    enabled: !!country && !!league && !!team,
    staleTime: 60_000,
  });

  // ---- Correlation Loading Skeleton (delayed) ----
  const [showCorrSkeleton, setShowCorrSkeleton] = useState(false);
  useEffect(() => {
    if (corrQ.isLoading) {
      const t = setTimeout(() => setShowCorrSkeleton(true), 300);
      return () => clearTimeout(t);
    }
    setShowCorrSkeleton(false);
  }, [corrQ.isLoading]);

  const isCorrEmpty = useMemo(() => {
    const d = corrQ.data;
    if (!d) return false; // 未確定時はここで判定しない
    const c1 = d["1st"]?.length ?? 0;
    const c2 = d["2nd"]?.length ?? 0;
    const ca = d["ALL"]?.length ?? 0;
    return c1 === 0 && c2 === 0 && ca === 0;
  }, [corrQ.data]);

  return (
    <div className="p-4 space-y-6">
      {/* パンくず（常時表示） */}
      <div className="mb-2 flex items-center gap-3">
        <Link to={`/${country}/${league}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline">
          <ArrowLeft className="w-4 h-4" />
          {countryLabel} / {leagueLabel} に戻る
        </Link>
      </div>

      {/* チーム見出し */}
      {!team ? (
        <div className="text-sm text-muted-foreground">チームが指定されていません。</div>
      ) : detailQ.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-64" />
        </div>
      ) : detailQ.isError ? (
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

        {showCorrSkeleton ? (
          // ローディング時（300ms超過で出す）
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : corrQ.isError ? (
          // 取得失敗
          <div className="text-muted-foreground">表示ができませんでした。</div>
        ) : corrQ.isLoading ? null : !corrQ.data || isCorrEmpty ? ( // 300ms未満で確定した場合は何も出さず、すぐ次の状態へ
          // データ無し
          <div className="text-muted-foreground">表示するデータがありません。</div>
        ) : (
          // データあり
          <CorrelationTabs data={corrQ.data} />
        )}
      </section>
    </div>
  );
}
