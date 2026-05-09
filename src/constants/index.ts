export const TAB_MAIN_SWAP = "swap";
export const TAB_MAIN_LIMIT = "limit";
export const TAB_MAIN_PREDICT = "predictions";

export const TAB_INFO = "info";
export const TAB_HISTORY = "history";

interface RiskStyle {
  accent: string;
  border: string;
  bg: string;
  pulse: string;
}

export const RISK_STYLES: Record<string, RiskStyle> = {
  HIGH: {
    accent: "text-terminal-red",
    border: "border-red-500/20",
    bg: "bg-red-500/5",
    pulse: "bg-terminal-red",
  },
  MEDIUM: {
    accent: "text-terminal-yellow",
    border: "border-terminal-yellow/20",
    bg: "bg-terminal-yellow/5",
    pulse: "bg-terminal-yellow",
  },
  LOW: {
    accent: "text-terminal-green",
    border: "border-terminal-green/20",
    bg: "bg-terminal-green/5",
    pulse: "bg-terminal-green",
  },
};

interface UptimeStyle {
  accent: string;
  border: string;
  bg: string;
}

export const UPTIME_STYLES: Record<string, UptimeStyle> = {
  ok: {
    accent: "text-terminal-green",
    border: "border-terminal-green/20",
    bg: "bg-terminal-green/5",
  },
  bad: {
    accent: "text-terminal-yellow",
    border: "border-terminal-yellow/20",
    bg: "bg-terminal-yellow/5",
  },
};
