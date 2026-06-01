import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { Card } from '@/src/components/Card';
import { Screen } from '@/src/components/Screen';
import { SectionHeader } from '@/src/components/SectionHeader';
import { countries, teams } from '@/src/data/mock';
import { useAppServices } from '@/src/services/mockApi';
import { useSessionStore } from '@/src/store/session';
import { palette, spacing, typography } from '@/src/theme';
import { toFlag } from '@/src/utils/flags';

const featuredTeams = teams.slice(0, 12);

export default function OnboardingScreen() {
  const appServices = useAppServices();
  const authUser = useSessionStore((state) => state.authUser);
  const savedCountryCode = useSessionStore((state) => state.countryCode);
  const savedFavoriteTeamIds = useSessionStore((state) => state.favoriteTeamIds);
  const savedNotificationPrefs = useSessionStore((state) => state.notificationPrefs);
  const completeOnboarding = useSessionStore((state) => state.completeOnboarding);
  const [countryCode, setCountryCode] = useState(savedCountryCode || 'US');
  const [favoriteTeamIds, setFavoriteTeamIds] = useState<string[]>(savedFavoriteTeamIds);
  const [notificationPrefs, setNotificationPrefs] = useState(savedNotificationPrefs);
  const [email, setEmail] = useState('');

  const countryOptions = useMemo(() => countries.slice(0, 10), []);

  const toggleTeam = (teamId: string) => {
    setFavoriteTeamIds((current) =>
      current.includes(teamId) ? current.filter((item) => item !== teamId) : [...current, teamId].slice(0, 5)
    );
  };

  const finishGuestFlow = async () => {
    const result = await appServices.auth.continueAsGuest();

    if (!result.ok) {
      Alert.alert('Guest mode', result.message);
    }

    completeOnboarding({ countryCode, favoriteTeamIds, notificationPrefs });
    router.replace('/(tabs)');
  };

  return (
    <Screen>
      <Screen.Hero
        eyebrow="CupHub"
        title="World Cup matchday, built for one-hand use"
        description="Track fixtures, lock predictions before kickoff, join fan rooms, and find watch-party venues. CupHub does not host streams."
      />

      <Card>
        <SectionHeader title="Choose your country" subtitle="Official watch links are personalized by region where available." />
        <View style={styles.flowRow}>
          {countryOptions.map((country) => {
            const active = country.code === countryCode;
            return (
              <Pressable
                key={country.code}
                onPress={() => setCountryCode(country.code)}
                style={[styles.pill, active && styles.pillActive]}>
                <Text style={styles.pillEmoji}>{toFlag(country.code)}</Text>
                <Text style={[styles.pillLabel, active && styles.pillLabelActive]}>{country.name}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <SectionHeader title="Favorite teams" subtitle="Pick up to five teams for kickoff reminders and faster filtering." />
        <View style={styles.flowRow}>
          {featuredTeams.map((team) => {
            const active = favoriteTeamIds.includes(team.id);
            return (
              <Pressable key={team.id} onPress={() => toggleTeam(team.id)} style={[styles.pill, active && styles.pillActive]}>
                <Text style={styles.pillEmoji}>{toFlag(team.countryCode)}</Text>
                <Text style={[styles.pillLabel, active && styles.pillLabelActive]}>{team.shortName}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <SectionHeader title="Notifications" subtitle="Placeholders are wired through Expo Notifications and work without backend credentials." />
        <View style={styles.toggleList}>
          <ToggleRow
            label="Match starting reminders"
            value={notificationPrefs.matchStarting}
            onValueChange={(value) => setNotificationPrefs((current) => ({ ...current, matchStarting: value }))}
          />
          <ToggleRow
            label="Prediction closing reminders"
            value={notificationPrefs.predictionClosing}
            onValueChange={(value) => setNotificationPrefs((current) => ({ ...current, predictionClosing: value }))}
          />
          <ToggleRow
            label="Favorite team kickoff reminders"
            value={notificationPrefs.favoriteTeamKickoff}
            onValueChange={(value) => setNotificationPrefs((current) => ({ ...current, favoriteTeamKickoff: value }))}
          />
          <ToggleRow
            label="Restaurant watch-party reminders"
            value={notificationPrefs.restaurantReminders}
            onValueChange={(value) => setNotificationPrefs((current) => ({ ...current, restaurantReminders: value }))}
          />
        </View>
      </Card>

      <Card tone="accent">
        <SectionHeader title="Fast entry" subtitle={authUser ? 'Supabase auth session detected. Onboarding choices will sync to your profile.' : 'Guest mode is the default. Google and email auth stay optional until Supabase credentials are attached.'} />
        <View style={styles.authRow}>
          <Pressable
            style={styles.secondaryButton}
            onPress={async () => {
              const result = await appServices.auth.signInWithGoogle();
              Alert.alert('Google sign-in', result.message);
            }}>
            <Text style={styles.secondaryLabel}>Continue with Google</Text>
          </Pressable>
        </View>
        <View style={styles.emailRow}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="Email address"
            placeholderTextColor={palette.textMuted}
            style={styles.emailInput}
          />
          <Pressable
            style={styles.emailButton}
            onPress={async () => {
              const normalizedEmail = email.trim().toLowerCase();

              if (!normalizedEmail || !normalizedEmail.includes('@')) {
                Alert.alert('Email sign-in', 'Enter a valid email address first.');
                return;
              }

              const result = await appServices.auth.sendMagicLink(normalizedEmail);
              Alert.alert('Email sign-in', result.message);
            }}>
            <Text style={styles.emailButtonLabel}>Send Link</Text>
          </Pressable>
        </View>
        <Pressable style={styles.primaryButton} onPress={() => void finishGuestFlow()}>
          <Text style={styles.primaryLabel}>Enter as Guest</Text>
        </Pressable>
      </Card>
    </Screen>
  );
}

type ToggleRowProps = {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

function ToggleRow({ label, value, onValueChange }: ToggleRowProps) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: palette.cyan, false: palette.border }} />
    </View>
  );
}

const styles = StyleSheet.create({
  flowRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pill: {
    minWidth: 92,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: palette.surface,
    alignItems: 'center',
    gap: 6,
  },
  pillActive: {
    borderColor: palette.cyan,
    backgroundColor: palette.surfaceAccent,
  },
  pillEmoji: {
    fontSize: 20,
  },
  pillLabel: {
    color: palette.textMuted,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  pillLabelActive: {
    color: palette.text,
  },
  toggleList: {
    gap: spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  toggleLabel: {
    flex: 1,
    color: palette.text,
    fontSize: typography.body,
  },
  authRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  secondaryLabel: {
    color: palette.text,
    fontWeight: '600',
  },
  emailRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  emailInput: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    backgroundColor: 'rgba(255,255,255,0.03)',
    color: palette.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  emailButton: {
    borderRadius: 14,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  emailButtonLabel: {
    color: palette.text,
    fontWeight: '700',
  },
  primaryButton: {
    borderRadius: 16,
    backgroundColor: palette.cyan,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  primaryLabel: {
    color: palette.background,
    fontSize: typography.body,
    fontWeight: '800',
  },
});