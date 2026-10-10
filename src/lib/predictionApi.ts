import { DFLOW_PREDICTION_API, TOKENS } from "../config";
import type { PredictionMarket } from "../config";
import type { Token } from "../types";

const USDC_MINT = TOKENS.USDC.mint;
const OUTCOME_DECIMALS = 6;

type Json = Record<string, unknown>;

async function get<T = Json>(
  path: string,
  params: Record<string, string> = {},
): Promise<T> {
  const url = `${DFLOW_PREDICTION_API}?${new URLSearchParams({ path, ...params })}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(
      new Error(body.error ?? `Prediction API ${res.status}`),
      {
        status: res.status,
        code: body.code as string | undefined,
      },
    );
  }
  return res.json() as Promise<T>;
}

const num = (v: unknown): number | null => {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const price = (v: unknown): number | null => {
  const n = num(v);
  if (n == null) return null;
  return n > 1 ? n / 100 : n;
};

function outcomeToken(side: "YES" | "NO", mint: string, name: string): Token {
  return { symbol: side, name, mint, decimals: OUTCOME_DECIMALS, logo: "" };
}

function toMarket(
  ev: Json,
  m: Json,
  multi: boolean,
  preview = false,
): PredictionMarket | null {
  const accounts = (m.accounts ?? {}) as Record<string, Json>;
  const acct = accounts[USDC_MINT];
  const yesMint = preview ? "" : acct?.yesMint;
  const noMint = preview ? "" : acct?.noMint;
  if (typeof yesMint !== "string" || typeof noMint !== "string") return null;

  const eventTitle = String(ev.title ?? "");
  const title = String(m.title ?? "");
  const sub = String(m.yesSubTitle ?? "");
  const question = multi && sub ? `${eventTitle}: ${sub}` : title || eventTitle;

  const yesBid = price(m.yesBid),
    yesAsk = price(m.yesAsk);
  const noBid = price(m.noBid),
    noAsk = price(m.noAsk);
  const probability = yesAsk ?? yesBid ?? 0.5;

  return {
    id: String(m.ticker),
    question,
    category: String(ev.category ?? "General"),
    resolvesAt: num(m.closeTime)
      ? new Date(Number(m.closeTime) * 1000).toISOString().slice(0, 10)
      : "",
    probability: Math.min(1, Math.max(0, probability)),
    volume24h: num(m.volume24h) ?? num(m.volume) ?? 0,
    yesToken: outcomeToken("YES", yesMint, `${question} — YES`),
    noToken: outcomeToken("NO", noMint, `${question} — NO`),
    live: {
      ticker: String(m.ticker),
      eventTitle,
      settlementMint: USDC_MINT,
      yesBid,
      yesAsk,
      noBid,
      noAsk,
      closeTime: num(m.closeTime),
      status: String(m.status ?? ""),
      redemptionOpen: acct?.redemptionStatus === "open",
      tradable: !preview,
      result: String(m.result ?? ""),
    },
  };
}

export async function fetchLiveMarkets(): Promise<PredictionMarket[]> {
  const data = await get<{ events?: Json[]; preview?: boolean }>(
    "/api/v1/events",
    {
      status: "active",
      withNestedMarkets: "true",
      limit: "200",
    },
  );
  const out: PredictionMarket[] = [];
  for (const ev of data.events ?? []) {
    const markets = (ev.markets ?? []) as Json[];
    for (const m of markets) {
      if (m.status && m.status !== "active") continue;
      const pm = toMarket(ev, m, markets.length > 1, data.preview === true);
      if (pm) out.push(pm);
    }
  }
  // Most liquid first so the default selection is a sensible market.
  return out.sort((a, b) => b.volume24h - a.volume24h);
}

export interface MarketByMint {
  market: PredictionMarket | null;
  side: "YES" | "NO" | null;
  raw: Json;
}

const NOT_A_MARKET = new Set<string>();

export async function fetchMarketByMint(
  mint: string,
): Promise<MarketByMint | null> {
  if (NOT_A_MARKET.has(mint)) return null;
  try {
    const m = await get<Json>(`/api/v1/market/by-mint/${mint}`);
    const acct = ((m.accounts ?? {}) as Record<string, Json>)[USDC_MINT];
    const side =
      acct?.yesMint === mint ? "YES" : acct?.noMint === mint ? "NO" : null;
    if (!side) NOT_A_MARKET.add(mint);
    return { market: toMarket({ title: m.title }, m, false), side, raw: m };
  } catch (err) {
    if ((err as { status?: number }).status === 404) NOT_A_MARKET.add(mint);
    return null;
  }
}
