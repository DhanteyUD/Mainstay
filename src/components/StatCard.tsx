import React from "react";
import cn from "../functions/cn";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  accent: string;
  border: string;
  bg: string;
  sublabel?: string;
  pulse?: boolean;
  pulseColor?: string;
  network?: boolean;
}

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
  network,
}: StatCardProps) {
  return (
    <div
      className={`rounded-xl border ${border} ${bg} p-3.5 flex flex-col gap-1.5`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {icon}
          <span
            className={cn(
              "font-mono text-xs text-terminal-dim tracking-wider uppercase",
              network && "text-terminal-dim/30",
            )}
          >
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
        <div
          className={cn(
            "font-mono text-[10px] md:text-xs text-terminal-dim/60",
            network && "text-terminal-dim/30",
          )}
        >
          {sublabel}
        </div>
      )}
    </div>
  );
}
