import { useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Loader2 } from "lucide-react";
import { usePredictionPositions } from "../../hooks/usePredictionPositions";
import type { PredictionPosition } from "../../hooks/usePredictionPositions";
import { useSwap } from "../../hooks/useSwap";
import { DFLOW_QUOTE_API, TOKENS } from "../../config";
import { notify } from "../../lib/toast";
import { usd } from "./format";

export default function MyBets({ refreshKey }: { refreshKey: number }) {
  const wallet = useWallet();
  const { positions, loading, refresh } = usePredictionPositions(
    wallet.connected,
  );
  const { executeSwap } = useSwap();
  const [redeeming, setRedeeming] = useState<string | null>(null);

  useRefreshOn(refreshKey, refresh);

  if (!wallet.connected) {
    return <Empty text="Connect your wallet to see your bets." />;
  }

  const redeem = async (p: PredictionPosition) => {
    if (!wallet.publicKey) return;
    setRedeeming(p.mint);
    try {
      const qs = new URLSearchParams({
        inputMint: p.mint,
        outputMint: p.market.live!.settlementMint,
        amount: p.rawAmount,
        userPublicKey: wallet.publicKey.toBase58(),
        slippageBps: "50",
      });
      const res = await fetch(`${DFLOW_QUOTE_API}/order?${qs}`, {
        signal: AbortSignal.timeout(14_000),
      });
      if (!res.ok) throw new Error("Could not prepare your payout");
      const quote = await res.json();
      const result = await executeSwap({
        quote,
        wallet,
        inputToken: p.side === "YES" ? p.market.yesToken : p.market.noToken,
        outputToken: TOKENS.USDC,
      });
      if (result) {
        notify.success(`Collected ${usd(p.amount)} USDC`);
        refresh();
      } else notify.error("Payout did not complete");
    } catch (e) {
      notify.error((e as Error).message || "Payout failed");
    } finally {
      setRedeeming(null);
    }
  };

  if (loading && positions.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 font-mono text-xs text-terminal-dim">
        <Loader2 size={14} className="animate-spin" /> Finding your bets…
      </div>
    );
  }
  if (positions.length === 0) {
    return <Empty text="No bets yet. Pick a question and tap Yes or No." />;
  }

  return (
    <ul className="space-y-2.5">
      {positions.map((p) => {
        const won = p.redeemable;
        return (
          <li
            key={p.mint}
            className="rounded-2xl border border-terminal-border bg-terminal-card p-4 font-mono"
          >
            <div className="mb-2 flex items-center gap-2">
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-black ${
                  p.side === "YES"
                    ? "bg-terminal-green/15 text-terminal-green"
                    : "bg-terminal-red/15 text-terminal-red"
                }`}
              >
                {p.side}
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  won
                    ? "text-terminal-green"
                    : p.lost
                      ? "text-terminal-red"
                      : "text-terminal-dim"
                }`}
              >
                {won ? "You won" : p.lost ? "Lost" : "Open"}
              </span>
            </div>
            <div className="text-xs font-bold leading-snug text-terminal-text">
              {p.market.question}
            </div>
            <div className="mt-2 flex items-end justify-between gap-3">
              <div className="text-[11px] text-terminal-dim">
                {p.amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}{" "}
                tokens
                <br />
                {won
                  ? `Pays ${usd(p.amount)}`
                  : p.lost
                    ? "Expired worthless"
                    : `Pays ${usd(p.amount)} if ${p.side}${p.valueUsd != null ? ` · worth ${usd(p.valueUsd)} now` : ""}`}
              </div>
              {won && (
                <button
                  disabled={redeeming === p.mint}
                  onClick={() => redeem(p)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-terminal-green/60 bg-terminal-green/15 px-3 py-2 text-xs font-black text-terminal-green hover:bg-terminal-green/25 disabled:opacity-60"
                >
                  {redeeming === p.mint && (
                    <Loader2 size={12} className="animate-spin" />
                  )}
                  Collect {usd(p.amount)}
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-terminal-border py-10 text-center font-mono text-xs text-terminal-dim">
      {text}
    </div>
  );
}

function useRefreshOn(key: number, fn: () => void) {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(fn, 2500);
    return () => clearTimeout(t);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
}
