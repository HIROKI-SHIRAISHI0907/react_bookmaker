// src/api/leagues.ts(Dashboard.tsxのハンバーガーメニューに表示する記述とリンク)
export type LeagueFlat = {
  country: string;
  league: string;
  team_count: number;
  path: string; // 生成されたURL
};

export type LeagueGrouped = {
  country: string;
  leagues: { name: string; team_count: number; path: string }[];
};

export async function fetchLeaguesGrouped(): Promise<LeagueGrouped[]> {
  const res = await fetch("/api/leagues/grouped", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch leagues");
  return res.json();
}
