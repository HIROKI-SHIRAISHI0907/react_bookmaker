// src/components/AdminProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isLoggedIn, isStaffUser } from "../utils/auth";
import { useAuthExpiryRedirect } from "./useAuthExpiryRedirect";

/**
 * /admin配下全体のガード。
 * ADMIN(authFlg=1)・ADMIN_SUB(authFlg=2、担当者)のどちらもアクセス可能。
 * 各画面ごとの細かい制限(管理者専用機能など)は、AdminLayoutのメニュー出し分けや
 * RequireRoleコンポーネントで行う。
 *
 * ※以前はisAdminUser()(=authFlg===1のみ)を使っていたため、ADMIN_SUBが
 *   ここで弾かれて/topへ戻され、TopRedirectByRole(/top→/admin)との間で
 *   無限リダイレクトループになっていた。isStaffUser()に差し替え済み。
 */
export default function AdminProtectedRoute() {
  const location = useLocation();
  // 期限切れも未ログイン扱い（isLoggedIn が期限を見る）
  const loggedIn = isLoggedIn();

  // 画面を開いたまま期限が来たらログイン画面へ
  useAuthExpiryRedirect();

  if (!loggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search + location.hash }} />;
  }

  if (!isStaffUser()) {
    return <Navigate to="/top" replace />;
  }

  return <Outlet />;
}
