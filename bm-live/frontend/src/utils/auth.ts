// src/utils/auth.ts
export type AuthSession = {
  accessToken?: string;
  tokenType?: string;
  issuedAtEpochSecond?: number;
  expiresAtEpochSecond?: number;
  authFlg?: number;
  roles?: string[];
  email?: string;
  name?: string;
  userId?: number;
};

const AUTH_STORAGE_KEY = "authSession";

export function saveAuthSession(session: AuthSession) {
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

export function clearAuthSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function isLoggedIn(): boolean {
  const session = loadAuthSession();
  return !!session?.accessToken;
}

export function isAdminUser(): boolean {
  const session = loadAuthSession();
  if (!session?.accessToken) return false;

  if (session.authFlg === 1) return true;
  if (session.roles?.includes("ROLE_ADMIN")) return true;

  return false;
}

export function getDefaultRouteByRole(): string {
  return isAdminUser() ? "/admin" : "/top";
}

/** =========================
 * 互換用関数
 * 既存コードが authStorage.ts 前提でも動かしやすくする
 * ========================= */

export function saveAuth(session: AuthSession) {
  saveAuthSession(session);
}

export function clearAuth() {
  clearAuthSession();
}

export function isAuthenticated(): boolean {
  return isLoggedIn();
}

export function getAccessToken(): string {
  return loadAuthSession()?.accessToken ?? "";
}

export function getTokenType(): string {
  return loadAuthSession()?.tokenType ?? "Bearer";
}

export function getRoles(): string[] {
  return loadAuthSession()?.roles ?? [];
}

export function getAuthFlg(): number | undefined {
  return loadAuthSession()?.authFlg;
}

export function getCurrentEmail(): string {
  return loadAuthSession()?.email ?? "";
}

export function getCurrentUserId(): number | undefined {
  return loadAuthSession()?.userId;
}
