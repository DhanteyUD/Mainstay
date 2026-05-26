import { motion } from "framer-motion";
import { Shield, BarChart2, TrendingUp, Clock, Wifi, Target } from "lucide-react";

export default function FeaturesSection() {
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
      icon: <Wifi size={16} />,
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
          <span className="font-dm-mono text-xs text-terminal-dim/50 tracking-widest uppercase mb-3 block">
            Features
          </span>
          <h2 className="font-dm-mono font-black text-4xl sm:text-5xl tracking-tight leading-none">
            EVERYTHING YOU NEED.
            <br />
            <span className="text-terminal-accent">NOTHING YOU DON'T.</span>
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
                <span className="absolute top-4 right-4 font-dm-mono text-[9px] text-terminal-dim border border-terminal-border/50 px-1.5 py-0.5 rounded">
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
              <h3 className="font-dm-mono font-bold text-xs text-terminal-text tracking-wider mb-1.5">
                {f.title}
              </h3>
              <p className="font-dm-mono text-xs text-terminal-dim leading-relaxed">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
