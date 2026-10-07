import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { db } from "../_shared/db.ts";
import { json, preflight, readJson } from "../_shared/http.ts";
import { walletFromRequest } from "../_shared/session.ts";

const MINT_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const MAX_ACTIVE_PER_WALLET = 5;
const MAX_TRIGGERED_KEPT = 5;
const MAX_LISTED = MAX_ACTIVE_PER_WALLET + MAX_TRIGGERED_KEPT;

serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const wallet = await walletFromRequest(req);
  if (!wallet) return json({ error: "Unauthorized" }, 401);

  const body = await readJson(req);
  if (!body) return json({ error: "Invalid JSON" }, 400);

  if (body.op === "list") {
    const { data, error } = await db
      .from("price_alerts")
      .select(
        "id, token_mint, token_symbol, direction, target_price, created_at, triggered_at",
      )
      .eq("wallet_address", wallet)
      .order("created_at", { ascending: false })
      .limit(MAX_LISTED);
    if (error) return json({ error: "Could not load alerts" }, 500);
    return json({ alerts: data ?? [] });
  }

  if (body.op === "create") {
    const a = (body.alert ?? {}) as Record<string, unknown>;
    const price = Number(a.target_price);
    const symbol =
      typeof a.token_symbol === "string" &&
      a.token_symbol.length > 0 &&
      a.token_symbol.length <= 20
        ? a.token_symbol
        : null;
    const row = {
      wallet_address: wallet,
      token_mint:
        typeof a.token_mint === "string" && MINT_RE.test(a.token_mint)
          ? a.token_mint
          : null,
      token_symbol: symbol,
      direction:
        a.direction === "above" || a.direction === "below" ? a.direction : null,
      target_price: Number.isFinite(price) && price > 0 ? price : null,
    };
    const bad = Object.entries(row).find(([, v]) => v === null);
    if (bad) return json({ error: `Invalid ${bad[0]}` }, 400);

    const { count } = await db
      .from("price_alerts")
      .select("id", { count: "exact", head: true })
      .eq("wallet_address", wallet)
      .is("triggered_at", null);
    if ((count ?? 0) >= MAX_ACTIVE_PER_WALLET)
      return json({ error: "You can have at most 5 active price alerts" }, 429);

    const { data, error } = await db
      .from("price_alerts")
      .insert(row)
      .select("id")
      .single();
    if (error) return json({ error: "Could not save alert" }, 500);

    // Keep only the most recent triggered alerts so history can't grow without bound.
    const { data: old } = await db
      .from("price_alerts")
      .select("id")
      .eq("wallet_address", wallet)
      .not("triggered_at", "is", null)
      .order("triggered_at", { ascending: false })
      .range(MAX_TRIGGERED_KEPT, MAX_TRIGGERED_KEPT + 100);
    if (old?.length)
      await db
        .from("price_alerts")
        .delete()
        .in(
          "id",
          old.map((r) => r.id),
        );

    return json({ ok: true, id: data.id });
  }

  if (body.op === "delete") {
    const id =
      typeof body.id === "string" && UUID_RE.test(body.id) ? body.id : null;
    if (!id) return json({ error: "Invalid id" }, 400);
    const { error } = await db
      .from("price_alerts")
      .delete()
      .eq("id", id)
      .eq("wallet_address", wallet);
    if (error) return json({ error: "Could not delete alert" }, 500);
    return json({ ok: true });
  }

  return json({ error: "Unknown op" }, 400);
});
