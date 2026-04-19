export type GameDetail = {
  competition: string;
  roundNo: number | null;
  recordedAt: string | null;
  winner: "LIVE" | "HOME" | "AWAY" | "DRAW" | string;
  link: string | null;
  times: string | null;
  home: {
    name: string | null;
    score: number | null;
    manager?: string | null;
    formation?: string | null;
    xg?: number | null;
    possession?: number | null;
    shots?: number | null;
    shotsOn?: number | null;
    shotsOff?: number | null;
    blocks?: number | null;
    corners?: number | null;
    bigChances?: number | null;
    saves?: number | null;
    yc?: number | null;
    rc?: number | null;
    passes?: string | null;
    longPasses?: string | null;
  };
  away: {
    name: string | null;
    score: number | null;
    manager?: string | null;
    formation?: string | null;
    xg?: number | null;
    possession?: number | null;
    shots?: number | null;
    shotsOn?: number | null;
    shotsOff?: number | null;
    blocks?: number | null;
    corners?: number | null;
    bigChances?: number | null;
    saves?: number | null;
    yc?: number | null;
    rc?: number | null;
    passes?: string | null;
    longPasses?: string | null;
  };
  venue?: {
    stadium?: string | null;
    audience?: string | null;
    capacity?: string | null;
  } | null;
};

type GameDetailResponse = {
  detail: GameDetail;
};

export async function fetchGameDetail(seq: number): Promise<GameDetail> {
  const res = await fetch("/v1/api/games/detail", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ seq }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`game detail fetch failed: ${res.status} ${txt}`);
  }

  const json = (await res.json()) as GameDetailResponse;
  return json.detail;
}
