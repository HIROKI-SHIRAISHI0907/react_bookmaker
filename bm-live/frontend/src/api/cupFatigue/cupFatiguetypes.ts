// 直近の大会（ACL など）出場（GET /v1/api/cup-fatigue）
export type CupFatiguePlayer = {
  playerName: string;
  jerseyNumber: string;
  role: string;
  /** スタメン / ベンチ（途中出場） */
  lineupType: string;
  /** 出場時間（分）。分からなければ null */
  minutes: number | null;
  subInMinute: string;
  subOutMinute: string;
  rating: string;
};

export type CupFatigueMatch = {
  mid: string;
  competitionName: string;
  round: string;
  /** JST, yyyy-MM-dd HH:mm */
  kickoff: string;
  /** 基準の日時との差（時間） */
  hours: number;
  /** 基準の日時との差（日。試合日どうし） */
  days: number;
  side: "HOME" | "AWAY";
  opponent: string;
  teamScore: number | null;
  opponentScore: number | null;
  /** 出場選手を登録済みか */
  registered: boolean;
  starterCount: number;
  playedCount: number;
  players: CupFatiguePlayer[];
};

export type CupTeamFatigue = {
  team: string;
  cupTeam: boolean;
  competitions: string | null;
  recent: CupFatigueMatch[];
  upcoming: CupFatigueMatch[];
};

export type CupFatigueResponse = {
  found: boolean;
  baseTime: string;
  days: number;
  home: CupTeamFatigue;
  away: CupTeamFatigue;
};
