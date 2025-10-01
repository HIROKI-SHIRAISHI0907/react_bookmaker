// frontend/src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/top/Dashboard";
import RequireAuth from "./pages/auth/RequireAuth";
import LeagueMenu from "./pages/humberger/LeagueMenu";

export default function App() {
  return (
    <Routes>
      {/* ルートアクセスは /top に飛ばす */}
      <Route path="/" element={<Navigate to="/top" replace />} />

      {/* 公開ページ */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* パラメタ付きページ */}
      <Route path="/:country/:league" element={<LeagueMenu />} />

      {/* 認証保護ページ */}
      {/* <Route element={<RequireAuth />}>*/}
        <Route path="/top" element={<Dashboard />} />
      {/* </Route>*/}

      {/* フォールバック */}
      <Route path="*" element={<Navigate to="/top" replace />} />
    </Routes>
  );
}
