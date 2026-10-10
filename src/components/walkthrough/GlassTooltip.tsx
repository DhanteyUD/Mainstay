import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Sparkles, X } from "lucide-react";
import type { TooltipRenderProps } from "react-joyride";

export default function GlassTooltip({
  index,
  size,
  isLastStep,
  step,
  backProps,
  primaryProps,
  skipProps,
  closeProps,
  tooltipProps,
}: TooltipRenderProps) {
  const pct = ((index + 1) / size) * 100;

  return (
    <motion.div
      {...tooltipProps}
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", damping: 24, stiffness: 300 }}
      className="relative w-[min(340px,calc(100vw-24px))] overflow-hidden rounded-3xl border border-white/20 p-5 font-mono"
      style={{
        background:
          "linear-gradient(145deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 45%, rgba(0,229,255,0.07) 100%), rgba(14,16,24,0.86)",
        backdropFilter: "blur(18px) saturate(150%)",
        WebkitBackdropFilter: "blur(18px) saturate(150%)",
        boxShadow:
          "0 24px 60px -12px rgba(0,0,0,0.65), 0 0 40px -8px rgba(0,229,255,0.28), inset 0 1px 0 rgba(255,255,255,0.22)",
      }}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-terminal-accent/25 blur-3xl" />

      <button
        {...closeProps}
        className="absolute right-3.5 top-3.5 z-10 flex cursor-pointer h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-terminal-dim transition-colors hover:bg-white/10 hover:text-terminal-text"
      >
        <X size={13} />
      </button>

      <div className="relative">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl border border-terminal-accent/30 bg-terminal-accent/15 text-terminal-accent">
            <Sparkles size={13} />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-terminal-accent">
            Step {index + 1} of {size}
          </span>
        </div>

        {step.title && (
          <h3 className="mb-2 pr-8 text-[15px] font-black leading-snug text-white">
            {step.title}
          </h3>
        )}
        <p className="text-xs leading-relaxed text-slate-300/90">
          {step.content}
        </p>

        <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-terminal-accent to-terminal-green"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            {...skipProps}
            className="cursor-pointer text-[11px] text-terminal-dim transition-colors hover:text-terminal-text"
          >
            End tour
          </button>
          <div className="flex items-center gap-2">
            {index > 0 && (
              <button
                {...backProps}
                className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-slate-200 transition-colors hover:bg-white/10"
              >
                <ArrowLeft size={12} /> Back
              </button>
            )}
            <button
              {...primaryProps}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/30 bg-gradient-to-br from-terminal-accent to-cyan-300 px-4 py-2 text-xs font-black text-terminal-bg shadow-[0_0_18px_rgba(0,229,255,0.45)] transition-transform hover:scale-[1.03] active:scale-95"
            >
              {isLastStep ? (
                <>
                  Done <Check size={12} />
                </>
              ) : (
                <>
                  Next <ArrowRight size={12} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
