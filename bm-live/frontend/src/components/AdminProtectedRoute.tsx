// src/components/AdminProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isLoggedIn, isAdminUser } from "../api/auth";

export default function AdminProtectedRoute() {
  const location = useLocation();

  if (!isLoggedIn()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!isAdminUser()) {
    return <Navigate to="/top" replace />;
  }

  return <Outlet />;
}
