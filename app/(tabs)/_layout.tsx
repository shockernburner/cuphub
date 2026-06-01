import { Tabs } from 'expo-router';
import { ColorValue, Text } from 'react-native';

import { palette } from '@/src/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#06111f',
          borderTopColor: 'rgba(255,255,255,0.08)',
          height: 78,
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: palette.cyan,
        tabBarInactiveTintColor: palette.textMuted,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color }) => <TabGlyph color={color} glyph="●" />,
        }}
      />
      <Tabs.Screen
        name="fixtures"
        options={{
          title: 'Fixtures',
          tabBarIcon: ({ color }) => <TabGlyph color={color} glyph="◫" />,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Leaders',
          tabBarIcon: ({ color }) => <TabGlyph color={color} glyph="▲" />,
        }}
      />
      <Tabs.Screen
        name="restaurants"
        options={{
          title: 'Restaurants',
          tabBarIcon: ({ color }) => <TabGlyph color={color} glyph="⌂" />,
        }}
      />
      <Tabs.Screen
        name="premium"
        options={{
          title: 'Premium',
          tabBarIcon: ({ color }) => <TabGlyph color={color} glyph="◆" />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color }) => <TabGlyph color={color} glyph="☰" />,
        }}
      />
    </Tabs>
  );
}

function TabGlyph({ color, glyph }: { color: ColorValue; glyph: string }) {
  return <Text style={{ color, fontSize: 20, fontWeight: '800' }}>{glyph}</Text>;
}
