import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Restaurant } from '@/src/domain/models';
import { palette, spacing, typography } from '@/src/theme';

export function RestaurantCard({ restaurant, onOpen }: { restaurant: Restaurant; onOpen: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onOpen}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{restaurant.name}</Text>
          <Text style={styles.meta}>{restaurant.city}, {restaurant.countryCode} • {restaurant.capacity} capacity</Text>
        </View>
        {restaurant.verifiedStatus ? <Text style={styles.verified}>Verified</Text> : null}
      </View>
      <Text style={styles.description}>{restaurant.offerText}</Text>
      <View style={styles.badgeRow}>
        <Badge label={restaurant.approvalState} />
        {restaurant.boosted ? <Badge label="Boosted" /> : null}
      </View>
    </Pressable>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
    backgroundColor: 'rgba(3, 10, 20, 0.46)',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  title: {
    color: palette.text,
    fontSize: typography.subtitle,
    fontWeight: '800',
  },
  meta: {
    color: palette.textMuted,
    marginTop: 4,
  },
  description: {
    color: palette.textMuted,
    lineHeight: 22,
  },
  verified: {
    color: palette.green,
    fontWeight: '800',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(25, 217, 255, 0.12)',
  },
  badgeLabel: {
    color: palette.text,
    fontSize: typography.caption,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
});