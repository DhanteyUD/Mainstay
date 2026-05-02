const RESEND_API_KEY = process.env.RESEND_API_KEY;
const APP_URL = process.env.VITE_APP_URL ?? "https://mainstay.pro";
const FROM_EMAIL = "Mainstay <noreply@mainstay.pro>";

function buildEmailHtml(email, appUrl) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're on the Mainstay waitlist</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Poppins:wght@400;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #0d0d0d;
      background-image:
        linear-gradient(rgba(0,229,255,0.015) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,229,255,0.015) 1px, transparent 1px);
      background-size: 40px 40px;
      font-family: 'Syne', 'Poppins', sans-serif;
      color: #e2e8f0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper { max-width: 560px; margin: 40px auto; padding: 0 16px; }
    .card { background: #111111; border: 1px solid #1e2631; border-radius: 16px; overflow: hidden; }
    .header { padding: 20px 28px; border-bottom: 1px solid #1e2631; display: flex; align-items: center; gap: 10px; }
    .logo-img { width: 35px; height: 35px; object-fit: contain; margin-right: 5px; }
    .header-label { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; color: #22d3ee; text-transform: uppercase; }
    .body { padding: 28px; }
    .hero { background: rgba(34,211,238,0.06); border: 1px solid rgba(34,211,238,0.2); border-radius: 12px; padding: 20px 24px; margin-bottom: 24px; }
    .hero-title { font-size: 18px; font-weight: 700; color: #22d3ee; margin-bottom: 8px; letter-spacing: 0.04em; }
    .hero-subtitle { font-size: 13px; color: #94a3b8; line-height: 1.6; }
    .section-label { font-size: 10px; font-weight: 700; letter-spacing: 0.14em; color: #475569; text-transform: uppercase; margin-bottom: 12px; }
    .feature-list { list-style: none; margin-bottom: 24px; }
    .feature-list li { display: flex; align-items: flex-start; gap: 10px; padding: 8px 0; font-size: 12px; color: #94a3b8; line-height: 1.5; border-bottom: 1px solid #1e2631; }
    .feature-list li:last-child { border-bottom: none; }
    .bullet { width: 4px; height: 4px; border-radius: 50%; background: #475569; margin-top: 5px; flex-shrink: 0; margin-right: 5px; }
    .divider { height: 1px; background: #1e2631; margin: 24px 0; }
    .confirmed-block { background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.25); border-radius: 10px; padding: 14px 18px; display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .check-icon { font-size: 16px; color: #22c55e; flex-shrink: 0; margin-right: 5px; }
    .confirmed-text { font-size: 12px; color: #86efac; line-height: 1.5; }
    .confirmed-email { color: #22c55e; font-weight: 700; }
    .cta-button { display: inline-block; padding: 12px 24px; background: #22d3ee; color: #000; font-family: 'Syne', 'Poppins', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; text-decoration: none; border-radius: 8px; }
    .footer { padding: 20px 28px; border-top: 1px solid #1e2631; text-align: center; }
    .footer-text { font-size: 11px; color: #334155; line-height: 1.6; }
    .footer-text a { color: #22d3ee; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <img src="https://res.cloudinary.com/dhantey/image/upload/v1777367316/Mainstay/mainstay-logo_vydcnr.png" class="logo-img" alt="Mainstay" />
        <span class="header-label">Mainstay &mdash; Prediction Markets</span>
      </div>
      <div class="body">
        <div class="hero">
          <div class="hero-title">You're on the list.</div>
          <div class="hero-subtitle">
            We'll notify you the moment Mainstay Prediction Markets goes live.
            Expect MEV-protected outcome token trades — same DFlow protection as spot swaps.
          </div>
        </div>
        <div class="confirmed-block">
          <span class="check-icon">&#10003;</span>
          <div class="confirmed-text">
            Waitlist confirmed for <span class="confirmed-email">${email}</span>.<br />
            You'll receive a single email when we launch — no spam, ever.
          </div>
        </div>
        <div class="section-label">What's coming</div>
        <ul class="feature-list">
          <li><span class="bullet"></span>JIT auction routing for outcome token trades</li>
          <li><span class="bullet"></span>Front-running and sandwich attack prevention</li>
          <li><span class="bullet"></span>Same DFlow MEV protection as spot swaps</li>
          <li><span class="bullet"></span>Live market resolution feeds on-chain</li>
        </ul>
        <div class="divider"></div>
        <p style="font-size:12px;color:#94a3b8;margin-bottom:16px;line-height:1.6;">
          In the meantime, try MEV-protected spot swaps on Solana — already live today.
        </p>
        <a href="${appUrl}" class="cta-button">Try Spot Swaps</a>
      </div>
      <div class="footer">
        <p class="footer-text">
          You're receiving this because you requested to be on the waitlist at
          <a href="${appUrl}">${appUrl.replace(/^https?:\/\//, '')}</a>.<br />
          &copy; ${new Date().getFullYear()} Mainstay. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email } = req.body ?? {};
  if (!email) return res.status(400).json({ error: "Email is required" });

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set");
    return res.status(500).json({ error: "Email service not configured" });
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [email],
      subject: "You're on the Mainstay waitlist",
      html: buildEmailHtml(email, APP_URL),
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("Resend error:", err);
    return res.status(500).json({ error: "Failed to send email" });
  }

  return res.status(200).json({ success: true });
}
