import { useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card } from '@/src/components/Card';
import { SectionHeader } from '@/src/components/SectionHeader';
import { Match } from '@/src/domain/models';
import { useSessionStore } from '@/src/store/session';
import { palette, spacing, typography } from '@/src/theme';

export function PredictionComposer({ match }: { match: Match }) {
  const savedPrediction = useSessionStore((state) => state.predictions[match.id]);
  const savePrediction = useSessionStore((state) => state.savePrediction);
  const [homeScore, setHomeScore] = useState(String(savedPrediction?.predictedHomeScore ?? 1));
  const [awayScore, setAwayScore] = useState(String(savedPrediction?.predictedAwayScore ?? 0));
  const [firstScorer, setFirstScorer] = useState(savedPrediction?.firstScorer ?? '');
  const locked = match.status !== 'upcoming';

  const submit = () => {
    savePrediction({
      matchId: match.id,
      predictedHomeScore: Number(homeScore),
      predictedAwayScore: Number(awayScore),
      homeTeamId: match.homeTeam.id,
      awayTeamId: match.awayTeam.id,
      firstScorer,
    });
    Alert.alert('Prediction saved', 'Winner, scoreline, and first scorer placeholder captured locally.');
  };

  const share = async () => {
    await Share.share({
      message: `CupHub prediction: ${match.homeTeam.shortName} ${homeScore}-${awayScore} ${match.awayTeam.shortName}. Watch through official broadcasters where available.`,
    });
  };

  return (
    <Card>
      <SectionHeader title="Prediction" subtitle={locked ? 'Predictions are locked at kickoff.' : 'Exact score = 30 points, goal difference = 15, correct winner = 10.'} />
      <View style={styles.scoreRow}>
        <ScoreBox label={match.homeTeam.shortName} value={homeScore} onChangeText={setHomeScore} editable={!locked} />
        <Text style={styles.scoreDivider}>:</Text>
        <ScoreBox label={match.awayTeam.shortName} value={awayScore} onChangeText={setAwayScore} editable={!locked} />
      </View>
      <TextInput
        editable={!locked}
        value={firstScorer}
        onChangeText={setFirstScorer}
        placeholder="First scorer placeholder"
        placeholderTextColor={palette.textMuted}
        style={styles.input}
      />
      <View style={styles.shareCard}>
        <Text style={styles.shareEyebrow}>Shareable prediction card</Text>
        <Text style={styles.shareHeadline}>{match.homeTeam.shortName} {homeScore}-{awayScore} {match.awayTeam.shortName}</Text>
        <Text style={styles.shareCaption}>CupHub • Predictions • Fan Rooms • Official watch links only</Text>
      </View>
      <View style={styles.actionRow}>
        <Pressable style={[styles.primaryButton, locked && styles.buttonDisabled]} onPress={submit} disabled={locked}>
          <Text style={styles.primaryLabel}>{locked ? 'Locked' : 'Save Prediction'}</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={share}>
          <Text style={styles.secondaryLabel}>Share</Text>
        </Pressable>
      </View>
    </Card>
  );
}

function ScoreBox({ label, value, onChangeText, editable }: { label: string; value: string; onChangeText: (value: string) => void; editable: boolean }) {
  return (
    <View style={styles.scoreBox}>
      <Text style={styles.scoreLabel}>{label}</Text>
      <TextInput
        editable={editable}
        keyboardType="number-pad"
        value={value}
        onChangeText={onChangeText}
        style={styles.scoreInput}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  scoreDivider: {
    color: palette.text,
    fontSize: 32,
    fontWeight: '800',
  },
  scoreBox: {
    flex: 1,
    gap: spacing.sm,
  },
  scoreLabel: {
    color: palette.textMuted,
    fontSize: typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scoreInput: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    backgroundColor: '#09182c',
    color: palette.text,
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#09182c',
    color: palette.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  shareCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    backgroundColor: 'rgba(13, 44, 74, 0.65)',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  shareEyebrow: {
    color: palette.cyan,
    textTransform: 'uppercase',
    fontSize: typography.caption,
    fontWeight: '800',
    letterSpacing: 1,
  },
  shareHeadline: {
    color: palette.text,
    fontSize: typography.title,
    fontWeight: '900',
  },
  shareCaption: {
    color: palette.textMuted,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: palette.green,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryLabel: {
    color: palette.background,
    fontWeight: '800',
  },
  secondaryButton: {
    paddingHorizontal: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryLabel: {
    color: palette.text,
    fontWeight: '800',
  },
});