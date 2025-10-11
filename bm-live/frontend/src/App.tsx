// frontend/src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/top/Dashboard";
import RequireAuth from "./pages/auth/RequireAuth";
import LeagueMenu from "./pages/humberger/LeagueMenu";
import LeagueTeams from "./pages/teams/Team";
import TeamDetail from "./pages/teams/TeamDetail";
import History from "./pages/teams/History";
import HistoryDetail from "./pages/teams/HistoryDetail";

export default function App() {
  return (
    <Routes>
      {/* 公開ページ */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* パラメタ付きページ */}
      <Route path="/:country/:league" element={<LeagueTeams />} />

      <Route path="/:country/:league/:team" element={<TeamDetail />} />

      <Route path="/:country/:league/:team/history" element={<History />} />

      <Route path="/:country/:league/:team/history/:seq" element={<HistoryDetail />} />

      {/* 認証保護ページ */}
      {/* <Route element={<RequireAuth />}>*/}
      <Route path="/top" element={<Dashboard />} />
      {/* </Route>*/}

      {/* ルートアクセスは /top に飛ばす */}
      <Route path="/" element={<Navigate to="/top" replace />} />

      {/* フォールバック */}
      <Route path="*" element={<Navigate to="/top" replace />} />
    </Routes>
  );
}
