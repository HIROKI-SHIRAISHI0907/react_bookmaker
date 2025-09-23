import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Clock, Play } from "lucide-react";

interface Team {
  name: string;
  logo: string;
  score: number;
}

interface MatchHeaderProps {
  homeTeam: Team;
  awayTeam: Team;
  matchTime: string;
  status: "LIVE" | "HT" | "FT";
  competition: string;
}

export default function MatchHeader({ homeTeam, awayTeam, matchTime, status, competition }: MatchHeaderProps) {
  const getStatusColor = () => {
    switch (status) {
      case "LIVE":
        return "bg-destructive text-destructive-foreground";
      case "HT":
        return "bg-chart-3 text-white";
      case "FT":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-primary text-primary-foreground";
    }
  };

  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs font-semibold uppercase tracking-wide">
            {competition}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`${getStatusColor()} flex items-center gap-1`}>
            {status === "LIVE" && <Play className="w-3 h-3" />}
            <Clock className="w-3 h-3" />
            {status === "LIVE" ? matchTime : status}
          </Badge>
        </div>
      </div>

      <div className="flex items-center justify-between">
        {/* Home Team */}
        <div className="flex items-center gap-4 flex-1">
          <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center">
            <span className="text-accent-foreground font-bold text-lg">{homeTeam.name.slice(0, 3).toUpperCase()}</span>
          </div>
          <div>
            <h2 className="text-xl font-bold" data-testid="text-home-team">
              {homeTeam.name}
            </h2>
            <p className="text-muted-foreground text-sm">Home</p>
          </div>
        </div>

        {/* Score */}
        <div className="flex items-center gap-4 px-8">
          <span className="text-4xl font-mono font-bold" data-testid="text-home-score">
            {homeTeam.score}
          </span>
          <span className="text-2xl text-muted-foreground">-</span>
          <span className="text-4xl font-mono font-bold" data-testid="text-away-score">
            {awayTeam.score}
          </span>
        </div>

        {/* Away Team */}
        <div className="flex items-center gap-4 flex-1 justify-end">
          <div className="text-right">
            <h2 className="text-xl font-bold" data-testid="text-away-team">
              {awayTeam.name}
            </h2>
            <p className="text-muted-foreground text-sm">Away</p>
          </div>
          <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center">
            <span className="text-accent-foreground font-bold text-lg">{awayTeam.name.slice(0, 3).toUpperCase()}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
