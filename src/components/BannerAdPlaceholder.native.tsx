import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

import { getBannerAdUnitId, isAdsConfigured } from '@/src/services/ads';
import { useSessionStore } from '@/src/store/session';
import { palette, spacing } from '@/src/theme';

export function BannerAdPlaceholder({ placement }: { placement: string }) {
  const premiumTier = useSessionStore((state) => state.premiumTier);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadMessage, setLoadMessage] = useState<string | null>(null);

  if (premiumTier !== 'free') {
    return null;
  }

  if (loadFailed || !isAdsConfigured()) {
    return <BannerFallback placement={placement} message={loadMessage} />;
  }

  const unitId = getBannerAdUnitId();

  if (!unitId) {
    return <BannerFallback placement={placement} message={loadMessage} />;
  }

  return (
    <BannerAd
      unitId={unitId}
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      onAdFailedToLoad={(error) => {
        setLoadMessage(error.message);
        setLoadFailed(true);
      }}
    />
  );
}

function BannerFallback({ placement, message }: { placement: string; message?: string | null }) {
  return (
    <View style={styles.banner}>
      <Text style={styles.label}>AdMob banner placeholder</Text>
      <Text style={styles.subtext}>{placement} placement • hidden automatically for premium users</Text>
      {message ? <Text style={styles.debugText}>Load reason: {message}</Text> : null}
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
  debugText: {
    color: palette.cyan,
    fontSize: 12,
  },
});