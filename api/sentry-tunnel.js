export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
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

  const dsn = new URL(header.dsn);
  const projectId = dsn.pathname.slice(1);
  const sentryUrl = `${dsn.protocol}//${dsn.host}/api/${projectId}/envelope/`;

  const response = await fetch(sentryUrl, {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/x-sentry-envelope' },
  });

  res.status(response.status).end();
}
