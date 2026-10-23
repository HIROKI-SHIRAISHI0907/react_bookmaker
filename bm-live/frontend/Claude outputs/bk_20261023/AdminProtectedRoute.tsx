// src/components/AdminProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isLoggedIn, isStaffUser } from "../utils/auth";

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

  if (!isLoggedIn()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!isStaffUser()) {
    return <Navigate to="/top" replace />;
  }

  return <Outlet />;
}
