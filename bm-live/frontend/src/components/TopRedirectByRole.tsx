// src/components/TopRedirectByRole.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { isLoggedIn, isStaffUser } from "../utils/auth";

/**
 * /top に来た時、ADMIN(authFlg=1)・ADMIN_SUB(authFlg=2、担当者)であれば
 * 管理画面(/admin)へ振り分ける。それ以外(一般ユーザー)はchildren(Dashboard)を表示する。
 *
 * ※以前はisAdminUser()(=authFlg===1のみ)を使っていたため、
 *   ADMIN_SUBでログインしたユーザーが一般ユーザー画面に残ってしまっていた。
 *   isStaffUser()(ADMIN・ADMIN_SUB両方を含む)に差し替え済み。
 */
export default function TopRedirectByRole({ children }: { children: React.ReactNode }) {
  if (isLoggedIn() && isStaffUser()) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
