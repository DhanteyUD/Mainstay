import { Lock, Shield, AlertTriangle, Server } from "lucide-react";
import { SectionHeader, FeatureGrid, CallOut, ExternalAnchor } from "./ui";

export default function SecuritySection() {
  return (
    <section id="security" className="scroll-mt-20">
      <SectionHeader icon={<Lock size={16} />} title="Security" />
      <p className="text-xs md:text-sm text-terminal-dim leading-relaxed mb-4">
        Mainstay is a non-custodial application. Here is what that means for
        your security:
      </p>

      <FeatureGrid
        items={[
          {
            icon: <Lock size={14} className="text-terminal-green" />,
            title: "Non-custodial",
            desc: "Your private keys never leave your wallet. Mainstay only receives public keys and signed messages.",
          },
          {
            icon: <Shield size={14} className="text-terminal-accent" />,
            title: "Secure authentication",
            desc: "Login uses email/password or OAuth (Google, GitHub) via Supabase. Sessions expire after 5 minutes of inactivity. No seed phrase is ever requested.",
          },
          {
            icon: <AlertTriangle size={14} className="text-terminal-yellow" />,
            title: "Phishing awareness",
            desc: "Always verify the URL is mainstay.pro. Mainstay will never DM you asking for a seed phrase.",
          },
          {
            icon: <Server size={14} className="text-terminal-red" />,
            title: "Error monitoring",
            desc: "Sentry captures runtime errors to help the team fix bugs quickly. No personally identifiable data is sent.",
          },
        ]}
      />

      <CallOut type="warning">
        If a site asks for your seed phrase or private key while claiming to be
        Mainstay, it is a scam. Close the tab immediately.
      </CallOut>

      <div className="mt-8 pt-6 border-t border-terminal-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 md:gap-3">
        <div>
          <p className="font-mono text-xs text-terminal-dim/80 tracking-widest uppercase mb-1">
            Questions or issues?
          </p>
          <p className="text-xs md:text-sm text-terminal-dim">
            Open an issue on{" "}
            <ExternalAnchor href="https://github.com/DhanteyUD/Mainstay">
              GitHub
            </ExternalAnchor>{" "}
            or use the Feedback button inside the app.
          </p>
        </div>
        <button
          onClick={() => (window.location.href = "/")}
          className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg font-mono font-bold text-xs bg-terminal-accent text-terminal-bg hover:opacity-85 transition-all"
        >
          LAUNCH APP
        </button>
      </div>
    </section>
  );
}
