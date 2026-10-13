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
