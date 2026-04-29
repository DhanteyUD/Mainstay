import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export function MainTabBtn({ active, onClick, icon, label, badge, soon }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-2 sm:px-3 rounded-lg font-mono text-xs font-bold tracking-wider transition-all duration-150 border ${
        active
          ? "bg-terminal-surface border-terminal-border text-terminal-text"
          : soon
            ? "border-transparent text-terminal-dim/40 hover:text-terminal-dim/70"
            : "border-transparent text-terminal-dim hover:text-terminal-text"
      }`}
    >
      {icon}
      <span className="hidden lg:inline">{label}</span>
      <span className="hidden sm:inline lg:hidden">{label.split(" ")[0]}</span>
      {soon && (
        <>
          <span className="hidden lg:inline font-mono text-[9px] font-bold tracking-widest text-terminal-dim/40 border border-terminal-border rounded px-1 py-0.5 leading-none">
            COMING SOON
          </span>
          <span className="hidden sm:inline lg:hidden font-mono text-[9px] font-bold tracking-widest text-terminal-dim/40 border border-terminal-border rounded px-1 py-0.5 leading-none">
            SOON
          </span>
        </>
      )}

      <AnimatePresence>
        {badge != null && (
          <motion.span
            className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-terminal-yellow/25 text-terminal-yellow text-xs font-bold leading-none"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            {badge > 99 ? "99+" : badge}
          </motion.span>
        )}
      </AnimatePresence>

      {active && !soon && (
        <motion.div
          className="w-1 h-1 rounded-full bg-terminal-accent"
          layoutId="main-tab-dot"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
    </button>
  );
}

export function TabBtn({ active, onClick, icon, label, badge }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-mono text-xs font-bold tracking-wider transition-all duration-150 relative border ${
        active
          ? "bg-terminal-surface border-terminal-border text-terminal-text"
          : "border-transparent text-terminal-dim hover:text-terminal-text"
      }`}
    >
      {icon}
      <span>{label}</span>
      <AnimatePresence>
        {badge != null && (
          <motion.span
            className="ml-1 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-terminal-accent/20 text-terminal-accent text-xs font-bold leading-none"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            {badge > 99 ? "99+" : badge}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
