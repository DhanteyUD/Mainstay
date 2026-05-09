import React from "react";
import { ShieldCheck, ShieldAlert, ShieldX, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import type { MevRisk } from "../types";

interface MevRiskConfig {
  label: string;
  Icon: React.ComponentType<{ size?: number | string; className?: string }>;
  wrapper: string;
  dot: string;
  pulse: boolean;
}

const LEVELS: Record<string, MevRiskConfig> = {
  LOW: {
    label: "LOW RISK",
    Icon: ShieldCheck,
    wrapper:
      "bg-terminal-green/10 border-terminal-green/25 text-terminal-green",
    dot: "bg-terminal-green",
    pulse: false,
  },
  MEDIUM: {
    label: "MEDIUM RISK",
    Icon: ShieldAlert,
    wrapper:
      "bg-terminal-yellow/10 border-terminal-yellow/25 text-terminal-yellow",
    dot: "bg-terminal-yellow",
    pulse: false,
  },
  HIGH: {
    label: "HIGH RISK",
    Icon: ShieldX,
    wrapper: "bg-terminal-red/10 border-terminal-red/25 text-terminal-red",
    dot: "bg-terminal-red animate-pulse",
    pulse: true,
  },
};

interface MevRiskBadgeProps {
  risk: MevRisk | null;
  loading: boolean;
}

export default function MevRiskBadge({ risk, loading }: MevRiskBadgeProps) {
  if (loading) {
    return (
      <motion.div
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-terminal-surface/50 border border-terminal-border"
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Loader2
          size={11}
          className="text-terminal-dim animate-spin shrink-0"
        />
        <span className="text-terminal-dim text-xs font-mono tracking-wide">
          Analyzing MEV risk…
        </span>
      </motion.div>
    );
  }

  if (!risk) return null;

  const cfg = LEVELS[risk.level] || LEVELS.LOW;
  const { Icon } = cfg;

  return (
    <motion.div
      className={`flex flex-col gap-1.5 px-3 py-2.5 rounded-lg border ${cfg.wrapper}`}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
        <Icon size={12} className="shrink-0" />
        <span className="font-mono font-bold text-xs tracking-widest">
          MEV {cfg.label}
        </span>
      </div>

      <p className="font-mono text-xs opacity-75 leading-relaxed pl-[22px]">
        {risk.explanation}
      </p>
    </motion.div>
  );
}
