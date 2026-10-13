// チームページ: ホームスタジアム（team_location_master）
//  GET /v1/api/team-venue?country=&league=&team=　マスタに無いチームはカードごと出さない
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "../../../components/ui/skeleton";
import { fetchTeamVenue } from "../../../api/team/teamvenueapi";
import VenueBox from "../venue/VenueBox";

export default function TeamVenue({ country, league, team }: { country: string; league: string; team: string }) {
  const q = useQuery({
    queryKey: ["team-venue", country, league, team],
    queryFn: () => fetchTeamVenue(country, league, team),
    enabled: !!team,
    staleTime: 10 * 60_000,
  });

  if (q.isLoading) {
    return <Skeleton className="h-60 w-full rounded-2xl" />;
  }
  const v = q.data?.venue;
  if (q.error || !v) {
    return null;
  }
  return (
    <section className="rounded-2xl border bg-card p-4" data-testid="team-venue">
      <h2 className="mb-3 text-sm font-bold">ホームスタジアム</h2>
      <VenueBox v={v} showHomeTeamNote={false} />
    </section>
  );
}
