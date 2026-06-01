import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BannerAdPlaceholder } from '@/src/components/BannerAdPlaceholder';
import { Card } from '@/src/components/Card';
import { MatchCard } from '@/src/components/MatchCard';
import { Screen } from '@/src/components/Screen';
import { SectionHeader } from '@/src/components/SectionHeader';
import { useAppServices } from '@/src/services/mockApi';
import { useSessionStore } from '@/src/store/session';
import { palette, spacing, typography } from '@/src/theme';

const groupFilters = ['All', 'A', 'B', 'C', 'D'];
const dateFilters = ['All', 'Today', 'Next 3 days'];

export default function FixturesScreen() {
  const appServices = useAppServices();
  const countryCode = useSessionStore((state) => state.countryCode || 'US');
  const favoriteTeamIds = useSessionStore((state) => state.favoriteTeamIds);
  const [groupCode, setGroupCode] = useState('All');
  const [dateWindow, setDateWindow] = useState('All');
  const [teamFilter, setTeamFilter] = useState<string | undefined>(favoriteTeamIds[0]);

  const fixtures = appServices.matches.getFixtures({ countryCode, groupCode, dateWindow, teamId: teamFilter });

  const favoriteTeams = appServices.teams.getFavoriteTeamOptions(favoriteTeamIds);

  return (
    <Screen>
      <Screen.Hero
        eyebrow="Fixtures"
        title="Full group-stage path"
        description="Filter by group, favorite team, and date window. Every match card includes reminder, prediction, and official watch entry points."
      />

      <Card>
        <SectionHeader title="Filters" subtitle="Country is tied to your onboarding selection for watch-link relevance." />
        <FilterRow label="Group" options={groupFilters} selected={groupCode} onSelect={setGroupCode} />
        <FilterRow label="Date" options={dateFilters} selected={dateWindow} onSelect={setDateWindow} />
        <FilterRow
          label="Team"
          options={['All', ...favoriteTeams.map((team) => team.shortName)]}
          selected={favoriteTeams.find((team) => team.id === teamFilter)?.shortName ?? 'All'}
          onSelect={(value) => {
            const next = favoriteTeams.find((team) => team.shortName === value);
            setTeamFilter(next?.id);
          }}
        />
      </Card>

      <BannerAdPlaceholder placement="Fixtures" />

      <Card>
        <SectionHeader title="All fixtures" subtitle={`${fixtures.length} seeded fixtures in mock mode.`} />
        {fixtures.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            countryCode={countryCode}
            onOpen={() => router.push(`/match/${match.id}`)}
            onJoinRoom={() => router.push(`/fan-room/${match.id}`)}
          />
        ))}
      </Card>
    </Screen>
  );
}

function FilterRow({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={styles.filterBlock}>
      <Text style={styles.filterLabel}>{label}</Text>
      <View style={styles.filterRow}>
        {options.map((option) => {
          const active = option === selected;
          return (
            <Pressable key={option} onPress={() => onSelect(option)} style={[styles.filterChip, active && styles.filterChipActive]}>
              <Text style={[styles.filterChipLabel, active && styles.filterChipLabelActive]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  filterBlock: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterLabel: {
    color: palette.textMuted,
    fontSize: typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: palette.surface,
  },
  filterChipActive: {
    borderColor: palette.cyan,
    backgroundColor: palette.surfaceAccent,
  },
  filterChipLabel: {
    color: palette.textMuted,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  filterChipLabelActive: {
    color: palette.text,
  },
});