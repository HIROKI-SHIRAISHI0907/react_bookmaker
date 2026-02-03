// frontend/src/components/team/FutureMatchesList.tsx
import { FutureMatch } from "../../api/upcomings";

type Props = {
  items: FutureMatch[];
};

export default function FutureMatchesList({ items }: Props) {
  if (!items?.length) {
    return <div className="text-muted-foreground text-sm">予定されている試合はありません。</div>;
  }

  return (
    <ul className="divide-y rounded-xl border">
      {items.map((it) => (
        // ← いただいた1行レンダリングをそのまま使用
        <li key={it.seq} className="flex items-center gap-3 py-2 px-3">
          <div className="w-32 shrink-0 text-sm">{it.roundNo != null ? <span className="font-bold">ラウンド {it.roundNo}</span> : <span className="text-muted-foreground">ラウンド -</span>}</div>
          <div className="flex-1">
            <div className="text-sm">
              {it.homeTeam} vs {it.awayTeam}
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date(it.futureTime).toLocaleString()}
              {it.link ? (
                <>
                  {" "}
                  ·{" "}
                  <a href={it.link} target="_blank" rel="noreferrer" className="underline">
                    詳細
                  </a>
                </>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
