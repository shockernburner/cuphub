import { Platform } from 'react-native';
import mobileAds, { MaxAdContentRating, TestIds } from 'react-native-google-mobile-ads';

import { env } from '@/src/config/env';

let adsInitialized = false;

export function isAdsConfigured() {
  return Platform.OS === 'android' || Platform.OS === 'ios';
}

export function getBannerAdUnitId() {
  if (__DEV__) {
    return TestIds.BANNER;
  }

  if (Platform.OS === 'android') {
    return env.expoPublicAdmobBannerIdAndroid || TestIds.BANNER;
  }

  if (Platform.OS === 'ios') {
    return env.expoPublicAdmobBannerIdIos || TestIds.BANNER;
  }

  return null;
}

export async function initializeAds() {
  if (!isAdsConfigured() || adsInitialized) {
    return;
  }

  await mobileAds().setRequestConfiguration({
    maxAdContentRating: MaxAdContentRating.PG,
    tagForChildDirectedTreatment: false,
    tagForUnderAgeOfConsent: false,
    testDeviceIdentifiers: ['EMULATOR'],
  });

  await mobileAds().initialize();
  adsInitialized = true;
}