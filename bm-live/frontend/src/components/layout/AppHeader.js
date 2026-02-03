import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import LeagueLink from "../LeagueLink";
import ThemeToggle from "../../components/ThemeToggle"; // ある場合
export default function AppHeader({ title, subtitle, rightSlot }) {
    return (_jsx("header", { className: "sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur", children: _jsx("div", { className: "container mx-auto px-4 py-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(LeagueLink, {}), _jsxs("div", { children: [title && _jsx("h1", { className: "text-2xl font-bold", children: title }), subtitle && _jsx("p", { className: "text-muted-foreground text-sm", children: subtitle })] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [rightSlot, _jsx(ThemeToggle, {})] })] }) }) }));
}
