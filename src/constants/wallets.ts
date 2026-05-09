import phantomLogo from "../assets/phantom-logo.png";
import solflareLogo from "../assets/solflare-logo.jpeg";
import phantomImage from "../assets/phantom-trnsprnt.png";
import solflareImage from "../assets/solflare-trnsprnt.png";

export interface WalletConfig {
  name: string;
  logo: string;
  image: string;
  href: (url: string) => string;
  color: string;
  glow: string;
  bg: string;
  border: string;
  hoverBorder: string;
  recommended?: boolean;
}

export const WALLETS: WalletConfig[] = [
  {
    name: "Solflare",
    logo: solflareLogo,
    image: solflareImage,
    href: (url: string) =>
      `https://solflare.com/ul/v1/browse/${url}?ref=${url}`,
    color: "#FFEF46",
    glow: "rgba(255,239,70,0.35)",
    bg: "rgba(255,239,70,0.08)",
    border: "rgba(255,239,70,0.3)",
    hoverBorder: "rgba(255,239,70,0.7)",
    recommended: true,
  },
  {
    name: "Phantom",
    logo: phantomLogo,
    image: phantomImage,
    href: (url: string) => `https://phantom.app/ul/browse/${url}?ref=${url}`,
    color: "#AB9FF2",
    glow: "rgba(171,102,255,0.35)",
    bg: "rgba(171,102,255,0.08)",
    border: "rgba(171,102,255,0.3)",
    hoverBorder: "rgba(171,102,255,0.7)",
  },
];
