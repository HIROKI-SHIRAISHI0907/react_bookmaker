import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
// src/pages/teams/OverviewDetail.tsx
import { Link, useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, TrendingUp, TrendingDown, ShieldCheck, Flame, Award, AlertTriangle, ArrowUp, ArrowDown, Home as HomeIcon, Plane, Activity, Flag, Rocket } from "lucide-react";
import AppHeader from "../../components/layout/AppHeader";
import { Skeleton } from "../../components/ui/skeleton";
import { fetchScheduleOverview } from "../../api/scheduled_overviews";
// ★ Recharts 追加
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
// ---- 追加: API の 200/空 を安全に扱うためのローカル型 ----
const isOverviewOK = (d) => !!d && Array.isArray(d.surfaces);
// ---- 既存: バッジ ----
function Badge({ icon, text, tone = "default" }) {
    const color = tone === "good" ? "text-green-700 bg-green-100 border-green-200" : tone === "bad" ? "text-red-700 bg-red-100 border-red-200" : "text-foreground bg-muted border-border";
    return (_jsxs("span", { className: `inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${color}`, children: [icon, text] }));
}
// ---- 修正: バッジ生成 ----
function badgesFromSurface(s, opts) {
    const list = [];
    // 直近連勝表示（3連勝以上）
    if (s.consecutiveWinDisp) {
        list.push(_jsx(Badge, { icon: _jsx(TrendingUp, { className: "w-3 h-3" }), text: s.consecutiveWinDisp, tone: "good" }, "consecutive-win"));
    }
    // 直近連敗表示（3連敗以上）
    if (s.consecutiveLoseDisp) {
        list.push(_jsx(Badge, { icon: _jsx(TrendingDown, { className: "w-3 h-3" }), text: s.consecutiveLoseDisp, tone: "bad" }, "consecutive-lose"));
    }
    // 無敗記録表示（無敗が3回連続）
    if (s.unbeatenStreakDisp) {
        list.push(_jsx(Badge, { icon: _jsx(ShieldCheck, { className: "w-3 h-3" }), text: s.unbeatenStreakDisp }, "unbeaten"));
    }
    // 得点継続表示（3試合連続得点）
    if (s.consecutiveScoreCountDisp) {
        list.push(_jsx(Badge, { icon: _jsx(Flame, { className: "w-3 h-3" }), text: s.consecutiveScoreCountDisp, tone: "good" }, "scoring-streak"));
    }
    // 序盤好調（勝率7割以上）
    if (s.firstWeekGameWinDisp) {
        list.push(_jsx(Badge, { icon: _jsx(Rocket, { className: "w-3 h-3" }), text: s.firstWeekGameWinDisp, tone: "good" }, "first-week-hot"));
    }
    // 中盤好調（勝率7割以上）
    if (s.midWeekGameWinDisp) {
        list.push(_jsx(Badge, { icon: _jsx(Activity, { className: "w-3 h-3" }), text: s.midWeekGameWinDisp, tone: "good" }, "mid-week-hot"));
    }
    // 終盤好調（勝率7割以上）
    if (s.lastWeekGameWinDisp) {
        list.push(_jsx(Badge, { icon: _jsx(Flag, { className: "w-3 h-3" }), text: s.lastWeekGameWinDisp, tone: "good" }, "last-week-hot"));
    }
    // 初勝利表示（5試合以上未勝利→初勝利）
    if (s.firstWinDisp) {
        list.push(_jsx(Badge, { icon: _jsx(Award, { className: "w-3 h-3" }), text: s.firstWinDisp, tone: "good" }, "first-win"));
    }
    // 負けが混んだ時（4連敗以上）
    if (s.loseStreakDisp) {
        list.push(_jsx(Badge, { icon: _jsx(AlertTriangle, { className: "w-3 h-3" }), text: s.loseStreakDisp, tone: "bad" }, "lose-streak"));
    }
    // 昇格表示（昇格組）
    if (s.promoteDisp) {
        list.push(_jsx(Badge, { icon: _jsx(ArrowUp, { className: "w-3 h-3" }), text: s.promoteDisp, tone: "good" }, "promote"));
    }
    // 降格表示（降格組）
    if (s.descendDisp) {
        list.push(_jsx(Badge, { icon: _jsx(ArrowDown, { className: "w-3 h-3" }), text: s.descendDisp, tone: "bad" }, "descend"));
    }
    // 逆境系（3割以上逆転勝利）※ホーム/アウェーで出し分け
    if (opts?.isHome && s.homeAdversityDisp) {
        list.push(_jsx(Badge, { icon: _jsx(HomeIcon, { className: "w-3 h-3" }), text: s.homeAdversityDisp, tone: "good" }, "home-adversity"));
    }
    if (opts?.isAway && s.awayAdversityDisp) {
        list.push(_jsx(Badge, { icon: _jsx(Plane, { className: "w-3 h-3" }), text: s.awayAdversityDisp, tone: "good" }, "away-adversity"));
    }
    return list.length ? list : null;
}
// 追加：1枚にまとめた横棒チャート
function StatsSummaryChart({ s }) {
    const toNum = (v) => (v == null ? null : Number.isFinite(Number(v)) ? Number(v) : null);
    const rows = [
        { label: "合計得点", value: toNum(s.goalsFor) },
        { label: "クリーンシート", value: toNum(s.cleanSheets) },
        { label: "前半得点", value: toNum(s.firstHalfScore) },
        { label: "後半得点", value: toNum(s.secondHalfScore) },
        { label: "先制回数", value: toNum(s.firstGoalCount) },
        { label: "逆転勝利数", value: toNum(s.winBehindCount) },
        { label: "逆転敗北数", value: toNum(s.loseBehindCount) },
        { label: "該当側勝利数", value: toNum(s.winCountRole) },
        { label: "該当側敗北数", value: toNum(s.loseCountRole) },
        { label: "無得点試合数", value: toNum(s.failToScoreGameCount) },
    ].filter((r) => r.value !== null);
    if (rows.length === 0 || rows.every((r) => (r.value ?? 0) === 0)) {
        return _jsx("div", { className: "text-xs text-muted-foreground", children: "\u8868\u793A\u3067\u304D\u308B\u30B9\u30BF\u30C3\u30C4\u306E\u30C7\u30FC\u30BF\u304C\u3042\u308A\u307E\u305B\u3093\u3002" });
    }
    const data = rows.map((r) => ({ label: r.label, value: r.value ?? 0 })).sort((a, b) => b.value - a.value);
    return (_jsx("div", { className: "h-72", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: data, layout: "vertical", margin: { top: 10, right: 20, bottom: 10, left: 40 }, barCategoryGap: 40, barGap: 8, children: [_jsx(CartesianGrid, { vertical: true, strokeDasharray: "3 3", horizontal: false }), _jsx(XAxis, { type: "number", domain: [0, 20], allowDecimals: false, axisLine: false, tickLine: false, tick: { fontSize: 11 } }), _jsx(YAxis, { dataKey: "label", type: "category", width: 84, axisLine: false, tickLine: false, tick: { fontSize: 11 } }), _jsx(Tooltip, {}), _jsx(Bar, { dataKey: "value", fill: "#000000", barSize: 12, radius: [4, 4, 4, 4], minPointSize: 2 })] }) }) }));
}
export default function OverviewDetail() {
    const { country = "", league = "", team = "", seq = "" } = useParams();
    const loc = useLocation();
    const sp = new URLSearchParams(loc.search);
    const home = sp.get("home") ?? undefined;
    const away = sp.get("away") ?? undefined;
    const countryRaw = decodeURIComponent(country);
    const leagueRaw = decodeURIComponent(league);
    const seqNum = Number(seq);
    // ★ ここを ScheduleOverviewApi に（ローカル型）
    const { data, isLoading, isError } = useQuery({
        queryKey: ["scheduled-overview", countryRaw, leagueRaw, seqNum, home, away],
        queryFn: () => fetchScheduleOverview(countryRaw, leagueRaw, seqNum, { home, away }),
        enabled: Number.isFinite(seqNum) && (!!home || !!away),
        staleTime: 30000,
    });
    const backTo = `/${country}/${league}/${team}`;
    // ★ 「試合データがありません」判定
    const noData = !!data &&
        ("message" in data || // { message: "..."} のケース
            (isOverviewOK(data) && data.surfaces.length === 0)); // surfaces 空配列
    return (_jsxs("div", { className: "min-h-screen bg-background", children: [_jsx(AppHeader, { title: "\u958B\u50AC\u4E88\u5B9A \u8A73\u7D30", subtitle: `${countryRaw} / ${leagueRaw}` }), _jsxs("main", { className: "container mx-auto px-4 py-6 space-y-6", children: [_jsx("div", { className: "mb-2", children: _jsxs(Link, { to: backTo, className: "inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline", children: [_jsx(ArrowLeft, { className: "w-4 h-4" }), " \u623B\u308B"] }) }), isLoading ? (_jsxs("div", { className: "space-y-3", children: [_jsx(Skeleton, { className: "h-8 w-80" }), _jsx(Skeleton, { className: "h-24 w-full" })] })) : isError ? (_jsx("div", { className: "text-destructive", children: "\u30C7\u30FC\u30BF\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002" })) : !data ? (_jsx("div", { className: "text-sm text-muted-foreground", children: "\u30D1\u30E9\u30E1\u30FC\u30BF\u304C\u4E0D\u8DB3\u3057\u3066\u3044\u307E\u3059\uFF08home / away\uFF09\u3002" })) : noData ? (
                    // ★ 例外扱いにせず、明示文言で表示
                    _jsx("div", { className: "text-sm text-muted-foreground", children: "\u8A66\u5408\u30C7\u30FC\u30BF\u304C\u3042\u308A\u307E\u305B\u3093\u3002" })) : (
                    // ★ ここからは通常データがある場合のみ描画
                    _jsxs(_Fragment, { children: [_jsxs("header", { className: "space-y-1", children: [_jsxs("h1", { className: "text-2xl font-bold", children: [data.match.home_team, " vs ", data.match.away_team] }), _jsxs("div", { className: "text-sm text-muted-foreground", children: [data.match.round_no != null ? `ラウンド ${data.match.round_no} · ` : "", data.match.future_time ? `開催予定: ${new Date(data.match.future_time).toLocaleString("ja-JP")}` : "日程情報なし", data.match.game_year && data.match.game_month ? ` · ${data.match.game_year}年${data.match.game_month}月` : ""] })] }), _jsx("section", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: data.surfaces.map((s) => {
                                    const isHome = s.team === data.match.homeTeam;
                                    const isAway = s.team === data.match.away_eam;
                                    // 値の取得（camelCase → snake_case → 役割依存のフォールバックの順）
                                    const homeWins = s.homeWinCount ?? s.homeWinCount ?? (isHome ? s.winCountRole : null) ?? 0;
                                    const homeLoses = s.homeLoseCount ?? s.homeLoseCount ?? (isHome ? s.loseCountRole : null) ?? 0;
                                    const awayWins = s.awayWinCount ?? s.awayWinCount ?? (isAway ? s.winCountRole : null) ?? 0;
                                    const awayLoses = s.awayLoseCount ?? s.awayLoseCount ?? (isAway ? s.loseCountRole : null) ?? 0;
                                    return (_jsxs("div", { className: "rounded-xl border bg-card p-4 shadow-sm", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("h2", { className: "text-lg font-semibold", children: [s.team, " ", isHome ? "(HOME)" : isAway ? "(AWAY)" : ""] }), _jsx("div", { className: "text-sm text-muted-foreground flex items-center gap-3", children: isHome ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "font-medium", children: "HOME" }), _jsxs("span", { children: ["\u52DD ", homeWins] }), _jsxs("span", { children: ["\u6557 ", homeLoses] })] })) : (_jsxs(_Fragment, { children: [_jsx("span", { className: "font-medium", children: "AWAY" }), _jsxs("span", { children: ["\u52DD ", awayWins] }), _jsxs("span", { children: ["\u6557 ", awayLoses] })] })) })] }), _jsx("div", { className: "flex flex-wrap gap-2 mb-3", children: badgesFromSurface(s, { isHome, isAway }) }), _jsxs("div", { className: "grid grid-cols-3 gap-3 text-sm mb-4", children: [_jsxs("div", { className: "rounded-lg border p-3", children: [_jsx("div", { className: "text-xs text-muted-foreground", children: "\u9806\u4F4D" }), _jsx("div", { className: "text-xl font-bold", children: s.rank ?? "—" })] }), _jsxs("div", { className: "rounded-lg border p-3", children: [_jsx("div", { className: "text-xs text-muted-foreground", children: "\u6210\u7E3E" }), _jsxs("div", { className: "text-xl font-bold", children: [s.win ?? 0, "\u52DD-", s.draw ?? 0, "\u5206-", s.lose ?? 0, "\u6557"] })] }), _jsxs("div", { className: "rounded-lg border p-3", children: [_jsx("div", { className: "text-xs text-muted-foreground", children: "\u8A66\u5408\u6570" }), _jsx("div", { className: "text-xl font-bold", children: s.games ?? "—" })] })] }), _jsxs("div", { className: "rounded-lg border p-3 mt-2", children: [_jsx("div", { className: "text-xs text-muted-foreground mb-1", children: "\u4E3B\u8981\u30B9\u30BF\u30C3\u30C4\uFF08\u5F79\u5272\u306B\u5FDC\u3058\u3066\u81EA\u52D5\u5207\u66FF\uFF09" }), _jsx(StatsSummaryChart, { s: s })] })] }, s.team));
                                }) })] }))] })] }));
}
