import { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { motion } from "framer-motion";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import type { Connection } from "@solana/web3.js";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ExternalLink,
  Loader2,
  ShieldCheck,
  X,
} from "lucide-react";
import { useSwap } from "../../hooks/useSwap";
import { useProofStatus } from "../../hooks/useProofStatus";
import { TOKENS } from "../../config";
import type { PredictionMarket } from "../../config";
import { notify } from "../../lib/toast";
import { cents, sidePrice, usd } from "./format";
import type { Side } from "./format";

const CHIPS = [5, 10, 25, 50];
const USDC = TOKENS.USDC;

interface Props {
  market: PredictionMarket;
  side: Side;
  onSideChange: (side: Side) => void;
  onClose: () => void;
  onDone: () => void;
  onViewBets: () => void;
}

export default function TradeSheet({
  market,
  side,
  onSideChange,
  onClose,
  onDone,
  onViewBets,
}: Props) {
  const wallet = useWallet();
  const { connection } = useConnection();
  const { setVisible: openWalletModal } = useWalletModal();
  const proof = useProofStatus();
  const swap = useSwap();
  const [amount, setAmount] = useState("10");
  const [received, setReceived] = useState<number | null>(null);
  const balanceBefore = useRef(0);
  const lastSig = useRef<string | null>(null);

  const isYes = side === "YES";
  const token = isYes ? market.yesToken : market.noToken;
  const tradable = market.live?.tradable !== false;
  const amountNum = Number(amount);
  const valid = Number.isFinite(amountNum) && amountNum > 0;

  const { fetchQuote, clearQuote } = swap;
  useEffect(() => {
    if (!valid || !tradable) return clearQuote();
    fetchQuote({
      inputMint: USDC.mint,
      outputMint: token.mint,
      amount,
      decimals: USDC.decimals,
      walletPublicKey: wallet.publicKey?.toBase58(),
      feeBps: 8,
      prioritizationFeeLamports: "auto",
    });
  }, [amount, token.mint, wallet.publicKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const q = swap.quote as Record<string, unknown> | null;
  const minRaw = q
    ? (q.minOutAmount ?? q.otherAmountThreshold ?? q.outAmount)
    : null;
  const minTokens =
    minRaw != null ? Number(minRaw) / 10 ** token.decimals : null;
  const hasQuote =
    valid && tradable && minTokens != null && Number.isFinite(minTokens);
  const winBack = hasQuote ? minTokens : null;
  const winProfit = hasQuote ? minTokens - amountNum : null;

  const status = swap.swapStatus;
  const busy = status === "signing" || status === "confirming";
  const done = status === "success" && swap.swapResult;

  useEffect(() => {
    if (!done || !wallet.publicKey) return;
    let cancelled = false;
    (async () => {
      for (let i = 0; i < 8 && !cancelled; i++) {
        const now = await readBalance(
          connection,
          wallet.publicKey!,
          token.mint,
        );
        if (now > balanceBefore.current) {
          if (!cancelled) setReceived(now - balanceBefore.current);
          return;
        }
        await new Promise((r) => setTimeout(r, 1500));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (
      done &&
      swap.swapResult &&
      lastSig.current !== swap.swapResult.signature
    ) {
      lastSig.current = swap.swapResult.signature;
      onDone();
    }
  }, [done, swap.swapResult, onDone]);

  const buttonState = useMemo(() => {
    if (!wallet.connected)
      return { text: "Connect wallet", action: "connect" as const };
    if (proof.state === "checking")
      return {
        text: "Checking verification…",
        action: "none" as const,
        loading: true,
      };
    if (proof.state === "unverified")
      return { text: "Verify identity (one time)", action: "verify" as const };
    if (proof.state === "error")
      return { text: "Retry verification check", action: "recheck" as const };
    if (!tradable)
      return { text: "Betting opens soon", action: "none" as const };
    if (!valid) return { text: "Enter an amount", action: "none" as const };
    if (swap.quoteLoading)
      return {
        text: "Getting best price…",
        action: "none" as const,
        loading: true,
      };
    if (swap.quoteError)
      return { text: "No price available", action: "none" as const };
    if (!swap.quote)
      return { text: "Enter an amount", action: "none" as const };
    return { text: `Bet ${usd(amountNum)} on ${side}`, action: "buy" as const };
  }, [
    wallet.connected,
    proof.state,
    valid,
    tradable,
    swap.quoteLoading,
    swap.quoteError,
    swap.quote,
    amountNum,
    side,
  ]);

  const onConfirm = async () => {
    if (buttonState.action === "connect") return openWalletModal(true);
    if (buttonState.action === "recheck") return proof.check();
    if (buttonState.action === "verify") {
      const err = await proof.startVerification();
      if (err) notify.error(err);
      else
        notify.info("Finish verification in the new tab, then come back here.");
      return;
    }
    if (buttonState.action === "buy" && swap.quote) {
      balanceBefore.current = wallet.publicKey
        ? await readBalance(connection, wallet.publicKey, token.mint)
        : 0;
      setReceived(null);
      await swap.executeSwap({
        quote: swap.quote,
        wallet,
        inputToken: USDC,
        outputToken: token,
      });
    }
  };

  const accent = isYes ? "terminal-green" : "terminal-red";

  const sheet = (
    <motion.div
      className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <motion.div
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-terminal-border bg-terminal-card font-mono sm:rounded-3xl"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
      >
        <div className={`h-1 bg-${accent}`} />
        <div className="p-5">
          <div className="mb-4 flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1 text-[10px] uppercase tracking-widest text-terminal-dim">
                Your bet
              </div>
              <h3 className="text-sm font-bold leading-snug text-terminal-text">
                {market.question}
              </h3>
            </div>
            <button
              onClick={onClose}
              disabled={busy}
              aria-label="Close"
              className="text-terminal-dim hover:text-terminal-text disabled:opacity-40"
            >
              <X size={16} />
            </button>
          </div>

          {done && swap.swapResult ? (
            <div className="py-4 text-center">
              <CheckCircle2
                size={44}
                className="mx-auto mb-3 text-terminal-green"
              />
              <div className="text-lg font-black text-terminal-text">
                Bet placed
              </div>
              <p className="mt-2 text-xs leading-relaxed text-terminal-dim">
                {received != null ? (
                  <>
                    You received{" "}
                    <b className={`text-${accent}`}>
                      {received.toLocaleString("en-US", {
                        maximumFractionDigits: 6,
                      })}{" "}
                      {side}
                    </b>{" "}
                    tokens. If the answer is {side}, they pay{" "}
                    <b className="text-terminal-text">{usd(received)}</b>.
                  </>
                ) : (
                  <>
                    Your {side} tokens are arriving. The exact amount will show
                    under My bets in a moment.
                  </>
                )}
              </p>
              <a
                href={swap.swapResult.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-[11px] text-terminal-accent hover:underline"
              >
                View transaction <ExternalLink size={10} />
              </a>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  onClick={onClose}
                  className="rounded-xl border border-terminal-border py-3 text-xs font-bold text-terminal-dim hover:text-terminal-text"
                >
                  Keep browsing
                </button>
                <button
                  onClick={onViewBets}
                  className="rounded-xl border border-terminal-accent/50 bg-terminal-accent/10 py-3 text-xs font-bold text-terminal-accent hover:bg-terminal-accent/20"
                >
                  See my bets
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4 grid grid-cols-2 gap-2">
                {(["YES", "NO"] as Side[]).map((s) => (
                  <button
                    key={s}
                    disabled={busy}
                    onClick={() => onSideChange(s)}
                    className={`rounded-xl border py-2.5 text-xs font-black tracking-wider transition-colors ${
                      s === side
                        ? s === "YES"
                          ? "border-terminal-green/60 bg-terminal-green/15 text-terminal-green"
                          : "border-terminal-red/60 bg-terminal-red/15 text-terminal-red"
                        : "border-terminal-border text-terminal-dim hover:text-terminal-text"
                    }`}
                  >
                    {s} · {cents(sidePrice(market, s))}
                  </button>
                ))}
              </div>

              <label className="mb-1 block text-[10px] uppercase tracking-widest text-terminal-dim">
                How much do you want to bet?
              </label>
              <div
                data-tour="bet-amount"
                className="flex items-center gap-2 rounded-xl border border-terminal-border bg-terminal-surface px-4 py-3 focus-within:border-terminal-accent"
              >
                <span className="text-2xl font-black text-terminal-dim">$</span>
                <input
                  inputMode="decimal"
                  value={amount}
                  disabled={busy}
                  onChange={(e) =>
                    setAmount(e.target.value.replace(/[^0-9.]/g, ""))
                  }
                  className="min-w-0 flex-1 bg-transparent text-3xl font-black text-terminal-text outline-none"
                />
                <span className="text-xs text-terminal-dim">USDC</span>
              </div>
              <div className="mt-2 flex gap-2">
                {CHIPS.map((c) => (
                  <button
                    key={c}
                    disabled={busy}
                    onClick={() => setAmount(String(c))}
                    className={`flex-1 rounded-lg border py-1.5 text-xs ${
                      Number(amount) === c
                        ? "border-terminal-accent/50 bg-terminal-accent/10 text-terminal-accent"
                        : "border-terminal-border text-terminal-dim hover:text-terminal-text"
                    }`}
                  >
                    ${c}
                  </button>
                ))}
              </div>

              <div
                data-tour="bet-outcomes"
                className="mt-4 grid grid-cols-2 gap-2"
              >
                <div className="rounded-xl border border-terminal-green/30 bg-terminal-green/5 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-terminal-dim">
                    If it's {side}
                  </div>
                  <div className="mt-1 text-lg font-black text-terminal-green">
                    {winProfit != null ? `+${usd(winProfit)}` : "—"}
                  </div>
                  <div className="text-[10px] text-terminal-dim">
                    you get at least {winBack != null ? usd(winBack) : "—"} back
                  </div>
                </div>
                <div className="rounded-xl border border-terminal-red/30 bg-terminal-red/5 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-terminal-dim">
                    If it's not
                  </div>
                  <div className="mt-1 text-lg font-black text-terminal-red">
                    {valid && tradable ? `−${usd(amountNum)}` : "—"}
                  </div>
                  <div className="text-[10px] text-terminal-dim">
                    tokens expire worthless
                  </div>
                </div>
              </div>

              <div
                data-tour="bet-protection"
                className="mt-3 flex items-start gap-2 rounded-lg bg-terminal-surface/60 px-3 py-2 text-[10px] leading-relaxed text-terminal-dim"
              >
                <ShieldCheck
                  size={12}
                  className="mt-0.5 shrink-0 text-terminal-green"
                />
                Filled through DFlow's auction, hidden from the public mempool,
                so it can't be sandwiched or front-run.
              </div>

              {proof.state === "unverified" && wallet.connected && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-terminal-accent/30 bg-terminal-accent/5 px-3 py-2 text-[11px] leading-relaxed text-terminal-dim">
                  <BadgeCheck
                    size={13}
                    className="mt-0.5 shrink-0 text-terminal-accent"
                  />
                  <span>
                    Prediction markets need a quick one-time identity check
                    (Proof by DFlow). Verify, come back, and your bet button
                    unlocks.
                  </span>
                </div>
              )}

              {swap.quoteError && valid && (
                <div className="mt-3 text-[11px] text-terminal-red">
                  {swap.quoteError}
                </div>
              )}
              {swap.swapError && (
                <div className="mt-3 text-[11px] text-terminal-red">
                  {swap.swapError}
                </div>
              )}

              <button
                data-tour="bet-confirm"
                disabled={buttonState.action === "none" || busy}
                onClick={onConfirm}
                className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl border py-4 text-sm font-black tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  buttonState.action === "buy"
                    ? isYes
                      ? "border-terminal-green/60 bg-terminal-green/20 text-terminal-green hover:bg-terminal-green/30"
                      : "border-terminal-red/50 bg-terminal-red/15 text-terminal-red hover:bg-terminal-red/25"
                    : buttonState.action === "none"
                      ? "border-terminal-border bg-terminal-surface text-terminal-dim"
                      : "border-terminal-accent/50 bg-terminal-accent/15 text-terminal-accent hover:bg-terminal-accent/25"
                }`}
              >
                {(busy ||
                  ("loading" in buttonState && buttonState.loading)) && (
                  <Loader2 size={15} className="animate-spin" />
                )}
                {status === "signing"
                  ? "Approve in your wallet…"
                  : status === "confirming"
                    ? "Placing your bet…"
                    : buttonState.text}
                {buttonState.action === "buy" && !busy && (
                  <ArrowRight size={15} />
                )}
              </button>

              {busy && (
                <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-terminal-dim">
                  {["Approve", "Confirm", "Filled"].map((label, i) => {
                    const at = status === "signing" ? 0 : 1;
                    return (
                      <span key={label} className="flex items-center gap-1.5">
                        <span className={i <= at ? "text-terminal-accent" : ""}>
                          {label}
                        </span>
                        {i < 2 && <span>→</span>}
                      </span>
                    );
                  })}
                </div>
              )}
              <p className="mt-3 text-center text-[10px] leading-relaxed text-terminal-dim/60">
                Real USDC. Fees are already included in the numbers above.
              </p>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );

  return ReactDOM.createPortal(sheet, document.body);
}

async function readBalance(
  connection: Connection,
  owner: PublicKey,
  mint: string,
): Promise<number> {
  const res = await connection.getParsedTokenAccountsByOwner(owner, {
    mint: new PublicKey(mint),
  });
  return res.value.reduce(
    (sum, a) =>
      sum + Number(a.account.data.parsed.info.tokenAmount.uiAmountString ?? 0),
    0,
  );
}
