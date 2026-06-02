import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { Match } from '@/src/domain/models';
import { useAppServices } from '@/src/services/mockApi';
import { palette, spacing, typography } from '@/src/theme';
import { formatKickoffLocal, matchCountdown } from '@/src/utils/date';
import { toFlag } from '@/src/utils/flags';

type MatchCardProps = {
  match: Match;
  countryCode: string;
  onOpen: () => void;
  onJoinRoom: () => void;
};

export function MatchCard({ match, countryCode, onOpen, onJoinRoom }: MatchCardProps) {
  const appServices = useAppServices();
  const watchLink = appServices.matches.getWatchLinksForMatchAndCountry(match.id, countryCode)[0];
  const canPredict = match.status === 'upcoming';
  const competitionMeta = match.groupCode ?? match.stage;

  return (
    <Pressable style={styles.card} onPress={onOpen}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.meta}>{competitionMeta} • {match.stadium}</Text>
          <Text style={styles.meta}>{formatKickoffLocal(match.kickoffUtc)} local • {matchCountdown(match.kickoffUtc)}</Text>
        </View>
        <StatusPill status={match.status} />
      </View>

      <View style={styles.teamsBlock}>
        <TeamRow label={match.homeTeam.shortName} countryCode={match.homeTeam.countryCode} score={match.homeScore} />
        <TeamRow label={match.awayTeam.shortName} countryCode={match.awayTeam.countryCode} score={match.awayScore} />
      </View>

      <View style={styles.actionsRow}>
        <SmallAction label={canPredict ? 'Predict' : 'Predictions locked'} onPress={onOpen} disabled={!canPredict} />
        <SmallAction label="Watch Officially" onPress={() => Linking.openURL(watchLink.providerUrl)} />
        <SmallAction label="Join Fan Room" onPress={onJoinRoom} />
      </View>

      <Pressable style={styles.reminderRow} onPress={() => Alert.alert('Reminder placeholder', 'This CTA is ready for local notification scheduling.')}>
        <Text style={styles.reminderText}>Add reminder</Text>
      </Pressable>
    </Pressable>
  );
}

function TeamRow({ label, countryCode, score }: { label: string; countryCode: string; score: number | null }) {
  return (
    <View style={styles.teamRow}>
      <Text style={styles.teamLabel}>{toFlag(countryCode)} {label}</Text>
      <Text style={styles.teamScore}>{score ?? '-'}</Text>
    </View>
  );
}

function StatusPill({ status }: { status: Match['status'] }) {
  const backgroundColor = status === 'live' ? 'rgba(39, 224, 109, 0.18)' : status === 'full-time' ? 'rgba(255,255,255,0.1)' : 'rgba(25, 217, 255, 0.15)';
  const color = status === 'live' ? palette.green : status === 'full-time' ? palette.textMuted : palette.cyan;
  return (
    <View style={[styles.statusPill, { backgroundColor }]}>
      <Text style={[styles.statusLabel, { color }]}>{status.toUpperCase()}</Text>
    </View>
  );
}

function SmallAction({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.actionButton, disabled && styles.actionButtonDisabled]}>
      <Text style={[styles.actionLabel, disabled && styles.actionLabelDisabled]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
    backgroundColor: 'rgba(3, 10, 20, 0.46)',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  meta: {
    color: palette.textMuted,
    fontSize: typography.caption,
    marginBottom: 4,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  statusLabel: {
    fontSize: typography.caption,
    fontWeight: '800',
  },
  teamsBlock: {
    gap: spacing.sm,
  },
  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamLabel: {
    color: palette.text,
    fontSize: typography.subtitle,
    fontWeight: '800',
    flex: 1,
    paddingRight: spacing.md,
  },
  teamScore: {
    color: palette.text,
    fontSize: 30,
    fontWeight: '900',
    minWidth: 28,
    textAlign: 'right',
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: 'rgba(11, 34, 52, 0.88)',
  },
  actionButtonDisabled: {
    borderColor: palette.border,
  },
  actionLabel: {
    color: palette.text,
    fontWeight: '700',
    fontSize: typography.caption,
  },
  actionLabelDisabled: {
    color: palette.textMuted,
  },
  reminderRow: {
    alignSelf: 'flex-start',
  },
  reminderText: {
    color: palette.amber,
    fontWeight: '700',
  },
});