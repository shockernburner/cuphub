import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/src/components/Card';
import { Screen } from '@/src/components/Screen';
import { SectionHeader } from '@/src/components/SectionHeader';
import { useAppServices } from '@/src/services/mockApi';
import { useSessionStore } from '@/src/store/session';
import { palette, spacing, typography } from '@/src/theme';

export default function PremiumScreen() {
  const appServices = useAppServices();
  const premiumTier = useSessionStore((state) => state.premiumTier);
  const setPremiumTier = useSessionStore((state) => state.setPremiumTier);
  const products = appServices.monetization.listProducts();

  return (
    <Screen>
      <Screen.Hero eyebrow="Premium" title="Monetization without blocking core fandom" description="Ad-free, tournament, and venue-facing commercial products are wired as placeholders. Billing can be swapped to RevenueCat or Play Billing later." />

      <Card tone="accent">
        <SectionHeader title="Current entitlement" subtitle="Premium hides banner ads in the MVP mock mode." />
        <Text style={styles.currentTier}>{premiumTier === 'free' ? 'Free tier' : premiumTier}</Text>
      </Card>

      {products.map((product) => (
        <Card key={product.code}>
          <View style={styles.productHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.productTitle}>{product.name}</Text>
              <Text style={styles.productSubtitle}>{product.description}</Text>
            </View>
            <Text style={styles.productPrice}>{product.priceLabel}</Text>
          </View>
          {product.bullets.map((bullet) => (
            <Text key={bullet} style={styles.bullet}>• {bullet}</Text>
          ))}
          <Pressable
            style={styles.buyButton}
            onPress={() => {
              setPremiumTier(product.entitlement);
              Alert.alert('Placeholder purchase', `${product.name} is now active in mock mode.`);
            }}>
            <Text style={styles.buyButtonLabel}>Unlock {product.name}</Text>
          </Pressable>
        </Card>
      ))}

      <Card>
        <SectionHeader title="Restore and compliance" subtitle="Real billing keys belong in environment variables only." />
        <Pressable style={styles.restoreButton} onPress={() => Alert.alert('Restore purchases', 'RevenueCat / Play Billing hookup is intentionally left as a placeholder.')}>
          <Text style={styles.restoreLabel}>Restore Purchases</Text>
        </Pressable>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  currentTier: {
    color: palette.text,
    fontSize: typography.title,
    fontWeight: '800',
  },
  productHeader: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  productTitle: {
    color: palette.text,
    fontSize: typography.subtitle,
    fontWeight: '800',
  },
  productSubtitle: {
    color: palette.textMuted,
    marginTop: 4,
    lineHeight: 20,
  },
  productPrice: {
    color: palette.cyan,
    fontSize: typography.subtitle,
    fontWeight: '800',
  },
  bullet: {
    color: palette.text,
    marginBottom: 8,
    lineHeight: 20,
  },
  buyButton: {
    marginTop: spacing.md,
    borderRadius: 16,
    backgroundColor: palette.green,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buyButtonLabel: {
    color: palette.background,
    fontWeight: '800',
  },
  restoreButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  restoreLabel: {
    color: palette.text,
    fontWeight: '700',
  },
});