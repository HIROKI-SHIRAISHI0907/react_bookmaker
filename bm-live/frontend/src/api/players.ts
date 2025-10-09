export type Player = {
  id: number;
  jersey: number | null;
  name: string;
  face: string | null;
  position: string; // 例: ゴールキーパー/ディフェンダー/ミッドフィルダー/フォワード
  birth: string | null; // YYYY-MM-DD
  age: number | null;
  market_value: string | null;
  height: string | null; // 例: "180cm"
  weight: string | null; // 例: "75kg"
  loan_belong: string | null;
  belong_list: string | null;
  injury: string | null;
  contract_until: string | null; // YYYY-MM-DD
  latest_info_date: string | null; // YYYY-MM-DD
};

type Opts = { country: string; league: string };

export async function fetchTeamPlayers(teamSlug: string, opts: Opts): Promise<Player[]> {
  const { country, league } = opts;
  const url = `/api/players/${encodeURIComponent(country)}/${encodeURIComponent(league)}/${encodeURIComponent(teamSlug)}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`players fetch failed: ${res.status} ${text}`);
  }
  const json = await res.json();
  return (json.players ?? []) as Player[];
}
