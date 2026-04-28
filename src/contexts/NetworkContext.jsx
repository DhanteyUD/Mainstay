import { createContext, useContext, useState, useCallback } from 'react';
import { SOLANA_RPC_PROXY, SOLANA_DEVNET_RPC } from '../config';

const MAINNET_RPC = import.meta.env.VITE_HELIUS_RPC_URL || SOLANA_RPC_PROXY;
const STORAGE_KEY = 'mainstay_network';

const NetworkContext = createContext(null);

export function NetworkContextProvider({ children }) {
  const [isDevnet, setIsDevnet] = useState(
    () => localStorage.getItem(STORAGE_KEY) === 'devnet'
  );

  const toggleNetwork = useCallback(() => setIsDevnet((v) => {
    const next = !v;
    localStorage.setItem(STORAGE_KEY, next ? 'devnet' : 'mainnet');
    return next;
  }), []);

  const value = {
    isDevnet,
    network: isDevnet ? 'devnet' : 'mainnet',
    networkLabel: isDevnet ? 'DEVNET' : 'MAINNET',
    rpcEndpoint: isDevnet ? SOLANA_DEVNET_RPC : MAINNET_RPC,
    toggleNetwork,
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
