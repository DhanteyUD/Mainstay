import { motion } from "framer-motion";

export default function HowItWorksSection() {
  const steps = [
    {
      num: "1",
      title: "Connect",
      desc: "Sign in and connect your Solflare or Phantom wallet",
      color: "#00e5ff",
    },
    {
      num: "2",
      title: "Quote",
      desc: "DFlow's private auction returns a quote — MEV risk score shown before you sign",
      color: "#ffd700",
    },
    {
      num: "3",
      title: "Sign",
      desc: "One wallet signature. Order goes directly to DFlow's private relay — never the mempool",
      color: "#a78bfa",
    },
    {
      num: "4",
      title: "Grade",
      desc: "Post-trade card shows actual vs quoted price — A+ means you got better than quoted",
      color: "#00ff94",
    },
    {
      num: "5",
      title: "Track",
      desc: "Full trade history with cumulative MEV saved and analytics dashboard",
      color: "#fb923c",
    },
  ];

  return (
    <section className="relative z-10 py-20 px-4 border-t border-terminal-border/30">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center top, rgba(0,255,148,0.04) 0%, transparent 70%)",
        }}
      />
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14"
        >
          <span className="font-dm-mono text-xs text-terminal-dim/50 tracking-widest uppercase mb-3 block">
            The Solution
          </span>
          <h2 className="font-dm-mono font-black text-4xl sm:text-5xl tracking-tight mb-4 leading-none">
            PRIVATE AUCTION.
            <br />
            <span className="text-terminal-green">BOTS BLOCKED.</span>
          </h2>
          <p className="font-dm-mono text-xs sm:text-sm text-terminal-dim max-w-xl leading-relaxed">
            Mainstay routes every mainnet swap through DFlow Protocol's
            Just-In-Time (JIT) order-flow auction. Your transaction never touches the
            public mempool.
          </p>
        </motion.div>

        <div className="relative grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-4">
          <div className="hidden md:block absolute top-8 left-[10%] right-[10%] h-px bg-terminal-border/50 pointer-events-none" />

          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="relative text-center px-2"
            >
              <div
                className="w-16 h-16 rounded-full border flex items-center justify-center font-dm-mono font-black text-2xl mx-auto mb-4 bg-terminal-card"
                style={{ color: s.color, borderColor: s.color + "60" }}
              >
                {s.num}
              </div>
              <div
                className="font-dm-mono text-xs font-bold tracking-wider mb-2"
                style={{ color: s.color }}
              >
                {s.title}
              </div>
              <p className="font-dm-mono text-xs text-terminal-dim leading-relaxed">
                {s.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
