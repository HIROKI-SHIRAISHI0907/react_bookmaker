// src/pages/LeagueMenu.tsx
import { useParams } from "react-router-dom";

export default function LeaguePage() {
  const { country, league } = useParams();
  // ここで country/league をデコードしてAPI呼び出しなどに利用
  const countryName = country ? decodeURIComponent(country) : "";
  const leagueName = league ? decodeURIComponent(league) : "";

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">
        {countryName} / {leagueName}
      </h1>
      {/* このリーグの試合一覧や統計APIを叩いて表示 */}
    </div>
  );
}
