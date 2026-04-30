import { useState, useEffect, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";

const SOL_MINT = "So11111111111111111111111111111111111111112";
const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

const SOL_META = {
  mint: SOL_MINT,
  symbol: "SOL",
  name: "Solana",
  decimals: 9,
  logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
};

let _jupiterCache = null;
let _jupiterMap = null;
let _jupiterPromise = null;

function getJupiterTokens() {
  if (_jupiterCache) return Promise.resolve(_jupiterCache);
  if (_jupiterPromise) return _jupiterPromise;
  _jupiterPromise = fetch("https://token.jup.ag/strict")
    .then((r) => r.json())
    .then((data) => {
      _jupiterCache = data;
      _jupiterMap = new Map(data.map((t) => [t.address, t]));
      return data;
    });
  return _jupiterPromise;
}

export function getLogoForMint(mint) {
  return _jupiterMap?.get(mint)?.logoURI ?? null;
}

export function useJupiterTokens() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();

  const [allTokens, setAllTokens] = useState([]);
  const [walletTokens, setWalletTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    getJupiterTokens().then(setAllTokens).catch(() => {});
  }, []);

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

        const tokens = [{ ...SOL_META, balance: lamports / 1e9 }];

        for (const { account } of splAccounts.value) {
          const info = account.data.parsed.info;
          const balance = info.tokenAmount.uiAmount ?? 0;
          const meta = jupMap.get(info.mint);
          if (!meta) continue;
          tokens.push({
            mint: info.mint,
            symbol: meta.symbol,
            name: meta.name,
            decimals: meta.decimals,
            logo: meta.logoURI,
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

    return () => { cancelled = true; };
  }, [publicKey, connected, connection, allTokens, refreshKey]);

  return { walletTokens, allTokens, loading, refetch };
}
