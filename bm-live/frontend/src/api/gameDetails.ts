// frontend/src/api/gameDetails.ts
export type GameDetail = {
  competition: string;
  round_no: number | null;
  recorded_at: string; // "YYYY-MM-DDTHH:mm:ss" (JST)
  winner: "LIVE" | "HOME" | "AWAY" | "DRAW";
  link: string | null;
  times: string | null; // ★追加: raw times ("68:09" / "45+2'" / "68'" / "終了済" など)
  home: {
    name: string;
    score: number;
    manager: string | null;
    formation: string | null;
    xg: number | null;
    possession: number | null;
    shots: number | null;
    shots_on: number | null;
    shots_off: number | null;
    blocks: number | null;
    corners: number | null;
    big_chances: number | null;
    saves: number | null;
    yc: number | null;
    rc: number | null;
    passes: string | null;
    long_passes: string | null;
  };
  away: GameDetail["home"];
  venue: { stadium: string | null; audience: string | null; capacity: string | null };
};

export async function fetchGameDetail(country: string, league: string, teamSlug: string, seq: string): Promise<GameDetail> {
  const url = `/api/games/detail/${encodeURIComponent(country)}/${encodeURIComponent(league)}/${encodeURIComponent(teamSlug)}/${encodeURIComponent(seq)}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`game detail fetch failed: ${res.status} ${text}`);
  }
  const json = await res.json();
  return json.detail as GameDetail;
}
