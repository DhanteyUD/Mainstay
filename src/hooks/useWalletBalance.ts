import { useState, useEffect, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";

export function useWalletBalance() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!publicKey || !connected) {
      setBalance(null);
      return;
    }
    setLoading(true);
    try {
      const lamports = await connection.getBalance(publicKey, "confirmed");
      setBalance(lamports / 1e9);
    } catch (err) {
      console.warn("[useWalletBalance] failed:", err);
      setBalance(null);
    } finally {
      setLoading(false);
    }
  }, [publicKey, connected, connection]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  useEffect(() => {
    if (!connected) return;
    const id = setInterval(fetchBalance, 30_000);
    return () => clearInterval(id);
  }, [connected, fetchBalance]);

  return { balance, loading, refresh: fetchBalance };
}
