import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import type { PredictionMarket } from "../../config";
import { cents, closesIn, sidePrice } from "./format";
import type { Side } from "./format";

interface Props {
  market: PredictionMarket;
  onPick: (side: Side) => void;
}

export default function MarketCard({ market, onPick }: Props) {
  const yesPrice = sidePrice(market, "YES");
  const noPrice = sidePrice(market, "NO");
  const yes = Math.round(yesPrice * 100);
  const closes = closesIn(market);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-terminal-border bg-terminal-card"
    >
      <div className="p-4 pb-3">
        <div className="mb-2 flex items-center gap-2 font-mono text-[10px] tracking-wider text-terminal-dim">
          <span className="rounded border border-terminal-border px-1.5 py-0.5 uppercase">
            {market.category}
          </span>
          {closes && (
            <span className="inline-flex items-center gap-1">
              <Clock size={10} /> {closes}
            </span>
          )}
          {market.volume24h >= 1 && (
            <span
              className="ml-auto"
              title="Contracts traded in the last 24 hours. Each contract pays $1 if right."
            >
              {market.volume24h >= 1000
                ? `${(market.volume24h / 1000).toFixed(1)}K`
                : Math.round(market.volume24h)}{" "}
              contracts today
            </span>
          )}
        </div>
        <h3 className="font-mono text-[13px] font-bold leading-snug text-terminal-text">
          {market.question}
        </h3>

        <div className="mt-3">
          <div className="relative h-2.5 overflow-hidden rounded-full bg-terminal-red/30">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-terminal-green/70 to-terminal-green"
              initial={{ width: 0 }}
              animate={{ width: `${yes}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
            <div
              className="absolute top-0 h-full w-0.5 bg-terminal-bg"
              style={{ left: `${yes}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between font-mono text-[10px] text-terminal-dim">
            <span>
              Yes costs <b className="text-terminal-green">{cents(yesPrice)}</b>
            </span>
            <span>
              No costs <b className="text-terminal-red">{cents(noPrice)}</b>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px border-t border-terminal-border bg-terminal-border">
        {(["YES", "NO"] as Side[]).map((side) => {
          const p = sidePrice(market, side);
          const isYes = side === "YES";
          return (
            <button
              key={side}
              onClick={() => onPick(side)}
              className={`group bg-terminal-card px-4 py-3 text-left transition-colors ${
                isYes
                  ? "hover:bg-terminal-green/10"
                  : "hover:bg-terminal-red/10"
              }`}
            >
              <div
                className={`flex items-baseline justify-between font-mono ${
                  isYes ? "text-terminal-green" : "text-terminal-red"
                }`}
              >
                <span className="text-sm font-black tracking-wider">
                  {side}
                </span>
                <span className="text-lg font-black">{cents(p)}</span>
              </div>
              <div className="mt-0.5 font-mono text-[10px] text-terminal-dim">
                Costs {cents(p)} · pays $1 if right
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
