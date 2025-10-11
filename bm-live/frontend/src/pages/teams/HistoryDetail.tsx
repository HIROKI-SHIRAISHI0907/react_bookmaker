// frontend/src/pages/teams/HistoryDetail.tsx
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import AppHeader from "../../components/layout/AppHeader";
import { Skeleton } from "../../components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { fetchHistoryDetail, type HistoryDetail, type SideStats } from "../../api/historyDetails";

export default function HistoryDetail() {
  const params = useParams<{ country?: string; league?: string; team?: string; seq?: string }>();
  const countryParam = params.country ?? "";
  const leagueParam = params.league ?? "";
  const teamSlug = params.team ?? "";
  const seq = params.seq ?? "";

  const decode = (s: string) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  };
  const country = decode(countryParam);
  const league = decode(leagueParam);

  const q = useQuery<HistoryDetail>({
    queryKey: ["history-detail", country, league, teamSlug, seq],
    queryFn: () => fetchHistoryDetail(country, league, teamSlug, seq),
    enabled: !!country && !!league && !!teamSlug && !!seq,
    staleTime: 60_000,
  });

  const toBack = `/${encodeURIComponent(country)}/${encodeURIComponent(league)}/${encodeURIComponent(teamSlug)}/history`;

  const h = q.data?.home ?? {};
  const a = q.data?.away ?? {};

  const titleText = (h as SideStats).name && (a as SideStats).name ? `${(h as SideStats).name} vs ${(a as SideStats).name}` : "過去対戦 詳細";

  const headerSubtitle =
    q.data?.competition && (h as SideStats).name && (a as SideStats).name ? `${country} / ${league} / ${(h as SideStats).name} vs ${(a as SideStats).name}` : `${country} / ${league}`;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title={titleText} subtitle={headerSubtitle} />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="mb-2 flex items-center gap-3">
          <Link to={toBack} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline">
            <ArrowLeft className="w-4 h-4" />
            戻る
          </Link>
        </div>

        {q.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-60" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : q.isError ? (
          <div className="text-destructive text-sm">詳細の取得に失敗しました。</div>
        ) : !q.data ? null : (
          <>
            <ScoreHeader d={q.data} />
            <section className="grid md:grid-cols-2 gap-4">
              <TeamStatCard title="ホーム" side="home" data={q.data} />
              <TeamStatCard title="アウェー" side="away" data={q.data} />
            </section>

            {(q.data.venue?.stadium || q.data.venue?.audience || q.data.venue?.capacity) && (
              <section className="rounded-2xl border bg-card p-4 shadow-sm">
                <h3 className="text-base font-semibold mb-2">会場情報</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {q.data.venue?.stadium && <li>スタジアム: {q.data.venue.stadium}</li>}
                  {q.data.venue?.audience && <li>観客数: {q.data.venue.audience}</li>}
                  {q.data.venue?.capacity && <li>収容人数: {q.data.venue.capacity}</li>}
                </ul>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

/* ---------- スコアヘッダー ---------- */
function ScoreHeader({ d }: { d: HistoryDetail }) {
  const h = (d.home ?? {}) as SideStats;
  const a = (d.away ?? {}) as SideStats;

  const winner: "HOME" | "AWAY" | "DRAW" = d.winner === "HOME" || d.winner === "AWAY" || d.winner === "DRAW" ? d.winner : "DRAW";

  const winnerBadge = (w: "HOME" | "AWAY" | "DRAW") => {
    if (w === "DRAW") return <span className="px-2 py-0.5 text-xs rounded bg-green-50 text-green-700 border">DRAW</span>;
    if (w === "HOME") return <span className="px-2 py-0.5 text-xs rounded bg-red-50 text-red-700 border font-bold">HOME WIN</span>;
    return <span className="px-2 py-0.5 text-xs rounded bg-blue-50 text-blue-700 border font-bold">AWAY WIN</span>;
  };

  const comp = d.competition ?? "";
  const headerLeft = [comp].filter(Boolean).join(" ");

  // recorded_at が無ければ null 表示
  const whenText = d.recorded_at ? new Date(d.recorded_at).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }) : "-";

  return (
    <section className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{headerLeft || "-"}</div>
        <div className="text-xs text-muted-foreground">{whenText}</div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex-1 text-left">
          <div className="text-lg font-semibold">{h.name ?? "-"}</div>
        </div>
        <div className="px-4 text-3xl font-bold">
          {fmtNum(h.score)} <span className="text-muted-foreground text-xl mx-2">-</span> {fmtNum(a.score)}
        </div>
        <div className="flex-1 text-right">
          <div className="text-lg font-semibold">{a.name ?? "-"}</div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center gap-3">{winnerBadge(winner)}</div>
    </section>
  );
}

/* ---------- チーム統計カード ---------- */
function TeamStatCard({ title, side, data }: { title: string; side: "home" | "away"; data: HistoryDetail }) {
  const d = (side === "home" ? data.home : data.away) ?? ({} as SideStats);

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold">{title}</h3>
        <div className="text-xs text-muted-foreground">{d.manager ? `監督: ${d.manager}` : ""}</div>
      </div>

      <div className="text-sm text-muted-foreground mb-3">{d.formation ? `フォーメーション: ${d.formation}` : "-"}</div>

      <ul className="text-sm divide-y">
        <Line k="xG" v={fmtFloat(d.xg)} />
        <Line k="ポゼッション" v={fmtPercent(d.possession)} />
        <Line k="シュート(総)" v={fmtNum(d.shots)} />
        <Line k="枠内シュート" v={fmtNum(d.shots_on)} />
        <Line k="枠外シュート" v={fmtNum(d.shots_off)} />
        <Line k="ブロック" v={fmtNum(d.blocks)} />
        <Line k="CK" v={fmtNum(d.corners)} />
        <Line k="ビッグチャンス" v={fmtNum(d.big_chances)} />
        <Line k="セーブ" v={fmtNum(d.saves)} />
        <Line k="警告" v={fmtNum(d.yc)} />
        <Line k="退場" v={fmtNum(d.rc)} />
        <Line k="パス成功" v={d.passes ?? "-"} />
        {d.long_passes && <Line k="ロングパス" v={d.long_passes} />}
      </ul>
    </div>
  );
}

/* ---------- 小物 ---------- */
function Line({ k, v }: { k: string; v: string }) {
  return (
    <li className="flex items-center justify-between py-2">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium">{v}</span>
    </li>
  );
}

function fmtNum(n: number | null | undefined) {
  return typeof n === "number" && !Number.isNaN(n) ? String(n) : "-";
}
function fmtFloat(n: number | null | undefined) {
  return typeof n === "number" && !Number.isNaN(n) ? String(Number(n.toFixed(2))) : "-";
}
function fmtPercent(n: number | null | undefined) {
  return typeof n === "number" && !Number.isNaN(n) ? `${Number(n.toFixed(0))}%` : "-";
}
