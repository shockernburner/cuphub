import { router, useLocalSearchParams } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/src/components/Card';
import { Screen } from '@/src/components/Screen';
import { SectionHeader } from '@/src/components/SectionHeader';
import { useAppServices } from '@/src/services/mockApi';
import { useSessionStore } from '@/src/store/session';
import { palette, spacing, typography } from '@/src/theme';

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const appServices = useAppServices();
  const authUserId = useSessionStore((state) => state.authUser?.id ?? null);
  const restaurant = appServices.restaurants.getRestaurantById(id ?? '');

  if (!restaurant) {
    return (
      <Screen>
        <Card>
          <SectionHeader title="Restaurant not found" subtitle="The selected venue may have been removed from the seed set." />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Screen.Hero eyebrow="Restaurant" title={restaurant.name} description={`${restaurant.city}, ${restaurant.countryCode} • ${restaurant.capacity} capacity`} />

      <Card tone="accent">
        <SectionHeader title="Venue profile" subtitle={`${restaurant.verifiedStatus ? 'Verified' : 'Community listed'} • ${restaurant.approvalState}`} />
        <Text style={styles.copy}>{restaurant.offerText}</Text>
        {restaurant.submittedByUserId ? (
          <Text style={styles.ownerLine}>{restaurant.submittedByUserId === authUserId ? 'Submitted by you' : 'Community-submitted listing'}</Text>
        ) : null}
      </Card>

      <Card>
        <SectionHeader title="Actions" subtitle="Google Maps and WhatsApp are deep-link ready." />
        <Pressable style={styles.primaryButton} onPress={() => Linking.openURL(restaurant.mapsUrl)}>
          <Text style={styles.primaryLabel}>Open in Google Maps</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => Linking.openURL(restaurant.whatsAppUrl)}>
          <Text style={styles.secondaryLabel}>WhatsApp Booking</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => router.push(`/fan-room/${restaurant.matchIds[0]}`)}>
          <Text style={styles.secondaryLabel}>Join Restaurant Fan Room</Text>
        </Pressable>
      </Card>

      <Card>
        <SectionHeader title="Matches showing" subtitle="Venue owners can update this later through admin workflows." />
        {appServices.restaurants.getMatchesForRestaurant(restaurant.id).map((match) => (
          <Text key={match.id} style={styles.copy}>{match.homeTeam.shortName} vs {match.awayTeam.shortName}</Text>
        ))}
      </Card>

      <Card>
        <SectionHeader title="Poster / QR placeholder" subtitle="Use this entry point later for a branded share-card generator and QR deep link." />
        <View style={styles.qrBox}>
          <Text style={styles.qrText}>QR / share card placeholder</Text>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  copy: {
    color: palette.textMuted,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  primaryButton: {
    borderRadius: 16,
    backgroundColor: palette.cyan,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  primaryLabel: {
    color: palette.background,
    fontWeight: '800',
  },
  secondaryButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  secondaryLabel: {
    color: palette.text,
    fontWeight: '700',
  },
  qrBox: {
    minHeight: 120,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: palette.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrText: {
    color: palette.textMuted,
    fontSize: typography.body,
    fontWeight: '700',
  },
  ownerLine: {
    color: palette.cyan,
    fontWeight: '700',
  },
});