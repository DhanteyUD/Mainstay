import { callFunction, clearSession, getSessionToken } from "./walletAuth";
import type { MessageSigner } from "./walletAuth";

type Network = "mainnet" | "devnet";

async function send(
  signer: MessageSigner,
  body: Record<string, unknown>,
): Promise<boolean> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const token = await getSessionToken(signer);
    if (!token) return false;
    const res = await callFunction("orders", body, token);
    if (res.ok) return true;
    if (res.status === 401) {
      // Token expired or was rejected: drop it and sign in again once.
      clearSession(signer.address);
      continue;
    }
    console.warn("[ordersApi]", res.status, res.data?.error);
    return false;
  }
  return false;
}

export function insertOrder(
  signer: MessageSigner,
  network: Network,
  order: Record<string, unknown>,
) {
  return send(signer, { op: "insert", network, order });
}

export function updateOrder(
  signer: MessageSigner,
  network: Network,
  id: string,
  patch: Record<string, unknown>,
) {
  return send(signer, { op: "update", network, id, patch });
}

export function editOrderRemote(
  signer: MessageSigner,
  network: Network,
  id: string,
  patch: { target_price: number; input_amount: string; direction: "above" | "below" },
) {
  return send(signer, { op: "edit", network, id, patch });
}
