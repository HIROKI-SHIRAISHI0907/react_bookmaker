// frontend/src/api/upcomings.ts
export type FutureMatch = {
  seq: number;
  game_team_category: string;
  future_time: string; // ISO
  home_team: string;
  away_team: string;
  link: string | null;
  round_no: number | null;
  status: "LIVE" | "SCHEDULED";
};

type FetchOpts = { country: string; league: string };

// 旧: /api/future?team=...  → 新: /api/future/:country/:league/:team
export async function fetchFutureMatches(teamSlug: string, opts: FetchOpts): Promise<FutureMatch[]> {
  const { country, league } = opts;
  const url = `/api/future/${encodeURIComponent(country)}/${encodeURIComponent(league)}/${encodeURIComponent(teamSlug)}`;

  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[future] %s for %s", res.status, url);
    throw new Error(`future fetch failed: ${res.status} ${text}`);
  }
  const json = await res.json();
  return (json.matches ?? []) as FutureMatch[];
}
