import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import AppHeader from "../../../components/layout/AppHeader";
import { Skeleton } from "../../../components/ui/skeleton";
import { fetchLeagueStanding } from "../../../api/standings";
export default function RankingPage() {
  const { country = "", league = "" } = useParams();
  const countryRaw = decodeURIComponent(country);
  const leagueRaw = decodeURIComponent(league);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["league-standing", countryRaw, leagueRaw],
    queryFn: () => fetchLeagueStanding(countryRaw, leagueRaw),
    staleTime: 60000,
  });
  return _jsxs("div", {
    className: "min-h-screen bg-background",
    children: [
      _jsx(AppHeader, { title: "\u9806\u4F4D\u8868", subtitle: `${countryRaw} / ${leagueRaw}` }),
      _jsxs("main", {
        className: "container mx-auto px-4 py-6",
        children: [
          _jsxs("div", {
            className: "mb-4 flex items-center gap-3",
            children: [
              _jsxs("div", {
                className: "flex-1",
                children: [
                  _jsxs("h1", { className: "text-2xl font-bold", children: [countryRaw, " / ", leagueRaw] }),
                  _jsx("p", { className: "text-muted-foreground text-sm", children: "Standings" }),
                ],
              }),
              _jsx(Link, {
                to: `/live`,
                className: "inline-flex items-center text-sm font-medium rounded-md border px-3 py-1.5 hover:bg-accent",
                children: "\u73FE\u5728\u958B\u50AC\u4E2D\u306E\u8A66\u5408 \u2192",
              }),
              _jsx(Link, {
                to: `/${country}/${league}`,
                className: "inline-flex items-center text-sm font-medium rounded-md border px-3 py-1.5 hover:bg-accent",
                children: "\u30C1\u30FC\u30E0\u4E00\u89A7\u3078 \u2192",
              }),
            ],
          }),
          isError && _jsx("div", { className: "text-destructive", children: "\u30C7\u30FC\u30BF\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }),
          isLoading &&
            _jsxs("div", {
              className: "border rounded-md",
              children: [
                _jsxs("div", {
                  className: "grid grid-cols-13 gap-2 p-3 border-b text-xs sm:text-sm font-medium text-muted-foreground",
                  children: [
                    _jsx("div", { className: "col-span-1", children: "#" }),
                    _jsx("div", { className: "col-span-6", children: "\u30C1\u30FC\u30E0" }),
                    _jsx("div", { className: "col-span-1 text-right", children: "\u8A66\u5408" }),
                    _jsx("div", { className: "col-span-1 text-right", children: "\u52DD" }),
                    _jsx("div", { className: "col-span-1 text-right", children: "\u5206" }),
                    _jsx("div", { className: "col-span-1 text-right", children: "\u8CA0" }),
                    _jsx("div", { className: "col-span-1 text-right", children: "\u52DD\u70B9" }),
                    _jsx("div", { className: "col-span-1 text-right", children: "\u5F97\u5931" }),
                  ],
                }),
                Array.from({ length: 10 }).map((_, i) =>
                  _jsxs(
                    "div",
                    {
                      className: "grid grid-cols-13 gap-2 p-3 border-b",
                      children: [
                        _jsx("div", { className: "col-span-1", children: _jsx(Skeleton, { className: "h-4 w-6" }) }),
                        _jsx("div", { className: "col-span-6", children: _jsx(Skeleton, { className: "h-4 w-40" }) }),
                        _jsx("div", { className: "col-span-1", children: _jsx(Skeleton, { className: "h-4 w-10 ml-auto" }) }),
                        _jsx("div", { className: "col-span-1", children: _jsx(Skeleton, { className: "h-4 w-8 ml-auto" }) }),
                        _jsx("div", { className: "col-span-1", children: _jsx(Skeleton, { className: "h-4 w-8 ml-auto" }) }),
                        _jsx("div", { className: "col-span-1", children: _jsx(Skeleton, { className: "h-4 w-8 ml-auto" }) }),
                        _jsx("div", { className: "col-span-1", children: _jsx(Skeleton, { className: "h-4 w-10 ml-auto" }) }),
                        _jsx("div", { className: "col-span-1", children: _jsx(Skeleton, { className: "h-4 w-10 ml-auto" }) }),
                      ],
                    },
                    i,
                  ),
                ),
              ],
            }),
          data &&
            (data.rows.length === 0
              ? _jsx("div", { className: "text-muted-foreground", children: "\u8868\u793A\u3059\u308B\u9806\u4F4D\u8868\u304C\u3042\u308A\u307E\u305B\u3093\u3002" })
              : _jsxs("div", {
                  className: "border rounded-md overflow-hidden",
                  children: [
                    _jsxs("div", {
                      className: "grid grid-cols-13 gap-2 p-3 border-b text-xs sm:text-sm font-medium text-muted-foreground bg-muted/40",
                      children: [
                        _jsx("div", { className: "col-span-1", children: "#" }),
                        _jsx("div", { className: "col-span-6", children: "\u30C1\u30FC\u30E0" }),
                        _jsx("div", { className: "col-span-1 text-right tabular-nums", children: "\u8A66\u5408" }),
                        _jsx("div", { className: "col-span-1 text-right tabular-nums", children: "\u52DD" }),
                        _jsx("div", { className: "col-span-1 text-right tabular-nums", children: "\u5206" }),
                        _jsx("div", { className: "col-span-1 text-right tabular-nums", children: "\u8CA0" }),
                        _jsx("div", { className: "col-span-1 text-right tabular-nums", children: "\u52DD\u70B9" }),
                        _jsx("div", { className: "col-span-1 text-right tabular-nums", children: "\u5F97\u5931" }),
                      ],
                    }),
                    data.rows.map((r) => {
                      const teamRoute = `/${country}/${league}/${encodeURIComponent(r.teamEnglish)}`;
                      const posColor = r.position <= 4 ? "text-emerald-600" : r.position <= 6 ? "text-blue-600" : r.position >= data.rows.length - 2 ? "text-destructive" : "";
                      return _jsxs(
                        "div",
                        {
                          className: "grid grid-cols-13 gap-2 p-3 border-b hover:bg-accent/40 transition-colors",
                          children: [
                            _jsx("div", { className: `col-span-1 font-semibold ${posColor}`, children: r.position }),
                            _jsx("div", { className: "col-span-6", children: _jsx(Link, { to: teamRoute, className: "font-medium hover:underline", children: r.teamName }) }),
                            _jsx("div", { className: "col-span-1 text-right tabular-nums", children: r.game }),
                            _jsx("div", { className: "col-span-1 text-right tabular-nums", children: r.win }),
                            _jsx("div", { className: "col-span-1 text-right tabular-nums", children: r.draw }),
                            _jsx("div", { className: "col-span-1 text-right tabular-nums", children: r.lose }),
                            _jsx("div", { className: "col-span-1 text-right font-semibold tabular-nums", children: r.winningPoints }),
                            _jsx("div", { className: "col-span-1 text-right font-semibold tabular-nums", children: r.goalDiff }),
                          ],
                        },
                        `${r.position}-${r.teamEnglish}`,
                      );
                    }),
                    _jsxs("div", {
                      className: "p-3 text-xs text-muted-foreground",
                      children: [data.updatedAt ? `更新: ${new Date(data.updatedAt).toLocaleString()}` : null, data.season ? ` / シーズン: ${data.season}` : null],
                    }),
                  ],
                })),
        ],
      }),
    ],
  });
}
