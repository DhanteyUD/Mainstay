import { useState, useCallback } from "react";
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

  const fetchReceived = useCallback(async () => {
    if (!walletAddress) {
      setReceived([]);
      return;
    }
    setLoading(true);
    try {
      const rpcUrl = isDevnet ? SOLANA_DEVNET_RPC : SOLANA_RPC_PROXY;
      const connection = new Connection(rpcUrl, {
        commitment: "confirmed",
        wsEndpoint: "",
      });
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
        3,
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
        const explorerUrl = isDevnet
          ? `https://solscan.io/tx/${sigInfo.signature}?cluster=devnet`
          : `https://solscan.io/tx/${sigInfo.signature}`;
        const createdAt = sigInfo.blockTime
          ? new Date(sigInfo.blockTime * 1000).toISOString()
          : null;

        const allIxs = [
          ...(tx.transaction.message.instructions ?? []),
          ...(tx.meta?.innerInstructions?.flatMap((g) => g.instructions) ?? []),
        ];
        for (const ix of allIxs) {
          if (
            "parsed" in ix &&
            ix.program === "system" &&
            ix.parsed?.type === "transfer" &&
            ix.parsed?.info?.destination === walletAddress
          ) {
            const lamports = ix.parsed.info.lamports as number;
            if (lamports < 1000) continue;
            items.push({
              id: `${sigInfo.signature}-sol`,
              trade_type: "received",
              input_token_symbol: "SOL",
              input_amount_raw: String(lamports),
              input_decimals: 9,
              sender: ix.parsed.info.source as string,
              signature: sigInfo.signature,
              explorer_url: explorerUrl,
              created_at: createdAt,
            });
            break;
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
              const acctKey = accounts[post.accountIndex]?.pubkey;
              const acctAddr =
                typeof acctKey === "string"
                  ? acctKey
                  : (acctKey as PublicKey)?.toBase58?.();
              isWalletOwned = acctAddr === ata.toBase58();
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
              const acctKey = accounts[preTokEntry.accountIndex]?.pubkey;
              sender =
                preTokEntry.owner ??
                (typeof acctKey === "string"
                  ? acctKey
                  : (acctKey as PublicKey)?.toBase58?.()) ??
                null;
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
      console.warn("[useReceivedTransfers]", (e as Error).message);
      setReceived([]);
    } finally {
      setLoading(false);
    }
  }, [walletAddress, isDevnet]);

  return { received, loading, fetchReceived };
}
