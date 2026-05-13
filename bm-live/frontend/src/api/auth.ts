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
