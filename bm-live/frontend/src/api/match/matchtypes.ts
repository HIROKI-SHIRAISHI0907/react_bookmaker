// 試合詳細（/v1/api/match-detail）の型
import type { DashboardForecast } from "../dashboard/types";

export type MatchStat = {
  key: string;
  label: string;
  home: string | null;
  away: string | null;
  homeValue: number | null;
  awayValue: number | null;
};

export type MatchTimelinePoint = {
  minute: number;
  label: string | null;
  homeScore: number | null;
  awayScore: number | null;
  homeXg: number | null;
  awayXg: number | null;
  homeShots: number | null;
  awayShots: number | null;
  homeRank: number | null;
  awayRank: number | null;
};

export type MatchGoal = { minute: number; label: string | null; side: "H" | "A"; homeScore: number; awayScore: number };

export type MatchRankChange = {
  minute: number;
  label: string | null;
  homeRank: number | null;
  awayRank: number | null;
  /** マイナス = 順位が上がった */
  homeDelta: number | null;
  awayDelta: number | null;
  homeScore: number | null;
  awayScore: number | null;
};

export type MatchInfo = {
  stadium: string | null;
  location: string | null;
  capacity: string | null;
  audience: string | null;
  referee: string | null;
  weather: string | null;
  temperature: string | null;
  humidity: string | null;
  homeManager: string | null;
  awayManager: string | null;
  homeFormation: string | null;
  awayFormation: string | null;
  goalTime: string | null;
  goalMember: string | null;
};

/** スタジアムの地理情報（team_location_master） */
export type MatchVenue = {
  /** STADIUM: スタジアム名で一致 / HOME_TEAM: ホームチームのホームスタジアム（中立地開催の可能性あり） */
  matchedBy: "STADIUM" | "HOME_TEAM";
  stadiumName: string | null;
  stadiumNameEn: string | null;
  homeCity: string | null;
  homeCityEn: string | null;
  country: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  placeId: string | null;
  teamName: string | null;
  mapUrl: string | null;
};

export type MatchDetailResponse = {
  found: boolean;
  loggedIn: boolean;
  seqKey: string;
  matchId: string | null;
  country: string | null;
  league: string | null;
  leagueLabel: string | null;
  roundLabel: string | null;
  status: "LIVE" | "HT" | "FINISHED" | "OTHER" | null;
  minuteLabel: string | null;
  homeTeam: string | null;
  awayTeam: string | null;
  homeScore: number | null;
  awayScore: number | null;
  homeRank: number | null;
  awayRank: number | null;
  recordTime: string | null;
  /** ライブ中だけ */
  forecast: DashboardForecast | null;
  stats: MatchStat[];
  timeline: MatchTimelinePoint[];
  goals: MatchGoal[];
  rankChanges: MatchRankChange[];
  info: MatchInfo;
  /** スタジアムの地理情報（team_location_master に無ければ null） */
  venue: MatchVenue | null;
};

// ===================== 統計詳細データ（/v1/api/match-detail/extra） =====================
// B016 が登録した match_detail_* の内容。値は文字列のまま（数値は画面で解釈する）。side は "HOME" / "AWAY"

export type DetailSide = "HOME" | "AWAY" | string | null;

export type DetailHalf = { half: string | null; score: string | null };

export type DetailMomentum = {
  half: string | null;
  minuteLabel: string | null;
  minute: string | null;
  addedMinute: string | null;
  side: DetailSide;
  value: string | null;
  signedValue: string | null;
};

export type DetailMomentumIncident = { type: string | null; minuteLabel: string | null; minute: string | null; side: DetailSide };

export type DetailEvent = {
  half: string | null;
  timeLabel: string | null;
  minute: string | null;
  addedMinute: string | null;
  side: DetailSide;
  type: string | null;
  player: string | null;
  subOutPlayer: string | null;
  score: string | null;
  note: string | null;
  assist: string | null;
  description: string | null;
};

export type DetailGoal = {
  timeLabel: string | null;
  minute: string | null;
  addedMinute: string | null;
  half: string | null;
  side: DetailSide;
  scorer: string | null;
  scorerTeam: string | null;
  ownGoal: boolean;
  penalty: boolean;
  assist: string | null;
  score: string | null;
};

export type DetailFormation = {
  side: DetailSide;
  teamName: string | null;
  formation: string | null;
  averageRating: string | null;
  coach: string | null;
  coachNationality: string | null;
};

export type DetailLineup = {
  side: DetailSide;
  /** スタメン / ベンチ */
  lineupType: string | null;
  playerId: string | null;
  number: string | null;
  name: string | null;
  nationality: string | null;
  role: string | null;
  played: boolean;
  subInMinute: string | null;
  subInFor: string | null;
  subOutMinute: string | null;
  subOutFor: string | null;
  rating: string | null;
  /** ピッチ上の行（1 = GK 側）。スタメンだけ */
  pitchRow: string | null;
  pitchCol: string | null;
  goals: string | null;
  ownGoals: string | null;
  /** "goal-soccer×2/yellow-card" のような出来事 */
  events: string | null;
};

export type DetailMissing = { side: DetailSide; name: string | null; nationality: string | null; reason: string | null };

export type DetailPlayerStat = {
  playerId: string | null;
  name: string | null;
  position: string | null;
  side: DetailSide;
  rating: string | null;
  minutes: string | null;
  goals: string | null;
  assists: string | null;
  xg: string | null;
  xa: string | null;
  shots: string | null;
  shotsOnTarget: string | null;
  bigChancesCreated: string | null;
  keyPasses: string | null;
  passesAccurate: string | null;
  passesFinalThird: string | null;
  longBalls: string | null;
  crosses: string | null;
  touches: string | null;
  touchesBox: string | null;
  dribblesWon: string | null;
  duelsWon: string | null;
  duelsTotal: string | null;
  aerialsWon: string | null;
  tacklesWon: string | null;
  interceptions: string | null;
  clearances: string | null;
  foulsCommitted: string | null;
  foulsSuffered: string | null;
  yellowCards: string | null;
  redCards: string | null;
  saves: string | null;
  goalsConceded: string | null;
  goalsPrevented: string | null;
};

export type MatchDetailExtraResponse = {
  found: boolean;
  matchId: string | null;
  category: string | null;
  homeTeam: string | null;
  awayTeam: string | null;
  homeScore: string | null;
  awayScore: string | null;
  scrapeErrors: string | null;
  halves: DetailHalf[];
  momentum: DetailMomentum[];
  momentumIncidents: DetailMomentumIncident[];
  events: DetailEvent[];
  goals: DetailGoal[];
  formations: DetailFormation[];
  lineups: DetailLineup[];
  missing: DetailMissing[];
  playerStats: DetailPlayerStat[];
};
