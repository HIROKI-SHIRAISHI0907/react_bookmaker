import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// frontend/src/pages/teams/LiveNow.tsx
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import AppHeader from "../../components/layout/AppHeader";
import { Skeleton } from "../../components/ui/skeleton";
import { fetchLiveMatchesTodayAll } from "../../api/lives";
import { useNavigate } from "react-router-dom";
/** 半角英数と -/_ 以外をハイフンに置換する簡易 slugify */
function slugifyLoose(s) {
    return s
        .normalize("NFKC")
        .toLowerCase()
        .replace(/[\u3000\u00a0]/g, " ")
        .trim()
        .replace(/[^a-z0-9/_-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^[-/]+|[-/]+$/g, "");
}
/** "90:58" -> "90'" など軽い整形。HT/前後半はそのまま */
function formatTimesMinute(s) {
    if (!s)
        return "-";
    const t = s.trim();
    if (/ハーフタイム|第一ハーフ|前半|後半/i.test(t))
        return t;
    const m1 = t.match(/^(\d{1,3}):\d{2}$/);
    if (m1)
        return `${Number(m1[1])}'`;
    const m2 = t.match(/^(\d{1,3})'$/);
    if (m2)
        return `${Number(m2[1])}'`;
    const m3 = t.match(/^(\d{1,3})\+\d{1,2}'$/);
    if (m3)
        return `${Number(m3[1])}'`;
    return t;
}
/** 並び替え用に “現在の分（推定）” を数値化 */
function liveMinuteValue(s) {
    if (!s)
        return -1;
    const t = s.trim();
    if (/ハーフタイム/i.test(t))
        return 45;
    if (/前半/i.test(t))
        return 30; // おおよそ
    if (/後半/i.test(t))
        return 75; // おおよそ
    const m1 = t.match(/^(\d{1,3}):\d{2}$/);
    if (m1)
        return Number(m1[1]);
    const m2 = t.match(/^(\d{1,3})'$/);
    if (m2)
        return Number(m2[1]);
    const m3 = t.match(/^(\d{1,3})\+(\d{1,2})'$/);
    if (m3)
        return Number(m3[1]) + Number(m3[2]);
    return -1;
}
/** "日本: J1 リーグ - ラウンド 12" のような data_category から {country, league} を抜く */
function parseCategory(category) {
    const [countryPart, rest = ""] = category.split(":");
    const country = (countryPart ?? "").trim();
    const league = rest.split("-")[0]?.trim() ?? "";
    return { country, league };
}
export default function LiveNow() {
    const navigate = useNavigate();
    const { data, isLoading, isError } = useQuery({
        queryKey: ["live-now-all"],
        queryFn: () => fetchLiveMatchesTodayAll(),
        refetchInterval: 20000,
        staleTime: 10000,
    });
    // === data_category（=「国: リーグ …」）でグルーピング & 整列 ===
    const grouped = useMemo(() => {
        const map = new Map();
        (data ?? []).forEach((m) => {
            const key = (m.data_category || "その他").trim();
            if (!map.has(key))
                map.set(key, []);
            map.get(key).push(m);
        });
        const categories = Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b, "ja"));
        return categories.map(([cat, list]) => [cat, list.slice().sort((a, b) => liveMinuteValue(b.times) - liveMinuteValue(a.times))]);
    }, [data]);
    return (_jsxs("div", { className: "min-h-screen bg-background", children: [_jsx(AppHeader, { title: "\u73FE\u5728\u958B\u50AC\u4E2D\u306E\u8A66\u5408", subtitle: "\u672C\u65E5\uFF08\u5168\u30EA\u30FC\u30B0\uFF09" }), _jsxs("main", { className: "container mx-auto px-4 py-6 space-y-6", children: [_jsx("div", { className: "mb-2 flex items-center gap-3", children: _jsxs("button", { type: "button", onClick: () => navigate(-1), className: "inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline", children: [_jsx(ArrowLeft, { className: "w-4 h-4" }), "\u623B\u308B"] }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold", children: "\u73FE\u5728\u958B\u50AC\u4E2D\u306E\u8A66\u5408" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "\u672C\u65E5\u958B\u50AC\u4E2D\u306E\u5168\u3066\u306E\u56FD\u30FB\u30EA\u30FC\u30B0\u3092\u8868\u793A" })] }), isLoading ? (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3", children: Array.from({ length: 6 }).map((_, i) => (_jsxs("div", { className: "border rounded p-3", children: [_jsx(Skeleton, { className: "h-4 w-28 mb-2" }), _jsx(Skeleton, { className: "h-6 w-40 mb-2" }), _jsx(Skeleton, { className: "h-4 w-24" })] }, i))) })) : isError ? (_jsx("div", { className: "text-destructive", children: "\u30E9\u30A4\u30D6\u30C7\u30FC\u30BF\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002" })) : !data || data.length === 0 ? (_jsx("div", { className: "text-muted-foreground", children: "\u73FE\u5728\u30E9\u30A4\u30D6\u4E2D\u306E\u8A66\u5408\u306F\u3042\u308A\u307E\u305B\u3093\u3002" })) : (_jsx("div", { className: "space-y-6", children: grouped.map(([category, matches]) => {
                            const { country, league } = parseCategory(category);
                            return (_jsxs("section", { className: "space-y-3", children: [_jsx("h2", { className: "text-lg font-semibold", children: category }), _jsx("ul", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3", children: matches.map((m) => {
                                            // teamSlug はサーバーから渡された home_slug を最優先に利用
                                            const teamSlug = (m.home_slug && m.home_slug.trim()) || slugifyLoose(m.home_team_name) || m.home_team_name;
                                            // History / GameDetails と同形式のパスに内部遷移
                                            const detailPath = `/${encodeURIComponent(country)}/${encodeURIComponent(league)}/${encodeURIComponent(teamSlug)}/history/${m.seq}`;
                                            return (_jsx("li", { children: _jsxs("div", { role: "button", tabIndex: 0, className: "group border rounded p-3 hover:bg-accent transition-colors cursor-pointer", onClick: () => navigate(detailPath), onKeyDown: (e) => {
                                                        if (e.key === "Enter" || e.key === " ") {
                                                            e.preventDefault();
                                                            navigate(detailPath);
                                                        }
                                                    }, children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "font-medium truncate", children: m.home_team_name }), _jsx("span", { className: "text-xl font-bold tabular-nums", children: m.home_score ?? "-" })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "font-medium truncate", children: m.away_team_name }), _jsx("span", { className: "text-xl font-bold tabular-nums", children: m.away_score ?? "-" })] })] }), _jsxs("div", { className: "ml-3 text-right", children: [_jsx("span", { className: "inline-flex items-center rounded-full bg-red-100 text-red-700 text-[11px] font-semibold px-2 py-0.5 mb-1", children: "LIVE" }), _jsx("div", { className: "font-semibold tabular-nums", children: formatTimesMinute(m.times) })] })] }), _jsxs("div", { className: "mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground", children: [_jsxs("div", { children: ["on target: ", _jsx("span", { className: "font-medium text-foreground", children: m.home_shoot_in ?? "-" }), " / ", _jsx("span", { className: "font-medium text-foreground", children: m.away_shoot_in ?? "-" })] }), _jsxs("div", { children: ["xG: ", _jsx("span", { className: "font-medium text-foreground", children: m.home_exp ?? "-" }), " / ", _jsx("span", { className: "font-medium text-foreground", children: m.away_exp ?? "-" })] }), _jsxs("div", { children: ["\u66F4\u65B0: ", m.record_time ? new Date(m.record_time).toLocaleString("ja-JP") : "-"] })] }), _jsx("div", { className: "mt-2 text-right", children: _jsx("button", { type: "button", className: "text-xs underline", onClick: (e) => {
                                                                    e.stopPropagation();
                                                                    navigate(detailPath);
                                                                }, children: "\u8A73\u7D30" }) })] }) }, m.seq));
                                        }) })] }, category));
                        }) }))] })] }));
}
