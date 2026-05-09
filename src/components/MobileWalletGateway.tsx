import { motion } from "framer-motion";
import { ExternalLink, LogOut, ArrowLeft } from "lucide-react";
import logo from "../assets/mainstay-logo.png";
import phantomLogo from "../assets/phantom-logo.png";
import solflareLogo from "../assets/solflare-logo.jpeg";

function walletDeepLink(wallet: "phantom" | "solflare") {
  const url = encodeURIComponent(window.location.origin);
  if (wallet === "phantom") return `https://phantom.app/ul/browse/${url}`;
  return `https://solflare.com/ul/v1/browse/${url}`;
}

function detectWalletName() {
  if (Boolean(window.phantom?.solana) || Boolean(window.solana?.isPhantom))
    return "Phantom";
  if (
    Boolean(window.solflare?.isSolflare) ||
    Boolean(window.solana?.isSolflare)
  )
    return "Solflare";
  return "your wallet";
}

export function WalletBrowserSignedOut() {
  const walletName = detectWalletName();

  return (
    <motion.div
      className="fixed inset-0 bg-terminal-bg z-50 flex flex-col items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,229,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative w-full max-w-sm">
        <motion.div
          className="flex items-center justify-center gap-2 mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <img src={logo} alt="Mainstay" className="w-9 h-9" />
          <span className="font-mono font-bold text-xl text-terminal-text tracking-wider">
            Main<span className="text-terminal-accent">stay</span>
          </span>
        </motion.div>

        <motion.div
          className="bg-terminal-card border border-terminal-border rounded-2xl p-6 text-center"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="w-12 h-12 rounded-full bg-terminal-dim/10 border border-terminal-border flex items-center justify-center mx-auto mb-4">
            <LogOut size={18} className="text-terminal-dim" />
          </div>
          <h1 className="font-mono font-bold text-terminal-text text-sm tracking-widest uppercase mb-2">
            Signed Out
          </h1>
          <p className="font-mono text-xs text-terminal-dim leading-relaxed mb-4">
            You've been signed out of Mainstay.
          </p>

          <div className="rounded-xl border border-terminal-border bg-terminal-surface px-4 py-3 text-left space-y-2">
            <p className="font-mono text-xs text-terminal-dim/60 uppercase tracking-widest mb-1">
              To continue
            </p>
            <div className="flex items-start gap-2">
              <ArrowLeft
                size={12}
                className="text-terminal-accent mt-0.5 shrink-0"
              />
              <p className="font-mono text-xs text-terminal-dim leading-relaxed">
                Tap the{" "}
                <span className="text-terminal-text font-semibold">
                  back arrow
                </span>{" "}
                or{" "}
                <span className="text-terminal-text font-semibold">
                  close button
                </span>{" "}
                at the top of the {walletName} browser or{" "}
                <span className="text-terminal-text font-semibold">
                  swipe out
                </span>{" "}
                to return to the app.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function MobileWalletGateway() {
  return (
    <motion.div
      className="fixed inset-0 bg-terminal-bg z-50 flex flex-col items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,229,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none animate-pulse-glow"
        style={{
          background:
            "radial-gradient(ellipse at center top, rgba(0,229,255,0.07) 0%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-sm">
        <motion.div
          className="flex items-center justify-center gap-2 mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <img src={logo} alt="Mainstay" className="w-9 h-9" />
          <span className="font-mono font-bold text-xl text-terminal-text tracking-wider">
            Main<span className="text-terminal-accent">stay</span>
          </span>
        </motion.div>

        <motion.div
          className="bg-terminal-card border border-terminal-border rounded-2xl p-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="mb-6 text-center">
            <h1 className="font-mono font-bold text-terminal-text text-sm tracking-widest uppercase">
              Open in Wallet Browser
            </h1>
            <p className="font-mono text-xs text-terminal-dim mt-2 leading-relaxed">
              To trade on mobile, open Mainstay inside your Solana wallet's
              built-in browser.
            </p>
          </div>

          <div className="space-y-3">
            <WalletButton
              name="Phantom"
              href={walletDeepLink("phantom")}
              logo={phantomLogo}
            />
            <WalletButton
              name="Solflare"
              href={walletDeepLink("solflare")}
              logo={solflareLogo}
            />
          </div>

          <div className="mt-5 pt-4 border-t border-terminal-border/50">
            <p className="font-mono text-xs text-terminal-dim/50 text-center leading-relaxed">
              Don't have a wallet?{" "}
              <a
                href="https://phantom.app"
                target="_blank"
                rel="noreferrer"
                className="text-terminal-accent/70 hover:text-terminal-accent transition-colors"
              >
                Get Phantom
              </a>{" "}
              or{" "}
              <a
                href="https://solflare.com"
                target="_blank"
                rel="noreferrer"
                className="text-terminal-accent/70 hover:text-terminal-accent transition-colors"
              >
                Get Solflare
              </a>
            </p>
          </div>
        </motion.div>

        <motion.p
          className="mt-4 text-center font-mono text-xs text-terminal-dim/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          MEV-protected trading on Solana
        </motion.p>
      </div>
    </motion.div>
  );
}

interface WalletButtonProps {
  name: string;
  href: string;
  logo: string;
}

function WalletButton({ name, href, logo }: WalletButtonProps) {
  return (
    <motion.a
      href={href}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-terminal-border bg-terminal-surface text-terminal-text hover:border-terminal-accent/30 hover:bg-terminal-accent/5 font-mono text-xs font-medium transition-all duration-200"
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
    >
      <img
        src={logo}
        alt={name}
        className="w-5 h-5 rounded-md object-cover shrink-0"
      />
      <span className="flex-1 text-left">Open in {name}</span>
      <ExternalLink size={12} className="text-terminal-dim/50 shrink-0" />
    </motion.a>
  );
}
