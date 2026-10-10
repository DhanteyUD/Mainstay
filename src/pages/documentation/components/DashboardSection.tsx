import { Settings } from "lucide-react";
import { SectionHeader, SubHeading, Code, NamedBulletList } from "./ui";

export default function DashboardSection() {
  return (
    <section id="dashboard" className="scroll-mt-20">
      <SectionHeader
        icon={<Settings size={16} />}
        title="Dashboard Customization"
      />
      <p className="text-xs md:text-sm text-terminal-dim leading-relaxed mb-4">
        Mainstay's dashboard is fully customizable. Click the grid icon in the
        bottom-left corner to open the Dashboard Customizer.
      </p>

      <SubHeading>Widgets</SubHeading>
      <NamedBulletList
        items={[
          {
            name: "Wallet Card",
            desc: "Balance, address, send button, and trade count.",
          },
          {
            name: "Price Chart",
            desc: "Candlestick chart for the selected token pair.",
          },
          {
            name: "Trading Panel",
            desc: "Swap, Limit Order, and Prediction Market tabs.",
          },
        ]}
      />

      <SubHeading>Reordering & hiding</SubHeading>
      <p className="text-xs md:text-sm text-terminal-dim leading-relaxed mb-4">
        Drag widgets to reorder them. Toggle the eye icon next to each widget
        name to show or hide it. Layout is saved automatically to{" "}
        <Code>localStorage</Code>.
      </p>

      <SubHeading>Guide and 2FA</SubHeading>
      <NamedBulletList
        items={[
          {
            name: "Guide",
            desc: "The Guide button in the top bar starts a walkthrough on request: a tour of the whole app, or how prediction markets work. Nothing starts by itself.",
          },
          {
            name: "2FA",
            desc: "The 2FA button opens security settings where you can turn on authenticator-app codes for sign-in.",
          },
        ]}
      />
    </section>
  );
}
