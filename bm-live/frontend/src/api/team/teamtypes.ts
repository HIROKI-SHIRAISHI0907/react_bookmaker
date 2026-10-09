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

export type FavoriteTeam = { id: number; country: string; league: string; team: string };

export type FavoriteEditResponse = { teams: FavoriteTeam[]; maxTeams: number; message: string | null };

export type FavoriteLeague = { country: string; league: string; teamCount: number };

export type FavoriteTeamCandidate = { country: string; league: string; team: string; favoriteId: number | null };
