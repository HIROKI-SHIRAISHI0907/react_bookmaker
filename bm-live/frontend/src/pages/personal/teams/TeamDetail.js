import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// frontend/src/pages/teams/TeamDetail.tsx
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { fetchTeamDetail } from "../../api/leagues";
import { fetchTeamCorrelations } from "../../api/correlations";
import { fetchTeamFeatureStats } from "../../api/eachstats";
import { fetchFutureMatches } from "../../api/upcomings";
import { fetchTeamGames } from "../../api/games";
import { fetchTeamPlayers } from "../../api/players";
import { fetchRankHistory } from "../../api/rankHistory";
import AppHeader from "../../components/layout/AppHeader";
import CorrelationPanel from "../../components/correlation/CorrelationPanel";
import TeamFeaturePanel from "../../components/feature/TeamFeaturePanel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { Skeleton } from "../../components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
// 月次サマリ API
import { fetchMonthlyOverview } from "../../api/overviews";
// recharts
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
// GameMatch: roundNo / futureTime が無い前提なら、存在するキーに合わせて変更する
const sortLive = (a, b) => {
    // 例：開始時刻キーがあるならそれで
    const ta = new Date(a.time ?? a.kickoffTime ?? 0).getTime();
    const tb = new Date(b.time ?? b.kickoffTime ?? 0).getTime();
    return ta - tb;
};
const sortFinished = (a, b) => {
    const ta = new Date(a.time ?? a.kickoffTime ?? 0).getTime();
    const tb = new Date(b.time ?? b.kickoffTime ?? 0).getTime();
    return tb - ta; // 終了は新しい順など、好みで
};
const sortScheduled = (a, b) => {
    const ra = a.roundNo ?? 0;
    const rb = b.roundNo ?? 0;
    if (ra !== rb)
        return ra - rb;
    return new Date(a.futureTime).getTime() - new Date(b.futureTime).getTime();
};
/** times -> “分”表記に統一（HT/第一ハーフ/前半/後半などは原文表示） */
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
export default function TeamDetail() {
    const params = useParams();
    const navigate = useNavigate();
    const countryParam = params.country ?? "";
    const leagueParam = params.league ?? "";
    const teamSlug = params.team ?? params.teams ?? "";
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
    // 相手チーム選択（相関/統計用）
    const [opponent, setOpponent] = useState("");
    // ========== Queries ==========
    const detailQ = useQuery({
        queryKey: ["team-detail", countryLabel, leagueLabel, teamSlug],
        queryFn: () => fetchTeamDetail(countryLabel, leagueLabel, teamSlug),
        enabled: !!countryLabel && !!leagueLabel && !!teamSlug,
        staleTime: 10000,
    });
    const corrQ = useQuery({
        queryKey: ["team-correlations", countryLabel, leagueLabel, teamSlug, opponent],
        queryFn: () => fetchTeamCorrelations(countryLabel, leagueLabel, teamSlug, opponent || undefined),
        enabled: !!countryLabel && !!leagueLabel && !!teamSlug,
        staleTime: 10000,
    });
    const statsQ = useQuery({
        queryKey: ["team-stats", countryLabel, leagueLabel, teamSlug],
        queryFn: () => fetchTeamFeatureStats(countryLabel, leagueLabel, teamSlug),
        enabled: !!countryLabel && !!leagueLabel && !!teamSlug,
        staleTime: 10000,
    });
    // 試合予定（future.ts が返す SCHEDULED）
    const futureQ = useQuery({
        queryKey: ["future-matches", countryLabel, leagueLabel, teamSlug],
        queryFn: () => fetchFutureMatches(teamSlug, { country: countryLabel, league: leagueLabel }),
        enabled: !!countryLabel && !!leagueLabel && !!teamSlug,
        staleTime: 30000,
    });
    // 当日ヒット（LIVE/FINISHED のみ）
    const gameQ = useQuery({
        queryKey: ["game-matches", countryLabel, leagueLabel, teamSlug],
        queryFn: () => fetchTeamGames(teamSlug, { country: countryLabel, league: leagueLabel }),
        enabled: !!countryLabel && !!leagueLabel && !!teamSlug,
        staleTime: 30000,
    });
    // 選手
    const playersQ = useQuery({
        queryKey: ["team-players", countryLabel, leagueLabel, teamSlug],
        queryFn: () => fetchTeamPlayers(teamSlug, { country: countryLabel, league: leagueLabel }),
        enabled: !!countryLabel && !!leagueLabel && !!teamSlug,
        staleTime: 60000,
    });
    // 月次サマリ（合算のみ）
    const monthlyQ = useQuery({
        queryKey: ["team-monthly", countryLabel, leagueLabel, teamSlug],
        queryFn: () => fetchMonthlyOverview(countryLabel, leagueLabel, teamSlug),
        enabled: !!countryLabel && !!leagueLabel && !!teamSlug,
        staleTime: 60000,
    });
    // 順位変動
    const rankHistoryQ = useQuery({
        queryKey: ["rank-history", countryLabel, leagueLabel],
        queryFn: () => fetchRankHistory(countryLabel, leagueLabel),
        enabled: !!countryLabel && !!leagueLabel,
        staleTime: 60000,
    });
    const rankHistoryForTeam = useMemo(() => {
        if (!rankHistoryQ.data || !detailQ.data)
            return [];
        const teamName = detailQ.data.name;
        return rankHistoryQ.data.items
            .filter((x) => x.team === teamName)
            .sort((a, b) => a.match - b.match)
            .map((x) => ({
            match: x.match,
            rank: x.rank,
            label: `${x.match}節`,
        }));
    }, [rankHistoryQ.data, detailQ.data]);
    // 単系列メトリクスの選択肢（合算）
    const SINGLE_OPTIONS = {
        winningPoints: { label: "勝点" },
        goalsFor: { label: "得点" },
        cleanSheets: { label: "クリーンシート" },
        games: { label: "試合数" },
    };
    const [singleMetric, setSingleMetric] = useState("winningPoints");
    // ========== Utils ==========
    const posOrder = (p) => {
        switch (p) {
            case "ゴールキーパー":
                return 1;
            case "ディフェンダー":
                return 2;
            case "ミッドフィルダー":
                return 3;
            case "フォワード":
                return 4;
            default:
                return 9;
        }
    };
    const groupedPlayers = useMemo(() => {
        const list = (playersQ.data ?? []).slice().sort((a, b) => {
            const po = posOrder(a.position) - posOrder(b.position);
            if (po !== 0)
                return po;
            const ja = a.jersey ?? 9999;
            const jb = b.jersey ?? 9999;
            if (ja !== jb)
                return ja - jb;
            return a.name.localeCompare(b.name, "ja");
        });
        const groups = {};
        for (const p of list) {
            const key = p.position || "その他";
            (groups[key] || (groups[key] = [])).push(p);
        }
        return groups;
    }, [playersQ.data]);
    // 相手候補（相関）
    const opponentOptions = useMemo(() => (corrQ.data?.opponents ?? []), [corrQ.data]);
    // 相関のスケルトン遅延表示
    const [showCorrSkeleton, setShowCorrSkeleton] = useState(false);
    useEffect(() => {
        if (corrQ.isLoading) {
            const t = setTimeout(() => setShowCorrSkeleton(true), 300);
            return () => clearTimeout(t);
        }
        setShowCorrSkeleton(false);
    }, [corrQ.isLoading]);
    const isCorrEmpty = useMemo(() => {
        const d = corrQ.data?.correlations;
        if (!d)
            return false;
        const sum = (d.HOME?.["1st"]?.length ?? 0) + (d.HOME?.["2nd"]?.length ?? 0) + (d.HOME?.ALL?.length ?? 0) + (d.AWAY?.["1st"]?.length ?? 0) + (d.AWAY?.["2nd"]?.length ?? 0) + (d.AWAY?.ALL?.length ?? 0);
        return sum === 0;
    }, [corrQ.data]);
    const sortByRoundAndTime = (a, b) => {
        const ra = a.round_no ?? Number.POSITIVE_INFINITY;
        const rb = b.round_no ?? Number.POSITIVE_INFINITY;
        if (ra !== rb)
            return ra - rb;
        return new Date(a.future_time).getTime() - new Date(b.future_time).getTime();
    };
    // 当日・予定
    const liveSorted = useMemo(() => (gameQ.data?.live ?? []).slice().sort(sortLive), [gameQ.data]);
    const finishedSorted = useMemo(() => (gameQ.data?.finished ?? []).slice().sort(sortFinished), [gameQ.data]);
    const scheduledSorted = useMemo(() => (futureQ.data ?? []).slice().sort(sortScheduled), [futureQ.data]);
    const hasLiveToday = liveSorted.length > 0;
    const hasFinishedToday = !hasLiveToday && finishedSorted.length > 0;
    const hasFuture = (futureQ.data?.length ?? 0) > 0;
    const todaysTitle = hasLiveToday ? "開催中" : hasFinishedToday ? "試合終了" : null;
    const todaysMatches = hasLiveToday ? liveSorted : hasFinishedToday ? finishedSorted : [];
    // 戻るリンク/ヘッダ
    const toBack = `/${encodeURIComponent(countryLabel)}/${encodeURIComponent(leagueLabel)}`;
    const headerSubtitle = detailQ.data ? `${countryLabel} / ${leagueLabel} / ${detailQ.data.name}` : `${countryLabel} / ${leagueLabel}`;
    // 過去対戦履歴ページへの導線（params はエンコード済みをそのまま使う）
    const historyPath = `/${countryParam}/${leagueParam}/${teamSlug}/history`;
    return (_jsxs("div", { className: "min-h-screen bg-background", children: [_jsx(AppHeader, { title: "\u30C1\u30FC\u30E0\u8A73\u7D30", subtitle: headerSubtitle }), _jsxs("main", { className: "container mx-auto px-4 py-6 space-y-6", children: [_jsx("div", { className: "mb-2 flex items-center gap-3", children: _jsxs(Link, { to: toBack, className: "inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline", children: [_jsx(ArrowLeft, { className: "w-4 h-4" }), countryLabel, " / ", leagueLabel, " \u306B\u623B\u308B"] }) }), !teamSlug ? (_jsx("div", { className: "text-sm text-muted-foreground", children: "\u30C1\u30FC\u30E0\u304C\u6307\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002" })) : detailQ.isLoading ? (_jsxs("div", { className: "space-y-2", children: [_jsx(Skeleton, { className: "h-8 w-72" }), _jsx(Skeleton, { className: "h-4 w-64" })] })) : detailQ.isError ? (_jsx("div", { className: "text-destructive", children: "\u30C1\u30FC\u30E0\u60C5\u5831\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002" })) : detailQ.data ? (_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold", children: detailQ.data.name }), _jsxs("p", { className: "text-sm text-muted-foreground", children: ["\u82F1\u8A9E\u30B9\u30E9\u30C3\u30B0: ", _jsx("code", { children: detailQ.data.english })] })] })) : null, _jsxs(Tabs, { defaultValue: "stats", className: "w-full", children: [_jsxs(TabsList, { className: "mb-4", children: [_jsx(TabsTrigger, { value: "stats", children: "\u7D71\u8A08" }), _jsx(TabsTrigger, { value: "matches", children: "\u8A66\u5408" }), _jsx(TabsTrigger, { value: "players", children: "\u9078\u624B" }), _jsx(TabsTrigger, { value: "overview", children: "\u6708\u6B21\u30B5\u30DE\u30EA" }), _jsx(TabsTrigger, { value: "rank-history", children: "\u9806\u4F4D\u63A8\u79FB" })] }), _jsxs(TabsContent, { value: "stats", className: "space-y-3", children: [_jsxs("section", { children: [_jsx("h2", { className: "mb-2 text-xl font-bold", children: "\u76F8\u95A2\u4FC2\u6570\uFF08\u4E0A\u4F4D5\u4EF6\uFF09" }), showCorrSkeleton ? (_jsxs("div", { className: "space-y-2", children: [_jsx(Skeleton, { className: "h-8 w-40" }), _jsx(Skeleton, { className: "h-16 w-full" })] })) : corrQ.isError ? (_jsx("div", { className: "text-muted-foreground", children: "\u8868\u793A\u304C\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002" })) : corrQ.isLoading ? null : !corrQ.data || isCorrEmpty ? (_jsx("div", { className: "text-muted-foreground", children: "\u8868\u793A\u3059\u308B\u30C7\u30FC\u30BF\u304C\u3042\u308A\u307E\u305B\u3093\u3002" })) : (_jsx(CorrelationPanel, { data: corrQ.data.correlations, opponents: corrQ.data.opponents, opponent: opponent, onOpponentChange: setOpponent }))] }), _jsxs("section", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h2", { className: "text-xl font-bold", children: "\u30C1\u30FC\u30E0\u7D71\u8A08\uFF08\u8981\u7D04\uFF09" }), _jsxs("select", { value: opponent, onChange: (e) => setOpponent(e.target.value), className: "ml-auto rounded-md border px-2 py-1 text-sm bg-background", children: [_jsx("option", { value: "", children: "\u5168\u5BFE\u6226\u76F8\u624B" }), opponentOptions.map((o) => (_jsx("option", { value: o, children: o }, o)))] })] }), statsQ.isLoading ? (_jsxs("div", { className: "space-y-2", children: [_jsx(Skeleton, { className: "h-8 w-40" }), _jsx(Skeleton, { className: "h-16 w-full" })] })) : statsQ.isError ? (_jsx("div", { className: "text-muted-foreground", children: "\u7D71\u8A08\u30C7\u30FC\u30BF\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002" })) : !statsQ.data ? null : (_jsx(TeamFeaturePanel, { data: statsQ.data.stats }))] })] }), _jsxs(TabsContent, { value: "matches", className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-end gap-2", children: [_jsx(Link, { to: `/live`, onClick: (e) => e.stopPropagation(), className: "inline-flex items-center text-sm font-medium rounded-md border px-3 py-1.5 hover:bg-accent", children: "\u73FE\u5728\u958B\u50AC\u4E2D\u306E\u8A66\u5408 \u2192" }), _jsx(Link, { to: historyPath, onClick: (e) => e.stopPropagation(), className: "inline-flex items-center text-sm font-medium rounded-md border px-3 py-1.5 hover:bg-accent", children: "\u904E\u53BB\u306E\u5BFE\u6226\u5C65\u6B74\u3092\u898B\u308B \u2192" })] }), (() => {
                                        if (!todaysTitle)
                                            return null;
                                        return (_jsxs("section", { children: [_jsx("h3", { className: "mb-2 text-base font-semibold", children: todaysTitle }), _jsx("div", { className: "rounded-xl border bg-card p-4 shadow-sm", children: gameQ.isLoading ? (_jsx("div", { className: "text-sm text-muted-foreground", children: "\u8AAD\u307F\u8FBC\u307F\u4E2D..." })) : (_jsx("ul", { className: "divide-y", children: todaysMatches.map((it) => {
                                                            const clickable = it.latest_seq != null;
                                                            const latestSeq = it.latest_seq;
                                                            const detailPath = clickable ? `/${encodeURIComponent(countryLabel)}/${encodeURIComponent(leagueLabel)}/${encodeURIComponent(teamSlug)}/game/${latestSeq}` : "";
                                                            // 勝敗バッジ
                                                            const ResultBadge = () => {
                                                                if (it.status !== "FINISHED")
                                                                    return null;
                                                                if (it.homeScore == null || it.awayScore == null || !detailQ.data)
                                                                    return null;
                                                                const norm = (s) => s
                                                                    .replace(/[\u3000\u00A0]/g, " ")
                                                                    .replace(/\s+/g, " ")
                                                                    .trim()
                                                                    .toLowerCase();
                                                                const teamName = norm(detailQ.data.name);
                                                                const home = norm(it.homeTeam);
                                                                const away = norm(it.awayTeam);
                                                                const hs = Number(it.homeScore);
                                                                const as = Number(it.awayScore);
                                                                let label = "DRAW";
                                                                if (home === teamName)
                                                                    label = hs > as ? "WIN" : hs < as ? "LOSE" : "DRAW";
                                                                else if (away === teamName)
                                                                    label = as > hs ? "WIN" : as < hs ? "LOSE" : "DRAW";
                                                                const cls = label === "WIN" ? "bg-green-100 text-green-700" : label === "LOSE" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700";
                                                                return _jsx("span", { className: `inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${cls}`, children: label });
                                                            };
                                                            const RightPane = it.status === "FINISHED" && it.homeScore != null && it.awayScore != null ? (_jsxs("div", { className: "w-28 text-right shrink-0", children: [_jsxs("div", { className: "text-sm font-semibold tabular-nums", children: [it.homeScore, " ", _jsx("span", { className: "text-muted-foreground", children: "-" }), " ", it.awayScore] }), _jsx("div", { className: "mt-1", children: _jsx(ResultBadge, {}) })] })) : null;
                                                            return (_jsx("li", { className: "py-2", children: _jsxs("div", { role: "button", tabIndex: 0, className: `flex items-center gap-3 rounded-md px-2 py-2 transition ${clickable ? "hover:bg-accent/40 cursor-pointer" : "opacity-70 cursor-default"}`, onClick: () => clickable && navigate(detailPath), onKeyDown: (e) => {
                                                                        if (clickable && (e.key === "Enter" || e.key === " ")) {
                                                                            e.preventDefault();
                                                                            navigate(detailPath);
                                                                        }
                                                                    }, children: [_jsx("div", { className: "w-32 shrink-0 text-sm", children: it.roundNo != null ? _jsxs("span", { className: "font-bold", children: ["\u30E9\u30A6\u30F3\u30C9 ", it.roundNo] }) : _jsx("span", { className: "text-muted-foreground", children: "\u30E9\u30A6\u30F3\u30C9 -" }) }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "text-sm", children: [it.homeTeam, " vs ", it.awayTeam, it.status === "LIVE" && _jsx("span", { className: "ml-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] leading-none", children: "LIVE" })] }), _jsxs("div", { className: "text-xs text-muted-foreground", children: [formatTimesMinute(it.latest_times), it.link && (_jsxs(_Fragment, { children: [" ", "\u00B7", " ", _jsx("button", { type: "button", className: "underline", onClick: (e) => {
                                                                                                        e.stopPropagation();
                                                                                                        window.open(it.link, "_blank", "noopener,noreferrer");
                                                                                                    }, children: "\u5916\u90E8\u8A73\u7D30" })] }))] })] }), RightPane] }) }, it.seq));
                                                        }) })) })] }));
                                    })(), hasFuture && (_jsxs("section", { children: [_jsx("h3", { className: "mb-2 text-base font-semibold", children: "\u958B\u50AC\u4E88\u5B9A" }), _jsx("div", { className: "rounded-xl border bg-card p-4 shadow-sm", children: futureQ.isLoading ? (_jsx("div", { className: "text-sm text-muted-foreground", children: "\u8AAD\u307F\u8FBC\u307F\u4E2D..." })) : (_jsx("ul", { className: "divide-y", children: scheduledSorted.map((it) => {
                                                        const detailPath = `/${countryParam}/${leagueParam}/${teamSlug}/scheduled/${it.seq}`;
                                                        const ovPath = `/${countryParam}/${leagueParam}/${teamSlug}/overview/${it.seq}` + `?home=${encodeURIComponent(it.homeTeam)}&away=${encodeURIComponent(it.awayTeam)}`;
                                                        return (_jsx("li", { className: "py-2", children: _jsxs("div", { role: "button", tabIndex: 0, className: "flex items-center gap-3 rounded-md px-2 py-2 hover:bg-accent/40 transition cursor-pointer", onClick: () => navigate(detailPath), onKeyDown: (e) => {
                                                                    if (e.key === "Enter" || e.key === " ") {
                                                                        e.preventDefault();
                                                                        navigate(detailPath);
                                                                    }
                                                                }, children: [_jsx("div", { className: "w-32 shrink-0 text-sm", children: it.roundNo != null ? _jsxs("span", { className: "font-bold", children: ["\u30E9\u30A6\u30F3\u30C9 ", it.roundNo] }) : _jsx("span", { className: "text-muted-foreground", children: "\u30E9\u30A6\u30F3\u30C9 -" }) }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "text-sm", children: [it.homeTeam, " vs ", it.awayTeam] }), _jsxs("div", { className: "text-xs text-muted-foreground", children: [new Date(it.futureTime).toLocaleString("ja-JP"), _jsx("span", { children: " \u00B7 " }), _jsx(Link, { to: ovPath, onClick: (e) => e.stopPropagation(), className: "underline", children: "\u5206\u6790\u3092\u898B\u308B" }), it.link && (_jsxs(_Fragment, { children: [" ", "&middot", " ", _jsx("button", { type: "button", className: "underline", onClick: (e) => {
                                                                                                    e.stopPropagation();
                                                                                                    window.open(it.link, "_blank", "noopener,noreferrer");
                                                                                                }, children: "\u5916\u90E8\u8A73\u7D30" })] }))] })] })] }) }, it.seq));
                                                    }) })) })] }))] }), _jsx(TabsContent, { value: "players", children: _jsx("section", { className: "space-y-6", children: playersQ.isLoading ? (_jsxs("div", { className: "space-y-2", children: [_jsx(Skeleton, { className: "h-6 w-40" }), _jsx(Skeleton, { className: "h-24 w-full" }), _jsx(Skeleton, { className: "h-24 w-full" })] })) : playersQ.isError ? (_jsx("div", { className: "rounded-xl border bg-card p-6 shadow-sm text-sm text-destructive", children: "\u9078\u624B\u30C7\u30FC\u30BF\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002" })) : !playersQ.data || playersQ.data.length === 0 ? (_jsx("div", { className: "rounded-xl border bg-card p-6 shadow-sm text-sm text-muted-foreground", children: "\u9078\u624B\u30C7\u30FC\u30BF\u304C\u3042\u308A\u307E\u305B\u3093\u3002" })) : (Object.entries(groupedPlayers).map(([pos, members]) => (_jsxs("div", { className: "rounded-xl border bg-card p-4 shadow-sm", children: [_jsx("h3", { className: "mb-3 text-base font-semibold", children: pos }), _jsx("ul", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3", children: members.map((m) => (_jsxs("li", { className: "flex items-center gap-3 rounded-lg border p-3", children: [_jsx("div", { className: "w-14 h-14 rounded-md overflow-hidden bg-muted shrink-0", children: m.face ? _jsx("img", { src: m.face, alt: m.name, className: "w-full h-full object-cover" }) : null }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [m.jersey != null && _jsxs("span", { className: "inline-flex items-center justify-center rounded-md border text-xs px-1.5 py-0.5", children: ["#", m.jersey] }), _jsx("span", { className: "font-medium truncate", children: m.name })] }), _jsxs("div", { className: "mt-1 text-xs text-muted-foreground space-x-2", children: [m.age != null && _jsxs("span", { children: [m.age, "\u6B73"] }), m.height && _jsx("span", { children: m.height }), m.weight && _jsx("span", { children: m.weight }), m.market_value && _jsxs("span", { children: ["\u5E02\u5834\u4FA1\u5024: ", m.market_value] })] }), _jsxs("div", { className: "mt-1 text-[11px] text-muted-foreground space-x-2", children: [m.loan_belong && _jsxs("span", { children: ["\u30EC\u30F3\u30BF\u30EB\u5143: ", m.loan_belong] }), m.injury && _jsxs("span", { children: ["\u8CA0\u50B7: ", m.injury] }), m.contract_until && _jsxs("span", { children: ["\u5951\u7D04: ", m.contract_until, " \u307E\u3067"] })] })] })] }, m.id))) })] }, pos)))) }) }), _jsxs(TabsContent, { value: "overview", className: "space-y-6", children: [_jsxs("section", { className: "rounded-xl border bg-card p-4 shadow-sm", children: [_jsx("h3", { className: "mb-3 text-base font-semibold", children: "\u9806\u4F4D\u306E\u6708\u6B21\u63A8\u79FB" }), monthlyQ.isLoading ? (_jsx(Skeleton, { className: "h-40 w-full" })) : monthlyQ.isError ? (_jsx("div", { className: "text-muted-foreground text-sm", children: "\u30C7\u30FC\u30BF\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002" })) : !monthlyQ.data || monthlyQ.data.items.length === 0 ? (_jsx("div", { className: "text-muted-foreground text-sm", children: "\u8868\u793A\u3059\u308B\u30C7\u30FC\u30BF\u304C\u3042\u308A\u307E\u305B\u3093\u3002" })) : (_jsx("div", { className: "h-64", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: monthlyQ.data.items, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "label" }), _jsx(YAxis, { allowDecimals: false, reversed: true }), " ", _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Line, { type: "monotone", dataKey: "rank", name: "\u9806\u4F4D", dot: true })] }) }) }))] }), _jsxs("section", { className: "rounded-xl border bg-card p-4 shadow-sm space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h3", { className: "text-base font-semibold", children: "\u6708\u6B21\u30E1\u30C8\u30EA\u30AF\u30B9" }), _jsx("select", { value: singleMetric, onChange: (e) => setSingleMetric(e.target.value), className: "ml-auto rounded-md border px-2 py-1 text-sm bg-background", children: Object.entries(SINGLE_OPTIONS).map(([k, v]) => (_jsx("option", { value: k, children: v.label }, k))) })] }), monthlyQ.isLoading ? (_jsx(Skeleton, { className: "h-40 w-full" })) : monthlyQ.isError ? (_jsx("div", { className: "text-muted-foreground text-sm", children: "\u30C7\u30FC\u30BF\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002" })) : !monthlyQ.data || monthlyQ.data.items.length === 0 ? (_jsx("div", { className: "text-muted-foreground text-sm", children: "\u8868\u793A\u3059\u308B\u30C7\u30FC\u30BF\u304C\u3042\u308A\u307E\u305B\u3093\u3002" })) : (_jsx("div", { className: "h-64", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: monthlyQ.data.items, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "label" }), _jsx(YAxis, { allowDecimals: false }), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Bar, { dataKey: singleMetric, name: SINGLE_OPTIONS[singleMetric].label })] }) }) }))] }), _jsxs("section", { className: "rounded-xl border bg-card p-4 shadow-sm", children: [_jsx("h3", { className: "mb-3 text-base font-semibold", children: "\u52DD\u30FB\u5206\u30FB\u8CA0\uFF08\u6708\uFF09" }), monthlyQ.isLoading ? (_jsx(Skeleton, { className: "h-40 w-full" })) : monthlyQ.isError ? (_jsx("div", { className: "text-muted-foreground text-sm", children: "\u30C7\u30FC\u30BF\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002" })) : !monthlyQ.data || monthlyQ.data.items.length === 0 ? (_jsx("div", { className: "text-muted-foreground text-sm", children: "\u8868\u793A\u3059\u308B\u30C7\u30FC\u30BF\u304C\u3042\u308A\u307E\u305B\u3093\u3002" })) : (_jsx("div", { className: "h-64", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: monthlyQ.data.items, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "label" }), _jsx(YAxis, { allowDecimals: false }), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Bar, { dataKey: "win", name: "\u52DD" }), _jsx(Bar, { dataKey: "draw", name: "\u5206" }), _jsx(Bar, { dataKey: "lose", name: "\u8CA0" })] }) }) }))] })] }), _jsx(TabsContent, { value: "rank-history", className: "space-y-6", children: _jsxs("section", { className: "rounded-xl border bg-card p-4 shadow-sm", children: [_jsx("h3", { className: "mb-3 text-base font-semibold", children: "\u9806\u4F4D\u5909\u52D5\uFF08\u7BC0\u3054\u3068\uFF09" }), rankHistoryQ.isLoading ? (_jsx(Skeleton, { className: "h-40 w-full" })) : rankHistoryQ.isError ? (_jsx("div", { className: "text-muted-foreground text-sm", children: "\u9806\u4F4D\u5C65\u6B74\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002" })) : !rankHistoryForTeam || rankHistoryForTeam.length === 0 ? (_jsx("div", { className: "text-muted-foreground text-sm", children: "\u8868\u793A\u3059\u308B\u30C7\u30FC\u30BF\u304C\u3042\u308A\u307E\u305B\u3093\u3002" })) : (_jsx("div", { className: "h-64", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: rankHistoryForTeam, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "label" }), _jsx(YAxis, { allowDecimals: false, reversed: true }), " ", _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Line, { type: "monotone", dataKey: "rank", name: "\u9806\u4F4D", dot: true })] }) }) }))] }) })] })] })] }));
}
