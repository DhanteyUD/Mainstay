import { jwtVerify, SignJWT } from "npm:jose@5";
import nacl from "npm:tweetnacl@1";
import bs58 from "npm:bs58@5";

const SECRET = Deno.env.get("SESSION_SECRET");
const key = () => {
  if (!SECRET || SECRET.length < 32) throw new Error("SESSION_SECRET must be set (32+ chars)");
  return new TextEncoder().encode(SECRET);
};

const CHALLENGE_TTL_MS = 5 * 60 * 1000;
export const SESSION_TTL_S = 12 * 60 * 60;

const WALLET_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
export const isWallet = (v: unknown): v is string =>
  typeof v === "string" && WALLET_RE.test(v);

async function hmacHex(data: string): Promise<string> {
  const k = await crypto.subtle.importKey(
    "raw", key(), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(data));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function challengeMessage(wallet: string, nonce: string, ts: number): string {
  return [
    "Sign in to Mainstay",
    "",
    "This proves you own this wallet. It does not cost anything or move funds.",
    `Wallet: ${wallet}`,
    `Nonce: ${nonce}`,
    `Issued: ${new Date(ts).toISOString()}`,
  ].join("\n");
}

// Stateless challenge: the server signs (wallet|nonce|ts) so it needs no storage.
export async function createChallenge(wallet: string) {
  const nonce = crypto.randomUUID();
  const ts = Date.now();
  const mac = await hmacHex(`${wallet}|${nonce}|${ts}`);
  return { message: challengeMessage(wallet, nonce, ts), nonce, ts, mac };
}

export async function verifyChallenge(input: {
  wallet: string; nonce: string; ts: number; mac: string; signature: string;
}): Promise<boolean> {
  const { wallet, nonce, ts, mac, signature } = input;
  if (Math.abs(Date.now() - ts) > CHALLENGE_TTL_MS) return false;
  const expected = await hmacHex(`${wallet}|${nonce}|${ts}`);
  if (expected !== mac) return false;
  try {
    const sig = Uint8Array.from(atob(signature), (c) => c.charCodeAt(0));
    const msg = new TextEncoder().encode(challengeMessage(wallet, nonce, ts));
    return nacl.sign.detached.verify(msg, sig, bs58.decode(wallet));
  } catch {
    return false;
  }
}

export async function issueToken(wallet: string): Promise<{ token: string; expiresAt: number }> {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_S;
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(wallet)
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(key());
  return { token, expiresAt: expiresAt * 1000 };
}

/** Returns the verified wallet address for a request, or null. */
export async function walletFromRequest(req: Request): Promise<string | null> {
  const token = req.headers.get("x-mainstay-session");
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    return isWallet(payload.sub) ? payload.sub : null;
  } catch {
    return null;
  }
}
