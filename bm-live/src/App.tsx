import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/top/Dashboard";
import RequireAuth from "./pages/auth/RequireAuth";
import LeagueMenu from "./pages/humberger/LeagueMenu";

function WhereAmI() {
  const loc = useLocation();
  return <div style={{ padding: 8, background: "#eee", fontFamily: "monospace" }}>pathname: {loc.pathname}</div>;
}

function Home() {
  return (
    <div>
      <WhereAmI />
      <h1>Home（ログイン済みのみ）</h1>
      <Link to="/login">ログインに戻る</Link>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/:country/:league" element={<LeagueMenu />} />

      <Route path="/" element={<Navigate to="/top" replace />} />
      <Route path="/login" element={<Login />} />

      {/* 保護ルート配下に /top を配置 */}
      <Route element={<RequireAuth />}>
        <Route path="/top" element={<Dashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/top" replace />} />
    </Routes>
  );
}
