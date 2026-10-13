// チームのホームスタジアム（/v1/api/team-venue）
import type { MatchVenue } from "../match/matchtypes";

export type TeamVenueResponse = {
  team: string;
  found: boolean;
  venue: MatchVenue | null;
};

export async function fetchTeamVenue(country: string, league: string, team: string): Promise<TeamVenueResponse> {
  const qs = new URLSearchParams({ country, league, team });
  const res = await fetch(`/v1/api/team-venue?${qs.toString()}`, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return (await res.json()) as TeamVenueResponse;
}
