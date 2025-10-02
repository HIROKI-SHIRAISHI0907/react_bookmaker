// src/pages/humberger/LeagueMenu.tsx
import { useParams, Link } from "react-router-dom";

export default function LeaguePage() {
  const { country, league } = useParams();
  // ここで country/league をデコードしてAPI呼び出しなどに利用
  const countryName = country ? decodeURIComponent(country) : "";
  const leagueName = league ? decodeURIComponent(league) : "";

  const isParamMissing = !countryName || !leagueName;

  // ここで API を叩くなら countryName / leagueName を使用
  // useQuery([...], () => fetch(`/api/leagues?country=${encodeURIComponent(countryName)}&league=${encodeURIComponent(leagueName)}`))

  if (isParamMissing) {
    return (
      <div className="min-h-screen bg-background text-foreground grid place-items-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">リーグが見つかりません</h1>
          <p className="text-muted-foreground mb-4">国またはリーグの URL パラメータが不足しています。</p>
          <Link className="underline" to="/top">
            トップへ戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">
        {countryName} / {leagueName}
      </h1>
      {/* このリーグの試合一覧や統計APIを叩いて表示 */}
    </div>
  );
}
