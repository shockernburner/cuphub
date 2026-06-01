import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card } from '@/src/components/Card';
import { Screen } from '@/src/components/Screen';
import { SectionHeader } from '@/src/components/SectionHeader';
import { useAppServices } from '@/src/services/mockApi';
import { palette, spacing, typography } from '@/src/theme';

export default function FanRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const appServices = useAppServices();
  const room = appServices.fanRooms.getRoomByMatchId(id ?? '');
  const messages = appServices.fanRooms.getMessages(room?.id ?? '');
  const [draft, setDraft] = useState('');

  if (!room) {
    return (
      <Screen>
        <Card>
          <SectionHeader title="Room unavailable" subtitle="Match-global and restaurant-specific rooms are seeded from mock data." />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Screen.Hero eyebrow="Fan room" title={room.title} description="Keep it family-safe. Report abuse, no gambling chatter, and no unauthorized stream links." />

      <Card tone="accent">
        <SectionHeader title="Room context" subtitle={`Type: ${room.roomType}`} />
        <Text style={styles.metaText}>{room.description}</Text>
      </Card>

      <Card>
        <SectionHeader title="Live chat placeholder" subtitle="Realtime transport can be swapped to Supabase Realtime later without changing this surface." />
        {messages.map((message) => (
          <View key={message.id} style={styles.messageBubble}>
            <View style={styles.messageHeader}>
              <Text style={styles.author}>{message.authorName}</Text>
              <Pressable onPress={() => Alert.alert('Report sent', 'This moderation report is a local placeholder for the MVP.')}>
                <Text style={styles.report}>Report</Text>
              </Pressable>
            </View>
            <Text style={styles.messageBody}>{message.body}</Text>
          </View>
        ))}
        <View style={styles.composerRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Add a message"
            placeholderTextColor={palette.textMuted}
            style={styles.input}
          />
          <Pressable
            style={styles.sendButton}
            onPress={async () => {
              if (!draft.trim()) return;
              const result = await appServices.fanRooms.sendMessage({ roomId: room.id, body: draft.trim(), fallbackAuthorName: 'You' });

              if (!result.ok) {
                Alert.alert('Fan room', result.message);
                return;
              }

              setDraft('');
            }}>
            <Text style={styles.sendLabel}>Send</Text>
          </Pressable>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  metaText: {
    color: palette.text,
    lineHeight: 22,
  },
  messageBubble: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  author: {
    color: palette.text,
    fontWeight: '800',
  },
  report: {
    color: '#ff9fbf',
    fontSize: typography.caption,
    fontWeight: '700',
  },
  messageBody: {
    color: palette.textMuted,
    lineHeight: 22,
  },
  composerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#08192c',
    color: palette.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  sendButton: {
    borderRadius: 16,
    backgroundColor: palette.green,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  sendLabel: {
    color: palette.background,
    fontWeight: '800',
  },
});