import { Server } from "lucide-react";
import { SectionHeader, SubHeading } from "./ui";

const RISK_LEVELS = [
  {
    label: "LOW",
    color: "text-terminal-green border-terminal-green/30",
    desc: "Normal MEV environment. Safe to trade.",
  },
  {
    label: "MEDIUM",
    color: "text-terminal-yellow border-terminal-yellow/30",
    desc: "Elevated activity. DFlow protection is especially valuable.",
  },
  {
    label: "HIGH",
    color: "text-terminal-red border-terminal-red/30",
    desc: "Heavy bot activity. Exercise caution with large swaps.",
  },
];

export default function NetworkSection() {
  return (
    <section id="network" className="scroll-mt-20">
      <SectionHeader icon={<Server size={16} />} title="Network Status" />
      <p className="text-xs md:text-sm text-terminal-dim leading-relaxed mb-4">
        Two live status cards float on the right edge of the dashboard, giving
        you at-a-glance insight into Solana's current health.
      </p>

      <SubHeading>Risk Level</SubHeading>
      <p className="text-xs md:text-sm text-terminal-dim leading-relaxed mb-4">
        Calculated from current Solana MEV activity and TPS. Levels are:
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {RISK_LEVELS.map((r) => (
          <div key={r.label} className={`border rounded-xl p-3 font-mono ${r.color}`}>
            <div className="text-xs font-bold tracking-widest mb-1">{r.label}</div>
            <div className="text-xs text-terminal-dim">{r.desc}</div>
          </div>
        ))}
      </div>

      <SubHeading>Network Uptime</SubHeading>
      <p className="text-xs md:text-sm text-terminal-dim leading-relaxed mb-4">
        Sourced from DFlow and Helius RPC providers. Values above 90% are shown
        in green; below 90% they turn yellow to signal potential congestion.
        Mainstay automatically retries failed transactions.
      </p>
    </section>
  );
}
