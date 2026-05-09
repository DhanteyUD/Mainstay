import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import { ChevronDown, Search, X } from "lucide-react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { TOKEN_LIST, DIALECT_PROXY } from "../config";
import { isMobile } from "../lib/device";
import type { Token } from "../types";

const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
);
const SOL_MINT = "So11111111111111111111111111111111111111112";

const STABLE_PRICES: Record<string, number> = {
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: 1.0,
  Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: 1.0,
};

function fmtBal(amount: number | null): string {
  if (amount == null || amount === 0) return "0";
  if (amount >= 1_000_000) return (amount / 1_000_000).toFixed(2) + "M";
  if (amount >= 1000)
    return amount.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (amount >= 1) return amount.toFixed(4);
  if (amount >= 0.0001) return amount.toFixed(6);
  return amount.toExponential(3);
}

function fmtUsdc(usdValue: number | null): string {
  if (usdValue == null || usdValue === 0) return "$0.00";
  if (usdValue >= 1_000_000)
    return "$" + (usdValue / 1_000_000).toFixed(2) + "M";
  if (usdValue >= 1000)
    return "$" + usdValue.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (usdValue >= 1) return "$" + usdValue.toFixed(2);
  if (usdValue >= 0.01) return "$" + usdValue.toFixed(4);
  return "$" + usdValue.toExponential(3);
}

interface PanelPos {
  top: number;
  left: number;
  width?: number;
}

interface TokenSelectorProps {
  selected: Token | null;
  onChange: (token: Token) => void;
  exclude?: Token | null;
}

export default function TokenSelector({
  selected,
  onChange,
  exclude,
}: TokenSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [panelPos, setPanelPos] = useState<PanelPos>({ top: 0, left: 0 });
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [balsLoading, setBalsLoading] = useState(false);
  const [pricesLoading, setPricesLoading] = useState(false);

  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  const filtered = TOKEN_LIST.filter(
    (t) =>
      t.mint !== exclude?.mint &&
      (t.symbol.toLowerCase().includes(search.toLowerCase()) ||
        t.name.toLowerCase().includes(search.toLowerCase())),
  );

  useEffect(() => {
    if (!open) return;

    setPrices(STABLE_PRICES);
    setPricesLoading(true);
    const nonStable = TOKEN_LIST.filter((t) => !STABLE_PRICES[t.mint]);
    const ids = nonStable.map((t) => t.mint).join(",");

    async function fetchPrices() {
      const next: Record<string, number> = { ...STABLE_PRICES };

      try {
        const res = await fetch(
          `${DIALECT_PROXY}/api.jup.ag/price/v3?ids=${ids}`,
        );
        if (res.ok) {
          const data = await res.json();
          for (const token of nonStable) {
            const price = data[token.mint]?.usdPrice ?? null;
            if (price != null) next[token.mint] = price;
          }
        }
      } catch {
        /* silent */
      }

      if (next[SOL_MINT] == null) {
        try {
          const res = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
          );
          if (res.ok) {
            const data = await res.json();
            const price = data?.solana?.usd;
            if (price != null) next[SOL_MINT] = price;
          }
        } catch {
          /* silent */
        }
      }

      if (next[SOL_MINT] == null) {
        try {
          const res = await fetch(
            "https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT",
          );
          if (res.ok) {
            const data = await res.json();
            const price = parseFloat(data?.price);
            if (!isNaN(price)) next[SOL_MINT] = price;
          }
        } catch {
          /* silent */
        }
      }

      setPrices(next);
      setPricesLoading(false);
    }

    fetchPrices();

    if (!publicKey || !connected) return;
    setBalsLoading(true);

    async function fetchBals() {
      const result: Record<string, number> = {};
      try {
        const lamports = await connection.getBalance(publicKey!, "confirmed");
        result[SOL_MINT] = lamports / 1e9;
      } catch {
        /* silent */
      }

      try {
        const accounts = await connection.getParsedTokenAccountsByOwner(
          publicKey!,
          { programId: TOKEN_PROGRAM_ID },
        );
        const mintSet = new Set(TOKEN_LIST.map((t) => t.mint));
        for (const { account } of accounts.value) {
          const info = account.data.parsed?.info;
          if (!info) continue;
          const { mint, tokenAmount } = info;
          if (mintSet.has(mint))
            result[mint] = parseFloat(tokenAmount.uiAmount || 0);
        }
      } catch {
        /* silent */
      }

      setBalances(result);
      setBalsLoading(false);
    }

    fetchBals();
  }, [open, publicKey, connected, connection]);

  const isTouchDevice = useCallback(
    () => "ontouchstart" in window || navigator.maxTouchPoints > 0,
    [],
  );

  const calcPosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const PANEL_W = Math.min(360, vw - 16);
    const PANEL_H_APPROX = 380;

    let top = rect.bottom + 8;
    if (top + PANEL_H_APPROX > vh - 8 && rect.top - PANEL_H_APPROX - 8 > 0) {
      top = rect.top - PANEL_H_APPROX - 8;
    }
    let left = rect.right - PANEL_W;
    if (left < 8) left = 8;
    if (left + PANEL_W > vw - 8) left = vw - 8 - PANEL_W;
    setPanelPos({ top, left, width: PANEL_W });
  }, []);

  useEffect(() => {
    if (open) {
      if (!isMobile) calcPosition();
      if (!isTouchDevice()) setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open, calcPosition, isTouchDevice]);

  useEffect(() => {
    if (!isMobile) return;
    if (open) {
      const scrollY = window.scrollY;
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
    } else {
      const top = document.body.style.top;
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      if (top) window.scrollTo(0, -parseInt(top, 10));
    }
    return () => {
      const top = document.body.style.top;
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      if (top) window.scrollTo(0, -parseInt(top, 10));
    };
  }, [open]);

  useEffect(() => {
    if (!open || isMobile) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch("");
      }
    };
    const openWidth = window.innerWidth;
    const handleResize = () => {
      if (window.innerWidth !== openWidth) {
        setOpen(false);
        setSearch("");
      }
    };
    const handleScroll = (e: Event) => {
      if (panelRef.current && panelRef.current.contains(e.target as Node))
        return;
      setOpen(false);
      setSearch("");
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside as EventListener, {
      passive: true,
    });
    window.addEventListener("resize", handleResize);
    const scrollTimer = setTimeout(
      () => window.addEventListener("scroll", handleScroll, true),
      350,
    );
    return () => {
      clearTimeout(scrollTimer);
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener(
        "touchstart",
        handleOutside as EventListener,
      );
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open]);

  const handleSelect = (token: Token) => {
    onChange(token);
    setOpen(false);
    setSearch("");
  };

  const close = useCallback(() => {
    setOpen(false);
    setSearch("");
  }, []);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setSearch(text.trim());
    } catch {
      /* silent */
    }
  }, []);

  function renderBalanceCol(token: Token, compact = false) {
    const bal = balances[token.mint] ?? null;
    const price = prices[token.mint] ?? null;
    const hasWallet = connected && publicKey;

    if (!hasWallet) return null;

    if (balsLoading && bal == null) {
      return (
        <div
          className={`flex flex-col items-end gap-1 ${compact ? "min-w-[64px]" : "min-w-[72px]"}`}
        >
          <div className="w-14 h-3.5 rounded bg-terminal-border animate-pulse" />
          <div className="w-16 h-3 rounded bg-terminal-border/50 animate-pulse" />
        </div>
      );
    }

    if (bal == null) return null;

    const usdVal = price != null ? bal * price : null;

    return (
      <div
        className={`text-right shrink-0 ${compact ? "min-w-[64px]" : "min-w-[72px]"}`}
      >
        {usdVal != null && (
          <div
            className={`font-mono text-terminal-dim mb-0.5 ${compact ? "text-[10px]" : "text-xs"}`}
          >
            ≈ {fmtUsdc(usdVal)}
          </div>
        )}
        <div
          className={`font-mono font-semibold leading-tight ${compact ? "text-xs" : "text-sm"} text-terminal-text`}
        >
          {fmtBal(bal)}{" "}
          <span className="text-terminal-dim font-normal">{token.symbol}</span>
        </div>
      </div>
    );
  }

  function renderMobileTokenInfo(token: Token) {
    const hasWallet = connected && publicKey;
    const bal = hasWallet ? (balances[token.mint] ?? null) : null;
    const price = hasWallet ? (prices[token.mint] ?? null) : null;
    const isLoading = hasWallet && balsLoading && bal == null;
    const usdVal = bal != null && price != null ? bal * price : null;
    const isUsdLoading =
      hasWallet && (balsLoading || pricesLoading) && usdVal == null;

    return (
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <span
            className={`font-mono font-bold text-base leading-tight ${selected?.mint === token.mint ? "text-terminal-accent" : "text-terminal-text"}`}
          >
            {token.name}
          </span>
          {isUsdLoading ? (
            <div className="w-14 h-3.5 rounded bg-terminal-border animate-pulse shrink-0" />
          ) : usdVal != null ? (
            <span className="font-mono text-sm font-semibold text-terminal-text shrink-0">
              $
              {usdVal.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          ) : null}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs text-terminal-dim truncate">
            {token.symbol}
          </span>
          {isLoading ? (
            <div className="w-12 h-3 rounded bg-terminal-border/50 animate-pulse shrink-0" />
          ) : bal != null ? (
            <span className="font-mono text-xs text-terminal-dim shrink-0">
              {fmtBal(bal)} {token.symbol}
            </span>
          ) : null}
        </div>
      </div>
    );
  }

  function renderDesktopTokenInfo(token: Token) {
    const hasWallet = connected && publicKey;
    const bal = hasWallet ? (balances[token.mint] ?? null) : null;
    const price = hasWallet ? (prices[token.mint] ?? null) : null;
    const isLoading = hasWallet && balsLoading && bal == null;
    const usdVal = bal != null && price != null ? bal * price : null;
    const isUsdLoading =
      hasWallet && (balsLoading || pricesLoading) && usdVal == null;

    return (
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <span
            className={`font-mono font-semibold text-sm leading-tight ${selected?.mint === token.mint ? "text-terminal-accent" : "text-terminal-text"}`}
          >
            {token.name}
          </span>
          {isUsdLoading ? (
            <div className="w-10 h-3 rounded bg-terminal-border animate-pulse shrink-0" />
          ) : usdVal != null ? (
            <span className="font-mono text-xs font-semibold text-terminal-text shrink-0">
              {fmtUsdc(usdVal)}
            </span>
          ) : null}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[11px] text-terminal-dim truncate">
            {token.symbol}
          </span>
          {isLoading ? (
            <div className="w-10 h-2.5 rounded bg-terminal-border/50 animate-pulse shrink-0" />
          ) : bal != null ? (
            <span className="font-mono text-[11px] text-terminal-dim shrink-0">
              {fmtBal(bal)} {token.symbol}
            </span>
          ) : null}
        </div>
      </div>
    );
  }

  function renderMobileSheet() {
    return (
      <>
        <motion.div
          className="fixed inset-0 z-[998] bg-black/60"
          style={{ backdropFilter: "blur(4px)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onTouchEnd={(e) => {
            e.preventDefault();
            close();
          }}
        />

        <motion.div
          drag="y"
          dragControls={dragControls}
          dragListener={false}
          dragConstraints={{ top: 0 }}
          dragElastic={{ top: 0.04, bottom: 0.45 }}
          onDragEnd={(_, info) => {
            if (info.offset.y > 110 || info.velocity.y > 450) close();
          }}
          className="fixed bottom-0 left-0 right-0 z-[999] bg-terminal-card border-t border-terminal-border rounded-t-2xl flex flex-col"
          style={{ height: "90vh" }}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 32, stiffness: 310 }}
        >
          <div
            className="pt-3 pb-2 flex justify-center shrink-0"
            style={{ touchAction: "none" }}
            onPointerDown={(e) => dragControls.start(e)}
          >
            <div className="w-16 h-1 rounded-full bg-terminal-dim/30" />
          </div>

          <div className="px-4 pb-3 border-b border-terminal-border shrink-0">
            <p className="font-mono text-xs text-terminal-dim tracking-widest text-center mb-3">
              SELECT TOKEN
            </p>
            <div className="flex items-center gap-2 bg-terminal-surface rounded-xl px-3 py-2.5 border border-terminal-border focus-within:border-terminal-accent/50 transition-colors">
              <Search size={14} className="text-terminal-dim shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search tokens..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent outline-none text-terminal-text text-sm font-mono w-full placeholder-terminal-dim/50"
              />
              <AnimatePresence mode="wait">
                {search ? (
                  <motion.button
                    key="clear"
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      setSearch("");
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSearch("");
                    }}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={{ duration: 0.1 }}
                  >
                    <X size={14} className="text-terminal-dim" />
                  </motion.button>
                ) : (
                  <motion.button
                    key="paste"
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      handlePaste();
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handlePaste();
                    }}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={{ duration: 0.1 }}
                    title="Paste"
                  >
                    <span className="text-xs px-2 py-0.5 bg-terminal-border rounded">
                      Paste
                    </span>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div
            className="flex-1 overflow-y-auto py-1"
            style={{ touchAction: "pan-y" }}
          >
            {filtered.length === 0 ? (
              <div className="px-4 py-10 text-center text-terminal-dim text-sm font-mono">
                No tokens found
              </div>
            ) : (
              filtered.map((token, i) => (
                <motion.button
                  key={token.mint}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    handleSelect(token);
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(token);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-terminal-surface/70 ${
                    selected?.mint === token.mint ? "bg-terminal-accent/10" : ""
                  }`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.025, 0.15) }}
                >
                  <img
                    src={token.logo}
                    alt={token.symbol}
                    className="w-10 h-10 rounded-full shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  {renderMobileTokenInfo(token)}
                  {selected?.mint === token.mint && (
                    <motion.div
                      className="w-2 h-2 rounded-full bg-terminal-accent shrink-0 ml-1"
                      layoutId="selected-dot-mobile"
                    />
                  )}
                </motion.button>
              ))
            )}
            <div style={{ height: "env(safe-area-inset-bottom, 20px)" }} />
          </div>
        </motion.div>
      </>
    );
  }

  function renderDesktopPanel() {
    return (
      <>
        <motion.div
          className="fixed inset-0 z-[998] bg-black/40"
          style={{ backdropFilter: "blur(1px)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onMouseDown={(e) => {
            e.preventDefault();
            close();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            close();
          }}
        />

        <motion.div
          ref={panelRef}
          className="fixed z-[999] bg-terminal-card border border-terminal-border rounded-xl shadow-2xl overflow-hidden flex flex-col"
          style={{
            top: panelPos.top,
            left: panelPos.left,
            width: panelPos.width || 280,
          }}
          initial={{ opacity: 0, scale: 0.95, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -8 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          <div className="px-3 pt-3 pb-2 border-b border-terminal-border">
            <div className="font-mono text-xs text-terminal-dim tracking-widest mb-2">
              SELECT TOKEN
            </div>
            <div className="flex items-center gap-2 bg-terminal-surface rounded-lg px-3 py-2 border border-terminal-border focus-within:border-terminal-accent/50 transition-colors">
              <Search size={13} className="text-terminal-dim shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search tokens..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent outline-none text-terminal-text text-xs font-mono w-full placeholder-terminal-dim/60"
              />
              <AnimatePresence mode="wait">
                {search ? (
                  <motion.button
                    key="clear"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSearch("");
                    }}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={{ duration: 0.1 }}
                  >
                    <X
                      size={12}
                      className="text-terminal-dim hover:text-terminal-text"
                    />
                  </motion.button>
                ) : (
                  <motion.button
                    key="paste"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handlePaste();
                    }}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={{ duration: 0.1 }}
                    title="Paste"
                  >
                    <span className="text-xs px-2 py-0.5 bg-terminal-border rounded">
                      Paste
                    </span>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-terminal-dim text-xs font-mono">
                No tokens found
              </div>
            ) : (
              filtered.map((token, i) => (
                <motion.button
                  key={token.mint}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(token);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-terminal-surface transition-colors ${
                    selected?.mint === token.mint
                      ? "bg-terminal-accent/10 text-terminal-accent"
                      : "text-terminal-text"
                  }`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <img
                    src={token.logo}
                    alt={token.symbol}
                    className="w-7 h-7 rounded-full shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  {renderDesktopTokenInfo(token)}
                  {selected?.mint === token.mint && (
                    <motion.div
                      className="w-1.5 h-1.5 rounded-full bg-terminal-accent"
                      layoutId="selected-dot"
                    />
                  )}
                </motion.button>
              ))
            )}
          </div>
        </motion.div>
      </>
    );
  }

  const portal = ReactDOM.createPortal(
    <AnimatePresence>
      {open && (isMobile ? renderMobileSheet() : renderDesktopPanel())}
    </AnimatePresence>,
    document.body,
  );

  return (
    <>
      <motion.button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg bg-terminal-surface border border-terminal-border hover:border-terminal-accent/50 transition-colors duration-200 group min-w-[100px] sm:min-w-[120px]"
        whileTap={{ scale: 0.97 }}
      >
        {selected ? (
          <>
            <img
              src={selected.logo}
              alt={selected.symbol}
              className="w-6 h-6 rounded-full"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <span className="font-mono font-semibold text-terminal-text text-sm">
              {selected.symbol}
            </span>
          </>
        ) : (
          <span className="text-terminal-dim text-sm font-mono">Select</span>
        )}
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="ml-auto"
        >
          <ChevronDown size={14} className="text-terminal-dim" />
        </motion.div>
      </motion.button>
      {portal}
    </>
  );
}
