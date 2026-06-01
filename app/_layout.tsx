import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { initializeAds } from '@/src/services/ads';
import { bootstrapAppServices } from '@/src/services/mockApi';
import { useSessionStore } from '@/src/store/session';

export {
    ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    void initializeAds();

    void bootstrapAppServices({
      onAuthUserChanged: (authUser) => {
        useSessionStore.getState().setAuthUser(authUser);
      },
      onUserStateHydrated: (payload) => {
        useSessionStore.getState().hydrateFromBackend(payload);
      },
    }).then((unsubscribe) => {
      cleanup = unsubscribe;
    });

    return () => {
      cleanup?.();
    };
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="match/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="fan-room/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="restaurants/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="restaurants/onboard" options={{ title: 'Restaurant Onboarding' }} />
        <Stack.Screen name="admin" options={{ title: 'CupHub Admin' }} />
      </Stack>
    </>
  );
}
