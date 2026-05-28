import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import type { Token } from "../types";

const SOL_MINT = "So11111111111111111111111111111111111111112";
const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
);

const SOL_META: Token = {
  mint: SOL_MINT,
  symbol: "SOL",
  name: "Solana",
  decimals: 9,
  logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
};

interface JupiterToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

export function getLogoForMint(mint: string): string | null {
  return _jupiterMapRef.get(mint)?.logoURI ?? null;
}

const _jupiterMapRef = new Map<string, JupiterToken>();

export function useJupiterTokens() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();

  const [walletTokens, setWalletTokens] = useState<
    (Token & { balance: number })[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  const { data: allTokens = [] } = useQuery<JupiterToken[]>({
    queryKey: ["jupiter-tokens"],
    queryFn: async () => {
      const data: JupiterToken[] = await fetch(
        "https://token.jup.ag/strict",
      ).then((r) => r.json());
      _jupiterMapRef.clear();
      for (const t of data) _jupiterMapRef.set(t.address, t);
      return data;
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });

  useEffect(() => {
    if (!connected || !publicKey || allTokens.length === 0) {
      if (!connected) setWalletTokens([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const jupMap = new Map(allTokens.map((t) => [t.address, t]));

        const [lamports, splAccounts] = await Promise.all([
          connection.getBalance(publicKey),
          connection.getParsedTokenAccountsByOwner(publicKey, {
            programId: TOKEN_PROGRAM_ID,
          }),
        ]);

        if (cancelled) return;

        const tokens: (Token & { balance: number })[] = [
          { ...SOL_META, balance: lamports / 1e9 },
        ];

        for (const { account } of splAccounts.value) {
          const info = account.data.parsed.info as {
            mint: string;
            tokenAmount: { uiAmount: number | null };
          };
          const balance = info.tokenAmount.uiAmount ?? 0;
          const meta = jupMap.get(info.mint);
          if (!meta) continue;
          tokens.push({
            mint: info.mint,
            symbol: meta.symbol,
            name: meta.name,
            decimals: meta.decimals,
            logo: meta.logoURI ?? "",
            balance,
          });
        }

        tokens.sort((a, b) => {
          if (a.mint === SOL_MINT) return -1;
          if (b.mint === SOL_MINT) return 1;
          return (b.balance ?? 0) - (a.balance ?? 0);
        });

        setWalletTokens(tokens);
      } catch {
        if (!cancelled) setWalletTokens([{ ...SOL_META, balance: 0 }]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [publicKey, connected, connection, allTokens, refreshKey]);

  return { walletTokens, allTokens, loading, refetch };
}
