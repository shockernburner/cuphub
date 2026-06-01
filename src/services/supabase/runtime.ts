import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { products } from '@/src/data/mock';
import { NotificationPrefs, Prediction } from '@/src/domain/models';
import { BootstrapCallbacks, ServiceResult } from '@/src/services/contracts';
import { getSupabaseClient, isSupabaseEnabled } from '@/src/services/supabase/client';
import { mapAuthUser, mapChatMessageRow, mapFanRoomRow, mapLeaderboardRow, mapMatchRows, mapPredictionRows, mapProfileRow, mapRestaurantRows, mapTeamRow, mapWatchLinkRow } from '@/src/services/supabase/mappers';
import { DbChatMessageRow, DbFanRoomRow, DbLeaderboardEntryRow, DbMatchRow, DbPredictionRow, DbProfileRow, DbRestaurantMatchRow, DbRestaurantRow, DbTeamRow, DbWatchLinkRow } from '@/src/services/supabase/types';
import { useAppDataStore } from '@/src/store/appData';

WebBrowser.maybeCompleteAuthSession();

export async function bootstrapSupabaseServices(callbacks: BootstrapCallbacks = {}) {
  if (!isSupabaseEnabled()) {
    useAppDataStore.getState().resetToMock();
    callbacks.onAuthUserChanged?.(null);
    callbacks.onUserStateHydrated?.(null);
    return () => undefined;
  }

  const client = getSupabaseClient();

  if (!client) {
    useAppDataStore.getState().resetToMock();
    return () => undefined;
  }

  useAppDataStore.getState().setMode('supabase');
  useAppDataStore.getState().setStatus('loading');

  const { data: sessionData } = await client.auth.getSession();
  callbacks.onAuthUserChanged?.(mapAuthUser(sessionData.session?.user ?? null));

  if (sessionData.session?.user) {
    await hydrateUserState(callbacks, defaultNotificationPrefs());
  }

  await refreshSupabaseSnapshot();

  const authListener = client.auth.onAuthStateChange(async (_event, session) => {
    callbacks.onAuthUserChanged?.(mapAuthUser(session?.user ?? null));

    if (session?.user) {
      await hydrateUserState(callbacks, defaultNotificationPrefs());
    } else {
      callbacks.onUserStateHydrated?.(null);
    }

    await refreshSupabaseSnapshot();
  });

  const channel = client
    .channel('cuphub-chat')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, (payload) => {
      if (payload.eventType === 'DELETE') {
        useAppDataStore.getState().removeChatMessage(String(payload.old.id));
        return;
      }

      useAppDataStore.getState().upsertChatMessage(mapChatMessageRow(payload.new as DbChatMessageRow));
    })
    .subscribe();

  return () => {
    authListener.data.subscription.unsubscribe();
    client.removeChannel(channel);
  };
}

export async function refreshSupabaseSnapshot() {
  const client = getSupabaseClient();

  if (!client) {
    return;
  }

  const store = useAppDataStore.getState();
  store.setStatus('loading');

  const [
    teamsResponse,
    matchesResponse,
    watchLinksResponse,
    fanRoomsResponse,
    chatMessagesResponse,
    restaurantsResponse,
    restaurantMatchesResponse,
    leaderboardResponse,
    predictionCountResponse,
  ] = await Promise.all([
    client.from('teams').select('*').order('group_code', { ascending: true }),
    client.from('matches').select('*').order('kickoff_utc', { ascending: true }),
    client.from('watch_links').select('*').order('priority', { ascending: true }),
    client.from('fan_rooms').select('*'),
    client.from('chat_messages').select('*').order('created_at', { ascending: true }).limit(300),
    client.from('restaurants').select('*'),
    client.from('restaurant_matches').select('*'),
    client.from('leaderboard_entries').select('*').order('rank', { ascending: true }),
    client.from('predictions').select('id', { count: 'exact', head: true }),
  ]);

  const error = [
    teamsResponse.error,
    matchesResponse.error,
    watchLinksResponse.error,
    fanRoomsResponse.error,
    chatMessagesResponse.error,
    restaurantsResponse.error,
    restaurantMatchesResponse.error,
    leaderboardResponse.error,
    predictionCountResponse.error,
  ].find(Boolean);

  if (error) {
    store.setError(error.message);
    return;
  }

  const mappedTeams = (teamsResponse.data as DbTeamRow[]).map(mapTeamRow);
  const teamMap = new Map(mappedTeams.map((team) => [team.id, team]));

  store.applySnapshot({
    teams: mappedTeams,
    matches: mapMatchRows(matchesResponse.data as DbMatchRow[], teamMap),
    watchLinks: (watchLinksResponse.data as DbWatchLinkRow[]).map(mapWatchLinkRow),
    fanRooms: (fanRoomsResponse.data as DbFanRoomRow[]).map(mapFanRoomRow),
    chatMessages: (chatMessagesResponse.data as DbChatMessageRow[]).map(mapChatMessageRow),
    restaurants: mapRestaurantRows(restaurantsResponse.data as DbRestaurantRow[], restaurantMatchesResponse.data as DbRestaurantMatchRow[]),
    leaderboardEntries: (leaderboardResponse.data as DbLeaderboardEntryRow[]).map(mapLeaderboardRow),
    products,
    predictionCount: predictionCountResponse.count ?? store.predictionCount,
  });
}

export async function continueAsGuest(): Promise<ServiceResult> {
  const client = getSupabaseClient();

  if (!client) {
    return { ok: true, message: 'Continuing with local guest mode.' };
  }

  const { data: sessionData } = await client.auth.getSession();

  if (sessionData.session?.user) {
    return { ok: true, message: 'Existing Supabase session found.' };
  }

  const { error } = await client.auth.signInAnonymously();

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: 'Anonymous Supabase session created.' };
}

export async function signInWithGoogle(): Promise<ServiceResult> {
  const client = getSupabaseClient();

  if (!client) {
    return { ok: false, message: 'Supabase auth is not configured. Set EXPO_PUBLIC_DATA_MODE=supabase and add your project keys.' };
  }

  const redirectTo = Linking.createURL('/');
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data?.url) {
    return { ok: false, message: error?.message ?? 'Unable to start Google sign-in.' };
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type !== 'success' || !result.url) {
    return { ok: false, message: 'Google sign-in was cancelled.' };
  }

  const parsed = Linking.parse(result.url);
  const accessToken = typeof parsed.queryParams?.access_token === 'string' ? parsed.queryParams.access_token : null;
  const refreshToken = typeof parsed.queryParams?.refresh_token === 'string' ? parsed.queryParams.refresh_token : null;

  if (!accessToken || !refreshToken) {
    return { ok: false, message: 'Google sign-in completed without a session payload.' };
  }

  const { error: sessionError } = await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });

  if (sessionError) {
    return { ok: false, message: sessionError.message };
  }

  return { ok: true, message: 'Google sign-in complete.' };
}

export async function sendMagicLink(email: string): Promise<ServiceResult> {
  const client = getSupabaseClient();

  if (!client) {
    return { ok: false, message: 'Supabase auth is not configured.' };
  }

  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: Linking.createURL('/'),
    },
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: `Magic link sent to ${email}.` };
}

export async function submitRestaurantOnboarding(payload: {
  name: string;
  city: string;
  countryCode: string;
  mapsUrl: string;
  whatsAppNumber: string;
  socialUrl: string;
  capacity: number;
  matchIds: string[];
  offerText: string;
  ambassadorCode: string;
}): Promise<ServiceResult> {
  const client = getSupabaseClient();

  if (!client) {
    return { ok: true, message: 'Restaurant saved locally in mock mode.' };
  }

  const guestResult = await continueAsGuest();

  if (!guestResult.ok) {
    return guestResult;
  }

  const { data: userData } = await client.auth.getUser();

  const restaurantId = `rest-${Date.now()}`;
  const { error: restaurantError } = await client.from('restaurants').insert({
    id: restaurantId,
    name: payload.name,
    city: payload.city,
    country_code: payload.countryCode,
    maps_url: payload.mapsUrl,
    whatsapp_url: payload.whatsAppNumber.startsWith('http') ? payload.whatsAppNumber : `https://wa.me/${payload.whatsAppNumber.replace(/\D/g, '')}`,
    social_url: payload.socialUrl,
    capacity: payload.capacity,
    offer_text: payload.offerText,
    approval_state: 'pending',
    verified_status: false,
    ambassador_code: payload.ambassadorCode || 'CUPHUB',
    submitted_by: userData.user?.id ?? null,
    boosted: false,
  });

  if (restaurantError) {
    return { ok: false, message: restaurantError.message };
  }

  if (payload.matchIds.length > 0) {
    const { error: matchError } = await client.from('restaurant_matches').insert(
      payload.matchIds.map((matchId) => ({ restaurant_id: restaurantId, match_id: matchId }))
    );

    if (matchError) {
      return { ok: false, message: matchError.message };
    }
  }

  await refreshSupabaseSnapshot();
  return { ok: true, message: 'Restaurant submitted for approval.' };
}

export async function signOut(): Promise<ServiceResult> {
  const client = getSupabaseClient();

  if (!client) {
    return { ok: true, message: 'Local guest mode cleared.' };
  }

  const { error } = await client.auth.signOut();

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: 'Signed out.' };
}

export async function persistOnboardingProfile(payload: {
  countryCode: string;
  favoriteTeamIds: string[];
  notificationPrefs: NotificationPrefs;
}) {
  const client = getSupabaseClient();

  if (!client) {
    return;
  }

  const { data } = await client.auth.getUser();

  if (!data.user) {
    return;
  }

  await client.from('profiles').upsert(
    {
      id: data.user.id,
      display_name: data.user.user_metadata?.full_name ?? data.user.email ?? 'CupHub Fan',
      country_code: payload.countryCode,
      favorite_team_ids: payload.favoriteTeamIds,
      notification_prefs: payload.notificationPrefs,
    },
    { onConflict: 'id' }
  );
}

export async function persistPrediction(payload: Prediction) {
  const client = getSupabaseClient();

  if (!client) {
    return;
  }

  const { data } = await client.auth.getUser();

  if (!data.user) {
    return;
  }

  await client.from('predictions').upsert(
    {
      user_id: data.user.id,
      match_id: payload.matchId,
      predicted_home_score: payload.predictedHomeScore,
      predicted_away_score: payload.predictedAwayScore,
      predicted_winner_team_id: payload.predictedWinnerTeamId,
      first_scorer: payload.firstScorer || null,
      submitted_at: payload.submittedAt,
    },
    { onConflict: 'user_id,match_id' }
  );
}

export async function sendRoomMessage(payload: { roomId: string; body: string; fallbackAuthorName?: string }): Promise<ServiceResult> {
  const client = getSupabaseClient();

  if (!client) {
    return { ok: true, message: 'Stored locally in mock mode.' };
  }

  const { data } = await client.auth.getUser();

  if (!data.user) {
    return { ok: false, message: 'Sign in or continue as guest before posting in realtime fan rooms.' };
  }

  const { data: inserted, error } = await client
    .from('chat_messages')
    .insert({
      room_id: payload.roomId,
      user_id: data.user.id,
      author_name: data.user.user_metadata?.full_name ?? data.user.email ?? payload.fallbackAuthorName ?? 'CupHub Fan',
      body: payload.body,
    })
    .select('*')
    .single();

  if (error) {
    return { ok: false, message: error.message };
  }

  useAppDataStore.getState().upsertChatMessage(mapChatMessageRow(inserted as DbChatMessageRow));
  return { ok: true, message: 'Message sent.' };
}

export async function setRestaurantApproval(restaurantId: string, approvalState: 'approved' | 'rejected'): Promise<ServiceResult> {
  const client = getSupabaseClient();

  if (!client) {
    return { ok: true, message: `Restaurant marked ${approvalState} in mock mode.` };
  }

  const { error } = await client.from('restaurants').update({ approval_state: approvalState }).eq('id', restaurantId);

  if (error) {
    return { ok: false, message: error.message };
  }

  await refreshSupabaseSnapshot();
  return { ok: true, message: `Restaurant ${approvalState}.` };
}

export async function setRestaurantBoost(restaurantId: string, boosted: boolean): Promise<ServiceResult> {
  const client = getSupabaseClient();

  if (!client) {
    return { ok: true, message: boosted ? 'Restaurant boosted in mock mode.' : 'Restaurant boost removed in mock mode.' };
  }

  const { error } = await client.from('restaurants').update({ boosted }).eq('id', restaurantId);

  if (error) {
    return { ok: false, message: error.message };
  }

  await refreshSupabaseSnapshot();
  return { ok: true, message: boosted ? 'Restaurant boosted.' : 'Restaurant unboosted.' };
}

export async function updateFixture(payload: {
  matchId: string;
  status?: 'upcoming' | 'live' | 'full-time';
  homeScore?: number | null;
  awayScore?: number | null;
}): Promise<ServiceResult> {
  const client = getSupabaseClient();
  const hasHomeScore = payload.homeScore !== undefined;
  const hasAwayScore = payload.awayScore !== undefined;

  if (hasHomeScore !== hasAwayScore) {
    return { ok: false, message: 'Provide both home and away scores together.' };
  }

  if (payload.status === 'full-time' && (payload.homeScore == null || payload.awayScore == null)) {
    return { ok: false, message: 'Finalized fixtures require both scores.' };
  }

  if (!client) {
    return { ok: true, message: 'Fixture updated in mock mode.' };
  }

  const updatePayload: Record<string, number | string | null> = {};

  if (payload.status) {
    updatePayload.status = payload.status;
  }

  if (payload.status === 'upcoming') {
    updatePayload.home_score = null;
    updatePayload.away_score = null;
  } else {
    if (payload.homeScore !== undefined) {
      updatePayload.home_score = payload.homeScore;
    }

    if (payload.awayScore !== undefined) {
      updatePayload.away_score = payload.awayScore;
    }
  }

  const { error } = await client.from('matches').update(updatePayload).eq('id', payload.matchId);

  if (error) {
    return { ok: false, message: error.message };
  }

  if (payload.status === 'full-time') {
    const leaderboardResult = await recalculateLeaderboards();

    if (!leaderboardResult.ok) {
      return leaderboardResult;
    }

    return { ok: true, message: 'Fixture marked full-time and leaderboards refreshed.' };
  }

  await refreshSupabaseSnapshot();
  return { ok: true, message: payload.status ? `Fixture updated to ${payload.status}.` : 'Fixture scores updated.' };
}

export async function upsertWatchLink(payload: {
  matchId: string;
  countryCode: string;
  providerName: string;
  providerUrl: string;
  platformType?: string;
}): Promise<ServiceResult> {
  const client = getSupabaseClient();

  if (!client) {
    return { ok: true, message: 'Watch link stored in mock mode.' };
  }

  const { error } = await client.from('watch_links').insert({
    match_id: payload.matchId,
    country_code: payload.countryCode,
    provider_name: payload.providerName,
    provider_url: payload.providerUrl,
    platform_type: payload.platformType ?? 'Official streaming / broadcaster',
    is_official: true,
    priority: 0,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  await refreshSupabaseSnapshot();
  return { ok: true, message: 'Watch link added.' };
}

export async function recalculateLeaderboards(): Promise<ServiceResult> {
  const client = getSupabaseClient();

  if (!client) {
    return { ok: true, message: 'Leaderboard recalculated in mock mode.' };
  }

  const { error } = await client.rpc('recalculate_leaderboards');

  if (error) {
    return { ok: false, message: error.message };
  }

  await refreshSupabaseSnapshot();
  return { ok: true, message: 'Leaderboards recalculated.' };
}

async function hydrateUserState(callbacks: BootstrapCallbacks, fallbackPrefs: NotificationPrefs) {
  const client = getSupabaseClient();

  if (!client) {
    return;
  }

  const { data: userData } = await client.auth.getUser();

  if (!userData.user) {
    callbacks.onUserStateHydrated?.(null);
    return;
  }

  const [profileResponse, predictionsResponse] = await Promise.all([
    client.from('profiles').select('*').eq('id', userData.user.id).maybeSingle(),
    client.from('predictions').select('*').eq('user_id', userData.user.id),
  ]);

  if (profileResponse.error || predictionsResponse.error) {
    return;
  }

  const mappedProfile = mapProfileRow(profileResponse.data as DbProfileRow | null, fallbackPrefs);

  callbacks.onUserStateHydrated?.({
    countryCode: mappedProfile.countryCode,
    favoriteTeamIds: mappedProfile.favoriteTeamIds,
    notificationPrefs: mappedProfile.notificationPrefs,
    predictions: mapPredictionRows((predictionsResponse.data as DbPredictionRow[]) ?? []),
  });
}

function defaultNotificationPrefs(): NotificationPrefs {
  return {
    matchStarting: true,
    predictionClosing: true,
    favoriteTeamKickoff: true,
    restaurantReminders: false,
  };
}