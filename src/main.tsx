import "@solana/wallet-adapter-react-ui/styles.css";
import "react-toastify/dist/ReactToastify.css";
import "./index.css";
import "./sentry";
import React, { useMemo, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ToastContainer, cssTransition } from "react-toastify";
import { queryClient } from "./lib/queryClient";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { NetworkContextProvider, useNetwork } from "./contexts/NetworkContext";
import { AuthProvider } from "./lib/auth-context";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import * as Sentry from "@sentry/react";

const ToastSlide = cssTransition({
  enter: "ms-toast-enter",
  exit: "ms-toast-exit",
});

const connectionConfig = {
  commitment: "confirmed" as const,
  wsEndpoint: "",
};

const updateSW = registerSW({
  onNeedRefresh() {
    if (
      confirm(
        "A new version of Mainstay is available. Would you like to update now?",
      )
    ) {
      updateSW();
    }
  },
});

function useSolflareRecommended() {
  useEffect(() => {
    const STYLE_ID = "solflare-recommended-styles";
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = `
        .wallet-adapter-modal-list {
          padding: 16px !important;
        }
        .wallet-adapter-modal-list li {
          margin-bottom: 6px !important;
        }
        .wallet-adapter-modal-list li:last-child {
          margin-bottom: 0 !important;
        }

        .wallet-adapter-modal-list li.solflare-recommended {
          order: -1;
          border: 1px solid rgba(255, 239, 70) !important;
          border-radius: 8px;
          background: rgba(255, 239, 70,0.07);
          position: relative;
          margin-bottom: 10px !important;
        }

        .solflare-recommended-badge {
          position: absolute;
          right: 16px;
          top: 0;
          transform: translateY(-50%);
          z-index: 20;
          display: inline-flex;
          align-items: center;
          background: linear-gradient(135deg, #ffef46, #ffd700);
          color: #000;
          font-size: 10px;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: 4px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          font-family: 'JetBrains Mono', monospace;
          pointer-events: none;
          white-space: nowrap;
          line-height: 16px;
        }
      `;
      document.head.appendChild(style);
    }

    function promoteSolflare(modalList: Element) {
      const items = modalList.querySelectorAll("li");
      let solflareItem: Element | null = null;
      items.forEach((li) => {
        const btn = li.querySelector(".wallet-adapter-button");
        if (btn && btn.textContent?.toLowerCase().includes("solflare")) {
          solflareItem = li;
        }
      });
      if (
        solflareItem &&
        !(solflareItem as HTMLElement).classList.contains(
          "solflare-recommended",
        )
      ) {
        modalList.prepend(solflareItem);
        (solflareItem as HTMLElement).classList.add("solflare-recommended");
        if (
          !(solflareItem as HTMLElement).querySelector(
            ".solflare-recommended-badge",
          )
        ) {
          const badge = document.createElement("span");
          badge.className = "solflare-recommended-badge";
          badge.textContent = "Recommended";
          (solflareItem as HTMLElement).appendChild(badge);
        }
      }
    }

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1) {
            const el = node as Element;
            const modalList = el.classList?.contains(
              "wallet-adapter-modal-list",
            )
              ? el
              : el.querySelector?.(".wallet-adapter-modal-list");
            if (modalList) promoteSolflare(modalList);
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
}

function WalletContextProvider({ children }: { children: React.ReactNode }) {
  useSolflareRecommended();
  const { rpcEndpoint } = useNetwork();
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={rpcEndpoint} config={connectionConfig}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

if (window.__MAINSTAY_REACT_ROOT__) {
  window.__MAINSTAY_REACT_ROOT__.unmount();
}
const root = ReactDOM.createRoot(rootElement);
window.__MAINSTAY_REACT_ROOT__ = root;

root.render(
  <React.StrictMode>
    <Sentry.ErrorBoundary
      fallback={
        <div className="flex flex-col items-center justify-center h-screen p-4">
          <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
          <p className="text-gray-600 mb-6">
            We're sorry, but something went wrong. Please try again later.
          </p>
        </div>
      }
    >
      <QueryClientProvider client={queryClient}>
        <NetworkContextProvider>
          <AuthProvider>
            <WalletContextProvider>
              <App />
              <ToastContainer
                position="bottom-left"
                autoClose={5000}
                hideProgressBar={true}
                newestOnTop
                closeOnClick
                pauseOnHover
                draggable
                transition={ToastSlide}
              />
            </WalletContextProvider>
          </AuthProvider>
        </NetworkContextProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
);
