import { createClient, SupabaseClient } from "@supabase/supabase-js";
import config from "../config/index";

const { supabaseUrl, supabaseAnonKey } = config().secrets;

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export function createAuthenticatedClient(
  accessToken: string,
): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  client.realtime.setAuth(accessToken);

  return client;
}
