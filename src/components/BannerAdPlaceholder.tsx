import { StyleSheet, Text, View } from 'react-native';

import { useSessionStore } from '@/src/store/session';
import { palette, spacing } from '@/src/theme';

export function BannerAdPlaceholder({ placement }: { placement: string }) {
  const premiumTier = useSessionStore((state) => state.premiumTier);

  if (premiumTier !== 'free') {
    return null;
  }

  return (
    <BannerFallback placement={placement} />
  );
}

function BannerFallback({ placement }: { placement: string }) {
  return (
    <View style={styles.banner}>
      <Text style={styles.label}>AdMob banner placeholder</Text>
      <Text style={styles.subtext}>{placement} placement • hidden automatically for premium users</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: palette.borderStrong,
    padding: spacing.lg,
    backgroundColor: 'rgba(32, 128, 255, 0.08)',
    gap: spacing.xs,
  },
  label: {
    color: palette.text,
    fontWeight: '800',
  },
  subtext: {
    color: palette.textMuted,
  },
});