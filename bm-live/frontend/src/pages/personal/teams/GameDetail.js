import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// frontend/src/pages/teams/GameDetails.tsx
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import AppHeader from "../../components/layout/AppHeader";
import { Skeleton } from "../../components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { fetchGameDetail } from "../../api/gameDetails";
export default function GameDetail() {
    const params = useParams();
    const country = decode(params.country ?? "");
    const league = decode(params.league ?? "");
    const team = params.team ?? "";
    const seq = params.seq ?? "";
    const q = useQuery({
        queryKey: ["game-detail", country, league, team, seq],
        queryFn: () => fetchGameDetail(country, league, team, seq),
        enabled: !!country && !!league && !!team && !!seq,
        staleTime: 30000,
    });
    const toBack = `/${encodeURIComponent(country)}/${encodeURIComponent(league)}/${encodeURIComponent(team)}`;
    const badge = (w) => w === "DRAW" ? (_jsx("span", { className: "px-2 py-0.5 text-xs rounded bg-green-50 text-green-700 border", children: "DRAW" })) : w === "HOME" ? (_jsx("span", { className: "px-2 py-0.5 text-xs rounded bg-red-50 text-red-700 border font-bold", children: "HOME WIN" })) : w === "AWAY" ? (_jsx("span", { className: "px-2 py-0.5 text-xs rounded bg-blue-50 text-blue-700 border font-bold", children: "AWAY WIN" })) : (
    // LIVE は別UIで扱うのでここでは使わない
    _jsx("span", { className: "hidden" }));
    // times 正規化: "MM:SS" / "MM'" / "MM+X'" → "NN`" に統一
    const toMinuteTick = (t) => {
        if (!t)
            return null;
        const s = t.trim();
        if (/終了/.test(s))
            return null;
        // 例: 68:09
        const m1 = s.match(/^(\d{1,3}):\d{2}$/);
        if (m1)
            return `${parseInt(m1[1], 10)}\``;
        // 例: 45+2'
        const m2 = s.match(/^(\d{1,3})\s*\+\s*(\d{1,2})'?$/);
        if (m2)
            return `${parseInt(m2[1], 10) + parseInt(m2[2], 10)}\``;
        // 例: 68'
        const m3 = s.match(/^(\d{1,3})'?$/);
        if (m3)
            return `${parseInt(m3[1], 10)}\``;
        // その他は ' → ` に置換して返す
        return s.replace(/'/g, "`");
    };
    // 表示用: "ハーフタイム"/"第一ハーフ" はそのまま。
    // それ以外は "MM:SS" / "MM'" / "MM+X'" → "NN`" に統一。
    // "終了" を含む場合は null（＝時間非表示）。
    const toDisplayTime = (t) => {
        if (!t)
            return null;
        const s = t.trim();
        if (/終了/.test(s))
            return null;
        // ← 追加ポイント：これらはそのまま表示
        if (/ハーフタイム|第一ハーフ/.test(s))
            return s;
        // 例: 68:09
        const m1 = s.match(/^(\d{1,3}):\d{2}$/);
        if (m1)
            return `${parseInt(m1[1], 10)}\``;
        // 例: 45+2'
        const m2 = s.match(/^(\d{1,3})\s*\+\s*(\d{1,2})'?$/);
        if (m2)
            return `${parseInt(m2[1], 10) + parseInt(m2[2], 10)}\``;
        // 例: 68'
        const m3 = s.match(/^(\d{1,3})'?$/);
        if (m3)
            return `${parseInt(m3[1], 10)}\``;
        // その他は ' → ` 置換だけ
        return s.replace(/'/g, "`");
    };
    return (_jsxs("div", { className: "min-h-screen bg-background", children: [_jsx(AppHeader, { title: "\u8A66\u5408 \u8A73\u7D30", subtitle: `${country} / ${league}` }), _jsxs("main", { className: "container mx-auto px-4 py-6 space-y-6", children: [_jsx("div", { className: "mb-2 flex items-center gap-3", children: _jsxs(Link, { to: toBack, className: "inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline", children: [_jsx(ArrowLeft, { className: "w-4 h-4" }), "\u623B\u308B"] }) }), q.isLoading ? (_jsxs("div", { className: "space-y-3", children: [_jsx(Skeleton, { className: "h-8 w-60" }), _jsx(Skeleton, { className: "h-40 w-full" })] })) : q.isError ? (_jsx("div", { className: "text-destructive text-sm", children: "\u8A73\u7D30\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002" })) : !q.data ? null : (_jsxs(_Fragment, { children: [_jsxs("section", { className: "rounded-2xl border bg-card p-6 shadow-sm", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "text-sm text-muted-foreground", children: [q.data.competition, q.data.round_no != null && _jsxs("span", { className: "ml-2 font-bold", children: ["\u30E9\u30A6\u30F3\u30C9 ", q.data.round_no] })] }), _jsxs("div", { className: "text-xs text-muted-foreground flex items-center gap-2", children: [new Date(q.data.recordedAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }), q.data.winner === "LIVE" && (_jsxs("span", { className: "ml-2 inline-flex items-center gap-2", children: [_jsx("span", { className: "rounded-full border px-2 py-0.5 text-[11px] leading-none", children: "LIVE" }), toDisplayTime(q.data.times) && _jsx("span", { className: "text-[11px] text-muted-foreground", children: toDisplayTime(q.data.times) })] }))] })] }), _jsxs("div", { className: "mt-4 flex items-center justify-between", children: [_jsx("div", { className: "flex-1 text-left", children: _jsx("div", { className: "text-lg font-semibold", children: q.data.home.name }) }), _jsxs("div", { className: "px-4 text-3xl font-bold", children: [q.data.home.score, " ", _jsx("span", { className: "text-muted-foreground text-xl mx-2", children: "-" }), " ", q.data.away.score] }), _jsx("div", { className: "flex-1 text-right", children: _jsx("div", { className: "text-lg font-semibold", children: q.data.away.name }) })] }), q.data.winner !== "LIVE" && _jsx("div", { className: "mt-3 flex items-center justify-center gap-3", children: badge(q.data.winner) })] }), _jsxs("section", { className: "grid md:grid-cols-2 gap-4", children: [_jsx(TeamStatCard, { title: "\u30DB\u30FC\u30E0", side: "home", data: q.data }), _jsx(TeamStatCard, { title: "\u30A2\u30A6\u30A7\u30A4", side: "away", data: q.data })] }), (q.data.venue.stadium || q.data.venue.audience || q.data.venue.capacity) && (_jsxs("section", { className: "rounded-2xl border bg-card p-4 shadow-sm", children: [_jsx("h3", { className: "text-base font-semibold mb-2", children: "\u4F1A\u5834\u60C5\u5831" }), _jsxs("ul", { className: "text-sm text-muted-foreground space-y-1", children: [q.data.venue.stadium && _jsxs("li", { children: ["\u30B9\u30BF\u30B8\u30A2\u30E0: ", q.data.venue.stadium] }), q.data.venue.audience && _jsxs("li", { children: ["\u89B3\u5BA2\u6570: ", q.data.venue.audience] }), q.data.venue.capacity && _jsxs("li", { children: ["\u53CE\u5BB9\u4EBA\u6570: ", q.data.venue.capacity] })] })] }))] }))] })] }));
}
function TeamStatCard({ title, side, data }) {
    const d = data[side];
    const Line = ({ k, v }) => (_jsxs("li", { className: "flex items-center justify-between py-2", children: [_jsx("span", { className: "text-muted-foreground", children: k }), _jsx("span", { className: "font-medium", children: v })] }));
    const fmtNum = (n) => (n == null ? "-" : String(n));
    const fmtPct = (n) => (n == null ? "-" : `${n}%`);
    return (_jsxs("div", { className: "rounded-2xl border bg-card p-4 shadow-sm", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h3", { className: "text-base font-semibold", children: title }), _jsx("div", { className: "text-xs text-muted-foreground", children: d.manager ? `監督: ${d.manager}` : "" })] }), _jsx("div", { className: "text-sm text-muted-foreground mb-3", children: d.formation ? `フォーメーション: ${d.formation}` : "-" }), _jsxs("ul", { className: "text-sm divide-y", children: [_jsx(Line, { k: "xG", v: fmtNum(d.xg) }), _jsx(Line, { k: "\u30DD\u30BC\u30C3\u30B7\u30E7\u30F3", v: fmtPct(d.possession) }), _jsx(Line, { k: "\u30B7\u30E5\u30FC\u30C8(\u7DCF)", v: fmtNum(d.shots) }), _jsx(Line, { k: "\u67A0\u5185\u30B7\u30E5\u30FC\u30C8", v: fmtNum(d.shotsOn) }), _jsx(Line, { k: "\u67A0\u5916\u30B7\u30E5\u30FC\u30C8", v: fmtNum(d.shotsOff) }), _jsx(Line, { k: "\u30D6\u30ED\u30C3\u30AF", v: fmtNum(d.blocks) }), _jsx(Line, { k: "CK", v: fmtNum(d.corners) }), _jsx(Line, { k: "\u30D3\u30C3\u30B0\u30C1\u30E3\u30F3\u30B9", v: fmtNum(d.bigChances) }), _jsx(Line, { k: "\u30BB\u30FC\u30D6", v: fmtNum(d.saves) }), _jsx(Line, { k: "\u8B66\u544A", v: fmtNum(d.yc) }), _jsx(Line, { k: "\u9000\u5834", v: fmtNum(d.rc) }), _jsx(Line, { k: "\u30D1\u30B9\u6210\u529F", v: d.passes ?? "-" }), d.longPasses && _jsx(Line, { k: "\u30ED\u30F3\u30B0\u30D1\u30B9", v: d.longPasses })] })] }));
}
function decode(s) {
    try {
        return decodeURIComponent(s);
    }
    catch {
        return s;
    }
}
