import { AuthUser, ChatMessage, FanRoom, LeaderboardEntry, Match, NotificationPrefs, Prediction, Restaurant, Team, WatchLink } from '@/src/domain/models';
import { DbChatMessageRow, DbFanRoomRow, DbLeaderboardEntryRow, DbMatchRow, DbPredictionRow, DbProfileRow, DbRestaurantMatchRow, DbRestaurantRow, DbTeamRow, DbWatchLinkRow } from '@/src/services/supabase/types';

export function mapAuthUser(user: { id: string; email?: string | null; is_anonymous?: boolean } | null): AuthUser | null {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? null,
    isAnonymous: Boolean(user.is_anonymous),
  };
}

export function mapTeamRow(row: DbTeamRow): Team {
  return {
    id: row.id,
    name: row.name,
    shortName: row.short_name,
    fifaCode: row.fifa_code,
    countryCode: row.country_code,
    groupCode: row.group_code,
  };
}

export function mapMatchRows(rows: DbMatchRow[], teamMap: Map<string, Team>): Match[] {
  return rows
    .map((row) => {
      const homeTeam = teamMap.get(row.home_team_id);
      const awayTeam = teamMap.get(row.away_team_id);

      if (!homeTeam || !awayTeam) {
        return null;
      }

      return {
        id: row.id,
        stage: row.stage,
        groupCode: row.group_code,
        kickoffUtc: row.kickoff_utc,
        stadium: row.stadium,
        city: row.city,
        status: row.status,
        homeScore: row.home_score,
        awayScore: row.away_score,
        homeTeam,
        awayTeam,
      };
    })
    .filter((match): match is Match => Boolean(match));
}

export function mapWatchLinkRow(row: DbWatchLinkRow): WatchLink {
  return {
    id: row.id,
    matchId: row.match_id,
    countryCode: row.country_code,
    providerName: row.provider_name,
    providerUrl: row.provider_url,
    platformType: row.platform_type,
    isOfficial: row.is_official,
    priority: row.priority,
  };
}

export function mapFanRoomRow(row: DbFanRoomRow): FanRoom {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    matchId: row.match_id,
    roomType: row.room_type,
  };
}

export function mapChatMessageRow(row: DbChatMessageRow): ChatMessage {
  return {
    id: row.id,
    roomId: row.room_id,
    authorName: row.author_name,
    body: row.body,
    createdAt: row.created_at,
    moderationState: row.moderation_state,
  };
}

export function mapRestaurantRows(rows: DbRestaurantRow[], restaurantMatches: DbRestaurantMatchRow[]): Restaurant[] {
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    city: row.city,
    countryCode: row.country_code,
    mapsUrl: row.maps_url,
    whatsAppUrl: row.whatsapp_url,
    socialUrl: row.social_url,
    capacity: row.capacity,
    offerText: row.offer_text,
    approvalState: row.approval_state,
    verifiedStatus: row.verified_status,
    ambassadorCode: row.ambassador_code,
    submittedByUserId: row.submitted_by,
    matchIds: restaurantMatches.filter((entry) => entry.restaurant_id === row.id).map((entry) => entry.match_id),
    boosted: row.boosted,
  }));
}

export function mapLeaderboardRow(row: DbLeaderboardEntryRow): LeaderboardEntry {
  return {
    userId: row.user_id,
    displayName: row.display_name,
    countryCode: row.country_code,
    rank: row.rank,
    totalPoints: row.total_points,
    exactScores: row.exact_scores,
    correctResults: row.correct_results,
    streakValue: row.streak_value,
    scope: row.scope,
  };
}

export function mapProfileRow(row: DbProfileRow | null, fallback: NotificationPrefs) {
  return {
    countryCode: row?.country_code ?? null,
    favoriteTeamIds: row?.favorite_team_ids ?? [],
    notificationPrefs: {
      matchStarting: row?.notification_prefs?.matchStarting ?? fallback.matchStarting,
      predictionClosing: row?.notification_prefs?.predictionClosing ?? fallback.predictionClosing,
      favoriteTeamKickoff: row?.notification_prefs?.favoriteTeamKickoff ?? fallback.favoriteTeamKickoff,
      restaurantReminders: row?.notification_prefs?.restaurantReminders ?? fallback.restaurantReminders,
    },
  };
}

export function mapPredictionRows(rows: DbPredictionRow[]): Record<string, Prediction> {
  return rows.reduce<Record<string, Prediction>>((accumulator, row) => {
    accumulator[row.match_id] = {
      matchId: row.match_id,
      predictedHomeScore: row.predicted_home_score,
      predictedAwayScore: row.predicted_away_score,
      predictedWinnerTeamId: row.predicted_winner_team_id,
      firstScorer: row.first_scorer ?? '',
      submittedAt: row.submitted_at,
    };

    return accumulator;
  }, {});
}