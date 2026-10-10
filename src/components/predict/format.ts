import type { PredictionMarket } from "../../config";

export type Side = "YES" | "NO";

export const cents = (p: number) => `${Math.round(p * 100)}¢`;

export const usd = (n: number) =>
  "$" +
  n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export function sidePrice(m: PredictionMarket, side: Side): number {
  const l = m.live;
  if (side === "YES") return l?.yesAsk ?? m.probability;
  return l?.noAsk ?? 1 - m.probability;
}

export function closesIn(m: PredictionMarket): string | null {
  const t = m.live?.closeTime;
  if (!t) return null;
  const ms = t * 1000 - Date.now();
  if (ms <= 0) return "closing";
  const h = ms / 3_600_000;
  if (h < 1) return "closes < 1h";
  if (h < 48) return `closes in ${Math.round(h)}h`;
  const days = h / 24;
  if (days <= 90) return `closes in ${Math.round(days)}d`;
  return `closes ${new Date(t * 1000).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
}
