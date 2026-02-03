import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// frontend/src/components/correlation/CorrelationPanel.tsx
import { useEffect, useMemo, useState } from "react";
function Segmented({ value, onChange, options }) {
    return (_jsx("div", { className: "inline-flex rounded-xl border bg-zinc-50/70 dark:bg-zinc-800/50 p-1", children: options.map((opt) => {
            const active = value === opt.key;
            return (_jsx("button", { type: "button", onClick: () => !opt.disabled && onChange(opt.key), disabled: !!opt.disabled, className: [
                    "px-3 py-1.5 text-sm rounded-lg transition",
                    active ? "bg-white dark:bg-zinc-900 shadow-sm border" : "text-muted-foreground hover:bg-white/70 hover:dark:bg-zinc-900/60",
                    opt.disabled ? "opacity-40 cursor-not-allowed" : "",
                ].join(" "), children: opt.label }, opt.key));
        }) }));
}
function Tabs({ value, onChange, options }) {
    return (_jsx("div", { className: "inline-flex rounded-xl border bg-zinc-50/70 dark:bg-zinc-800/50 p-1", children: options.map((opt) => {
            const active = value === opt.key;
            return (_jsx("button", { type: "button", onClick: () => !opt.disabled && onChange(opt.key), disabled: !!opt.disabled, className: [
                    "px-3 py-1.5 text-sm rounded-lg transition",
                    active ? "bg-white dark:bg-zinc-900 shadow-sm border" : "text-muted-foreground hover:bg-white/70 hover:dark:bg-zinc-900/60",
                    opt.disabled ? "opacity-40 cursor-not-allowed" : "",
                ].join(" "), children: opt.label }, opt.key));
        }) }));
}
/** ===== Helpers ===== */
const SCORE_ORDER = ["1st", "2nd", "ALL"];
function hasAny(items) {
    return !!(items && items.length > 0);
}
function prettyMetric(metric) {
    if (metric.startsWith("home"))
        return metric.replace(/^home/, "");
    if (metric.startsWith("away"))
        return metric.replace(/^away/, "");
    return metric;
}
function formatValue(v) {
    return v.toFixed(5);
}
/** ===== Main Panel ===== */
const CorrelationPanel = ({ data, opponents, opponent = "", onOpponentChange }) => {
    // 初期値: HOME / 1st
    const [side, setSide] = useState("HOME");
    const [score, setScore] = useState("1st");
    // サイド別にデータがあるか
    const hasSide = useMemo(() => ({
        HOME: hasAny(data?.HOME?.["1st"]) || hasAny(data?.HOME?.["2nd"]) || hasAny(data?.HOME?.ALL),
        AWAY: hasAny(data?.AWAY?.["1st"]) || hasAny(data?.AWAY?.["2nd"]) || hasAny(data?.AWAY?.ALL),
    }), [data]);
    // 初期サイドの自動補正（HOMEが空ならAWAYへ）
    useEffect(() => {
        if (side === "HOME" && !hasSide.HOME && hasSide.AWAY) {
            setSide("AWAY");
        }
        else if (side === "AWAY" && !hasSide.AWAY && hasSide.HOME) {
            setSide("HOME");
        }
    }, [hasSide.HOME, hasSide.AWAY, side]);
    // スコアタブの有効/無効
    const scoreEnabled = useMemo(() => {
        const s = side;
        return {
            "1st": hasAny(data?.[s]?.["1st"]),
            "2nd": hasAny(data?.[s]?.["2nd"]),
            ALL: hasAny(data?.[s]?.ALL),
        };
    }, [data, side]);
    // 選択中のスコアが空だったら、あるものにフォールバック
    useEffect(() => {
        if (!scoreEnabled[score]) {
            const next = SCORE_ORDER.find((k) => scoreEnabled[k]);
            if (next)
                setScore(next);
        }
    }, [scoreEnabled, score]);
    const items = useMemo(() => {
        const arr = data?.[side]?.[score] ?? [];
        return arr;
    }, [data, side, score]);
    const noAnyData = !hasSide.HOME && !hasSide.AWAY;
    const noItemsInSelection = !hasAny(items);
    const hasOpponentSelect = !!(opponents && opponents.length > 0);
    return (_jsxs("div", { className: "rounded-2xl border bg-white/70 dark:bg-zinc-900/40 backdrop-blur-sm p-4 shadow-sm", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-3 mb-4", children: [hasOpponentSelect && (_jsxs("label", { className: "flex items-center gap-2 text-sm", children: [_jsx("span", { className: "text-muted-foreground", children: "\u5BFE\u6226\u76F8\u624B" }), _jsxs("select", { className: "rounded-md border px-2 py-1 bg-background", value: opponent, onChange: (e) => onOpponentChange?.(e.target.value), children: [_jsx("option", { value: "", children: "\uFF08\u5168\u76F8\u624B\uFF09" }), opponents.map((name) => (_jsx("option", { value: name, children: name }, name)))] })] })), _jsx(Segmented, { value: side, onChange: (v) => setSide(v), options: [
                            { key: "HOME", label: "HOME", disabled: !hasSide.HOME },
                            { key: "AWAY", label: "AWAY", disabled: !hasSide.AWAY },
                        ] }), _jsx(Tabs, { value: score, onChange: (v) => setScore(v), options: [
                            { key: "1st", label: "1st", disabled: !scoreEnabled["1st"] },
                            { key: "2nd", label: "2nd", disabled: !scoreEnabled["2nd"] },
                            { key: "ALL", label: "ALL", disabled: !scoreEnabled.ALL },
                        ] })] }), noAnyData ? (_jsx("div", { className: "text-muted-foreground", children: "\u8868\u793A\u3059\u308B\u30C7\u30FC\u30BF\u304C\u3042\u308A\u307E\u305B\u3093\u3002" })) : noItemsInSelection ? (_jsx("div", { className: "text-muted-foreground", children: "\u8868\u793A\u3059\u308B\u30C7\u30FC\u30BF\u304C\u3042\u308A\u307E\u305B\u3093\u3002" })) : (_jsx("div", { className: "overflow-hidden rounded-xl border", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-zinc-50/70 dark:bg-zinc-800/50", children: _jsxs("tr", { children: [_jsx("th", { className: "text-left px-3 py-2 w-16", children: "Rank" }), _jsx("th", { className: "text-left px-3 py-2", children: "Metric" }), _jsx("th", { className: "text-right px-3 py-2 w-28", children: "Corr" })] }) }), _jsx("tbody", { children: items.map((it, idx) => {
                                const rank = idx + 1;
                                const isTop3 = rank <= 3;
                                return (_jsxs("tr", { className: "odd:bg-white even:bg-zinc-50/40 dark:odd:bg-zinc-900/40 dark:even:bg-zinc-900/20", children: [_jsx("td", { className: `px-3 py-2 ${isTop3 ? "font-bold" : ""}`, children: rank }), _jsxs("td", { className: `px-3 py-2 ${isTop3 ? "font-bold" : ""}`, children: [_jsx("span", { className: "text-xs text-muted-foreground mr-1", children: side === "HOME" ? "home" : "away" }), prettyMetric(it.metric)] }), _jsx("td", { className: `px-3 py-2 text-right tabular-nums ${isTop3 ? "font-bold" : ""}`, children: formatValue(it.value) })] }, `${it.metric}-${idx}`));
                            }) })] }) }))] }));
};
export default CorrelationPanel;
