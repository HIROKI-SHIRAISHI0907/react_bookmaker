import StatCard from "./StatCard";
import { Target, Activity, Users, ArrowRight, Shield, CornerDownRight, Flag, CircleX } from "lucide-react";

interface StatsGridProps {
  stats: {
    shotsOnTarget: { home: number; away: number };
    totalShots: { home: number; away: number };
    possession: { home: number; away: number };
    passes: { home: number; away: number };
    dribbles: { home: number; away: number };
    tackles: { home: number; away: number };
    corners: { home: number; away: number };
    fouls: { home: number; away: number };
    offsides: { home: number; away: number };
  };
}

export default function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <StatCard title="Shots on Target" homeValue={stats.shotsOnTarget.home} awayValue={stats.shotsOnTarget.away} icon={Target} />

      <StatCard title="Total Shots" homeValue={stats.totalShots.home} awayValue={stats.totalShots.away} icon={Activity} />

      <StatCard title="Possession" homeValue={stats.possession.home} awayValue={stats.possession.away} icon={Users} unit="%" />

      <StatCard title="Passes" homeValue={stats.passes.home} awayValue={stats.passes.away} icon={ArrowRight} />

      <StatCard title="Dribbles" homeValue={stats.dribbles.home} awayValue={stats.dribbles.away} icon={Activity} />

      <StatCard title="Tackles" homeValue={stats.tackles.home} awayValue={stats.tackles.away} icon={Shield} />

      <StatCard title="Corners" homeValue={stats.corners.home} awayValue={stats.corners.away} icon={CornerDownRight} />

      <StatCard title="Fouls" homeValue={stats.fouls.home} awayValue={stats.fouls.away} icon={CircleX} />

      <StatCard title="Offsides" homeValue={stats.offsides.home} awayValue={stats.offsides.away} icon={Flag} />
    </div>
  );
}
