// frontend/src/api/games.ts
export type GameMatch = {
  seq: number;
  game_team_category: string;
  future_time: string; // ISO
  home_team: string;
  away_team: string;
  link: string | null;
  round_no: number | null;
  latest_times: string | null; // public.data の最大 seq の times
  latest_seq: number | null;
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
