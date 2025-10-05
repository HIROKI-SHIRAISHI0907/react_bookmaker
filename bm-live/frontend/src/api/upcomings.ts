// frontend/src/api/future.ts
export type FutureMatchItem = {
  seq: string; // BigInt はサーバで文字列化
  category: string;
  round_no: number | null;
  round_label: string | null;
  future_time: string; // ISO
  home_team: string;
  away_team: string;
  link: string | null;
};

export type FutureMatchesResponse = {
  team: string;
  items: FutureMatchItem[];
  meta: { country: string; league: string; teamJa: string };
};

export async function fetchFutureMatches(country: string, league: string, teamEnglish: string): Promise<FutureMatchesResponse> {
  const url = `/api/future/${encodeURIComponent(country)}/${encodeURIComponent(league)}/${encodeURIComponent(teamEnglish)}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`future fetch failed: ${res.status} ${text}`);
  }
  return res.json();
}
