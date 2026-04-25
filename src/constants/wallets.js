import phantomLogo from "../assets/phantom-logo.png";
import solflareLogo from "../assets/solflare-logo.jpeg";

export const WALLETS = [
  {
    name: "Phantom",
    logo: phantomLogo,
    href: (url) => `https://phantom.app/ul/v1/browse/${url}?ref=${url}`,
    color: "#AB66FF",
    glow: "rgba(171,102,255,0.35)",
    bg: "rgba(171,102,255,0.08)",
    border: "rgba(171,102,255,0.3)",
    hoverBorder: "rgba(171,102,255,0.7)",
  },
  {
    name: "Solflare",
    logo: solflareLogo,
    href: (url) => `https://solflare.com/ul/v1/browse/${url}?ref=${url}`,
    color: "#FFEF46",
    glow: "rgba(252,140,4,0.35)",
    bg: "rgba(252,140,4,0.08)",
    border: "rgba(252,140,4,0.3)",
    hoverBorder: "rgba(252,140,4,0.7)",
  },
];
