import { motion } from "framer-motion";
import { X, Check } from "lucide-react";

export default function ComparisonSection() {
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
    <section className="relative z-10 py-20 px-4 border-t border-terminal-border/30 bg-terminal-surface/20">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,229,255,0.02) 0%, transparent 70%)",
        }}
      />
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="font-dm-mono text-xs text-terminal-dim/50 tracking-widest uppercase mb-3 block">
            The Difference
          </span>
          <h2 className="font-dm-mono font-black text-4xl sm:text-5xl tracking-tight leading-none">
            PROTECTED VS <span className="text-terminal-red">UNPROTECTED</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="bg-terminal-card border border-terminal-green/20 rounded-2xl p-5 sm:p-6">
            <div className="font-dm-mono text-xs font-bold text-terminal-green mb-4 tracking-wider">
              MAINSTAY
            </div>
            <div className="space-y-3">
              {withMainstay.map((t) => (
                <div key={t} className="flex items-start gap-2">
                  <Check
                    size={12}
                    className="text-terminal-green shrink-0 mt-0.5"
                  />
                  <span className="font-dm-mono text-xs text-terminal-dim leading-snug">
                    {t}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-terminal-card border border-terminal-red/20 rounded-2xl p-5 sm:p-6">
            <div className="font-dm-mono text-xs font-bold text-terminal-red mb-4 tracking-wider">
              WITHOUT PROTECTION
            </div>
            <div className="space-y-3">
              {without.map((t) => (
                <div key={t} className="flex items-start gap-2">
                  <X size={12} className="text-terminal-red shrink-0 mt-0.5" />
                  <span className="font-dm-mono text-xs text-terminal-dim leading-snug">
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
