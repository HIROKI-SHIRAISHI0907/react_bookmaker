import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import ForgetPasswordPage from "./pages/auth/ForgetPasswordPage";
import SignupPage from "./pages/auth/SignUpPage";
import Dashboard from "./pages/personal/top/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import TopRedirectByRole from "./components/TopRedirectByRole";
import LeagueMenuPage from "./pages/humberger/LeagueMenuPage";
import FavoritePage from "./pages/personal/favorite/FavoritePage";
import TeamDetailPage from "./pages/personal/teams/TeamDetailPage";
import GameDetailPage from "./pages/personal/teams/GameDetailPage";
import AdminLayout from "./pages/admin/AdminLayout";
import ManualScrapePage from "./pages/admin/scrape/ManualScrapePage";
import S3FileCountPage from "./pages/admin/s3/S3FileCountPage";
import CountryLeagueForceAdminPage from "./pages/admin/force/CountryLeagueForceAdminPage";
import NoticeAdminPage from "./pages/admin/notice/NoticeAdminPage";
import DataFetchAdminPage from "./pages/admin/fetch/DataFetchAdminPage";
import ManualDataTargetPage from "./pages/admin/target/ManualDataTargetPage";
import ManualDataConsolePage from "./pages/admin/register/data/ManualDataConsolePage";
import ManualDataDefectPage from "./pages/admin/defect/ManualDataDefectPage";
import TeamColorPage from "./pages/admin/color/TeamColorPage";
import IngestedDataReferencePage from "./pages/admin/ingest/IngestedDataReferencePage";
import AdminSubInputPage from "./pages/admin/csvSelect/AdminSubInputPage";
import SubLeagueManualUpdatePage from "./pages/admin/subLeague/SubLeagueManualUpdatePage";
import PointSettingsPage from "./pages/admin/pointSetting/PointSettingsPage";
import TodayCreatedCsvPage from "./pages/admin/csv/TodayCreatedCsvPage";
import AdminUserPage from "./pages/admin/user/AdminUserPage";
import MatchDataByDatePage from "./pages/admin/matches/MatchDataByDatePage";
import DbConnectionPage from "./pages/admin/db/DbConnectionPage";
import CountryLeagueSeasonMasterReferencePage from "./pages/admin/master/CountryLeagueSeasonMasterReferencePage";
import CountryLeagueMasterReferencePage from "./pages/admin/master/CountryLeagueMasterReferencePage";
import NoEcsSlotsPage from "./pages/admin/noecs/NoEcsSlotsPage";
import FutureMatchesByDatePage from "./pages/admin/future/FutureMatchesByDatePage";
import RealTimeDataAdminPage from "./pages/admin/realtimedatacategory/RealTimeDataAdminPage";
import MailInfoListPage from "./pages/admin/mail/MailInfoList";
import MailInfoRegisterPage from "./pages/admin/mail/MailRegisterFormPage";
import MailInfoUpdatePage from "./pages/admin/mail/MailUpdateFormPage";

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

          {/* 公開ページ */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgetPasswordPage />} />
          <Route path="/signup" element={<SignupPage />} />

          <Route
            path="/top"
            element={
              <TopRedirectByRole>
                <Dashboard />
              </TopRedirectByRole>
            }
          />

          <Route path="/dashboard" element={<Navigate to="/top" replace />} />
          <Route path="/soccer/:countrySlug/:leagueSlug" element={<LeagueMenuPage />} />

          {/* 一般ユーザー向け認証ページ */}
          <Route element={<ProtectedRoute />}>
            <Route path="/favorite" element={<FavoritePage />} />
            <Route path="/team/:teamEnglish/:teamHash" element={<TeamDetailPage />} />
            <Route path="/gameDetail" element={<GameDetailPage />} />
          </Route>

          {/* 管理者専用 */}
          <Route element={<AdminProtectedRoute />}>
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="data/fetch" replace />} />
              <Route path="force/update" element={<CountryLeagueForceAdminPage />} />
              <Route path="scrape/manual" element={<ManualScrapePage />} />
              <Route path="s3/fileCount" element={<S3FileCountPage />} />
              <Route path="notices" element={<NoticeAdminPage />} />
              <Route path="data/fetch" element={<DataFetchAdminPage />} />
              <Route path="manual/data/target" element={<ManualDataTargetPage />} />
              <Route path="manual/data/register" element={<ManualDataConsolePage />} />
              <Route path="manual/data/defect" element={<ManualDataDefectPage />} />
              <Route path="manual/teamColor" element={<TeamColorPage />} />
              <Route path="ingested" element={<IngestedDataReferencePage />} />
              <Route path="sub-input" element={<AdminSubInputPage />} />
              <Route path="sub-league" element={<SubLeagueManualUpdatePage />} />
              <Route path="point-setting" element={<PointSettingsPage />} />
              <Route path="users" element={<AdminUserPage />} />
              <Route path="csv/today" element={<TodayCreatedCsvPage />} />
              <Route path="matches/by-date" element={<MatchDataByDatePage />} />
              <Route path="db/connections" element={<DbConnectionPage />} />
              <Route path="season" element={<CountryLeagueSeasonMasterReferencePage />} />
              <Route path="team" element={<CountryLeagueMasterReferencePage />} />
              <Route path="noecs" element={<NoEcsSlotsPage />} />
              <Route path="future/matches" element={<FutureMatchesByDatePage />} />
              <Route path="data-category" element={<RealTimeDataAdminPage />} />
              <Route path="mailinfo" element={<MailInfoListPage />} />
              <Route path="mailinfo/new" element={<MailInfoRegisterPage />} />
              <Route path="mailinfo/:mailId/edit" element={<MailInfoUpdatePage />} />
            </Route>
          </Route>

          <Route path="*" element={<div style={{ padding: 40 }}>NO ROUTE MATCHED</div>} />
        </Routes>
      </div>
    </>
  );
}
