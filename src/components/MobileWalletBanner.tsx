import React from "react";
import { motion } from "framer-motion";
import { Smartphone, Tablet, ExternalLink } from "lucide-react";
import { isMobile } from "../lib/device";
import { WALLETS } from "../constants/wallets";

export default function MobileWalletBanner() {
  if (!isMobile) return null;

  const url = encodeURIComponent(window.location.href);
  const ua = navigator.userAgent;
  const isTablet =
    /iPad/.test(ua) ||
    (ua.includes("Android") && !/Mobile/.test(ua)) ||
    ua.includes("x86_64");

  function getDeviceLabel() {
    if (/iPad/.test(ua)) return "iPad";
    if (/iPhone/.test(ua)) return "iPhone";
    if (/iPod/.test(ua)) return "iPod";
    if (/Samsung/i.test(ua)) return "Samsung";
    if (/Pixel/i.test(ua)) return "Pixel";
    if (ua.includes("Android")) return "Android";
    if (isTablet) return "Tablet";
    return "Mobile";
  }

  const deviceLabel = getDeviceLabel();

  return (
    <motion.div
      className="relative overflow-hidden flex flex-col"
      style={{
        background: "rgba(10,14,20,0.95)",
        minHeight: "calc(100dvh - 60px)",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(171,102,255,0.07) 0%, transparent 70%)",
        }}
      />

      <div className="relative w-full mx-auto max-w-3xl px-10 md:px-32 py-5 flex flex-col flex-1 justify-center gap-5">
        <div className="flex items-center gap-2 mb-4">
          <span
            className="flex items-center justify-center w-7 h-7 rounded-lg"
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.3)",
            }}
          >
            {isTablet ? (
              <Tablet size={14} style={{ color: "#ffffff" }} />
            ) : (
              <Smartphone size={14} style={{ color: "#ffffff" }} />
            )}
          </span>
          <span className="font-mono text-xs font-bold tracking-widest uppercase">
            {deviceLabel} detected
          </span>
          <span
            className="ml-1 w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: "#00e5ff", boxShadow: "0 0 6px #00e5ff" }}
          />
        </div>

        <p className="font-mono text-xs text-terminal-dim leading-relaxed mb-5 max-w-sm">
          To connect your wallet, open this page inside your wallet's{" "}
          <span className="text-terminal-text font-semibold">
            built-in browser
          </span>
          .
        </p>

        <div className="flex flex-col sm:flex-row gap-4 h-40 sm:h-auto">
          {WALLETS.map((w) => (
            <motion.a
              key={w.name}
              href={w.href(url)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="relative flex items-center gap-3 p-0 sm:p-4 rounded-xl flex-none sm:flex-1 group no-underline"
              style={{
                background: w.bg,
                border: `1px solid ${w.border}`,
                boxShadow: `0 0 20px ${w.glow}`,
              }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse 120% 80% at 50% 120%, ${w.glow} 0%, transparent 70%)`,
                }}
              />

              <img
                src={w.logo}
                alt={w.name}
                className="hidden sm:flex w-9 h-9 rounded-lg object-cover shrink-0 relative z-10"
                style={{ boxShadow: `0 0 12px ${w.glow}` }}
              />

              <div className="flex sm:hidden w-full h-16 rounded-lg overflow-hidden flex-shrink-0 relative">
                <img
                  src={w.image}
                  alt={w.name}
                  className="flex sm:hidden w-full h-full rounded-lg object-contain shrink-0 z-10"
                  style={{
                    backgroundColor: w.color,
                    boxShadow: `0 0 12px ${w.glow}`,
                  }}
                />
              </div>

              <div className="hidden sm:block relative z-10 flex-1 min-w-0">
                <div
                  className="font-mono text-sm font-bold tracking-wide"
                  style={{ color: w.color }}
                >
                  {w.name}
                </div>
                <div className="font-mono text-xs text-terminal-dim">
                  Open in browser
                </div>
              </div>

              <ExternalLink
                size={14}
                className="hidden sm:flex relative z-10 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity"
                style={{ color: w.color }}
              />

              {w.recommended && (
                <span className="absolute right-4 -top-2 sm:-top-2.5 font-mono text-[9px] font-bold tracking-wider px-2 py-0.5 rounded uppercase bg-terminal-muted z-10 sm:bg-[rgba(255,239,70)] border-[rgba(255,239,70,0.4)] text-terminal-text sm:text-terminal-bg">
                  Recommended
                </span>
              )}
            </motion.a>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
