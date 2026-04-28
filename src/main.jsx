import React, { useMemo, useEffect } from "react";
import ReactDOM from "react-dom/client";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import App from "./App";
import "@solana/wallet-adapter-react-ui/styles.css";
import "./index.css";
import { NetworkContextProvider, useNetwork } from "./contexts/NetworkContext";

const connectionConfig = {
  commitment: "confirmed",
  wsEndpoint: "",
};

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

    function promoteSolflare(modalList) {
      const items = modalList.querySelectorAll("li");
      let solflareItem = null;
      items.forEach((li) => {
        const btn = li.querySelector(".wallet-adapter-button");
        if (btn && btn.textContent?.toLowerCase().includes("solflare")) {
          solflareItem = li;
        }
      });
      if (
        solflareItem &&
        !solflareItem.classList.contains("solflare-recommended")
      ) {
        modalList.prepend(solflareItem);
        solflareItem.classList.add("solflare-recommended");
        if (!solflareItem.querySelector(".solflare-recommended-badge")) {
          const badge = document.createElement("span");
          badge.className = "solflare-recommended-badge";
          badge.textContent = "Recommended";
          solflareItem.appendChild(badge);
        }
      }
    }

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1) {
            const el = node;
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

function WalletContextProvider({ children }) {
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
const root =
  window.__MEV_SHIELD_REACT_ROOT__ ||
  (window.__MEV_SHIELD_REACT_ROOT__ = ReactDOM.createRoot(rootElement));

root.render(
  <React.StrictMode>
    <NetworkContextProvider>
      <WalletContextProvider>
        <App />
      </WalletContextProvider>
    </NetworkContextProvider>
  </React.StrictMode>,
);
