import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/top/Dashboard";
import RequireAuth from "./pages/auth/RequireAuth";
import LeagueMenu from "./pages/humberger/LeagueMenu";
import FavoritePage from "./pages/favorite/FavoritePage";

function WhereAmI() {
  const loc = useLocation();
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        background: "rgba(255,0,0,.9)",
        color: "#fff",
        padding: 8,
        fontFamily: "monospace",
      }}
    >
      pathname: {loc.pathname}
    </div>
  );
}

export default function App() {
  return (
    <>
      <WhereAmI />
      <div style={{ paddingTop: 40 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/top" replace />} />

          {/* 末尾スラッシュにも対応 */}
          <Route path="/favorite" element={<FavoritePage />} />
          <Route path="/favorite/*" element={<FavoritePage />} />

          <Route path="/login" element={<Login />} />
          <Route path="/:country/:league" element={<LeagueMenu />} />

          <Route element={<RequireAuth />}>
            <Route path="/top" element={<Dashboard />} />
          </Route>

          {/* デバッグ中はリダイレクトしない */}
          <Route path="*" element={<div style={{ padding: 40 }}>NO ROUTE MATCHED</div>} />
        </Routes>
      </div>
    </>
  );
}
