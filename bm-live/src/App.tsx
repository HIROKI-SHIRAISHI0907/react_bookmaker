import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import Login from "./pages/auth/Login";
import Protected from "./routes/Protected";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/top/Dashboard";
import RequireAuth from "./pages/auth/RequireAuth";

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
