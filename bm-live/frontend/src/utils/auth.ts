// src/utils/auth.ts
export type AuthSession = {
  accessToken?: string;
  tokenType?: string;
  issuedAtEpochSecond?: number;
  expiresAtEpochSecond?: number;
  roles?: string[];
  authFlg?: number;
  email?: string;
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
  return !!loadAuthSession()?.accessToken;
}

// 互換用
export function isAuthenticated(): boolean {
  return isLoggedIn();
}

export function getAccessToken(): string {
  return loadAuthSession()?.accessToken?.trim() ?? "";
}
