import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen } from "lucide-react";
import type { Props } from "../types";

const messages = [
  { line1: "BOTS", line2: "BLOCKED" },
  { line1: "NO", line2: "FRONT-RUNS" },
  { line1: "ZERO", line2: "MEV" },
  { line1: "TRADE", line2: "CLEAN" },
];

const FACE_H = 240;
const HALF = FACE_H / 2;
const DISPLAY_DURATION = 4000;

export default function Hero({ onLaunch }: Props) {
  const cubeRef = useRef<HTMLDivElement>(null);
  const [msgIdx, setMsgIdx] = useState(0);
  const stepRef = useRef(0);
  const spinning = useRef(false);

  // Cube entrance
  useEffect(() => {
    const el = cubeRef.current;
    if (!el) return;
    gsap.set(el, { rotateX: 30, opacity: 0 });
    gsap.to(el, { rotateX: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 0.3 });
  }, []);

  // Cycling rotation
  useEffect(() => {
    const timer = setInterval(() => {
      if (spinning.current) return;
      spinning.current = true;
      stepRef.current -= 1;

      gsap.to(cubeRef.current, {
        rotateX: stepRef.current * 90,
        duration: 0.75,
        ease: "power2.inOut",
        onComplete: () => {
          spinning.current = false;
          setMsgIdx((prev) => (prev + 1) % messages.length);
        },
      });
    }, DISPLAY_DURATION);

    return () => clearInterval(timer);
  }, []);

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
        <div
          className="mb-4 select-none"
          style={{
            perspective: "1200px",
            perspectiveOrigin: "50% 50%",
            height: `${FACE_H}px`,
            overflow: "hidden",
          }}
        >
          <div
            ref={cubeRef}
            style={{
              width: "100%",
              height: `${FACE_H}px`,
              position: "relative",
              transformStyle: "preserve-3d",
              transform: "rotateX(0deg)",
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `rotateX(${i * 90}deg) translateZ(${HALF}px)`,
                  backfaceVisibility: "hidden",
                }}
              >
                <span className="block font-dm-mono font-black text-5xl sm:text-7xl md:text-8xl tracking-tight leading-[0.92] text-terminal-text">
                  {msg.line1}
                </span>
                <span
                  className="block font-dm-mono font-black text-5xl sm:text-7xl md:text-8xl tracking-tight leading-[0.92] text-terminal-accent"
                  style={{ textShadow: "0 0 40px rgba(0,229,255,0.4)" }}
                >
                  {msg.line2}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Dot indicators */}
        <motion.div
          className="flex justify-center gap-2 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {messages.map((_, i) => (
            <div
              key={i}
              className="h-1 rounded-full bg-terminal-accent transition-all duration-300"
              style={{
                opacity: i === msgIdx ? 1 : 0.2,
                width: i === msgIdx ? "20px" : "6px",
              }}
            />
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="font-dm-mono text-xs sm:text-sm text-terminal-dim max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Every Solana swap you make is{" "}
          <span className="text-terminal-text font-semibold">
            visible to MEV bots
          </span>{" "}
          before it confirms. Mainstay routes every trade through a private
          auction —{" "}
          <span className="text-terminal-text font-semibold">
            they can't see it, can't front-run it, and can't take a cut.
          </span>
          <br />
          <span className="text-terminal-green font-semibold">
            Free to use. A+ execution on every trade.
          </span>
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <motion.button
            onClick={onLaunch}
            className="hidden sm:flex items-center gap-2 px-8 py-3.5 rounded-xl font-dm-mono font-bold text-sm bg-terminal-accent text-terminal-bg hover:opacity-85 transition-all group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            LAUNCH APP
            <ArrowRight
              size={14}
              className="group-hover:translate-x-0.5 transition-transform"
            />
          </motion.button>
          <a
            href="/documentation"
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-dm-mono text-sm border border-terminal-border bg-terminal-surface text-terminal-dim hover:text-terminal-text hover:border-terminal-border/80 transition-all"
          >
            <BookOpen size={14} />
            View Documentation
          </a>
        </motion.div>
      </div>
    </section>
  );
}
