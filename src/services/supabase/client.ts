import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { env } from '@/src/config/env';

let supabaseClient: SupabaseClient | null = null;

export function isSupabaseEnabled() {
  return env.dataMode === 'supabase' && Boolean(env.expoPublicSupabaseUrl) && Boolean(env.expoPublicSupabaseAnonKey);
}

export function getSupabaseClient() {
  if (!isSupabaseEnabled()) {
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(env.expoPublicSupabaseUrl, env.expoPublicSupabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }

  return supabaseClient;
}