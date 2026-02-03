import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// frontend/src/pages/teams/History.tsx
import { Link, useParams } from "react-router-dom";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import AppHeader from "../../components/layout/AppHeader";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "../../components/ui/skeleton";
import { fetchPastMatches } from "../../api/histories";
import { fetchTeamDetail } from "../../api/leagues";
export default function History() {
    const params = useParams();
    const countryParam = params.country ?? "";
    const leagueParam = params.league ?? "";
    const teamSlug = params.team ?? "";
    const safeDecode = (s) => {
        try {
            return decodeURIComponent(s);
        }
        catch {
            return s;
        }
    };
    const countryLabel = safeDecode(countryParam);
    const leagueLabel = safeDecode(leagueParam);
    // 表示/判定用：チーム正式名
    const teamQ = useQuery({
        queryKey: ["team-detail", countryLabel, leagueLabel, teamSlug],
        queryFn: () => fetchTeamDetail(countryLabel, leagueLabel, teamSlug),
        enabled: !!countryLabel && !!leagueLabel && !!teamSlug,
        staleTime: 60000,
    });
    // 履歴一覧
    const historyQ = useQuery({
        queryKey: ["team-history", countryLabel, leagueLabel, teamSlug],
        queryFn: () => fetchPastMatches(countryLabel, leagueLabel, teamSlug),
        enabled: !!countryLabel && !!leagueLabel && !!teamSlug,
        staleTime: 60000,
    });
    // 勝敗判定（全角/半角スペースゆらぎ吸収）
    const norm = (s) => s
        .replace(/[\u3000\u00A0]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
    const resultOf = (m, teamName) => {
        const key = norm(teamName);
        const home = norm(m.homeTeam);
        const away = norm(m.awayTeam);
        const hs = Number(m.homeScore ?? 0);
        const as = Number(m.awayScore ?? 0);
        if (home === key)
            return hs > as ? "WIN" : hs < as ? "LOSE" : "DRAW";
        if (away === key)
            return as > hs ? "WIN" : as < hs ? "LOSE" : "DRAW";
        return "DRAW"; // 万一一致しなければ引き分け扱い（色は緑）
    };
    // 新しい順に整列
    const rows = useMemo(() => {
        const list = historyQ.data ?? [];
        return [...list].sort((a, b) => new Date(b.matchTime).getTime() - new Date(a.matchTime).getTime());
    }, [historyQ.data]);
    // パス生成用（詳細へ）
    const encCountry = encodeURIComponent(countryLabel);
    const encLeague = encodeURIComponent(leagueLabel);
    // 戻るリンク/サブタイトル
    const toBack = `/${encCountry}/${encLeague}`;
    const headerSubtitle = `${countryLabel} / ${leagueLabel} / 過去の対戦履歴`;
    return (_jsxs("div", { className: "min-h-screen bg-background", children: [_jsx(AppHeader, { title: "\u904E\u53BB\u306E\u5BFE\u6226\u5C65\u6B74", subtitle: headerSubtitle }), _jsxs("main", { className: "container mx-auto px-4 py-6 space-y-6", children: [_jsx("div", { className: "mb-2 flex items-center gap-3", children: _jsxs(Link, { to: toBack, className: "inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline", children: [_jsx(ArrowLeft, { className: "w-4 h-4" }), countryLabel, " / ", leagueLabel, " \u306B\u623B\u308B"] }) }), _jsx("section", { className: "rounded-xl border bg-card shadow-sm", children: historyQ.isLoading || teamQ.isLoading ? (_jsxs("div", { className: "p-4 space-y-3", children: [_jsx(Skeleton, { className: "h-6 w-40" }), _jsx(Skeleton, { className: "h-6 w-full" }), _jsx(Skeleton, { className: "h-6 w-3/4" })] })) : historyQ.isError || teamQ.isError ? (_jsx("div", { className: "p-4 text-sm text-destructive", children: "\u5C65\u6B74\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002" })) : rows.length === 0 || !teamQ.data ? (_jsx("div", { className: "p-4 text-sm text-muted-foreground", children: "\u8868\u793A\u3067\u304D\u308B\u5BFE\u6226\u5C65\u6B74\u304C\u3042\u308A\u307E\u305B\u3093\u3002" })) : (_jsx("ul", { className: "divide-y", children: rows.map((m) => {
                                const result = resultOf(m, teamQ.data.name);
                                const resultClass = result === "WIN" ? "text-red-600 font-extrabold" : result === "LOSE" ? "text-blue-600 font-extrabold" : "text-green-600 font-extrabold";
                                const detailPath = `/${encodeURIComponent(countryLabel)}/${encodeURIComponent(leagueLabel)}/${encodeURIComponent(teamSlug)}/history/${m.seq}`;
                                return (_jsxs(Link, { to: detailPath, className: "group flex items-center gap-3 py-3 px-4 hover:bg-accent/40 transition rounded-md", children: [_jsx("div", { className: "w-32 shrink-0 text-sm", children: m.roundNo != null ? _jsxs("span", { className: "font-bold", children: ["\u30E9\u30A6\u30F3\u30C9 ", m.roundNo] }) : _jsx("span", { className: "text-muted-foreground", children: "\u30E9\u30A6\u30F3\u30C9 -" }) }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "text-sm", children: [m.homeTeam, " vs ", m.awayTeam, m.link && (_jsxs(_Fragment, { children: [" ", "\u00B7", " ", _jsx("a", { className: "underline", href: m.link, target: "_blank", rel: "noreferrer", onClick: (e) => e.stopPropagation(), children: "\u5916\u90E8\u8A73\u7D30" })] }))] }), _jsx("div", { className: "text-xs text-muted-foreground", children: m.matchTime ? new Date(m.matchTime).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }) : "-" })] }), _jsxs("div", { className: "w-24 text-right", children: [_jsxs("div", { className: "text-sm", children: [m.homeScore ?? 0, " - ", m.awayScore ?? 0] }), _jsx("div", { className: `text-xs ${resultClass}`, children: result })] })] }, m.seq));
                            }) })) })] })] }));
}
