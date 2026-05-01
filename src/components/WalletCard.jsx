import React, { useState } from "react";
import { Eye, EyeOff, ArrowDownToLine, Send as SendIcon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { TbCurrencySolana } from "react-icons/tb";
import { useWallet } from "@solana/wallet-adapter-react";
import { WALLETS } from "../constants/wallets";
import DepositModal from "./DepositModal";
import SendModal from "./SendModal";

const WALLET_MAP = Object.fromEntries(WALLETS.map((w) => [w.name, w]));

function WalletIcon({ walletName, connected }) {
  const cfg = WALLET_MAP[walletName];

  if (connected && cfg) {
    return (
      <div
        className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center overflow-hidden"
        style={{
          background: `radial-gradient(circle at 60% 40%, ${cfg.color}33 0%, ${cfg.color}11 100%)`,
          border: `1.5px solid ${cfg.border}`,
          boxShadow: `0 0 14px ${cfg.glow}`,
        }}
      >
        <img
          src={cfg.logo}
          alt={cfg.name}
          className="w-7 h-7 rounded-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="shrink-0 w-11 h-11 rounded-full bg-terminal-surface border border-terminal-accent/20 flex items-center justify-center">
      <TbCurrencySolana size={22} className="text-terminal-accent" />
    </div>
  );
}

export default function WalletCard({
  solBalance,
  solPrice,
  priceLoading,
  tradesCount,
  walletAddress,
  connected,
  balanceHidden = false,
  onToggleHide,
  onSendSuccess,
}) {
  const { wallet } = useWallet();
  const walletName = wallet?.adapter?.name ?? null;

  const [depositOpen, setDepositOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);

  const usdValue =
    solBalance != null && solPrice != null
      ? (solBalance * solPrice).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : null;

  const solDisplay =
    solBalance != null
      ? solBalance < 0.001
        ? solBalance.toFixed(6)
        : solBalance < 100
          ? solBalance.toFixed(4)
          : solBalance.toFixed(2)
      : null;

  const usdPriceDisplay =
    solPrice != null
      ? solPrice.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : null;

  const walletCfg = connected ? WALLET_MAP[walletName] : null;

  return (
    <>
      <motion.div
        className="w-full bg-terminal-card border border-terminal-border rounded-2xl p-5 mb-6 overflow-hidden relative"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        style={walletCfg ? { borderColor: walletCfg.border } : undefined}
      >
        {walletCfg && (
          <div
            className="pointer-events-none absolute -top-8 -left-8 w-40 h-40 rounded-full opacity-20 blur-2xl"
            style={{ background: walletCfg.color }}
          />
        )}

        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 min-w-0">
            <WalletIcon walletName={walletName} connected={connected} />

            <div className="min-w-0 flex flex-col items-start gap-2">
              <p className="font-mono text-[10px] text-terminal-dim tracking-widest uppercase mb-1">
                {connected
                  ? walletName
                    ? `${walletName} · Wallet Balance`
                    : "Wallet Balance"
                  : "SOL Price"}
              </p>

              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-2xl text-terminal-text leading-none">
                  {priceLoading && usdValue === null && usdPriceDisplay === null
                    ? "···"
                    : connected && usdValue !== null
                      ? balanceHidden
                        ? "$ ••••••"
                        : `$${usdValue}`
                      : usdPriceDisplay !== null
                        ? `$${usdPriceDisplay}`
                        : "—"}
                </span>
                {connected && (
                  <button
                    onClick={onToggleHide}
                    title={balanceHidden ? "Show balance" : "Hide balance"}
                    className="shrink-0 text-terminal-dim hover:text-terminal-accent transition-colors"
                  >
                    {balanceHidden ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 mt-1 font-mono text-xs text-terminal-dim flex-wrap">
                {connected && solDisplay !== null && (
                  <span>
                    {balanceHidden ? "•••• SOL" : `${solDisplay} SOL`}
                  </span>
                )}
                {connected && solDisplay !== null && (
                  <span className="text-terminal-dim/30">•</span>
                )}
                {connected ? (
                  <span>{tradesCount ?? 0} transactions</span>
                ) : (
                  <span>auto-updates</span>
                )}
              </div>
            </div>
          </div>

          {connected && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setDepositOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-mono text-xs font-bold tracking-wider bg-terminal-green/10 border border-terminal-green/25 text-terminal-green hover:bg-terminal-green/20 hover:border-terminal-green/40 active:scale-95 transition-all duration-200"
              >
                <ArrowDownToLine size={13} />
                DEPOSIT
              </button>
              <button
                onClick={() => setSendOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-mono text-xs font-bold tracking-wider bg-terminal-accent/10 border border-terminal-accent/25 text-terminal-accent hover:bg-terminal-accent/20 hover:border-terminal-accent/40 active:scale-95 transition-all duration-200"
              >
                <SendIcon size={13} />
                SEND
              </button>
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {depositOpen && walletAddress && (
          <DepositModal
            walletAddress={walletAddress}
            onClose={() => setDepositOpen(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {sendOpen && <SendModal walletAddress={walletAddress} onClose={() => setSendOpen(false)} onSendSuccess={onSendSuccess} />}
      </AnimatePresence>
    </>
  );
}
