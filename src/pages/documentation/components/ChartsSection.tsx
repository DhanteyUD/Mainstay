import { BarChart2 } from "lucide-react";
import { SectionHeader, SubHeading, BulletList } from "./ui";

export default function ChartsSection() {
  return (
    <section id="charts" className="scroll-mt-20">
      <SectionHeader icon={<BarChart2 size={16} />} title="Price Charts" />
      <p className="text-xs md:text-sm text-terminal-dim leading-relaxed mb-4">
        The Price Chart widget displays the token pair you have selected in the
        swap form. It updates automatically whenever you change the input or
        output token.
      </p>

      <SubHeading>Chart features</SubHeading>
      <BulletList
        items={[
          "Price data sourced from Binance via TradingView — select 15m, 1H, 4H, 1D, or 1W from the chart header",
          "Multiple chart styles: Candles, Line, Area, Heikin Ashi, and more — toggle with the arrows in the chart header",
          "Current price, session high/low, and % change shown below the chart for SOL pairs",
          "Responsive — adapts to dashboard layout",
        ]}
      />
    </section>
  );
}
