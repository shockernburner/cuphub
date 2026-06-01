import { AuthUser, NotificationPrefs, Prediction } from '@/src/domain/models';

export type DataMode = 'mock' | 'supabase';

export type ServiceResult = {
  ok: boolean;
  message: string;
};

export type UserHydrationPayload = {
  countryCode: string | null;
  favoriteTeamIds: string[];
  notificationPrefs: NotificationPrefs;
  predictions: Record<string, Prediction>;
};

export type BootstrapCallbacks = {
  onAuthUserChanged?: (user: AuthUser | null) => void;
  onUserStateHydrated?: (payload: UserHydrationPayload | null) => void;
};