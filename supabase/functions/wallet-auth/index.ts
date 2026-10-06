import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { json, preflight, readJson } from "../_shared/http.ts";
import { createChallenge, isWallet, issueToken, verifyChallenge } from "../_shared/session.ts";

serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const body = await readJson(req);
  if (!body) return json({ error: "Invalid JSON" }, 400);
  const { action, wallet } = body;
  if (!isWallet(wallet)) return json({ error: "Invalid wallet" }, 400);

  if (action === "challenge") {
    return json(await createChallenge(wallet));
  }

  if (action === "verify") {
    const { nonce, ts, mac, signature } = body;
    if (
      typeof nonce !== "string" || typeof ts !== "number" ||
      typeof mac !== "string" || typeof signature !== "string"
    ) return json({ error: "Invalid payload" }, 400);

    if (!(await verifyChallenge({ wallet, nonce, ts, mac, signature }))) {
      return json({ error: "Signature verification failed" }, 401);
    }
    return json(await issueToken(wallet));
  }

  return json({ error: "Unknown action" }, 400);
});
