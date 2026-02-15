import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import ForgetPasswordPage from "./pages/auth/ForgetPasswordPage";
import SignupPage from "./pages/auth/SignUpPage";
import Dashboard from "./pages/personal/top/Dashboard";
import LeagueMenuPage from "./pages/humberger/LeagueMenuPage";
import FavoritePage from "./pages/personal/favorite/FavoritePage";
import TeamPage from "./pages/personal/teams/TeamPage";

import AdminLayout from "./pages/admin/AdminLayout";
import PersonalLayout from "./pages/personal/PersonalLayout";
import ManualScrapePage from "./pages/admin/scrape/ManualScrapePage";
import S3FileCountPage from "./pages/admin/s3/S3FileCountPage";
import CountryLeagueForceAdminPage from "./pages/admin/force/CountryLeagueForceAdminPage";
import NoticeAdminPage from "./pages/admin/notice/NoticeAdminPage";
import DataFetchAdminPage from "./pages/admin/fetch/DataFetchAdminPage";
import ManualDataTargetPage from "./pages/admin/target/ManualDataTargetPage";
import ManualDataConsolePage from "./pages/admin/register/data/ManualDataConsolePage";
import ManualDataDefectPage from "./pages/admin/defect/ManualDataDefectPage";
import TeamColorPage from "./pages/admin/color/TeamColorPage";

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

          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgetPasswordPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/soccer/:countrySlug/:leagueSlug" element={<LeagueMenuPage />} />

          <Route path="admin" element={<AdminLayout />}>
            <Route path="force/update" element={<CountryLeagueForceAdminPage />} />
            <Route path="scrape/manual" element={<ManualScrapePage />} />
            <Route path="s3/fileCount" element={<S3FileCountPage />} />
            <Route path="notices" element={<NoticeAdminPage />} />
            <Route path="data/fetch" element={<DataFetchAdminPage />} />
            <Route path="manual/data/target" element={<ManualDataTargetPage />} />
            <Route path="manual/data/register" element={<ManualDataConsolePage />} />
            <Route path="manual/data/defect" element={<ManualDataDefectPage />} />
            <Route path="manual/teamColor" element={<TeamColorPage />} />
          </Route>

          <Route path="/top" element={<Dashboard />} />

          <Route path="*" element={<div style={{ padding: 40 }}>NO ROUTE MATCHED</div>} />
        </Routes>
      </div>
    </>
  );
}
