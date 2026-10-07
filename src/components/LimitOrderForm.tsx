import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  WalletMultiButton,
  useWalletModal,
} from "@solana/wallet-adapter-react-ui";
import {
  Target,
  ArrowDown,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Info,
  RefreshCw,
} from "lucide-react";
import TokenSelector from "./TokenSelector";
import { motion, AnimatePresence } from "framer-motion";
import { fetchTokenPriceUsd } from "../hooks/useLimitOrders";
import { TOKENS } from "../config";
import { useNetwork } from "../contexts/NetworkContext";
import type { Token, LimitOrder } from "../types";

const fadeSlide = {
  initial: { opacity: 0, y: -6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.15 } },
};

type NewOrderPayload = {
  inputToken: Token;
  outputToken: Token;
  inputAmount: string;
  targetPrice: number;
  direction: "above" | "below";
};

interface LimitOrderFormProps {
  onAddOrder: (payload: NewOrderPayload) => void;
}

export default function LimitOrderForm({ onAddOrder }: LimitOrderFormProps) {
  const { connected } = useWallet();
  const { setVisible: openWalletModal } = useWalletModal();
  const { isDevnet, networkLabel } = useNetwork();

  const [inputToken, setInputToken] = useState<Token>(TOKENS.SOL);
  const [outputToken, setOutputToken] = useState<Token>(TOKENS.USDC);
  const [inputAmount, setInputAmount] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [outputPrice, setOutputPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!inputToken) return;
    let cancelled = false;
    setPriceLoading(true);
    setPriceError(false);
    fetchTokenPriceUsd(inputToken.mint)
      .then((p) => {
        if (!cancelled) {
          setCurrentPrice(p);
          setPriceLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCurrentPrice(null);
          setPriceLoading(false);
          setPriceError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [inputToken]);

  useEffect(() => {
    if (!outputToken) return;
    let cancelled = false;
    fetchTokenPriceUsd(outputToken.mint)
      .then((p) => {
        if (!cancelled) setOutputPrice(p);
      })
      .catch(() => {
        if (!cancelled) setOutputPrice(null);
      });
    return () => {
      cancelled = true;
    };
  }, [outputToken]);

  const target = parseFloat(targetPrice);
  const direction: "above" | "below" | null =
    !isNaN(target) && target > 0 && currentPrice != null
      ? target >= currentPrice
        ? "above"
        : "below"
      : null;

  const estimatedReceive =
    parseFloat(inputAmount) > 0 &&
    target > 0 &&
    outputPrice != null &&
    outputPrice > 0
      ? (parseFloat(inputAmount) * target) / outputPrice
      : null;

  const canSubmit =
    connected &&
    parseFloat(inputAmount) > 0 &&
    !isNaN(parseFloat(inputAmount)) &&
    target > 0 &&
    !isNaN(target) &&
    direction !== null;

  const handleInputTokenChange = (t: Token) => {
    if (t.mint === outputToken?.mint) setOutputToken(inputToken);
    setInputToken(t);
    setTargetPrice("");
    setCurrentPrice(null);
  };

  const handleOutputTokenChange = (t: Token) => {
    if (t.mint === inputToken?.mint) setInputToken(outputToken);
    setOutputToken(t);
  };

  const handleSubmit = () => {
    if (!connected) {
      openWalletModal(true);
      return;
    }
    if (!canSubmit) return;
    onAddOrder({
      inputToken,
      outputToken,
      inputAmount,
      targetPrice: target,
      direction: direction ?? "above",
    });
    setInputAmount("");
    setTargetPrice("");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2500);
  };

  const fmtPrice = (p: number | null): string =>
    p?.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }) ?? "—";

  const btnLabel = !connected
    ? "Connect Wallet"
    : !inputAmount
      ? "Enter Amount"
      : !targetPrice
        ? "Set Target Price"
        : direction === null
          ? "Fetching Price…"
          : "Place Limit Order";

  return (
    <motion.div
      className="w-full mx-auto"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <div className="bg-terminal-card border border-terminal-border rounded-2xl shadow-2xl">
        <div className="px-4 py-3 border-b border-terminal-border">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-2 h-2 rounded-full bg-terminal-yellow animate-pulse" />
              <span className="font-mono font-bold text-terminal-text text-sm tracking-wider">
                LIMIT ORDER
              </span>
              <span
                className={`font-mono text-xs tracking-widest hidden sm:inline ${isDevnet ? "text-terminal-yellow" : "text-terminal-dim"}`}
              >
                / {networkLabel}
              </span>
            </div>
            <div className="shrink-0 max-w-[180px] sm:max-w-none">
              <WalletMultiButton />
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-3">
          <div className="rounded-xl bg-terminal-surface border border-terminal-border focus-within:border-terminal-yellow/40 transition-colors">
            <div className="flex items-center justify-between px-4 pt-3 pb-1">
              <span className="text-terminal-dim text-xs font-mono">
                You pay
              </span>
            </div>
            <div className="flex items-center gap-3 px-4 pb-3">
              <input
                type="number"
                placeholder="0.00"
                value={inputAmount}
                onChange={(e) => setInputAmount(e.target.value)}
                className="flex-1 bg-transparent outline-none font-mono text-xl sm:text-2xl font-bold text-terminal-text placeholder-terminal-muted/40 min-w-0"
                min="0"
              />
              <TokenSelector
                selected={inputToken}
                onChange={handleInputTokenChange}
                exclude={outputToken}
              />
            </div>
          </div>

          <div className="flex justify-center -my-1">
            <div className="w-9 h-9 rounded-full bg-terminal-surface border border-terminal-border flex items-center justify-center text-terminal-dim">
              <ArrowDown size={14} />
            </div>
          </div>

          <div className="rounded-xl bg-terminal-surface border border-terminal-border">
            <div className="px-4 pt-3 pb-1">
              <span className="text-terminal-dim text-xs font-mono">
                You receive
              </span>
            </div>
            <div className="flex items-center gap-3 px-4 pb-3">
              {estimatedReceive != null ? (
                <span className="flex-1 font-mono text-xl sm:text-2xl font-bold text-terminal-text">
                  ≈{" "}
                  {estimatedReceive.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: estimatedReceive < 1 ? 6 : 2,
                  })}
                </span>
              ) : (
                <span className="flex-1 font-mono text-xs text-terminal-dim/50 italic">
                  estimated at execution time
                </span>
              )}
              <TokenSelector
                selected={outputToken}
                onChange={handleOutputTokenChange}
                exclude={inputToken}
              />
            </div>
          </div>

          <div className="rounded-xl bg-terminal-surface border border-terminal-border focus-within:border-terminal-yellow/40 transition-colors">
            <div className="flex items-center justify-between px-4 pt-3 pb-1">
              <span className="text-terminal-dim text-xs font-mono">
                Trigger price ({inputToken?.symbol} in USD)
              </span>
              <span className="text-terminal-dim text-xs font-mono">
                {priceLoading ? (
                  <span className="text-terminal-dim/40">loading…</span>
                ) : priceError ? (
                  <button
                    onClick={() => {
                      setPriceError(false);
                      setPriceLoading(true);
                      fetchTokenPriceUsd(inputToken.mint)
                        .then((p) => {
                          setCurrentPrice(p);
                          setPriceLoading(false);
                        })
                        .catch(() => {
                          setPriceLoading(false);
                          setPriceError(true);
                        });
                    }}
                    className="flex items-center gap-1 text-terminal-red/70 hover:text-terminal-red"
                  >
                    <RefreshCw size={9} />
                    <span>retry</span>
                  </button>
                ) : currentPrice != null ? (
                  <>
                    Now:{" "}
                    <span className="text-terminal-accent">
                      ${fmtPrice(currentPrice)}
                    </span>
                  </>
                ) : null}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-4 pb-3">
              <span className="font-mono text-xl font-bold text-terminal-dim">
                $
              </span>
              <input
                type="number"
                placeholder="0.00"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="flex-1 bg-transparent outline-none font-mono text-xl sm:text-2xl font-bold text-terminal-text placeholder-terminal-muted/40 min-w-0"
                min="0"
              />
            </div>
          </div>

          <AnimatePresence>
            {direction && (
              <motion.div
                className={`flex items-start gap-2.5 px-4 py-3 rounded-lg border ${
                  direction === "above"
                    ? "bg-terminal-green/10 border-terminal-green/30"
                    : "bg-terminal-yellow/10 border-terminal-yellow/30"
                }`}
                {...fadeSlide}
              >
                {direction === "above" ? (
                  <TrendingUp
                    size={14}
                    className="text-terminal-green shrink-0 mt-0.5"
                  />
                ) : (
                  <TrendingDown
                    size={14}
                    className="text-terminal-yellow shrink-0 mt-0.5"
                  />
                )}
                <p
                  className={`font-mono text-xs leading-relaxed ${direction === "above" ? "text-terminal-green" : "text-terminal-yellow"}`}
                >
                  Execute when <strong>{inputToken?.symbol}</strong> reaches{" "}
                  <strong>${fmtPrice(target)}</strong>
                  {currentPrice != null && (
                    <>
                      {" "}
                      —{" "}
                      {direction === "above"
                        ? `${((target / currentPrice - 1) * 100).toFixed(1)}% above current`
                        : `${((1 - target / currentPrice) * 100).toFixed(1)}% below current`}
                    </>
                  )}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {submitted && (
              <motion.div
                className="flex items-center gap-2 px-4 py-3 rounded-lg bg-terminal-green/10 border border-terminal-green/30"
                {...fadeSlide}
              >
                <CheckCircle2
                  size={14}
                  className="text-terminal-green shrink-0"
                />
                <p className="font-mono text-xs text-terminal-green">
                  Limit order placed — monitoring price every 30s.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            onClick={handleSubmit}
            disabled={connected && !canSubmit}
            className={`w-full py-4 rounded-xl font-mono font-bold text-sm tracking-wider transition-colors duration-200 flex items-center justify-center gap-2.5 relative overflow-hidden ${
              !connected
                ? "bg-terminal-accent/15 border border-terminal-accent/40 text-terminal-accent hover:bg-terminal-accent/25"
                : canSubmit
                  ? "bg-terminal-yellow text-black hover:bg-terminal-yellow/85"
                  : "bg-terminal-surface border border-terminal-border text-terminal-dim cursor-not-allowed"
            }`}
            whileHover={!connected || canSubmit ? { scale: 1.01 } : {}}
            whileTap={!connected || canSubmit ? { scale: 0.98 } : {}}
          >
            <Target size={15} className="shrink-0" />
            <span>{btnLabel}</span>
            {canSubmit && (
              <span className="absolute right-4 text-xs font-mono text-black/50 tracking-widest">
                DFLOW
              </span>
            )}
          </motion.button>

          {!isDevnet && (
            <div className="flex items-center gap-1.5 justify-center pt-1">
              <Info size={10} className="text-terminal-dim/60" />
              <span className="text-terminal-dim/60 text-xs font-mono">
                Order executes via DFlow when target price is hit
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          {
            label: "MEV Protection",
            value: isDevnet ? "Disabled" : "Active",
            color: isDevnet ? "text-terminal-dim" : "text-terminal-green",
          },
          { label: "Monitoring", value: "30s", color: "text-terminal-yellow" },
          {
            label: "Network",
            value: isDevnet ? "Devnet" : "Mainnet",
            color: isDevnet ? "text-terminal-yellow" : "text-terminal-bright",
          },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            className="bg-terminal-card border border-terminal-border rounded-xl p-3 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.07 }}
          >
            <div className={`font-mono text-xs font-semibold ${s.color}`}>
              {s.value}
            </div>
            <div className="font-mono text-xs text-terminal-dim/60 mt-0.5">
              {s.label}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
