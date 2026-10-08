# Telegram alerts

Server-side alerts that work even when Mainstay is closed: limit-order events (target hit, executed, failed) and one-shot **price alerts** on any token.

```
Browser ──signs in with wallet──► wallet-auth ──► session token (12h)
   │
   ├─ create / cancel / update orders ─► orders (verifies token + lifecycle) ─► limitOrders
   ├─ create / delete price alerts ───► price-alerts (verifies token) ─► price_alerts
   └─ Connect Telegram ───────────────► telegram-link ─► t.me/<bot>?start=<one-time token>
                                                              │
Telegram ──/start <token>──► telegram-webhook ◄───────────────┘ (binds chat to wallet)

pg_cron (every minute) ─► notifier
   ├─ watch():    batched Jupiter prices for pending orders and active price alerts of linked wallets → "target hit" / "price alert"
   └─ dispatch(): sends outbox rows to Telegram (retries, dedupe, auto-unlink on block)

limitOrders status → executed/failed ─(SQL trigger)─► notification_outbox
```

Why it is built this way:

- **No spoofable "send a message" endpoint.** `executed`/`failed` alerts come from a database trigger and `target hit` from the server-side watcher. The browser can't make the bot send anything.
- **Wallet-signed everything.** Orders and Telegram links are tied to a wallet signature. Nobody can subscribe to another wallet's alerts or edit another wallet's orders.
- **Efficient.** One batched price request per minute covers every user, and only wallets with an active link are watched.
- The bot can *alert* but not *execute*: the wallet still has to sign the swap in the browser.

## Setup checklist

### 1. Telegram
1. Open [@BotFather](https://t.me/BotFather) → `/newbot` → pick a name and a username (e.g. `MainstayAlertsBot`).
2. Copy the **bot token** and note the **username** (without `@`).
3. Optional: `/setdescription`, `/setuserpic`, and `/setcommands`:
   ```
   orders - Your pending limit orders
   alerts - Your active price alerts
   mute - Pause alerts
   unmute - Resume alerts
   stop - Disconnect this chat
   ```

### 2. Supabase
1. **Extensions** (Dashboard → Database → Extensions): enable `pg_cron`, `pg_net`, `supabase_vault`.
2. **Migrations**: run `supabase db push` (or paste `supabase/migrations/20261006000000_notifications.sql` and then `20261007000000_price_alerts.sql` into the SQL editor).
3. **Generate secrets** (run locally, keep the output):
   ```bash
   openssl rand -hex 32   # SESSION_SECRET
   openssl rand -hex 32   # TELEGRAM_WEBHOOK_SECRET
   openssl rand -hex 32   # CRON_SECRET
   ```
4. **Set function secrets**:
   ```bash
   supabase secrets set \
     SESSION_SECRET=... \
     TELEGRAM_BOT_TOKEN=... \
     TELEGRAM_BOT_USERNAME=MainstayAlertsBot \
     TELEGRAM_WEBHOOK_SECRET=... \
     CRON_SECRET=... \
     APP_URL=https://mainstay.pro \
     ALLOWED_ORIGIN=https://mainstay.pro
   ```
   `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided to functions automatically.
5. **Deploy the functions.** All use their own auth (session token, webhook secret or cron secret), so skip the gateway JWT check:
   ```bash
   supabase functions deploy wallet-auth orders price-alerts telegram-link telegram-webhook notifier --no-verify-jwt
   ```

### 3. Connect Telegram to the function
Register the webhook (replace the three values):
```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -d "url=https://<PROJECT_REF>.supabase.co/functions/v1/telegram-webhook" \
  -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>" \
  -d "allowed_updates=[\"message\"]"
```
Check it with `curl https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo`.

### 4. Schedule the notifier
Edit and run `supabase/sql/schedule_notifier.sql` in the SQL editor (needs your project ref and the same `CRON_SECRET`). Confirm it ticks:
```sql
select * from cron.job_run_details order by start_time desc limit 5;
```

### 5. Vercel
Nothing new is required for this feature. The frontend already uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; make sure both are set for Production. Deploy the frontend.

### 6. Lock down order writes (do this last)
After the new frontend is live and orders sync correctly, run `supabase/sql/lockdown_order_writes.sql`. It removes insert/update/delete on the order tables from the public anon key. Until you run it, the old direct-write path is still open.

## Verify end to end
1. Connect wallet → Limit tab → **Connect Telegram**, sign the message, tap **Start** in Telegram. The card turns green. Press **Test**.
2. Place an order with a target just past the current price, then close the tab. Within about a minute Telegram says the target was hit.
3. Re-open Mainstay and execute the order. You should get an executed (or failed) message.
4. Logs: `supabase functions logs notifier`, and `select * from notification_outbox order by id desc limit 20;`.

## Operations notes
- Delivery for `executed`/`failed` can lag up to a minute (cron interval).
- A user who blocks the bot is unlinked automatically; they can reconnect any time.
- Failed sends retry up to 5 times, then stay in the outbox with `sent_at` null for inspection.
- Only mainnet orders trigger "target hit" alerts. Devnet orders are not watched.
- Price alerts are one-shot: each fires once when the token crosses the target, then shows as triggered in the app. Up to 5 active alerts per wallet (and the 5 most recent triggered ones are kept). Direction (≥ / ≤) is chosen automatically from the current price. Muted or unlinked wallets are not watched.
- Rotate `SESSION_SECRET` to sign everyone out.
