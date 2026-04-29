import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Send,
  ChevronDown,
  Shield,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useSend } from "../hooks/useSend";
import { useNetwork } from "../contexts/NetworkContext";
import { TOKEN_LIST } from "../config";

const SOL_MINT = "So11111111111111111111111111111111111111112";
const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

function fmtBal(v) {
  if (v == null || v === 0) return "0";
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(2) + "M";
  if (v >= 1000) return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (v >= 1) return v.toFixed(4);
  if (v >= 0.0001) return v.toFixed(6);
  return v.toExponential(3);
}

function isValidSolanaAddress(addr) {
  try {
    new PublicKey(addr);
    return true;
  } catch {
    return false;
  }
}

export default function SendModal({ onClose }) {
  const { publicKey, connected } = useWallet();
  const wallet = useWallet();
  const { connection } = useConnection();
  const { isDevnet } = useNetwork();
  const { sendStatus, sendError, sendResult, executeSend, resetSend } = useSend();

  const [selectedToken, setSelectedToken] = useState(TOKEN_LIST[0]); // SOL
  const [tokenPickerOpen, setTokenPickerOpen] = useState(false);
  const [tokenSearch, setTokenSearch] = useState("");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [balance, setBalance] = useState(null);
  const [balLoading, setBalLoading] = useState(false);

  const recipientValid = recipient.length > 0 && isValidSolanaAddress(recipient);
  const amountNum = parseFloat(amount);
  const amountValid = !isNaN(amountNum) && amountNum > 0 && (balance == null || amountNum <= balance);
  const canSend = recipientValid && amountValid && sendStatus === "idle";

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Escape to close
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Fetch balance for selected token
  const fetchBalance = useCallback(async () => {
    if (!publicKey || !connected) { setBalance(null); return; }
    setBalLoading(true);
    try {
      if (selectedToken.mint === SOL_MINT) {
        const lamports = await connection.getBalance(publicKey);
        setBalance(lamports / 1e9);
      } else {
        const mint = new PublicKey(selectedToken.mint);
        const accounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
          programId: TOKEN_PROGRAM_ID,
        });
        const match = accounts.value.find(
          (a) => a.account.data.parsed.info.mint === selectedToken.mint
        );
        setBalance(match ? match.account.data.parsed.info.tokenAmount.uiAmount : 0);
      }
    } catch {
      setBalance(null);
    } finally {
      setBalLoading(false);
    }
  }, [publicKey, connected, connection, selectedToken]);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);

  function handleMax() {
    if (balance == null) return;
    if (selectedToken.mint === SOL_MINT) {
      // Leave ~0.005 SOL for fees
      const maxSol = Math.max(0, balance - 0.005);
      setAmount(maxSol > 0 ? fmtBal(maxSol) : "0");
    } else {
      setAmount(fmtBal(balance));
    }
  }

  async function handleSend() {
    if (!canSend) return;
    await executeSend({ wallet, token: selectedToken, amount: amountNum, recipient });
  }

  function handleReset() {
    resetSend();
    setAmount("");
    setRecipient("");
  }

  const filteredTokens = TOKEN_LIST.filter(
    (t) =>
      t.symbol.toLowerCase().includes(tokenSearch.toLowerCase()) ||
      t.name.toLowerCase().includes(tokenSearch.toLowerCase())
  );

  const isBusy = sendStatus === "signing" || sendStatus === "confirming";

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !isBusy) onClose(); }}
    >
      <motion.div
        className="bg-terminal-card border-t sm:border border-terminal-border sm:rounded-2xl w-full sm:max-w-sm shadow-2xl flex flex-col overflow-hidden"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-terminal-border shrink-0">
          <div className="flex items-center gap-2">
            <Send size={14} className="text-terminal-accent" />
            <span className="font-mono font-bold text-terminal-accent text-sm tracking-wide">
              SEND
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-xs font-semibold ${
                isDevnet
                  ? "bg-terminal-yellow/10 text-terminal-yellow border border-terminal-yellow/20"
                  : "bg-terminal-green/10 text-terminal-green border border-terminal-green/20"
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
            disabled={isBusy}
            className="text-terminal-dim hover:text-terminal-text transition-colors disabled:opacity-30"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <AnimatePresence mode="wait">
          {sendStatus === "success" ? (
            <motion.div
              key="success"
              className="p-6 flex flex-col items-center gap-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CheckCircle2 size={40} className="text-terminal-green" />
              <div className="text-center">
                <p className="font-mono font-bold text-terminal-green text-sm tracking-wide mb-1">
                  SENT SUCCESSFULLY
                </p>
                <p className="font-mono text-xs text-terminal-dim">
                  {fmtBal(sendResult?.amount)} {selectedToken.symbol} sent
                </p>
              </div>
              <div className="w-full bg-terminal-surface border border-terminal-border rounded-xl px-4 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-terminal-dim">To</span>
                  <span className="font-mono text-xs text-terminal-text truncate max-w-[160px]">
                    {sendResult?.recipient?.slice(0, 8)}…{sendResult?.recipient?.slice(-6)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-terminal-dim">Tx</span>
                  <a
                    href={sendResult?.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 font-mono text-xs text-terminal-accent hover:underline"
                  >
                    {sendResult?.signature?.slice(0, 8)}…
                    <ExternalLink size={10} />
                  </a>
                </div>
              </div>
              {!isDevnet && (
                <div className="flex items-center gap-1.5 py-2 px-4 rounded-lg bg-terminal-accent/5 border border-terminal-accent/20 w-full justify-center">
                  <Shield size={12} className="text-terminal-accent" />
                  <span className="font-mono text-xs text-terminal-accent tracking-wider">
                    Protected by DFlow RPC
                  </span>
                </div>
              )}
              <button
                onClick={handleReset}
                className="w-full py-3 rounded-xl font-mono font-bold text-sm bg-terminal-surface border border-terminal-border text-terminal-text hover:border-terminal-accent/50 hover:text-terminal-accent transition-all duration-200 mt-1"
              >
                Send Again
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              className="p-5 space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Token selector */}
              <div>
                <label className="font-mono text-xs text-terminal-dim mb-1.5 block tracking-wider">
                  TOKEN
                </label>
                <div className="relative">
                  <button
                    onClick={() => setTokenPickerOpen((v) => !v)}
                    disabled={isBusy}
                    className="w-full flex items-center gap-3 bg-terminal-surface border border-terminal-border rounded-xl px-4 py-3 hover:border-terminal-accent/40 transition-colors disabled:opacity-50"
                  >
                    {selectedToken.logo && (
                      <img
                        src={selectedToken.logo}
                        alt={selectedToken.symbol}
                        className="w-6 h-6 rounded-full shrink-0"
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    )}
                    <div className="flex-1 text-left">
                      <div className="font-mono font-bold text-sm text-terminal-text">
                        {selectedToken.symbol}
                      </div>
                      <div className="font-mono text-xs text-terminal-dim">
                        {selectedToken.name}
                      </div>
                    </div>
                    <div className="text-right mr-1">
                      {balLoading ? (
                        <span className="font-mono text-xs text-terminal-dim">···</span>
                      ) : balance != null ? (
                        <span className="font-mono text-xs text-terminal-dim">
                          {fmtBal(balance)} available
                        </span>
                      ) : null}
                    </div>
                    <ChevronDown
                      size={14}
                      className={`text-terminal-dim transition-transform shrink-0 ${tokenPickerOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {/* Token dropdown */}
                  <AnimatePresence>
                    {tokenPickerOpen && (
                      <motion.div
                        className="absolute z-10 top-full left-0 right-0 mt-1 bg-terminal-card border border-terminal-border rounded-xl shadow-2xl overflow-hidden"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                      >
                        <div className="p-2 border-b border-terminal-border">
                          <input
                            autoFocus
                            value={tokenSearch}
                            onChange={(e) => setTokenSearch(e.target.value)}
                            placeholder="Search token..."
                            className="w-full bg-terminal-surface border border-terminal-border rounded-lg px-3 py-2 font-mono text-xs text-terminal-text placeholder:text-terminal-dim/50 outline-none focus:border-terminal-accent/40"
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {filteredTokens.map((token) => (
                            <button
                              key={token.mint}
                              onClick={() => {
                                setSelectedToken(token);
                                setTokenPickerOpen(false);
                                setTokenSearch("");
                                setAmount("");
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-terminal-surface transition-colors ${
                                token.mint === selectedToken.mint ? "bg-terminal-accent/5" : ""
                              }`}
                            >
                              {token.logo && (
                                <img
                                  src={token.logo}
                                  alt={token.symbol}
                                  className="w-5 h-5 rounded-full shrink-0"
                                  onError={(e) => { e.target.style.display = "none"; }}
                                />
                              )}
                              <div className="text-left flex-1">
                                <div className="font-mono text-xs font-bold text-terminal-text">
                                  {token.symbol}
                                </div>
                                <div className="font-mono text-xs text-terminal-dim/70">
                                  {token.name}
                                </div>
                              </div>
                              {token.mint === selectedToken.mint && (
                                <span className="w-1.5 h-1.5 rounded-full bg-terminal-accent" />
                              )}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Amount */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-mono text-xs text-terminal-dim tracking-wider">
                    AMOUNT
                  </label>
                  {balance != null && !balLoading && (
                    <button
                      onClick={handleMax}
                      disabled={isBusy}
                      className="font-mono text-xs text-terminal-accent hover:text-terminal-accent/80 transition-colors disabled:opacity-40"
                    >
                      MAX
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={isBusy}
                    placeholder="0.00"
                    className="w-full bg-terminal-surface border border-terminal-border rounded-xl px-4 py-3 pr-16 font-mono text-sm text-terminal-text placeholder:text-terminal-dim/40 outline-none focus:border-terminal-accent/40 transition-colors disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs text-terminal-dim font-semibold">
                    {selectedToken.symbol}
                  </span>
                </div>
                {amount && balance != null && amountNum > balance && (
                  <p className="font-mono text-xs text-terminal-red mt-1">
                    Exceeds available balance
                  </p>
                )}
              </div>

              {/* Recipient */}
              <div>
                <label className="font-mono text-xs text-terminal-dim mb-1.5 block tracking-wider">
                  RECIPIENT ADDRESS
                </label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value.trim())}
                  disabled={isBusy}
                  placeholder="Solana wallet address"
                  className={`w-full bg-terminal-surface border rounded-xl px-4 py-3 font-mono text-xs text-terminal-text placeholder:text-terminal-dim/40 outline-none transition-colors disabled:opacity-50 ${
                    recipient.length > 0
                      ? recipientValid
                        ? "border-terminal-green/40 focus:border-terminal-green/60"
                        : "border-terminal-red/40 focus:border-terminal-red/60"
                      : "border-terminal-border focus:border-terminal-accent/40"
                  }`}
                />
                {recipient.length > 0 && !recipientValid && (
                  <p className="font-mono text-xs text-terminal-red mt-1">
                    Invalid Solana address
                  </p>
                )}
              </div>

              {/* Error */}
              {sendError && (
                <div className="flex items-start gap-2 bg-terminal-red/10 border border-terminal-red/20 rounded-xl px-4 py-3">
                  <AlertCircle size={13} className="text-terminal-red shrink-0 mt-0.5" />
                  <p className="font-mono text-xs text-terminal-red leading-relaxed">
                    {sendError}
                  </p>
                </div>
              )}

              {/* MEV protection note */}
              {!isDevnet && (
                <div className="flex items-center gap-1.5 py-2 px-4 rounded-lg bg-terminal-accent/5 border border-terminal-accent/20">
                  <Shield size={11} className="text-terminal-accent shrink-0" />
                  <span className="font-mono text-xs text-terminal-accent/80 tracking-wide">
                    Sent via DFlow-protected RPC on mainnet
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer send button */}
        {sendStatus !== "success" && (
          <div className="px-5 pb-5 shrink-0">
            <button
              onClick={handleSend}
              disabled={!canSend || isBusy}
              className="w-full py-3 rounded-xl font-mono font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed bg-terminal-accent/10 border border-terminal-accent/30 text-terminal-accent hover:bg-terminal-accent/20 hover:border-terminal-accent/50 disabled:hover:bg-terminal-accent/10 disabled:hover:border-terminal-accent/30"
            >
              {isBusy ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  {sendStatus === "signing" ? "Waiting for wallet…" : "Confirming…"}
                </>
              ) : (
                <>
                  <Send size={14} />
                  Send {amount && selectedToken ? `${amount} ${selectedToken.symbol}` : ""}
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
