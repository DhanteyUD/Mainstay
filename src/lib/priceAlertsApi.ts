import {
  callFunction,
  clearSession,
  getAuthError,
  getSessionToken,
} from "./walletAuth";
import type { MessageSigner } from "./walletAuth";

export interface PriceAlert {
  id: string;
  token_mint: string;
  token_symbol: string;
  direction: "above" | "below";
  target_price: number;
  created_at: string;
  triggered_at: string | null;
}

export type CallResult<T> =
  { ok: true; data: T } | { ok: false; error: string };

async function call<T>(
  signer: MessageSigner,
  body: Record<string, unknown>,
): Promise<CallResult<T>> {
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      const token = await getSessionToken(signer);
      if (!token) {
        return {
          ok: false,
          error: getAuthError() ?? "Wallet signature is required.",
        };
      }
      const res = await callFunction<T>("price-alerts", body, token);
      if (res.status === 401) {
        clearSession(signer.address);
        continue;
      }
      if (res.ok) return { ok: true, data: res.data };
      if (res.status === 404) {
        return {
          ok: false,
          error: "Price alerts aren't available yet (service not deployed).",
        };
      }
      return {
        ok: false,
        error: res.data?.error ?? `Request failed (${res.status})`,
      };
    }
    return { ok: false, error: "Session expired. Try again." };
  } catch {
    return {
      ok: false,
      error: "Could not reach the price alerts service. Try again shortly.",
    };
  }
}

export async function listPriceAlerts(signer: MessageSigner) {
  const res = await call<{ alerts: PriceAlert[] }>(signer, { op: "list" });
  return res.ok ? res.data.alerts : null;
}

export function createPriceAlert(
  signer: MessageSigner,
  alert: {
    token_mint: string;
    token_symbol: string;
    direction: "above" | "below";
    target_price: number;
  },
) {
  return call<{ id: string }>(signer, { op: "create", alert });
}

export function deletePriceAlert(signer: MessageSigner, id: string) {
  return call<unknown>(signer, { op: "delete", id });
}
