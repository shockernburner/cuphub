import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/src/components/Card';
import { Screen } from '@/src/components/Screen';
import { SectionHeader } from '@/src/components/SectionHeader';
import { useAppServices } from '@/src/services/mockApi';
import { useSessionStore } from '@/src/store/session';
import { palette, spacing, typography } from '@/src/theme';
import { toFlag } from '@/src/utils/flags';

export default function LeaderboardScreen() {
  const appServices = useAppServices();
  const countryCode = useSessionStore((state) => state.countryCode || 'US');
  const [scope, setScope] = useState<'country' | 'friends'>('country');
  const entries = appServices.predictions.getLeaderboard(scope, countryCode);

  return (
    <Screen>
      <Screen.Hero eyebrow="Leaderboard" title="Country pride and friend rivalries" description="Predictions are points-only. Correct winner earns 10, goal difference 15, exact score 30, with streak bonuses layered on top." />

      <Card>
        <SectionHeader title="View" subtitle="Switch between country-wide and friend-only mock standings." />
        <View style={styles.tabRow}>
          {(['country', 'friends'] as const).map((option) => {
            const active = option === scope;
            return (
              <Pressable key={option} onPress={() => setScope(option)} style={[styles.scopeButton, active && styles.scopeButtonActive]}>
                <Text style={[styles.scopeLabel, active && styles.scopeLabelActive]}>{option === 'country' ? 'Country' : 'Friends'}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card tone="accent">
        <SectionHeader title="Top three" subtitle="Mock data is seeded for immediate UI testing." />
        {entries.slice(0, 3).map((entry, index) => (
          <View key={entry.userId} style={styles.rankRow}>
            <View style={styles.rankBadge}>
              <Text style={styles.rankBadgeText}>{index + 1}</Text>
            </View>
            <View style={styles.rankMeta}>
              <Text style={styles.rankName}>{toFlag(entry.countryCode)} {entry.displayName}</Text>
              <Text style={styles.rankDetail}>{entry.totalPoints} pts • {entry.streakValue} streak • {entry.exactScores} exact</Text>
            </View>
          </View>
        ))}
      </Card>

      <Card>
        <SectionHeader title="Full standings" subtitle="Friends is a mocked social graph for MVP review." />
        {entries.map((entry) => (
          <View key={`${scope}-${entry.userId}`} style={styles.tableRow}>
            <Text style={styles.tableRank}>#{entry.rank}</Text>
            <View style={styles.tableMeta}>
              <Text style={styles.tableName}>{entry.displayName}</Text>
              <Text style={styles.tableSubtext}>{toFlag(entry.countryCode)} {entry.countryCode} • {entry.correctResults} correct results</Text>
            </View>
            <Text style={styles.tablePoints}>{entry.totalPoints}</Text>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  scopeButton: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: palette.surface,
  },
  scopeButtonActive: {
    borderColor: palette.green,
    backgroundColor: palette.surfaceAccent,
  },
  scopeLabel: {
    color: palette.textMuted,
    fontWeight: '700',
  },
  scopeLabelActive: {
    color: palette.text,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeText: {
    color: palette.text,
    fontWeight: '800',
  },
  rankMeta: {
    flex: 1,
    gap: 4,
  },
  rankName: {
    color: palette.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  rankDetail: {
    color: palette.textMuted,
    fontSize: typography.caption,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    gap: spacing.md,
  },
  tableRank: {
    width: 34,
    color: palette.textMuted,
    fontWeight: '700',
  },
  tableMeta: {
    flex: 1,
  },
  tableName: {
    color: palette.text,
    fontWeight: '700',
    fontSize: typography.body,
  },
  tableSubtext: {
    color: palette.textMuted,
    fontSize: typography.caption,
    marginTop: 4,
  },
  tablePoints: {
    color: palette.cyan,
    fontWeight: '800',
    fontSize: typography.body,
  },
});