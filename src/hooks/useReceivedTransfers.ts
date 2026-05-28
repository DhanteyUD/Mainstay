import { useState, useCallback, useMemo } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { SOLANA_RPC_PROXY, SOLANA_DEVNET_RPC, TOKEN_LIST } from "../config";
import { useNetwork } from "../contexts/NetworkContext";
import type { ReceivedTransfer } from "../types";

const MINT_TO_SYMBOL = Object.fromEntries(
  TOKEN_LIST.map((t) => [t.mint, t.symbol]),
);
const MINT_TO_DECIMALS = Object.fromEntries(
  TOKEN_LIST.map((t) => [t.mint, t.decimals]),
);

function pubkeyToString(key: string | PublicKey | null | undefined): string | null {
  if (!key) return null;
  if (typeof key === "string") return key;
  return key.toBase58?.() ?? null;
}

async function fetchConcurrent<T>(
  fns: Array<() => Promise<T>>,
  concurrency = 3,
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = [];
  for (let i = 0; i < fns.length; i += concurrency) {
    const settled = await Promise.allSettled(
      fns.slice(i, i + concurrency).map((fn) => fn()),
    );
    results.push(...settled);
  }
  return results;
}

export function useReceivedTransfers(walletAddress: string | null) {
  const { isDevnet } = useNetwork();
  const [received, setReceived] = useState<ReceivedTransfer[]>([]);
  const [loading, setLoading] = useState(false);

  const connection = useMemo(
    () =>
      new Connection(isDevnet ? SOLANA_DEVNET_RPC : SOLANA_RPC_PROXY, {
        commitment: "confirmed",
        wsEndpoint: "",
      }),
    [isDevnet],
  );

  const fetchReceived = useCallback(async () => {
    if (!walletAddress) {
      setReceived([]);
      return;
    }
    setLoading(true);
    try {
      const pubkey = new PublicKey(walletAddress);

      const sigs = await connection.getSignaturesForAddress(pubkey, {
        limit: 20,
      });
      if (!sigs.length) {
        setReceived([]);
        return;
      }

      const txResults = await fetchConcurrent(
        sigs.map(
          (s) => () =>
            connection.getParsedTransaction(s.signature, {
              maxSupportedTransactionVersion: 0,
            }),
        ),
      );

      const items: ReceivedTransfer[] = [];
      for (let i = 0; i < sigs.length; i++) {
        const sigInfo = sigs[i];
        const result = txResults[i];
        if (
          result.status !== "fulfilled" ||
          !result.value ||
          result.value.meta?.err
        )
          continue;

        const tx = result.value;
        const accounts = tx.transaction.message.accountKeys ?? [];

        const feePayerAddr = pubkeyToString(accounts[0]?.pubkey);
        if (feePayerAddr === walletAddress) continue;
        const explorerUrl = isDevnet
          ? `https://solscan.io/tx/${sigInfo.signature}?cluster=devnet`
          : `https://solscan.io/tx/${sigInfo.signature}`;
        const createdAt = sigInfo.blockTime
          ? new Date(sigInfo.blockTime * 1000).toISOString()
          : null;

        const myIdx = accounts.findIndex(
          (acct) => pubkeyToString(acct.pubkey) === walletAddress,
        );
        if (myIdx >= 0) {
          const preBals = tx.meta?.preBalances ?? [];
          const postBals = tx.meta?.postBalances ?? [];
          const netSol = (postBals[myIdx] ?? 0) - (preBals[myIdx] ?? 0);
          if (netSol >= 5000) {
            // Heuristic: the sender is whichever account lost the most SOL.
            let senderAddr: string | null = null;
            let maxDrop = 0;
            for (let j = 0; j < accounts.length; j++) {
              if (j === myIdx) continue;
              const drop = (preBals[j] ?? 0) - (postBals[j] ?? 0);
              if (drop > maxDrop) {
                maxDrop = drop;
                senderAddr = pubkeyToString(accounts[j]?.pubkey);
              }
            }
            items.push({
              id: `${sigInfo.signature}-sol`,
              trade_type: "received",
              input_token_symbol: "SOL",
              input_amount_raw: String(netSol),
              input_decimals: 9,
              sender: senderAddr,
              signature: sigInfo.signature,
              explorer_url: explorerUrl,
              created_at: createdAt,
            });
          }
        }

        const preTok = tx.meta?.preTokenBalances ?? [];
        const postTok = tx.meta?.postTokenBalances ?? [];
        for (const post of postTok) {
          let isWalletOwned = post.owner === walletAddress;

          if (!isWalletOwned && !post.owner) {
            try {
              const ata = getAssociatedTokenAddressSync(
                new PublicKey(post.mint),
                pubkey,
              );
              isWalletOwned =
                pubkeyToString(accounts[post.accountIndex]?.pubkey) ===
                ata.toBase58();
            } catch {
              /* non-ATA token account — skip */
            }
          }

          if (!isWalletOwned) continue;

          const pre = preTok.find((p) => p.accountIndex === post.accountIndex);
          const preAmt = pre ? Number(pre.uiTokenAmount.amount) : 0;
          const postAmt = Number(post.uiTokenAmount.amount);
          const diff = postAmt - preAmt;
          if (diff <= 0) continue;

          let sender: string | null = null;
          for (const preTokEntry of preTok) {
            if (preTokEntry.mint !== post.mint) continue;
            if (preTokEntry.accountIndex === post.accountIndex) continue;
            const postMatch = postTok.find(
              (p) => p.accountIndex === preTokEntry.accountIndex,
            );
            const prevAmt = Number(preTokEntry.uiTokenAmount.amount);
            const nextAmt = postMatch
              ? Number(postMatch.uiTokenAmount.amount)
              : 0;
            if (prevAmt - nextAmt > 0) {
              sender =
                preTokEntry.owner ??
                pubkeyToString(accounts[preTokEntry.accountIndex]?.pubkey);
              break;
            }
          }

          const decimals =
            MINT_TO_DECIMALS[post.mint] ?? post.uiTokenAmount.decimals;
          const symbol =
            MINT_TO_SYMBOL[post.mint] || post.mint.slice(0, 4) + "…";
          items.push({
            id: `${sigInfo.signature}-${post.mint}`,
            trade_type: "received",
            input_token_symbol: symbol,
            input_amount_raw: String(diff),
            input_decimals: decimals,
            sender,
            signature: sigInfo.signature,
            explorer_url: explorerUrl,
            created_at: createdAt,
          });
        }
      }

      setReceived(items);
    } catch (e) {
      console.warn(
        "[useReceivedTransfers]",
        e instanceof Error ? e.message : String(e),
      );
      setReceived([]);
    } finally {
      setLoading(false);
    }
  }, [walletAddress, isDevnet, connection]);

  return { received, loading, fetchReceived };
}
