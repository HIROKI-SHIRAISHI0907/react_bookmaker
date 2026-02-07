import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/personal/top/Dashboard";
import RequireAuth from "./pages/auth/RequireAuth";
import LeagueMenu from "./pages/humberger/LeagueMenu";
import FavoritePage from "./pages/personal/favorite/FavoritePage";

import AdminLayout from "./pages/admin/AdminLayout";
import PersonalLayout from "./pages/personal/PersonalLayout";
import ManualScrapePage from "./pages/admin/scrape/ManualScrapePage";
import S3FileCountPage from "./pages/admin/s3/S3FileCountPage";
import CountryLeagueForceAdminPage from "./pages/admin/force/CountryLeagueForceAdminPage";

function WhereAmI() {
  const loc = useLocation();
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 99999, background: "rgba(255,0,0,.9)", color: "#fff", padding: 8, fontFamily: "monospace" }}>pathname: {loc.pathname}</div>
  );
}

export default function App() {
  return (
    <>
      <WhereAmI />
      <div style={{ paddingTop: 40 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/top" replace />} />

          <Route path="/" element={<PersonalLayout />}>
            <Route path="favorite" element={<FavoritePage />} />
          </Route>

          <Route path="/login" element={<Login />} />
          <Route path="/:country/:league" element={<LeagueMenu />} />

          <Route path="admin" element={<AdminLayout />}>
            <Route path="force/update" element={<CountryLeagueForceAdminPage />} />
            <Route path="scrape/manual" element={<ManualScrapePage />} />
            <Route path="s3/fileCount" element={<S3FileCountPage />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route path="/top" element={<Dashboard />} />
          </Route>

          <Route path="*" element={<div style={{ padding: 40 }}>NO ROUTE MATCHED</div>} />
        </Routes>
      </div>
    </>
  );
}
