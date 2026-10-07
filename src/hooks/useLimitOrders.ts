import { useState, useEffect, useRef, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import { notify } from "../lib/toast";
import { Connection, VersionedTransaction } from "@solana/web3.js";
import {
  JUPITER_PRICE_API,
  DFLOW_QUOTE_API,
  SOLANA_RPC_PROXY,
  SOLANA_DEVNET_RPC,
  JUPITER_QUOTE_API,
  JUPITER_SWAP_API,
  TOKEN_LIST,
} from "../config";
import { useNetwork } from "../contexts/NetworkContext";
import { supabase } from "../lib/supabase";
import type { LimitOrder } from "../types";
import { editOrderRemote, insertOrder, updateOrder } from "../lib/ordersApi";
import { functionsEnabled } from "../lib/walletAuth";
import type { MessageSigner } from "../lib/walletAuth";
import {
  requestPushPermission,
  showSystemNotification,
} from "../lib/pushNotifications";

const STORAGE_KEY = "mainstay_limit_orders_v1";
const LAST_WALLET_KEY = "mainstay_last_wallet";
const POLL_MS = 30_000;
const DB_ENABLED = supabase !== null;

function base64ToUint8Array(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

function getTable(devnet: boolean) {
  return devnet ? "devLimitOrders" : "limitOrders";
}

function buildRow(order: LimitOrder) {
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

function logoForMint(mint: string): string | null {
  return TOKEN_LIST.find((t) => t.mint === mint)?.logo ?? null;
}

interface OrderRow {
  id: string;
  wallet_address: string;
  network?: string | null;
  status: LimitOrder["status"];
  direction: LimitOrder["direction"];
  input_token_mint: string;
  input_token_symbol: string;
  input_token_decimals: number;
  output_token_mint: string;
  output_token_symbol: string;
  output_token_decimals: number;
  input_amount: string;
  target_price: number | string;
  created_at: string;
  executed_at?: string | null;
  signature?: string | null;
  explorer_url?: string | null;
  error?: string | null;
}

function rowToOrder(row: OrderRow): LimitOrder {
  return {
    id: row.id,
    walletAddress: row.wallet_address,
    network: (row.network as LimitOrder["network"]) ?? null,
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
    targetPrice: Number(row.target_price) || 0,
    createdAt: row.created_at,
    executedAt: row.executed_at ?? null,
    signature: row.signature ?? null,
    explorerUrl: row.explorer_url ?? null,
    error: row.error ?? null,
  };
}

function loadStored(walletAddress: string): LimitOrder[] {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return all[walletAddress] || [];
  } catch {
    return [];
  }
}

function storeOrders(walletAddress: string, orders: LimitOrder[]) {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    all[walletAddress] = orders;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

export async function fetchTokenPriceUsd(mint: string): Promise<number | null> {
  const res = await fetch(`${JUPITER_PRICE_API}?ids=${mint}`);
  if (!res.ok) throw new Error("price fetch failed");
  const data = await res.json();
  return data[mint]?.usdPrice ?? null;
}

async function fetchPricesBatch(
  mints: string[],
): Promise<Record<string, { usdPrice?: number }>> {
  const ids = [...new Set(mints)].join(",");
  const res = await fetch(`${JUPITER_PRICE_API}?ids=${ids}`);
  if (!res.ok) throw new Error("price fetch failed");
  return await res.json();
}

async function fetchDFlowQuote({
  inputMint,
  outputMint,
  amount,
  decimals,
  walletPublicKey,
}: {
  inputMint: string;
  outputMint: string;
  amount: string | number;
  decimals: number;
  walletPublicKey?: string | null;
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
  const res = await fetch(`${DFLOW_QUOTE_API}/order?${p}`);
  if (!res.ok) throw new Error(`quote failed (${res.status})`);
  const data = await res.json();
  if (!data?.outAmount && !data?.outputAmount)
    throw new Error("no route found");
  return data as { transaction: string };
}

async function fetchJupiterQuoteForOrder({
  inputMint,
  outputMint,
  amount,
  decimals,
}: {
  inputMint: string;
  outputMint: string;
  amount: string | number;
  decimals: number;
}) {
  const rawAmount = Math.floor(Number(amount) * 10 ** decimals);
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
  return data as Record<string, unknown>;
}

async function fetchJupiterSwapTxForOrder(
  quoteResponse: Record<string, unknown>,
  userPublicKey: string,
) {
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
  return res.json() as Promise<{ swapTransaction: string }>;
}

async function confirmTx(connection: Connection, sig: string) {
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

function genId(): string {
  return `lo_${crypto.randomUUID()}`;
}

function humanizeError(err: unknown): string {
  const raw = typeof err === "string" ? err : ((err as Error)?.message ?? "");
  if (!raw) return "Order execution failed";

  if (/user rejected/i.test(raw)) return "Transaction rejected in wallet";
  if (/confirmation timeout/i.test(raw))
    return "Transaction timed out — check your wallet";
  if (/on-chain error/i.test(raw)) return "Transaction failed on-chain";
  if (/no route found/i.test(raw))
    return "No swap route available for this pair";
  if (/quote failed/i.test(raw)) return "Could not get a quote — try again";
  if (/price fetch failed/i.test(raw)) return "Could not fetch current price";
  if (/swap tx failed/i.test(raw)) return "Swap transaction could not be built";
  if (/insufficient.*balance/i.test(raw)) return "Insufficient balance";
  if (/blockhash/i.test(raw)) return "Transaction expired — try again";

  return raw.slice(0, 120);
}

type OrdersUpdater = (prev: LimitOrder[]) => LimitOrder[];

export function useLimitOrders() {
  const wallet = useWallet();
  const { isDevnet } = useNetwork();
  const { publicKey, connected } = wallet;
  const walletAddress = publicKey?.toBase58() ?? null;

  const [orders, setOrders] = useState<LimitOrder[]>([]);
  const [currentPrices, setCurrentPrices] = useState<
    Record<string, { usdPrice?: number }>
  >({});

  const ordersRef = useRef(orders);
  const walletRef = useRef<WalletContextState>(wallet);
  const addrRef = useRef<string | null>(walletAddress);
  const isDevnetRef = useRef(isDevnet);
  const executingSet = useRef(new Set<string>());

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

  const writeChain = useRef<Promise<unknown>>(Promise.resolve());
  const warnedRef = useRef(false);

  const enqueueWrite = useCallback(
    (
      op: (signer: MessageSigner, network: "mainnet" | "devnet") => Promise<boolean>,
    ): Promise<boolean> => {
      const address = addrRef.current;
      // Nothing to sync (no backend configured): treat as success.
      if (!functionsEnabled || !address) return Promise.resolve(true);
      const signer: MessageSigner = {
        address,
        signMessage: walletRef.current.signMessage,
      };
      const network = isDevnetRef.current ? "devnet" : "mainnet";
      const result = writeChain.current
        .then(() => op(signer, network))
        .catch(() => false);
      writeChain.current = result.then((ok) => {
        if (ok || warnedRef.current) return;
        warnedRef.current = true;
        notify.warning({
          title: "Order not synced",
          description:
            "Sign in with your wallet to sync orders and enable Telegram alerts.",
        });
      });
      return result;
    },
    [],
  );

  const syncInsert = useCallback(
    (order: LimitOrder) =>
      enqueueWrite((signer, network) =>
        insertOrder(signer, network, buildRow(order)),
      ),
    [enqueueWrite],
  );

  const syncUpdate = useCallback(
    (id: string, patch: Record<string, unknown>) =>
      enqueueWrite((signer, network) => updateOrder(signer, network, id, patch)),
    [enqueueWrite],
  );

  useEffect(() => {
    if (!walletAddress) {
      // Keep the last wallet's orders on screen (read-only) after a disconnect
      // so a pending order doesn't look like it vanished. They only execute
      // while the wallet is connected.
      try {
        const last = localStorage.getItem(LAST_WALLET_KEY);
        if (last && ordersRef.current.length === 0) setOrders(loadStored(last));
      } catch {}
      return;
    }
    try {
      localStorage.setItem(LAST_WALLET_KEY, walletAddress);
    } catch {}

    if (!DB_ENABLED) {
      setOrders(loadStored(walletAddress));
      return;
    }

    const table = getTable(isDevnet);

    supabase!
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
          setOrders((data as OrderRow[]).map(rowToOrder));
        } else {
          setOrders(loadStored(walletAddress));
        }
      });
  }, [walletAddress, isDevnet]); // eslint-disable-line react-hooks/exhaustive-deps

  const persist = useCallback((updater: OrdersUpdater | LimitOrder[]) => {
    setOrders((prev) =>
      typeof updater === "function" ? updater(prev) : updater,
    );
  }, []);

  // Sync to localStorage whenever orders change (pure alternative to side
  // effects inside the setOrders updater, which can fire twice in Strict Mode)
  useEffect(() => {
    if (!addrRef.current) return;
    storeOrders(addrRef.current, orders);
  }, [orders]); // eslint-disable-line react-hooks/exhaustive-deps

  const addOrder = useCallback(
    (
      params: Omit<
        LimitOrder,
        | "id"
        | "walletAddress"
        | "network"
        | "status"
        | "createdAt"
        | "executedAt"
        | "signature"
        | "explorerUrl"
        | "error"
      >,
    ): string | null => {
      if (!addrRef.current) return null;
      const order: LimitOrder = {
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
      syncInsert(order);
      void requestPushPermission();
      notify.info({
        title: "Limit Order Placed",
        description: `${params.inputToken.symbol} → ${params.outputToken.symbol} at $${params.targetPrice}`,
      });
      return order.id;
    },
    [persist, syncInsert],
  );

  const cancelOrder = useCallback(
    (id: string) => {
      if (!addrRef.current) {
        notify.warning({
          title: "Wallet disconnected",
          description: "Connect your wallet to cancel an order.",
        });
        return;
      }
      persist((prev) =>
        prev.map((o) =>
          o.id === id && o.status === "pending"
            ? { ...o, status: "cancelled" as const }
            : o,
        ),
      );
      syncUpdate(id, { status: "cancelled" });
    },
    [persist, syncUpdate],
  );

  const editOrder = useCallback(
    async (
      id: string,
      { targetPrice, inputAmount }: { targetPrice: string; inputAmount: string },
    ): Promise<{ ok: boolean; error?: string }> => {
      if (!addrRef.current) {
        return { ok: false, error: "Connect your wallet to edit orders." };
      }
      const editable = () => {
        const o = ordersRef.current.find((x) => x.id === id);
        return o?.status === "pending" && !executingSet.current.has(id) ? o : null;
      };
      const order = editable();
      if (!order) return { ok: false, error: "This order can no longer be edited." };

      const target = Number(targetPrice);
      const amount = Number(inputAmount);
      if (!(Number.isFinite(target) && target > 0)) {
        return { ok: false, error: "Enter a valid target price." };
      }
      if (!(Number.isFinite(amount) && amount > 0)) {
        return { ok: false, error: "Enter a valid amount." };
      }

      let price: number | null = null;
      try {
        price = await fetchTokenPriceUsd(order.inputToken.mint);
      } catch {}
      if (price == null) {
        return { ok: false, error: "Could not fetch the current price. Try again." };
      }
      // Same rule as the order form: target at or above the price waits for a rise.
      const direction: "above" | "below" = target >= price ? "above" : "below";

      // The price fetch is async, so make sure nothing started executing meanwhile.
      if (!editable()) return { ok: false, error: "This order can no longer be edited." };

      const synced = await enqueueWrite((signer, network) =>
        editOrderRemote(signer, network, id, {
          target_price: target,
          input_amount: String(inputAmount),
          direction,
        }),
      );
      if (!synced) return { ok: false, error: "Could not save the change. Try again." };

      persist((prev) =>
        prev.map((o) =>
          o.id === id && o.status === "pending"
            ? { ...o, targetPrice: target, inputAmount: String(inputAmount), direction }
            : o,
        ),
      );
      notify.info({
        title: "Limit Order Updated",
        description: `${order.inputToken.symbol} → ${order.outputToken.symbol} at $${target}`,
      });
      return { ok: true };
    },
    [persist, enqueueWrite],
  );

  useEffect(() => {
    if (!connected || !walletAddress) return;

    async function tick() {
      const pending = ordersRef.current.filter((o) => o.status === "pending");
      if (!pending.length) return;

      const mints = [...new Set(pending.map((o) => o.inputToken.mint))];
      let priceData: Record<string, { usdPrice?: number }>;
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
        void showSystemNotification({
          title: "Limit Order Triggered",
          body: `${order.inputToken.symbol} hit $${order.targetPrice}. Executing ${order.inputToken.symbol} → ${order.outputToken.symbol}. Approve in your wallet if prompted.`,
          tag: `limit-${order.id}`,
        });
        persist((prev) =>
          prev.map((o) =>
            o.id === order.id ? { ...o, status: "executing" as const } : o,
          ),
        );
        syncUpdate(order.id, {
          status: "executing",
        });

        (async () => {
          try {
            const addr = addrRef.current;
            const wlt = walletRef.current;
            const devnet = isDevnetRef.current;
            let sig: string, explorerUrl: string;

            if (devnet) {
              const jupiterQuote = await fetchJupiterQuoteForOrder({
                inputMint: order.inputToken.mint,
                outputMint: order.outputToken.mint,
                amount: order.inputAmount,
                decimals: order.inputToken.decimals,
              });
              const swapData = await fetchJupiterSwapTxForOrder(
                jupiterQuote,
                addr!,
              );
              const conn = new Connection(SOLANA_DEVNET_RPC, {
                commitment: "confirmed",
                wsEndpoint: "",
              });
              const txBytes = base64ToUint8Array(swapData.swapTransaction);
              const tx = VersionedTransaction.deserialize(txBytes);
              const signed = await wlt.signTransaction!(tx);
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
              const txBytes = base64ToUint8Array(quote.transaction);
              const tx = VersionedTransaction.deserialize(txBytes);
              const signed = await wlt.signTransaction!(tx);
              sig = await conn.sendRawTransaction(signed.serialize(), {
                skipPreflight: true,
              });
              await confirmTx(conn, sig);
              explorerUrl = `https://solscan.io/tx/${sig}`;
            }

            const executedAt = new Date().toISOString();
            persist((prev) =>
              prev.map((o) =>
                o.id === order.id
                  ? {
                      ...o,
                      status: "executed" as const,
                      executedAt,
                      signature: sig,
                      explorerUrl,
                    }
                  : o,
              ),
            );
            syncUpdate(order.id, {
              status: "executed",
              executed_at: executedAt,
              signature: sig,
              explorer_url: explorerUrl,
            });
            void showSystemNotification({
              title: "Limit Order Executed",
              body: `${order.inputToken.symbol} → ${order.outputToken.symbol}`,
              tag: `limit-${order.id}`,
              url: explorerUrl,
            });
            notify.success({
              title: "Limit Order Executed",
              description: `${order.inputToken.symbol} → ${order.outputToken.symbol}`,
              ...(explorerUrl && {
                link: { href: explorerUrl, label: "View on Solscan" },
              }),
            });
          } catch (err) {
            const errorMsg = humanizeError(err);
            persist((prev) =>
              prev.map((o) =>
                o.id === order.id
                  ? { ...o, status: "failed" as const, error: errorMsg }
                  : o,
              ),
            );
            syncUpdate(order.id, {
              status: "failed",
              error: errorMsg,
            });
            void showSystemNotification({
              title: "Limit Order Failed",
              body: `${order.inputToken.symbol} → ${order.outputToken.symbol}: ${errorMsg}`,
              tag: `limit-${order.id}`,
            });
            notify.error({
              title: "Limit Order Failed",
              description: `${order.inputToken.symbol} → ${order.outputToken.symbol}: ${errorMsg}`,
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
  }, [connected, walletAddress, persist, syncUpdate]);

  const currentNetwork = isDevnet ? "devnet" : "mainnet";
  const filteredOrders = orders.filter(
    (o) => !o.network || o.network === currentNetwork,
  );

  return {
    walletConnected: connected,
    orders: filteredOrders,
    currentPrices,
    addOrder,
    cancelOrder,
    editOrder,
    pendingCount: filteredOrders.filter((o) => o.status === "pending").length,
  };
}
