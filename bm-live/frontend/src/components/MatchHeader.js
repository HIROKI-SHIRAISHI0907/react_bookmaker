import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Clock, Play } from "lucide-react";
export default function MatchHeader({ homeTeam, awayTeam, matchTime, status, competition }) {
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
    return (_jsxs(Card, { className: "p-6 mb-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("div", { className: "flex items-center gap-2", children: _jsx(Badge, { variant: "secondary", className: "text-xs font-semibold uppercase tracking-wide", children: competition }) }), _jsx("div", { className: "flex items-center gap-2", children: _jsxs(Badge, { className: `${getStatusColor()} flex items-center gap-1`, children: [status === "LIVE" && _jsx(Play, { className: "w-3 h-3" }), _jsx(Clock, { className: "w-3 h-3" }), status === "LIVE" ? matchTime : status] }) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-4 flex-1", children: [_jsx("div", { className: "w-16 h-16 bg-accent rounded-full flex items-center justify-center", children: _jsx("span", { className: "text-accent-foreground font-bold text-lg", children: homeTeam.name.slice(0, 3).toUpperCase() }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-bold", "data-testid": "text-home-team", children: homeTeam.name }), _jsx("p", { className: "text-muted-foreground text-sm", children: "Home" })] })] }), _jsxs("div", { className: "flex items-center gap-4 px-8", children: [_jsx("span", { className: "text-4xl font-mono font-bold", "data-testid": "text-home-score", children: homeTeam.score }), _jsx("span", { className: "text-2xl text-muted-foreground", children: "-" }), _jsx("span", { className: "text-4xl font-mono font-bold", "data-testid": "text-away-score", children: awayTeam.score })] }), _jsxs("div", { className: "flex items-center gap-4 flex-1 justify-end", children: [_jsxs("div", { className: "text-right", children: [_jsx("h2", { className: "text-xl font-bold", "data-testid": "text-away-team", children: awayTeam.name }), _jsx("p", { className: "text-muted-foreground text-sm", children: "Away" })] }), _jsx("div", { className: "w-16 h-16 bg-accent rounded-full flex items-center justify-center", children: _jsx("span", { className: "text-accent-foreground font-bold text-lg", children: awayTeam.name.slice(0, 3).toUpperCase() }) })] })] })] }));
}
