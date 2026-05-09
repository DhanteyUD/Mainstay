import React, { createContext, useContext } from "react";
import { SOLANA_RPC_PROXY, SOLANA_DEVNET_RPC } from "../config";
import config from "../config/index";
import type { NetworkContextValue } from "../types";

const { solanaNetwork, heliusRpcUrl } = config().secrets;

const IS_DEVNET = solanaNetwork === "devnet";
const RPC_ENDPOINT = IS_DEVNET
  ? SOLANA_DEVNET_RPC
  : heliusRpcUrl || SOLANA_RPC_PROXY;

const NetworkContext = createContext<NetworkContextValue | null>(null);

export function NetworkContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value: NetworkContextValue = {
    isDevnet: IS_DEVNET,
    network: IS_DEVNET ? "devnet" : "mainnet",
    networkLabel: IS_DEVNET ? "DEVNET" : "MAINNET",
    rpcEndpoint: RPC_ENDPOINT,
  };

  return (
    <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
  );
}

export function useNetwork(): NetworkContextValue {
  const ctx = useContext(NetworkContext);
  if (!ctx)
    throw new Error("useNetwork must be used within NetworkContextProvider");
  return ctx;
}
