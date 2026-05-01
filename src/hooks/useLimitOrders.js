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
import { supabase } from "../lib/supabase";
import { TOKEN_LIST } from "../config";

const STORAGE_KEY = "mainstay_limit_orders_v1";
const POLL_MS = 30_000;
const DB_ENABLED = supabase !== null;

function getTable(devnet) {
  return devnet ? "devLimitOrders" : "limitOrders";
}

function buildRow(order) {
  return {
    id: order.id,
    wallet_address: order.walletAddress,
    status: order.status,
    direction: order.direction,
    input_token_mint: order.inputToken.mint,
    input_token_symbol: order.inputToken.symbol,
    input_token_decimals: order.inputToken.decimals,
    output_token_mint: order.outputToken.mint,
    output_token_symbol: order.outputToken.symbol,
    output_token_decimals: order.outputToken.decimals,
    input_amount: String(order.inputAmount),
    target_price: order.targetPrice,
    executed_at: order.executedAt ?? null,
    signature: order.signature ?? null,
    explorer_url: order.explorerUrl ?? null,
    error: order.error ?? null,
  };
}

function logoForMint(mint) {
  return TOKEN_LIST.find((t) => t.mint === mint)?.logo ?? null;
}

function rowToOrder(row) {
  return {
    id: row.id,
    walletAddress: row.wallet_address,
    network: row.network ?? null,
    status: row.status,
    direction: row.direction,
    inputToken: {
      mint: row.input_token_mint,
      symbol: row.input_token_symbol,
      decimals: row.input_token_decimals,
      logo: logoForMint(row.input_token_mint),
    },
    outputToken: {
      mint: row.output_token_mint,
      symbol: row.output_token_symbol,
      decimals: row.output_token_decimals,
      logo: logoForMint(row.output_token_mint),
    },
    inputAmount: row.input_amount,
    targetPrice: Number(row.target_price),
    createdAt: row.created_at,
    executedAt: row.executed_at ?? null,
    signature: row.signature ?? null,
    explorerUrl: row.explorer_url ?? null,
    error: row.error ?? null,
  };
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

function dbInsert(table, row) {
  if (!DB_ENABLED) return;
  supabase
    .from(table)
    .insert(row)
    .then(({ error: err }) => {
      if (err) console.warn(`[useLimitOrders] insert to ${table} failed:`, err.message);
    });
}

function dbUpdate(table, id, patch) {
  if (!DB_ENABLED) return;
  supabase
    .from(table)
    .update(patch)
    .eq("id", id)
    .then(({ error: err }) => {
      if (err) console.warn(`[useLimitOrders] update on ${table} failed:`, err.message);
    });
}

function genId() {
  return `lo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function humanizeError(err) {
  const raw = typeof err === "string" ? err : (err?.message ?? "");
  if (!raw) return "Order execution failed";

  if (/user rejected/i.test(raw)) return "Transaction rejected in wallet";
  if (/confirmation timeout/i.test(raw)) return "Transaction timed out — check your wallet";
  if (/on-chain error/i.test(raw)) return "Transaction failed on-chain";
  if (/no route found/i.test(raw)) return "No swap route available for this pair";
  if (/quote failed/i.test(raw)) return "Could not get a quote — try again";
  if (/price fetch failed/i.test(raw)) return "Could not fetch current price";
  if (/swap tx failed/i.test(raw)) return "Swap transaction could not be built";
  if (/insufficient.*balance/i.test(raw)) return "Insufficient balance";
  if (/blockhash/i.test(raw)) return "Transaction expired — try again";

  if (/^\s*(import|export|const|let|var|function)\s/.test(raw)) {
    return "Order execution failed";
  }

  return raw.slice(0, 120);
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

  const BASE = typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => { ordersRef.current = orders; }, [orders]);
  useEffect(() => { walletRef.current = wallet; }, [wallet]);
  useEffect(() => { addrRef.current = walletAddress; }, [walletAddress]);
  useEffect(() => { isDevnetRef.current = isDevnet; }, [isDevnet]);

  useEffect(() => {
    if (!walletAddress) {
      setOrders([]);
      return;
    }

    if (!DB_ENABLED) {
      setOrders(loadStored(walletAddress));
      return;
    }

    const table = getTable(isDevnet);

    supabase
      .from(table)
      .select("*")
      .eq("wallet_address", walletAddress)
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data, error: err }) => {
        if (err) {
          console.warn("[useLimitOrders] fetch error:", err.message);
          setOrders(loadStored(walletAddress));
          return;
        }
        if (data && data.length > 0) {
          const mapped = data.map(rowToOrder);
          setOrders(mapped);
          storeOrders(walletAddress, mapped);
        } else {
          // DB returned nothing — try localStorage before giving up
          const local = loadStored(walletAddress);
          setOrders(local);
        }
      });
  }, [walletAddress, isDevnet]); // eslint-disable-line react-hooks/exhaustive-deps

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
        network: isDevnetRef.current ? "devnet" : "mainnet",
        status: "pending",
        createdAt: new Date().toISOString(),
        executedAt: null,
        signature: null,
        explorerUrl: null,
        error: null,
        ...params,
      };
      persist((prev) => [order, ...prev]);
      dbInsert(getTable(isDevnetRef.current), buildRow(order));
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
      dbUpdate(getTable(isDevnetRef.current), id, { status: "cancelled" });
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
        dbUpdate(getTable(isDevnetRef.current), order.id, { status: "executing" });

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
              const swapData = await fetchJupiterSwapTxForOrder(jupiterQuote, addr);
              const conn = new Connection(SOLANA_DEVNET_RPC, { commitment: "confirmed", wsEndpoint: "" });
              const txBytes = Uint8Array.from(atob(swapData.swapTransaction), (c) => c.charCodeAt(0));
              const tx = VersionedTransaction.deserialize(txBytes);
              const signed = await wlt.signTransaction(tx);
              sig = await conn.sendRawTransaction(signed.serialize(), { skipPreflight: true });
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
              const conn = new Connection(`${BASE}${SOLANA_RPC_PROXY}`, { commitment: "confirmed", wsEndpoint: "" });
              const txBytes = Uint8Array.from(atob(quote.transaction), (c) => c.charCodeAt(0));
              const tx = VersionedTransaction.deserialize(txBytes);
              const signed = await wlt.signTransaction(tx);
              sig = await conn.sendRawTransaction(signed.serialize(), { skipPreflight: true });
              await confirmTx(conn, sig);
              explorerUrl = `https://solscan.io/tx/${sig}`;
            }

            const executedAt = new Date().toISOString();
            persist((prev) =>
              prev.map((o) =>
                o.id === order.id
                  ? { ...o, status: "executed", executedAt, signature: sig, explorerUrl }
                  : o,
              ),
            );
            dbUpdate(getTable(devnet), order.id, {
              status: "executed",
              executed_at: executedAt,
              signature: sig,
              explorer_url: explorerUrl,
            });
          } catch (err) {
            const errorMsg = humanizeError(err);
            persist((prev) =>
              prev.map((o) =>
                o.id === order.id ? { ...o, status: "failed", error: errorMsg } : o,
              ),
            );
            dbUpdate(getTable(isDevnetRef.current), order.id, {
              status: "failed",
              error: errorMsg,
            });
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

  const currentNetwork = isDevnet ? "devnet" : "mainnet";
  const filteredOrders = orders.filter(
    (o) => !o.network || o.network === currentNetwork,
  );

  return {
    orders: filteredOrders,
    currentPrices,
    addOrder,
    cancelOrder,
    pendingCount: filteredOrders.filter((o) => o.status === "pending").length,
  };
}
