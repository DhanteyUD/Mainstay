import { Target } from "lucide-react";
import {
  SectionHeader,
  SubHeading,
  Steps,
  CallOut,
  NamedBulletList,
  Code,
} from "./ui";

export default function PredictionSection() {
  return (
    <section id="prediction" className="scroll-mt-20">
      <SectionHeader icon={<Target size={16} />} title="Prediction Market" />
      <p className="text-xs md:text-sm text-terminal-dim leading-relaxed mb-4">
        Bet on real-world events with Yes/No outcome tokens. Markets are Kalshi
        event contracts tokenized on Solana by DFlow, and they are live on{" "}
        <strong className="text-terminal-green">Mainnet</strong> with real USDC.
        Your orders are filled through DFlow&apos;s auction, hidden from the
        public mempool, so they cannot be sandwiched or front-run.
      </p>

      <SubHeading>How a market works</SubHeading>
      <p className="text-xs md:text-sm text-terminal-dim leading-relaxed mb-4">
        Every market is a yes/no question. Each token on the winning side pays
        exactly <strong className="text-terminal-text">$1</strong> once the
        market settles; tokens on the losing side expire worthless. The price
        you pay is shown in cents: a Yes token at 62¢ costs $0.62 and pays $1 if
        you are right, so cheaper tokens win more but are less likely.
      </p>

      <SubHeading>Placing a bet</SubHeading>
      <Steps
        items={[
          {
            title: "Open the tab",
            desc: 'Click "Prediction Market" in the main tab bar.',
          },
          {
            title: "Find a question",
            desc: "Search, or tap a category. Each card shows what Yes and No cost right now.",
          },
          {
            title: "Tap Yes or No",
            desc: "A bet sheet opens. You can switch sides inside it.",
          },
          {
            title: "Choose an amount",
            desc: "Use $5, $10, $25, $50 or type your own. Two boxes show what you gain if you are right and lose if you are not.",
          },
          {
            title: "Verify once",
            desc: "Buying needs a one-time identity check (Proof by DFlow). Mainstay opens it for you and unlocks the button when you are done.",
          },
          {
            title: "Approve in your wallet",
            desc: "The order is confirmed on-chain and then filled by DFlow, usually within seconds. You will see Approve, Confirm, Filled.",
          },
        ]}
      />

      <SubHeading>About the numbers</SubHeading>
      <NamedBulletList
        items={[
          {
            name: "Gain / loss boxes",
            desc: "Taken from DFlow's live quote: the guaranteed minimum after fees and slippage. Nothing is estimated from the displayed price.",
          },
          {
            name: "After the fill",
            desc: "The confirmation screen shows the tokens you actually received, read from your wallet.",
          },
          {
            name: "Yes / No prices",
            desc: "The bar and the buttons use the same ask prices. They need not add up to 100¢; the gap is the spread.",
          },
          {
            name: "Contracts today",
            desc: "Contracts traded in the last 24 hours. Each contract pays $1 if right, so this is a count, not dollars.",
          },
          {
            name: "Closes",
            desc: "The latest date the market can stay open. Some close or settle sooner if the event happens.",
          },
        ]}
      />

      <SubHeading>My bets</SubHeading>
      <p className="text-xs md:text-sm text-terminal-dim leading-relaxed mb-4">
        The My bets view lists the outcome tokens in your wallet as Open, You
        won or Lost. When a market settles, winning bets show a{" "}
        <strong className="text-terminal-text">Collect</strong> button that
        swaps each token for $1 USDC.
      </p>

      <SubHeading>Devnet demo</SubHeading>
      <p className="text-xs md:text-sm text-terminal-dim leading-relaxed mb-4">
        On Devnet the tab shows a small curated demo of Yes/No tokens swapped
        through Jupiter, for testing the flow with no real funds. Real markets
        exist only on Mainnet.
      </p>

      <CallOut type="warning">
        Prediction markets use real money and you can lose everything you bet.
        Availability depends on your jurisdiction (Kalshi is a US-regulated
        exchange). If the market list shows a <Code>Preview</Code> banner,
        prices are live but betting is switched off until the DFlow connection
        is active.
      </CallOut>
    </section>
  );
}
