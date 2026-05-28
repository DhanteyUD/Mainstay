import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Connection } from "@solana/web3.js";
import { DIALECT_PROXY, SOLANA_RPC_PROXY, TOKENS } from "../config";
import type { RiskLevel } from "../types";

const SOL_MINT = TOKENS.SOL.mint;

async function fetchSolPrice(): Promise<number | null> {
  try {
    const res = await fetch(
      `${DIALECT_PROXY}/api.jup.ag/price/v3?ids=${SOL_MINT}`,
    );
    if (res.ok) {
      const data = await res.json();
      const price = data[SOL_MINT]?.usdPrice;
      if (price != null) return price;
    }
  } catch {
    /* fallthrough */
  }

  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
    );
    if (res.ok) {
      const data = await res.json();
      if (data?.solana?.usd != null) return data.solana.usd;
    }
  } catch {
    /* fallthrough */
  }

  try {
    const res = await fetch(
      "https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT",
    );
    if (res.ok) {
      const data = await res.json();
      const price = parseFloat(data?.price);
      if (!isNaN(price)) return price;
    }
  } catch {
    /* non-fatal */
  }

  return null;
}

async function fetchNetworkRisk(): Promise<RiskLevel> {
  try {
    const connection = new Connection(SOLANA_RPC_PROXY, {
      commitment: "confirmed",
      wsEndpoint: "",
    });
    const samples = await connection.getRecentPerformanceSamples(1);
    if (samples?.length > 0) {
      const tps = samples[0].numTransactions / samples[0].samplePeriodSecs;
      return tps > 3000 ? "HIGH" : tps > 1500 ? "MEDIUM" : "LOW";
    }
  } catch {
    /* fallthrough */
  }
  return "LOW";
}

export function useNetworkStats() {
  const [dflowPings, setDflowPings] = useState<boolean[]>([]);
  const [heliusPings, setHeliusPings] = useState<boolean[]>([]);

  const { data: solPrice = null, isLoading: priceLoading } = useQuery({
    queryKey: ["sol-price"],
    queryFn: async () => {
      const price = await fetchSolPrice();
      setDflowPings((prev) => [...prev.slice(-19), price !== null]);
      return price;
    },
    refetchInterval: 30_000,
    staleTime: 25_000,
  });

  const { data: networkRisk = null } = useQuery({
    queryKey: ["network-risk"],
    queryFn: async () => {
      const risk = await fetchNetworkRisk();
      setHeliusPings((prev) => [...prev.slice(-19), true]);
      return risk;
    },
    refetchInterval: 15_000,
    staleTime: 10_000,
  });

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
