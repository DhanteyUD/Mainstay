import React from "react";
import { motion } from "framer-motion";
import { User, Bot, Coins } from "lucide-react";

export default function ProblemSection() {
  const attacks = [
    {
      num: "01",
      title: "Front-running",
      desc: "Bot sees your pending swap, buys the token first, pushes the price up. You buy at a worse price. Bot sells immediately.",
    },
    {
      num: "02",
      title: "Sandwiching",
      desc: "Bot wraps your trade — buys before, sells after. You're the filling. The price you pay and the price you get are both worse.",
    },
    {
      num: "03",
      title: "Back-running",
      desc: "Bot exploits the price impact your trade created. The value you moved in the market gets captured by a bot before anyone else.",
    },
  ];

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
      desc: "MEV bot spots your trade in milliseconds, buys SOL first at $1.00 — pushing the price up to $1.03.",
    },
    {
      step: "3",
      actor: "YOU",
      icon: <Coins size={12} />,
      color: "#00e5ff",
      title: "Your swap lands at the inflated price",
      desc: "Your transaction confirms at $1.03. You paid 3% more than expected. Silent value drain.",
    },
    {
      step: "4",
      actor: "BOT",
      icon: <Bot size={12} />,
      color: "#ff4757",
      title: "Back-run sell",
      desc: "Bot sells immediately at $1.03 — risk-free profit ~$0.03 per token, funded entirely by your trade.",
    },
  ];

  return (
    <section className="relative z-10 py-20 px-4 border-t border-terminal-border/30 bg-terminal-surface/20">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14"
        >
          <span className="font-dm-mono text-xs text-terminal-dim/50 tracking-widest uppercase mb-3 block">
            The Problem
          </span>
          <h2 className="font-dm-mono font-black text-4xl sm:text-5xl tracking-tight mb-4 leading-none">
            $1.1 BILLION
            <br />
            <span className="text-terminal-red">STOLEN IN 2024</span>
          </h2>
          <p className="font-dm-mono text-xs sm:text-sm text-terminal-dim max-w-xl leading-relaxed">
            Not from hacks. Not from exploits. From bots — silently — on every
            public DEX, on every swap. MEV bots monitor the Solana mempool and
            exploit your trades before they confirm.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-14">
          {attacks.map((a, i) => (
            <motion.div
              key={a.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="relative bg-terminal-card border border-terminal-red/20 p-5 overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-terminal-red" />
              <div className="font-dm-mono font-black text-5xl text-terminal-red/10 leading-none mb-2">
                {a.num}
              </div>
              <div className="font-dm-mono text-xs font-bold text-terminal-red tracking-widest mb-2">
                {a.title}
              </div>
              <p className="font-dm-mono text-xs text-terminal-dim/80 leading-relaxed">
                {a.desc}
              </p>
            </motion.div>
          ))}
        </div>

        <p className="font-dm-mono text-xs text-terminal-dim/50 tracking-widest uppercase mb-4">
          How a sandwich attack unfolds
        </p>
        <div className=" space-y-3">
          {steps.map((s, i) => (
            <React.Fragment key={s.step}>
              <motion.div
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
                  className="w-7 h-7 rounded-full flex items-center justify-center font-dm-mono font-black text-xs shrink-0 border mt-0.5"
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
                      className="flex items-center gap-1 font-dm-mono text-[10px] font-black tracking-widest px-1.5 py-0.5 rounded border"
                      style={{
                        color: s.color,
                        borderColor: s.color + "50",
                        background: s.color + "12",
                      }}
                    >
                      {s.icon}
                      {s.actor}
                    </span>
                    <span className="font-dm-mono text-xs font-bold text-terminal-text">
                      {s.title}
                    </span>
                  </div>
                  <p className="font-dm-mono text-xs text-terminal-dim leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </motion.div>
              {i < steps.length - 1 && (
                <div className="text-terminal-dim/30 text-center text-lg leading-none select-none">
                  ↓
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
