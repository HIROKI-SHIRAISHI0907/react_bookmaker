// チームの直近の結果（W/D/L の丸）と、チームの結果ページへのリンク
import { Link } from "react-router-dom";
import type { ReactNode } from "react";

export const TEAM_RESULTS_PATH = "/team-results";

/** チームの結果ページの URL（国・リーグが無ければ null） */
export function teamResultsUrl(country: string | null | undefined, league: string | null | undefined, team: string): string | null {
  if (!country || !league || !team || country === "その他") return null;
  const q = new URLSearchParams({ country, league, team });
  return `${TEAM_RESULTS_PATH}?${q.toString()}`;
}

/** チーム名（国・リーグが分かればチームの結果ページへのリンクにする） */
export function TeamLink({
  country,
  league,
  team,
  className = "",
  children,
}: {
  country: string | null | undefined;
  league: string | null | undefined;
  team: string;
  className?: string;
  children?: ReactNode;
}) {
  const url = teamResultsUrl(country, league, team);
  if (!url) return <span className={className}>{children ?? team}</span>;
  return (
    <Link to={url} className={`${className} hover:underline`} onClick={(e) => e.stopPropagation()} title={`${team} の過去の結果`}>
      {children ?? team}
    </Link>
  );
}

const FORM: Record<"W" | "D" | "L", { text: string; className: string }> = {
  W: { text: "W", className: "bg-emerald-500 text-white" },
  D: { text: "D", className: "bg-slate-400 text-white" },
  L: { text: "L", className: "bg-rose-500 text-white" },
};

/** 直近の結果の丸（左が新しい。null は空欄） */
export function TeamFormDots({ form, size = "sm" }: { form: (string | null)[] | null | undefined; size?: "sm" | "md" }) {
  if (!form || form.length === 0) return null;
  const s = size === "md" ? "h-6 w-6 text-[11px]" : "h-4 w-4 text-[9px]";
  return (
    <span className="inline-flex gap-0.5" title="直近の結果（左が新しい）">
      {form.map((r, i) => {
        const f = r === "W" || r === "D" || r === "L" ? FORM[r] : null;
        return (
          <span key={i} className={`grid ${s} place-items-center rounded-full font-bold ${f ? f.className : "border border-dashed border-muted-foreground/40 text-muted-foreground"}`}>
            {f ? f.text : ""}
          </span>
        );
      })}
    </span>
  );
}
