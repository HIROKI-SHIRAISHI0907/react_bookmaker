import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
        return (_jsx("div", { className: "min-h-screen bg-background text-foreground grid place-items-center p-6", children: _jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-2xl font-bold mb-2", children: "\u30EA\u30FC\u30B0\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" }), _jsx("p", { className: "text-muted-foreground mb-4", children: "\u56FD\u307E\u305F\u306F\u30EA\u30FC\u30B0\u306E URL \u30D1\u30E9\u30E1\u30FC\u30BF\u304C\u4E0D\u8DB3\u3057\u3066\u3044\u307E\u3059\u3002" }), _jsx(Link, { className: "underline", to: "/top", children: "\u30C8\u30C3\u30D7\u3078\u623B\u308B" })] }) }));
    }
    return (_jsx("div", { className: "p-4", children: _jsxs("h1", { className: "text-xl font-bold", children: [countryName, " / ", leagueName] }) }));
}
