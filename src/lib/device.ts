export const isMobile = /Mobile|Android|iPhone|iPad|x86_64|iPod/i.test(
  navigator.userAgent,
);

export const isWalletBrowser =
  Boolean(window.phantom?.solana) ||
  Boolean(window.solana?.isPhantom) ||
  Boolean(window.solflare?.isSolflare) ||
  Boolean(window.solana?.isSolflare);
