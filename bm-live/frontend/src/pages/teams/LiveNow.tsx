// src/pages/teams/LiveNow.tsx
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import AppHeader from "../../components/layout/AppHeader";
import { Skeleton } from "../../components/ui/skeleton";
import { fetchLiveMatchesTodayAll, type LiveMatch } from "../../api/lives";
import { useNavigate } from "react-router-dom"; // ★追加

/** "90:58" -> "90'" など軽い整形。HT/前後半はそのまま */
function formatTimesMinute(s?: string | null) {
  if (!s) return "-";
  const t = s.trim();
  if (/ハーフタイム|第一ハーフ|前半|後半/i.test(t)) return t;
  const m1 = t.match(/^(\d{1,3}):\d{2}$/);
  if (m1) return `${Number(m1[1])}'`;
  const m2 = t.match(/^(\d{1,3})'$/);
  if (m2) return `${Number(m2[1])}'`;
  const m3 = t.match(/^(\d{1,3})\+\d{1,2}'$/);
  if (m3) return `${Number(m3[1])}'`;
  return t;
}

/** 並び替え用に “現在の分（推定）” を数値化 */
function liveMinuteValue(s?: string | null): number {
  if (!s) return -1;
  const t = s.trim();
  if (/ハーフタイム/i.test(t)) return 45;
  if (/前半/i.test(t)) return 30; // おおよそ
  if (/後半/i.test(t)) return 75; // おおよそ
  const m1 = t.match(/^(\d{1,3}):\d{2}$/);
  if (m1) return Number(m1[1]);
  const m2 = t.match(/^(\d{1,3})'$/);
  if (m2) return Number(m2[1]);
  const m3 = t.match(/^(\d{1,3})\+(\d{1,2})'$/);
  if (m3) return Number(m3[1]) + Number(m3[2]);
  return -1;
}

export default function LiveNow() {
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery<LiveMatch[]>({
    queryKey: ["live-now"],
    queryFn: () => fetchLiveMatchesTodayAll(),
    refetchInterval: 20_000,
    staleTime: 10_000,
  });

  // === data_category（=「国: リーグ …」）でグルーピング & 整列 ===
  const grouped = useMemo(() => {
    const map = new Map<string, LiveMatch[]>();
    (data ?? []).forEach((m) => {
      const key = (m.data_category || "その他").trim();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    });
    // 見出し（カテゴリ）を日本語ロケールでソート
    const categories = Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b, "ja"));
    // 各カテゴリ内は “現在の分” 降順（進んでいる試合が上）
    return categories.map(([cat, list]) => [cat, list.slice().sort((a, b) => liveMinuteValue(b.times) - liveMinuteValue(a.times))]) as Array<[string, LiveMatch[]]>;
  }, [data]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="現在開催中の試合" subtitle="本日（全リーグ）" />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* パンくず */}
        <div className="mb-2 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)} // ★戻る
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            戻る
          </button>
        </div>

        {/* 見出し */}
        <div>
          <h1 className="text-2xl font-bold">現在開催中の試合</h1>
          <p className="text-sm text-muted-foreground">本日開催中の全ての国・リーグを表示</p>
        </div>

        {/* コンテンツ */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border rounded p-3">
                <Skeleton className="h-4 w-28 mb-2" />
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="text-destructive">ライブデータの取得に失敗しました。</div>
        ) : !data || data.length === 0 ? (
          <div className="text-muted-foreground">現在ライブ中の試合はありません。</div>
        ) : (
          <div className="space-y-6">
            {grouped.map(([category, matches]) => (
              <section key={category} className="space-y-3">
                <h2 className="text-lg font-semibold">{category}</h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {matches.map((m) => (
                    <li key={m.seq} className="group border rounded p-3 hover:bg-accent transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium truncate">{m.home_team_name}</span>
                            <span className="text-xl font-bold tabular-nums">{m.home_score ?? "-"}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-medium truncate">{m.away_team_name}</span>
                            <span className="text-xl font-bold tabular-nums">{m.away_score ?? "-"}</span>
                          </div>
                        </div>
                        <div className="ml-3 text-right">
                          <span className="inline-flex items-center rounded-full bg-red-100 text-red-700 text-[11px] font-semibold px-2 py-0.5 mb-1">LIVE</span>
                          <div className="font-semibold tabular-nums">{formatTimesMinute(m.times)}</div>
                        </div>
                      </div>

                      <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                        <div>
                          on target: <span className="font-medium text-foreground">{m.home_shoot_in ?? "-"}</span> / <span className="font-medium text-foreground">{m.away_shoot_in ?? "-"}</span>
                        </div>
                        <div>
                          xG: <span className="font-medium text-foreground">{m.home_exp ?? "-"}</span> / <span className="font-medium text-foreground">{m.away_exp ?? "-"}</span>
                        </div>
                        <div>更新: {m.record_time ? new Date(m.record_time).toLocaleString("ja-JP") : "-"}</div>
                      </div>

                      {m.link && (
                        <div className="mt-2 text-right">
                          <a href={m.link} rel="noreferrer" className="text-xs underline" onClick={(e) => e.stopPropagation()}>
                            外部詳細
                          </a>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
