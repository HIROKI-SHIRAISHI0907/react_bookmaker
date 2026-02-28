// src/api/leagues.ts(Dashboard.tsxのハンバーガーメニューに表示する記述とリンク)(SpringBoot bookmakers-web bm_w011)
type LeagueItem = {
  name: string; // サイドメニュー表示名（親リーグ名：J2・J3リーグ など）
  teamCount: number; // 親なら合計
  path: string; // ★アプリ内遷移用（/leagues/<country>/<leagueGroup> など）
  routingPath?: string; // Flashscore path（必要なら外部リンク用に保持）
  variantCount?: number; // ★サブリーグ数（親だけ意味がある）
};

export type LeagueGrouped = {
  country: string;
  leagues: LeagueItem[];
};

export async function fetchLeaguesGrouped(): Promise<LeagueGrouped[]> {
  const res = await fetch("/v1/api/leagues/grouped", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch leagues");
  return res.json();
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
  variants?: LeagueVariantItem[]; // ★親の場合に入る
  teams?: TeamItem[]; // ★子の場合に入る（従来の teams のままでもOK）
};

export async function fetchTeamsInLeague(country: string, league: string): Promise<TeamsInLeague> {
  //country:england, league:premier-league
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
  paths: { leaguePage: string; apiSelf: string };
};

export async function fetchTeamDetail(teamEnglish: string, teamHash: string): Promise<TeamDetail> {
  const url = `/v1/api/leagues/${encodeURIComponent(teamEnglish)}/${encodeURIComponent(teamHash)}/teamDetail`;

  const res = await fetch(url, { credentials: "include", headers: { Accept: "application/json" } });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to fetch team detail: ${res.status} ${text}`);
  }
  return res.json();
}
