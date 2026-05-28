import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { FaSquareXmark } from "react-icons/fa6";
import {
  ArrowUpDown,
  Shield,
  AlertCircle,
  Loader2,
  Clock,
  Info,
  RefreshCw,
  X,
  Settings,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { RiTokenSwapFill } from "react-icons/ri";

import TokenSelector from "./TokenSelector";
import QuoteDisplay from "./QuoteDisplay";
import PostTradeCard from "./PostTradeCard";
import MevRiskBadge from "./MevRiskBadge";

import { useSwap } from "../hooks/useSwap";
import { useMevRisk } from "../hooks/useMevRisk";
import { useWalletBalance } from "../hooks/useWalletBalance";
import { TOKENS, SOL_MINT } from "../config";
import { useNetwork } from "../contexts/NetworkContext";
import type { Token } from "../types";

const fadeSlide = {
  initial: { opacity: 0, y: -6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.15 } },
};

type FetchQuoteParams = Parameters<ReturnType<typeof useSwap>["fetchQuote"]>[0];

type ButtonVariant = "primary" | "secondary" | "loading" | "error";

interface ButtonContent {
  text: string;
  disabled: boolean;
  variant: ButtonVariant;
}

interface SwapButtonProps {
  label: string;
  variant: ButtonVariant;
  disabled: boolean;
  onClick: () => void;
  isLoading: boolean;
}

interface SwapInterfaceProps {
  onSaveTrade?: React.ComponentProps<typeof PostTradeCard>["onSaveTrade"];
  onTokensChange?: (tokens: { inputToken: Token; outputToken: Token }) => void;
}

export default function SwapInterface({
  onSaveTrade,
  onTokensChange,
}: SwapInterfaceProps) {
  const wallet = useWallet();
  const { publicKey, connected } = wallet;
  const { connection } = useConnection();
  const { isDevnet, networkLabel } = useNetwork();

  const isSolflare = wallet.wallet?.adapter?.name === "Solflare";

  const [inputToken, setInputToken] = useState<Token>(TOKENS.SOL);
  const [outputToken, setOutputToken] = useState<Token>(TOKENS.USDC);
  const [inputAmount, setInputAmount] = useState("");
  const [inputTokenBalance, setInputTokenBalance] = useState<number | null>(
    null,
  );
  const [showConfirm, setShowConfirm] = useState(false);
  const [savedQuote, setSavedQuote] = useState<Record<string, unknown> | null>(
    null,
  );
  const [flipRotation, setFlipRotation] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const [autoSlippage, setAutoSlippage] = useState(
    () => localStorage.getItem("auto_slippage") !== "false",
  );
  const [slippageBps, setSlippageBps] = useState(
    () => localStorage.getItem("slippage_bps") ?? "50",
  );
  const [customSlippage, setCustomSlippage] = useState(
    () => localStorage.getItem("custom_slippage") ?? "",
  );
  const [priorityFeeMode, setPriorityFeeMode] = useState<"max" | "exact">(
    () =>
      (localStorage.getItem("priority_fee_mode") as "max" | "exact") ?? "max",
  );
  const [priorityFeeAmount, setPriorityFeeAmount] = useState(
    () => localStorage.getItem("priority_fee_amount") ?? "0.0001",
  );

  const [postSwapCooldown, setPostSwapCooldown] = useState(false);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFetchParamsRef = useRef<FetchQuoteParams | null>(null);

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
    inputToken,
    outputToken,
  });

  useEffect(() => {
    onTokensChange?.({ inputToken, outputToken });
  }, [inputToken, outputToken, onTokensChange]);

  useEffect(() => {
    localStorage.setItem("auto_slippage", String(autoSlippage));
  }, [autoSlippage]);
  useEffect(() => {
    localStorage.setItem("slippage_bps", slippageBps);
  }, [slippageBps]);
  useEffect(() => {
    localStorage.setItem("custom_slippage", customSlippage);
  }, [customSlippage]);
  useEffect(() => {
    localStorage.setItem("priority_fee_mode", priorityFeeMode);
  }, [priorityFeeMode]);
  useEffect(() => {
    localStorage.setItem("priority_fee_amount", priorityFeeAmount);
  }, [priorityFeeAmount]);

  useEffect(() => {
    if (
      inputToken &&
      outputToken &&
      inputToken.mint !== outputToken.mint &&
      inputAmount
    ) {
      const params: FetchQuoteParams = {
        inputMint: inputToken.mint,
        outputMint: outputToken.mint,
        amount: inputAmount,
        decimals: inputToken.decimals,
        walletPublicKey: publicKey?.toBase58() ?? undefined,
        slippageBps,
        autoSlippage,
      };
      lastFetchParamsRef.current = params;
      fetchQuote(params);
    } else {
      clearQuote();
      lastFetchParamsRef.current = null;
    }
  }, [inputToken, outputToken, inputAmount, publicKey, isDevnet, slippageBps, autoSlippage, fetchQuote, clearQuote]);

  useEffect(() => {
    if (!connected) {
      clearQuote();
      resetSwap();
      setInputAmount("");
      setSavedQuote(null);
      setShowConfirm(false);
      setPostSwapCooldown(false);
      setInputTokenBalance(null);
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    }
  }, [connected]);

  useEffect(() => {
    if (!connected || !publicKey || !inputToken) {
      setInputTokenBalance(null);
      return;
    }
    async function fetchInputBalance() {
      try {
        if (inputToken.mint === SOL_MINT) {
          const lamports = await connection.getBalance(publicKey!, "confirmed");
          setInputTokenBalance(lamports / 1e9);
        } else {
          const accounts = await connection.getParsedTokenAccountsByOwner(
            publicKey!,
            { programId: TOKEN_PROGRAM_ID },
          );
          let bal = 0;
          for (const { account } of accounts.value) {
            const info = (
              account.data as {
                parsed?: {
                  info?: { mint?: string; tokenAmount?: { uiAmount?: number } };
                };
              }
            ).parsed?.info;
            if (info?.mint === inputToken.mint) {
              bal = parseFloat(String(info.tokenAmount?.uiAmount || 0));
              break;
            }
          }
          setInputTokenBalance(bal);
        }
      } catch {
        setInputTokenBalance(null);
      }
    }
    fetchInputBalance();
  }, [connected, publicKey, inputToken, connection]);

  useEffect(() => {
    if (swapStatus === "success" && swapResult) {
      setShowConfirm(true);
      setPostSwapCooldown(true);

      refreshBalance();

      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = setTimeout(() => {
        setPostSwapCooldown(false);
        if (lastFetchParamsRef.current) {
          fetchQuote(lastFetchParamsRef.current);
        }
      }, 3000);
    }
  }, [swapStatus, swapResult]);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    };
  }, []);

  const handleHalfBalance = () => {
    if (inputTokenBalance == null || inputTokenBalance === 0) return;
    const decimals = inputToken?.decimals ?? 9;
    const half = parseFloat((inputTokenBalance / 2).toFixed(decimals));
    setInputAmount(String(half));
  };

  const handleMaxBalance = () => {
    if (inputTokenBalance == null || inputTokenBalance === 0) return;
    const decimals = inputToken?.decimals ?? 9;
    const max = parseFloat(inputTokenBalance.toFixed(decimals));
    setInputAmount(String(max));
  };

  const handleFlip = useCallback(() => {
    setFlipRotation((r) => r + 180);
    setInputToken(outputToken);
    setOutputToken(inputToken);
    setInputAmount("");
    clearQuote();
  }, [inputToken, outputToken, clearQuote]);

  const handleInputTokenChange = (token: Token) => {
    if (token.mint === outputToken?.mint) {
      setOutputToken(inputToken);
    }
    setInputToken(token);
    clearQuote();
    setInputAmount("");
  };

  const handleOutputTokenChange = (token: Token) => {
    if (token.mint === inputToken?.mint) {
      setInputToken(outputToken);
    }
    setOutputToken(token);
    clearQuote();
  };

  const handleSwap = async () => {
    if (!quote || !connected || postSwapCooldown) return;
    setSavedQuote(quote);
    await executeSwap({
      quote,
      wallet,
      inputToken,
      outputToken,
      priorityFeeMode,
      priorityFeeAmountSol: priorityFeeAmount,
    });
  };

  const handleRetryQuote = useCallback(() => {
    if (lastFetchParamsRef.current) fetchQuote(lastFetchParamsRef.current);
  }, [fetchQuote]);

  const handleNewSwap = () => {
    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }
    setPostSwapCooldown(false);
    setShowConfirm(false);
    setInputAmount("");
    clearQuote();
    resetSwap();
    setSavedQuote(null);
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
    if (!inputToken || !outputToken)
      return { text: "Select Tokens", disabled: true, variant: "secondary" };
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
      return { text: "Review Quote", disabled: true, variant: "secondary" };
    return { text: "Swap", disabled: false, variant: "primary" };
  };

  const btn = getButtonContent();

  return (
    <>
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
                <div
                  className={`w-2 h-2 rounded-full animate-pulse ${isDevnet ? "bg-terminal-yellow" : "bg-terminal-green"}`}
                />
                <span className="font-mono font-bold text-terminal-text text-sm tracking-wider">
                  SWAP
                </span>
                <span
                  className={`font-mono text-xs tracking-widest px-2 py-0.5 rounded border ${
                    isDevnet
                      ? "text-terminal-yellow border-terminal-yellow/40 bg-terminal-yellow/10"
                      : "text-terminal-dim border-terminal-border bg-transparent"
                  }`}
                >
                  {networkLabel}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowSettings((s) => !s)}
                  className={`flex items-center gap-1.5 p-2 rounded-lg border font-mono text-xs transition-colors duration-150 ${
                    showSettings
                      ? "border-terminal-accent/60 bg-terminal-accent/10 text-terminal-accent"
                      : "border-terminal-border bg-transparent text-terminal-dim hover:border-terminal-accent/40 hover:text-terminal-accent/80"
                  }`}
                  title="Swap settings"
                >
                  <Settings size={12} />
                  <span className="hidden md:block">
                    {(Number(slippageBps) / 100)
                      .toFixed(2)
                      .replace(/\.?0+$/, "")}
                    %
                  </span>
                </button>
                <div className="max-w-[180px] sm:max-w-none">
                  <WalletMultiButton />
                </div>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showSettings && (
              <motion.div
                key="settings-panel"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18, ease: "easeInOut" }}
                className="overflow-hidden border-b border-terminal-border"
              >
                <div className="px-4 py-3 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs text-terminal-dim tracking-wider">
                      Slippage Tolerance
                    </span>
                    <InfoTooltip text="The maximum price difference you're willing to accept between placing and executing a swap. Higher slippage increases the chance of a successful trade but may result in a worse price." />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setAutoSlippage(true);
                        setCustomSlippage("");
                      }}
                      className={`px-3 py-1 rounded-lg border font-mono text-xs transition-colors duration-150 ${
                        autoSlippage
                          ? "border-terminal-accent bg-terminal-accent/10 text-terminal-accent"
                          : "border-terminal-border text-terminal-dim hover:border-terminal-accent/40 hover:text-terminal-accent/70"
                      }`}
                    >
                      Auto
                    </button>
                    {[
                      { label: "0.1%", bps: "10" },
                      { label: "0.5%", bps: "50" },
                      { label: "1%", bps: "100" },
                    ].map(({ label, bps }) => (
                      <button
                        key={bps}
                        onClick={() => {
                          setAutoSlippage(false);
                          setSlippageBps(bps);
                          setCustomSlippage("");
                        }}
                        className={`px-3 py-1 rounded-lg border font-mono text-xs transition-colors duration-150 ${
                          !autoSlippage &&
                          slippageBps === bps &&
                          !customSlippage
                            ? "border-terminal-accent bg-terminal-accent/10 text-terminal-accent"
                            : "border-terminal-border text-terminal-dim hover:border-terminal-accent/40 hover:text-terminal-accent/70"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg border border-terminal-border text-xs font-mono ml-auto">
                      <input
                        type="number"
                        placeholder="Custom"
                        value={customSlippage}
                        min="0.01"
                        max="50"
                        step="0.1"
                        onChange={(e) => {
                          const val = e.target.value;
                          setAutoSlippage(false);
                          setCustomSlippage(val);
                          const bps = Math.round(Number(val) * 100);
                          if (bps >= 1 && bps <= 5000)
                            setSlippageBps(String(bps));
                        }}
                        className="w-16 bg-transparent outline-none text-terminal-text placeholder-terminal-muted/80"
                      />
                      <span className="text-terminal-dim">%</span>
                    </div>
                  </div>
                  <p
                    className={`font-mono text-[10px] md:text-xs ${!autoSlippage && Number(slippageBps) > 100 ? "text-terminal-yellow" : "text-terminal-dim/60"}`}
                  >
                    {autoSlippage
                      ? "We'll determine the optimal allowed slippage automatically for each swap."
                      : Number(slippageBps) > 100
                        ? "High slippage — risk of an unfavorable fill."
                        : `Your trade will revert if the price moves more than ${(Number(slippageBps) / 100).toFixed(2).replace(/\.?0+$/, "")}%.`}
                  </p>

                  <div className="border-t border-terminal-border pt-3 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs text-terminal-dim tracking-wider">
                        Priority Fee
                      </span>
                      <InfoTooltip text={
                        <span>
                          An additional fee paid to speed up confirmation during network congestion.
                          <span className="block mt-1 pl-2"><span className="font-bold text-terminal-dim">Max:</span> Automatically selects an optimal fee, up to the maximum you set.</span>
                          <span className="block pl-2"><span className="font-bold text-terminal-dim">Exact:</span> Uses the fee you specify for every swap.</span>
                        </span>
                      } />
                    </div>
                    <div className="flex items-center gap-2">
                      {(["max", "exact"] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setPriorityFeeMode(mode)}
                          className={`px-3 py-1 rounded-lg border font-mono text-xs capitalize transition-colors duration-150 ${
                            priorityFeeMode === mode
                              ? "border-terminal-accent bg-terminal-accent/10 text-terminal-accent"
                              : "border-terminal-border text-terminal-dim hover:border-terminal-accent/40 hover:text-terminal-accent/70"
                          }`}
                        >
                          {mode === "max" ? "Max" : "Exact"}
                        </button>
                      ))}
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg border border-terminal-border text-xs font-mono ml-auto">
                        <input
                          type="number"
                          value={priorityFeeAmount}
                          min="0"
                          step="0.0001"
                          onChange={(e) => setPriorityFeeAmount(e.target.value)}
                          className="w-16 bg-transparent outline-none text-terminal-text"
                        />
                        <span className="text-terminal-dim">SOL</span>
                      </div>
                    </div>
                    <p className="font-mono text-[10px] md:text-xs text-terminal-dim/60">
                      {priorityFeeMode === "max"
                        ? "We'll automatically choose the optimal fee, up to the maximum you set."
                        : "Uses the fee you specify for every swap."}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="p-4 sm:p-5 space-y-3">
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
              <div className="flex items-center gap-3 px-4 pb-2">
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
              {connected && inputTokenBalance !== null && (
                <div className="flex justify-end gap-1.5 px-4 pb-3">
                  <button
                    onClick={handleHalfBalance}
                    className="text-xs font-mono text-terminal-accent/70 hover:text-terminal-accent bg-terminal-accent/10 hover:bg-terminal-accent/20 px-2 py-0.5 rounded-lg transition-colors"
                  >
                    50%
                  </button>
                  <button
                    onClick={handleMaxBalance}
                    className="text-xs font-mono text-terminal-accent/70 hover:text-terminal-accent bg-terminal-accent/10 hover:bg-terminal-accent/20 px-2 py-0.5 rounded-lg transition-colors"
                  >
                    Max
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-center -my-1">
              <motion.button
                onClick={handleFlip}
                className="w-9 h-9 rounded-full bg-terminal-surface border border-terminal-border flex items-center justify-center hover:border-terminal-accent/50 hover:bg-terminal-card text-terminal-dim hover:text-terminal-accent transition-colors duration-200"
                animate={{ rotate: flipRotation }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                whileTap={{ scale: 0.88 }}
              >
                <ArrowUpDown size={14} />
              </motion.button>
            </div>

            <div className="rounded-xl bg-terminal-surface border border-terminal-border">
              <div className="px-4 pt-3 pb-1">
                <span className="text-terminal-dim text-xs font-mono">
                  You receive
                </span>
              </div>
              <div className="flex items-center gap-3 px-4 pb-3">
                <div className="flex-1 font-mono text-xl sm:text-2xl font-bold text-terminal-green min-w-0 truncate">
                  {quoteLoading ? (
                    <div className="h-8 w-32 rounded-lg bg-terminal-border animate-pulse" />
                  ) : quote ? (
                    <span>
                      {formatOutputAmount(
                        (quote.outAmount || quote.outputAmount) as
                          | string
                          | number
                          | undefined,
                        outputToken?.decimals || 6,
                      )}
                    </span>
                  ) : (
                    <span className="text-terminal-muted/40">0.00</span>
                  )}
                </div>
                <TokenSelector
                  selected={outputToken}
                  onChange={handleOutputTokenChange}
                  exclude={inputToken}
                />
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
                    inputToken={inputToken}
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
              {swapStatus === "signing" && isSolflare && (
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
                  <div
                    className="font-mono text-xs leading-relaxed space-y-1.5"
                    style={{ color: "#fde68a" }}
                  >
                    <p>
                      If Solflare shows a{" "}
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-terminal-red border-red-400/40 bg-red-400/10 font-semibold">
                        <FaSquareXmark size={10} />
                        Security verification failed
                      </span>{" "}
                      warning, your wallet network may be set to{" "}
                      <span className="font-bold text-amber-300">
                        Devnet
                      </span>{" "}
                      or{" "}
                      <span className="font-bold text-amber-300">Testnet</span>.
                    </p>
                    <p>
                      Open Solflare →{" "}
                      <span className="font-bold text-amber-300">Settings</span>{" "}
                      →{" "}
                      <span className="font-bold text-amber-300">General</span>{" "}
                      →{" "}
                      <span className="font-bold text-amber-300">Network</span>{" "}
                      and switch to{" "}
                      <span className="font-bold text-amber-300">Mainnet</span>,
                      then retry your swap.
                    </p>
                  </div>
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

            <SwapButton
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
                  Orders routed through DFlow's MEV-resistant network
                </span>
              </div>
            )}
          </div>
        </div>

        {isDevnet ? (
          <div className="mt-3 rounded-xl border border-terminal-yellow/20 bg-terminal-yellow/5 p-4">
            <div className="flex items-start gap-2">
              <span className="text-terminal-yellow text-base leading-none">
                ⚠
              </span>
              <div>
                <div className="font-mono text-xs font-semibold text-terminal-yellow mb-1">
                  Devnet Mode
                </div>
                <p className="font-mono text-xs text-terminal-dim leading-relaxed">
                  Connected to Solana devnet. Balances reflect your devnet
                  wallet. Routed via Jupiter — no MEV protection.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <StatsStrip />
        )}
      </motion.div>

      <AnimatePresence>
        {showConfirm && swapResult && (
          <PostTradeCard
            result={swapResult}
            inputToken={inputToken}
            outputToken={outputToken}
            quotedOutput={
              (savedQuote?.outAmount as string | number | undefined) ||
              (savedQuote?.outputAmount as string | number | undefined)
            }
            onClose={() => {
              setShowConfirm(false);
              resetSwap();
              setSavedQuote(null);
            }}
            onNewSwap={handleNewSwap}
            onSaveTrade={onSaveTrade}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function InfoTooltip({ text }: { text: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<{
    top: number;
    left: number;
    transform: string;
  }>({ top: 0, left: 0, transform: "translate(-50%, -100%)" });
  const ref = useRef<HTMLSpanElement>(null);

  const show = () => {
    if (ref.current) {
      const r = ref.current.getBoundingClientRect();
      const TOOLTIP_W = 320; // w-80
      const GAP = 8;

      const rawCenterX = r.left + r.width / 2;
      const clampedCenterX = Math.max(
        TOOLTIP_W / 2 + GAP,
        Math.min(window.innerWidth - TOOLTIP_W / 2 - GAP, rawCenterX),
      );

      const above = r.top >= 60;

      setPos({
        top: (above ? r.top - GAP : r.bottom + GAP) + window.scrollY,
        left: clampedCenterX + window.scrollX,
        transform: above ? "translate(-50%, -100%)" : "translate(-50%, 0)",
      });
    }
    setVisible(true);
  };

  return (
    <span
      ref={ref}
      className="inline-flex items-center"
      onMouseEnter={show}
      onMouseLeave={() => setVisible(false)}
    >
      <Info size={12} className="text-terminal-dim/60 cursor-pointer" />
      {createPortal(
        <div
          style={{
            position: "absolute",
            top: pos.top,
            left: pos.left,
            transform: pos.transform,
            zIndex: 9999,
            opacity: visible ? 1 : 0,
            pointerEvents: "none",
            transition: "opacity 0.1s",
          }}
          className="w-80 rounded-lg bg-terminal-card border border-terminal-muted px-3 py-2 text-xs font-mono text-terminal-dim leading-relaxed shadow-lg"
        >
          {text}
        </div>,
        document.body,
      )}
    </span>
  );
}

function SwapButton({
  label,
  variant,
  disabled,
  onClick,
  isLoading,
}: SwapButtonProps) {
  const base =
    "w-full py-4 rounded-xl font-mono font-bold text-sm tracking-wider transition-colors duration-200 flex items-center justify-center gap-2.5 relative overflow-hidden";

  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-terminal-accent text-black hover:bg-terminal-accentDim glow-cyan disabled:opacity-60 disabled:cursor-not-allowed",
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
      {!isLoading && variant === "primary" && (
        <RiTokenSwapFill size={15} className="shrink-0" />
      )}
      <span>{label}</span>
      {variant === "primary" && !isLoading && (
        <span className="absolute right-4 text-xs font-mono text-black/60 tracking-widest">
          DFLOW
        </span>
      )}
    </motion.button>
  );
}

function StatsStrip() {
  const { isDevnet } = useNetwork();
  const stats = [
    {
      label: "MEV Protection",
      value: isDevnet ? "Disabled" : "Active",
      color: isDevnet ? "text-terminal-dim" : "text-terminal-green",
    },
    {
      label: "Routing",
      value: isDevnet ? "N/A" : "JIT",
      color: isDevnet ? "text-terminal-dim" : "text-terminal-accent",
    },
    {
      label: "Network",
      value: isDevnet ? "Devnet" : "Mainnet",
      color: isDevnet ? "text-terminal-yellow" : "text-terminal-bright",
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

function formatOutputAmount(
  raw: string | number | undefined,
  decimals: number,
): string {
  if (!raw) return "—";
  const val = Number(raw) / Math.pow(10, decimals);
  if (val < 0.000001) return val.toExponential(4);
  if (val < 1) return val.toFixed(6);
  if (val >= 1000000) return (val / 1000000).toFixed(2) + "M";
  if (val >= 1000)
    return val.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return val.toFixed(4);
}
