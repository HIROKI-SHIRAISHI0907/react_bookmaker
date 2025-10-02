import { useState } from "react";

type Item = { metric: string; value: number };
type Props = {
  data: {
    "1st": Item[];
    "2nd": Item[];
    ALL: Item[];
  };
};

// メトリクス名を読みやすく
const prettify = (k: string) =>
  k
    .replace(/^home/i, "Home ")
    .replace(/^away/i, "Away ")
    .replace(/Info$/i, "")
    .replace(/Count/i, " Cnt")
    .replace(/OnSuccessRatio/i, " (Succ%)")
    .replace(/OnSuccessCount/i, " (Succ)")
    .replace(/OnTryCount/i, " (Try)")
    .replace(/Box/i, " Box")
    .replace(/FinalThird/i, " Final3rd")
    .replace(/Exp/i, " xG")
    .replace(/SlowIn/i, " Throw-in");

export default function CorrelationTabs({ data }: Props) {
  const [tab, setTab] = useState<"1st" | "2nd" | "ALL">("ALL");

  const tabs: Array<"1st" | "2nd" | "ALL"> = ["1st", "2nd", "ALL"];
  const items = data[tab] ?? [];

  return (
    <div className="rounded-lg border">
      {/* タブ */}
      <div className="flex gap-2 border-b p-2">
        {tabs.map((t) => {
          const active = t === tab;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors
                ${active ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent"}`}
              aria-pressed={active}
            >
              {t}
            </button>
          );
        })}
      </div>

      {/* リスト（上位5件） */}
      <div className="p-3">
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground">データがありません</div>
        ) : (
          <ol className="space-y-2">
            {items.slice(0, 5).map((it, idx) => (
              <li key={`${it.metric}-${idx}`} className="flex items-baseline justify-between rounded-md px-3 py-2 hover:bg-accent">
                <span className={`${idx < 3 ? "font-bold" : "font-medium"}`}>
                  {idx + 1}. {prettify(it.metric)}
                </span>
                <span className={`${idx < 3 ? "font-bold" : "font-normal"} tabular-nums`}>
                  {it.value >= 0 ? "+" : ""}
                  {it.value.toFixed(3)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
