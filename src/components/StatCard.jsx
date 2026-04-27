import React from "react";

export default function StatCard({
  icon,
  label,
  value,
  accent,
  border,
  bg,
  sublabel,
  pulse,
  pulseColor,
}) {
  return (
    <div
      className={`rounded-xl border ${border} ${bg} p-3.5 flex flex-col gap-1.5`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="font-mono text-xs text-terminal-dim tracking-wider uppercase">
            {label}
          </span>
        </div>
        {pulse && (
          <div
            className={`w-1.5 h-1.5 rounded-full animate-pulse ${pulseColor ?? "bg-terminal-green"}`}
          />
        )}
      </div>
      <div className={`font-mono font-bold text-lg tracking-wide ${accent}`}>
        {value}
      </div>
      {sublabel && (
        <div className="font-mono text-[10px] md:text-xs text-terminal-dim/60">{sublabel}</div>
      )}
    </div>
  );
}
