import { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { palette, shadows, spacing } from '@/src/theme';

export function Card({ children, tone = 'default' }: PropsWithChildren<{ tone?: 'default' | 'accent' }>) {
  return <View style={[styles.card, tone === 'accent' && styles.accent]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.card,
  },
  accent: {
    backgroundColor: palette.surfaceAccent,
    borderColor: palette.borderStrong,
  },
});