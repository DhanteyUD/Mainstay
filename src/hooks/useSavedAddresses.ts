import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { SavedAddress } from "../types";

const DB_ENABLED = supabase !== null;
const TABLE = "recipients";

export function useSavedAddresses(walletAddress: string | null) {
  const qc = useQueryClient();
  const key = ["saved-addresses", walletAddress];

  const { data: addresses = [] } = useQuery<SavedAddress[]>({
    queryKey: key,
    queryFn: async () => {
      const { data } = await supabase!
        .from(TABLE)
        .select("id, address, label, last_used_at")
        .eq("wallet_address", walletAddress)
        .order("last_used_at", { ascending: false })
        .limit(10);
      return (data || []) as SavedAddress[];
    },
    enabled: !!walletAddress && DB_ENABLED,
    staleTime: 1000 * 60 * 2,
  });

  const saveMutation = useMutation({
    mutationFn: async ({
      address,
      label,
    }: {
      address: string;
      label: string | null;
    }) => {
      await supabase!
        .from(TABLE)
        .upsert(
          {
            wallet_address: walletAddress,
            address,
            label: label || null,
            last_used_at: new Date().toISOString(),
          },
          { onConflict: "user_id,wallet_address,address" },
        )
        .select("id, address, label, last_used_at")
        .single();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const removeMutation = useMutation({
    mutationFn: async (address: string) => {
      await supabase!
        .from(TABLE)
        .delete()
        .eq("wallet_address", walletAddress)
        .eq("address", address);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const save = (address: string, label: string | null = null) =>
    saveMutation.mutate({ address, label });

  const remove = (address: string) => removeMutation.mutate(address);

  return { addresses, save, remove };
}
