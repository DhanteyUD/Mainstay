import React from "react";
import { Shield, ShieldCheck, Lock, Wallet, RefreshCw } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWalletBalance } from "../hooks/useWalletBalance";
import logo from "../assets/mainstay-logo.png";

export default function AppHeader() {
  const { connected } = useWallet();
  const {
    balance,
    loading: balLoading,
    refresh: refreshBalance,
  } = useWalletBalance();

  return (
    <motion.header
      className="border-b border-terminal-border bg-terminal-surface/80 backdrop-blur-sm sticky top-0 z-50"
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 shrink-0">
          <div className="relative">
            <img src={logo} alt="Mainstay Logo" className="w-8 h-8" />
          </div>
          <span className="font-mono font-bold text-sm text-terminal-text tracking-wider">
            Main<span className="text-terminal-accent">stay</span>
          </span>
        </div>

        {/* Tagline */}
        <div className="hidden sm:flex items-center gap-2 text-terminal-dim text-xs font-mono">
          <Lock size={11} className="text-terminal-accent" />
          <span>Protected DEX swaps on Solana</span>
        </div>

        {/* Balance chip + ONLINE badge */}
        <div className="flex items-center gap-2">
          <AnimatePresence>
            {connected && (
              <motion.div
                className="flex items-center gap-1.5 bg-terminal-card border border-terminal-green/25 rounded-lg px-2.5 py-1.5 group"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Wallet size={11} className="text-terminal-green shrink-0" />
                {balLoading && balance === null ? (
                  <span className="font-mono text-xs text-terminal-dim tracking-wider">
                    ···
                  </span>
                ) : balance != null ? (
                  <span className="font-mono text-xs text-terminal-green tracking-wider">
                    {balance < 0.001
                      ? balance.toFixed(6)
                      : balance < 100
                        ? balance.toFixed(4)
                        : balance.toFixed(2)}{" "}
                    <span className="text-terminal-bright font-semibold">SOL</span>
                  </span>
                ) : (
                  <span className="font-mono text-xs text-terminal-dim tracking-wider">
                    — SOL
                  </span>
                )}
                <button
                  onClick={refreshBalance}
                  title="Refresh balance"
                  className="opacity-60 group-hover:opacity-80 hover:!opacity-100 transition-opacity ml-0.5 text-terminal-dim hover:text-terminal-green"
                >
                  <RefreshCw
                    size={9}
                    className={balLoading ? "animate-spin" : ""}
                  />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-2 bg-terminal-card border border-terminal-border rounded-lg px-2.5 py-1.5">
            <ShieldCheck size={11} className="text-terminal-green animate-pulse" />
            <span className="hidden sm:inline font-mono text-xs text-terminal-green tracking-wider">
              ACTIVE
            </span>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
