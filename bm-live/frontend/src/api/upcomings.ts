// frontend/src/api/upcomings.ts(SpringBoot bookmakers-web bm_w001)

export type FutureMatch = {
  seq: number;
  gameTeamCategory: string;
  futureTime: string; // ISO (e.g. 2026-01-14T17:30Z)
  homeTeam: string;
  awayTeam: string;
  link: string | null;
  roundNo: number | null;
  status: "LIVE" | "SCHEDULED";
};

// GET /api/future/:teamEng/:hash
export async function fetchFutureMatches(teamSlug: string, teamHash: string): Promise<FutureMatch[]> {
  const url = `/v1/api/future/${encodeURIComponent(teamSlug)}/${encodeURIComponent(teamHash)}`;

  const res = await fetch(url, { credentials: "include", headers: { Accept: "application/json" } });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[future] %s for %s", res.status, url);
    throw new Error(`future fetch failed: ${res.status} ${text}`);
  }

  const json = (await res.json()) as { matches?: unknown[] };

  // 念のため整形（number/nullの正規化）
  const matches = (json.matches ?? []).map((m: any) => ({
    seq: Number(m.seq),
    gameTeamCategory: String(m.gameTeamCategory ?? ""),
    futureTime: String(m.futureTime ?? ""),
    homeTeam: String(m.homeTeam ?? ""),
    awayTeam: String(m.awayTeam ?? ""),
    link: m.link ?? null,
    roundNo: m.roundNo == null ? null : Number(m.roundNo),
    status: (m.status ?? "SCHEDULED") as "LIVE" | "SCHEDULED",
  })) as FutureMatch[];

  return matches;
}
