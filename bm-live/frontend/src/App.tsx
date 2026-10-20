import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import ForgetPasswordPage from "./pages/auth/ForgetPasswordPage";
import SignupPage from "./pages/auth/SignUpPage";
import Dashboard from "./pages/personal/top/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import RequireRole from "./components/RequireRole";
import TopRedirectByRole from "./components/TopRedirectByRole";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminMenuPage from "./pages/admin/menu/AdminMenuPage";
import ManualScrapePage from "./pages/admin/scrape/ManualScrapePage";
import CountryLeagueForceAdminPage from "./pages/admin/force/CountryLeagueForceAdminPage";
import NoticeAdminPage from "./pages/admin/notice/NoticeAdminPage";
import DataFetchAdminPage from "./pages/admin/fetch/DataFetchAdminPage";
import ManualDataTargetPage from "./pages/admin/target/ManualDataTargetPage";
import TeamColorPage from "./pages/admin/color/TeamColorPage";
import IngestedDataReferencePage from "./pages/admin/ingest/IngestedDataReferencePage";
import AdminSubInputPage from "./pages/admin/csvSelect/AdminSubInputPage";
import SubLeagueManualUpdatePage from "./pages/admin/subLeague/SubLeagueManualUpdatePage";
import PointSettingsPage from "./pages/admin/pointSetting/PointSettingsPage";
import LeagueLevelPage from "./pages/admin/leagueLevel/LeagueLevelPage";
import TodayCreatedCsvPage from "./pages/admin/csv/TodayCreatedCsvPage";
import AdminUserPage from "./pages/admin/user/AdminUserPage";
import MatchDataByDatePage from "./pages/admin/matches/MatchDataByDatePage";
import DbConnectionPage from "./pages/admin/db/DbConnectionPage";
import CountryLeagueSeasonMasterReferencePage from "./pages/admin/master/CountryLeagueSeasonMasterReferencePage";
import CountryLeagueMasterReferencePage from "./pages/admin/master/CountryLeagueMasterReferencePage";
import NoEcsSlotsPage from "./pages/admin/noecs/NoEcsSlotsPage";
import FutureMatchesByDatePage from "./pages/admin/future/FutureMatchesByDatePage";
import RealTimeDataAdminPage from "./pages/admin/realtimedatacategory/DataCategoryManage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import InvalidPage from "./pages/admin/invalid/InvalidPage";
import Header from "./components/Header";
import UploadedRealTimeDataDownloadPage from "./pages/admin/finUploadRealData/UploadedRealTimeDataDownload";
import RequestReviewPage from "./pages/admin/approve/RequestReviewPage";
import InstructionConfirmPage from "./pages/admin/approve/InstructionConfirmPage";
import WithdrawalConfirmPage from "./pages/admin/withdraw/WithdrawalConfirmPage";
import WithdrawalCompletePage from "./pages/admin/withdraw/WithdrawalCompletePage";
import MailInfoListPage from "./pages/admin/mail/MailInfoList";
import MailInfoRegisterPage from "./pages/admin/mail/MailInfoRegisterPage"; // MailRegisterFormPage → MailInfoRegisterPage
import MailInfoUpdatePage from "./pages/admin/mail/MailUpdateFormPage";
import MyRequestsPage from "./pages/admin/approve/MyRequestsPage";
import AwsDashboardPage from "./pages/admin/checkData/AwsDashboardPage";
import AnalyzeErrorMatchesPage from "./pages/admin/error/AnalyzeErrorMatchPage";
import FavoriteEdit from "./pages/personal/favorite/FavoriteEdit";
import TeamResults from "./pages/personal/teams/TeamResults";
import UpcomingMatches from "./pages/personal/top/DashboardUpcomingMatches";
import MatchDetail, { MATCH_DETAIL_PATH } from "./pages/personal/match/MatchDetail";
import SeasonCsvUploadPage from "./pages/admin/csvUpload/SeasonCsvUploadPage";
import TeamCsvUploadPage from "./pages/admin/csvUpload/TeamCsvUploadPage";
import FutureCsvUploadPage from "./pages/admin/csvUpload/FutureCsvUploadPage";
import RealtimeCsvUploadPage from "./pages/admin/csvUpload/RealtimeCsvUploadPage";
import FileUploadStatusPage from "./pages/admin/csvUploadStatus/FileUploadStatusPage";
import UpcomingDetail, { UPCOMING_DETAIL_PATH } from "./pages/personal/upcoming/UpcomingDetail";

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
      <Header />
      <div style={{ paddingTop: 40 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/top" replace />} />

          {/* 公開ページ */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgetPasswordPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/reset-password/invalid" element={<InvalidPage />} />
          <Route path="/favorite-edit" element={<FavoriteEdit />} />
          <Route path="/team-results" element={<TeamResults />} />
          <Route path="/upcoming" element={<UpcomingMatches />} />
          {/* 試合詳細 /match-detail?seqKey=xxxx（ダッシュボードのライブ・注目試合から遷移） */}
          <Route path={MATCH_DETAIL_PATH} element={<MatchDetail />} />
          {/* これからの試合の詳細 /upcoming-detail?country=&league=&home=&away=（これからの試合の一覧・トップ画面から遷移） */}
          <Route path={UPCOMING_DETAIL_PATH} element={<UpcomingDetail />} />

          <Route
            path="/top"
            element={
              <TopRedirectByRole>
                <Dashboard />
              </TopRedirectByRole>
            }
          />

          <Route path="/dashboard" element={<Navigate to="/top" replace />} />

          {/* 一般ユーザー向け認証ページ */}
          <Route element={<ProtectedRoute />}></Route>

          {/* 管理者専用 */}
          <Route element={<AdminProtectedRoute />}>
            <Route path="admin">
              {/* /admin はメニューだけの画面（左メニューのレイアウトの外） */}
              <Route index element={<AdminMenuPage />} />
              {/* 各画面は左メニュー付きのレイアウトで表示 */}
              <Route element={<AdminLayout />}>
                <Route path="force/update" element={<CountryLeagueForceAdminPage />} />
                <Route path="scrape/manual" element={<ManualScrapePage />} />
                {/* お知らせの作成・編集は担当者のみ。管理者は申請確認画面から見て承認/差し戻しするだけ。 */}
                <Route
                  path="notices"
                  element={
                    <RequireRole role="ADMIN_SUB">
                      <NoticeAdminPage />
                    </RequireRole>
                  }
                />
                <Route path="data/fetch" element={<DataFetchAdminPage />} />
                <Route path="manual/data/target" element={<ManualDataTargetPage />} />
                <Route path="manual/teamColor" element={<TeamColorPage />} />
                <Route path="ingested" element={<IngestedDataReferencePage />} />
                <Route path="sub-input" element={<AdminSubInputPage />} />
                <Route path="sub-league" element={<SubLeagueManualUpdatePage />} />
                <Route path="point-setting" element={<PointSettingsPage />} />
                <Route path="league-level" element={<LeagueLevelPage />} />
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
                <Route path="upload/realtime" element={<UploadedRealTimeDataDownloadPage />} />
                <Route path="analyzeCsvError" element={<AnalyzeErrorMatchesPage />} />
                <Route path="csv-upload/season" element={<SeasonCsvUploadPage />} />
                <Route path="csv-upload/team" element={<TeamCsvUploadPage />} />
                <Route path="csv-upload/future" element={<FutureCsvUploadPage />} />
                <Route path="csv-upload/realtime" element={<RealtimeCsvUploadPage />} />
                <Route path="csv-upload/status" element={<FileUploadStatusPage />} />

                {/* 承認フロー */}
                <Route
                  path="approve/requests"
                  element={
                    <RequireRole role="ADMIN">
                      <RequestReviewPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="approve/instructions"
                  element={
                    <RequireRole role="ADMIN_SUB">
                      <InstructionConfirmPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="approve/myrequest"
                  element={
                    <RequireRole role="ADMIN_SUB">
                      <MyRequestsPage />
                    </RequireRole>
                  }
                />

                <Route
                  path="withdrawal/confirm"
                  element={
                    <RequireRole role="ADMIN_SUB">
                      <WithdrawalConfirmPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="withdrawal/complete"
                  element={
                    <RequireRole role="ADMIN_SUB">
                      <WithdrawalCompletePage />
                    </RequireRole>
                  }
                />

                {/* AWSリソース状況（IAM・IP・DNS などアカウント情報を表示するため管理者のみ） */}
                <Route
                  path="aws/dashboard"
                  element={
                    <RequireRole role="ADMIN">
                      <AwsDashboardPage />
                    </RequireRole>
                  }
                />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<div style={{ padding: 40 }}>NO ROUTE MATCHED</div>} />
        </Routes>
      </div>
    </>
  );
}
