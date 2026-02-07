import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// frontend/src/pages/teams/HistoryDetail.tsx
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import AppHeader from "../../components/layout/AppHeader";
import { Skeleton } from "../../components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { fetchHistoryDetail } from "../../api/historyDetails";
export default function HistoryDetail() {
    const params = useParams();
    const countryParam = params.country ?? "";
    const leagueParam = params.league ?? "";
    const teamSlug = params.team ?? "";
    const seq = params.seq ?? "";
    const decode = (s) => {
        try {
            return decodeURIComponent(s);
        }
        catch {
            return s;
        }
    };
    const country = decode(countryParam);
    const league = decode(leagueParam);
    const q = useQuery({
        queryKey: ["history-detail", country, league, teamSlug, seq],
        queryFn: () => fetchHistoryDetail(country, league, teamSlug, seq),
        enabled: !!country && !!league && !!teamSlug && !!seq,
        staleTime: 60000,
    });
    const toBack = `/${encodeURIComponent(country)}/${encodeURIComponent(league)}/${encodeURIComponent(teamSlug)}/history`;
    const h = q.data?.home ?? {};
    const a = q.data?.away ?? {};
    const titleText = h.name && a.name ? `${h.name} vs ${a.name}` : "過去対戦 詳細";
    const headerSubtitle = q.data?.competition && h.name && a.name ? `${country} / ${league} / ${h.name} vs ${a.name}` : `${country} / ${league}`;
    return (_jsxs("div", { className: "min-h-screen bg-background", children: [_jsx(AppHeader, { title: titleText, subtitle: headerSubtitle }), _jsxs("main", { className: "container mx-auto px-4 py-6 space-y-6", children: [_jsx("div", { className: "mb-2 flex items-center gap-3", children: _jsxs(Link, { to: toBack, className: "inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline", children: [_jsx(ArrowLeft, { className: "w-4 h-4" }), "\u623B\u308B"] }) }), q.isLoading ? (_jsxs("div", { className: "space-y-3", children: [_jsx(Skeleton, { className: "h-8 w-60" }), _jsx(Skeleton, { className: "h-40 w-full" })] })) : q.isError ? (_jsx("div", { className: "text-destructive text-sm", children: "\u8A73\u7D30\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002" })) : !q.data ? null : (_jsxs(_Fragment, { children: [_jsx(ScoreHeader, { d: q.data }), _jsxs("section", { className: "grid md:grid-cols-2 gap-4", children: [_jsx(TeamStatCard, { title: "\u30DB\u30FC\u30E0", side: "home", data: q.data }), _jsx(TeamStatCard, { title: "\u30A2\u30A6\u30A7\u30FC", side: "away", data: q.data })] }), (q.data.venue?.stadium || q.data.venue?.audience || q.data.venue?.capacity) && (_jsxs("section", { className: "rounded-2xl border bg-card p-4 shadow-sm", children: [_jsx("h3", { className: "text-base font-semibold mb-2", children: "\u4F1A\u5834\u60C5\u5831" }), _jsxs("ul", { className: "text-sm text-muted-foreground space-y-1", children: [q.data.venue?.stadium && _jsxs("li", { children: ["\u30B9\u30BF\u30B8\u30A2\u30E0: ", q.data.venue.stadium] }), q.data.venue?.audience && _jsxs("li", { children: ["\u89B3\u5BA2\u6570: ", q.data.venue.audience] }), q.data.venue?.capacity && _jsxs("li", { children: ["\u53CE\u5BB9\u4EBA\u6570: ", q.data.venue.capacity] })] })] }))] }))] })] }));
}
/* ---------- スコアヘッダー ---------- */
function ScoreHeader({ d }) {
    const h = (d.home ?? {});
    const a = (d.away ?? {});
    const winner = d.winner === "HOME" || d.winner === "AWAY" || d.winner === "DRAW" ? d.winner : "DRAW";
    const winnerBadge = (w) => {
        if (w === "DRAW")
            return _jsx("span", { className: "px-2 py-0.5 text-xs rounded bg-green-50 text-green-700 border", children: "DRAW" });
        if (w === "HOME")
            return _jsx("span", { className: "px-2 py-0.5 text-xs rounded bg-red-50 text-red-700 border font-bold", children: "HOME WIN" });
        return _jsx("span", { className: "px-2 py-0.5 text-xs rounded bg-blue-50 text-blue-700 border font-bold", children: "AWAY WIN" });
    };
    const comp = d.competition ?? "";
    const headerLeft = [comp].filter(Boolean).join(" ");
    // recorded_at が無ければ null 表示
    const whenText = d.recordedAt ? new Date(d.recordedAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }) : "-";
    return (_jsxs("section", { className: "rounded-2xl border bg-card p-6 shadow-sm", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "text-sm text-muted-foreground", children: headerLeft || "-" }), _jsx("div", { className: "text-xs text-muted-foreground", children: whenText })] }), _jsxs("div", { className: "mt-4 flex items-center justify-between", children: [_jsx("div", { className: "flex-1 text-left", children: _jsx("div", { className: "text-lg font-semibold", children: h.name ?? "-" }) }), _jsxs("div", { className: "px-4 text-3xl font-bold", children: [fmtNum(h.score), " ", _jsx("span", { className: "text-muted-foreground text-xl mx-2", children: "-" }), " ", fmtNum(a.score)] }), _jsx("div", { className: "flex-1 text-right", children: _jsx("div", { className: "text-lg font-semibold", children: a.name ?? "-" }) })] }), _jsx("div", { className: "mt-3 flex items-center justify-center gap-3", children: winnerBadge(winner) })] }));
}
/* ---------- チーム統計カード ---------- */
function TeamStatCard({ title, side, data }) {
    const d = (side === "home" ? data.home : data.away) ?? {};
    return (_jsxs("div", { className: "rounded-2xl border bg-card p-4 shadow-sm", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h3", { className: "text-base font-semibold", children: title }), _jsx("div", { className: "text-xs text-muted-foreground", children: d.manager ? `監督: ${d.manager}` : "" })] }), _jsx("div", { className: "text-sm text-muted-foreground mb-3", children: d.formation ? `フォーメーション: ${d.formation}` : "-" }), _jsxs("ul", { className: "text-sm divide-y", children: [_jsx(Line, { k: "xG", v: fmtFloat(d.xg) }), _jsx(Line, { k: "\u30DD\u30BC\u30C3\u30B7\u30E7\u30F3", v: fmtPercent(d.possession) }), _jsx(Line, { k: "\u30B7\u30E5\u30FC\u30C8(\u7DCF)", v: fmtNum(d.shots) }), _jsx(Line, { k: "\u67A0\u5185\u30B7\u30E5\u30FC\u30C8", v: fmtNum(d.shotsOn) }), _jsx(Line, { k: "\u67A0\u5916\u30B7\u30E5\u30FC\u30C8", v: fmtNum(d.shotsOff) }), _jsx(Line, { k: "\u30D6\u30ED\u30C3\u30AF", v: fmtNum(d.blocks) }), _jsx(Line, { k: "CK", v: fmtNum(d.corners) }), _jsx(Line, { k: "\u30D3\u30C3\u30B0\u30C1\u30E3\u30F3\u30B9", v: fmtNum(d.bigChances) }), _jsx(Line, { k: "\u30BB\u30FC\u30D6", v: fmtNum(d.saves) }), _jsx(Line, { k: "\u8B66\u544A", v: fmtNum(d.yc) }), _jsx(Line, { k: "\u9000\u5834", v: fmtNum(d.rc) }), _jsx(Line, { k: "\u30D1\u30B9\u6210\u529F", v: d.passes ?? "-" }), d.longPasses && _jsx(Line, { k: "\u30ED\u30F3\u30B0\u30D1\u30B9", v: d.longPasses })] })] }));
}
/* ---------- 小物 ---------- */
function Line({ k, v }) {
    return (_jsxs("li", { className: "flex items-center justify-between py-2", children: [_jsx("span", { className: "text-muted-foreground", children: k }), _jsx("span", { className: "font-medium", children: v })] }));
}
function fmtNum(n) {
    return typeof n === "number" && !Number.isNaN(n) ? String(n) : "-";
}
function fmtFloat(n) {
    return typeof n === "number" && !Number.isNaN(n) ? String(Number(n.toFixed(2))) : "-";
}
function fmtPercent(n) {
    return typeof n === "number" && !Number.isNaN(n) ? `${Number(n.toFixed(0))}%` : "-";
}
