import { Zap } from "lucide-react";
import { SectionHeader, ExternalAnchor, Steps, CallOut } from "./ui";

export default function GettingStartedSection() {
  return (
    <section id="getting-started" className="scroll-mt-20">
      <SectionHeader icon={<Zap size={16} />} title="Getting Started" />
      <p className="text-xs md:text-sm text-terminal-dim leading-relaxed mb-6">
        Mainstay is a Progressive Web App (PWA). No extension or download
        required — just visit{" "}
        <ExternalAnchor href="https://mainstay.pro">
          mainstay.pro
        </ExternalAnchor>{" "}
        in any browser.
      </p>
      <Steps
        items={[
          {
            title: "Open the app",
            desc: 'Visit mainstay.pro and click "Launch App" on the landing page.',
          },
          {
            title: "Sign in",
            desc: "After onboarding, you'll be prompted to sign to authenticate your session.",
          },
          {
            title: "Connect your wallet",
            desc: "Click the wallet button in the top-right corner. Phantom and Solflare are both supported. Solflare is recommended.",
          },
          {
            title: "Start trading",
            desc: "Once authenticated you land on the main dashboard. Select Token Swap to execute your first protected trade.",
          },
        ]}
      />
      <CallOut type="tip">
        On mobile, open Mainstay directly inside the Phantom or Solflare in-app
        browser for the smoothest wallet integration.
      </CallOut>
    </section>
  );
}
