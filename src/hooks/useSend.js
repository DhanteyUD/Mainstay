import { useState, useCallback, useRef, useEffect } from "react";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { SOLANA_RPC_PROXY, SOLANA_DEVNET_RPC } from "../config";
import { useNetwork } from "../contexts/NetworkContext";

const SOL_MINT = "So11111111111111111111111111111111111111112";

async function confirmPolling(connection, signature, maxRetries = 45) {
  for (let i = 0; i < maxRetries; i++) {
    const { value: status } = await connection.getSignatureStatus(signature);
    if (
      status?.confirmationStatus === "confirmed" ||
      status?.confirmationStatus === "finalized"
    ) {
      if (status.err) throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`);
      return status;
    }
    await new Promise((r) => setTimeout(r, 1200));
  }
  throw new Error("Transaction confirmation timeout. Check your wallet for status.");
}

function humanizeSendError(msg) {
  if (!msg) return "An unknown error occurred.";
  const m = msg.toLowerCase();
  if (m.includes("user rejected") || m.includes("cancelled") || m.includes("rejected"))
    return "Transaction cancelled in wallet.";
  if (m.includes("insufficient") || m.includes("balance"))
    return "Insufficient balance for this transfer.";
  if (m.includes("invalid") && m.includes("address"))
    return "Invalid recipient address. Please check and try again.";
  if (m.includes("failed to fetch") || m.includes("networkerror") || m.includes("load failed"))
    return "Network error — could not reach the RPC. Check your connection.";
  if (m.includes("timeout"))
    return "Transaction timed out. It may have still gone through — check your wallet.";
  return msg.length > 120 ? msg.slice(0, 120) + "…" : msg;
}

export function useSend() {
  const { isDevnet } = useNetwork();
  const isDevnetRef = useRef(isDevnet);
  useEffect(() => { isDevnetRef.current = isDevnet; }, [isDevnet]);

  const [sendStatus, setSendStatus] = useState("idle"); // idle | signing | confirming | success | error
  const [sendError, setSendError] = useState(null);
  const [sendResult, setSendResult] = useState(null);

  const executeSend = useCallback(async ({ wallet, connection, token, amount, recipient }) => {
    if (!wallet?.publicKey) {
      setSendError("Wallet not connected.");
      return null;
    }

    let recipientKey;
    try {
      recipientKey = new PublicKey(recipient);
    } catch {
      setSendError("Invalid recipient address.");
      return null;
    }

    setSendStatus("signing");
    setSendError(null);
    setSendResult(null);

    try {
      let tx = new Transaction({ feePayer: wallet.publicKey });

      if (!token || token.mint === SOL_MINT) {
        const lamports = Math.floor(Number(amount) * LAMPORTS_PER_SOL);
        tx.add(
          SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: recipientKey,
            lamports,
          })
        );
      } else {
        const mint = new PublicKey(token.mint);
        const fromATA = await getAssociatedTokenAddress(mint, wallet.publicKey);
        const toATA = await getAssociatedTokenAddress(mint, recipientKey);

        const toATAInfo = await connection.getAccountInfo(toATA);
        if (!toATAInfo) {
          tx.add(
            createAssociatedTokenAccountInstruction(
              wallet.publicKey,
              toATA,
              recipientKey,
              mint,
              TOKEN_PROGRAM_ID
            )
          );
        }

        const rawAmount = BigInt(Math.floor(Number(amount) * Math.pow(10, token.decimals)));
        tx.add(createTransferInstruction(fromATA, toATA, wallet.publicKey, rawAmount));
      }

      const rpcUrl = isDevnetRef.current ? SOLANA_DEVNET_RPC : SOLANA_RPC_PROXY;
      const sendConn = new Connection(rpcUrl, "confirmed");

      let signature;
      try {
        signature = await wallet.sendTransaction(tx, sendConn, {
          skipPreflight: false,
          preflightCommitment: "confirmed",
        });
      } catch (sendErr) {
        throw new Error(sendErr?.message || "Wallet rejected the transaction.");
      }

      setSendStatus("confirming");
      await confirmPolling(connection, signature);

      const explorerUrl = isDevnetRef.current
        ? `https://solscan.io/tx/${signature}?cluster=devnet`
        : `https://solscan.io/tx/${signature}`;

      const result = { signature, explorerUrl, token, amount, recipient };
      setSendResult(result);
      setSendStatus("success");
      return result;
    } catch (err) {
      setSendError(humanizeSendError(err?.message));
      setSendStatus("error");
      return null;
    }
  }, []);

  const resetSend = useCallback(() => {
    setSendStatus("idle");
    setSendError(null);
    setSendResult(null);
  }, []);

  return { sendStatus, sendError, sendResult, executeSend, resetSend };
}
