import { useState, useCallback, useRef, useEffect } from "react";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import { SOLANA_RPC_PROXY, SOLANA_DEVNET_RPC, SOL_MINT } from "../config";
import { useNetwork } from "../contexts/NetworkContext";
import { notify } from "../lib/toast";
import type { Token, SendResult } from "../types";

type SendStatus = "idle" | "signing" | "confirming" | "success" | "error";

interface ExecuteSendParams {
  wallet: WalletContextState;
  connection: Connection;
  token: Token | null;
  amount: string;
  recipient: string;
}

function parseTokenAmount(amountStr: string, decimals: number): bigint {
  const [whole, frac = ""] = Number(amountStr).toFixed(decimals).split(".");
  const paddedFrac = frac.padEnd(decimals, "0").slice(0, decimals);
  return BigInt(whole) * BigInt(10 ** decimals) + BigInt(paddedFrac);
}

async function confirmPolling(
  connection: Connection,
  signature: string,
  maxRetries = 45,
) {
  for (let i = 0; i < maxRetries; i++) {
    const { value: status } = await connection.getSignatureStatus(signature);
    if (
      status?.confirmationStatus === "confirmed" ||
      status?.confirmationStatus === "finalized"
    ) {
      if (status.err)
        throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`);
      return status;
    }
    await new Promise((r) => setTimeout(r, 1200));
  }
  throw new Error(
    "Transaction confirmation timeout. Check your wallet for status.",
  );
}

function humanizeSendError(msg: string | undefined): string {
  if (!msg) return "An unknown error occurred.";
  const m = msg.toLowerCase();
  if (
    m.includes("user rejected") ||
    m.includes("cancelled") ||
    m.includes("rejected")
  )
    return "Transaction cancelled in wallet.";
  if (m.includes("insufficient") || m.includes("balance"))
    return "Insufficient balance for this transfer.";
  if (m.includes("invalid") && m.includes("address"))
    return "Invalid recipient address. Please check and try again.";
  if (
    m.includes("failed to fetch") ||
    m.includes("networkerror") ||
    m.includes("load failed")
  )
    return "Network error — could not reach the RPC. Check your connection.";
  if (m.includes("timeout"))
    return "Transaction timed out. It may have still gone through — check your wallet.";
  return msg.length > 120 ? msg.slice(0, 120) + "…" : msg;
}

export function useSend() {
  const { isDevnet } = useNetwork();
  const isDevnetRef = useRef(isDevnet);
  useEffect(() => {
    isDevnetRef.current = isDevnet;
  }, [isDevnet]);

  const [sendStatus, setSendStatus] = useState<SendStatus>("idle");
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendResult, setSendResult] = useState<SendResult | null>(null);

  const executeSend = useCallback(
    async ({
      wallet,
      connection,
      token,
      amount,
      recipient,
    }: ExecuteSendParams): Promise<SendResult | null> => {
      if (!wallet?.publicKey) {
        const msg = "Wallet not connected.";
        setSendError(msg);
        notify.error(msg);
        throw new Error(msg);
      }

      let recipientKey: PublicKey;
      try {
        recipientKey = new PublicKey(recipient);
      } catch {
        const msg = "Invalid recipient address.";
        setSendError(msg);
        notify.error(msg);
        throw new Error(msg);
      }

      setSendStatus("signing");
      setSendError(null);
      setSendResult(null);

      try {
        const tx = new Transaction({ feePayer: wallet.publicKey });

        if (!token || token.mint === SOL_MINT) {
          const lamports = parseTokenAmount(amount, 9);
          tx.add(
            SystemProgram.transfer({
              fromPubkey: wallet.publicKey,
              toPubkey: recipientKey,
              lamports,
            }),
          );
        } else {
          const mint = new PublicKey(token.mint);
          const fromATA = await getAssociatedTokenAddress(
            mint,
            wallet.publicKey,
          );
          const toATA = await getAssociatedTokenAddress(mint, recipientKey);

          const toATAInfo = await connection.getAccountInfo(toATA);
          if (!toATAInfo) {
            tx.add(
              createAssociatedTokenAccountInstruction(
                wallet.publicKey,
                toATA,
                recipientKey,
                mint,
                TOKEN_PROGRAM_ID,
              ),
            );
          }

          const rawAmount = parseTokenAmount(amount, token.decimals);
          tx.add(
            createTransferInstruction(
              fromATA,
              toATA,
              wallet.publicKey,
              rawAmount,
            ),
          );
        }

        const rpcUrl = isDevnetRef.current
          ? SOLANA_DEVNET_RPC
          : SOLANA_RPC_PROXY;
        const sendConn = new Connection(rpcUrl, "confirmed");

        if (!wallet.sendTransaction) {
          throw new Error("Connected wallet does not support sendTransaction.");
        }

        let signature: string;
        try {
          signature = await wallet.sendTransaction(tx, sendConn, {
            skipPreflight: false,
            preflightCommitment: "confirmed",
          });
        } catch (sendErr) {
          throw new Error(
            (sendErr as Error)?.message || "Wallet rejected the transaction.",
          );
        }

        setSendStatus("confirming");
        await confirmPolling(sendConn, signature);

        const explorerUrl = isDevnetRef.current
          ? `https://solscan.io/tx/${signature}?cluster=devnet`
          : `https://solscan.io/tx/${signature}`;

        const result: SendResult = {
          signature,
          explorerUrl,
          token,
          amount,
          recipient,
        };
        setSendResult(result);
        setSendStatus("success");
        return result;
      } catch (err) {
        const msg = humanizeSendError((err as Error)?.message);
        setSendError(msg);
        setSendStatus("error");
        notify.error({ title: "Transaction failed", description: msg });
        return null;
      }
    },
    [],
  );

  const resetSend = useCallback(() => {
    setSendStatus("idle");
    setSendError(null);
    setSendResult(null);
  }, []);

  return { sendStatus, sendError, sendResult, executeSend, resetSend };
}
