import { useMemo } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import { useAuth } from "./auth-context";
import { supabase, createAuthenticatedClient } from "./supabase";

interface UseSupabaseReturn {
  supabase: SupabaseClient | null;
  isAuthenticated: boolean;
  user: User | null;
}

export function useSupabase(): UseSupabaseReturn {
  const { session, user } = useAuth();

  const client = useMemo(() => {
    if (session?.access_token) {
      return createAuthenticatedClient(session.access_token);
    }
    return supabase;
  }, [session?.access_token]);

  return {
    supabase: client,
    isAuthenticated: !!session,
    user,
  };
}
