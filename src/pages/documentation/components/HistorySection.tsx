import { Clock } from "lucide-react";
import { SectionHeader, SubHeading, BulletList, CallOut } from "./ui";

export default function HistorySection() {
  return (
    <section id="history" className="scroll-mt-20">
      <SectionHeader icon={<Clock size={16} />} title="Trade History" />
      <p className="text-xs md:text-sm text-terminal-dim leading-relaxed mb-4">
        Trade History records all swaps, transfers, and received transactions
        associated with your connected wallet. Click the History tab (next to
        Protection) to view it.
      </p>

      <SubHeading>What is recorded</SubHeading>
      <BulletList
        items={[
          "Token swaps — input/output token, amounts, and timestamp",
          "Outgoing SOL transfers — destination address and amount",
          "Incoming SOL transfers — detected automatically from your on-chain history",
        ]}
      />

      <SubHeading>Refreshing history</SubHeading>
      <p className="text-xs md:text-sm text-terminal-dim leading-relaxed mb-4">
        Click the refresh button in the History panel to fetch the latest
        on-chain activity. History is synced automatically when you first
        connect your wallet.
      </p>

      <CallOut type="info">
        Trade history is stored in Mainstay's database linked to your wallet
        address. If the database is unavailable, trades are cached locally.
      </CallOut>
    </section>
  );
}
