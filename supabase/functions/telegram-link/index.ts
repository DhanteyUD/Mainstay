import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { db } from "../_shared/db.ts";
import { json, preflight, readJson, sha256Hex } from "../_shared/http.ts";
import { walletFromRequest } from "../_shared/session.ts";
import { esc, sendMessage, shortAddr } from "../_shared/telegram.ts";

const BOT_USERNAME = Deno.env.get("TELEGRAM_BOT_USERNAME");
const LINK_TTL_MS = 10 * 60 * 1000;
const MIN_REQUEST_GAP_MS = 5_000;

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const wallet = await walletFromRequest(req);
  if (!wallet) return json({ error: "Unauthorized" }, 401);

  const body = await readJson(req);
  const op = body?.op;

  const { data: link } = await db.from("telegram_links").select("*").eq("wallet_address", wallet).maybeSingle();

  if (op === "status") {
    return json({
      linked: !!link?.chat_id,
      username: link?.username ?? null,
      muted: link?.muted ?? false,
    });
  }

  if (op === "create") {
    if (!BOT_USERNAME) return json({ error: "Telegram is not configured" }, 503);
    if (link?.link_requested_at && Date.now() - new Date(link.link_requested_at).getTime() < MIN_REQUEST_GAP_MS) {
      return json({ error: "Please wait a few seconds and try again" }, 429);
    }
    const token = randomToken();
    const { error } = await db.from("telegram_links").upsert({
      wallet_address: wallet,
      link_token_hash: await sha256Hex(token),
      link_expires_at: new Date(Date.now() + LINK_TTL_MS).toISOString(),
      link_requested_at: new Date().toISOString(),
    }, { onConflict: "wallet_address" });
    if (error) return json({ error: "Could not create link" }, 500);
    return json({ url: `https://t.me/${BOT_USERNAME}?start=${token}` });
  }

  if (op === "unlink") {
    await db.from("telegram_links").delete().eq("wallet_address", wallet);
    return json({ ok: true });
  }

  if (op === "test") {
    if (!link?.chat_id) return json({ error: "Telegram is not linked" }, 409);
    const res = await sendMessage(
      link.chat_id,
      `🔔 <b>Mainstay test alert</b>\nLimit order alerts are on for <code>${esc(shortAddr(wallet))}</code>.`,
    );
    return res.ok ? json({ ok: true }) : json({ error: "Could not deliver message" }, 502);
  }

  return json({ error: "Unknown op" }, 400);
});
