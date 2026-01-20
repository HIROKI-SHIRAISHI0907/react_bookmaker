// frontend/src/api/games.ts(SpringBoot bookmakers-web bm_w005)
export type GameMatch = {
  seq: number;
  gameTeamCategory: string;
  futureTime: string; // ISO
  homeTeam: string;
  awayTeam: string;
  link: string | null;
  roundNo: number | null;
  latestTimes: string | null; // public.data の最大 seq の times
  latestSeq: number | null;
  homeScore?: number | null;
  awayScore?: number | null;
  status: "LIVE" | "FINISHED"; // latest_times が「終了済」を含むかで判定
};

type Opts = { country: string; league: string };

/**
 * 開催中/試合終了の試合を取得（/api/games/:country/:league/:team）
 * - backend 側で、public.data の最大 seq(=最新) に紐づく times を持ってきて、
 *   「終了済」を含むなら FINISHED、含まなければ LIVE に振り分けます
 */
export async function fetchTeamGames(teamSlug: string, opts: Opts): Promise<{ live: GameMatch[]; finished: GameMatch[] }> {
  const { country, league } = opts;
  const url = `/api/games/${encodeURIComponent(country)}/${encodeURIComponent(league)}/${encodeURIComponent(teamSlug)}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`games fetch failed: ${res.status} ${text}`);
  }
  const json = await res.json();
  // 安全側：型整形
  return {
    live: (json.live ?? []) as GameMatch[],
    finished: (json.finished ?? []) as GameMatch[],
  };
}
