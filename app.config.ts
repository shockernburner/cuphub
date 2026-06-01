import type { ExpoConfig } from 'expo/config';

const androidAdmobAppId = process.env.EXPO_PUBLIC_ADMOB_APP_ID_ANDROID || 'ca-app-pub-3940256099942544~3347511713';
const iosAdmobAppId = process.env.EXPO_PUBLIC_ADMOB_APP_ID_IOS || 'ca-app-pub-3940256099942544~1458002511';

const config = {
  cli: {
    appVersionSource: 'local',
  },
  name: 'CupHub',
  slug: 'cuphub',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'cuphub',
  userInterfaceStyle: 'dark',
  description:
    'CupHub is a World Cup companion app for fans to track matches, predict scores, challenge friends, join fan rooms, and discover restaurants showing the games. It does not host match streams.',
  ios: {
    supportsTablet: true,
  },
  android: {
    package: 'com.cuphub.app',
    adaptiveIcon: {
      backgroundColor: '#051021',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-notifications',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-screen.png',
        resizeMode: 'cover',
        backgroundColor: '#030814',
      },
    ],
    [
      'react-native-google-mobile-ads',
      {
        androidAppId: androidAdmobAppId,
        iosAppId: iosAdmobAppId,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: '39d699c7-2251-4e7e-b8ae-6851bb8e3f38',
    },
  },
} as ExpoConfig;

export default config;