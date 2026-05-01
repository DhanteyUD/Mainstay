import https from 'https';

const UPSTREAM = 'https://api.eitherway.ai/api/solana/rpc';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Solana-Client');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const chunks = [];
  try {
    for await (const chunk of req) {
      chunks.push(chunk);
    }
  } catch {
    return res.status(400).json({ error: 'Failed to read request body' });
  }

  const body = chunks.length ? Buffer.concat(chunks) : null;

  const forwardHeaders = {};
  for (const [key, value] of Object.entries(req.headers)) {
    const lower = key.toLowerCase();
    if (lower === 'origin' || lower === 'referer' || lower === 'host') continue;
    forwardHeaders[key] = value;
  }
  if (body) {
    forwardHeaders['content-length'] = Buffer.byteLength(body);
  }

  try {
    await new Promise((resolve, reject) => {
      const url = new URL(UPSTREAM);
      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: req.method,
        headers: forwardHeaders,
      };

      const proxyReq = https.request(options, (proxyRes) => {
        res.status(proxyRes.statusCode || 200);
        for (const [key, value] of Object.entries(proxyRes.headers)) {
          if (key.toLowerCase() === 'access-control-allow-origin') continue;
          res.setHeader(key, value);
        }
        proxyRes.pipe(res);
        proxyRes.on('end', resolve);
      });

      proxyReq.on('error', reject);
      if (body) proxyReq.write(body);
      proxyReq.end();
    });
  } catch {
    res.status(502).json({ error: 'Failed to reach upstream RPC' });
  }
}
