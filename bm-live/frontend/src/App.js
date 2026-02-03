import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// frontend/src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/top/Dashboard";
import LeagueTeams from "./pages/teams/Team";
import TeamDetail from "./pages/teams/TeamDetail";
import History from "./pages/teams/History";
import HistoryDetail from "./pages/teams/HistoryDetail";
import GameDetail from "./pages/teams/GameDetail";
import LiveNow from "./pages/teams/LiveNow";
import OverviewDetail from "./pages/teams/OverviewDetail";
import RankingPage from "./pages/ranking/Ranking";
export default function App() {
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsx(Route, { path: "/register", element: _jsx(Register, {}) }), _jsx(Route, { path: "/live", element: _jsx(LiveNow, {}) }), _jsx(Route, { path: "/:country/:league", element: _jsx(LeagueTeams, {}) }), _jsx(Route, { path: "/:country/:league/live", element: _jsx(LiveNow, {}) }), _jsx(Route, { path: "/:country/:league/:team", element: _jsx(TeamDetail, {}) }), _jsx(Route, { path: "/:country/:league/:team/overview/:seq", element: _jsx(OverviewDetail, {}) }), _jsx(Route, { path: "/:country/:league/:team/history", element: _jsx(History, {}) }), _jsx(Route, { path: "/:country/:league/:team/history/:seq", element: _jsx(HistoryDetail, {}) }), _jsx(Route, { path: "/:country/:league/:team/game/:seq", element: _jsx(GameDetail, {}) }), _jsx(Route, { path: "/ranking/:country/:league", element: _jsx(RankingPage, {}) }), _jsx(Route, { path: "/top", element: _jsx(Dashboard, {}) }), _jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/top", replace: true }) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/top", replace: true }) })] }));
}
