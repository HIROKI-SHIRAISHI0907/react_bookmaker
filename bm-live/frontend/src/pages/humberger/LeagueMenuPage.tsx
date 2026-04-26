// src/pages/humberger/LeagueMenuPage.tsx
import LeagueMenu from "../../components/LeagueLink";
import LeagueTeams from "../personal/teams/TeamPage";

export default function LeagueMenuPage() {
  return (
    <div className="relative min-h-screen bg-background">
      {/* 左上固定のリーグメニュー */}
      <div className="fixed left-4 top-[56px] z-50">
        <LeagueMenu />
      </div>

      {/* 本文 */}
      <LeagueTeams />
    </div>
  );
}
