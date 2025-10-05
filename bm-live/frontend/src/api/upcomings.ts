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

// country / league / team を使えるならパス版、ダメならクエリ版にフォールバック
export async function fetchFutureMatches(team?: string, opts?: { country?: string; league?: string }): Promise<FutureMatch[]> {
  const tryFetch = async (url: string) => {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      // デバッグしやすいよう詳細ログ
      console.error(`[future] ${res.status} for ${url}`, text);
      throw new Error(`future fetch failed: ${res.status} ${text}`);
    }
    const json = await res.json();
    return (json.matches ?? []) as FutureMatch[];
  };

  // 1) パス版（推奨）
  if (team && opts?.country && opts?.league) {
    const url = `/api/future/` + `${encodeURIComponent(opts.country)}/` + `${encodeURIComponent(opts.league)}/` + `${encodeURIComponent(team)}`;
    try {
      return await tryFetch(url);
    } catch {
      // フォールバックに進む
    }
  }

  // 2) フォールバック: クエリ版
  const qs = team ? `?team=${encodeURIComponent(team)}` : "";
  return await tryFetch(`/api/future${qs}`);
}
