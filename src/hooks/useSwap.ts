import { useState, useCallback, useRef, useEffect } from "react";
import { Connection, VersionedTransaction } from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import {
  DFLOW_QUOTE_API,
  SOLANA_RPC_PROXY,
  SOLANA_DEVNET_RPC,
  JUPITER_QUOTE_API,
  JUPITER_SWAP_API,
} from "../config";
import { useNetwork } from "../contexts/NetworkContext";
import type { Token, SwapResult } from "../types";

type SwapStatus = "idle" | "signing" | "confirming" | "success" | "error";

interface FetchQuoteParams {
  inputMint: string;
  outputMint: string;
  amount: string | number;
  decimals: number;
  walletPublicKey?: string;
  feeBps?: number | null;
  prioritizationFeeLamports?: string | null;
  slippageBps?: string;
  autoSlippage?: boolean;
}

interface ExecuteSwapParams {
  quote: Record<string, unknown>;
  wallet: WalletContextState;
  inputToken: Token;
  outputToken: Token;
  priorityFeeMode?: "max" | "exact";
  priorityFeeAmountSol?: string;
}

interface SecurityError extends Error {
  _securityWarn?: boolean;
}

function parseTokenAmount(amountStr: string, decimals: number): bigint {
  const [whole, frac = ""] = Number(amountStr).toFixed(decimals).split(".");
  const paddedFrac = frac.padEnd(decimals, "0").slice(0, decimals);
  return BigInt(whole) * BigInt(10 ** decimals) + BigInt(paddedFrac);
}

function humanizeError(msg: string | undefined): string {
  if (!msg) return "An unknown error occurred.";
  const m = msg.toLowerCase();
  if (
    m.includes("user rejected") ||
    m.includes("cancelled") ||
    m.includes("rejected")
  ) {
    return "Transaction cancelled in wallet.";
  }
  if (m.includes("slippage") || m.includes("0x1788")) {
    return "Price moved too much. Try again — slippage was exceeded.";
  }
  if (m.includes("insufficient") || m.includes("balance")) {
    return "Insufficient balance. Check your wallet has enough funds + SOL for fees.";
  }
  if (
    m.includes("no route") ||
    m.includes("no routes") ||
    m.includes("no_routes")
  ) {
    return "No route found for this pair. Try a different amount or token.";
  }
  if (m.includes("aborted") || m.includes("abort")) {
    return "Request timed out. Check your connection and retry.";
  }
  if (
    m.includes("failed to fetch") ||
    m.includes("networkerror") ||
    m.includes("network request failed") ||
    m.includes("load failed")
  ) {
    return "Network error — could not reach the quote server. Check your connection or try opening in a browser.";
  }
  if (m.includes("timeout")) {
    return "Transaction timed out. It may have still gone through — check your wallet.";
  }
  if (msg.startsWith("Simulation failed:")) {
    return "Transaction simulation failed. Your balance may be insufficient or the route is stale — try refreshing the quote.";
  }
  if (m.includes("simulation failed") || m.includes("simulat")) {
    return "Transaction simulation failed. Check your balance and try again.";
  }
  if (m.includes("address table") || m.includes("alt")) {
    return "Routing error. Please try again in a moment.";
  }
  if (m.includes("quote unavailable") || m.includes("quote failed")) {
    return "Quote unavailable right now. Try again in a moment.";
  }
  if (m.includes("transaction failed on-chain")) {
    try {
      const jsonStart = msg.indexOf("{");
      if (jsonStart !== -1) {
        const errObj = JSON.parse(msg.slice(jsonStart));
        if (errObj.InstructionError) {
          const [ixIdx, detail] = errObj.InstructionError;
          if (detail?.Custom !== undefined) {
            return `Transaction rejected by program (error ${detail.Custom}, instruction ${ixIdx}). The route may be stale or your balance is insufficient — refresh the quote and try again.`;
          }
          if (typeof detail === "string") {
            return `Transaction rejected on-chain: ${detail}. Refresh the quote and try again.`;
          }
        }
      }
    } catch (_) {
      // fall through
    }
    return "Transaction was rejected by the network. Check your balance and try again.";
  }
  return msg.length > 120 ? msg.slice(0, 120) + "…" : msg;
}

async function confirmTransactionPolling(
  connection: Connection,
  signature: string,
  maxRetries = 45,
) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await connection.getSignatureStatus(signature);
    const status = response?.value;
    if (
      status?.confirmationStatus === "confirmed" ||
      status?.confirmationStatus === "finalized"
    ) {
      if (status.err) {
        throw new Error(
          `Transaction failed on-chain: ${JSON.stringify(status.err)}`,
        );
      }
      return status;
    }
    await new Promise((r) => setTimeout(r, 1200));
  }
  throw new Error(
    "Transaction confirmation timeout. Check your wallet for status.",
  );
}

function isSecurityCheckError(msg: string | undefined): boolean {
  if (!msg) return false;
  const m = msg.toLowerCase();
  return (
    m.includes("security verification") ||
    m.includes("verify this transaction") ||
    m.includes("security risk") ||
    m.includes("server error while attempting to verify")
  );
}

async function fetchJupiterQuote({
  inputMint,
  outputMint,
  amount,
  decimals,
  slippageBps = "50",
  autoSlippage = false,
}: FetchQuoteParams) {
  const rawAmount = parseTokenAmount(String(amount), decimals);
  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount: rawAmount.toString(),
    swapMode: "ExactIn",
  });
  if (autoSlippage) {
    params.set("autoSlippage", "true");
    params.set("maxAutoSlippageBps", "500");
  } else {
    params.set("slippageBps", slippageBps);
  }
  const res = await fetch(`${JUPITER_QUOTE_API}?${params}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Quote failed (${res.status}): ${text.slice(0, 120)}`);
  }
  const data = await res.json();
  if (!data?.outAmount) throw new Error("No route found for this pair.");
  return data as Record<string, unknown>;
}

async function fetchJupiterSwapTx(
  quoteResponse: Record<string, unknown>,
  userPublicKey: string,
  priorityFeeMode: "max" | "exact" = "max",
  priorityFeeAmountSol: string = "0.0001",
) {
  const prioritizationFeeLamports =
    priorityFeeMode === "exact"
      ? Math.round(parseFloat(priorityFeeAmountSol || "0.0001") * 1e9)
      : "auto";
  const res = await fetch(JUPITER_SWAP_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse,
      userPublicKey,
      wrapAndUnwrapSol: true,
      prioritizationFeeLamports,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Swap transaction failed (${res.status}): ${text.slice(0, 120)}`,
    );
  }
  return res.json() as Promise<{ swapTransaction: string }>;
}

export function useSwap() {
  const { isDevnet } = useNetwork();
  const isDevnetRef = useRef(isDevnet);

  useEffect(() => {
    isDevnetRef.current = isDevnet;
  }, [isDevnet]);

  const [quote, setQuote] = useState<Record<string, unknown> | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [swapStatus, setSwapStatus] = useState<SwapStatus>("idle");
  const [swapResult, setSwapResult] = useState<SwapResult | null>(null);
  const [swapError, setSwapError] = useState<string | null>(null);
  const [swapWarning, setSwapWarning] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastParamsRef = useRef<FetchQuoteParams | null>(null);

  const doFetch = useCallback(async (params: FetchQuoteParams) => {
    const {
      inputMint,
      outputMint,
      amount,
      decimals,
      walletPublicKey,
      feeBps,
      prioritizationFeeLamports,
      slippageBps = "50",
      autoSlippage = false,
    } = params;
    setQuoteLoading(true);
    setQuoteError(null);
    setQuote(null);

    try {
      let data: Record<string, unknown>;

      if (isDevnetRef.current) {
        data = await fetchJupiterQuote({
          inputMint,
          outputMint,
          amount,
          decimals,
          slippageBps,
          autoSlippage,
        });
      } else {
        let lastErr: Error | null = null;
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            if (attempt > 0) await new Promise((r) => setTimeout(r, 1000));
            const rawAmount = parseTokenAmount(String(amount), decimals);
            const urlParams = new URLSearchParams({
              inputMint,
              outputMint,
              amount: rawAmount.toString(),
              prioritizationFeeLamports: prioritizationFeeLamports ?? "auto",
              wrapAndUnwrapSol: "true",
            });
            if (walletPublicKey)
              urlParams.set("userPublicKey", walletPublicKey);
            if (feeBps != null) urlParams.set("feeBps", String(feeBps));
            if (autoSlippage) {
              urlParams.set("autoSlippage", "true");
              urlParams.set("maxAutoSlippageBps", "500");
            } else {
              urlParams.set("slippageBps", slippageBps);
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 14000);
            let res: Response;
            try {
              res = await fetch(
                `${DFLOW_QUOTE_API}/order?${urlParams}`,
                {
                  method: "GET",
                  mode: "cors",
                  credentials: "omit",
                  signal: controller.signal,
                },
              );
              clearTimeout(timeoutId);
            } catch (e) {
              clearTimeout(timeoutId);
              throw e;
            }
            if (!res.ok) {
              const errText = await res.text();
              throw new Error(
                `Quote failed (${res.status}): ${errText.slice(0, 120)}`,
              );
            }
            data = await res.json();
            if (!data || (!data.outAmount && !data.outputAmount)) {
              throw new Error("No route found for this token pair.");
            }
            lastErr = null;
            break;
          } catch (err) {
            lastErr = err as Error;
          }
        }
        if (lastErr) throw lastErr;
        data = data!;
      }

      setQuote(data!);
      setQuoteLoading(false);
    } catch (err) {
      setQuoteError(humanizeError((err as Error)?.message));
      setQuote(null);
      setQuoteLoading(false);
    }
  }, []);

  const fetchQuote = useCallback(
    async (params: FetchQuoteParams) => {
      const { amount } = params;
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        setQuote(null);
        setQuoteError(null);
        return;
      }
      if (debounceRef.current) clearTimeout(debounceRef.current);
      lastParamsRef.current = params;
      debounceRef.current = setTimeout(() => {
        if (lastParamsRef.current) doFetch(lastParamsRef.current);
      }, 600);
    },
    [doFetch],
  );

  const retryQuote = useCallback(() => {
    if (lastParamsRef.current) doFetch(lastParamsRef.current);
  }, [doFetch]);

  const executeSwap = useCallback(
    async ({
      quote,
      wallet,
      inputToken,
      outputToken,
      priorityFeeMode = "max",
      priorityFeeAmountSol = "0.0001",
    }: ExecuteSwapParams): Promise<SwapResult | null> => {
      if (!wallet?.publicKey) {
        setSwapError("Missing wallet.");
        return null;
      }

      setSwapStatus("signing");
      setSwapError(null);
      setSwapWarning(null);
      setSwapResult(null);

      try {
        let signature: string;
        let explorerUrl: string;

        if (isDevnetRef.current) {
          const swapData = await fetchJupiterSwapTx(
            quote,
            wallet.publicKey.toBase58(),
            priorityFeeMode,
            priorityFeeAmountSol,
          );
          const txBytes = Uint8Array.from(atob(swapData.swapTransaction), (c) =>
            c.charCodeAt(0),
          );
          const tx = VersionedTransaction.deserialize(txBytes);

          if (!wallet.signTransaction) {
            throw new Error("Connected wallet does not support signing.");
          }
          let signedTx: VersionedTransaction;
          try {
            signedTx = await wallet.signTransaction(tx);
          } catch (sigErr) {
            throw new Error(
              (sigErr as Error)?.message || "Wallet rejected the transaction.",
            );
          }

          setSwapStatus("confirming");

          const connection = new Connection(SOLANA_DEVNET_RPC, {
            commitment: "confirmed",
            wsEndpoint: "",
          });

          signature = await connection.sendRawTransaction(
            signedTx.serialize(),
            { skipPreflight: true },
          );
          await confirmTransactionPolling(connection, signature);
          explorerUrl = `https://solscan.io/tx/${signature}?cluster=devnet`;
        } else {
          if (!quote?.transaction) {
            setSwapError("Missing quote transaction.");
            return null;
          }

          const connection = new Connection(SOLANA_RPC_PROXY, {
            commitment: "confirmed",
            wsEndpoint: "",
          });

          const txBytes = Uint8Array.from(
            atob(quote.transaction as string),
            (c) => c.charCodeAt(0),
          );
          const tx = VersionedTransaction.deserialize(txBytes);

          try {
            const sim = await connection.simulateTransaction(tx, {
              sigVerify: false,
              commitment: "confirmed",
            });
            if (sim.value.err) {
              throw new Error(
                `Simulation failed: ${JSON.stringify(sim.value.err)}`,
              );
            }
          } catch (simErr) {
            const msg = (simErr as Error).message ?? "";
            if (msg.startsWith("Simulation failed:")) throw simErr;
            // Network/RPC error during simulation — proceed without aborting
          }

          if (!wallet.signTransaction) {
            throw new Error("Connected wallet does not support signing.");
          }
          let signedTx: VersionedTransaction;
          try {
            signedTx = await wallet.signTransaction(tx);
          } catch (sigErr) {
            throw new Error(
              (sigErr as Error)?.message || "Wallet rejected the transaction.",
            );
          }

          setSwapStatus("confirming");

          try {
            signature = await connection.sendRawTransaction(
              signedTx.serialize(),
              { skipPreflight: true },
            );
          } catch (sendErr) {
            const secErr = sendErr as SecurityError;
            if (isSecurityCheckError(secErr?.message)) {
              secErr._securityWarn = true;
            }
            throw secErr;
          }

          await confirmTransactionPolling(connection, signature);
          explorerUrl = `https://solscan.io/tx/${signature}`;
        }

        const result: SwapResult = {
          signature,
          inputAmount: String(quote.inAmount),
          outputAmount: String(quote.outAmount || quote.outputAmount),
          inputToken,
          outputToken,
          slippageBps: quote.slippageBps as number | undefined,
          quotedOutput: String(quote.outAmount || quote.outputAmount),
          explorerUrl,
        };

        setSwapResult(result);
        setSwapStatus("success");
        return result;
      } catch (err) {
        const secErr = err as SecurityError;
        if (
          !isDevnetRef.current &&
          (secErr._securityWarn || isSecurityCheckError(secErr?.message))
        ) {
          setSwapWarning(
            "Security check unavailable — your trade is still protected by DFlow",
          );
          setSwapStatus("idle");
          setSwapError(null);
          return null;
        }

        const errMsg = humanizeError((err as Error).message);
        setSwapError(errMsg);
        setSwapStatus("error");
        return null;
      }
    },
    [],
  );

  const resetSwap = useCallback(() => {
    setSwapStatus("idle");
    setSwapResult(null);
    setSwapError(null);
    setSwapWarning(null);
  }, []);

  const clearWarning = useCallback(() => {
    setSwapWarning(null);
  }, []);

  const clearQuote = useCallback(() => {
    setQuote(null);
    setQuoteError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  return {
    quote,
    quoteLoading,
    quoteError,
    fetchQuote,
    retryQuote,
    clearQuote,
    executeSwap,
    swapStatus,
    swapResult,
    swapError,
    swapWarning,
    clearWarning,
    resetSwap,
  };
}
