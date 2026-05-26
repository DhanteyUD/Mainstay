import { Settings } from "lucide-react";
import { SectionHeader, SubHeading, Code, NamedBulletList } from "./ui";

export default function DashboardSection() {
  return (
    <section id="dashboard" className="scroll-mt-20">
      <SectionHeader icon={<Settings size={16} />} title="Dashboard Customization" />
      <p className="text-xs md:text-sm text-terminal-dim leading-relaxed mb-4">
        Mainstay's dashboard is fully customizable. Click the grid icon in the
        bottom-left corner to open the Dashboard Customizer.
      </p>

      <SubHeading>Widgets</SubHeading>
      <NamedBulletList
        items={[
          { name: "Wallet Card", desc: "Balance, address, send button, and trade count." },
          { name: "Price Chart", desc: "Candlestick chart for the selected token pair." },
          { name: "Trading Panel", desc: "Swap, Limit Order, and Prediction Market tabs." },
        ]}
      />

      <SubHeading>Reordering & hiding</SubHeading>
      <p className="text-xs md:text-sm text-terminal-dim leading-relaxed mb-4">
        Drag widgets to reorder them. Toggle the eye icon next to each widget
        name to show or hide it. Layout is saved automatically to{" "}
        <Code>localStorage</Code>.
      </p>
    </section>
  );
}
