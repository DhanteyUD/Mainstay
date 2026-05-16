import React from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Zap,
  TrendingUp,
  BarChart2,
  Clock,
  Target,
  ArrowRight,
  ExternalLink,
  Lock,
  Check,
  X,
  Bot,
  User,
  Coins,
} from "lucide-react";
import { VscGithubInverted } from "react-icons/vsc";
import logo from "../assets/mainstay-logo.png";

interface Props {
  onLaunch: () => void;
}

export default function LandingPage({ onLaunch }: Props) {
  return (
    <div className="min-h-screen bg-terminal-bg text-terminal-text overflow-x-hidden">
      <div className="scan-line" />
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,229,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          opacity: 0.012,
        }}
      />

      <Nav onLaunch={onLaunch} />

      <main className="relative z-10">
        <Hero onLaunch={onLaunch} />
        <StatsBar />
        <ProblemSection />
        <HowItWorksSection />
        <FeaturesSection />
        <ComparisonSection />
        <PartnersSection />
        <CtaSection onLaunch={onLaunch} />
      </main>

      <PageFooter />
    </div>
  );
}

function Nav({ onLaunch }: Props) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-terminal-border/50 bg-terminal-bg/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Mainstay" className="w-7 h-7" />
          <span className="font-mono font-bold text-base text-terminal-text tracking-wider">
            Main<span className="text-terminal-accent">stay</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/DhanteyUD/Mainstay"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 font-mono text-xs text-terminal-dim hover:text-terminal-text transition-colors"
          >
            <VscGithubInverted size={14} />
            GitHub
          </a>
          <motion.button
            onClick={onLaunch}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-mono font-bold text-xs bg-terminal-accent/10 border border-terminal-accent/40 text-terminal-accent hover:bg-terminal-accent/20 transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            Launch App
            <ArrowRight size={12} />
          </motion.button>
        </div>
      </div>
    </nav>
  );
}

function Hero({ onLaunch }: Props) {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-14 px-4">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center top, rgba(0,229,255,0.09) 0%, transparent 65%)",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-terminal-green/30 bg-terminal-green/5 mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-terminal-green animate-pulse" />
          <span className="font-mono text-xs text-terminal-green tracking-widest">
            LIVE ON SOLANA MAINNET
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display font-black text-5xl sm:text-6xl md:text-7xl tracking-tight mb-6 leading-[1.05]"
        >
          Trade on Solana.
          <br />
          <span className="text-terminal-accent">Stay Protected.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="font-mono text-sm sm:text-base text-terminal-dim max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          MEV bots extracted{" "}
          <span className="text-terminal-red font-bold">$500M+</span> from
          Solana traders in the last 16 months — silently. Mainstay routes every
          swap through{" "}
          <span className="text-terminal-accent font-semibold">
            DFlow's private JIT auction
          </span>
          , so your orders never touch the public mempool.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <motion.button
            onClick={onLaunch}
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-mono font-bold text-sm bg-terminal-accent/15 border border-terminal-accent/50 text-terminal-accent hover:bg-terminal-accent/25 transition-all group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Launch App
            <ArrowRight
              size={14}
              className="group-hover:translate-x-0.5 transition-transform"
            />
          </motion.button>
          <a
            href="https://github.com/DhanteyUD/Mainstay"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-mono text-sm border border-terminal-border bg-terminal-surface text-terminal-dim hover:text-terminal-text hover:border-terminal-border/80 transition-all"
          >
            <VscGithubInverted size={14} />
            View on GitHub
            <ExternalLink size={11} className="opacity-50" />
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
          className="mt-8 font-mono text-xs text-terminal-dim/35 tracking-widest"
        >
          NON-CUSTODIAL · OPEN SOURCE · FRONTIER HACKATHON 2026
        </motion.p>
      </div>
    </section>
  );
}

function StatsBar() {
  const stats = [
    {
      value: "$500M+",
      label: "MEV extracted on Solana (16 months)",
      accent: "text-terminal-red",
    },
    {
      value: "0.1–1%",
      label: "Value lost per unprotected swap",
      accent: "text-terminal-yellow",
    },
    {
      value: "A+",
      label: "Execution grade via DFlow JIT auction",
      accent: "text-terminal-green",
    },
  ];

  return (
    <section className="relative z-10 border-y border-terminal-border/40 bg-terminal-surface/30 backdrop-blur-sm py-10">
      <div className="max-w-4xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-4 text-center">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="flex flex-col items-center"
          >
            <div
              className={`font-mono font-black text-4xl sm:text-5xl ${s.accent} mb-2`}
            >
              {s.value}
            </div>
            <div className="font-mono text-xs text-terminal-dim/70 max-w-[180px] leading-relaxed">
              {s.label}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function ProblemSection() {
  const steps = [
    {
      step: "1",
      actor: "YOU",
      icon: <User size={12} />,
      color: "#00e5ff",
      title: "Broadcast swap",
      desc: "You submit SOL → USDC. Your transaction enters the public mempool — visible to anyone watching.",
    },
    {
      step: "2",
      actor: "BOT",
      icon: <Bot size={12} />,
      color: "#ff4757",
      title: "Front-run buy",
      desc: "An MEV bot spots your trade in milliseconds, buys SOL first at $1.00, and drives the price up to $1.03.",
    },
    {
      step: "3",
      actor: "YOU",
      icon: <Coins size={12} />,
      color: "#00e5ff",
      title: "You execute at the inflated price",
      desc: "Your swap confirms at $1.03. You paid 3% more than expected. Silent value drain — you'll never know it happened.",
    },
    {
      step: "4",
      actor: "BOT",
      icon: <Bot size={12} />,
      color: "#ff4757",
      title: "Back-run sell",
      desc: "The bot immediately sells at $1.03, pocketing risk-free profit extracted directly from your trade.",
    },
  ];

  return (
    <section className="relative z-10 py-20 px-4 border-t border-terminal-border/30">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="font-mono text-xs text-terminal-dim/60 tracking-widest uppercase mb-3 block">
            The Problem
          </span>
          <h2 className="font-display font-black text-3xl sm:text-4xl tracking-tight mb-4">
            Every unprotected swap is{" "}
            <span className="text-terminal-red">secretly taxed.</span>
          </h2>
          <p className="font-mono text-sm text-terminal-dim max-w-xl mx-auto leading-relaxed">
            Sandwich attacks happen in milliseconds, entirely automated and
            nearly invisible. Most traders never notice — they just get worse
            prices.
          </p>
        </motion.div>

        <div className="max-w-2xl mx-auto space-y-3">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="flex gap-4 rounded-xl border p-4"
              style={{
                borderColor: s.color + "22",
                background: s.color + "05",
              }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center font-mono font-black text-xs shrink-0 border mt-0.5"
                style={{
                  color: s.color,
                  borderColor: s.color + "50",
                  background: s.color + "12",
                }}
              >
                {s.step}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span
                    className="flex items-center gap-1 font-mono text-[10px] font-black tracking-widest px-1.5 py-0.5 rounded border"
                    style={{
                      color: s.color,
                      borderColor: s.color + "50",
                      background: s.color + "12",
                    }}
                  >
                    {s.icon}
                    {s.actor}
                  </span>
                  <span className="font-mono text-xs font-bold text-terminal-text">
                    {s.title}
                  </span>
                </div>
                <p className="font-mono text-xs text-terminal-dim leading-relaxed">
                  {s.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="max-w-2xl mx-auto mt-4 rounded-xl border border-terminal-yellow/20 bg-terminal-yellow/5 px-4 py-3"
        >
          <p className="font-mono text-xs text-terminal-yellow text-center leading-relaxed">
            ⚠ This happens entirely in the background, in milliseconds — and
            without MEV protection, there's nothing you can do to stop it.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      icon: <BarChart2 size={20} />,
      title: "Quote",
      color: "#00e5ff",
      desc: "DFlow's private RFQ network returns the best route and price. Mainstay calculates your MEV risk score (LOW / MEDIUM / HIGH) before you confirm a single trade.",
    },
    {
      num: "02",
      icon: <Lock size={20} />,
      title: "Sign",
      color: "#ffd700",
      desc: "Your wallet signs the transaction. The signed order is routed directly to DFlow — it never broadcasts to the public mempool where bots are listening.",
    },
    {
      num: "03",
      icon: <Shield size={20} />,
      title: "Execute",
      color: "#00ff94",
      desc: "DFlow's JIT auction fills your order at the agreed price. Post-trade, you get an execution grade (A+ to F) showing exactly how clean your fill was.",
    },
  ];

  return (
    <section className="relative z-10 py-20 px-4 border-t border-terminal-border/30">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center top, rgba(0,255,148,0.05) 0%, transparent 70%)",
        }}
      />
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="font-mono text-xs text-terminal-dim/60 tracking-widest uppercase mb-3 block">
            How It Works
          </span>
          <h2 className="font-display font-black text-3xl sm:text-4xl tracking-tight mb-4">
            Three steps.{" "}
            <span className="text-terminal-green">Zero MEV.</span>
          </h2>
          <p className="font-mono text-sm text-terminal-dim max-w-xl mx-auto leading-relaxed">
            Every trade passes through exactly three steps — and MEV is blocked
            at all three.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative bg-terminal-card border border-terminal-border rounded-2xl p-6 overflow-hidden"
            >
              <div
                className="absolute top-4 right-4 font-mono font-black text-4xl opacity-[0.07]"
                style={{ color: s.color }}
              >
                {s.num}
              </div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 border"
                style={{
                  color: s.color,
                  borderColor: s.color + "30",
                  background: s.color + "10",
                }}
              >
                {s.icon}
              </div>
              <h3
                className="font-mono font-bold text-sm tracking-wider mb-2"
                style={{ color: s.color }}
              >
                {s.title}
              </h3>
              <p className="font-mono text-xs text-terminal-dim leading-relaxed">
                {s.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: <Shield size={16} />,
      title: "MEV Risk Score",
      color: "#ff4757",
      desc: "Pre-trade risk assessment based on order size, pool liquidity, and network TPS. Know your exposure before you confirm.",
    },
    {
      icon: <BarChart2 size={16} />,
      title: "Execution Grade",
      color: "#00ff94",
      desc: "Post-trade quality score (A+ to F) comparing actual vs quoted price. We show you the receipt — every time.",
    },
    {
      icon: <TrendingUp size={16} />,
      title: "Limit Orders",
      color: "#ffd700",
      desc: "Price-triggered orders that monitor markets every 30 seconds and execute via DFlow's MEV-protected routing automatically.",
    },
    {
      icon: <Clock size={16} />,
      title: "Trade History",
      color: "#00e5ff",
      desc: "Full record of swaps, limit executions, sends, and received transfers — with cumulative MEV savings dashboard.",
    },
    {
      icon: <Zap size={16} />,
      title: "Network Status",
      color: "#a78bfa",
      desc: "Live DFlow + Helius uptime and Solana TPS indicators. Stay informed about network conditions before you trade.",
    },
    {
      icon: <Target size={16} />,
      title: "Prediction Markets",
      color: "#fb923c",
      desc: "Trade outcome tokens (YES/NO) with the same MEV protection as spot swaps. Devnet now — mainnet coming soon.",
      soon: true,
    },
  ];

  return (
    <section className="relative z-10 py-20 px-4 border-t border-terminal-border/30">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="font-mono text-xs text-terminal-dim/60 tracking-widest uppercase mb-3 block">
            Features
          </span>
          <h2 className="font-display font-black text-3xl sm:text-4xl tracking-tight">
            Everything you need.{" "}
            <span className="text-terminal-accent">Nothing you don't.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
              className="relative bg-terminal-card border border-terminal-border rounded-2xl p-5 hover:border-terminal-border/80 transition-colors"
            >
              {f.soon && (
                <span className="absolute top-4 right-4 font-mono text-[9px] text-terminal-dim border border-terminal-border/50 px-1.5 py-0.5 rounded">
                  SOON
                </span>
              )}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 border"
                style={{
                  color: f.color,
                  borderColor: f.color + "30",
                  background: f.color + "10",
                }}
              >
                {f.icon}
              </div>
              <h3 className="font-mono font-bold text-xs text-terminal-text tracking-wider mb-1.5">
                {f.title}
              </h3>
              <p className="font-mono text-xs text-terminal-dim leading-relaxed">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ComparisonSection() {
  const without = [
    "Order visible in mempool",
    "Bots can front-run",
    "Inflated fill price",
    "~0.5% MEV tax per swap",
    "No execution analytics",
    "Silent value drain",
  ];

  const withMainstay = [
    "Private order routing",
    "Bots blocked",
    "Best fill price",
    "MEV savings tracked",
    "A+–F execution grade",
    "Full transparency",
  ];

  return (
    <section className="relative z-10 py-20 px-4 border-t border-terminal-border/30">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,229,255,0.025) 0%, transparent 70%)",
        }}
      />
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="font-mono text-xs text-terminal-dim/60 tracking-widest uppercase mb-3 block">
            The Difference
          </span>
          <h2 className="font-display font-black text-3xl sm:text-4xl tracking-tight">
            Protected vs{" "}
            <span className="text-terminal-red">Unprotected</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4"
        >
          <div className="bg-terminal-card border border-terminal-red/20 rounded-2xl p-5 sm:p-6">
            <div className="font-mono text-xs font-bold text-terminal-red mb-4 tracking-wider">
              WITHOUT PROTECTION
            </div>
            <div className="space-y-3">
              {without.map((t) => (
                <div key={t} className="flex items-start gap-2">
                  <X
                    size={12}
                    className="text-terminal-red shrink-0 mt-0.5"
                  />
                  <span className="font-mono text-xs text-terminal-dim leading-snug">
                    {t}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-terminal-card border border-terminal-green/20 rounded-2xl p-5 sm:p-6">
            <div className="font-mono text-xs font-bold text-terminal-green mb-4 tracking-wider">
              MAINSTAY
            </div>
            <div className="space-y-3">
              {withMainstay.map((t) => (
                <div key={t} className="flex items-start gap-2">
                  <Check
                    size={12}
                    className="text-terminal-green shrink-0 mt-0.5"
                  />
                  <span className="font-mono text-xs text-terminal-dim leading-snug">
                    {t}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function PartnersSection() {
  const partners = [
    { name: "DFlow Protocol", color: "#66c5f6" },
    { name: "Solana", color: "#9945FF" },
    { name: "Helius", color: "#f97316" },
    { name: "Supabase", color: "#3ecf8e" },
    { name: "Jupiter", color: "#00e64d" },
  ];

  return (
    <section className="relative z-10 py-16 px-4 border-t border-terminal-border/30">
      <div className="max-w-4xl mx-auto text-center">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="font-mono text-xs text-terminal-dim/40 tracking-widest uppercase mb-8"
        >
          Powered By
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-6 sm:gap-10"
        >
          {partners.map((p) => (
            <span
              key={p.name}
              className="font-mono text-sm font-bold"
              style={{ color: p.color, opacity: 0.65 }}
            >
              {p.name}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function CtaSection({ onLaunch }: Props) {
  return (
    <section className="relative z-10 py-28 px-4 border-t border-terminal-border/30">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,229,255,0.06) 0%, transparent 65%)",
        }}
      />
      <div className="relative max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display font-black text-4xl sm:text-5xl tracking-tight mb-4">
            Ready to trade
            <br />
            <span className="text-terminal-accent">without the tax?</span>
          </h2>
          <p className="font-mono text-sm text-terminal-dim mb-8 leading-relaxed">
            Non-custodial. Open source. MEV-protected on every swap.
            <br />
            Your keys. Your orders. Your execution quality.
          </p>
          <motion.button
            onClick={onLaunch}
            className="inline-flex items-center gap-2 px-10 py-4 rounded-xl font-mono font-bold text-sm bg-terminal-accent/15 border border-terminal-accent/50 text-terminal-accent hover:bg-terminal-accent/25 transition-all group"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            Launch Mainstay
            <ArrowRight
              size={14}
              className="group-hover:translate-x-1 transition-transform"
            />
          </motion.button>
          <p className="mt-5 font-mono text-xs text-terminal-dim/30 italic">
            "Stay clean."
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function PageFooter() {
  return (
    <footer className="relative z-10 border-t border-terminal-border/40 py-8 px-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <img
            src={logo}
            alt="Mainstay"
            className="w-5 h-5 opacity-60"
          />
          <span className="font-mono text-xs text-terminal-dim/50">
            Main<span className="text-terminal-accent/50">stay</span>
          </span>
          <span className="font-mono text-xs text-terminal-dim/25 ml-1">
            · MEV-protected trading on Solana
          </span>
        </div>
        <div className="flex items-center gap-5 flex-wrap justify-center">
          <a
            href="https://github.com/DhanteyUD/Mainstay"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-terminal-dim/40 hover:text-terminal-dim transition-colors flex items-center gap-1.5"
          >
            <VscGithubInverted size={12} />
            GitHub
          </a>
          <span className="font-mono text-xs text-terminal-dim/25">
            Frontier Hackathon 2026
          </span>
          <span className="font-mono text-xs text-terminal-dim/25">
            MIT License
          </span>
        </div>
      </div>
    </footer>
  );
}
