import { motion } from "framer-motion";

export default function QuotesSection() {
  const quotes = [
    {
      text: "I didn't even know MEV was a thing. Seeing the A+ grade after my swap — knowing it got a better price than quoted — that actually surprised me.",
      attr: "User 1 — Active Solana trader",
    },
    {
      text: "The MEV risk badge before I signed made me feel like I actually understood what was happening to my trade. Every other DEX just shows me a number.",
      attr: "User 2 — DeFi power user",
    },
    {
      text: 'Wait, so every swap I\'ve been doing on DEX has been visible to bots? And this just... isn\'t?"',
      attr: "User 3 — Retail trader",
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
            What Users Said
          </span>
          <h2 className="font-dm-mono font-black text-4xl sm:text-5xl tracking-tight leading-none">
            IN THEIR
            <br />
            <span className="text-terminal-accent">OWN WORDS</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {quotes.map((q, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="bg-terminal-card border-l-[3px] border border-terminal-border rounded-bl-none p-5 flex flex-col justify-between"
              style={{ borderLeftColor: "#00e5ff" }}
            >
              <p className="font-dm-mono text-xs text-terminal-dim/80 leading-relaxed italic mb-4">
                "{q.text}
              </p>
              <p className="font-dm-mono text-[10px] text-terminal-dim/50 tracking-widest uppercase">
                {q.attr}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
