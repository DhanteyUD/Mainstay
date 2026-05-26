import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import type { Props } from "../types";

export default function WaitlistSection({ onLaunch }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    setLoading(true);

    if (supabase) {
      const { error: dbErr } = await supabase
        .from("waitingList")
        .insert({ email: trimmed });

      if (
        dbErr &&
        !dbErr.message?.includes("duplicate") &&
        !dbErr.code?.includes("23505")
      ) {
        setLoading(false);
        setError("Something went wrong. Please try again.");
        return;
      }

      fetch("/api/send-waitlist-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      }).catch(() => {});
    }

    setLoading(false);
    setSubmitted(true);
  }

  return (
    <section className="relative z-10 py-20 px-8 md:px-4 border-t border-terminal-border/30 bg-terminal-surface/20">
      <div className="relative max-w-xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="inline-block font-dm-mono text-xs text-terminal-accent border border-terminal-accent/30 px-3 py-1.5 rounded-full tracking-widest mb-6">
            EARLY ACCESS
          </span>
          <h2 className="font-dm-mono font-black text-4xl sm:text-5xl tracking-tight leading-none mb-4">
            BE FIRST WHEN
            <br />
            <span className="text-terminal-accent">NEW FEATURES DROP</span>
          </h2>
          <p className="font-dm-mono text-xs md:text-sm text-terminal-dim mb-8 leading-relaxed">
            Prediction markets on mainnet. Telegram limit order alerts. Portfolio
            analytics. Get notified before anyone else — and help shape what we
            build next.
          </p>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-3 px-5 py-4 rounded-xl bg-terminal-green/10 border border-terminal-green/30 mb-6"
            >
              <CheckCircle2 size={16} className="text-terminal-green shrink-0" />
              <div className="text-left">
                <p className="font-dm-mono text-sm font-bold text-terminal-green">
                  You're on the list.
                </p>
                <p className="font-dm-mono text-xs text-terminal-dim mt-0.5">
                  We'll email you when new features are ready.
                </p>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-2 mb-3 flex-wrap justify-center">
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="your@email.com"
                required
                className="flex-1 w-full md:min-w-[220px] md:max-w-xs bg-terminal-card border border-terminal-border focus:border-terminal-accent/50 outline-none rounded-lg px-4 py-3 font-dm-mono text-sm text-terminal-text placeholder-terminal-dim/30 transition-colors"
              />
              <motion.button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-lg bg-terminal-accent text-terminal-bg font-dm-mono text-sm font-bold tracking-wider hover:opacity-85 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                whileHover={loading ? {} : { scale: 1.02 }}
                whileTap={loading ? {} : { scale: 0.97 }}
              >
                {loading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Joining...
                  </>
                ) : (
                  "JOIN WAITLIST"
                )}
              </motion.button>
            </form>
          )}

          {error && (
            <p className="font-dm-mono text-xs text-terminal-red mb-3">{error}</p>
          )}
          <p className="font-dm-mono text-xs text-terminal-dim/40 mb-8">
            No spam. One email when something ships.
          </p>

          <div className="border-t border-terminal-border/50 pt-6">
            <p className="font-dm-mono text-xs text-terminal-dim/60 mb-4">
              Or launch the app now and get early access to all features as they roll out.
            </p>
            <motion.button
              onClick={onLaunch}
              className="inline-flex items-center gap-2 font-dm-mono text-sm text-terminal-accent border border-terminal-accent/40 px-8 py-3 rounded-xl hover:bg-terminal-accent/10 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              SWAP ON MAINSTAY
              <ArrowRight size={13} />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
