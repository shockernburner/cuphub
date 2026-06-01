import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { BannerAdPlaceholder } from '@/src/components/BannerAdPlaceholder';
import { Card } from '@/src/components/Card';
import { MatchCard } from '@/src/components/MatchCard';
import { PredictionComposer } from '@/src/components/PredictionComposer';
import { Screen } from '@/src/components/Screen';
import { SectionHeader } from '@/src/components/SectionHeader';
import { useAppServices } from '@/src/services/mockApi';
import { useSessionStore } from '@/src/store/session';
import { palette, spacing, typography } from '@/src/theme';
import { formatMatchDateLong } from '@/src/utils/date';

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const appServices = useAppServices();
  const countryCode = useSessionStore((state) => state.countryCode || 'US');
  const match = appServices.matches.getMatchById(id ?? '');
  const watchLinks = appServices.matches.getWatchLinksForMatchAndCountry(id ?? '', countryCode);

  if (!match) {
    return (
      <Screen>
        <Card>
          <SectionHeader title="Match not found" subtitle="The seeded fixture may have changed." />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Screen.Hero eyebrow="Match detail" title={`${match.homeTeam.shortName} vs ${match.awayTeam.shortName}`} description={`${match.stadium}, ${match.city} • ${formatMatchDateLong(match.kickoffUtc)}`} />

      <Card tone="accent">
        <MatchCard match={match} countryCode={countryCode} onOpen={() => undefined} onJoinRoom={() => router.push(`/fan-room/${match.id}`)} />
      </Card>

      <BannerAdPlaceholder placement="Match detail" />

      <PredictionComposer match={match} />

      <Card>
        <SectionHeader title="Watch officially" subtitle="Watch through official broadcasters where available." />
        {watchLinks.map((link) => (
          <Pressable key={`${link.countryCode}-${link.providerName}`} style={styles.linkRow} onPress={() => Linking.openURL(link.providerUrl)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.linkTitle}>{link.providerName}</Text>
              <Text style={styles.linkSubtext}>{link.platformType} • {link.countryCode}</Text>
            </View>
            <Text style={styles.linkAction}>Open</Text>
          </Pressable>
        ))}
      </Card>

      <Card>
        <SectionHeader title="Timeline" subtitle="Live event feed is intentionally a placeholder in the MVP." />
        <Text style={styles.timelineItem}>12 min placeholder: official event feed or manual admin updates can land here later.</Text>
        <Text style={styles.timelineItem}>46 min placeholder: second-half kickoff state with optional momentum visualization.</Text>
      </Card>

      <Card>
        <SectionHeader title="Fan room" subtitle="One global room per match, plus optional country and restaurant variants." />
        <Pressable style={styles.roomButton} onPress={() => router.push(`/fan-room/${match.id}`)}>
          <Text style={styles.roomButtonLabel}>Join Match Fan Room</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => Alert.alert('Reminder placeholder', 'Match reminder scheduling can be attached to Expo Notifications and a backend job queue later.')}>
          <Text style={styles.secondaryButtonLabel}>Add Reminder</Text>
        </Pressable>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  linkTitle: {
    color: palette.text,
    fontWeight: '800',
    fontSize: typography.body,
  },
  linkSubtext: {
    color: palette.textMuted,
    marginTop: 4,
  },
  linkAction: {
    color: palette.cyan,
    fontWeight: '800',
  },
  timelineItem: {
    color: palette.textMuted,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  roomButton: {
    borderRadius: 16,
    backgroundColor: palette.cyan,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  roomButtonLabel: {
    color: palette.background,
    fontWeight: '800',
  },
  secondaryButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  secondaryButtonLabel: {
    color: palette.text,
    fontWeight: '700',
  },
});