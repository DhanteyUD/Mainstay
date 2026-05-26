import { Shield, RefreshCw, Lock, Zap } from "lucide-react";
import { SectionHeader, SubHeading, FeatureGrid } from "./ui";

export default function ProtectionSection() {
  return (
    <section id="protection" className="scroll-mt-20">
      <SectionHeader icon={<Shield size={16} />} title="MEV Protection" />
      <p className="text-xs md:text-sm text-terminal-dim leading-relaxed mb-4">
        Maximal Extractable Value (MEV) refers to the profit validators or bots
        can extract by reordering, inserting, or censoring transactions. On most
        Solana interfaces, your swap is visible in the mempool before it settles
        — giving bots time to front-run it.
      </p>

      <SubHeading>How DFlow prevents MEV</SubHeading>
      <p className="text-xs md:text-sm text-terminal-dim leading-relaxed mb-4">
        DFlow uses a Just-In-Time (JIT) auction system. Instead of broadcasting
        your intent to the public mempool, Mainstay sends it privately to market
        makers who compete for your order. The winning quote is submitted
        atomically — there is no observable pending state for bots to exploit.
      </p>

      <FeatureGrid
        items={[
          {
            icon: <Shield size={14} className="text-terminal-green" />,
            title: "No front-running",
            desc: "Your order is never visible to bots before it settles.",
          },
          {
            icon: <RefreshCw size={14} className="text-terminal-accent" />,
            title: "Competitive quotes",
            desc: "Multiple market makers compete, so you get the best available price.",
          },
          {
            icon: <Lock size={14} className="text-terminal-yellow" />,
            title: "Atomic settlement",
            desc: "The quote and execution happen in a single transaction with no gap.",
          },
          {
            icon: <Zap size={14} className="text-terminal-red" />,
            title: "No sandwich attacks",
            desc: "Bots cannot insert transactions before and after yours to profit from the spread.",
          },
        ]}
      />

      <p className="text-xs md:text-sm text-terminal-dim leading-relaxed mt-4">
        The Protection Panel (visible next to the swap form) shows the current
        MEV risk level and explains in plain terms what protection is active.
      </p>
    </section>
  );
}
