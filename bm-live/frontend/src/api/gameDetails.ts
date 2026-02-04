// frontend/src/api/gameDetails.ts(SpringBoot bookmakers-web bm_w005)
export type GameDetail = {
  competition: string;
  round_no: number | null;
  recordedAt: string; // "YYYY-MM-DDTHH:mm:ss" (JST)
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
    shotsOn: number | null;
    shotsOff: number | null;
    blocks: number | null;
    corners: number | null;
    bigChances: number | null;
    saves: number | null;
    yc: number | null;
    rc: number | null;
    passes: string | null;
    longPasses: string | null;
  };
  away: GameDetail["home"];
  venue: { stadium: string | null; audience: string | null; capacity: string | null };
};

export async function fetchGameDetail(country: string, league: string, teamSlug: string, seq: string): Promise<GameDetail> {
  const url = `/v1/api/games/detail/${encodeURIComponent(country)}/${encodeURIComponent(league)}/${encodeURIComponent(teamSlug)}/${encodeURIComponent(seq)}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`game detail fetch failed: ${res.status} ${text}`);
  }
  const json = await res.json();
  return json.detail as GameDetail;
}
