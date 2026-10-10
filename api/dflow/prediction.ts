import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchKalshiPreview } from './_kalshi';

const API_KEY = process.env.DFLOW_API_KEY;
const UPSTREAM = 'https://prediction-markets-api.dflow.net';

const MINT = '[1-9A-HJ-NP-Za-km-z]{32,44}';
const ALLOWED = [
  /^\/api\/v1\/events$/,
  /^\/api\/v1\/tags_by_categories$/,
  /^\/api\/v1\/series$/,
  new RegExp(`^/api/v1/market/by-mint/${MINT}$`),
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const params = new URLSearchParams(req.url?.split('?')[1] ?? '');
  const path = params.get('path') ?? '';
  params.delete('path');
  if (!ALLOWED.some((re) => re.test(path))) {
    return res.status(400).json({ error: 'Path not allowed' });
  }

  if (!API_KEY) {
    if (path === '/api/v1/events') {
      try {
        res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
        return res.status(200).json(await fetchKalshiPreview());
      } catch {
        return res.status(502).json({ error: 'Failed to reach the market data provider' });
      }
    }
    return res.status(503).json({
      code: 'no_api_key',
      error: 'Prediction markets need DFLOW_API_KEY to be set on the server.',
    });
  }

  try {
    const upstream = await fetch(`${UPSTREAM}${path}?${params}`, {
      headers: { 'x-api-key': API_KEY },
      signal: AbortSignal.timeout(15_000),
    });
    if (upstream.status === 401 || upstream.status === 403) {
      if (path === '/api/v1/events') {
        return res.status(200).json(await fetchKalshiPreview());
      }
      return res.status(502).json({
        code: 'key_rejected',
        error: 'DFlow rejected the API key for prediction market data.',
      });
    }
    const body = await upstream.text();
    res.setHeader('Cache-Control', upstream.ok ? 'public, s-maxage=10, stale-while-revalidate=30' : 'no-store');
    res
      .status(upstream.status)
      .setHeader('Content-Type', upstream.headers.get('content-type') ?? 'application/json');
    return res.send(body);
  } catch {
    return res.status(502).json({ error: 'Failed to reach DFlow' });
  }
}
