import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "../../lib/queryClient";
import MatchHeader from "../../components/MatchHeader";
import StatsGrid from "../../components/StatsGrid";
import { Button } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
import AppHeader from "../../components/layout/AppHeader";
import { RefreshCw } from "lucide-react";
const MOCK_MATCH = {
    match: {
        id: "match1",
        status: "LIVE",
        matchTime: "67'",
        competition: "Sample League",
        homeTeam: { name: "Home United", shortName: "HOME" },
        awayTeam: { name: "Away City", shortName: "AWAY" },
        homeScore: 2,
        awayScore: 1,
    },
    stats: {
        shotsOnTarget: { home: 6, away: 3 },
        totalShots: { home: 12, away: 9 },
        possession: { home: 56, away: 44 },
        passes: { home: 420, away: 365 },
        dribbles: { home: 8, away: 6 },
        tackles: { home: 14, away: 11 },
        corners: { home: 7, away: 4 },
        fouls: { home: 9, away: 12 },
        offsides: { home: 2, away: 1 },
    },
};
// --------------------------------------------------------
export default function Dashboard() {
    const [selectedMatchId, setSelectedMatchId] = useState("match1");
    const { data: matchDetails, isLoading, error, } = useQuery({
        queryKey: ["match-details", selectedMatchId],
        queryFn: async () => {
            await new Promise((r) => setTimeout(r, 400));
            return MOCK_MATCH;
        },
        staleTime: 30000,
    });
    // Refresh mutation for manual updates
    const refreshMutation = useMutation({
        mutationFn: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["match-details", selectedMatchId],
            });
        },
    });
    const handleRefresh = () => refreshMutation.mutate();
    if (error) {
        return (_jsx("div", { className: "min-h-screen bg-background flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("h2", { className: "text-xl font-bold mb-2", children: "Error Loading Match Data" }), _jsx("p", { className: "text-muted-foreground mb-4", children: "Failed to load match information" }), _jsxs(Button, { onClick: handleRefresh, variant: "outline", children: [_jsx(RefreshCw, { className: "w-4 h-4 mr-2" }), "Try Again"] })] }) }));
    }
    {
        /* 正常トップページ */
    }
    return (_jsxs("div", { className: "min-h-screen bg-background", children: [_jsx(AppHeader, { title: "\u7D71\u8A08\u30C7\u30FC\u30BF", subtitle: "Live Match Dashboard", rightSlot: _jsxs(Button, { variant: "outline", size: "sm", onClick: handleRefresh, disabled: refreshMutation.isPending, "data-testid": "button-refresh", className: "hover-elevate", children: [_jsx(RefreshCw, { className: `w-4 h-4 mr-2 ${refreshMutation.isPending ? "animate-spin" : ""}` }), "Refresh"] }) }), _jsx("main", { className: "container mx-auto px-4 py-6", children: isLoading ? (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "p-6 border rounded-lg", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx(Skeleton, { className: "h-5 w-32" }), _jsx(Skeleton, { className: "h-6 w-20" })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx(Skeleton, { className: "h-16 w-16 rounded-full" }), _jsxs("div", { className: "space-y-2", children: [_jsx(Skeleton, { className: "h-6 w-40" }), _jsx(Skeleton, { className: "h-4 w-20" })] })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx(Skeleton, { className: "h-10 w-8" }), _jsx(Skeleton, { className: "h-6 w-4" }), _jsx(Skeleton, { className: "h-10 w-8" })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Skeleton, { className: "h-6 w-40" }), _jsx(Skeleton, { className: "h-4 w-20" })] }), _jsx(Skeleton, { className: "h-16 w-16 rounded-full" })] })] })] }), _jsxs("div", { children: [_jsx(Skeleton, { className: "h-6 w-40 mb-4" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: Array.from({ length: 9 }).map((_, i) => (_jsxs("div", { className: "p-4 border rounded-lg", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(Skeleton, { className: "h-4 w-4" }), _jsx(Skeleton, { className: "h-4 w-24" })] }), _jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx(Skeleton, { className: "h-8 w-8" }), _jsx(Skeleton, { className: "h-8 w-8" })] }), _jsx(Skeleton, { className: "h-2 w-full mb-2" }), _jsxs("div", { className: "flex justify-between", children: [_jsx(Skeleton, { className: "h-3 w-8" }), _jsx(Skeleton, { className: "h-3 w-8" })] })] }, i))) })] })] })) : matchDetails ? (_jsxs(_Fragment, { children: [_jsx(MatchHeader, { homeTeam: {
                                name: matchDetails.match.homeTeam.name,
                                logo: matchDetails.match.homeTeam.shortName,
                                score: matchDetails.match.homeScore || 0,
                            }, awayTeam: {
                                name: matchDetails.match.awayTeam.name,
                                logo: matchDetails.match.awayTeam.shortName,
                                score: matchDetails.match.awayScore || 0,
                            }, matchTime: matchDetails.match.matchTime || "0'", status: matchDetails.match.status, competition: matchDetails.match.competition }), _jsxs("div", { className: "mb-6", children: [_jsx("h2", { className: "text-xl font-bold mb-4", "data-testid": "text-statistics-title", children: "Match Statistics" }), _jsx(StatsGrid, { stats: matchDetails.stats })] })] })) : null })] }));
}
