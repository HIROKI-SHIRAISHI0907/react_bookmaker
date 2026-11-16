import type { DashboardUpcomingMatch } from "../dashboard/types";

// チームの過去の結果・お気に入り編集の型
export type TeamResultItem = {
  roundNo: number;
  /** OVERVIEW（集計済み）/ STATIC（終了済の行から）/ NONE（データなし＝空欄） */
  source: "OVERVIEW" | "STATIC" | "NONE";
  opponent: string | null;
  homeAway: "H" | "A" | null;
  goalsFor: number | null;
  goalsAgainst: number | null;
  result: "W" | "D" | "L" | null;
  pk: boolean;
  pkGoalsFor: number | null;
  pkGoalsAgainst: number | null;
  matchTime: string | null;
  /** 試合詳細（/match-detail?seqKey=）へのキー。分からなければ null（2026-11 追加） */
  seqKey?: string | null;
  matchId?: string | null;
  /** 統計詳細データ（メンバー・選手スタッツなど）がある */
  hasDetail?: boolean;
};

// ===================== チームの統計詳細データ（/v1/api/team-detail-stats。2026-11 追加） =====================
export type TeamDetailFormation = { formation: string; count: number };

export type TeamDetailPlayer = {
  name: string;
  position: string | null;
  /** 出場数（選手スタッツがある試合の数） */
  apps: number;
  minutes: number | null;
  /** 平均評価点 */
  rating: number | null;
  goals: number | null;
  assists: number | null;
  xg: number | null;
  xa: number | null;
  shots: number | null;
  shotsOnTarget: number | null;
  keyPasses: number | null;
  yellowCards: number | null;
  redCards: number | null;
  saves: number | null;
};

export type TeamDetailStatsResponse = {
  country: string;
  league: string;
  team: string;
  summary: { matchCount: number; latestMatchDate: string | null; averageRating: number | null; coach: string | null };
  formations: TeamDetailFormation[];
  players: TeamDetailPlayer[];
};

export type TeamResultsResponse = {
  country: string;
  league: string;
  team: string;
  season: string | null;
  /** items[0] が一番新しいラウンド */
  items: TeamResultItem[];
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
};

export type PositionGroup = "GK" | "DF" | "MF" | "FW" | "OTHER";

export type TeamMember = {
  jersey: number | null;
  name: string;
  positionGroup: PositionGroup;
  position: string | null;
  age: number | null;
  height: number | null;
  marketValue: string | null;
  /** 負傷内容（無ければ null） */
  injury: string | null;
  /** レンタル元（レンタルでなければ null） */
  loanFrom: string | null;
  facePicPath: string | null;
};

export type TeamMembersResponse = {
  country: string;
  league: string;
  team: string;
  latestInfoDate: string | null;
  injuredCount: number;
  /** GK → DF → MF → FW → その他、背番号順 */
  members: TeamMember[];
};

export type TeamUpcomingItem = {
  /** トップ画面の「これからの試合」と同じ形（未ログインは数値 null） */
  match: DashboardUpcomingMatch;
  homeAway: "H" | "A";
  opponent: string;
  /** 対戦相手の直近の結果（左が新しい） */
  opponentForm: ("W" | "D" | "L" | null)[] | null;
  /** このチームが勝つ確率（%。未ログインは null） */
  winProb: number | null;
};

export type TeamUpcomingResponse = {
  country: string;
  league: string;
  team: string;
  loggedIn: boolean;
  days: number;
  /** キックオフ順（items[0] が次節） */
  items: TeamUpcomingItem[];
};

export type FavoriteTeam = { id: number; country: string; league: string; team: string };

export type FavoriteEditResponse = { teams: FavoriteTeam[]; maxTeams: number; message: string | null };

export type FavoriteLeague = { country: string; league: string; teamCount: number };

export type FavoriteTeamCandidate = { country: string; league: string; team: string; favoriteId: number | null };
