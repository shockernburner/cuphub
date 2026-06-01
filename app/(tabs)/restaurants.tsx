import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BannerAdPlaceholder } from '@/src/components/BannerAdPlaceholder';
import { Card } from '@/src/components/Card';
import { RestaurantCard } from '@/src/components/RestaurantCard';
import { Screen } from '@/src/components/Screen';
import { SectionHeader } from '@/src/components/SectionHeader';
import { useAppServices } from '@/src/services/mockApi';
import { useSessionStore } from '@/src/store/session';
import { palette, spacing } from '@/src/theme';

export default function RestaurantsScreen() {
  const appServices = useAppServices();
  const countryCode = useSessionStore((state) => state.countryCode || 'US');
  const [mode, setMode] = useState<'list' | 'map'>('list');
  const restaurants = appServices.restaurants.listRestaurants({ countryCode });

  return (
    <Screen>
      <Screen.Hero eyebrow="Watch Parties" title="Restaurants and cafes showing the match" description="Discover verified venues, open Google Maps, tap WhatsApp booking, and jump into restaurant-specific fan rooms." />

      <Card>
        <SectionHeader title="Explore venues" subtitle="Map is a placeholder view; deep links already route through Google Maps." />
        <View style={styles.toggleRow}>
          <ToggleButton label="List" active={mode === 'list'} onPress={() => setMode('list')} />
          <ToggleButton label="Map" active={mode === 'map'} onPress={() => setMode('map')} />
          <Pressable style={styles.ctaButton} onPress={() => router.push('/restaurants/onboard')}>
            <Text style={styles.ctaLabel}>List your venue</Text>
          </Pressable>
        </View>
      </Card>

      <BannerAdPlaceholder placement="Restaurants" />

      {mode === 'map' ? (
        <Card tone="accent">
          <SectionHeader title="Map preview" subtitle="Interactive map can be swapped to Google Maps SDK or Mapbox later." />
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPin}>Los Angeles</Text>
            <Text style={styles.mapPin}>London</Text>
            <Text style={styles.mapPin}>Lagos</Text>
          </View>
        </Card>
      ) : null}

      <Card>
        <SectionHeader title="Featured venues" subtitle={`${restaurants.length} seeded restaurants available in mock mode.`} />
        {restaurants.map((restaurant) => (
          <RestaurantCard key={restaurant.id} restaurant={restaurant} onOpen={() => router.push(`/restaurants/${restaurant.id}`)} />
        ))}
      </Card>
    </Screen>
  );
}

function ToggleButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.toggleButton, active && styles.toggleButtonActive]}>
      <Text style={[styles.toggleLabel, active && styles.toggleLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  toggleButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  toggleButtonActive: {
    borderColor: palette.cyan,
    backgroundColor: palette.surfaceAccent,
  },
  toggleLabel: {
    color: palette.textMuted,
    fontWeight: '700',
  },
  toggleLabelActive: {
    color: palette.text,
  },
  ctaButton: {
    marginLeft: 'auto',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    backgroundColor: palette.green,
  },
  ctaLabel: {
    color: palette.background,
    fontWeight: '800',
  },
  mapPlaceholder: {
    minHeight: 190,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'space-evenly',
    paddingHorizontal: spacing.lg,
  },
  mapPin: {
    color: palette.text,
    fontWeight: '700',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(20, 217, 214, 0.14)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
  },
});