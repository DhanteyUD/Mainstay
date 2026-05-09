import React, { useState } from "react";
import { motion } from "framer-motion";

interface EdgeStatusCardProps {
  label: string;
  value: string;
  sublabel?: string;
  icon: React.ReactNode;
  accentClass: string;
  stripBg: string;
  pulse?: boolean;
  pulseColor?: string;
  topOffset?: string;
  disabled?: boolean;
}

export default function EdgeStatusCard({
  label,
  value,
  sublabel,
  icon,
  accentClass,
  stripBg,
  pulse = false,
  pulseColor,
  topOffset = "35%",
  disabled = false,
}: EdgeStatusCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (disabled) return null;

  return (
    <motion.div
      className="fixed right-0 z-30 hidden md:block"
      style={{ top: topOffset, width: 196 }}
      animate={{ x: expanded ? 0 : "calc(100% - 12px)" }}
      initial={{ x: "calc(100% - 12px)" }}
      transition={{ type: "spring", damping: 28, stiffness: 360 }}
      onHoverStart={() => setExpanded(true)}
      onHoverEnd={() => setExpanded(false)}
      onTap={() => setExpanded((prev) => !prev)}
    >
      <div
        className="flex rounded-l-2xl overflow-hidden shadow-2xl cursor-pointer"
        style={{ width: 196 }}
      >
        <div
          className={`w-3 shrink-0 ${stripBg} flex flex-col items-center justify-center gap-1.5`}
        >
          <span className="w-0.5 h-5 rounded-full bg-white/20" />
          {pulse && (
            <span className="w-1.5 h-1.5 rounded-full bg-white/50 animate-pulse" />
          )}
        </div>

        <div className="flex-1 bg-terminal-card border-y border-r border-terminal-border p-4">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              {icon}
              <span className="font-mono text-[10px] text-terminal-dim tracking-widest uppercase">
                {label}
              </span>
            </div>
            {pulse && (
              <div
                className={`w-1.5 h-1.5 rounded-full animate-pulse ${pulseColor ?? "bg-terminal-green"}`}
              />
            )}
          </div>

          <div
            className={`font-mono font-bold text-xl leading-none ${accentClass}`}
          >
            {value}
          </div>

          {sublabel && (
            <p className="font-mono text-[10px] text-terminal-dim/60 mt-1.5 leading-snug">
              {sublabel}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
