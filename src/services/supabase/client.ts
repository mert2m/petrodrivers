import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import { env } from '@/config/env';
import type { Database } from '@/types/database';

/**
 * The single typed Supabase client. This is the ONLY module that constructs it.
 * UI never imports this directly — feature `api/` layers do (spec §5 layering rule).
 */
export const supabase = createClient<Database>(
  env.EXPO_PUBLIC_SUPABASE_URL,
  env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // native app, not web redirect flow
    },
  },
);
