import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/src/components/Card';
import { Screen } from '@/src/components/Screen';
import { SectionHeader } from '@/src/components/SectionHeader';
import { countries, teams } from '@/src/data/mock';
import { useAppServices } from '@/src/services/mockApi';
import { useSessionStore } from '@/src/store/session';
import { palette, spacing, typography } from '@/src/theme';
import { toFlag } from '@/src/utils/flags';

export default function MoreScreen() {
  const appServices = useAppServices();
  const authUser = useSessionStore((state) => state.authUser);
  const countryCode = useSessionStore((state) => state.countryCode || 'US');
  const favoriteTeamIds = useSessionStore((state) => state.favoriteTeamIds);
  const premiumTier = useSessionStore((state) => state.premiumTier);
  const notificationPrefs = useSessionStore((state) => state.notificationPrefs);
  const enableAdminPreview = useSessionStore((state) => state.enableAdminPreview);
  const reset = useSessionStore((state) => state.reset);

  const favoriteTeams = teams.filter((team) => favoriteTeamIds.includes(team.id));
  const country = countries.find((entry) => entry.code === countryCode);

  return (
    <Screen>
      <Screen.Hero eyebrow="More" title="Settings, reminders, and admin preview" description="CupHub keeps fast entry first, then exposes deeper controls for premium, compliance, and operations." />

      <Card>
        <SectionHeader title="Profile snapshot" subtitle="Guest-first mode stays enabled until Supabase auth is connected." />
        <Text style={styles.primaryLine}>{country ? `${toFlag(country.code)} ${country.name}` : 'Global viewer'}</Text>
        <Text style={styles.secondaryLine}>Favorite teams: {favoriteTeams.map((team) => team.shortName).join(', ') || 'None selected yet'}</Text>
        <Text style={styles.secondaryLine}>Premium tier: {premiumTier}</Text>
        <Text style={styles.secondaryLine}>Auth: {authUser ? (authUser.isAnonymous ? 'Anonymous Supabase guest' : authUser.email ?? 'Authenticated fan') : 'Local guest mode'}</Text>
      </Card>

      <Card>
        <SectionHeader title="Notifications" subtitle="Permission request is live; remote triggers remain a placeholder." />
        <View style={styles.settingList}>
          <Text style={styles.secondaryLine}>Match reminders: {notificationPrefs.matchStarting ? 'On' : 'Off'}</Text>
          <Text style={styles.secondaryLine}>Prediction close reminders: {notificationPrefs.predictionClosing ? 'On' : 'Off'}</Text>
          <Text style={styles.secondaryLine}>Favorite team reminders: {notificationPrefs.favoriteTeamKickoff ? 'On' : 'Off'}</Text>
        </View>
        <Pressable
          style={styles.actionButton}
          onPress={async () => {
            const response = await Notifications.requestPermissionsAsync();
            Alert.alert('Notifications', response.granted ? 'Permissions granted.' : 'Permissions not granted.');
          }}>
          <Text style={styles.actionLabel}>Request Notification Permission</Text>
        </Pressable>
      </Card>

      <Card>
        <SectionHeader title="Operations" subtitle="Protected admin is shipped as an in-app preview for the MVP." />
        <Pressable
          style={styles.actionButton}
          onPress={() => {
            enableAdminPreview();
            router.push('/admin');
          }}>
          <Text style={styles.actionLabel}>Open Admin Preview</Text>
        </Pressable>
      </Card>

      <Card>
        <SectionHeader title="Authentication" subtitle="Supabase auth is live when EXPO_PUBLIC_DATA_MODE is set to supabase." />
        <Pressable
          style={styles.actionButton}
          onPress={async () => {
            const result = await appServices.auth.signOut();
            Alert.alert('Authentication', result.message);
          }}>
          <Text style={styles.actionLabel}>Sign Out</Text>
        </Pressable>
      </Card>

      <Card>
        <SectionHeader title="Compliance" subtitle="Keep the product policy-safe for store review." />
        <Text style={styles.secondaryLine}>CupHub does not host streams. Watch through official broadcasters where available.</Text>
        <Text style={styles.secondaryLine}>Predictions are points-only and never real-money betting.</Text>
      </Card>

      <Card>
        <SectionHeader title="Reset" subtitle="Useful while reviewing the onboarding flow during development." />
        <Pressable style={styles.resetButton} onPress={reset}>
          <Text style={styles.resetLabel}>Reset onboarding and local session</Text>
        </Pressable>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  primaryLine: {
    color: palette.text,
    fontSize: typography.subtitle,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  secondaryLine: {
    color: palette.textMuted,
    lineHeight: 22,
    marginBottom: 6,
  },
  settingList: {
    marginBottom: spacing.md,
  },
  actionButton: {
    borderRadius: 14,
    backgroundColor: palette.surfaceAccent,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  actionLabel: {
    color: palette.text,
    fontWeight: '800',
  },
  resetButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#8f3558',
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: 'rgba(143, 53, 88, 0.12)',
  },
  resetLabel: {
    color: '#f6b5cc',
    fontWeight: '800',
  },
});