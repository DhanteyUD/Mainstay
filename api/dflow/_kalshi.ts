const KALSHI = 'https://api.elections.kalshi.com/trade-api/v2/events';

const dollars = (v: unknown): number | null => {
  const n = Number(v);
  return v == null || v === '' || !Number.isFinite(n) ? null : n;
};

type Json = Record<string, any>;

export async function fetchKalshiPreview(): Promise<{ preview: true; events: Json[] }> {
  const res = await fetch(`${KALSHI}?status=open&with_nested_markets=true&limit=100`, {
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Kalshi ${res.status}`);
  const data = (await res.json()) as { events?: Json[] };

  const events = (data.events ?? []).map((e) => ({
    ticker: e.event_ticker,
    title: e.title,
    category: e.category || 'General',
    markets: ((e.markets ?? []) as Json[])
      .filter((m) => m.status === 'active' && m.market_type !== 'scalar')
      .map((m) => ({
        ticker: m.ticker,
        title: m.title,
        yesSubTitle: m.yes_sub_title,
        status: 'active',
        closeTime: m.close_time ? Math.floor(new Date(m.close_time).getTime() / 1000) : null,
        volume24h: dollars(m.volume_24h_fp),
        yesBid: dollars(m.yes_bid_dollars),
        yesAsk: dollars(m.yes_ask_dollars),
        noBid: dollars(m.no_bid_dollars),
        noAsk: dollars(m.no_ask_dollars),
      })),
  }));
  return { preview: true, events: events.filter((e) => e.markets.length > 0) };
}
