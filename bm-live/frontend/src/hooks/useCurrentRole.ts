import { getAuthFlg, getRoles } from "../utils/auth";

// ログイン中ユーザーの承認フロー上のロール。
// src/utils/auth.ts の loadAuthSession() (localStorageの "authSession") が実際に
// LoginPage.tsx で使われている保存先だったため、そこから roles / authFlg を読む。
export type CurrentRole = "ADMIN" | "ADMIN_SUB" | null;

export function useCurrentRole(): CurrentRole {
  const roles = getRoles();
  if (roles.includes("ROLE_ADMIN")) return "ADMIN";
  if (roles.includes("ROLE_ADMIN_SUB")) return "ADMIN_SUB";

  // rolesが空の場合のフォールバック(authFlg: 1=管理者 / 2=担当者)
  const authFlg = getAuthFlg();
  if (authFlg === 1) return "ADMIN";
  if (authFlg === 2) return "ADMIN_SUB";

  return null;
}
