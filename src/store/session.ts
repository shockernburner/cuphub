import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';

import { AuthUser, NotificationPrefs, Prediction, PremiumTier } from '@/src/domain/models';
import { appServices, computePredictionWinner } from '@/src/services/mockApi';
import { persistOnboardingProfile, persistPrediction } from '@/src/services/supabase/runtime';

type SessionState = {
  hasHydrated: boolean;
  hasCompletedOnboarding: boolean;
  countryCode: string | null;
  favoriteTeamIds: string[];
  notificationPrefs: NotificationPrefs;
  premiumTier: PremiumTier;
  authUser: AuthUser | null;
  isAdminPreview: boolean;
  predictions: Record<string, Prediction>;
  completeOnboarding: (payload: {
    countryCode: string;
    favoriteTeamIds: string[];
    notificationPrefs: NotificationPrefs;
  }) => void;
  hydrateFromBackend: (payload: {
    countryCode: string | null;
    favoriteTeamIds: string[];
    notificationPrefs: NotificationPrefs;
    predictions: Record<string, Prediction>;
  } | null) => void;
  savePrediction: (payload: {
    matchId: string;
    predictedHomeScore: number;
    predictedAwayScore: number;
    homeTeamId: string;
    awayTeamId: string;
    firstScorer: string;
  }) => void;
  setPremiumTier: (tier: PremiumTier) => void;
  setAuthUser: (authUser: AuthUser | null) => void;
  enableAdminPreview: () => void;
  reset: () => void;
};

const defaultNotificationPrefs = appServices.notifications.defaultPreferences();

const noopStorage: StateStorage = {
  getItem: async () => null,
  setItem: async () => undefined,
  removeItem: async () => undefined,
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      hasHydrated: false,
      hasCompletedOnboarding: false,
      countryCode: null,
      favoriteTeamIds: [],
      notificationPrefs: defaultNotificationPrefs,
      premiumTier: 'free',
      authUser: null,
      isAdminPreview: false,
      predictions: {},
      completeOnboarding: ({ countryCode, favoriteTeamIds, notificationPrefs }) => {
        set({ hasCompletedOnboarding: true, countryCode, favoriteTeamIds, notificationPrefs });
        void persistOnboardingProfile({ countryCode, favoriteTeamIds, notificationPrefs });
      },
      hydrateFromBackend: (payload) => {
        if (!payload) {
          return;
        }

        set((state) => ({
          hasCompletedOnboarding: Boolean(payload.countryCode) || payload.favoriteTeamIds.length > 0 || state.hasCompletedOnboarding,
          countryCode: payload.countryCode ?? state.countryCode,
          favoriteTeamIds: payload.favoriteTeamIds.length > 0 ? payload.favoriteTeamIds : state.favoriteTeamIds,
          notificationPrefs: payload.notificationPrefs,
          predictions: {
            ...state.predictions,
            ...payload.predictions,
          },
        }));
      },
      savePrediction: ({ matchId, predictedHomeScore, predictedAwayScore, homeTeamId, awayTeamId, firstScorer }) =>
        set((state) => ({
          predictions: {
            ...state.predictions,
            [matchId]: {
              matchId,
              predictedHomeScore,
              predictedAwayScore,
              predictedWinnerTeamId: computePredictionWinner({ predictedHomeScore, predictedAwayScore }, homeTeamId, awayTeamId),
              firstScorer,
              submittedAt: new Date().toISOString(),
            },
          },
        })),
      setPremiumTier: (premiumTier) => set({ premiumTier }),
      setAuthUser: (authUser) => set({ authUser }),
      enableAdminPreview: () => set({ isAdminPreview: true }),
      reset: () =>
        set({
          hasCompletedOnboarding: false,
          countryCode: null,
          favoriteTeamIds: [],
          notificationPrefs: defaultNotificationPrefs,
          premiumTier: 'free',
          authUser: null,
          isAdminPreview: false,
          predictions: {},
        }),
    }),
    {
      name: 'cuphub-session',
      storage: createJSONStorage(() => (typeof window === 'undefined' ? noopStorage : AsyncStorage)),
      onRehydrateStorage: () => () => {
        useSessionStore.setState({ hasHydrated: true });
      },
    }
  )
);

useSessionStore.subscribe((state, previousState) => {
  if (state.predictions === previousState.predictions) {
    return;
  }

  const latestPrediction = Object.values(state.predictions).sort((left, right) => left.submittedAt.localeCompare(right.submittedAt)).at(-1);

  if (!latestPrediction) {
    return;
  }

  const previousPrediction = previousState.predictions[latestPrediction.matchId];

  if (previousPrediction?.submittedAt === latestPrediction.submittedAt) {
    return;
  }

  void persistPrediction(latestPrediction);
});