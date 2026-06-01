import { StyleSheet, Text, View } from 'react-native';

import { palette, spacing, typography } from '@/src/theme';

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  title: {
    color: palette.text,
    fontSize: typography.subtitle,
    fontWeight: '800',
  },
  subtitle: {
    color: palette.textMuted,
    lineHeight: 20,
  },
});