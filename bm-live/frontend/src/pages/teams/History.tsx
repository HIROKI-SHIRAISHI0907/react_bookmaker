// frontend/src/pages/teams/History.tsx
import { Link, useParams } from "react-router-dom";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import AppHeader from "../../components/layout/AppHeader";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "../../components/ui/skeleton";

import { fetchPastMatches, type PastMatch } from "../../api/histories";
import { fetchTeamDetail, type TeamDetail as TeamDetailType } from "../../api/leagues";

export default function History() {
  const params = useParams<{ country?: string; league?: string; team?: string }>();
  const countryParam = params.country ?? "";
  const leagueParam = params.league ?? "";
  const teamSlug = params.team ?? "";

  const safeDecode = (s: string) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  };
  const countryLabel = safeDecode(countryParam);
  const leagueLabel = safeDecode(leagueParam);

  // 表示/判定用：チーム正式名
  const teamQ = useQuery<TeamDetailType>({
    queryKey: ["team-detail", countryLabel, leagueLabel, teamSlug],
    queryFn: () => fetchTeamDetail(countryLabel, leagueLabel, teamSlug),
    enabled: !!countryLabel && !!leagueLabel && !!teamSlug,
    staleTime: 60_000,
  });

  // 履歴一覧
  const historyQ = useQuery<PastMatch[]>({
    queryKey: ["team-history", countryLabel, leagueLabel, teamSlug],
    queryFn: () => fetchPastMatches(countryLabel, leagueLabel, teamSlug),
    enabled: !!countryLabel && !!leagueLabel && !!teamSlug,
    staleTime: 60_000,
  });

  // 勝敗判定（全角/半角スペースゆらぎ吸収）
  const norm = (s: string) =>
    s
      .replace(/[\u3000\u00A0]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

  const resultOf = (m: PastMatch, teamName: string): "WIN" | "LOSE" | "DRAW" => {
    const key = norm(teamName);
    const home = norm(m.homeTeam);
    const away = norm(m.awayTeam);
    const hs = Number(m.homeScore ?? 0);
    const as = Number(m.awayScore ?? 0);

    if (home === key) return hs > as ? "WIN" : hs < as ? "LOSE" : "DRAW";
    if (away === key) return as > hs ? "WIN" : as < hs ? "LOSE" : "DRAW";
    return "DRAW"; // 万一一致しなければ引き分け扱い（色は緑）
  };

  // 新しい順に整列
  const rows = useMemo(() => {
    const list = historyQ.data ?? [];
    return [...list].sort((a, b) => new Date(b.matchTime).getTime() - new Date(a.matchTime).getTime());
  }, [historyQ.data]);

  // パス生成用（詳細へ）
  const encCountry = encodeURIComponent(countryLabel);
  const encLeague = encodeURIComponent(leagueLabel);

  // 戻るリンク/サブタイトル
  const toBack = `/${encCountry}/${encLeague}`;
  const headerSubtitle = `${countryLabel} / ${leagueLabel} / 過去の対戦履歴`;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="過去の対戦履歴" subtitle={headerSubtitle} />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* パンくず */}
        <div className="mb-2 flex items-center gap-3">
          <Link to={toBack} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline">
            <ArrowLeft className="w-4 h-4" />
            {countryLabel} / {leagueLabel} に戻る
          </Link>
        </div>

        {/* カード */}
        <section className="rounded-xl border bg-card shadow-sm">
          {historyQ.isLoading || teamQ.isLoading ? (
            <div className="p-4 space-y-3">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-3/4" />
            </div>
          ) : historyQ.isError || teamQ.isError ? (
            <div className="p-4 text-sm text-destructive">履歴の取得に失敗しました。</div>
          ) : rows.length === 0 || !teamQ.data ? (
            <div className="p-4 text-sm text-muted-foreground">表示できる対戦履歴がありません。</div>
          ) : (
            <ul className="divide-y">
              {rows.map((m) => {
                const result = resultOf(m, teamQ.data!.name);
                const resultClass = result === "WIN" ? "text-red-600 font-extrabold" : result === "LOSE" ? "text-blue-600 font-extrabold" : "text-green-600 font-extrabold";

                const detailPath = `/${encodeURIComponent(countryLabel)}/${encodeURIComponent(leagueLabel)}/${encodeURIComponent(teamSlug)}/history/${m.seq}`;

                return (
                  <Link key={m.seq} to={detailPath} className="group flex items-center gap-3 py-3 px-4 hover:bg-accent/40 transition rounded-md">
                    {/* ラウンド */}
                    <div className="w-32 shrink-0 text-sm">
                      {m.roundNo != null ? <span className="font-bold">ラウンド {m.roundNo}</span> : <span className="text-muted-foreground">ラウンド -</span>}
                    </div>

                    {/* 左（対戦 + 日付） */}
                    <div className="flex-1">
                      <div className="text-sm">
                        {m.homeTeam} vs {m.awayTeam}
                        {m.link && (
                          <>
                            {" "}
                            ·{" "}
                            <a className="underline" href={m.link} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                              外部詳細
                            </a>
                          </>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{m.matchTime ? new Date(m.matchTime).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }) : "-"}</div>
                    </div>

                    {/* 右（スコア + 結果） */}
                    <div className="w-24 text-right">
                      <div className="text-sm">
                        {m.homeScore ?? 0} - {m.awayScore ?? 0}
                      </div>
                      <div className={`text-xs ${resultClass}`}>{result}</div>
                    </div>
                  </Link>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
