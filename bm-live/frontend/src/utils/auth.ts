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

/**
 * 以前のバージョンで、authSessionに統合する前に使われていた個別キー。
 * 現在のsaveAuthSession()はこれらに書き込まないが、過去のログインで
 * localStorageに残ったままになっている場合があるため、ログアウト時に
 * 念のため一緒に削除する。
 * ("theme"はログイン状態と無関係なUI設定のため、ここには含めない)
 */
const LEGACY_AUTH_STORAGE_KEYS = ["accessToken", "roles", "tokenType"] as const;

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
  // 古いバージョンの名残りで残っている可能性がある個別キーも、
  // ログアウト時にlocalStorageに認証情報が残らないよう合わせて削除する。
  for (const key of LEGACY_AUTH_STORAGE_KEYS) {
    localStorage.removeItem(key);
  }
}

/** 期限切れ判定の余裕（秒）。期限ちょうどに API を呼んで 401 になるのを避ける */
const EXPIRY_SKEW_SECONDS = 30;

/**
 * トークンの期限が切れているか。
 * expiresAtEpochSecond が無い（古いログイン情報）ときは JWT の exp を読む。どちらも無ければ期限切れ扱い。
 */
export function isSessionExpired(session: AuthSession | null = loadAuthSession()): boolean {
  if (!session?.accessToken?.trim()) return true;
  const exp = session.expiresAtEpochSecond ?? readJwtExp(session.accessToken);
  if (!exp) return true;
  return Date.now() / 1000 >= exp - EXPIRY_SKEW_SECONDS;
}

/** 期限までのミリ秒（ログインしていなければ 0） */
export function msUntilExpiry(): number {
  const session = loadAuthSession();
  if (!session?.accessToken?.trim()) return 0;
  const exp = session.expiresAtEpochSecond ?? readJwtExp(session.accessToken);
  if (!exp) return 0;
  return Math.max(0, (exp - EXPIRY_SKEW_SECONDS) * 1000 - Date.now());
}

function readJwtExp(token: string): number | undefined {
  try {
    const payload = token.split(".")[1];
    if (!payload) return undefined;
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof json?.exp === "number" ? json.exp : undefined;
  } catch {
    return undefined;
  }
}

/**
 * ログイン中か（トークンがあり、期限内）。
 * 期限切れのときはログイン情報を消して false を返す。
 */
export function isLoggedIn(): boolean {
  const session = loadAuthSession();
  if (!session?.accessToken?.trim()) return false;
  if (isSessionExpired(session)) {
    clearAuthSession();
    return false;
  }
  return true;
}

// =========================================================
// ログイン画面への強制遷移
// =========================================================

/** ログイン後に戻るパス（ログイン画面へ飛ばしたときに覚えておく） */
const LOGIN_REDIRECT_KEY = "loginRedirectFrom";

/**
 * ログイン情報を消してログイン画面へ飛ばす（いまの画面はログイン後に戻れるよう覚えておく）。
 * React の外（fetch / axios の 401、期限切れタイマー）から呼ぶ。
 */
export function redirectToLogin(): void {
  clearAuthSession();
  const { pathname, search, hash } = window.location;
  if (pathname === "/login") return;
  try {
    sessionStorage.setItem(LOGIN_REDIRECT_KEY, pathname + search + hash);
  } catch {
    // sessionStorage が使えなくても遷移はする
  }
  window.location.replace("/login");
}

/** 覚えておいた戻り先を取り出す（取り出したら消す） */
export function consumeLoginRedirect(): string | undefined {
  try {
    const v = sessionStorage.getItem(LOGIN_REDIRECT_KEY) ?? undefined;
    sessionStorage.removeItem(LOGIN_REDIRECT_KEY);
    return v || undefined;
  } catch {
    return undefined;
  }
}

export function isAuthenticated(): boolean {
  return isLoggedIn();
}

export function isAdminUser(): boolean {
  const session = loadAuthSession();
  if (!session) return false;
  return session.authFlg === 1 || (session.roles ?? []).includes("ROLE_ADMIN");
}

/**
 * 管理画面(/admin)へ入るべきロールかどうかを判定する。
 * ADMIN(authFlg=1)だけでなく、ADMIN_SUB(authFlg=2、担当者)も対象。
 * ※isAdminUser()は「厳密にADMINかどうか」の判定用に残し、
 *   ルーティング判定にはこちらを使う。
 */
export function isStaffUser(): boolean {
  const session = loadAuthSession();
  if (!session) return false;
  if (session.authFlg === 1 || session.authFlg === 2) {
    return true;
  }
  const roles = session.roles ?? [];
  return roles.includes("ROLE_ADMIN") || roles.includes("ROLE_ADMIN_SUB");
}

export function getDefaultRouteByRole(): string {
  return isStaffUser() ? "/admin" : "/top";
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
