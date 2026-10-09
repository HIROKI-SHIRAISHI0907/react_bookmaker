// Dashboard（トップ画面）用の型（/v1/api/dashboard/* のレスポンス）

/** A=◎ / B=○ / C=△ */
export type Grade = "A" | "B" | "C";

export type DashboardTeam = {
  name: string;
  rank: number | null;
  attackGrade: Grade | null;
  defenseGrade: Grade | null;
  /** 未ログインは null */
  avgGoalsFor: number | null;
  avgGoalsAgainst: number | null;
};

export type DashboardForecast = {
  /** 未ログインは null */
  probHome: number | null;
  probDraw: number | null;
  probAway: number | null;
  /** バーの幅（未ログインは 10% 単位） */
  barHome: number;
  barDraw: number;
  barAway: number;
  goalsLabel: "HIGH" | "MID" | "LOW";
  expectedTotalGoals: number | null;
  expectedRestGoals: number | null;
};

export type DashboardLiveMatch = {
  /** static_data の seq_key（最新の行。例: "0drkxQrA-12"） */
  seqKey: string;
  matchId: string | null;
  country: string;
  league: string;
  leagueLabel: string;
  roundLabel: string | null;
  times: string;
  status: "LIVE" | "HT";
  minuteLabel: string;
  progress: number;
  homeScore: number;
  awayScore: number;
  halftimeHomeScore: number | null;
  halftimeAwayScore: number | null;
  home: DashboardTeam;
  away: DashboardTeam;
  homeXg: number | null;
  awayXg: number | null;
  homeShotsOnTarget: number | null;
  awayShotsOnTarget: number | null;
  homePossession: number | null;
  awayPossession: number | null;
  recordTime: string | null;
  forecast: DashboardForecast;
};

export type DashboardLiveLeague = {
  leagueLabel: string;
  country: string;
  matches: DashboardLiveMatch[];
};

export type DashboardLiveResponse = {
  loggedIn: boolean;
  updatedAt: string;
  count: number;
  featured: DashboardLiveMatch | null;
  leagues: DashboardLiveLeague[];
};

export type DashboardUpcomingMatch = {
  kickoff: string;
  country: string;
  league: string;
  leagueLabel: string;
  roundLabel: string | null;
  home: DashboardTeam;
  away: DashboardTeam;
  forecast: DashboardForecast;
};

export type DashboardUpcomingLeague = {
  leagueLabel: string;
  country: string;
  league: string;
  /** このリーグの期間内の全試合数（matches は先頭の数件だけのことがある） */
  totalCount: number;
  matches: DashboardUpcomingMatch[];
};

export type DashboardUpcomingResponse = {
  loggedIn: boolean;
  /** 返した試合数 */
  count: number;
  /** 期間内の全試合数 */
  totalCount: number;
  /** 期間内の全リーグ数 */
  totalLeagueCount: number;
  /** 何時間後までか */
  hours: number;
  /** 返した試合（キックオフ順） */
  matches: DashboardUpcomingMatch[];
  /** リーグごと（最初の試合が早い順） */
  leagues: DashboardUpcomingLeague[];
};

export type DashboardSummaryResponse = {
  liveCount: number;
  liveLeagueCount: number;
  highGoalLiveCount: number;
  goalsToday: number;
  avgGoalsToday: number | null;
  upcomingTodayCount: number;
  nextKickoff: string | null;
  nextHomeTeam: string | null;
  nextAwayTeam: string | null;
  finishedCount: number;
  upsetCount: number;
  drawCount: number;
};

export type DashboardFavoriteItem = {
  teamName: string;
  country: string | null;
  league: string | null;
  rank: number | null;
  status: "LIVE" | "NEXT" | "NONE";
  opponent: string | null;
  homeAway: "H" | "A" | null;
  minuteLabel: string | null;
  teamScore: number | null;
  opponentScore: number | null;
  kickoff: string | null;
  winProb: number | null;
  seqKey: string | null;
  recentForm?: ("W" | "D" | "L" | null)[] | null;
};

export type DashboardFavoriteResponse = {
  items: DashboardFavoriteItem[];
};
