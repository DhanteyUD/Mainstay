import { TrendingUp } from "lucide-react";
import { SectionHeader, SubHeading, Steps, CallOut } from "./ui";

export default function LimitOrdersSection() {
  return (
    <section id="limit-orders" className="scroll-mt-20">
      <SectionHeader icon={<TrendingUp size={16} />} title="Limit Orders" />
      <p className="text-xs md:text-sm text-terminal-dim leading-relaxed mb-4">
        Limit Orders let you specify the price at which you want to buy or sell
        a token. Mainstay monitors the market and executes automatically when
        your target price is reached.
      </p>

      <SubHeading>Placing an order</SubHeading>
      <Steps
        items={[
          { title: "Switch to Limit Orders tab", desc: 'Click "Limit Orders" in the main tab bar.' },
          { title: "Select token pair", desc: "Choose the input and output tokens." },
          { title: "Set amount", desc: "Enter the amount of input token to sell." },
          { title: "Set target price", desc: "Enter the price at which the order should execute." },
          { title: "Confirm", desc: "Click Place Order and approve the transaction in your wallet." },
        ]}
      />

      <SubHeading>Pending orders panel</SubHeading>
      <p className="text-xs md:text-sm text-terminal-dim leading-relaxed mb-4">
        All active orders are listed in the Pending Orders panel on the right.
        Each order shows the token pair, target price, and current market price.
        Click Cancel to remove an unfilled order.
      </p>

      <CallOut type="info">
        Orders are persisted to Mainstay's database, with localStorage as a
        fallback when the database is unavailable. The price monitor polls every
        30 seconds and executes automatically when your target is reached.
        Keep the app open — execution runs in the browser tab.
      </CallOut>
    </section>
  );
}
