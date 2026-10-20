// これからの試合の詳細（GET /v1/api/upcoming-detail）の型
import type { MatchVenue } from "../match/matchtypes";

/** 対戦成績の勝敗・得失点（ホームチーム視点） */
export type HeadToHeadRecord = {
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
};

/** 対戦成績の 1 試合 */
export type HeadToHeadMatch = {
  season: string;
  country: string;
  league: string;
  roundNo: number | null;
  dataCategory: string | null;
  /** 日本時間 "yyyy-MM-dd HH:mm:ss" */
  matchTime: string | null;
  /** team（ホームチーム）がホームなら H */
  ha: "H" | "A";
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number | null;
  awayScore: number | null;
  /** team（この試合のホームチーム）の結果 */
  result: "W" | "D" | "L";
  pk: boolean;
  pkGoalsFor: number | null;
  pkGoalsAgainst: number | null;
  goalsFor1st: number | null;
  goalsAgainst1st: number | null;
  firstGoal: "T" | "O" | "N" | "U";
};

/** 対戦成績（GET /v1/api/head-to-head と同じ形。team = この試合のホームチーム） */
export type HeadToHeadResponse = {
  team: string;
  opponent: string;
  total: HeadToHeadRecord;
  home: HeadToHeadRecord;
  away: HeadToHeadRecord;
  pkWins: number;
  pkLosses: number;
  cleanSheets: number;
  failedToScore: number;
  bothScored: number;
  scoredFirst: number;
  concededFirst: number;
  seasons: number;
  firstMatchTime: string | null;
  lastMatchTime: string | null;
  matches: HeadToHeadMatch[];
};

/** 順位表の 1 行 */
export type StandingRow = {
  rank: number;
  siteRank: number | null;
  team: string;
  games: number;
  win: number;
  draw: number;
  lose: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  /** 直近 5 試合（左が新しい） */
  form: string[];
  /** この試合のホーム H / アウェー A */
  side: "H" | "A" | null;
};

/** ゴール数などの統計（全試合 / ホーム時 / アウェー時） */
export type GoalStats = {
  scope: "ALL" | "HOME" | "AWAY";
  games: number;
  win: number;
  draw: number;
  lose: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  avgGoalsFor: number | null;
  avgGoalsAgainst: number | null;
  halfKnownGames: number;
  goalsFor1st: number;
  goalsFor2nd: number;
  goalsAgainst1st: number;
  goalsAgainst2nd: number;
  cleanSheets: number;
  failedToScore: number;
  bothScored: number;
  over15: number;
  over25: number;
  over35: number;
  scoredFirst: number;
  concededFirst: number;
  form: string[];
};

export type TeamGoalStats = {
  team: string;
  season: string | null;
  country: string | null;
  league: string | null;
  /** 試合のリーグと別のリーグで集計した（カップ戦など） */
  otherLeague: boolean;
  all: GoalStats;
  home: GoalStats;
  away: GoalStats;
};

export type UpcomingDetailResponse = {
  country: string | null;
  league: string | null;
  leagueLabel: string | null;
  home: string;
  away: string;
  venue: MatchVenue | null;
  headToHead: HeadToHeadResponse;
  standingSeason: string | null;
  standings: StandingRow[];
  homeStats: TeamGoalStats;
  awayStats: TeamGoalStats;
};
