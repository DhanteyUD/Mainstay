import { useRef } from "react";
import { motion, useMotionValue, useAnimationFrame } from "framer-motion";
import dflowLogo from "../../../assets/dflow-logo.png";
import solanaLogo from "../../../assets/solana-logo.png";
import heliusLogo from "../../../assets/helius-logo.png";
import supabaseLogo from "../../../assets/supabase-logo.png";
import jupiterLogo from "../../../assets/jupiter-logo.png";

const partners = [
  { name: "DFlow Protocol", logo: dflowLogo, height: "h-32" },
  { name: "Solana", logo: solanaLogo, height: "h-28" },
  { name: "Helius", logo: heliusLogo, height: "h-20" },
  { name: "Supabase", logo: supabaseLogo, height: "h-28" },
  { name: "Jupiter", logo: jupiterLogo, height: "h-28" },
];

const SPEED = 60; // px per second

function MarqueeTrack() {
  const trackRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

  useAnimationFrame((_, delta) => {
    if (!trackRef.current) return;
    const halfWidth = trackRef.current.scrollWidth / 2;
    let next = x.get() - (SPEED * delta) / 1000;
    if (next <= -halfWidth) next += halfWidth;
    x.set(next);
  });

  return (
    <motion.div ref={trackRef} className="flex w-max" style={{ x }}>
      {[...partners, ...partners].map((p, i) => (
        <div key={i} className="flex items-center justify-center px-10 shrink-0">
          <img
            src={p.logo}
            alt={p.name}
            className={`${p.height} w-auto object-contain opacity-60 hover:opacity-100 transition-opacity duration-200`}
          />
        </div>
      ))}
    </motion.div>
  );
}

export default function PartnersSection() {
  return (
    <section className="relative z-10 py-16 px-4 border-t border-terminal-border/30 overflow-hidden">
      <div className="max-w-4xl mx-auto text-center mb-8">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="font-dm-mono text-xs text-terminal-dim/40 tracking-widest uppercase"
        >
          Powered By
        </motion.p>
      </div>

      <div className="relative w-full overflow-hidden">
        <MarqueeTrack />
      </div>
    </section>
  );
}
