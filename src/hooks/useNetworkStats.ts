import { useState, useEffect, useMemo } from "react";
import { Connection } from "@solana/web3.js";
import { DIALECT_PROXY, SOLANA_RPC_PROXY, TOKENS } from "../config";
import type { RiskLevel } from "../types";

export function useNetworkStats() {
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(true);
  const [dflowPings, setDflowPings] = useState<boolean[]>([]);
  const [networkRisk, setNetworkRisk] = useState<RiskLevel | null>(null);
  const [heliusPings, setHeliusPings] = useState<boolean[]>([]);

  useEffect(() => {
    const SOL_MINT = TOKENS.SOL.mint;
    async function fetchPrice() {
      let ok = false;
      try {
        const res = await fetch(
          `${DIALECT_PROXY}/api.jup.ag/price/v3?ids=${SOL_MINT}`,
        );
        if (res.ok) {
          const data = await res.json();
          const price = data[SOL_MINT]?.usdPrice;
          if (price != null) {
            setSolPrice(price);
            ok = true;
          }
        }
      } catch {
        /* try fallbacks */
      }

      if (!ok) {
        try {
          const res = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
          );
          if (res.ok) {
            const data = await res.json();
            const price = data?.solana?.usd;
            if (price != null) {
              setSolPrice(price);
              ok = true;
            }
          }
        } catch {
          /* try next */
        }
      }

      if (!ok) {
        try {
          const res = await fetch(
            "https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT",
          );
          if (res.ok) {
            const data = await res.json();
            const price = parseFloat(data?.price);
            if (!isNaN(price)) {
              setSolPrice(price);
              ok = true;
            }
          }
        } catch {
          /* non-fatal */
        }
      }

      setPriceLoading(false);
      setDflowPings((prev) => [...prev.slice(-19), ok]);
    }
    fetchPrice();
    const id = setInterval(fetchPrice, 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    async function fetchRisk() {
      let ok = false;
      try {
        const connection = new Connection(SOLANA_RPC_PROXY, {
          commitment: "confirmed",
          wsEndpoint: "",
        });
        const samples = await connection.getRecentPerformanceSamples(1);
        if (samples?.length > 0) {
          const tps = samples[0].numTransactions / samples[0].samplePeriodSecs;
          setNetworkRisk(tps > 3000 ? "HIGH" : tps > 1500 ? "MEDIUM" : "LOW");
          ok = true;
        }
      } catch {
        setNetworkRisk("LOW");
      } finally {
        setHeliusPings((prev) => [...prev.slice(-19), ok]);
      }
    }
    fetchRisk();
    const id = setInterval(fetchRisk, 15_000);
    return () => clearInterval(id);
  }, []);

  const uptimePct = useMemo(() => {
    const all = [...dflowPings, ...heliusPings];
    if (all.length === 0) return null;
    const pct = (all.filter(Boolean).length / all.length) * 100;
    return Math.min(pct, 99.99).toFixed(2);
  }, [dflowPings, heliusPings]);

  const riskLevel = useMemo((): RiskLevel | null => {
    if (dflowPings.length >= 3 && dflowPings.slice(-3).every((p) => !p))
      return "HIGH";
    return networkRisk;
  }, [dflowPings, networkRisk]);

  return { solPrice, priceLoading, uptimePct, riskLevel };
}
