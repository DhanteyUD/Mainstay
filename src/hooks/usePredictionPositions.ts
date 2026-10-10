import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { fetchMarketByMint } from "../lib/predictionApi";
import type { PredictionMarket } from "../config";

const TOKEN_PROGRAM = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
);
const TOKEN_2022_PROGRAM = new PublicKey(
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
);
const MAX_POSITIONS = 25;

export interface PredictionPosition {
  mint: string;
  side: "YES" | "NO";
  amount: number;
  rawAmount: string;
  decimals: number;
  market: PredictionMarket;
  valueUsd: number | null;
  redeemable: boolean;
  lost: boolean;
}

export function usePredictionPositions(enabled: boolean) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const qc = useQueryClient();
  const owner = publicKey?.toBase58();
  const key = ["prediction-positions", owner];

  const { data, isLoading } = useQuery({
    queryKey: key,
    enabled: enabled && !!publicKey,
    refetchInterval: 45_000,
    staleTime: 15_000,
    queryFn: async (): Promise<PredictionPosition[]> => {
      const [spl, t22] = await Promise.all([
        connection.getParsedTokenAccountsByOwner(publicKey!, {
          programId: TOKEN_PROGRAM,
        }),
        connection.getParsedTokenAccountsByOwner(publicKey!, {
          programId: TOKEN_2022_PROGRAM,
        }),
      ]);
      const held = [...spl.value, ...t22.value]
        .map((a) => a.account.data.parsed.info)
        .filter((i) => Number(i.tokenAmount.amount) > 0)
        .slice(0, 200);

      const resolved: {
        info: (typeof held)[number];
        hit: Awaited<ReturnType<typeof fetchMarketByMint>>;
      }[] = [];
      for (let i = 0; i < held.length; i += 8) {
        const chunk = held.slice(i, i + 8);
        const hits = await Promise.all(
          chunk.map((c) => fetchMarketByMint(c.mint as string)),
        );
        chunk.forEach((info, j) => resolved.push({ info, hit: hits[j] }));
      }

      const out: PredictionPosition[] = [];
      for (const { info, hit } of resolved) {
        if (!hit?.market?.live || !hit.side) continue;
        const live = hit.market.live;
        const settled = live.result === "yes" || live.result === "no";
        const won = settled && live.result === hit.side.toLowerCase();
        const mark = hit.side === "YES" ? live.yesBid : live.noBid;
        const amount = Number(
          info.tokenAmount.uiAmountString ?? info.tokenAmount.uiAmount ?? 0,
        );
        out.push({
          mint: info.mint as string,
          side: hit.side,
          amount,
          rawAmount: String(info.tokenAmount.amount),
          decimals: Number(info.tokenAmount.decimals),
          market: hit.market,
          valueUsd: settled
            ? won
              ? amount
              : 0
            : mark != null
              ? amount * mark
              : null,
          redeemable: won && live.redemptionOpen,
          lost: settled && !won,
        });
        if (out.length >= MAX_POSITIONS) break;
      }
      return out;
    },
  });

  return {
    positions: data ?? [],
    loading: isLoading,
    refresh: () => qc.invalidateQueries({ queryKey: key }),
  };
}
