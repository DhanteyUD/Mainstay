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

function usePhantomRecommended() {
  useEffect(() => {
    const STYLE_ID = "phantom-recommended-styles";
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

        .wallet-adapter-modal-list li.phantom-recommended {
          order: -1;
          border: 1px solid #AB9FF2 !important;
          border-radius: 8px;
          background: rgba(171, 102, 255, 0.06);
          position: relative;
          margin-bottom: 10px !important;
        }

        .phantom-recommended-badge {
          position: absolute;
          right: 16px;
          top: 0;
          transform: translateY(-50%);
          z-index: 20;
          display: inline-flex;
          align-items: center;
          background: linear-gradient(135deg, #ab66ff, #7c3aed);
          color: #fff;
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

    function promotePhantom(modalList) {
      const items = modalList.querySelectorAll("li");
      let phantomItem = null;
      items.forEach((li) => {
        const btn = li.querySelector(".wallet-adapter-button");
        if (btn && btn.textContent?.toLowerCase().includes("phantom")) {
          phantomItem = li;
        }
      });
      if (
        phantomItem &&
        !phantomItem.classList.contains("phantom-recommended")
      ) {
        modalList.prepend(phantomItem);
        phantomItem.classList.add("phantom-recommended");
        if (!phantomItem.querySelector(".phantom-recommended-badge")) {
          const badge = document.createElement("span");
          badge.className = "phantom-recommended-badge";
          badge.textContent = "Recommended";
          phantomItem.appendChild(badge);
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
            if (modalList) promotePhantom(modalList);
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
}

function WalletContextProvider({ children }) {
  usePhantomRecommended();
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
