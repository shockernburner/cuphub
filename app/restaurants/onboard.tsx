import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card } from '@/src/components/Card';
import { SectionHeader } from '@/src/components/SectionHeader';
import { useAppServices } from '@/src/services/mockApi';
import { palette, spacing } from '@/src/theme';

export default function RestaurantOnboardScreen() {
  const appServices = useAppServices();
  const [form, setForm] = useState({
    name: '',
    city: '',
    countryCode: 'US',
    mapsUrl: '',
    whatsAppNumber: '',
    socialUrl: '',
    capacity: '',
    matchesShown: '',
    offerText: '',
    ambassadorCode: '',
  });

  const submit = async () => {
    if (!form.name.trim() || !form.city.trim() || !form.mapsUrl.trim() || !form.offerText.trim()) {
      Alert.alert('Restaurant onboarding', 'Name, city, maps URL, and offer text are required.');
      return;
    }

    const result = await appServices.restaurants.submitOnboarding({
      name: form.name.trim(),
      city: form.city.trim(),
      countryCode: form.countryCode.trim().toUpperCase(),
      mapsUrl: form.mapsUrl.trim(),
      whatsAppNumber: form.whatsAppNumber.trim(),
      socialUrl: form.socialUrl.trim(),
      capacity: Number(form.capacity) || 0,
      matchIds: form.matchesShown.split(',').map((item) => item.trim()).filter(Boolean),
      offerText: form.offerText.trim(),
      ambassadorCode: form.ambassadorCode.trim(),
    });

    Alert.alert('Restaurant onboarding', result.message, [
      {
        text: 'OK',
        onPress: () => {
          if (result.ok) {
            router.back();
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card tone="accent">
        <SectionHeader title="Restaurant onboarding" subtitle="All submissions land in pending approval until reviewed in admin." />
      </Card>

      <Card>
        <SectionHeader title="Venue details" subtitle="Logo and photo uploads remain explicit placeholders for now." />
        {Object.entries(form).map(([key, value]) => (
          <View key={key} style={styles.fieldBlock}>
            <Text style={styles.label}>{toLabel(key)}</Text>
            <TextInput
              value={value}
              onChangeText={(next) => setForm((current) => ({ ...current, [key]: next }))}
              placeholder={toLabel(key)}
              placeholderTextColor={palette.textMuted}
              style={[styles.input, key === 'offerText' && styles.textArea]}
              multiline={key === 'offerText'}
            />
          </View>
        ))}
        <Pressable style={styles.submitButton} onPress={() => void submit()}>
          <Text style={styles.submitLabel}>Submit for Approval</Text>
        </Pressable>
      </Card>
    </ScrollView>
  );
}

function toLabel(value: string) {
  return value.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase());
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  fieldBlock: {
    marginBottom: spacing.md,
  },
  label: {
    color: palette.textMuted,
    marginBottom: spacing.sm,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#09182a',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: palette.text,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    borderRadius: 16,
    backgroundColor: palette.green,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  submitLabel: {
    color: palette.background,
    fontWeight: '800',
  },
});