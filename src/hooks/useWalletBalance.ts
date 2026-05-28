import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";

export function useWalletBalance() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const qc = useQueryClient();

  const key = ["wallet-balance", publicKey?.toBase58()];

  const { data: balance = null, isLoading: loading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const lamports = await connection.getBalance(publicKey!, "confirmed");
      return lamports / 1e9;
    },
    enabled: !!publicKey && connected,
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: key });

  return { balance, loading, refresh };
}
