export const isMobile = /Mobile|Android|iPhone|iPad|x86_64|iPod/i.test(
  navigator.userAgent,
);

// True when running inside Phantom or Solflare's built-in browser,
// where the wallet is already injected even before the user connects.
export const isWalletBrowser =
  Boolean(window.phantom?.solana) ||
  Boolean(window.solana?.isPhantom) ||
  Boolean(window.solflare?.isSolflare) ||
  Boolean(window.solana?.isSolflare);
