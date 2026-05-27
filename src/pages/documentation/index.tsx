import { useState } from "react";
import {
  BookOpen,
  ArrowRightLeft,
  TrendingUp,
  Target,
  Shield,
  Wallet,
  BarChart2,
  Clock,
  Settings,
  Server,
  Zap,
  Lock,
  Code2,
} from "lucide-react";

import DocHeader from "./components/DocHeader";
import DocSidebar from "./components/DocSidebar";
import OverviewSection from "./components/OverviewSection";
import GettingStartedSection from "./components/GettingStartedSection";
import WalletSection from "./components/WalletSection";
import SwapSection from "./components/SwapSection";
import LimitOrdersSection from "./components/LimitOrdersSection";
import PredictionSection from "./components/PredictionSection";
import ProtectionSection from "./components/ProtectionSection";
import ChartsSection from "./components/ChartsSection";
import HistorySection from "./components/HistorySection";
import NetworkSection from "./components/NetworkSection";
import DashboardSection from "./components/DashboardSection";
import SecuritySection from "./components/SecuritySection";
import DeveloperSection from "./components/DeveloperSection";
import type { Section } from "./types";

const SECTIONS: Section[] = [
  { id: "overview", label: "Overview", icon: <BookOpen size={13} /> },
  { id: "getting-started", label: "Getting Started", icon: <Zap size={13} /> },
  { id: "wallet", label: "Wallet & Balance", icon: <Wallet size={13} /> },
  { id: "swap", label: "Token Swap", icon: <ArrowRightLeft size={13} /> },
  { id: "limit-orders", label: "Limit Orders", icon: <TrendingUp size={13} /> },
  { id: "prediction", label: "Prediction Market", icon: <Target size={13} /> },
  { id: "protection", label: "MEV Protection", icon: <Shield size={13} /> },
  { id: "charts", label: "Price Charts", icon: <BarChart2 size={13} /> },
  { id: "history", label: "Trade History", icon: <Clock size={13} /> },
  { id: "network", label: "Network Status", icon: <Server size={13} /> },
  { id: "dashboard", label: "Dashboard", icon: <Settings size={13} /> },
  { id: "security", label: "Security", icon: <Lock size={13} /> },
  { id: "developer", label: "Developer", icon: <Code2 size={13} /> },
];

export default function Documentation() {
  const [active, setActive] = useState("overview");

  function handleSelect(id: string) {
    setActive(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="min-h-screen bg-terminal-bg text-terminal-text font-mono">
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.012]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,229,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <DocHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-8 py-8">
        <DocSidebar
          sections={SECTIONS}
          active={active}
          onSelect={handleSelect}
        />

        <main className="flex-1 min-w-0 space-y-16">
          <OverviewSection />
          <GettingStartedSection />
          <WalletSection />
          <SwapSection />
          <LimitOrdersSection />
          <PredictionSection />
          <ProtectionSection />
          <ChartsSection />
          <HistorySection />
          <NetworkSection />
          <DashboardSection />
          <SecuritySection />
          <DeveloperSection />
        </main>
      </div>
    </div>
  );
}
