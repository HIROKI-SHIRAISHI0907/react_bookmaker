// src/api/leagues.ts
// Dashboard.tsx のハンバーガーメニューに表示する記述とリンク
// SpringBoot bookmakers-web bm_w011

export type SubLeagueInfo = {
  rawName?: string | null;
  name?: string | null; // "▶︎EAST" など。backend が rawName だけ返しても可
  path?: string | null; // 必要なら
  routingPath?: string | null; // /leagues/...?... など
  teamCount?: number | null;
};

export type LeagueInfo = {
  name: string; // 親リーグ名: J2・J3リーグ など
  teamCount?: number | null; // 親なら合計
  path?: string | null; // アプリ内遷移用
  routingPath?: string | null; // 予備
  variantCount?: number | null; // サブリーグ数
  subLeagues?: SubLeagueInfo[] | null; // ★追加
};

export type LeagueGrouped = {
  country: string;
  leagues: LeagueInfo[];
};

export async function fetchLeaguesGrouped(): Promise<LeagueGrouped[]> {
  const res = await fetch("/v1/api/leagues/grouped", {
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to fetch leagues: ${res.status} ${text}`);
  }

  const json = await res.json();
  return Array.isArray(json) ? json : [];
}

// チーム単位
export type TeamItem = {
  name: string; // 表示名
  english: string; // 英語スラッグ
  hash: string;
  link: string; // /team/<english>/<hash>
  path: string; // /<country>/<league> (UI用)
  apiPath: string; // /api/leagues/<country>/<league>/<english>
  routingPath: string; // /team/xxxx/XXXXXX
};

export type LeagueVariantItem = {
  name: string; // "J2・J3リーグ - WEST A"
  teamCount: number;
  path: string; // アプリ内
  routingPath?: string;
};

export type TeamsInLeague = {
  country: string;
  league: string; // 親なら "J2・J3リーグ"、子なら "J2・J3リーグ - WEST A"
  variants?: LeagueVariantItem[];
  teams?: TeamItem[];
};

export async function fetchTeamsInLeague(country: string, league: string): Promise<TeamsInLeague> {
  const url = `/v1/api/leagues/${encodeURIComponent(country)}/${encodeURIComponent(league)}`;
  const res = await fetch(url, { credentials: "include" });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("fetchTeamsInLeague failed:", res.status, text);
    throw new Error(`Failed to fetch teams: ${res.status}`);
  }

  return res.json();
}

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

export async function fetchTeamDetail(teamEnglish: string, teamHash: string): Promise<TeamDetail> {
  const url = `/v1/api/leagues/${encodeURIComponent(teamEnglish)}/${encodeURIComponent(teamHash)}/teamDetail`;

  const res = await fetch(url, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to fetch team detail: ${res.status} ${text}`);
  }

  return res.json();
}
