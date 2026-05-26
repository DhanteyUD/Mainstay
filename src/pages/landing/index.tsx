import Nav from "./components/Nav";
import Hero from "./components/Hero";
import StatsBar from "./components/StatsBar";
import ProblemSection from "./components/ProblemSection";
import HowItWorksSection from "./components/HowItWorksSection";
import FeaturesSection from "./components/FeaturesSection";
import ResultsSection from "./components/ResultsSection";
import QuotesSection from "./components/QuotesSection";
import ComparisonSection from "./components/ComparisonSection";
import PartnersSection from "./components/PartnersSection";
import WaitlistSection from "./components/WaitlistSection";
import CtaSection from "./components/CtaSection";
import PageFooter from "./components/PageFooter";
import type { Props } from "./types";

export default function LandingPage({ onLaunch }: Props) {
  return (
    <div className="min-h-screen bg-terminal-bg text-terminal-text overflow-x-hidden">
      <div className="scan-line" />

      {/* Grid background */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,229,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,1) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          opacity: 0.013,
        }}
      />

      {/* Glow orbs */}
      <div
        className="fixed pointer-events-none z-0 w-[600px] h-[600px] rounded-full animate-pulse-glow"
        style={{
          background:
            "radial-gradient(circle, rgba(0,229,255,0.18) 0%, transparent 70%)",
          filter: "blur(80px)",
          opacity: 0.3,
          top: "-200px",
          left: "-200px",
        }}
      />
      <div
        className="fixed pointer-events-none z-0 w-[400px] h-[400px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(0,255,148,0.14) 0%, transparent 70%)",
          filter: "blur(80px)",
          opacity: 0.25,
          bottom: "10%",
          right: "-100px",
          animation: "pulseGlow 6s ease-in-out 3s infinite",
        }}
      />

      <Nav onLaunch={onLaunch} />

      <main className="relative z-10">
        <Hero onLaunch={onLaunch} />
        <StatsBar />
        <ProblemSection />
        <HowItWorksSection />
        <FeaturesSection />
        <ResultsSection />
        <QuotesSection />
        <ComparisonSection />
        <PartnersSection />
        <WaitlistSection onLaunch={onLaunch} />
        <CtaSection onLaunch={onLaunch} />
      </main>

      <PageFooter />
    </div>
  );
}
