// src/api/leagues.ts
import { getAccessToken, clearAuthSession } from "../utils/auth";

export type SubLeagueInfo = {
  rawName?: string | null;
  name?: string | null;
  path?: string | null;
  routingPath?: string | null;
  teamCount?: number | null;

  seasonEnded?: boolean | null;
  linkEnabled?: boolean | null;
  seasonEndedLabel?: string | null;
};

export type LeagueInfo = {
  name: string;
  leagueGroup?: string | null;
  teamCount?: number | null;
  path?: string | null;
  routingPath?: string | null;
  variantCount?: number | null;
  subLeagues?: SubLeagueInfo[] | null;

  seasonYear?: string | null;
  startSeasonDate?: string | null;
  endSeasonDate?: string | null;

  seasonEnded?: boolean | null;
  linkEnabled?: boolean | null;
  seasonEndedLabel?: string | null;
};

export type LeagueGrouped = {
  country: string;
  leagues: LeagueInfo[];
};

export type TeamItem = {
  name: string;
  english: string;
  hash: string;
  link: string;
  path: string;
  apiPath: string;
  routingPath: string;
};

export type LeagueVariantItem = {
  name: string;
  teamCount: number;
  path: string;
  routingPath?: string;
};

export type TeamsInLeague = {
  country: string;
  league: string;
  subLeague?: string | null;
  variants?: LeagueVariantItem[];
  teams?: TeamItem[];
};

export type TeamDetail = {
  id: number;
  country: string;
  league: string;
  name: string;
  english: string;
  hash: string;
  link: string;
  paths: {
    leaguePage: string;
    apiSelf: string;
  };
};

export class UnauthorizedError extends Error {
  constructor(message = "ログインが必要です") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

function buildAuthHeaders(extra?: HeadersInit): Headers {
  const token = getAccessToken().trim();

  if (!token) {
    throw new UnauthorizedError("ログインが必要です");
  }

  const headers = new Headers(extra ?? {});
  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${token}`);
  return headers;
}

async function readApiErrorMessage(res: Response, fallback: string): Promise<string> {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const json = await res.json().catch(() => null);
    const message = json?.message || json?.error || json?.reason || json?.detail;

    if (typeof message === "string" && message.trim()) {
      return message.trim();
    }
  }

  const text = await res.text().catch(() => "");
  if (text.trim()) {
    return text.trim();
  }

  return fallback;
}

async function fetchWithAuth(input: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, {
    ...init,
    headers: buildAuthHeaders(init?.headers),
  });

  if (res.status === 401) {
    clearAuthSession();
    const message = await readApiErrorMessage(res, "ログインが必要です");
    throw new UnauthorizedError(message);
  }

  return res;
}

export async function fetchLeaguesGrouped(): Promise<LeagueGrouped[]> {
  const res = await fetchWithAuth("/v1/api/leagues/grouped", {
    method: "GET",
  });

  if (!res.ok) {
    const message = await readApiErrorMessage(res, `Failed to fetch leagues: ${res.status}`);
    throw new Error(message);
  }

  const json = await res.json();
  return Array.isArray(json) ? json : [];
}

function normalizeQuerySubLeague(v?: string | null): string | null {
  const s = (v ?? "").trim();
  if (!s) return null;
  if (s === "未設定") return null;
  return s;
}

export async function fetchTeamsInLeague(country: string, league: string, subLeague?: string | null): Promise<TeamsInLeague> {
  const params = new URLSearchParams();
  const normalizedSubLeague = normalizeQuerySubLeague(subLeague);

  if (normalizedSubLeague) {
    params.set("subLeague", normalizedSubLeague);
  }

  const query = params.toString();
  const url = `/v1/api/leagues/${encodeURIComponent(country)}/${encodeURIComponent(league)}` + (query ? `?${query}` : "");

  const res = await fetchWithAuth(url, {
    method: "GET",
  });

  if (!res.ok) {
    const message = await readApiErrorMessage(res, "シーズンが終了しています。来シーズンまでお待ちください。");
    throw new Error(message);
  }

  return res.json();
}

export async function fetchTeamDetail(teamEnglish: string, teamHash: string): Promise<TeamDetail> {
  const url = `/v1/api/leagues/${encodeURIComponent(teamEnglish)}/${encodeURIComponent(teamHash)}/teamDetail`;

  const res = await fetchWithAuth(url, {
    method: "GET",
  });

  if (!res.ok) {
    const message = await readApiErrorMessage(res, `Failed to fetch team detail: ${res.status}`);
    throw new Error(message);
  }

  return res.json();
}
