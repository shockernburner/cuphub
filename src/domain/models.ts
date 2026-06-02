export type Country = {
  code: string;
  name: string;
};

export type Team = {
  id: string;
  name: string;
  shortName: string;
  fifaCode: string;
  countryCode: string;
  groupCode: string;
};

export type MatchStatus = 'upcoming' | 'live' | 'full-time';

export type Match = {
  id: string;
  stage: string;
  groupCode: string | null;
  kickoffUtc: string;
  stadium: string;
  city: string;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: Team;
  awayTeam: Team;
};

export type WatchLink = {
  id: string;
  matchId: string;
  countryCode: string;
  providerName: string;
  providerUrl: string;
  platformType: string;
  isOfficial: boolean;
  priority: number;
};

export type NotificationPrefs = {
  matchStarting: boolean;
  predictionClosing: boolean;
  favoriteTeamKickoff: boolean;
  restaurantReminders: boolean;
};

export type Prediction = {
  matchId: string;
  predictedHomeScore: number;
  predictedAwayScore: number;
  predictedWinnerTeamId: string | null;
  firstScorer: string;
  submittedAt: string;
};

export type LeaderboardEntry = {
  userId: string;
  displayName: string;
  countryCode: string;
  rank: number;
  totalPoints: number;
  exactScores: number;
  correctResults: number;
  streakValue: number;
  scope: 'country' | 'friends';
};

export type FanRoom = {
  id: string;
  title: string;
  description: string;
  matchId: string;
  roomType: 'global' | 'country' | 'restaurant';
};

export type ChatMessage = {
  id: string;
  roomId: string;
  authorName: string;
  body: string;
  createdAt: string;
  moderationState: 'clear' | 'flagged';
};

export type Restaurant = {
  id: string;
  name: string;
  city: string;
  countryCode: string;
  mapsUrl: string;
  whatsAppUrl: string;
  socialUrl: string;
  capacity: number;
  offerText: string;
  approvalState: 'pending' | 'approved' | 'rejected';
  verifiedStatus: boolean;
  ambassadorCode: string;
  submittedByUserId?: string | null;
  matchIds: string[];
  boosted: boolean;
};

export type Product = {
  code: string;
  name: string;
  description: string;
  priceLabel: string;
  entitlement: PremiumTier;
  bullets: string[];
};

export type PremiumTier = 'free' | 'ad-free' | 'tournament-pass' | 'fan-room-pack';

export type AuthUser = {
  id: string;
  email: string | null;
  isAnonymous: boolean;
};

export type MatchFilters = {
  countryCode?: string;
  groupCode?: string;
  teamId?: string;
  dateWindow?: string;
};