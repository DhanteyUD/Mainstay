import { Wallet } from "lucide-react";
import { SectionHeader, SubHeading, Code, CallOut } from "./ui";

export default function WalletSection() {
  return (
    <section id="wallet" className="scroll-mt-20">
      <SectionHeader icon={<Wallet size={16} />} title="Wallet & Balance" />
      <p className="text-xs md:text-sm text-terminal-dim leading-relaxed mb-4">
        The Wallet Card in your dashboard shows your connected wallet address,
        current SOL balance (in SOL and USD), and a running count of completed
        trades.
      </p>

      <SubHeading>Balance visibility</SubHeading>
      <p className="text-xs md:text-sm text-terminal-dim leading-relaxed mb-4">
        Click the eye icon on the Wallet Card to hide your balance. The setting
        is saved to <Code>localStorage</Code> and persists between sessions.
      </p>

      <SubHeading>Refresh balance</SubHeading>
      <p className="text-xs md:text-sm text-terminal-dim leading-relaxed mb-4">
        The spinning arrow next to the balance in the header refreshes your
        on-chain SOL balance on demand. Balances are also updated automatically
        after every outgoing transfer or swap.
      </p>

      <SubHeading>Deposit SOL</SubHeading>
      <p className="text-xs md:text-sm text-terminal-dim leading-relaxed mb-4">
        Click the Deposit button on the Wallet Card to view your wallet address
        and QR code for receiving SOL. You can deposit from any exchange or
        wallet by sending to this address. Deposits are recorded in your trade
        history.
      </p>

      <SubHeading>Send SOL</SubHeading>
      <p className="text-xs md:text-sm text-terminal-dim leading-relaxed mb-4">
        Open the Send modal from the Wallet Card to transfer SOL to any Solana
        address. All sends are recorded in your trade history.
      </p>

      <CallOut type="info">
        Mainstay never stores or has custody of your private keys. All signing
        is done locally in your wallet extension.
      </CallOut>
    </section>
  );
}
