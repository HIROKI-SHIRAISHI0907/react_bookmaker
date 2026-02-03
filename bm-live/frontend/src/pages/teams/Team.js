import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/teams/Team.tsx
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchTeamsInLeague } from "../../api/leagues";
import { Skeleton } from "../../components/ui/skeleton";
import AppHeader from "../../components/layout/AppHeader"; // ← 追加
export default function LeagueTeams() {
    // URLの country / league は既に encodeURIComponent 済みなので、表示・API の両方で raw を用意
    const { country = "", league = "" } = useParams();
    const countryRaw = decodeURIComponent(country);
    const leagueRaw = decodeURIComponent(league);
    const { data, isLoading, isError } = useQuery({
        // キャッシュキーも raw に統一
        queryKey: ["teams-in-league", countryRaw, leagueRaw],
        // API 側で encode する想定なので、ここでは raw を渡す
        queryFn: () => fetchTeamsInLeague(countryRaw, leagueRaw),
        staleTime: 60000,
    });
    if (isError) {
        return (_jsxs("div", { className: "min-h-screen bg-background", children: [_jsx(AppHeader, { title: "\u30C1\u30FC\u30E0\u4E00\u89A7", subtitle: `${countryRaw} / ${leagueRaw}` }), _jsxs("main", { className: "container mx-auto px-4 py-6", children: [_jsxs("h1", { className: "text-2xl font-bold mb-2", children: [countryRaw, " / ", leagueRaw] }), _jsx("p", { className: "text-destructive", children: "\u30C7\u30FC\u30BF\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" })] })] }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-background", children: [_jsx(AppHeader, { title: "\u30C1\u30FC\u30E0\u4E00\u89A7", subtitle: `${countryRaw} / ${leagueRaw}` }), _jsxs("main", { className: "container mx-auto px-4 py-6", children: [_jsxs("div", { className: "mb-4 flex items-center gap-3", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("h1", { className: "text-2xl font-bold", children: [countryRaw, " / ", leagueRaw] }), _jsx("p", { className: "text-muted-foreground text-sm", children: "Team List" })] }), _jsx(Link, { to: `/live`, className: "inline-flex items-center text-sm font-medium rounded-md border px-3 py-1.5 hover:bg-accent", children: "\u73FE\u5728\u958B\u50AC\u4E2D\u306E\u8A66\u5408 \u2192" }), _jsx(Link, { to: `/ranking/${countryRaw}/${leagueRaw}`, className: "inline-flex items-center text-sm font-medium rounded-md border px-3 py-1.5 hover:bg-accent", children: "\u9806\u4F4D\u8868 \u2192" })] }), isLoading && (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3", children: Array.from({ length: 9 }).map((_, i) => (_jsxs("div", { className: "border rounded p-3", children: [_jsx(Skeleton, { className: "h-5 w-48 mb-2" }), _jsx(Skeleton, { className: "h-4 w-28" })] }, i))) })), data &&
                        (data.teams.length === 0 ? (_jsx("div", { className: "text-muted-foreground", children: "\u8868\u793A\u3059\u308B\u30C1\u30FC\u30E0\u304C\u3042\u308A\u307E\u305B\u3093\u3002" })) : (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3", children: data.teams.map((t) => {
                                // params の country / league はすでにエンコード済みなので、それを使って OK
                                const teamRoute = `/${country}/${league}/${t.english}`;
                                return (_jsxs(Link, { to: teamRoute, className: "group border rounded p-3 hover:bg-accent transition-colors", children: [_jsx("div", { className: "font-medium", children: t.name }), _jsxs("div", { className: "text-xs text-muted-foreground mt-1", children: ["/team/", t.english, "/", t.hash] })] }, t.link));
                            }) })))] })] }));
}
