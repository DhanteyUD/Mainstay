import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { BellRing, Loader2, Plus, X } from "lucide-react";
import TokenSelector from "./TokenSelector";
import { TOKENS } from "../config";
import { fetchTokenPriceUsd } from "../hooks/useLimitOrders";
import { hasValidSession } from "../lib/walletAuth";
import type { MessageSigner } from "../lib/walletAuth";
import {
  createPriceAlert,
  deletePriceAlert,
  listPriceAlerts,
} from "../lib/priceAlertsApi";
import type { PriceAlert } from "../lib/priceAlertsApi";
import { notify } from "../lib/toast";
import type { Token } from "../types";

// Two decimals from $1 up (matches the chart header); more precision for small prices.
const fmtUsd = (n: number) =>
  "$" +
  Number(n).toLocaleString("en-US", {
    minimumFractionDigits: n >= 1 ? 2 : 0,
    maximumFractionDigits: n >= 1 ? 2 : 6,
  });

const MAX_ACTIVE_ALERTS = 5;
const PRICE_REFRESH_MS = 10_000;

/** Telegram price alerts for any token. Rendered only once Telegram is linked. */
export default function PriceAlerts() {
  const { publicKey, signMessage } = useWallet();
  const address = publicKey?.toBase58() ?? null;

  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [token, setToken] = useState<Token>(TOKENS.SOL);
  const [price, setPrice] = useState<number | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);

  const signer = useCallback((): MessageSigner | null => {
    return address ? { address, signMessage } : null;
  }, [address, signMessage]);

  // Silent load: the session already exists because Telegram is linked.
  useEffect(() => {
    const s = signer();
    if (!s || !hasValidSession(s.address)) return;
    listPriceAlerts(s).then((a) => a && setAlerts(a));
  }, [signer]);

  // Poll every 10s, and refetch right away when the tab becomes visible again.
  useEffect(() => {
    let cancelled = false;
    setPrice(null);
    const load = () =>
      fetchTokenPriceUsd(token.mint)
        .then((p) => {
          if (!cancelled && p != null) {
            setPrice(p);
            setUpdatedAt(Date.now());
          }
        })
        .catch(() => {});
    load();
    const timer = setInterval(load, PRICE_REFRESH_MS);
    const onVisible = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [token]);

  const targetNum = Number(target);
  const active = alerts.filter((a) => !a.triggered_at);
  const atLimit = active.length >= MAX_ACTIVE_ALERTS;
  const valid =
    Number.isFinite(targetNum) && targetNum > 0 && price != null && !atLimit;
  const direction = price != null && targetNum >= price ? "above" : "below";

  const add = async () => {
    const s = signer();
    if (!s || !valid) return;
    setBusy(true);
    try {
      const res = await createPriceAlert(s, {
        token_mint: token.mint,
        token_symbol: token.symbol,
        direction,
        target_price: targetNum,
      });
      if (!res.ok) return notify.error(res.error);
      setTarget("");
      const fresh = await listPriceAlerts(s);
      if (fresh) setAlerts(fresh);
      notify.success(
        `Alert set: ${token.symbol} ${direction === "above" ? "≥" : "≤"} ${fmtUsd(targetNum)}`,
      );
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    const s = signer();
    if (!s) return;
    const res = await deletePriceAlert(s, id);
    if (res.ok) setAlerts((prev) => prev.filter((a) => a.id !== id));
    else notify.error(res.error);
  };

  const done = alerts.filter((a) => a.triggered_at).slice(0, 3);

  return (
    <div className="mb-4 rounded-xl border border-terminal-border bg-terminal-surface px-3 py-2.5 font-mono text-xs">
      <div className="mb-3 flex items-center gap-2">
        <BellRing size={14} className="shrink-0 text-terminal-accent" />
        <div className="font-bold text-terminal-text">Price alerts</div>
        <div className="ml-auto text-terminal-dim">
          {active.length}/{MAX_ACTIVE_ALERTS}
        </div>
      </div>

      <div className="rounded-xl border border-terminal-border bg-terminal-bg/40">
        <div className="flex items-center justify-between px-3 pt-2.5 pb-1 text-[11px] text-terminal-dim">
          <span>Alert me when price hits</span>
          <span
            title={
              updatedAt
                ? `Updated ${new Date(updatedAt).toLocaleTimeString()}`
                : undefined
            }
            className="inline-flex items-center gap-1.5"
          >
            {price != null && (
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-terminal-green" />
            )}
            {price != null ? `Now ${fmtUsd(price)}` : "Fetching price…"}
          </span>
        </div>
        <div className="flex items-center gap-3 px-3 pb-3">
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <span className="text-lg font-bold text-terminal-dim">$</span>
            <input
              inputMode="decimal"
              value={target}
              onChange={(e) =>
                setTarget(e.target.value.replace(/[^0-9.]/g, ""))
              }
              placeholder="0.00"
              className="min-w-0 flex-1 bg-transparent text-xl font-bold text-terminal-text outline-none placeholder:text-terminal-muted/40 sm:text-2xl"
            />
          </div>
          <TokenSelector selected={token} onChange={setToken} />
        </div>
      </div>

      <button
        disabled={busy || !valid}
        onClick={add}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-terminal-accent/40 bg-terminal-accent/10 py-2.5 font-bold text-terminal-accent hover:bg-terminal-accent/20 disabled:opacity-50"
      >
        {busy ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Plus size={12} />
        )}
        {atLimit
          ? `Limit reached (${MAX_ACTIVE_ALERTS} active alerts)`
          : valid
            ? `Alert me when ${token.symbol} ${direction === "above" ? "rises to" : "drops to"} ${fmtUsd(targetNum)}`
            : "Add price alert"}
      </button>

      {active.length > 0 && (
        <ul className="mt-2 space-y-1">
          {active.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between rounded-lg bg-terminal-bg/40 px-2 py-1"
            >
              <span className="text-terminal-text">
                {a.token_symbol} {a.direction === "above" ? "≥" : "≤"}{" "}
                {fmtUsd(a.target_price)}
              </span>
              <button
                onClick={() => remove(a.id)}
                aria-label="Remove alert"
                className="text-terminal-dim hover:text-terminal-red"
              >
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {done.length > 0 && (
        <ul className="mt-2 space-y-1 text-terminal-dim">
          {done.map((a) => (
            <li key={a.id} className="flex items-center justify-between px-2">
              <span>
                ✓ {a.token_symbol} {a.direction === "above" ? "≥" : "≤"}{" "}
                {fmtUsd(a.target_price)} triggered
              </span>
              <button
                onClick={() => remove(a.id)}
                aria-label="Dismiss"
                className="hover:text-terminal-red"
              >
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
