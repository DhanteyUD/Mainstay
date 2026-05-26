import { Target } from "lucide-react";
import { SectionHeader, SubHeading } from "./ui";

export default function PredictionSection() {
  return (
    <section id="prediction" className="scroll-mt-20">
      <SectionHeader icon={<Target size={16} />} title="Prediction Market" />
      <p className="text-xs md:text-sm text-terminal-dim leading-relaxed mb-4">
        Mainstay's on-chain Prediction Market lets you bet on the direction of
        Solana DeFi assets. It is currently live on{" "}
        <strong className="text-terminal-yellow">Devnet only</strong> —
        mainnet support is on the roadmap.
      </p>

      <SubHeading>Accessing Prediction Markets</SubHeading>
      <p className="text-xs md:text-sm text-terminal-dim leading-relaxed mb-4">
        Click the "Prediction Market" tab in the main tab bar. The feature is
        currently available on <strong className="text-terminal-yellow">Devnet only</strong> — on
        Mainnet the tab shows a coming-soon screen.
      </p>

      <SubHeading>How markets work</SubHeading>
      <p className="text-xs md:text-sm text-terminal-dim leading-relaxed mb-4">
        Each market resolves at a specific time. You pick a side (YES / NO) and
        commit SOL. If your side wins you receive a proportional share of the
        losing pool. Markets are settled on-chain with no counterparty risk.
      </p>
    </section>
  );
}
