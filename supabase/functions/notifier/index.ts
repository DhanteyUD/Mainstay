import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { db } from "../_shared/db.ts";
import { timingSafeEqual } from "../_shared/http.ts";
import { esc, sendMessage, shortAddr } from "../_shared/telegram.ts";

const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";
const APP_URL = Deno.env.get("APP_URL") ?? "https://mainstay.pro";
const PRICE_API = "https://lite-api.jup.ag/price/v3";
const DEADLINE_MS = 45_000;

interface WatchRow {
  id: string;
  wallet_address: string;
  direction: "above" | "below";
  input_token_mint: string;
  input_token_symbol: string;
  output_token_symbol: string;
  input_amount: string;
  target_price: number;
}

async function fetchPrices(mints: string[]): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  for (let i = 0; i < mints.length; i += 50) {
    const ids = mints.slice(i, i + 50).join(",");
    try {
      const res = await fetch(`${PRICE_API}?ids=${ids}`, {
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      for (const [mint, v] of Object.entries<{ usdPrice?: number }>(data)) {
        if (typeof v?.usdPrice === "number") out[mint] = v.usdPrice;
      }
    } catch (err) {
      console.warn("price fetch failed", err);
    }
  }
  return out;
}

// Step 1: find pending orders (of linked wallets only) whose target was hit.
async function watch(): Promise<number> {
  const { data, error } = await db.rpc("pending_orders_to_watch", {
    max_rows: 1000,
  });
  if (error || !data?.length) return 0;
  const orders = data as WatchRow[];

  const prices = await fetchPrices([
    ...new Set(orders.map((o) => o.input_token_mint)),
  ]);
  let queued = 0;

  for (const o of orders) {
    const price = prices[o.input_token_mint];
    if (price == null) continue;
    const hit =
      o.direction === "above"
        ? price >= o.target_price
        : price <= o.target_price;
    if (!hit) continue;

    // notified_at IS NULL makes this a once-only claim even if cron runs overlap.
    const { data: claimed } = await db
      .from("limitOrders")
      .update({ notified_at: new Date().toISOString() })
      .eq("id", o.id)
      .eq("status", "pending")
      .is("notified_at", null)
      .select("id");
    if (!claimed?.length) continue;

    await db.from("notification_outbox").upsert(
      {
        wallet_address: o.wallet_address,
        order_id: o.id,
        event: "target_hit",
        payload: {
          inSymbol: o.input_token_symbol,
          outSymbol: o.output_token_symbol,
          amount: o.input_amount,
          targetPrice: o.target_price,
          direction: o.direction,
          price,
        },
      },
      { onConflict: "order_id,event", ignoreDuplicates: true },
    );
    queued++;
  }
  return queued;
}

interface AlertRow {
  id: string;
  wallet_address: string;
  token_mint: string;
  token_symbol: string;
  direction: "above" | "below";
  target_price: number;
}

// Step 1b: one-shot price alerts on watched tokens (linked, unmuted wallets only).
async function watchPriceAlerts(): Promise<number> {
  const { data, error } = await db.rpc("active_price_alerts_to_watch", {
    max_rows: 1000,
  });
  if (error) {
    console.error("active_price_alerts_to_watch failed", error.message);
    return 0;
  }
  if (!data?.length) return 0;
  const alerts = data as AlertRow[];

  const prices = await fetchPrices([
    ...new Set(alerts.map((a) => a.token_mint)),
  ]);
  console.log(
    `price alerts: watching ${alerts.length}, priced ${Object.keys(prices).length}`,
  );
  let queued = 0;

  for (const a of alerts) {
    const price = prices[a.token_mint];
    if (price == null) continue;
    const target = Number(a.target_price);
    const hit = a.direction === "above" ? price >= target : price <= target;
    if (!hit) continue;

    // triggered_at IS NULL makes this a once-only claim even if cron runs overlap.
    const { data: claimed } = await db
      .from("price_alerts")
      .update({ triggered_at: new Date().toISOString() })
      .eq("id", a.id)
      .is("triggered_at", null)
      .select("id");
    if (!claimed?.length) continue;

    const { error: queueError } = await db.from("notification_outbox").upsert(
      {
        wallet_address: a.wallet_address,
        order_id: a.id,
        event: "price_alert",
        payload: {
          symbol: a.token_symbol,
          targetPrice: target,
          direction: a.direction,
          price,
        },
      },
      { onConflict: "order_id,event", ignoreDuplicates: true },
    );
    if (queueError) {
      // Un-claim so the alert is retried next tick instead of being lost silently.
      console.error("price alert enqueue failed", queueError.message);
      await db
        .from("price_alerts")
        .update({ triggered_at: null })
        .eq("id", a.id);
      continue;
    }
    queued++;
  }
  return queued;
}

interface OutboxRow {
  id: number;
  wallet_address: string;
  event: "target_hit" | "executed" | "failed" | "price_alert";
  payload: Record<string, unknown>;
}

const fmt = (n: unknown) =>
  esc(Number(n).toLocaleString("en-US", { maximumFractionDigits: 6 }));

function render(row: OutboxRow): string {
  const p = row.payload;
  if (row.event === "price_alert") {
    const up = p.direction === "above";
    return [
      `${up ? "📈" : "📉"} <b>Price alert</b>`,
      `${esc(p.symbol)} is <b>$${fmt(p.price)}</b> (${up ? "≥" : "≤"} $${fmt(p.targetPrice)})`,
      "",
      `Open <a href="${esc(APP_URL)}">Mainstay</a> to trade.`,
    ].join("\n");
  }
  const pair = `${esc(p.inSymbol)} → ${esc(p.outSymbol)}`;
  const amount = `${esc(p.amount)} ${esc(p.inSymbol)}`;
  const cmp = p.direction === "above" ? "≥" : "≤";

  if (row.event === "target_hit") {
    return [
      "🎯 <b>Limit order target hit</b>",
      `${esc(p.inSymbol)} is <b>$${fmt(p.price)}</b> (target ${cmp} $${fmt(p.targetPrice)})`,
      `${pair} · ${amount}`,
      "",
      `Open <a href="${esc(APP_URL)}">Mainstay</a> with your wallet to execute it.`,
    ].join("\n");
  }
  if (row.event === "executed") {
    const link =
      typeof p.explorerUrl === "string" && p.explorerUrl.startsWith("https://")
        ? `\n<a href="${esc(p.explorerUrl)}">View on Solscan</a>`
        : "";
    return `✅ <b>Limit order executed</b>\n${pair} · ${amount}${link}`;
  }
  return `⚠️ <b>Limit order failed</b>\n${pair} · ${amount}\n${esc(p.error ?? "Execution failed")}`;
}

// Step 2: deliver queued messages.
async function dispatch(
  deadline: number,
): Promise<{ sent: number; failed: number }> {
  let sent = 0,
    failed = 0;

  while (Date.now() < deadline) {
    const { data, error } = await db.rpc("claim_outbox", { batch: 25 });
    if (error || !data?.length) break;
    const rows = data as OutboxRow[];

    const { data: links } = await db
      .from("telegram_links")
      .select("wallet_address, chat_id, muted")
      .in("wallet_address", [...new Set(rows.map((r) => r.wallet_address))]);
    const byWallet = new Map((links ?? []).map((l) => [l.wallet_address, l]));

    for (const row of rows) {
      const link = byWallet.get(row.wallet_address);
      const markDone = () =>
        db
          .from("notification_outbox")
          .update({ sent_at: new Date().toISOString(), locked_until: null })
          .eq("id", row.id);

      // Nobody to notify (never linked, unlinked, or muted): drop it quietly.
      if (!link?.chat_id || link.muted) {
        await markDone();
        continue;
      }

      const res = await sendMessage(link.chat_id, render(row));
      if (res.ok) {
        await markDone();
        sent++;
        continue;
      }

      failed++;
      if (res.blocked) {
        // User blocked the bot or deleted the chat: stop messaging it.
        await db.from("telegram_links").delete().eq("chat_id", link.chat_id);
        await markDone();
      } else if (res.retryAfter) {
        await db
          .from("notification_outbox")
          .update({
            attempts: 0,
            locked_until: new Date(
              Date.now() + res.retryAfter * 1000,
            ).toISOString(),
          })
          .eq("id", row.id);
      } else {
        console.warn(
          `send failed for ${shortAddr(row.wallet_address)}: ${res.error}`,
        );
      }
    }
  }
  return { sent, failed };
}

serve(async (req) => {
  if (req.method !== "POST")
    return new Response("method not allowed", { status: 405 });
  if (
    !CRON_SECRET ||
    !timingSafeEqual(req.headers.get("x-cron-secret") ?? "", CRON_SECRET)
  ) {
    return new Response("forbidden", { status: 403 });
  }

  const deadline = Date.now() + DEADLINE_MS;
  const queued = (await watch()) + (await watchPriceAlerts());
  const result = await dispatch(deadline);
  return new Response(JSON.stringify({ queued, ...result }), {
    headers: { "Content-Type": "application/json" },
  });
});
