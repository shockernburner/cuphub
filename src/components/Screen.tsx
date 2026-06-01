import { PropsWithChildren } from 'react';
import { ScrollView, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette, spacing, typography } from '@/src/theme';

type ScreenProps = PropsWithChildren<{
  scrollable?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
}>;

export function Screen({ children, scrollable = true, contentContainerStyle }: ScreenProps) {
  const body = (
    <View style={[styles.content, contentContainerStyle]}>{children}</View>
  );

  return (
    <LinearGradient colors={[palette.background, '#05142b', palette.background]} style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        {scrollable ? <ScrollView contentContainerStyle={styles.scrollContent}>{body}</ScrollView> : body}
      </SafeAreaView>
    </LinearGradient>
  );
}

function Hero({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <View style={styles.hero}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

function Copy({ children }: PropsWithChildren) {
  return <Text style={styles.copy}>{children}</Text>;
}

Screen.Hero = Hero;
Screen.Copy = Copy;

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl + 88,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  hero: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  eyebrow: {
    color: palette.cyan,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '800',
    fontSize: typography.caption,
  },
  title: {
    color: palette.text,
    fontSize: typography.hero,
    fontWeight: '900',
    lineHeight: 42,
  },
  description: {
    color: palette.textMuted,
    fontSize: typography.body,
    lineHeight: 22,
    maxWidth: 600,
  },
  copy: {
    color: palette.textMuted,
    lineHeight: 22,
  },
});