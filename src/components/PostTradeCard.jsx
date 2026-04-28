import React, { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  X,
  Shield,
  Share2,
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  Zap,
  Download,
} from "lucide-react";
import { IoShieldCheckmarkOutline } from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";
import { DIALECT_PROXY } from "../config";
import { useNetwork } from "../contexts/NetworkContext";

// ─── helpers ────────────────────────────────────────────────────────────────

function fmt(raw, decimals) {
  if (!raw) return "—";
  const v = Number(raw) / Math.pow(10, decimals);
  if (v < 0.000001) return v.toExponential(4);
  if (v < 1) return v.toFixed(6);
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(2) + "M";
  if (v >= 1_000)
    return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return v.toFixed(4);
}

function fmtUSD(n) {
  if (n == null || isNaN(n)) return "—";
  if (n < 0.01) return "<$0.01";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

function getGrade(slippagePct) {
  if (slippagePct == null) return null;
  const d = Number(slippagePct);
  if (d >= 0)
    return {
      label: "A+",
      color: "#00ff88",
      bg: "rgba(0,255,136,0.12)",
      desc: "Better than quoted",
    };
  if (d >= -0.05)
    return {
      label: "A",
      color: "#00ff88",
      bg: "rgba(0,255,136,0.10)",
      desc: "Excellent fill",
    };
  if (d >= -0.15)
    return {
      label: "B",
      color: "#00d4ff",
      bg: "rgba(0,212,255,0.10)",
      desc: "Good fill",
    };
  if (d >= -0.3)
    return {
      label: "C",
      color: "#ffd700",
      bg: "rgba(255,215,0,0.10)",
      desc: "Average fill",
    };
  if (d >= -0.5)
    return {
      label: "D",
      color: "#ff8c00",
      bg: "rgba(255,140,0,0.10)",
      desc: "Below average",
    };
  return {
    label: "F",
    color: "#ff4444",
    bg: "rgba(255,68,68,0.10)",
    desc: "Poor fill",
  };
}

function estimateMevSaved(inputUSD, slippagePct) {
  if (inputUSD == null || isNaN(inputUSD) || inputUSD <= 0) return null;
  const UNPROTECTED_MEV_TAX = 0.5;
  const actualLoss = Math.min(0, Number(slippagePct || 0));
  const savedPct = UNPROTECTED_MEV_TAX + actualLoss;
  return Math.max(0, (savedPct / 100) * inputUSD);
}

// ─── canvas share card ────────────────────────────────────────────────────────

async function generateShareImage({
  grade,
  mevSaved,
  slippagePct,
  inputToken,
  outputToken,
  actualOutput,
}) {
  const W = 800,
    H = 418;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0d1117";
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(0,255,136,0.04)";
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  const grd = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, 280);
  grd.addColorStop(0, "rgba(0,255,136,0.12)");
  grd.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(0,255,136,0.25)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(1, 1, W - 2, H - 2);

  ctx.fillStyle = "#00ff88";
  ctx.font = "bold 28px monospace";
  ctx.fillText("⬡", 48, 68);

  ctx.fillStyle = "#00ff88";
  ctx.font = "bold 18px monospace";
  ctx.fillText("Mainstay", 84, 58);
  ctx.fillStyle = "rgba(0,255,136,0.5)";
  ctx.font = "11px monospace";
  ctx.fillText("PROTECTED BY DFLOW", 84, 74);

  ctx.strokeStyle = "rgba(0,255,136,0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, 90);
  ctx.lineTo(W - 40, 90);
  ctx.stroke();

  const grade_ = grade || {
    label: "?",
    color: "#888",
    bg: "rgba(136,136,136,0.1)",
    desc: "",
  };
  const cx = W - 100,
    cy = 180;
  ctx.beginPath();
  ctx.arc(cx, cy, 52, 0, Math.PI * 2);
  ctx.fillStyle = grade_.bg;
  ctx.fill();
  ctx.strokeStyle = grade_.color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = grade_.color;
  ctx.font = `bold 40px monospace`;
  ctx.textAlign = "center";
  ctx.fillText(grade_.label, cx, cy + 14);
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "10px monospace";
  ctx.fillText("GRADE", cx, cy + 34);
  ctx.textAlign = "left";

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 34px monospace";
  ctx.fillText("Swap Protected ✓", 48, 150);

  const pair = `${inputToken?.symbol || "?"} → ${outputToken?.symbol || "?"}`;
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "14px monospace";
  ctx.fillText(pair, 48, 175);

  const stats = [
    { label: "MEV SAVED", val: mevSaved != null ? fmtUSD(mevSaved) : "—" },
    {
      label: "SLIPPAGE DELTA",
      val:
        slippagePct != null
          ? (Number(slippagePct) >= 0 ? "+" : "") +
            Number(slippagePct).toFixed(3) +
            "%"
          : "—",
    },
    { label: "RECEIVED", val: actualOutput || "—" },
  ];

  const statX = [48, 300, 540];
  stats.forEach((s, i) => {
    const x = statX[i];
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = "10px monospace";
    ctx.fillText(s.label, x, 230);
    ctx.fillStyle = "#00ff88";
    ctx.font = "bold 20px monospace";
    ctx.fillText(s.val, x, 255);
  });

  ctx.strokeStyle = "rgba(0,255,136,0.08)";
  ctx.beginPath();
  ctx.moveTo(40, 280);
  ctx.lineTo(W - 40, 280);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "12px monospace";
  ctx.fillText(
    "Swapped with MEV protection via DFlow's order flow auction.",
    48,
    310,
  );
  ctx.fillText(
    "Front-running and sandwich attacks blocked at the routing layer.",
    48,
    330,
  );

  ctx.fillStyle = "rgba(0,255,136,0.3)";
  ctx.font = "11px monospace";
  ctx.textAlign = "right";
  ctx.fillText("main-stay.vercel.app • @DFlowProtocol", W - 40, H - 22);
  ctx.textAlign = "left";

  return canvas.toDataURL("image/png");
}

// ─── main component ───────────────────────────────────────────────────────────

export default function PostTradeCard({
  result,
  inputToken,
  outputToken,
  quotedOutput,
  onClose,
  onNewSwap,
  onSaveTrade,
}) {
  const { isDevnet } = useNetwork();
  const [inputUSD, setInputUSD] = useState(null);
  const [sharing, setSharing] = useState(false);
  const [shareImgUrl, setShareImgUrl] = useState(null);
  const savedRef = useRef(false);

  if (!result) return null;

  const actualNum =
    Number(result.outputAmount) / Math.pow(10, outputToken?.decimals || 6);
  const quotedNum =
    Number(quotedOutput) / Math.pow(10, outputToken?.decimals || 6);
  const actualFmt = fmt(result.outputAmount, outputToken?.decimals || 6);
  const quotedFmt = fmt(quotedOutput, outputToken?.decimals || 6);

  let slippagePct = null;
  if (quotedNum > 0) {
    slippagePct = ((actualNum - quotedNum) / quotedNum) * 100;
  }

  const grade = getGrade(slippagePct);
  const mevSaved = estimateMevSaved(inputUSD, slippagePct);

  const inputAmt =
    Number(result.inputAmount) / Math.pow(10, inputToken?.decimals || 9);
  const quotedPrice = quotedNum > 0 ? inputAmt / quotedNum : null;
  const actualPrice = actualNum > 0 ? inputAmt / actualNum : null;

  const shortSig = result.signature
    ? result.signature.slice(0, 8) + "…" + result.signature.slice(-6)
    : "—";

  useEffect(() => {
    if (!inputToken?.mint) return;
    let cancelled = false;
    (async () => {
      let resolvedInputUSD = null;
      try {
        const res = await fetch(
          `${DIALECT_PROXY}/api.jup.ag/price/v3?ids=${inputToken.mint}`,
        );
        if (!res.ok) throw new Error("price fetch failed");
        const data = await res.json();
        const usdPrice = data?.[inputToken.mint]?.usdPrice;
        if (!cancelled && usdPrice) {
          resolvedInputUSD = inputAmt * usdPrice;
          setInputUSD(resolvedInputUSD);
        }
      } catch {
        /* silent */
      }

      if (!cancelled && !savedRef.current && onSaveTrade) {
        savedRef.current = true;
        const resolvedMev = estimateMevSaved(resolvedInputUSD, slippagePct);
        onSaveTrade({
          result,
          inputToken,
          outputToken,
          grade: getGrade(slippagePct),
          mevSaved: resolvedMev,
          slippagePct,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [inputToken?.mint]);

  const handleShare = async () => {
    setSharing(true);
    try {
      const imgDataUrl = await generateShareImage({
        grade,
        mevSaved,
        slippagePct,
        inputToken,
        outputToken,
        actualOutput: `${actualFmt} ${outputToken?.symbol || ""}`,
      });
      setShareImgUrl(imgDataUrl);

      const gradeLabel = grade?.label || "?";
      const savedStr = mevSaved != null ? fmtUSD(mevSaved) : "N/A";
      const slipStr =
        slippagePct != null
          ? (Number(slippagePct) >= 0 ? "+" : "") +
            Number(slippagePct).toFixed(3) +
            "%"
          : "N/A";
      const tweetText = encodeURIComponent(
        `🛡️ Just swapped ${inputToken?.symbol} → ${outputToken?.symbol} with Mainstay!\n\n` +
          `✅ Execution Grade: ${gradeLabel}\n` +
          `💰 Est. MEV Saved: ${savedStr}\n` +
          `📊 Slippage Delta: ${slipStr}\n\n` +
          `Protected by @DFlowProtocol's order flow auction.\n#Mainstay #Solana #DeFi`,
      );
      window.open(
        `https://twitter.com/intent/tweet?text=${tweetText}`,
        "_blank",
        "noopener",
      );
    } finally {
      setSharing(false);
    }
  };

  const handleDownload = () => {
    if (!shareImgUrl) return;
    const a = document.createElement("a");
    a.href = shareImgUrl;
    a.download = "mev-shield-trade.png";
    a.click();
  };

  const SlippageIcon =
    slippagePct == null
      ? Minus
      : Number(slippagePct) >= 0
        ? TrendingUp
        : TrendingDown;

  const slippageColor =
    slippagePct == null
      ? "text-terminal-dim"
      : Number(slippagePct) >= 0
        ? "text-terminal-green"
        : Number(slippagePct) < -0.3
          ? "text-terminal-red"
          : "text-yellow-400";

  const staggerItem = (i) => ({
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { delay: 0.15 + i * 0.07 } },
  });

  return (
    <motion.div
      className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="bg-terminal-card border border-terminal-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl overflow-hidden"
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-terminal-border">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-terminal-green" />
            <span className="font-mono font-bold text-terminal-green text-sm tracking-widest">
              TRADE EXECUTED
            </span>
          </div>
          <motion.button
            onClick={onClose}
            className="text-terminal-dim hover:text-terminal-text transition-colors p-1"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X size={15} />
          </motion.button>
        </div>

        {/* ── Body ── */}
        <div className="p-4 sm:p-5 space-y-3 max-h-[85vh] sm:max-h-[80vh] overflow-y-auto">
          {/* Execution grade badge */}
          {grade && (
            <motion.div
              className="flex items-center justify-between px-4 py-3 rounded-xl border"
              style={{ background: grade.bg, borderColor: grade.color + "40" }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 350,
                damping: 25,
                delay: 0.05,
              }}
            >
              <div className="flex items-center gap-2.5">
                <Award size={16} style={{ color: grade.color }} />
                <div>
                  <div className="font-mono text-xs text-white/50 tracking-widest">
                    EXECUTION GRADE
                  </div>
                  <div
                    className="font-mono font-bold text-sm"
                    style={{ color: grade.color }}
                  >
                    {grade.desc}
                  </div>
                </div>
              </div>
              <motion.div
                className="w-12 h-12 rounded-full flex items-center justify-center border-2 font-mono font-black text-xl"
                style={{
                  borderColor: grade.color,
                  color: grade.color,
                  background: grade.bg,
                }}
                initial={{ rotate: -20, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 20,
                  delay: 0.1,
                }}
              >
                {grade.label}
              </motion.div>
            </motion.div>
          )}

          {/* Price comparison grid */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-2"
            {...staggerItem(1)}
          >
            <div className="bg-terminal-surface border border-terminal-border rounded-xl p-3">
              <div className="font-mono text-xs text-terminal-dim/70 tracking-widest mb-1">
                QUOTED PRICE
              </div>
              <div className="font-mono text-sm font-bold text-terminal-text">
                {quotedPrice != null ? quotedPrice.toFixed(6) : "—"}
              </div>
              <div className="font-mono text-xs text-terminal-dim/50 mt-0.5">
                {inputToken?.symbol} per {outputToken?.symbol}
              </div>
            </div>
            <div className="bg-terminal-surface border border-terminal-border rounded-xl p-3">
              <div className="font-mono text-xs text-terminal-dim/70 tracking-widest mb-1">
                ACTUAL PRICE
              </div>
              <div className="font-mono text-sm font-bold text-terminal-green">
                {actualPrice != null ? actualPrice.toFixed(6) : "—"}
              </div>
              <div className="font-mono text-xs text-terminal-dim/50 mt-0.5">
                {inputToken?.symbol} per {outputToken?.symbol}
              </div>
            </div>
          </motion.div>

          {/* Slippage delta */}
          <motion.div
            className="flex items-center justify-between bg-terminal-surface border border-terminal-border rounded-xl px-4 py-3"
            {...staggerItem(2)}
          >
            <div className="flex items-center gap-2">
              <SlippageIcon size={14} className={slippageColor} />
              <span className="font-mono text-xs text-terminal-dim">
                Slippage Delta
              </span>
            </div>
            <div className="text-right">
              <div className={`font-mono text-sm font-bold ${slippageColor}`}>
                {slippagePct != null
                  ? (Number(slippagePct) >= 0 ? "+" : "") +
                    Number(slippagePct).toFixed(3) +
                    "%"
                  : "—"}
              </div>
              <div className="font-mono text-xs text-terminal-dim/50">
                Quoted {quotedFmt} → Got {actualFmt} {outputToken?.symbol}
              </div>
            </div>
          </motion.div>

          {/* MEV saved — mainnet only */}
          {!isDevnet && (
            <motion.div
              className="flex items-center justify-between bg-terminal-surface border border-terminal-green/20 rounded-xl px-4 py-3"
              {...staggerItem(3)}
            >
              <div className="flex items-center gap-2">
                <IoShieldCheckmarkOutline
                  size={14}
                  className="text-terminal-green"
                />
                <div>
                  <div className="font-mono text-xs text-terminal-dim">
                    Est. MEV Saved
                  </div>
                  <div className="font-mono text-xs text-terminal-dim/50">
                    vs unprotected DEX route
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm font-bold text-terminal-green">
                  {mevSaved != null ? fmtUSD(mevSaved) : "Calculating…"}
                </div>
                <div className="font-mono text-xs text-terminal-dim/50">
                  ~0.5% MEV tax avoided
                </div>
              </div>
            </motion.div>
          )}

          {/* Tx link */}
          <motion.div
            className="flex items-center justify-between px-1"
            {...staggerItem(4)}
          >
            <span className="font-mono text-xs text-terminal-dim/60">
              Transaction
            </span>
            <a
              href={result.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-mono text-xs text-terminal-accent hover:underline"
            >
              {shortSig}
              <ExternalLink size={10} />
            </a>
          </motion.div>

          {/* Share image preview — mainnet only */}
          {!isDevnet && (
            <AnimatePresence>
              {shareImgUrl && (
                <motion.div
                  className="relative rounded-xl overflow-hidden border border-terminal-border"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <img src={shareImgUrl} alt="Trade card" className="w-full" />
                  <button
                    onClick={handleDownload}
                    className="absolute bottom-2 right-2 flex items-center gap-1 px-3 py-1.5 bg-black/70 border border-terminal-border rounded-lg font-mono text-xs text-terminal-text hover:text-terminal-accent transition-colors"
                  >
                    <Download size={11} />
                    Save
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* Share button — mainnet only */}
          {!isDevnet && (
            <motion.button
              onClick={handleShare}
              disabled={sharing}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-mono font-bold text-sm border border-terminal-accent/40 text-terminal-accent bg-terminal-accent/5 hover:bg-terminal-accent/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={!sharing ? { scale: 1.01 } : {}}
              whileTap={!sharing ? { scale: 0.98 } : {}}
              {...staggerItem(5)}
            >
              {sharing ? (
                <span className="animate-pulse">Generating card…</span>
              ) : (
                <>
                  <Share2 size={14} />
                  Share your savings
                  <span className="text-xs font-normal text-terminal-dim">
                    / 𝕏
                  </span>
                </>
              )}
            </motion.button>
          )}

          {/* New swap */}
          <motion.button
            onClick={onNewSwap}
            className="w-full py-3 rounded-xl font-mono font-bold text-sm bg-terminal-surface border border-terminal-border text-terminal-text hover:border-terminal-accent/40 hover:text-terminal-accent transition-all duration-200"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            {...staggerItem(6)}
          >
            New Swap
          </motion.button>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-center gap-1.5 py-3 border-t border-terminal-border bg-terminal-surface/40">
          {isDevnet ? (
            <Zap size={11} className="text-terminal-yellow" />
          ) : (
            <Shield size={11} className="text-terminal-accent" />
          )}
          <span
            className={`font-mono text-xs tracking-wider ${isDevnet ? "text-terminal-yellow/70" : "text-terminal-accent/70"}`}
          >
            {isDevnet ? "Devnet — Routed via Jupiter" : "Protected by DFlow"}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
