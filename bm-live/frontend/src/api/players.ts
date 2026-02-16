// frontend/src/api/players.ts(SpringBoot bookmakers-web bm_w009)
export type Player = {
  id: number;
  jersey: number | null;
  name: string;
  face: string | null;
  position: string; // 例: ゴールキーパー/ディフェンダー/ミッドフィルダー/フォワード
  birth: string | null; // YYYY-MM-DD
  age: number | null;
  marketValue: string | null;
  height: string | null; // 例: "180cm"
  weight: string | null; // 例: "75kg"
  loanBelong: string | null;
  belongList: string | null;
  injury: string | null;
  contractUntil: string | null; // YYYY-MM-DD
  latestInfoDate: string | null; // YYYY-MM-DD
};

export async function fetchTeamPlayers(teamSlug: string, teamHash: string): Promise<Player[]> {
  console.log("[players] fetchTeamPlayers called", { teamSlug, teamHash });
  const url = `/v1/api/players/${encodeURIComponent(teamSlug)}/${encodeURIComponent(teamHash)}`;
  console.log("[players] fetching:", url);

  const res = await fetch(url, { credentials: "include", headers: { Accept: "application/json" } });
  console.log("[players] status:", res.status, "content-type:", res.headers.get("content-type"));

  const text = await res.text(); // いったん text で取る（JSONじゃない時に即わかる）
  console.log("[players] body head:", text.slice(0, 200));

  if (!res.ok) throw new Error(`players fetch failed: ${res.status} ${text}`);

  const json = JSON.parse(text);
  console.log("[players] count:", (json.players ?? []).length);

  return (json.players ?? []) as Player[];
}
