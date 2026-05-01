// Supabase Client
// DO NOT import supabase directly for authenticated operations
// Use the useSupabase() hook instead to ensure proper authentication

import { createClient } from '@supabase/supabase-js';
import config from '../config/index';

const { supabaseUrl, supabaseAnonKey } = config().secrets;

// Fail gracefully when env vars are missing (e.g. Vercel deployment without vars set).
// The app will still load and swapping works; trade history is simply disabled.
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Factory for authenticated client - used by useSupabase() hook
export function createAuthenticatedClient(accessToken) {
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  // Authenticate the realtime WebSocket connection for RLS to work
  client.realtime.setAuth(accessToken);

  return client;
}
