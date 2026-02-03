import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
export default function FutureMatchesList({ items }) {
    if (!items?.length) {
        return _jsx("div", { className: "text-muted-foreground text-sm", children: "\u4E88\u5B9A\u3055\u308C\u3066\u3044\u308B\u8A66\u5408\u306F\u3042\u308A\u307E\u305B\u3093\u3002" });
    }
    return (_jsx("ul", { className: "divide-y rounded-xl border", children: items.map((it) => (
        // ← いただいた1行レンダリングをそのまま使用
        _jsxs("li", { className: "flex items-center gap-3 py-2 px-3", children: [_jsx("div", { className: "w-32 shrink-0 text-sm", children: it.round_no != null ? _jsxs("span", { className: "font-bold", children: ["\u30E9\u30A6\u30F3\u30C9 ", it.round_no] }) : _jsx("span", { className: "text-muted-foreground", children: "\u30E9\u30A6\u30F3\u30C9 -" }) }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "text-sm", children: [it.home_team, " vs ", it.away_team] }), _jsxs("div", { className: "text-xs text-muted-foreground", children: [new Date(it.future_time).toLocaleString(), it.link ? (_jsxs(_Fragment, { children: [" ", "\u00B7", " ", _jsx("a", { href: it.link, target: "_blank", rel: "noreferrer", className: "underline", children: "\u8A73\u7D30" })] })) : null] })] })] }, it.seq))) }));
}
