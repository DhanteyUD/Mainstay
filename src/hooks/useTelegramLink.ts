import { useCallback, useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  callFunction,
  clearSession,
  functionsEnabled,
  getSessionToken,
  hasValidSession,
} from "../lib/walletAuth";
import type { MessageSigner } from "../lib/walletAuth";

type LinkState = "unknown" | "unlinked" | "pending" | "linked";

const POLL_MS = 3000;
const POLL_TIMEOUT_MS = 2 * 60 * 1000;

export function useTelegramLink() {
  const { publicKey, signMessage } = useWallet();
  const address = publicKey?.toBase58() ?? null;

  const [state, setState] = useState<LinkState>("unknown");
  const [username, setUsername] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const signer = useCallback((): MessageSigner | null => {
    return address ? { address, signMessage } : null;
  }, [address, signMessage]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
  }, []);

  const call = useCallback(
    async (op: string, prompt: boolean) => {
      const s = signer();
      if (!s) return null;
      if (!prompt && !hasValidSession(s.address)) return null;
      const token = await getSessionToken(s);
      if (!token) {
        setError("Wallet signature is required to connect Telegram.");
        return null;
      }
      const res = await callFunction<{
        linked?: boolean;
        username?: string | null;
        url?: string;
      }>("telegram-link", { op }, token);
      if (res.status === 401) clearSession(s.address);
      if (!res.ok) {
        setError(res.data?.error ?? "Something went wrong.");
        return null;
      }
      return res.data;
    },
    [signer],
  );

  // Silent status check on mount / wallet change; never prompts the wallet.
  useEffect(() => {
    stopPolling();
    setError(null);
    setUsername(null);
    if (!address || !functionsEnabled) {
      setState("unknown");
      return;
    }
    if (!hasValidSession(address)) {
      setState("unlinked");
      return;
    }
    call("status", false).then((d) => {
      if (!d) return setState("unlinked");
      setState(d.linked ? "linked" : "unlinked");
      setUsername(d.username ?? null);
    });
    return stopPolling;
  }, [address, call, stopPolling]);

  const connect = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const d = await call("create", true);
      if (!d?.url) return;
      window.open(d.url, "_blank", "noopener,noreferrer");
      setState("pending");

      const started = Date.now();
      stopPolling();
      pollRef.current = setInterval(async () => {
        if (Date.now() - started > POLL_TIMEOUT_MS) {
          stopPolling();
          setState("unlinked");
          return;
        }
        const s = await call("status", false);
        if (s?.linked) {
          stopPolling();
          setState("linked");
          setUsername(s.username ?? null);
        }
      }, POLL_MS);
    } finally {
      setBusy(false);
    }
  }, [call, stopPolling]);

  const disconnect = useCallback(async () => {
    setBusy(true);
    try {
      if (await call("unlink", true)) {
        setState("unlinked");
        setUsername(null);
      }
    } finally {
      setBusy(false);
    }
  }, [call]);

  const sendTest = useCallback(async () => {
    setBusy(true);
    try {
      return Boolean(await call("test", true));
    } finally {
      setBusy(false);
    }
  }, [call]);

  return {
    available: functionsEnabled && !!address,
    state,
    username,
    busy,
    error,
    connect,
    disconnect,
    sendTest,
  };
}
