import type { VercelRequest, VercelResponse } from '@vercel/node';

const API_KEY = process.env.DFLOW_API_KEY;
const UPSTREAM = API_KEY
  ? 'https://quote-api.dflow.net/order-status'
  : 'https://dev-quote-api.dflow.net/order-status';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const qs = req.url?.split('?')[1] ?? '';

  try {
    const upstream = await fetch(`${UPSTREAM}?${qs}`, {
      headers: API_KEY ? { 'x-api-key': API_KEY } : {},
      signal: AbortSignal.timeout(10_000),
    });
    const body = await upstream.text();
    res.setHeader('Cache-Control', 'no-store');
    res
      .status(upstream.status)
      .setHeader('Content-Type', upstream.headers.get('content-type') ?? 'application/json');
    return res.send(body);
  } catch {
    return res.status(502).json({ error: 'Failed to reach DFlow' });
  }
}
