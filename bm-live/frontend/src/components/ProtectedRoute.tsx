// src/components/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAuthenticated } from "../utils/auth";
import { useAuthExpiryRedirect } from "./useAuthExpiryRedirect";

/**
 * ログインが必要な画面のガード。
 * 未ログイン・JWT 期限切れならログイン画面へ（ログイン後は元の画面に戻る）。
 */
export default function ProtectedRoute() {
  const location = useLocation();
  const loggedIn = isAuthenticated();

  useAuthExpiryRedirect();

  if (!loggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search + location.hash }} />;
  }

  return <Outlet />;
}
