const ACCESS_TOKEN_KEY = "accessToken";
const TOKEN_TYPE_KEY = "tokenType";
const ROLES_KEY = "roles";

export function saveAuth(params: { accessToken: string; tokenType?: string; roles?: string[] }) {
  localStorage.setItem(ACCESS_TOKEN_KEY, params.accessToken);
  localStorage.setItem(TOKEN_TYPE_KEY, params.tokenType ?? "Bearer");
  localStorage.setItem(ROLES_KEY, JSON.stringify(params.roles ?? []));
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getTokenType() {
  return localStorage.getItem(TOKEN_TYPE_KEY) ?? "Bearer";
}

export function getRoles(): string[] {
  const raw = localStorage.getItem(ROLES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function clearAuth() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(TOKEN_TYPE_KEY);
  localStorage.removeItem(ROLES_KEY);
}

export function isAuthenticated() {
  return !!getAccessToken();
}
