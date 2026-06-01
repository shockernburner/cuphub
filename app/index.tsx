import { Redirect } from 'expo-router';

import { Screen } from '@/src/components/Screen';
import { useSessionStore } from '@/src/store/session';

export default function IndexScreen() {
  const hasHydrated = useSessionStore((state) => state.hasHydrated);
  const hasCompletedOnboarding = useSessionStore((state) => state.hasCompletedOnboarding);

  if (!hasHydrated) {
    return (
      <Screen scrollable={false} contentContainerStyle={{ flex: 1, justifyContent: 'center' }}>
        <Screen.Hero eyebrow="CupHub" title="Loading your tournament HQ" description="Preparing today’s matches, predictions, and fan rooms." />
      </Screen>
    );
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}