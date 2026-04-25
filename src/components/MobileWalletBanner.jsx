import React from 'react'
import { motion } from 'framer-motion'
import { isMobile } from '../lib/device'

export default function MobileWalletBanner() {

  // alert(JSON.stringify(navigator.userAgent + " - " + isMobile))

  if (!isMobile) return null

  const url = encodeURIComponent(window.location.href)

  return (
    <motion.div
      className="border-b border-terminal-border bg-terminal-surface/60 backdrop-blur-sm"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <p className="flex-1 min-w-0 font-mono text-xs text-terminal-dim leading-relaxed">
          <span className="text-terminal-yellow font-bold">
            {navigator.userAgent.includes("x86_64")
              ? "Tablet detected"
              : "Mobile detected"}{" "}
            —{" "}
          </span>
          open this app inside your wallet's built-in browser to connect.
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={`https://phantom.app/ul/v1/browse/${url}?ref=${url}`}
            className="inline-flex items-center px-3 py-1.5 rounded-lg font-mono text-xs font-bold tracking-wider transition-opacity hover:opacity-80"
            style={{
              border: "1px solid rgba(171,102,255,0.35)",
              background: "rgba(171,102,255,0.1)",
              color: "#AB66FF",
            }}
          >
            Phantom
          </a>
          <a
            href={`https://solflare.com/ul/v1/browse/${url}?ref=${url}`}
            className="inline-flex items-center px-3 py-1.5 rounded-lg font-mono text-xs font-bold tracking-wider transition-opacity hover:opacity-80"
            style={{
              border: "1px solid rgba(252,140,4,0.35)",
              background: "rgba(252,140,4,0.1)",
              color: "#FFEF46",
            }}
          >
            Solflare
          </a>
        </div>
      </div>
    </motion.div>
  );
}
