import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Info, Loader2, RefreshCw, Search } from "lucide-react";
import { usePredictionMarkets } from "../hooks/usePredictionMarkets";
import MarketCard from "./predict/MarketCard";
import TradeSheet from "./predict/TradeSheet";
import MyBets from "./predict/MyBets";
import type { PredictionMarket } from "../config";
import type { Side } from "./predict/format";
import { TOUR_SHEET_EVENT } from "./walkthrough/tours";

type View = "markets" | "bets";

const STEPS = [
  { n: "1", t: "Pick a question" },
  { n: "2", t: "Choose Yes or No" },
  { n: "3", t: "Win $1 per token" },
];

/** Live mainnet prediction markets (Kalshi contracts via DFlow), real USDC. */
export default function PredictionMarkets() {
  const { markets, loading, error, refetch } = usePredictionMarkets(true);
  const [view, setView] = useState<View>("markets");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [pick, setPick] = useState<{
    market: PredictionMarket;
    side: Side;
  } | null>(null);
  const [betsKey, setBetsKey] = useState(0);
  const preview =
    markets.length > 0 && markets.every((m) => m.live?.tradable === false);

  useEffect(() => {
    const onTour = (e: Event) => {
      const mode = (e as CustomEvent<"open" | "closed">).detail;
      if (mode === "open") {
        setView("markets");
        if (markets[0]) setPick({ market: markets[0], side: "YES" });
      } else {
        setPick(null);
        setView("markets");
      }
    };
    window.addEventListener(TOUR_SHEET_EVENT, onTour);
    return () => window.removeEventListener(TOUR_SHEET_EVENT, onTour);
  }, [markets]);

  const categories = useMemo(
    () => [
      "All",
      ...Array.from(new Set(markets.map((m) => m.category))).sort(),
    ],
    [markets],
  );
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return markets
      .filter((m) => category === "All" || m.category === category)
      .filter((m) => !q || m.question.toLowerCase().includes(q))
      .slice(0, 40);
  }, [markets, search, category]);

  return (
    <div data-tour="predict-panel" className="font-mono">
      <div className="mb-3 overflow-hidden rounded-2xl border border-terminal-border bg-terminal-card">
        <div className="flex items-center gap-2 px-4 pt-4">
          <span className="h-2 w-2 animate-pulse rounded-full bg-terminal-green" />
          <h2 className="text-sm font-black tracking-widest text-terminal-text">
            PREDICT
          </h2>
          <span className="rounded border border-terminal-green/30 px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-terminal-green">
            LIVE · MAINNET
          </span>
        </div>
        <p className="px-4 pt-1 text-[11px] text-terminal-dim">
          Bet on real-world events. Every correct token pays out $1.
        </p>
        <div className="mt-3 grid grid-cols-3 divide-x divide-terminal-border border-t border-terminal-border">
          {STEPS.map((s) => (
            <div key={s.n} className="px-3 py-2.5 text-center">
              <div className="text-[10px] font-black text-terminal-accent">
                {s.n}
              </div>
              <div className="text-[10px] leading-tight text-terminal-dim">
                {s.t}
              </div>
            </div>
          ))}
        </div>
      </div>

      {preview && (
        <div className="mb-3 flex items-start gap-2 rounded-xl border border-terminal-yellow/30 bg-terminal-yellow/5 px-3 py-2.5 text-[11px] leading-relaxed text-terminal-dim">
          <Info size={13} className="mt-0.5 shrink-0 text-terminal-yellow" />
          <span>
            <b className="text-terminal-yellow">Preview.</b> These are live
            Kalshi prices. Betting switches on as soon as our DFlow access is
            active.
          </span>
        </div>
      )}

      <div className="relative mb-3 grid grid-cols-2 rounded-xl border border-terminal-border bg-terminal-card p-1">
        {(
          [
            ["markets", "Markets"],
            ["bets", "My bets"],
          ] as [View, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            data-tour={id === "bets" ? "predict-bets" : undefined}
            onClick={() => setView(id)}
            className={`relative rounded-lg py-2 text-xs font-bold tracking-wider transition-colors ${
              view === id
                ? "text-terminal-bg"
                : "text-terminal-dim hover:text-terminal-text"
            }`}
          >
            {view === id && (
              <motion.span
                layoutId="predict-view"
                className="absolute inset-0 rounded-lg bg-terminal-accent"
                transition={{ type: "spring", damping: 28, stiffness: 320 }}
              />
            )}
            <span className="relative">{label}</span>
          </button>
        ))}
      </div>

      {view === "markets" ? (
        <>
          <div data-tour="predict-search" className="mb-3 space-y-2">
            <div className="flex items-center gap-2 rounded-xl border border-terminal-border bg-terminal-card px-3 py-2.5 focus-within:border-terminal-accent">
              <Search size={13} className="text-terminal-dim" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search questions…"
                className="min-w-0 flex-1 bg-transparent text-xs text-terminal-text outline-none placeholder:text-terminal-dim"
              />
            </div>
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`shrink-0 rounded-full border px-3 py-1 text-[11px] transition-colors ${
                    category === c
                      ? "border-terminal-accent/60 bg-terminal-accent/15 text-terminal-accent"
                      : "border-terminal-border text-terminal-dim hover:text-terminal-text"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-xs text-terminal-dim">
              <Loader2 size={14} className="animate-spin" /> Loading live
              markets…
            </div>
          ) : error || markets.length === 0 ? (
            <div className="rounded-2xl border border-terminal-border bg-terminal-card p-8 text-center">
              <AlertCircle
                size={20}
                className="mx-auto mb-2 text-terminal-yellow"
              />
              <div className="text-xs text-terminal-text">
                {error ?? "No open markets right now."}
              </div>
              <button
                onClick={() => refetch()}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-terminal-border px-3 py-1.5 text-xs text-terminal-dim hover:text-terminal-text"
              >
                <RefreshCw size={12} /> Try again
              </button>
            </div>
          ) : visible.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-terminal-border py-10 text-center text-xs text-terminal-dim">
              No questions match your search.
            </div>
          ) : (
            <div data-tour="predict-card" className="space-y-3">
              {visible.map((m) => (
                <MarketCard
                  key={m.id}
                  market={m}
                  onPick={(side) => setPick({ market: m, side })}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <MyBets refreshKey={betsKey} />
      )}

      <p className="mt-4 px-2 text-center text-[10px] leading-relaxed text-terminal-dim/50">
        Markets are Kalshi event contracts tokenized on Solana by DFlow. Buying
        needs a one-time identity check and may not be available in every
        country. You can lose the full amount you bet.
      </p>

      <AnimatePresence>
        {pick && (
          <TradeSheet
            key={pick.market.id}
            market={pick.market}
            side={pick.side}
            onSideChange={(side) => setPick({ ...pick, side })}
            onClose={() => setPick(null)}
            onDone={() => setBetsKey((k) => k + 1)}
            onViewBets={() => {
              setPick(null);
              setView("bets");
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
