import React, { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { X, Copy, Check, Shield, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { useNetwork } from "../contexts/NetworkContext";

export default function DepositModal({ walletAddress, onClose }) {
  const { isDevnet } = useNetwork();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  function copyAddress() {
    navigator.clipboard.writeText(walletAddress).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const shortAddr = walletAddress
    ? walletAddress.slice(0, 6) + "···" + walletAddress.slice(-6)
    : "";

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        className="bg-terminal-card border-t sm:border border-terminal-border sm:rounded-2xl w-full sm:max-w-md shadow-2xl flex flex-col overflow-hidden"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-terminal-border shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-terminal-accent text-sm tracking-wide">
              DEPOSIT
            </span>
            <span
              className={`inline-flex items-center gap-2 px-2 py-0.5 rounded-full font-mono text-xs font-semibold ${
                isDevnet
                  ? "bg-terminal-yellow/10 text-terminal-yellow border border-terminal-yellow/20"
                  : "bg-terminal-border/10 text-terminal-dim border border-terminal-dim/20"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                  isDevnet ? "bg-terminal-yellow" : "bg-terminal-green"
                }`}
              />
              {isDevnet ? "DEVNET" : "MAINNET"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-terminal-dim hover:text-terminal-text transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center gap-5">
          {/* QR Code */}
          <div className="p-4 bg-white rounded-2xl shadow-inner">
            <QRCode
              value={walletAddress}
              size={180}
              fgColor="#0a0b0f"
              bgColor="#ffffff"
              level="M"
            />
          </div>

          {/* Instruction */}
          <p className="font-mono text-xs text-terminal-dim text-center leading-relaxed px-2">
            Scan or copy your address below to receive tokens on Solana
            {isDevnet ? " Devnet" : " Mainnet"}.
          </p>

          {/* Address display */}
          <div className="w-full bg-terminal-surface border border-terminal-border rounded-xl px-4 py-3 flex items-center justify-between gap-3">
            <span className="font-mono text-xs text-terminal-text tracking-wider truncate">
              {walletAddress}
            </span>
            <button
              onClick={copyAddress}
              title="Copy address"
              className="shrink-0 flex items-center gap-1.5 font-mono text-xs px-2.5 py-1.5 rounded-lg transition-all duration-200 border border-terminal-border hover:border-terminal-accent/40 text-terminal-dim hover:text-terminal-accent"
            >
              {copied ? (
                <>
                  <Check size={12} className="text-terminal-green" />
                  <span className="text-terminal-green">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  Copy
                </>
              )}
            </button>
          </div>

          {/* Short address for visual reference */}
          <p className="font-mono text-xs text-terminal-dim/60 tracking-widest">
            {shortAddr}
          </p>

          {/* View on explorer */}
          <a
            href={
              isDevnet
                ? `https://solscan.io/account/${walletAddress}?cluster=devnet`
                : `https://solscan.io/account/${walletAddress}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-mono text-xs text-terminal-dim hover:text-terminal-accent transition-colors"
          >
            <ExternalLink size={11} />
            View on Solscan
          </a>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 shrink-0 flex items-center justify-center gap-1.5 pt-1">
          <span className="font-mono text-[10px] text-terminal-accent/70 tracking-wider">
            Use to receive token on the Solana network only.
          </span>
        </div>
      </motion.div>
    </div>
  );
}
