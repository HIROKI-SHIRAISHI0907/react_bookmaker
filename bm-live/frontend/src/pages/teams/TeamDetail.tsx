import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, useMemo } from "react";
import { fetchTeamDetail, type TeamDetail as TeamDetailType } from "../../api/leagues";
import { fetchTeamCorrelations, type CorrelationsBySideScore } from "../../api/correlations";
import { Skeleton } from "../../components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import CorrelationPanel from "../../components/correlation/CorrelationPanel";

export default function TeamDetail() {
  const params = useParams<{
    country?: string;
    league?: string;
    team?: string;
    teams?: string;
  }>();

  // ルーターから来る値（エンコード済みのことが多い）
  const countryParam = params.country ?? "";
  const leagueParam = params.league ?? "";
  const teamSlug = params.team ?? params.teams ?? "";

  // 表示用 & API 入力用に decode
  const safeDecode = (s: string) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  };
  const countryLabel = safeDecode(countryParam); // 表示用の素のラベル（日本語など）
  const leagueLabel = safeDecode(leagueParam);

  // ---- Queries（decode 済みを渡す！）----
  const detailQ = useQuery<TeamDetailType>({
    queryKey: ["team-detail", countryLabel, leagueLabel, teamSlug],
    queryFn: () => fetchTeamDetail(countryLabel, leagueLabel, teamSlug),
    enabled: !!countryLabel && !!leagueLabel && !!teamSlug,
    staleTime: 10_000,
  });

  const corrQ = useQuery<CorrelationsBySideScore>({
    queryKey: ["team-correlations", countryLabel, leagueLabel, teamSlug],
    queryFn: () => fetchTeamCorrelations(countryLabel, leagueLabel, teamSlug),
    enabled: !!countryLabel && !!leagueLabel && !!teamSlug,
    staleTime: 10_000,
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
    if (!d) return false;
    const sum =
      (d.HOME?.["1st"]?.length ?? 0) + (d.HOME?.["2nd"]?.length ?? 0) + (d.HOME?.ALL?.length ?? 0) + (d.AWAY?.["1st"]?.length ?? 0) + (d.AWAY?.["2nd"]?.length ?? 0) + (d.AWAY?.ALL?.length ?? 0);
    return sum === 0;
  }, [corrQ.data]);

  // 戻りリンクは decode 済みラベルを encode し直して作る（raw を二重エンコードしない）
  const toBack = `/${encodeURIComponent(countryLabel)}/${encodeURIComponent(leagueLabel)}`;

  return (
    <div className="p-4 space-y-6">
      {/* パンくず（常時表示） */}
      <div className="mb-2 flex items-center gap-3">
        <Link to={toBack} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline">
          <ArrowLeft className="w-4 h-4" />
          {countryLabel} / {leagueLabel} に戻る
        </Link>
      </div>

      {/* チーム見出し */}
      {!teamSlug ? (
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

      {/* 相関パネル */}
      <section>
        <h2 className="mb-2 text-xl font-bold">相関係数（上位5件）</h2>

        {showCorrSkeleton ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : corrQ.isError ? (
          <>
            <div className="text-muted-foreground">表示ができませんでした。</div>
          </>
        ) : corrQ.isLoading ? null : !corrQ.data || isCorrEmpty ? (
          <div className="text-muted-foreground">表示するデータがありません。</div>
        ) : (
          <CorrelationPanel data={corrQ.data} />
        )}
      </section>
    </div>
  );
}
