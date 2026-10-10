import React, { useState } from "react";
import { ShieldCheck, Wallet, RefreshCw, LogOut, Lock } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWalletBalance } from "../hooks/useWalletBalance";
import { useAuth } from "../lib/auth-context";
import logo from "../assets/mainstay-logo.png";
import GuideMenu from "./walkthrough/GuideMenu";
import SecurityModal from "./security/SecurityModal";
import type { TourId } from "./walkthrough/tours";

interface AppHeaderProps {
  balanceHidden?: boolean;
  onStartTour?: (id: TourId) => void;
}

export default function AppHeader({
  balanceHidden = false,
  onStartTour,
}: AppHeaderProps) {
  const { connected } = useWallet();
  const { signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const {
    balance,
    loading: balLoading,
    refresh: refreshBalance,
  } = useWalletBalance();

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <motion.header
      className="border-b border-terminal-border bg-terminal-surface/80 backdrop-blur-sm sticky top-0 z-[1000]"
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="w-full px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 shrink-0">
          <img src={logo} alt="Mainstay Logo" className="w-8 h-8" />
          <span className="font-mono font-bold text-sm text-terminal-text tracking-wider">
            Main<span className="text-terminal-accent">stay</span>
          </span>
        </div>

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
                    {balanceHidden
                      ? "••••"
                      : balance < 0.001
                        ? balance.toFixed(6)
                        : balance < 100
                          ? balance.toFixed(4)
                          : balance.toFixed(2)}{" "}
                    <span className="text-terminal-bright font-semibold">
                      SOL
                    </span>
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

          {onStartTour && <GuideMenu onStart={onStartTour} />}

          <button
            onClick={() => setShowSecurity(true)}
            title="Security (2FA)"
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-terminal-border bg-terminal-card px-2.5 py-1.5 text-terminal-dim transition-all duration-200 hover:border-terminal-accent/40 hover:text-terminal-accent"
          >
            <Lock size={11} />
            <span className="hidden font-mono text-xs tracking-wider sm:inline">
              2FA
            </span>
          </button>

          <div className="flex items-center gap-1.5 bg-terminal-card border border-terminal-border rounded-lg px-2.5 py-1.5">
            <ShieldCheck
              size={11}
              className="text-terminal-green animate-pulse"
            />
            <span className="hidden sm:inline font-mono text-xs text-terminal-green tracking-wider">
              ACTIVE
            </span>
          </div>

          <button
            onClick={handleSignOut}
            disabled={signingOut}
            title="Sign out"
            className="flex items-center gap-1.5 bg-terminal-card border border-terminal-border rounded-lg px-2.5 py-1.5 text-terminal-dim hover:text-terminal-red hover:border-terminal-red/30 transition-all duration-200 disabled:opacity-40"
          >
            <LogOut size={11} className={signingOut ? "animate-pulse" : ""} />
            <span className="hidden sm:inline font-mono text-xs tracking-wider">
              {signingOut ? "···" : "LOGOUT"}
            </span>
          </button>
        </div>
      </div>
      {showSecurity && <SecurityModal onClose={() => setShowSecurity(false)} />}
    </motion.header>
  );
}
