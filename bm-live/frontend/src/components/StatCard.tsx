import { Card } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  homeValue: number;
  awayValue: number;
  icon: LucideIcon;
  unit?: string;
  showProgress?: boolean;
}

export default function StatCard({ title, homeValue, awayValue, icon: Icon, unit = "", showProgress = true }: StatCardProps) {
  const total = homeValue + awayValue;
  const homePercentage = total > 0 ? (homeValue / total) * 100 : 50;

  return (
    <Card className="p-4 hover-elevate" data-testid={`card-stat-${title.toLowerCase().replace(/\s/g, "-")}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h3>
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl font-mono font-bold" data-testid={`text-home-${title.toLowerCase().replace(/\s/g, "-")}`}>
          {homeValue}
          {unit}
        </span>
        <span className="text-2xl font-mono font-bold" data-testid={`text-away-${title.toLowerCase().replace(/\s/g, "-")}`}>
          {awayValue}
          {unit}
        </span>
      </div>

      {showProgress && (
        <div className="space-y-2">
          <Progress value={homePercentage} className="h-2" data-testid={`progress-${title.toLowerCase().replace(/\s/g, "-")}`} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{Math.round(homePercentage)}%</span>
            <span>{Math.round(100 - homePercentage)}%</span>
          </div>
        </div>
      )}
    </Card>
  );
}
