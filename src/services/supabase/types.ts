import { MatchStatus } from '@/src/domain/models';

export type DbTeamRow = {
  id: string;
  name: string;
  short_name: string;
  fifa_code: string;
  country_code: string;
  group_code: string;
};

export type DbMatchRow = {
  id: string;
  stage: 'Group Stage';
  group_code: string;
  kickoff_utc: string;
  stadium: string;
  city: string;
  status: MatchStatus;
  home_score: number | null;
  away_score: number | null;
  home_team_id: string;
  away_team_id: string;
};

export type DbWatchLinkRow = {
  id: string;
  match_id: string;
  country_code: string;
  provider_name: string;
  provider_url: string;
  platform_type: string;
  is_official: boolean;
  priority: number;
};

export type DbFanRoomRow = {
  id: string;
  title: string;
  description: string;
  match_id: string;
  room_type: 'global' | 'country' | 'restaurant';
};

export type DbChatMessageRow = {
  id: string;
  room_id: string;
  user_id: string | null;
  author_name: string;
  body: string;
  created_at: string;
  moderation_state: 'clear' | 'flagged';
};

export type DbRestaurantRow = {
  id: string;
  name: string;
  city: string;
  country_code: string;
  maps_url: string;
  whatsapp_url: string;
  social_url: string;
  capacity: number;
  offer_text: string;
  approval_state: 'pending' | 'approved' | 'rejected';
  verified_status: boolean;
  ambassador_code: string;
  submitted_by: string | null;
  boosted: boolean;
};

export type DbRestaurantMatchRow = {
  restaurant_id: string;
  match_id: string;
};

export type DbLeaderboardEntryRow = {
  id: string;
  user_id: string;
  display_name: string;
  country_code: string;
  rank: number;
  total_points: number;
  exact_scores: number;
  correct_results: number;
  streak_value: number;
  scope: 'country' | 'friends';
};

export type DbProfileRow = {
  id: string;
  display_name: string | null;
  country_code: string | null;
  favorite_team_ids: string[] | null;
  notification_prefs: {
    matchStarting?: boolean;
    predictionClosing?: boolean;
    favoriteTeamKickoff?: boolean;
    restaurantReminders?: boolean;
  } | null;
};

export type DbPredictionRow = {
  match_id: string;
  predicted_home_score: number;
  predicted_away_score: number;
  predicted_winner_team_id: string | null;
  first_scorer: string | null;
  submitted_at: string;
};