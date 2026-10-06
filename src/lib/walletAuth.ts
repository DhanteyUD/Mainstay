import config from "../config/index";

const { supabaseUrl, supabaseAnonKey } = config().secrets;
const STORAGE_KEY = "mainstay_session_v1";
const EXPIRY_SKEW_MS = 60_000;

export const functionsEnabled = Boolean(supabaseUrl && supabaseAnonKey);

interface Session {
  token: string;
  expiresAt: number;
}

export interface MessageSigner {
  address: string;
  signMessage: ((message: Uint8Array) => Promise<Uint8Array>) | undefined;
}

let lastError: string | null = null;
export const getAuthError = () => lastError;

const memory = new Map<string, Session>();
const inflight = new Map<string, Promise<string | null>>();

export async function callFunction<T = Record<string, unknown>>(
  name: string,
  body: unknown,
  token?: string,
): Promise<{ ok: boolean; status: number; data: T & { error?: string } }> {
  const res = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseAnonKey!,
      Authorization: `Bearer ${supabaseAnonKey}`,
      ...(token ? { "x-mainstay-session": token } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

function readStored(address: string): Session | null {
  const cached = memory.get(address);
  if (cached) return cached;
  try {
    const all = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}");
    const s = all[address] as Session | undefined;
    if (s) memory.set(address, s);
    return s ?? null;
  } catch {
    return null;
  }
}

function store(address: string, session: Session | null) {
  if (session) memory.set(address, session);
  else memory.delete(address);
  try {
    const all = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}");
    if (session) all[address] = session;
    else delete all[address];
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

export function clearSession(address: string) {
  store(address, null);
}

export function hasValidSession(address: string): boolean {
  const s = readStored(address);
  return !!s && s.expiresAt - EXPIRY_SKEW_MS > Date.now();
}

export function getSessionToken(signer: MessageSigner): Promise<string | null> {
  if (!functionsEnabled) return Promise.resolve(null);
  const existing = readStored(signer.address);
  if (existing && existing.expiresAt - EXPIRY_SKEW_MS > Date.now()) {
    return Promise.resolve(existing.token);
  }
  const pending = inflight.get(signer.address);
  if (pending) return pending;

  const run = (async () => {
    lastError = null;
    if (!signer.signMessage) {
      lastError = "Your wallet doesn't support message signing. Try Solflare or Phantom.";
      return null;
    }
    try {
      const ch = await callFunction<{
        message: string;
        nonce: string;
        ts: number;
        mac: string;
      }>("wallet-auth", { action: "challenge", wallet: signer.address });
      if (!ch.ok) {
        lastError = `Sign-in service error (${ch.status}). Try again shortly.`;
        return null;
      }

      const sig = await signer.signMessage(
        new TextEncoder().encode(ch.data.message),
      );
      const signature = btoa(String.fromCharCode(...sig));

      const verified = await callFunction<Session>("wallet-auth", {
        action: "verify",
        wallet: signer.address,
        nonce: ch.data.nonce,
        ts: ch.data.ts,
        mac: ch.data.mac,
        signature,
      });
      if (!verified.ok) {
        lastError = "Signature could not be verified. Try again.";
        return null;
      }

      store(signer.address, {
        token: verified.data.token,
        expiresAt: verified.data.expiresAt,
      });
      return verified.data.token;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      lastError = /reject|denied|decline|cancel/i.test(msg)
        ? "Signature request was declined in your wallet."
        : /failed to fetch|network|load failed/i.test(msg)
          ? "Could not reach the sign-in service (network or CORS). If this isn't mainstay.pro, add this site to ALLOWED_ORIGIN."
          : `Wallet sign-in failed: ${msg.slice(0, 120)}`;
      return null;
    } finally {
      inflight.delete(signer.address);
    }
  })();
  inflight.set(signer.address, run);
  return run;
}
