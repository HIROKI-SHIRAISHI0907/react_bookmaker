// src/utils/auth.ts

export type AuthSession = {
  accessToken?: string;
  tokenType?: string;
  issuedAtEpochSecond?: number;
  expiresAtEpochSecond?: number;
  roles?: string[];
  authFlg?: number;
  email?: string;
  name?: string;
  userId?: number;
};

export const AUTH_STORAGE_KEY = "authSession";

export function saveAuthSession(session: AuthSession): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function loadAuthSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function clearAuthSession(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function isLoggedIn(): boolean {
  return !!loadAuthSession()?.accessToken?.trim();
}

export function isAuthenticated(): boolean {
  return isLoggedIn();
}

export function isAdminUser(): boolean {
  const session = loadAuthSession();
  if (!session) return false;
  return session.authFlg === 1 || (session.roles ?? []).includes("ROLE_ADMIN");
}

export function getDefaultRouteByRole(): string {
  return isAdminUser() ? "/admin" : "/top";
}

export function getAccessToken(): string {
  return loadAuthSession()?.accessToken?.trim() ?? "";
}

export function getTokenType(): string {
  return loadAuthSession()?.tokenType?.trim() || "Bearer";
}

export function getRoles(): string[] {
  return loadAuthSession()?.roles ?? [];
}

export function getAuthFlg(): number | undefined {
  return loadAuthSession()?.authFlg;
}

export function getCurrentEmail(): string {
  return loadAuthSession()?.email?.trim() ?? "";
}

export function getCurrentUserId(): number | undefined {
  return loadAuthSession()?.userId;
}

/**
 * 互換用ラッパー
 * 既存コードで saveAuth() を呼んでいても動くようにする
 */
export function saveAuth(session: AuthSession): void {
  saveAuthSession(session);
}

/**
 * 互換用ラッパー
 */
export function clearAuth(): void {
  clearAuthSession();
}
