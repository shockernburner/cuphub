import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card } from '@/src/components/Card';
import { Screen } from '@/src/components/Screen';
import { SectionHeader } from '@/src/components/SectionHeader';
import { useAppServices } from '@/src/services/mockApi';
import { useSessionStore } from '@/src/store/session';
import { palette, spacing, typography } from '@/src/theme';

export default function AdminScreen() {
  const appServices = useAppServices();
  const isAdminPreview = useSessionStore((state) => state.isAdminPreview);
  const restaurants = appServices.restaurants.listRestaurants({});
  const pendingRestaurants = restaurants.filter((restaurant) => restaurant.approvalState === 'pending');
  const featuredRestaurants = restaurants.filter((restaurant) => restaurant.approvalState === 'approved').slice(0, 3);
  const fixtures = appServices.matches.getFixtures({}).slice(0, 4);
  const [fixtureDrafts, setFixtureDrafts] = useState<Record<string, { homeScore: string; awayScore: string }>>(() =>
    Object.fromEntries(
      fixtures.map((fixture) => [fixture.id, { homeScore: fixture.homeScore?.toString() ?? '', awayScore: fixture.awayScore?.toString() ?? '' }])
    )
  );
  const [watchLinkDraft, setWatchLinkDraft] = useState({
    matchId: fixtures[0]?.id ?? '',
    countryCode: 'US',
    providerName: '',
    providerUrl: '',
  });

  if (!isAdminPreview) {
    return (
      <Screen>
        <Card>
          <SectionHeader title="Admin locked" subtitle="Enable admin preview from the More tab first." />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Screen.Hero eyebrow="Admin" title="Back-office MVP" description="Approve restaurants, feature boosted listings, manage official watch links, and inspect prediction volume without needing a separate dashboard." />

      <Card tone="accent">
        <SectionHeader title="Prediction counts" subtitle="Snapshot from seeded data." />
        <Text style={styles.metric}>{appServices.admin.getPredictionCounts()} total predictions</Text>
      </Card>

      <Card>
        <SectionHeader title="Pending restaurants" subtitle={`${pendingRestaurants.length} awaiting approval.`} />
        {pendingRestaurants.map((restaurant) => (
          <View key={restaurant.id} style={styles.adminRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{restaurant.name}</Text>
              <Text style={styles.rowSubtext}>{restaurant.city}, {restaurant.countryCode}</Text>
            </View>
            <Pressable
              style={styles.approveButton}
              onPress={async () => {
                const result = await appServices.admin.approveRestaurant(restaurant.id);
                Alert.alert('Restaurants', result.message);
              }}>
              <Text style={styles.approveLabel}>Approve</Text>
            </Pressable>
            <Pressable
              style={styles.rejectButton}
              onPress={async () => {
                const result = await appServices.admin.rejectRestaurant(restaurant.id);
                Alert.alert('Restaurants', result.message);
              }}>
              <Text style={styles.rejectLabel}>Reject</Text>
            </Pressable>
          </View>
        ))}
      </Card>

      <Card>
        <SectionHeader title="Boost approved venues" subtitle="Toggle highlighted placement for verified or approved listings." />
        {featuredRestaurants.map((restaurant) => (
          <View key={restaurant.id} style={styles.adminRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{restaurant.name}</Text>
              <Text style={styles.rowSubtext}>Boosted: {restaurant.boosted ? 'Yes' : 'No'}</Text>
            </View>
            <Pressable
              style={styles.secondaryButtonInline}
              onPress={async () => {
                const result = await appServices.admin.setRestaurantBoost(restaurant.id, !restaurant.boosted);
                Alert.alert('Restaurants', result.message);
              }}>
              <Text style={styles.secondaryLabel}>{restaurant.boosted ? 'Unboost' : 'Boost'}</Text>
            </Pressable>
          </View>
        ))}
      </Card>

      <Card>
        <SectionHeader title="Fixture controls" subtitle="Quick status updates for early testing and leaderboard recalculation." />
        {fixtures.map((fixture) => (
          <View key={fixture.id} style={styles.adminRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{fixture.homeTeam.shortName} vs {fixture.awayTeam.shortName}</Text>
              <Text style={styles.rowSubtext}>{fixture.id} • {fixture.status}</Text>
              <View style={styles.scoreRow}>
                <TextInput
                  value={fixtureDrafts[fixture.id]?.homeScore ?? ''}
                  onChangeText={(homeScore) =>
                    setFixtureDrafts((current) => ({
                      ...current,
                      [fixture.id]: { ...current[fixture.id], homeScore },
                    }))
                  }
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={palette.textMuted}
                  style={[styles.input, styles.scoreInput]}
                />
                <Text style={styles.scoreSeparator}>:</Text>
                <TextInput
                  value={fixtureDrafts[fixture.id]?.awayScore ?? ''}
                  onChangeText={(awayScore) =>
                    setFixtureDrafts((current) => ({
                      ...current,
                      [fixture.id]: { ...current[fixture.id], awayScore },
                    }))
                  }
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={palette.textMuted}
                  style={[styles.input, styles.scoreInput]}
                />
              </View>
            </View>
            <Pressable
              style={styles.secondaryButtonInline}
              onPress={async () => {
                const result = await appServices.admin.updateFixture({
                  matchId: fixture.id,
                  homeScore: fixtureDrafts[fixture.id]?.homeScore === '' ? null : Number(fixtureDrafts[fixture.id]?.homeScore),
                  awayScore: fixtureDrafts[fixture.id]?.awayScore === '' ? null : Number(fixtureDrafts[fixture.id]?.awayScore),
                });
                Alert.alert('Fixtures', result.message);
              }}>
              <Text style={styles.secondaryLabel}>Save Score</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryButtonInline}
              onPress={async () => {
                const nextStatus = fixture.status === 'upcoming' ? 'live' : fixture.status === 'live' ? 'full-time' : 'upcoming';
                const result = await appServices.admin.updateFixture({
                  matchId: fixture.id,
                  status: nextStatus,
                  homeScore: fixtureDrafts[fixture.id]?.homeScore === '' ? null : Number(fixtureDrafts[fixture.id]?.homeScore),
                  awayScore: fixtureDrafts[fixture.id]?.awayScore === '' ? null : Number(fixtureDrafts[fixture.id]?.awayScore),
                });
                Alert.alert('Fixtures', result.message);
              }}>
              <Text style={styles.secondaryLabel}>Cycle Status</Text>
            </Pressable>
          </View>
        ))}
      </Card>

      <Card>
        <SectionHeader title="Watch links" subtitle="Add country-specific official broadcaster links directly from the admin screen." />
        <TextInput
          value={watchLinkDraft.matchId}
          onChangeText={(matchId) => setWatchLinkDraft((current) => ({ ...current, matchId }))}
          placeholder="Match ID"
          placeholderTextColor={palette.textMuted}
          style={styles.input}
        />
        <View style={styles.inputRow}>
          <TextInput
            value={watchLinkDraft.countryCode}
            onChangeText={(countryCode) => setWatchLinkDraft((current) => ({ ...current, countryCode: countryCode.toUpperCase() }))}
            placeholder="Country"
            placeholderTextColor={palette.textMuted}
            style={[styles.input, styles.halfInput]}
          />
          <TextInput
            value={watchLinkDraft.providerName}
            onChangeText={(providerName) => setWatchLinkDraft((current) => ({ ...current, providerName }))}
            placeholder="Provider"
            placeholderTextColor={palette.textMuted}
            style={[styles.input, styles.halfInput]}
          />
        </View>
        <TextInput
          value={watchLinkDraft.providerUrl}
          onChangeText={(providerUrl) => setWatchLinkDraft((current) => ({ ...current, providerUrl }))}
          placeholder="https://official.example.com"
          placeholderTextColor={palette.textMuted}
          style={styles.input}
          autoCapitalize="none"
        />
        <Pressable
          style={styles.secondaryButton}
          onPress={async () => {
            const result = await appServices.admin.upsertWatchLink(watchLinkDraft);
            Alert.alert('Watch links', result.message);
          }}>
          <Text style={styles.secondaryLabel}>Add Watch Link</Text>
        </Pressable>
      </Card>

      <Card>
        <SectionHeader title="Leaderboard jobs" subtitle="Recompute prediction standings from finished fixtures." />
        <Pressable
          style={styles.secondaryButton}
          onPress={async () => {
            const result = await appServices.admin.recalculateLeaderboards();
            Alert.alert('Leaderboards', result.message);
          }}>
          <Text style={styles.secondaryLabel}>Recalculate Leaderboards</Text>
        </Pressable>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  metric: {
    color: palette.text,
    fontSize: typography.title,
    fontWeight: '800',
  },
  adminRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  rowTitle: {
    color: palette.text,
    fontWeight: '800',
  },
  rowSubtext: {
    color: palette.textMuted,
    marginTop: 4,
  },
  approveButton: {
    borderRadius: 12,
    backgroundColor: palette.green,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  approveLabel: {
    color: palette.background,
    fontWeight: '800',
  },
  rejectButton: {
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 143, 0.18)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: '#ff6b8f',
  },
  rejectLabel: {
    color: '#ffc4d2',
    fontWeight: '800',
  },
  secondaryButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  secondaryLabel: {
    color: palette.text,
    fontWeight: '700',
  },
  secondaryButtonInline: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#09182a',
    color: palette.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  scoreInput: {
    width: 56,
    marginBottom: 0,
    textAlign: 'center',
  },
  scoreSeparator: {
    color: palette.text,
    fontWeight: '800',
  },
  halfInput: {
    flex: 1,
  },
});