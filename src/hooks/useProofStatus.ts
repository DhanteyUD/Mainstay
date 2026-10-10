import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import bs58 from "bs58";
import { PROOF_API, PROOF_VERIFY_URL } from "../config";

type ProofState = "unknown" | "checking" | "verified" | "unverified" | "error";

export function useProofStatus() {
  const { publicKey, signMessage } = useWallet();
  const address = publicKey?.toBase58() ?? null;
  const [state, setState] = useState<ProofState>("unknown");

  const check = useCallback(async () => {
    if (!address) return setState("unknown");
    setState("checking");
    try {
      const res = await fetch(`${PROOF_API}/verify/${address}`, {
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error(String(res.status));
      const { verified } = await res.json();
      setState(verified ? "verified" : "unverified");
    } catch {
      setState("error");
    }
  }, [address]);

  useEffect(() => {
    check();
  }, [check]);

  useEffect(() => {
    if (state !== "unverified") return;
    const onVisible = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [state, check]);

  const startVerification = useCallback(async (): Promise<string | null> => {
    if (!publicKey || !signMessage) return "Your wallet can't sign messages.";
    try {
      const timestamp = Date.now();
      const sig = await signMessage(
        new TextEncoder().encode(`Proof KYC verification: ${timestamp}`),
      );
      const params = new URLSearchParams({
        wallet: publicKey.toBase58(),
        signature: bs58.encode(sig),
        timestamp: String(timestamp),
        redirect_uri: window.location.origin,
      });
      window.open(
        `${PROOF_VERIFY_URL}?${params}`,
        "_blank",
        "noopener,noreferrer",
      );
      return null;
    } catch {
      return "Signature request was declined.";
    }
  }, [publicKey, signMessage]);

  return { state, verified: state === "verified", check, startVerification };
}
