import { ChatMessage, MatchFilters, NotificationPrefs, Prediction, PremiumTier } from '@/src/domain/models';
import { BootstrapCallbacks } from '@/src/services/contracts';
import {
    bootstrapSupabaseServices,
    continueAsGuest,
    recalculateLeaderboards,
    sendMagicLink,
    sendRoomMessage,
    setRestaurantApproval,
    setRestaurantBoost,
    signInWithGoogle,
    signOut,
    submitRestaurantOnboarding,
    updateFixture,
    upsertWatchLink,
} from '@/src/services/supabase/runtime';
import { useAppDataStore } from '@/src/store/appData';
import { sameLocalDay, withinNextDays } from '@/src/utils/date';

export const appServices = {
  teams: {
    getFavoriteTeamOptions(teamIds: string[]) {
      return useAppDataStore.getState().teams.filter((team) => teamIds.includes(team.id));
    },
  },
  matches: {
    getTodayMatchesByCountry(_countryCode?: string) {
      const matches = useAppDataStore.getState().matches;
      const today = new Date();
      const todayMatches = matches.filter((match) => sameLocalDay(new Date(match.kickoffUtc), today));
      return todayMatches.length > 0 ? todayMatches : matches.slice(0, 4);
    },
    getNextMatch() {
      const matches = useAppDataStore.getState().matches;
      return matches.find((match) => new Date(match.kickoffUtc).getTime() > Date.now()) ?? matches[0];
    },
    getFixtures(filters: MatchFilters) {
      const matches = useAppDataStore.getState().matches;
      return matches.filter((match) => {
        if (filters.groupCode && filters.groupCode !== 'All' && match.groupCode !== filters.groupCode) {
          return false;
        }
        if (filters.teamId && match.homeTeam.id !== filters.teamId && match.awayTeam.id !== filters.teamId) {
          return false;
        }
        if (filters.dateWindow === 'Today' && !sameLocalDay(new Date(match.kickoffUtc), new Date())) {
          return false;
        }
        if (filters.dateWindow === 'Next 3 days' && !withinNextDays(match.kickoffUtc, 3)) {
          return false;
        }
        return true;
      });
    },
    getMatchById(id: string) {
      const matches = useAppDataStore.getState().matches;
      return matches.find((match) => match.id === id);
    },
    getWatchLinksForMatchAndCountry(matchId: string, countryCode: string) {
      const watchLinks = useAppDataStore.getState().watchLinks;
      const scoped = watchLinks.filter((link) => link.matchId === matchId && link.countryCode === countryCode);
      return scoped.length > 0 ? scoped : watchLinks.filter((link) => link.matchId === matchId && link.countryCode === 'DEFAULT');
    },
  },
  predictions: {
    getLeaderboard(scope: 'country' | 'friends', countryCode: string) {
      const leaderboardEntries = useAppDataStore.getState().leaderboardEntries;
      const base = leaderboardEntries.filter((entry) => entry.scope === scope);
      if (scope === 'country') {
        return base.filter((entry) => entry.countryCode === countryCode || entry.rank <= 4);
      }
      return base;
    },
  },
  fanRooms: {
    getRoomByMatchId(matchId: string) {
      const fanRooms = useAppDataStore.getState().fanRooms;
      return fanRooms.find((room) => room.matchId === matchId);
    },
    getMessages(roomId: string): ChatMessage[] {
      const chatMessages = useAppDataStore.getState().chatMessages;
      return chatMessages.filter((message) => message.roomId === roomId);
    },
    async sendMessage(payload: { roomId: string; body: string; fallbackAuthorName?: string }) {
      const result = await sendRoomMessage(payload);

      if (result.ok && result.message === 'Stored locally in mock mode.') {
        useAppDataStore.getState().upsertChatMessage({
          id: `local-${Date.now()}`,
          roomId: payload.roomId,
          authorName: payload.fallbackAuthorName ?? 'You',
          body: payload.body,
          createdAt: new Date().toISOString(),
          moderationState: 'clear',
        });
      }

      return result;
    },
  },
  restaurants: {
    listRestaurants(filters: { countryCode?: string }) {
      const restaurants = useAppDataStore.getState().restaurants;
      return restaurants.filter((restaurant) => !filters.countryCode || restaurant.countryCode === filters.countryCode || restaurant.boosted);
    },
    getRestaurantById(id: string) {
      const restaurants = useAppDataStore.getState().restaurants;
      return restaurants.find((restaurant) => restaurant.id === id);
    },
    getMatchesForRestaurant(id: string) {
      const restaurants = useAppDataStore.getState().restaurants;
      const matches = useAppDataStore.getState().matches;
      const restaurant = restaurants.find((entry) => entry.id === id);
      return matches.filter((match) => restaurant?.matchIds.includes(match.id));
    },
    submitOnboarding: submitRestaurantOnboarding,
  },
  monetization: {
    listProducts() {
      return useAppDataStore.getState().products;
    },
    shouldShowAds(premiumTier: PremiumTier) {
      return premiumTier === 'free';
    },
  },
  notifications: {
    defaultPreferences(): NotificationPrefs {
      return {
        matchStarting: true,
        predictionClosing: true,
        favoriteTeamKickoff: true,
        restaurantReminders: false,
      };
    },
  },
  admin: {
    getPredictionCounts() {
      return useAppDataStore.getState().predictionCount;
    },
    approveRestaurant: (restaurantId: string) => setRestaurantApproval(restaurantId, 'approved'),
    rejectRestaurant: (restaurantId: string) => setRestaurantApproval(restaurantId, 'rejected'),
    setRestaurantBoost,
    updateFixture,
    upsertWatchLink,
    recalculateLeaderboards,
  },
  auth: {
    continueAsGuest,
    signInWithGoogle,
    sendMagicLink,
    signOut,
  },
};

export function useAppServices() {
  useAppDataStore((state) => state.revision);
  return appServices;
}

export function useAppDataStatus() {
  const mode = useAppDataStore((state) => state.mode);
  const status = useAppDataStore((state) => state.status);
  const errorMessage = useAppDataStore((state) => state.errorMessage);

  return {
    mode,
    status,
    errorMessage,
  };
}

export async function bootstrapAppServices(callbacks: BootstrapCallbacks = {}) {
  return bootstrapSupabaseServices(callbacks);
}

export function computePredictionWinner(prediction: Pick<Prediction, 'predictedHomeScore' | 'predictedAwayScore'>, homeTeamId: string, awayTeamId: string) {
  if (prediction.predictedHomeScore === prediction.predictedAwayScore) {
    return null;
  }

  return prediction.predictedHomeScore > prediction.predictedAwayScore ? homeTeamId : awayTeamId;
}