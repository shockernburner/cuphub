export const env = {
  expoPublicSupabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  expoPublicSupabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  expoPublicAdmobAppIdAndroid: process.env.EXPO_PUBLIC_ADMOB_APP_ID_ANDROID ?? '',
  expoPublicAdmobAppIdIos: process.env.EXPO_PUBLIC_ADMOB_APP_ID_IOS ?? '',
  expoPublicAdmobBannerIdAndroid: process.env.EXPO_PUBLIC_ADMOB_BANNER_ID_ANDROID ?? '',
  expoPublicAdmobBannerIdIos: process.env.EXPO_PUBLIC_ADMOB_BANNER_ID_IOS ?? '',
  expoPublicRevenueCatApiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? '',
  expoPublicGoogleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  dataMode: process.env.EXPO_PUBLIC_DATA_MODE ?? 'mock',
};