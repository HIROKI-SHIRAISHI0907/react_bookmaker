// チームページの統計詳細データ（2026-11 追加）
//  GET /v1/api/team-detail-stats?country=&league=&team=（B016 が取得した試合詳細を今季の試合で集計）
//  - TeamDetailSummary  : 右側のカード（詳細データのある試合数・平均評価点・監督・よく使うフォーメーション）
//  - TeamPlayerStats    : 左側の表（選手ごとの出場数・出場時間・ゴール・アシスト・平均評価点・xG など。並べ替え可）
//  - useTeamDetailStats : 同じデータを使う部品（メンバー一覧など）用。queryKey が同じなので 1 回だけ取りに行く
//  統計詳細データが無いチーム（取得していないリーグなど）は何も表示しない
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchTeamDetailStats } from "../../../api/team/teamapi";
import type { TeamDetailPlayer } from "../../../api/team/teamtypes";
import { Skeleton } from "../../../components/ui/skeleton";
import { ratingClass } from "../match/MatchDetailExtra";
import { positionLabel } from "../../../utils/matchDetailLabels";

export { ratingClass };

export function useTeamDetailStats(country: string, league: string, team: string) {
  return useQuery({
    queryKey: ["team-detail-stats", country, league, team],
    queryFn: () => fetchTeamDetailStats(country, league, team),
    enabled: !!country && !!league && !!team,
    staleTime: 10 * 60_000,
  });
}

/** 名前の突き合わせ用（全角半角・空白・「.」の違いを無視） */
export const nameKey = (s: string | null | undefined) =>
  (s ?? "").normalize("NFKC").replace(/[\s.・･]/g, "").toLowerCase();

// ===================== 右側のカード =====================
export function TeamDetailSummary({ country, league, team }: { country: string; league: string; team: string }) {
  const q = useTeamDetailStats(country, league, team);
  const d = q.data;
  if (q.isLoading) return <Skeleton className="h-32 w-full rounded-2xl" />;
  if (!d || d.summary.matchCount === 0) return null;
  const maxCount = Math.max(1, ...d.formations.map((f) => f.count));
  return (
    <section className="rounded-2xl border bg-card p-4" data-testid="team-detail-summary">
      <h2 className="mb-2 text-sm font-bold">今季の詳細データ</h2>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[12px]">
        <dt className="text-muted-foreground">試合数</dt>
        <dd>
          <b>{d.summary.matchCount}</b> 試合
          {d.summary.latestMatchDate && <span className="ml-1 text-[11px] text-muted-foreground">（最新 {d.summary.latestMatchDate}）</span>}
        </dd>
        {d.summary.averageRating != null && (
          <>
            <dt className="text-muted-foreground">平均評価点</dt>
            <dd>
              <span className={`rounded px-1.5 font-mono text-[11px] font-bold ${ratingClass(d.summary.averageRating)}`}>{d.summary.averageRating.toFixed(2)}</span>
            </dd>
          </>
        )}
        {d.summary.coach && (
          <>
            <dt className="text-muted-foreground">監督</dt>
            <dd className="truncate">{d.summary.coach}</dd>
          </>
        )}
      </dl>
      {d.formations.length > 0 && (
        <div className="mt-3">
          <div className="mb-1 text-[11px] font-bold text-muted-foreground">フォーメーション</div>
          <ul className="space-y-1">
            {d.formations.slice(0, 5).map((f) => (
              <li key={f.formation} className="flex items-center gap-2 text-[12px]">
                <span className="w-16 shrink-0 font-mono">{f.formation}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <span className="block h-full rounded-full bg-emerald-500" style={{ width: `${(f.count / maxCount) * 100}%` }} />
                </span>
                <span className="w-10 shrink-0 text-right font-mono text-[11px] text-muted-foreground">{f.count}回</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="mt-3 text-[10px] text-muted-foreground">試合後に取得した詳細データ（取得できた試合のみ）から集計しています。</p>
    </section>
  );
}

// ===================== 左側の選手スタッツ表 =====================
type SortKey = keyof Pick<
  TeamDetailPlayer,
  "apps" | "minutes" | "rating" | "goals" | "assists" | "xg" | "xa" | "shots" | "keyPasses" | "yellowCards" | "saves"
>;

const COLS: { key: SortKey; label: string; title: string; digits?: number }[] = [
  { key: "apps", label: "出場数", title: "出場数（詳細データのある試合）" },
  { key: "minutes", label: "出場時間", title: "出場時間（分）" },
  { key: "rating", label: "平均評価点", title: "平均評価点", digits: 2 },
  { key: "goals", label: "ゴール", title: "ゴール" },
  { key: "assists", label: "アシスト", title: "アシスト" },
  { key: "xg", label: "ゴール期待値", title: "ゴール期待値（xG。合計）", digits: 2 },
  { key: "xa", label: "アシスト期待値", title: "アシスト期待値（xA。合計）", digits: 2 },
  { key: "shots", label: "シュート", title: "シュート" },
  { key: "keyPasses", label: "キーパス", title: "キーパス" },
  { key: "yellowCards", label: "イエローカード", title: "イエローカード" },
  { key: "saves", label: "セーブ", title: "セーブ（ゴールキーパー）" },
];

const INITIAL = 15;

export function TeamPlayerStats({ country, league, team }: { country: string; league: string; team: string }) {
  const q = useTeamDetailStats(country, league, team);
  const [sortKey, setSortKey] = useState<SortKey>("apps");
  const [desc, setDesc] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const players = q.data?.players ?? [];

  // 値が1つも無い列は出さない
  const cols = useMemo(() => COLS.filter((c) => players.some((p) => p[c.key] != null)), [players]);
  const rows = useMemo(
    () =>
      [...players].sort((a, b) => {
        const va = a[sortKey];
        const vb = b[sortKey];
        if (va == null && vb == null) return 0;
        if (va == null) return 1;
        if (vb == null) return -1;
        return desc ? vb - va : va - vb;
      }),
    [players, sortKey, desc],
  );

  if (q.isLoading || players.length === 0) return null;
  const shown = expanded ? rows : rows.slice(0, INITIAL);

  const onSort = (k: SortKey) => {
    if (k === sortKey) setDesc((v) => !v);
    else {
      setSortKey(k);
      setDesc(true);
    }
  };

  return (
    <section className="rounded-2xl border bg-card p-4" data-testid="team-player-stats">
      <div className="mb-2 flex items-baseline gap-2">
        <h2 className="text-sm font-bold">今季の選手スタッツ</h2>
        <span className="text-xs text-muted-foreground">{q.data?.summary.matchCount ?? 0}試合の詳細データから</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-[12px]">
          <thead>
            <tr className="border-b text-[11px] text-muted-foreground">
              <th className="py-1 pr-2 text-left font-normal">選手</th>
              {cols.map((c) => (
                <th key={c.key} className="whitespace-nowrap px-1.5 py-1 text-right font-normal" title={c.title}>
                  <button type="button" onClick={() => onSort(c.key)} className={`hover:text-foreground ${sortKey === c.key ? "font-bold text-foreground" : ""}`}>
                    {c.label}
                    {sortKey === c.key ? (desc ? "↓" : "↑") : ""}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((p, i) => (
              <tr key={`${p.name}-${i}`} className="border-b border-border/50 last:border-0 hover:bg-muted/40">
                <td className="max-w-[180px] py-1 pr-2">
                  <span className="block truncate">{p.name}</span>
                  {p.position && <span className="block text-[10px] text-muted-foreground">{positionLabel(p.position)}</span>}
                </td>
                {cols.map((c) => {
                  const v = p[c.key];
                  if (c.key === "rating") {
                    return (
                      <td key={c.key} className="px-1 py-1 text-right">
                        {v != null ? <span className={`rounded px-1 font-mono text-[10px] font-bold ${ratingClass(v)}`}>{v.toFixed(2)}</span> : "-"}
                      </td>
                    );
                  }
                  return (
                    <td key={c.key} className={`px-1 py-1 text-right font-mono ${v == null || v === 0 ? "text-muted-foreground/60" : ""}`}>
                      {v == null ? "-" : c.digits ? v.toFixed(c.digits) : v}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > INITIAL && (
        <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-2 text-[11px] font-bold text-muted-foreground hover:text-foreground">
          {expanded ? "閉じる" : `全員を見る（あと ${rows.length - INITIAL} 人）`}
        </button>
      )}
    </section>
  );
}
