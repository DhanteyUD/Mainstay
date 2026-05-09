import React, { useState, useEffect, useCallback, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  TrendingUp,
  TrendingDown,
  Shield,
  AlertCircle,
  Loader2,
  Clock,
  RefreshCw,
  X,
  ChevronDown,
  Target,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import QuoteDisplay from "./QuoteDisplay";
import PostTradeCard from "./PostTradeCard";
import MevRiskBadge from "./MevRiskBadge";
import cn from "../functions/cn";

import { useSwap } from "../hooks/useSwap";
import { useMevRisk } from "../hooks/useMevRisk";
import { useWalletBalance } from "../hooks/useWalletBalance";
import { TOKENS, PREDICTION_MARKETS } from "../config";
import { useNetwork } from "../contexts/NetworkContext";
import type { Token, MevRisk } from "../types";
import type { PredictionMarket } from "../config";

const fadeSlide = {
  initial: { opacity: 0, y: -6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.15 } },
};

const PAY_TOKENS: Token[] = [TOKENS.USDC, TOKENS.SOL, TOKENS.USDT];

type Side = "YES" | "NO";
type BuyVariant = "yes" | "no" | "secondary" | "loading" | "error";

interface ButtonContent {
  text: string;
  disabled: boolean;
  variant: BuyVariant;
}

interface BuyButtonProps {
  label: string;
  variant: BuyVariant;
  disabled: boolean;
  onClick: () => void;
  isLoading: boolean;
}

interface PredictStatsStripProps {
  market: PredictionMarket;
  side: Side;
  outputToken: Token;
  mevRisk: MevRisk | null;
}

type FetchQuoteParams = Parameters<ReturnType<typeof useSwap>["fetchQuote"]>[0];

function priorityFeeFromRisk(risk: MevRisk | null): string {
  if (!risk) return "auto";
  if (risk.level === "HIGH") return "200000";
  if (risk.level === "MEDIUM") return "50000";
  return "10000";
}

interface PredictionMarketsInterfaceProps {
  onSaveTrade?: React.ComponentProps<typeof PostTradeCard>["onSaveTrade"];
}

export default function PredictionMarketsInterface({
  onSaveTrade,
}: PredictionMarketsInterfaceProps) {
  const wallet = useWallet();
  const { publicKey, connected } = wallet;
  const { isDevnet } = useNetwork();

  const [selectedMarket, setSelectedMarket] = useState<PredictionMarket>(
    PREDICTION_MARKETS[0],
  );
  const [side, setSide] = useState<Side>("YES");
  const [payToken, setPayToken] = useState<Token>(TOKENS.USDC);
  const [inputAmount, setInputAmount] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [savedQuote, setSavedQuote] = useState<Record<string, unknown> | null>(
    null,
  );
  const [showMarketDropdown, setShowMarketDropdown] = useState(false);
  const [postSwapCooldown, setPostSwapCooldown] = useState(false);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFetchParamsRef = useRef<FetchQuoteParams | null>(null);
  const priorityFeeAppliedRef = useRef(false);

  const outputToken: Token =
    side === "YES" ? selectedMarket.yesToken : selectedMarket.noToken;

  const {
    quote,
    quoteLoading,
    quoteError,
    fetchQuote,
    clearQuote,
    executeSwap,
    swapStatus,
    swapResult,
    swapError,
    swapWarning,
    clearWarning,
    resetSwap,
  } = useSwap();

  const { refresh: refreshBalance } = useWalletBalance();

  const { risk: mevRisk, loading: mevRiskLoading } = useMevRisk({
    quote,
    inputToken: payToken,
    outputToken,
  });

  const handleSaveTrade = useCallback(
    (payload: Parameters<NonNullable<typeof onSaveTrade>>[0]) => {
      onSaveTrade?.({ ...payload, tradeType: "prediction" } as typeof payload);
    },
    [onSaveTrade],
  );

  useEffect(() => {
    priorityFeeAppliedRef.current = false;
    if (
      payToken &&
      outputToken &&
      payToken.mint !== outputToken.mint &&
      inputAmount
    ) {
      const params: FetchQuoteParams = {
        inputMint: payToken.mint,
        outputMint: outputToken.mint,
        amount: inputAmount,
        decimals: payToken.decimals,
        walletPublicKey: publicKey?.toBase58() ?? undefined,
        feeBps: 8,
        prioritizationFeeLamports: "auto",
      };
      lastFetchParamsRef.current = params;
      fetchQuote(params);
    } else {
      clearQuote();
      lastFetchParamsRef.current = null;
    }
  }, [payToken, outputToken, inputAmount, publicKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (
      !mevRisk ||
      !lastFetchParamsRef.current ||
      priorityFeeAppliedRef.current
    )
      return;
    priorityFeeAppliedRef.current = true;
    const updatedParams: FetchQuoteParams = {
      ...lastFetchParamsRef.current,
      feeBps: 8,
      prioritizationFeeLamports: priorityFeeFromRisk(mevRisk),
    };
    lastFetchParamsRef.current = updatedParams;
    fetchQuote(updatedParams);
  }, [mevRisk]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!connected) {
      clearQuote();
      resetSwap();
      setInputAmount("");
      setSavedQuote(null);
      setShowConfirm(false);
      setPostSwapCooldown(false);
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    }
  }, [connected]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (swapStatus === "success" && swapResult) {
      setShowConfirm(true);
      setPostSwapCooldown(true);
      refreshBalance();
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = setTimeout(() => {
        setPostSwapCooldown(false);
        if (lastFetchParamsRef.current) fetchQuote(lastFetchParamsRef.current);
      }, 3000);
    }
    return () => {};
  }, [swapStatus, swapResult]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    };
  }, []);

  const handleSwap = async () => {
    if (!quote || !connected || postSwapCooldown) return;
    setSavedQuote(quote);
    await executeSwap({ quote, wallet, inputToken: payToken, outputToken });
  };

  const handleRetryQuote = useCallback(() => {
    if (lastFetchParamsRef.current) fetchQuote(lastFetchParamsRef.current);
  }, [fetchQuote]);

  const handleNewSwap = () => {
    setShowConfirm(false);
    setInputAmount("");
    clearQuote();
    resetSwap();
    setSavedQuote(null);
  };

  const handleMarketSelect = (market: PredictionMarket) => {
    setSelectedMarket(market);
    setShowMarketDropdown(false);
    clearQuote();
    setInputAmount("");
    resetSwap();
    priorityFeeAppliedRef.current = false;
  };

  const handleSideChange = (newSide: Side) => {
    if (newSide === side) return;
    setSide(newSide);
    clearQuote();
    setInputAmount("");
    priorityFeeAppliedRef.current = false;
  };

  const handlePayTokenChange = (token: Token) => {
    setPayToken(token);
    clearQuote();
    setInputAmount("");
    priorityFeeAppliedRef.current = false;
  };

  const isSwapping = swapStatus === "signing" || swapStatus === "confirming";
  const canSwap =
    connected &&
    quote &&
    !isSwapping &&
    !quoteLoading &&
    inputAmount &&
    !postSwapCooldown;

  const getButtonContent = (): ButtonContent => {
    if (!connected)
      return { text: "Connect Wallet", disabled: true, variant: "secondary" };
    if (!inputAmount)
      return { text: "Enter Amount", disabled: true, variant: "secondary" };
    if (postSwapCooldown)
      return {
        text: "Refreshing balance…",
        disabled: true,
        variant: "loading",
      };
    if (quoteLoading)
      return { text: "Fetching Quote…", disabled: true, variant: "loading" };
    if (quoteError)
      return { text: "No Route Available", disabled: true, variant: "error" };
    if (swapStatus === "signing")
      return {
        text: "Waiting for Signature…",
        disabled: true,
        variant: "loading",
      };
    if (swapStatus === "confirming")
      return {
        text: "Confirming on Solana…",
        disabled: true,
        variant: "loading",
      };
    if (!quote)
      return {
        text: `Buy ${side} Tokens`,
        disabled: true,
        variant: "secondary",
      };
    return {
      text: `Buy ${side} — ${outputToken.symbol}`,
      disabled: false,
      variant: side === "YES" ? "yes" : "no",
    };
  };

  const btn = getButtonContent();
  const pct = Math.round(selectedMarket.probability * 100);

  return (
    <>
      <motion.div
        className="w-full mx-auto"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <div className="bg-terminal-card border border-terminal-border rounded-2xl overflow-hidden shadow-2xl">
          <div className="px-4 py-3 border-b border-terminal-border">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 shrink-0">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full animate-pulse",
                    isDevnet ? "bg-terminal-yellow" : "bg-terminal-accent",
                  )}
                />
                <span className="font-mono font-bold text-terminal-text text-sm tracking-wider">
                  PREDICT
                </span>
                <span
                  className={cn(
                    "font-mono text-xs tracking-widest hidden sm:inline",
                    isDevnet ? "text-terminal-yellow" : "text-terminal-dim",
                  )}
                >
                  / {isDevnet ? "DEVNET" : "DFLOW ROUTING"}
                </span>
              </div>
              <div className="shrink-0 max-w-[180px] sm:max-w-none overflow-hidden">
                <WalletMultiButton />
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 space-y-3">
            <div className="relative">
              <button
                onClick={() => setShowMarketDropdown((v) => !v)}
                className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-terminal-surface border border-terminal-border hover:border-terminal-accent/40 transition-colors text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Target size={13} className="text-terminal-accent shrink-0" />
                  <span className="font-mono text-xs text-terminal-text truncate">
                    {selectedMarket.question}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-xs text-terminal-dim bg-terminal-card border border-terminal-border px-2 py-0.5 rounded">
                    {selectedMarket.category}
                  </span>
                  <motion.div
                    animate={{ rotate: showMarketDropdown ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={14} className="text-terminal-dim" />
                  </motion.div>
                </div>
              </button>

              <AnimatePresence>
                {showMarketDropdown && (
                  <>
                    <motion.div
                      className="fixed inset-0 z-10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onMouseDown={() => setShowMarketDropdown(false)}
                    />
                    <motion.div
                      className="absolute top-full left-0 right-0 z-20 mt-2 bg-terminal-card border border-terminal-border rounded-xl shadow-2xl overflow-hidden"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18 }}
                    >
                      {PREDICTION_MARKETS.map((market) => (
                        <button
                          key={market.id}
                          onClick={() => handleMarketSelect(market)}
                          className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-terminal-surface transition-colors text-left border-b border-terminal-border/50 last:border-0 ${
                            selectedMarket.id === market.id
                              ? "bg-terminal-accent/5"
                              : ""
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-mono text-xs text-terminal-text leading-relaxed">
                              {market.question}
                            </div>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className="font-mono text-xs text-terminal-dim">
                                {market.category}
                              </span>
                              <span className="font-mono text-xs font-bold text-terminal-green">
                                {Math.round(market.probability * 100)}% YES
                              </span>
                              <span className="font-mono text-xs text-terminal-dim/60">
                                ${(market.volume24h / 1000).toFixed(0)}K vol
                              </span>
                            </div>
                          </div>
                          {selectedMarket.id === market.id && (
                            <div className="w-1.5 h-1.5 rounded-full bg-terminal-accent mt-1 shrink-0" />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="rounded-xl bg-terminal-surface border border-terminal-border px-4 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-terminal-dim tracking-wider">
                  MARKET PROBABILITY
                </span>
                <span className="font-mono text-xs text-terminal-dim/60">
                  ${(selectedMarket.volume24h / 1000).toFixed(0)}K / 24h
                </span>
              </div>
              <div className="h-2 rounded-full bg-terminal-card overflow-hidden">
                <motion.div
                  key={selectedMarket.id}
                  className="h-full rounded-full bg-gradient-to-r from-terminal-green to-terminal-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-terminal-green">
                  {pct}% YES
                </span>
                <span className="font-mono text-sm font-bold text-terminal-red">
                  {100 - pct}% NO
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <motion.button
                onClick={() => handleSideChange("YES")}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl font-mono font-bold text-sm tracking-wider border transition-all duration-200 ${
                  side === "YES"
                    ? "bg-terminal-green/15 border-terminal-green/60 text-terminal-green glow-green"
                    : "bg-terminal-surface border-terminal-border text-terminal-dim hover:border-terminal-green/30 hover:text-terminal-green/70"
                }`}
                whileTap={{ scale: 0.97 }}
              >
                <TrendingUp size={14} />
                BUY YES
              </motion.button>
              <motion.button
                onClick={() => handleSideChange("NO")}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl font-mono font-bold text-sm tracking-wider border transition-all duration-200 ${
                  side === "NO"
                    ? "bg-terminal-red/15 border-terminal-red/50 text-terminal-red"
                    : "bg-terminal-surface border-terminal-border text-terminal-dim hover:border-terminal-red/30 hover:text-terminal-red/70"
                }`}
                whileTap={{ scale: 0.97 }}
              >
                <TrendingDown size={14} />
                BUY NO
              </motion.button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={`${selectedMarket.id}-${side}`}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-terminal-surface/50 border border-terminal-border"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
              >
                <img
                  src={outputToken.logo ?? undefined}
                  alt={outputToken.symbol}
                  className="w-5 h-5 rounded-full shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <span className="font-mono text-xs text-terminal-dim">
                  You receive{" "}
                  <span className="text-terminal-text font-semibold">
                    {outputToken.symbol}
                  </span>{" "}
                  —{" "}
                  <span className="text-terminal-dim/70">
                    {outputToken.name}
                  </span>
                </span>
              </motion.div>
            </AnimatePresence>

            <div className="rounded-xl bg-terminal-surface border border-terminal-border focus-within:border-terminal-accent/40 transition-colors">
              <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <span className="text-terminal-dim text-xs font-mono">
                  You pay
                </span>
                {connected && (
                  <span className="text-terminal-dim text-xs font-mono">
                    Wallet connected
                  </span>
                )}
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
                <div className="flex gap-1 shrink-0">
                  {PAY_TOKENS.map((t) => (
                    <button
                      key={t.mint}
                      onClick={() => handlePayTokenChange(t)}
                      className={`px-2 py-1 rounded-lg font-mono text-xs font-bold transition-colors ${
                        payToken.mint === t.mint
                          ? "bg-terminal-accent/20 text-terminal-accent border border-terminal-accent/40"
                          : "bg-terminal-card border border-terminal-border text-terminal-dim hover:border-terminal-accent/30 hover:text-terminal-accent/70"
                      }`}
                    >
                      {t.symbol}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <AnimatePresence>
              {(quote || quoteLoading || quoteError) && (
                <motion.div
                  className="rounded-xl bg-terminal-surface/50 border border-terminal-border p-3"
                  {...fadeSlide}
                >
                  <QuoteDisplay
                    quote={quote}
                    inputToken={payToken}
                    outputToken={outputToken}
                    loading={quoteLoading}
                    error={quoteError}
                    onRetry={handleRetryQuote}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {!isDevnet && (mevRisk || mevRiskLoading) && (
                <motion.div key="mev-badge" {...fadeSlide}>
                  <MevRiskBadge risk={mevRisk} loading={mevRiskLoading} />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {swapError && swapStatus === "error" && (
                <motion.div
                  className="flex items-start gap-2 px-4 py-3 rounded-lg bg-terminal-red/10 border border-terminal-red/30"
                  {...fadeSlide}
                >
                  <AlertCircle
                    size={14}
                    className="text-terminal-red mt-0.5 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-terminal-red text-xs font-mono leading-relaxed">
                      {swapError}
                    </p>
                    {swapError !== "Transaction cancelled in wallet." && (
                      <button
                        onClick={() => {
                          resetSwap();
                          handleRetryQuote();
                        }}
                        title="Refresh & retry"
                        className="mt-2 flex items-center gap-2 text-terminal-red/70 hover:text-terminal-red text-xs font-mono transition-colors group"
                      >
                        <span className="flex items-center justify-center w-6 h-6 rounded-full border border-terminal-red/40 group-hover:border-terminal-red group-hover:bg-terminal-red/10 transition-all">
                          <RefreshCw size={12} />
                        </span>
                        <span>Refresh & retry</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {swapWarning && (
                <motion.div
                  className="flex items-start gap-2.5 px-3 py-3 rounded-lg bg-terminal-yellow/10 border border-terminal-yellow/30"
                  {...fadeSlide}
                >
                  <Shield
                    size={13}
                    className="text-terminal-yellow mt-0.5 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-terminal-yellow text-xs font-mono leading-relaxed">
                      {swapWarning}
                    </p>
                    <div className="mt-1.5 flex items-center gap-3">
                      <button
                        onClick={handleSwap}
                        className="flex items-center gap-1 text-terminal-yellow/80 hover:text-terminal-yellow text-xs font-mono transition-colors"
                      >
                        <RefreshCw size={10} />
                        <span>Try again</span>
                      </button>
                      <button
                        onClick={clearWarning}
                        className="flex items-center gap-1 text-terminal-dim hover:text-terminal-text text-xs font-mono transition-colors"
                      >
                        <X size={10} />
                        <span>Dismiss</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {swapStatus === "signing" && (
                <motion.div
                  className="flex items-start gap-2.5 px-3 py-3 rounded-lg border"
                  style={{
                    background: "rgba(251,191,36,0.07)",
                    borderColor: "rgba(251,191,36,0.35)",
                  }}
                  {...fadeSlide}
                >
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    className="w-4 h-4 mt-0.5 shrink-0"
                    style={{ color: "#fbbf24" }}
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 6a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                      fill="currentColor"
                    />
                  </svg>
                  <p
                    className="font-mono text-xs leading-relaxed"
                    style={{ color: "#fde68a" }}
                  >
                    You may see a Solflare security warning — this is a known
                    false positive for DFlow-routed transactions. Click{" "}
                    <span className="font-bold text-amber-300">Confirm</span> to
                    proceed safely.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isSwapping && (
                <motion.div
                  className="flex items-center gap-2 px-4 py-3 rounded-lg bg-terminal-accent/10 border border-terminal-accent/30"
                  {...fadeSlide}
                >
                  {swapStatus === "signing" ? (
                    <Clock
                      size={14}
                      className="text-terminal-accent shrink-0 animate-pulse"
                    />
                  ) : (
                    <Loader2
                      size={14}
                      className="text-terminal-accent shrink-0 animate-spin"
                    />
                  )}
                  <p className="text-terminal-accent text-xs font-mono">
                    {swapStatus === "signing"
                      ? "Approve the transaction in your wallet…"
                      : "Broadcasting to Solana validators…"}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <BuyButton
              label={btn.text}
              variant={btn.variant}
              disabled={btn.disabled || !canSwap}
              onClick={handleSwap}
              isLoading={isSwapping || quoteLoading}
            />

            {!isDevnet && (
              <div className="flex items-center gap-1.5 justify-center pt-1">
                <Info size={10} className="text-terminal-dim/60" />
                <span className="text-terminal-dim/60 text-xs font-mono">
                  Outcome tokens routed through DFlow's MEV-resistant network
                </span>
              </div>
            )}
          </div>
        </div>

        <PredictStatsStrip
          market={selectedMarket}
          side={side}
          outputToken={outputToken}
          mevRisk={mevRisk}
        />
      </motion.div>

      <AnimatePresence>
        {showConfirm && swapResult && (
          <PostTradeCard
            result={swapResult}
            inputToken={payToken}
            outputToken={outputToken}
            quotedOutput={
              (savedQuote?.outAmount as string | number | undefined) ||
              (savedQuote?.outputAmount as string | number | undefined)
            }
            onClose={() => setShowConfirm(false)}
            onNewSwap={handleNewSwap}
            onSaveTrade={handleSaveTrade}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function BuyButton({
  label,
  variant,
  disabled,
  onClick,
  isLoading,
}: BuyButtonProps) {
  const base =
    "w-full py-4 rounded-xl font-mono font-bold text-sm tracking-wider transition-all duration-200 flex items-center justify-center gap-2.5 relative overflow-hidden";

  const variants: Record<BuyVariant, string> = {
    yes: "bg-terminal-green/20 border border-terminal-green/60 text-terminal-green hover:bg-terminal-green/30 glow-green disabled:opacity-60 disabled:cursor-not-allowed",
    no: "bg-terminal-red/15 border border-terminal-red/40 text-terminal-red hover:bg-terminal-red/25 disabled:opacity-60 disabled:cursor-not-allowed",
    secondary:
      "bg-terminal-surface border border-terminal-border text-terminal-dim cursor-not-allowed",
    loading:
      "bg-terminal-surface border border-terminal-accent/30 text-terminal-accent cursor-not-allowed",
    error:
      "bg-terminal-red/10 border border-terminal-red/30 text-terminal-red cursor-not-allowed",
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant] ?? variants.secondary}`}
      whileHover={!disabled ? { scale: 1.01 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
    >
      {isLoading && <Loader2 size={15} className="animate-spin shrink-0" />}
      {!isLoading && variant === "yes" && (
        <TrendingUp size={15} className="shrink-0" />
      )}
      {!isLoading && variant === "no" && (
        <TrendingDown size={15} className="shrink-0" />
      )}
      <span>{label}</span>
      {(variant === "yes" || variant === "no") && !isLoading && (
        <span className="absolute right-4 text-xs font-mono opacity-50 tracking-widest">
          DFLOW
        </span>
      )}
    </motion.button>
  );
}

function PredictStatsStrip({
  market,
  side,
  outputToken,
  mevRisk,
}: PredictStatsStripProps) {
  const { isDevnet } = useNetwork();
  const priorityFee = priorityFeeFromRisk(mevRisk);
  const priorityFeeNum = priorityFee === "auto" ? 0 : Number(priorityFee);
  const priorityLabel =
    priorityFee === "auto"
      ? "Auto"
      : priorityFeeNum >= 100_000
        ? "High"
        : priorityFeeNum >= 50_000
          ? "Med"
          : "Low";

  const stats = [
    {
      label: "MEV Protection",
      value: isDevnet ? "Disabled" : "Active",
      color: isDevnet ? "text-terminal-dim" : "text-terminal-green",
    },
    {
      label: isDevnet ? "Routing" : "Priority Fee",
      value: isDevnet ? "Jupiter" : priorityLabel,
      color: isDevnet
        ? "text-terminal-yellow"
        : mevRisk?.level === "HIGH"
          ? "text-terminal-red"
          : mevRisk?.level === "MEDIUM"
            ? "text-terminal-yellow"
            : "text-terminal-accent",
    },
    {
      label: "Outcome Token",
      value: outputToken.symbol,
      color: side === "YES" ? "text-terminal-green" : "text-terminal-red",
    },
  ];

  return (
    <div className="mt-3 grid grid-cols-3 gap-2">
      {stats.map((s, i) => (
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
  );
}
