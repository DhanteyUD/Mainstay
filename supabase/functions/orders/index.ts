import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { db } from "../_shared/db.ts";
import { json, preflight, readJson } from "../_shared/http.ts";
import { walletFromRequest } from "../_shared/session.ts";

const TABLES = { mainnet: "limitOrders", devnet: "devLimitOrders" } as const;
const MINT_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const ID_RE = /^lo_[0-9a-f-]{36}$/;
const MAX_PENDING_PER_WALLET = 50;

const TRANSITIONS: Record<string, string[]> = {
  pending: ["cancelled", "executing"],
  executing: ["executed", "failed"],
};

const str = (v: unknown, max: number) =>
  typeof v === "string" && v.length > 0 && v.length <= max ? v : null;
const decimals = (v: unknown) =>
  typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 18 ? v : null;

function validateInsert(o: Record<string, unknown>, wallet: string, network: string) {
  const amount = Number(o.input_amount);
  const price = Number(o.target_price);
  const row = {
    id: typeof o.id === "string" && ID_RE.test(o.id) ? o.id : null,
    wallet_address: wallet,
    network,
    status: "pending",
    direction: o.direction === "above" || o.direction === "below" ? o.direction : null,
    input_token_mint: typeof o.input_token_mint === "string" && MINT_RE.test(o.input_token_mint) ? o.input_token_mint : null,
    input_token_symbol: str(o.input_token_symbol, 20),
    input_token_decimals: decimals(o.input_token_decimals),
    output_token_mint: typeof o.output_token_mint === "string" && MINT_RE.test(o.output_token_mint) ? o.output_token_mint : null,
    output_token_symbol: str(o.output_token_symbol, 20),
    output_token_decimals: decimals(o.output_token_decimals),
    input_amount: Number.isFinite(amount) && amount > 0 ? String(o.input_amount) : null,
    target_price: Number.isFinite(price) && price > 0 ? price : null,
  };
  const bad = Object.entries(row).find(([, v]) => v === null);
  return bad ? { error: `Invalid ${bad[0]}` } : { row };
}

serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const wallet = await walletFromRequest(req);
  if (!wallet) return json({ error: "Unauthorized" }, 401);

  const body = await readJson(req);
  if (!body) return json({ error: "Invalid JSON" }, 400);
  const network = body.network === "devnet" ? "devnet" : body.network === "mainnet" ? "mainnet" : null;
  if (!network) return json({ error: "Invalid network" }, 400);
  const table = TABLES[network];

  if (body.op === "insert") {
    const parsed = validateInsert((body.order ?? {}) as Record<string, unknown>, wallet, network);
    if ("error" in parsed) return json({ error: parsed.error }, 400);

    const { count } = await db.from(table).select("id", { count: "exact", head: true })
      .eq("wallet_address", wallet).eq("status", "pending");
    if ((count ?? 0) >= MAX_PENDING_PER_WALLET) {
      return json({ error: "Too many pending orders" }, 429);
    }

    const { error } = await db.from(table).insert(parsed.row);
    if (error) return json({ error: "Could not save order" }, 500);
    return json({ ok: true });
  }

  if (body.op === "update") {
    const id = typeof body.id === "string" && ID_RE.test(body.id) ? body.id : null;
    const patch = (body.patch ?? {}) as Record<string, unknown>;
    const next = typeof patch.status === "string" ? patch.status : null;
    if (!id || !next) return json({ error: "Invalid update" }, 400);

    const { data: current } = await db.from(table).select("status")
      .eq("id", id).eq("wallet_address", wallet).maybeSingle();
    if (!current) return json({ error: "Order not found" }, 404);
    if (!TRANSITIONS[current.status]?.includes(next)) {
      return json({ error: `Cannot move order from ${current.status} to ${next}` }, 409);
    }

    const update: Record<string, unknown> = { status: next };
    if (next === "executed") {
      update.executed_at = new Date().toISOString();
      update.signature = str(patch.signature, 120);
      update.explorer_url = str(patch.explorer_url, 300);
    }
    if (next === "failed") update.error = str(patch.error, 200) ?? "Order execution failed";

    // The status guard makes the transition atomic if two tabs race.
    const { data: updated, error } = await db.from(table).update(update)
      .eq("id", id).eq("wallet_address", wallet).eq("status", current.status).select("id");
    if (error) return json({ error: "Could not update order" }, 500);
    if (!updated?.length) return json({ error: "Order changed, retry" }, 409);
    return json({ ok: true });
  }

  return json({ error: "Unknown op" }, 400);
});
