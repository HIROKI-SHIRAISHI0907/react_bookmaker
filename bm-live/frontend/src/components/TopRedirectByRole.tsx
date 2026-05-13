// src/components/TopRedirectByRole.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { isLoggedIn, isAdminUser } from "../api/auth";

export default function TopRedirectByRole({ children }: { children: React.ReactNode }) {
  if (isLoggedIn() && isAdminUser()) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
