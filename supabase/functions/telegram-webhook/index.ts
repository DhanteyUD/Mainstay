import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { db } from "../_shared/db.ts";
import { sha256Hex, timingSafeEqual } from "../_shared/http.ts";
import { esc, sendMessage, shortAddr } from "../_shared/telegram.ts";

const SECRET = Deno.env.get("TELEGRAM_WEBHOOK_SECRET") ?? "";
const APP_URL = Deno.env.get("APP_URL") ?? "https://mainstay.pro";

const HELP = [
  "<b>Mainstay alerts</b>",
  "",
  `Connect your wallet from the Limit tab at ${esc(APP_URL)} to receive alerts here.`,
  "",
  "/orders – your pending orders",
  "/alerts – your active price alerts",
  "/mute – pause alerts",
  "/unmute – resume alerts",
  "/stop – disconnect this chat",
].join("\n");

async function handle(chatId: number, username: string | null, text: string) {
  const [cmdRaw, arg] = text.trim().split(/\s+/, 2);
  const cmd = cmdRaw.split("@")[0].toLowerCase();

  if (cmd === "/start") {
    if (!arg) return sendMessage(chatId, HELP);
    const hash = await sha256Hex(arg);
    const { data: link } = await db
      .from("telegram_links")
      .select("wallet_address, link_expires_at")
      .eq("link_token_hash", hash)
      .maybeSingle();
    if (
      !link ||
      !link.link_expires_at ||
      new Date(link.link_expires_at) < new Date()
    ) {
      return sendMessage(
        chatId,
        "This link has expired. Open Mainstay and tap <b>Connect Telegram</b> again.",
      );
    }
    await db
      .from("telegram_links")
      .update({
        chat_id: chatId,
        username,
        linked_at: new Date().toISOString(),
        link_token_hash: null,
        link_expires_at: null,
        muted: false,
      })
      .eq("wallet_address", link.wallet_address);
    return sendMessage(
      chatId,
      `✅ <b>Connected</b>\nWallet <code>${esc(shortAddr(link.wallet_address))}</code> will now send limit order and price alerts here.`,
    );
  }

  if (cmd === "/stop") {
    await db.from("telegram_links").delete().eq("chat_id", chatId);
    return sendMessage(
      chatId,
      "Disconnected. You will no longer receive alerts.",
    );
  }

  if (cmd === "/mute" || cmd === "/unmute") {
    await db
      .from("telegram_links")
      .update({ muted: cmd === "/mute" })
      .eq("chat_id", chatId);
    return sendMessage(
      chatId,
      cmd === "/mute"
        ? "🔕 Alerts paused. Send /unmute to resume."
        : "🔔 Alerts resumed.",
    );
  }

  if (cmd === "/orders") {
    const { data: links } = await db
      .from("telegram_links")
      .select("wallet_address")
      .eq("chat_id", chatId);
    if (!links?.length)
      return sendMessage(chatId, "No wallet is connected to this chat.");
    const { data: orders } = await db
      .from("limitOrders")
      .select(
        "input_token_symbol, output_token_symbol, direction, target_price, input_amount, wallet_address",
      )
      .in(
        "wallet_address",
        links.map((l) => l.wallet_address),
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(10);
    if (!orders?.length) return sendMessage(chatId, "No pending limit orders.");
    const lines = orders.map(
      (o) =>
        `• ${esc(o.input_amount)} ${esc(o.input_token_symbol)} → ${esc(o.output_token_symbol)} when ${esc(o.input_token_symbol)} ${o.direction === "above" ? "≥" : "≤"} $${esc(o.target_price)}`,
    );
    return sendMessage(chatId, `<b>Pending orders</b>\n${lines.join("\n")}`);
  }

  if (cmd === "/alerts") {
    const { data: links } = await db
      .from("telegram_links")
      .select("wallet_address")
      .eq("chat_id", chatId);
    if (!links?.length)
      return sendMessage(chatId, "No wallet is connected to this chat.");
    const { data: alerts } = await db
      .from("price_alerts")
      .select("token_symbol, direction, target_price")
      .in(
        "wallet_address",
        links.map((l) => l.wallet_address),
      )
      .is("triggered_at", null)
      .order("created_at", { ascending: false })
      .limit(20);
    if (!alerts?.length)
      return sendMessage(
        chatId,
        "No active price alerts. Add one from the Limit tab.",
      );
    const lines = alerts.map(
      (a) =>
        `• ${esc(a.token_symbol)} ${a.direction === "above" ? "≥" : "≤"} $${esc(a.target_price)}`,
    );
    return sendMessage(
      chatId,
      `<b>Active price alerts</b>\n${lines.join("\n")}`,
    );
  }

  return sendMessage(chatId, HELP);
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");
  // Telegram echoes the secret we passed to setWebhook on every delivery.
  const header = req.headers.get("x-telegram-bot-api-secret-token") ?? "";
  if (!SECRET || !timingSafeEqual(header, SECRET))
    return new Response("forbidden", { status: 403 });

  try {
    const update = await req.json();
    const msg = update?.message;
    // Private chats only, so the bot can't be used to link a group by accident.
    if (msg?.chat?.type === "private" && typeof msg.text === "string") {
      await handle(msg.chat.id, msg.from?.username ?? null, msg.text);
    }
  } catch (err) {
    console.error("webhook error", err);
  }
  // Always 200 so Telegram doesn't retry a poisoned update forever.
  return new Response("ok");
});
