// src/api/leagues.ts(Dashboard.tsxのハンバーガーメニューに表示する記述とリンク)
export type LeagueGrouped = {
  country: string;
  leagues: { name: string; team_count: number; path: string }[];
};

export async function fetchLeaguesGrouped(): Promise<LeagueGrouped[]> {
  const res = await fetch("/api/leagues/grouped", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch leagues");
  return res.json();
}

// チーム単位
export type TeamItem = {
  name: string;         // 表示名
  english: string;      // 英語スラッグ
  hash: string;
  link: string;         // /team/<english>/<hash>
  path: string;         // /<country>/<league> (UI用)
  apiPath: string;      // /api/leagues/<country>/<league>/<english>
};

export type TeamsInLeague = {
  country: string;
  league: string;
  teams: TeamItem[];
};

export async function fetchTeamsInLeague(country: string, league: string): Promise<TeamsInLeague> {
  const url = `/api/leagues/${encodeURIComponent(country)}/${encodeURIComponent(league)}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch teams");
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

export async function fetchTeamDetail(country: string, league: string, teamEnglish: string): Promise<TeamDetail> {
  const url = `/api/leagues/${encodeURIComponent(country)}/${encodeURIComponent(league)}/${encodeURIComponent(teamEnglish)}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch team detail");
  return res.json();
}
