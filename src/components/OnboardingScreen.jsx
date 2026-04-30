import React, { useState, useRef, useEffect } from "react";
import {
  Shield,
  ArrowRight,
  Zap,
  ChevronRight,
  Bot,
  User,
  ChevronDown,
  MoveUp,
  MoveDown,
  Coins,
  Lock,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "../assets/mainstay-logo.png";

const STORAGE_KEY = "mev_shield_onboarding_v1";

export function useOnboarding() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      /* silent */
    }
    setDismissed(true);
  };

  return { dismissed, dismiss };
}

const stepVariants = {
  enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
  exit: (dir) => ({
    x: dir > 0 ? -60 : 60,
    opacity: 0,
    transition: { duration: 0.2, ease: "easeIn" },
  }),
};

export default function OnboardingScreen({ onDismiss }) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const next = () => {
    if (step < 2) {
      setDirection(1);
      setStep((s) => s + 1);
    } else {
      onDismiss();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-terminal-bg z-50 flex flex-col items-center justify-center p-4 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,229,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Glow */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none animate-pulse-glow"
        style={{
          background:
            "radial-gradient(ellipse at center top, rgba(0,229,255,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-lg px-1">
        {/* Logo */}
        <motion.div
          className="flex items-center justify-center mb-4 md:mb-6 lg:mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="relative">
            <img src={logo} alt="Mainstay Logo" className="w-10 h-10" />
          </div>
          <span className="font-mono font-bold text-xl text-terminal-text tracking-wider">
            Main<span className="text-terminal-accent">stay</span>
          </span>
        </motion.div>

        {/* Step indicator */}
        <motion.div
          className="flex items-center justify-center gap-2 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-1.5 rounded-full"
              animate={{
                width: i === step ? 24 : 8,
                background:
                  i === step
                    ? "#00e5ff"
                    : i < step
                      ? "rgba(0,229,255,0.4)"
                      : "rgba(255,255,255,0.1)",
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </motion.div>

        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              {/* Step 0 — What is MEV */}
              {step === 0 && (
                <div className="bg-terminal-card border border-terminal-border rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-6 md:w-8 h-6 md:h-8 rounded-full bg-terminal-accent/10 border border-terminal-accent/30 flex items-center justify-center">
                      <span className="font-mono font-black text-sm text-terminal-accent">
                        ?
                      </span>
                    </div>
                    <h2 className="font-mono font-bold text-terminal-text text-sm md:text-lg tracking-wide">
                      What is MEV?
                    </h2>
                  </div>

                  <p className="font-mono text-xs md:text-sm text-terminal-dim leading-relaxed mb-4">
                    <span className="text-terminal-text font-semibold">
                      Maximal Extractable Value (MEV)
                    </span>{" "}
                    is profit extracted by bots that reorder, insert, or censor
                    transactions before yours is confirmed — effectively taxing
                    every trade you make.
                  </p>
                  <p className="font-mono text-xs md:text-sm text-terminal-dim leading-relaxed">
                    On Solana, MEV bots monitor the mempool in real time and can
                    steal value from your swap before it even lands on-chain —
                    often costing retail traders{" "}
                    <span className="text-terminal-red font-semibold">
                      0.1%–1%
                    </span>{" "}
                    per transaction.
                  </p>

                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                    {[
                      {
                        label: "Front-running",
                        desc: "Bot copies your trade and executes first",
                      },
                      {
                        label: "Sandwiching",
                        desc: "Bot buys before and sells after your swap",
                      },
                      {
                        label: "Back-running",
                        desc: "Bot exploits the price you moved",
                      },
                    ].map(({ label, desc }, i) => (
                      <motion.div
                        key={label}
                        className="rounded-lg border border-terminal-red/20 bg-terminal-red/5 p-3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.08 }}
                      >
                        <div className="font-mono text-xs font-bold text-terminal-red mb-1">
                          {label}
                        </div>
                        <div className="font-mono text-xs text-terminal-dim leading-snug">
                          {desc}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 1 — Sandwich attack diagram */}
              {step === 1 && (
                <div className="bg-terminal-card border border-terminal-border rounded-2xl py-6 pl-6 pr-3">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-6 md:w-8 h-6 md:h-8 rounded-full bg-terminal-red/10 border border-terminal-red/30 flex items-center justify-center">
                      <div className="text-[10px] md:text-sm h-4">🥪</div>
                    </div>
                    <h2 className="font-mono font-bold text-terminal-text text-sm md:text-lg tracking-wide">
                      How a Sandwich Attack Works
                    </h2>
                  </div>

                  <ScrollableContent>
                    <p className="font-mono text-xs md:text-sm text-terminal-dim leading-relaxed mb-5">
                      A sandwich attack wraps your swap between two bot
                      transactions, forcing you to buy at a worse price while
                      the attacker pockets the difference.
                    </p>

                    <div className="space-y-2">
                      {[
                        {
                          number: "1",
                          user: <Bot size={12} />,
                          actor: "attacker",
                          actorLabel: "BOT",
                          color: "#ff4444",
                          action: "Front-run buy",
                          detail:
                            "Bot detects your pending swap, buys the token first at the current price, pushing the price UP.",
                          icon: <MoveUp size={12} strokeWidth={3} />,
                          priceLabel: "Price: $1.00 → $1.03",
                        },
                        {
                          number: "2",
                          user: <User size={12} />,
                          actor: "victim",
                          actorLabel: "YOU",
                          color: "#00e5ff",
                          action: "Your swap executes",
                          detail:
                            "Your transaction lands at the inflated price — you pay more than expected.",
                          icon: <Coins size={12} />,
                          priceLabel: "You pay: $1.03 (not $1.00)",
                        },
                        {
                          number: "3",
                          user: <Bot size={12} />,
                          actor: "attacker",
                          actorLabel: "BOT",
                          color: "#ff4444",
                          action: "Back-run sell",
                          detail:
                            "Bot immediately sells at the now-higher price, locking in risk-free profit.",
                          icon: <MoveDown size={12} strokeWidth={3} />,
                          priceLabel: "Bot profit: ~$0.03 per token",
                        },
                      ].map((s, i) => (
                        <React.Fragment key={s.number}>
                          <motion.div
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                          >
                            <SandwichStep {...s} />
                          </motion.div>
                          {i < 2 && (
                            <div className="flex items-center justify-center py-0.5">
                              <div className="flex flex-col items-center">
                                <div className="w-px h-3 bg-terminal-border" />
                                <ChevronDown
                                  size={14}
                                  className="text-terminal-dim"
                                />
                              </div>
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>

                    <div className="mt-4 rounded-lg border border-terminal-yellow/20 bg-terminal-yellow/5 px-3 py-2">
                      <p className="font-mono text-xs text-terminal-yellow">
                        ⚠ This happens in milliseconds, entirely automated, and
                        is nearly impossible to avoid on public mempools —{" "}
                        <span className="font-semibold">
                          without MEV protection.
                        </span>
                      </p>
                    </div>
                  </ScrollableContent>
                </div>
              )}

              {/* Step 2 — DFlow protection */}
              {step === 2 && (
                <div className="bg-terminal-card border border-terminal-border rounded-2xl py-6 pl-6 pr-3">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-6 md:w-8 h-6 md:h-8 rounded-full bg-terminal-green/10 border border-terminal-green/30 flex items-center justify-center">
                      <Shield size={15} className="hidden sm:flex text-terminal-green" />
                      <Shield size={11} className="flex sm:hidden text-terminal-green" />
                    </div>
                    <h2 className="font-mono font-bold text-terminal-text text-sm md:text-lg tracking-wide">
                      How DFlow Protects You
                    </h2>
                  </div>

                  <ScrollableContent>
                    <p className="font-mono text-xs md:text-sm text-terminal-dim leading-relaxed mb-5">
                      Mainstay routes every swap through{" "}
                      <span className="text-terminal-accent font-semibold">
                        DFlow's order flow auction
                      </span>{" "}
                      — a private network where professional market makers
                      compete to fill your order at the best possible price,
                      completely bypassing the public mempool.
                    </p>

                    <div className="space-y-3 mb-5">
                      {[
                        {
                          icon: <Lock size={16} />,
                          title: "Private order routing",
                          desc: "Your order never touches the public mempool — bots cannot see or front-run it.",
                        },
                        {
                          icon: <Zap size={16} />,
                          title: "JIT auction (Just-In-Time)",
                          desc: "Market makers compete in a sealed-bid auction to fill your order at the best price.",
                        },
                        {
                          icon: <Check size={16} strokeWidth={4} />,
                          title: "Guaranteed execution",
                          desc: "Winning market maker executes at the agreed price — no bait-and-switch.",
                        },
                      ].map(({ icon, title, desc }, i) => (
                        <motion.div
                          key={title}
                          className="flex gap-3 items-start"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                        >
                          <div className="w-8 h-8 rounded-lg bg-terminal-green/10 border border-terminal-green/20 flex items-center justify-center text-base shrink-0">
                            {icon}
                          </div>
                          <div>
                            <div className="font-mono text-xs font-bold text-terminal-text mb-0.5">
                              {title}
                            </div>
                            <div className="font-mono text-xs text-terminal-dim leading-snug">
                              {desc}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="rounded-lg border border-terminal-red/20 bg-terminal-red/5 p-3">
                        <div className="font-mono text-xs font-bold text-terminal-red mb-2">
                          Without protection
                        </div>
                        <div className="space-y-1">
                          {[
                            "Visible in mempool",
                            "Bots front-run",
                            "Worse fill price",
                            "~0.5% MEV tax",
                          ].map((t) => (
                            <div key={t} className="flex items-center gap-1.5">
                              <span className="text-terminal-red text-xs">
                                ✗
                              </span>
                              <span className="font-mono text-xs text-terminal-dim">
                                {t}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-lg border border-terminal-green/20 bg-terminal-green/5 p-3">
                        <div className="font-mono text-xs font-bold text-terminal-green mb-2">
                          Mainstay
                        </div>
                        <div className="space-y-1">
                          {[
                            "Private routing",
                            "Bots blocked",
                            "Best fill price",
                            "MEV saved",
                          ].map((t) => (
                            <div key={t} className="flex items-center gap-1.5">
                              <span className="text-terminal-green text-xs">
                                ✓
                              </span>
                              <span className="font-mono text-xs text-terminal-dim">
                                {t}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </ScrollableContent>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* CTA button */}
        <motion.button
          onClick={next}
          className="mt-5 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-mono font-bold text-sm bg-terminal-accent/10 border border-terminal-accent/40 text-terminal-accent hover:bg-terminal-accent/20 transition-all duration-200 group"
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {step < 2 ? (
            <>
              <span>Next</span>
              <ArrowRight
                size={14}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </>
          ) : (
            <>
              <Zap size={14} />
              <span>Got it, start trading</span>
            </>
          )}
        </motion.button>

        {/* Skip link */}
        <AnimatePresence>
          {step < 2 && (
            <motion.button
              onClick={onDismiss}
              className="mt-3 w-full text-center font-mono text-xs text-terminal-dim/50 hover:text-terminal-dim transition-colors"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              Skip intro
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function ScrollableContent({ children }) {
  const scrollRef = useRef(null);
  const trackRef = useRef(null);
  const [thumb, setThumb] = useState({ height: 100, top: 0 });

  const computeThumb = () => {
    const el = scrollRef.current;
    if (!el) return;
    const ratio = el.clientHeight / el.scrollHeight;
    const h = Math.max(ratio * 100, 12);
    const pct =
      el.scrollHeight > el.clientHeight
        ? el.scrollTop / (el.scrollHeight - el.clientHeight)
        : 0;
    setThumb({ height: h, top: pct * (100 - h) });
  };

  useEffect(() => {
    const t = setTimeout(computeThumb, 40);
    return () => clearTimeout(t);
  }, []);

  const handleTrackClick = (e) => {
    const track = trackRef.current;
    const el = scrollRef.current;
    if (!track || !el) return;
    const rect = track.getBoundingClientRect();
    el.scrollTop =
      ((e.clientY - rect.top) / rect.height) *
      (el.scrollHeight - el.clientHeight);
  };

  const beginDrag = (startY, getY) => {
    const el = scrollRef.current;
    const track = trackRef.current;
    if (!el || !track) return () => {};
    const startTop = el.scrollTop;
    const trackH = track.clientHeight;
    return (y) => {
      el.scrollTop = startTop + ((y - startY) / trackH) * el.scrollHeight;
    };
  };

  const handleThumbMouseDown = (e) => {
    e.preventDefault();
    const onMove = beginDrag(e.clientY, (ev) => ev.clientY);
    const handler = (ev) => onMove(ev.clientY);
    const cleanup = () => {
      window.removeEventListener("mousemove", handler);
      window.removeEventListener("mouseup", cleanup);
    };
    window.addEventListener("mousemove", handler);
    window.addEventListener("mouseup", cleanup);
  };

  const handleThumbTouchStart = (e) => {
    const onMove = beginDrag(e.touches[0].clientY, (ev) => ev.clientY);
    const handler = (ev) => onMove(ev.touches[0].clientY);
    const cleanup = () => {
      window.removeEventListener("touchmove", handler);
      window.removeEventListener("touchend", cleanup);
    };
    window.addEventListener("touchmove", handler, { passive: true });
    window.addEventListener("touchend", cleanup);
  };

  const showTrack = thumb.height < 95;

  return (
    <div className="flex gap-3">
      <div
        ref={scrollRef}
        className="no-scrollbar flex-1 overflow-y-auto max-h-[465px] md:max-h-[307px]"
        onScroll={computeThumb}
      >
        {children}
      </div>

      <div
        ref={trackRef}
        className="w-1 rounded-full bg-terminal-border/25 relative flex-shrink-0 cursor-pointer"
        style={{ opacity: showTrack ? 1 : 0.15 }}
        onClick={handleTrackClick}
      >
        <motion.div
          className="w-full bg-terminal-muted/20 hover:bg-terminal-muted/80 rounded-full absolute left-0 cursor-grab active:cursor-grabbing"
          style={{ height: `${thumb.height}%`, top: `${thumb.top}%` }}
          onMouseDown={handleThumbMouseDown}
          onTouchStart={handleThumbTouchStart}
          transition={{ duration: 0.08 }}
        />
      </div>
    </div>
  );
}

function SandwichStep({
  number,
  user,
  actorLabel,
  color,
  action,
  detail,
  icon,
  priceLabel,
}) {
  return (
    <div
      className="rounded-xl border p-3 flex gap-3"
      style={{ borderColor: color + "30", background: color + "08" }}
    >
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center font-mono font-black text-xs shrink-0 mt-0.5 border"
        style={{ color, borderColor: color + "60", background: color + "15" }}
      >
        {number}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span
            className="flex items-center font-mono text-[10px] md:text-xs font-black tracking-widest px-1.5 py-0.5 rounded border"
            style={{
              color,
              borderColor: color + "50",
              background: color + "15",
            }}
          >
            <span className="mr-1">{user}</span>
            {actorLabel}
          </span>
          <span className="font-mono text-xs font-bold text-terminal-text">
            {action}
          </span>
          <span className="text-sm">{icon}</span>
        </div>
        <p className="font-mono text-xs text-terminal-dim leading-snug">
          {detail}
        </p>
        <div
          className="mt-1.5 font-mono text-xs font-semibold"
          style={{ color }}
        >
          {priceLabel}
        </div>
      </div>
    </div>
  );
}
