import { useState, useEffect, useRef, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, VersionedTransaction } from "@solana/web3.js";
import {
  DIALECT_PROXY,
  DFLOW_PROXY,
  SOLANA_RPC_PROXY,
  SOLANA_DEVNET_RPC,
  JUPITER_QUOTE_API,
  JUPITER_SWAP_API,
} from "../config";
import { useNetwork } from "../contexts/NetworkContext";

const STORAGE_KEY = "mainstay_limit_orders_v1";
const POLL_MS = 30_000;

function genId() {
  return `lo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadStored(walletAddress) {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return all[walletAddress] || [];
  } catch {
    return [];
  }
}

function storeOrders(walletAddress, orders) {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    all[walletAddress] = orders;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

export async function fetchTokenPriceUsd(mint) {
  const res = await fetch(`${DIALECT_PROXY}/api.jup.ag/price/v3?ids=${mint}`);
  if (!res.ok) throw new Error("price fetch failed");
  const data = await res.json();
  return data[mint]?.usdPrice ?? null;
}

async function fetchPricesBatch(mints) {
  const ids = [...new Set(mints)].join(",");
  const res = await fetch(`${DIALECT_PROXY}/api.jup.ag/price/v3?ids=${ids}`);
  if (!res.ok) throw new Error("price fetch failed");
  return await res.json();
}

async function fetchDFlowQuote({
  inputMint,
  outputMint,
  amount,
  decimals,
  walletPublicKey,
}) {
  const raw = Math.floor(Number(amount) * 10 ** decimals);
  const p = new URLSearchParams({
    inputMint,
    outputMint,
    amount: raw.toString(),
    slippageBps: "auto",
    prioritizationFeeLamports: "auto",
    wrapAndUnwrapSol: "true",
    feeBps: "8",
  });
  if (walletPublicKey) p.set("userPublicKey", walletPublicKey);
  const res = await fetch(`${DFLOW_PROXY}/e.quote-api.dflow.net/order?${p}`);
  if (!res.ok) throw new Error(`quote failed (${res.status})`);
  const data = await res.json();
  if (!data?.outAmount && !data?.outputAmount)
    throw new Error("no route found");
  return data;
}

async function fetchJupiterQuoteForOrder({
  inputMint,
  outputMint,
  amount,
  decimals,
}) {
  const rawAmount = Math.floor(Number(amount) * Math.pow(10, decimals));
  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount: rawAmount.toString(),
    slippageBps: "50",
    swapMode: "ExactIn",
  });
  const res = await fetch(`${JUPITER_QUOTE_API}?${params}`);
  if (!res.ok) throw new Error(`Jupiter quote failed (${res.status})`);
  const data = await res.json();
  if (!data?.outAmount) throw new Error("no route found");
  return data;
}

async function fetchJupiterSwapTxForOrder(quoteResponse, userPublicKey) {
  const res = await fetch(JUPITER_SWAP_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse,
      userPublicKey,
      wrapAndUnwrapSol: true,
      prioritizationFeeLamports: "auto",
    }),
  });
  if (!res.ok) throw new Error(`Jupiter swap tx failed (${res.status})`);
  return res.json();
}

async function confirmTx(connection, sig) {
  for (let i = 0; i < 45; i++) {
    const { value: s } = await connection.getSignatureStatus(sig);
    if (
      s?.confirmationStatus === "confirmed" ||
      s?.confirmationStatus === "finalized"
    ) {
      if (s.err) throw new Error(`on-chain error: ${JSON.stringify(s.err)}`);
      return;
    }
    await new Promise((r) => setTimeout(r, 1200));
  }
  throw new Error("confirmation timeout — check your wallet");
}

export function useLimitOrders() {
  const wallet = useWallet();
  const { isDevnet } = useNetwork();
  const { publicKey, connected } = wallet;
  const walletAddress = publicKey?.toBase58() ?? null;

  const [orders, setOrders] = useState([]);
  const [currentPrices, setCurrentPrices] = useState({});

  const ordersRef = useRef(orders);
  const walletRef = useRef(wallet);
  const addrRef = useRef(walletAddress);
  const isDevnetRef = useRef(isDevnet);
  const executingSet = useRef(new Set());

  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);
  useEffect(() => {
    walletRef.current = wallet;
  }, [wallet]);
  useEffect(() => {
    addrRef.current = walletAddress;
  }, [walletAddress]);
  useEffect(() => {
    isDevnetRef.current = isDevnet;
  }, [isDevnet]);

  useEffect(() => {
    setOrders(walletAddress ? loadStored(walletAddress) : []);
  }, [walletAddress]);

  const persist = useCallback((updater) => {
    setOrders((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (addrRef.current) storeOrders(addrRef.current, next);
      return next;
    });
  }, []);

  const addOrder = useCallback(
    (params) => {
      if (!addrRef.current) return null;
      const order = {
        id: genId(),
        walletAddress: addrRef.current,
        status: "pending",
        createdAt: new Date().toISOString(),
        executedAt: null,
        signature: null,
        explorerUrl: null,
        error: null,
        ...params,
      };
      persist((prev) => [order, ...prev]);
      return order.id;
    },
    [persist],
  );

  const cancelOrder = useCallback(
    (id) => {
      persist((prev) =>
        prev.map((o) =>
          o.id === id && o.status === "pending"
            ? { ...o, status: "cancelled" }
            : o,
        ),
      );
    },
    [persist],
  );

  useEffect(() => {
    if (!connected || !walletAddress) return;

    async function tick() {
      const pending = ordersRef.current.filter((o) => o.status === "pending");
      if (!pending.length) return;

      const mints = [...new Set(pending.map((o) => o.inputToken.mint))];
      let priceData;
      try {
        priceData = await fetchPricesBatch(mints);
        setCurrentPrices((prev) => ({ ...prev, ...priceData }));
      } catch {
        return;
      }

      for (const order of pending) {
        if (executingSet.current.has(order.id)) continue;
        const usd = priceData[order.inputToken.mint]?.usdPrice;
        if (usd == null) continue;

        const triggered =
          (order.direction === "above" && usd >= order.targetPrice) ||
          (order.direction === "below" && usd <= order.targetPrice);
        if (!triggered) continue;

        executingSet.current.add(order.id);
        persist((prev) =>
          prev.map((o) =>
            o.id === order.id ? { ...o, status: "executing" } : o,
          ),
        );
        (async () => {
          try {
            const addr = addrRef.current;
            const wlt = walletRef.current;
            const devnet = isDevnetRef.current;

            let sig, explorerUrl;

            if (devnet) {
              const jupiterQuote = await fetchJupiterQuoteForOrder({
                inputMint: order.inputToken.mint,
                outputMint: order.outputToken.mint,
                amount: order.inputAmount,
                decimals: order.inputToken.decimals,
              });
              const swapData = await fetchJupiterSwapTxForOrder(
                jupiterQuote,
                addr,
              );
              const conn = new Connection(SOLANA_DEVNET_RPC, {
                commitment: "confirmed",
                wsEndpoint: "",
              });
              const txBytes = Uint8Array.from(
                atob(swapData.swapTransaction),
                (c) => c.charCodeAt(0),
              );
              const tx = VersionedTransaction.deserialize(txBytes);
              const signed = await wlt.signTransaction(tx);
              sig = await conn.sendRawTransaction(signed.serialize(), {
                skipPreflight: true,
              });
              await confirmTx(conn, sig);
              explorerUrl = `https://solscan.io/tx/${sig}?cluster=devnet`;
            } else {
              const quote = await fetchDFlowQuote({
                inputMint: order.inputToken.mint,
                outputMint: order.outputToken.mint,
                amount: order.inputAmount,
                decimals: order.inputToken.decimals,
                walletPublicKey: addr,
              });
              const conn = new Connection(SOLANA_RPC_PROXY, {
                commitment: "confirmed",
                wsEndpoint: "",
              });
              const txBytes = Uint8Array.from(atob(quote.transaction), (c) =>
                c.charCodeAt(0),
              );
              const tx = VersionedTransaction.deserialize(txBytes);
              const signed = await wlt.signTransaction(tx);
              const sig = await conn.sendRawTransaction(signed.serialize(), {
                skipPreflight: true,
              });
              await confirmTx(conn, sig);
              explorerUrl = `https://solscan.io/tx/${sig}`;
            }

            persist((prev) =>
              prev.map((o) =>
                o.id === order.id
                  ? {
                      ...o,
                      status: "executed",
                      executedAt: new Date().toISOString(),
                      signature: sig,
                      explorerUrl,
                    }
                  : o,
              ),
            );
          } catch (err) {
            persist((prev) =>
              prev.map((o) =>
                o.id === order.id
                  ? {
                      ...o,
                      status: "failed",
                      error: (err.message || "execution failed").slice(0, 120),
                    }
                  : o,
              ),
            );
          } finally {
            executingSet.current.delete(order.id);
          }
        })();
      }
    }

    tick();
    const id = setInterval(tick, POLL_MS);
    return () => clearInterval(id);
  }, [connected, walletAddress, persist]);

  return {
    orders,
    currentPrices,
    addOrder,
    cancelOrder,
    pendingCount: orders.filter((o) => o.status === "pending").length,
  };
}
