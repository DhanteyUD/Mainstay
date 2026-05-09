/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module "virtual:pwa-register" {
  export type RegisterSWOptions = {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (
      registration: ServiceWorkerRegistration | undefined,
    ) => void;
    onRegistrationError?: (error: unknown) => void;
  };
  export function registerSW(
    options?: RegisterSWOptions,
  ): (reloadPage?: boolean) => Promise<void>;
}

interface Window {
  __MAINSTAY_REACT_ROOT__: import("react-dom/client").Root | undefined;
  phantom?: { solana?: { isPhantom?: boolean } };
  solana?: { isPhantom?: boolean; isSolflare?: boolean };
  solflare?: { isSolflare?: boolean };
  TradingView?: {
    widget: new (config: Record<string, unknown>) => { remove?: () => void };
  };
}
