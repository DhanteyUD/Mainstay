import https from 'https';
import http from 'http';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const chunks = [];
  try {
    for await (const chunk of req) {
      chunks.push(chunk);
    }
  } catch {
    return res.status(400).json({ error: 'Failed to read request body' });
  }

  const body = Buffer.concat(chunks).toString('utf-8');

  let header;
  try {
    header = JSON.parse(body.split('\n')[0]);
  } catch {
    return res.status(400).json({ error: 'Invalid envelope' });
  }

  if (!header.dsn) {
    return res.status(400).json({ error: 'Missing DSN in envelope' });
  }

  let dsn;
  try {
    dsn = new URL(header.dsn);
  } catch {
    return res.status(400).json({ error: 'Invalid DSN' });
  }

  const projectId = dsn.pathname.slice(1);
  const sentryUrl = `${dsn.protocol}//${dsn.host}/api/${projectId}/envelope/`;

  try {
    await new Promise((resolve, reject) => {
      const transport = dsn.protocol === 'https:' ? https : http;
      const urlParsed = new URL(sentryUrl);
      const options = {
        hostname: urlParsed.hostname,
        port: urlParsed.port || (dsn.protocol === 'https:' ? 443 : 80),
        path: urlParsed.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-sentry-envelope',
          'Content-Length': Buffer.byteLength(body),
        },
      };

      const proxyReq = transport.request(options, (proxyRes) => {
        res.status(proxyRes.statusCode || 200).end();
        resolve();
      });

      proxyReq.on('error', reject);
      proxyReq.write(body);
      proxyReq.end();
    });
  } catch {
    res.status(500).json({ error: 'Failed to forward to Sentry' });
  }
}
