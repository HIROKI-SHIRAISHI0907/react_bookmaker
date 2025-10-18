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
import GameDetail from "./pages/teams/GameDetail";
import LiveNow from "./pages/teams/LiveNow";
import ScheduledDetail from "./pages/teams/OverviewDetail";
import RankingPage from "./pages/ranking/Ranking";

export default function App() {
  return (
    <Routes>
      {/* 公開ページ */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* パラメタ付きページ */}
      <Route path="/live" element={<LiveNow />} />
      <Route path="/:country/:league" element={<LeagueTeams />} />

      {/* ★ live は team よりも前に置く（順番重要！）liveがteam扱いになってしまう */}
      <Route path="/:country/:league/live" element={<LiveNow />} />

      <Route path="/:country/:league/:team" element={<TeamDetail />} />

      <Route path="/:country/:league/:team/history" element={<History />} />

      <Route path="/:country/:league/:team/history/:seq" element={<HistoryDetail />} />

      <Route path="/:country/:league/:team/game/:seq" element={<GameDetail />} />

      <Route path="/:country/:league/:team/scheduled/:seq" element={<ScheduledDetail />} />

      <Route path="/ranking/:country/:league" element={<RankingPage />} />

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
