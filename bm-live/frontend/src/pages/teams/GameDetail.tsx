// frontend/src/pages/teams/GameDetails.tsx
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import AppHeader from "../../components/layout/AppHeader";
import { Skeleton } from "../../components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { fetchGameDetail, type GameDetail } from "../../api/gameDetails";

export default function GameDetail() {
  const params = useParams<{ country?: string; league?: string; team?: string; seq?: string }>();
  const country = decode(params.country ?? "");
  const league = decode(params.league ?? "");
  const team = params.team ?? "";
  const seq = params.seq ?? "";

  const q = useQuery<GameDetail>({
    queryKey: ["game-detail", country, league, team, seq],
    queryFn: () => fetchGameDetail(country, league, team, seq),
    enabled: !!country && !!league && !!team && !!seq,
    staleTime: 30_000,
  });

  const toBack = `/${encodeURIComponent(country)}/${encodeURIComponent(league)}/${encodeURIComponent(team)}`;

  const badge = (w: GameDetail["winner"]) =>
    w === "DRAW" ? (
      <span className="px-2 py-0.5 text-xs rounded bg-green-50 text-green-700 border">DRAW</span>
    ) : w === "HOME" ? (
      <span className="px-2 py-0.5 text-xs rounded bg-red-50 text-red-700 border font-bold">HOME WIN</span>
    ) : w === "AWAY" ? (
      <span className="px-2 py-0.5 text-xs rounded bg-blue-50 text-blue-700 border font-bold">AWAY WIN</span>
    ) : (
      // LIVE は別UIで扱うのでここでは使わない
      <span className="hidden" />
    );

  // times 正規化: "MM:SS" / "MM'" / "MM+X'" → "NN`" に統一
  const toMinuteTick = (t: string | null | undefined): string | null => {
    if (!t) return null;
    const s = t.trim();
    if (/終了/.test(s)) return null;
    // 例: 68:09
    const m1 = s.match(/^(\d{1,3}):\d{2}$/);
    if (m1) return `${parseInt(m1[1], 10)}\``;
    // 例: 45+2'
    const m2 = s.match(/^(\d{1,3})\s*\+\s*(\d{1,2})'?$/);
    if (m2) return `${parseInt(m2[1], 10) + parseInt(m2[2], 10)}\``;
    // 例: 68'
    const m3 = s.match(/^(\d{1,3})'?$/);
    if (m3) return `${parseInt(m3[1], 10)}\``;
    // その他は ' → ` に置換して返す
    return s.replace(/'/g, "`");
  };

  // 表示用: "ハーフタイム"/"第一ハーフ" はそのまま。
  // それ以外は "MM:SS" / "MM'" / "MM+X'" → "NN`" に統一。
  // "終了" を含む場合は null（＝時間非表示）。
  const toDisplayTime = (t: string | null | undefined): string | null => {
    if (!t) return null;
    const s = t.trim();
    if (/終了/.test(s)) return null;

    // ← 追加ポイント：これらはそのまま表示
    if (/ハーフタイム|第一ハーフ/.test(s)) return s;

    // 例: 68:09
    const m1 = s.match(/^(\d{1,3}):\d{2}$/);
    if (m1) return `${parseInt(m1[1], 10)}\``;

    // 例: 45+2'
    const m2 = s.match(/^(\d{1,3})\s*\+\s*(\d{1,2})'?$/);
    if (m2) return `${parseInt(m2[1], 10) + parseInt(m2[2], 10)}\``;

    // 例: 68'
    const m3 = s.match(/^(\d{1,3})'?$/);
    if (m3) return `${parseInt(m3[1], 10)}\``;

    // その他は ' → ` 置換だけ
    return s.replace(/'/g, "`");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="試合 詳細" subtitle={`${country} / ${league}`} />

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
            {/* スコアヘッダ */}
            <section className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {q.data.competition}
                  {q.data.round_no != null && <span className="ml-2 font-bold">ラウンド {q.data.round_no}</span>}
                </div>

                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  {new Date(q.data.recorded_at).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
                  {/* LIVE 中は勝敗バッジの代わりに LIVE + 経過分表示（XX`） */}
                  {q.data.winner === "LIVE" && (
                    <span className="ml-2 inline-flex items-center gap-2">
                      <span className="rounded-full border px-2 py-0.5 text-[11px] leading-none">LIVE</span>
                      {toDisplayTime(q.data.times) && <span className="text-[11px] text-muted-foreground">{toDisplayTime(q.data.times)}</span>}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex-1 text-left">
                  <div className="text-lg font-semibold">{q.data.home.name}</div>
                </div>
                <div className="px-4 text-3xl font-bold">
                  {q.data.home.score} <span className="text-muted-foreground text-xl mx-2">-</span> {q.data.away.score}
                </div>
                <div className="flex-1 text-right">
                  <div className="text-lg font-semibold">{q.data.away.name}</div>
                </div>
              </div>

              {/* 試合終了時のみ結果バッジを表示 */}
              {q.data.winner !== "LIVE" && <div className="mt-3 flex items-center justify-center gap-3">{badge(q.data.winner)}</div>}
            </section>

            {/* チーム統計 */}
            <section className="grid md:grid-cols-2 gap-4">
              <TeamStatCard title="ホーム" side="home" data={q.data} />
              <TeamStatCard title="アウェイ" side="away" data={q.data} />
            </section>

            {(q.data.venue.stadium || q.data.venue.audience || q.data.venue.capacity) && (
              <section className="rounded-2xl border bg-card p-4 shadow-sm">
                <h3 className="text-base font-semibold mb-2">会場情報</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {q.data.venue.stadium && <li>スタジアム: {q.data.venue.stadium}</li>}
                  {q.data.venue.audience && <li>観客数: {q.data.venue.audience}</li>}
                  {q.data.venue.capacity && <li>収容人数: {q.data.venue.capacity}</li>}
                </ul>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function TeamStatCard({ title, side, data }: { title: string; side: "home" | "away"; data: GameDetail }) {
  const d = data[side];
  const Line = ({ k, v }: { k: string; v: string }) => (
    <li className="flex items-center justify-between py-2">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium">{v}</span>
    </li>
  );
  const fmtNum = (n: number | null | undefined) => (n == null ? "-" : String(n));
  const fmtPct = (n: number | null | undefined) => (n == null ? "-" : `${n}%`);

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold">{title}</h3>
        <div className="text-xs text-muted-foreground">{d.manager ? `監督: ${d.manager}` : ""}</div>
      </div>
      <div className="text-sm text-muted-foreground mb-3">{d.formation ? `フォーメーション: ${d.formation}` : "-"}</div>
      <ul className="text-sm divide-y">
        <Line k="xG" v={fmtNum(d.xg)} />
        <Line k="ポゼッション" v={fmtPct(d.possession)} />
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

function decode(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
