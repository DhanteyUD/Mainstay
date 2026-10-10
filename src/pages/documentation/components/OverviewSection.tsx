import {
  Shield,
  BookOpen,
  ArrowRightLeft,
  TrendingUp,
  Target,
} from "lucide-react";
import { SectionHeader, ExternalAnchor, FeatureGrid } from "./ui";

export default function OverviewSection() {
  return (
    <section id="overview" className="scroll-mt-20">
      <SectionHeader icon={<BookOpen size={16} />} title="Overview" />
      <p className="text-xs md:text-sm text-terminal-dim leading-relaxed mb-4">
        Mainstay is a Solana-native trading terminal that gives retail traders
        the same order-routing protections that institutional desks take for
        granted. Every swap is routed through{" "}
        <ExternalAnchor href="https://pond.dflow.net/build/introduction">
          DFlow Protocol
        </ExternalAnchor>
        , which guarantees MEV-free execution — your trades can never be
        front-run or sandwiched.
      </p>
      <FeatureGrid
        items={[
          {
            icon: <Shield size={14} className="text-terminal-green" />,
            title: "MEV Protection",
            desc: "All swaps are routed through DFlow's just-in-time auction system, blocking front-running and sandwich attacks.",
          },
          {
            icon: <ArrowRightLeft size={14} className="text-terminal-accent" />,
            title: "Token Swap",
            desc: "Jupiter-powered best-route execution across all Solana DEXes with real-time price impact previews.",
          },
          {
            icon: <TrendingUp size={14} className="text-terminal-yellow" />,
            title: "Limit Orders",
            desc: "Set price targets and let Mainstay execute automatically when the market hits your level.",
          },
          {
            icon: <Target size={14} className="text-terminal-red" />,
            title: "Prediction Market",
            desc: "Bet Yes/No on real-world events with real USDC on Mainnet. Orders are filled through DFlow's auction, so they can't be sandwiched.",
          },
        ]}
      />
    </section>
  );
}
