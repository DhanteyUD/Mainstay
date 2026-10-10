import { Lock, Shield, AlertTriangle, Server, KeyRound } from "lucide-react";
import { SectionHeader, FeatureGrid, CallOut } from "./ui";

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
            icon: <KeyRound size={14} className="text-terminal-green" />,
            title: "Two-factor authentication",
            desc: "Add an authenticator app (Google Authenticator, Authy, 1Password) from the 2FA button in the top bar. Once on, the app stays locked after sign-in until you enter a 6-digit code.",
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

      <CallOut type="info">
        Keep access to your authenticator app. Mainstay does not issue recovery
        codes, so if you lose it you will need support to reset 2FA.
      </CallOut>

      <CallOut type="warning">
        If a site asks for your seed phrase or private key while claiming to be
        Mainstay, it is a scam. Close the tab immediately.
      </CallOut>
    </section>
  );
}
