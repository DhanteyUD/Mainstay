import { createContext, useContext } from 'react';
import { SOLANA_RPC_PROXY, SOLANA_DEVNET_RPC } from '../config';
import config from '../config/index';

const { solanaNetwork, heliusRpcUrl } = config().secrets;

const IS_DEVNET = solanaNetwork === 'devnet';
const RPC_ENDPOINT = IS_DEVNET
  ? SOLANA_DEVNET_RPC
  : (heliusRpcUrl || SOLANA_RPC_PROXY);

const NetworkContext = createContext(null);

export function NetworkContextProvider({ children }) {
  const value = {
    isDevnet: IS_DEVNET,
    network: IS_DEVNET ? 'devnet' : 'mainnet',
    networkLabel: IS_DEVNET ? 'DEVNET' : 'MAINNET',
    rpcEndpoint: RPC_ENDPOINT,
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error('useNetwork must be used within NetworkContextProvider');
  return ctx;
}
