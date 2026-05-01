import React, { useState } from "react";
import { X, Bug, MessageSquare, Lightbulb, Send, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as Sentry from "@sentry/react";

const CATEGORIES = [
  { id: "bug", label: "Bug Report", icon: Bug, color: "text-terminal-red", border: "border-terminal-red/40", bg: "bg-terminal-red/10" },
  { id: "feedback", label: "Feedback", icon: MessageSquare, color: "text-terminal-accent", border: "border-terminal-accent/40", bg: "bg-terminal-accent/10" },
  { id: "feature", label: "Feature Request", icon: Lightbulb, color: "text-terminal-yellow", border: "border-terminal-yellow/40", bg: "bg-terminal-yellow/10" },
];

export default function FeedbackModal({ onClose }) {
  const [category, setCategory] = useState("feedback");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    try {
      await Sentry.captureFeedback(
        { name: name.trim() || undefined, email: email.trim() || undefined, message: message.trim() },
        { captureContext: { tags: { feedbackType: category } } },
      );
      setSubmitted(true);
      setTimeout(onClose, 2000);
    } catch {
      setSubmitting(false);
    }
  }

  const active = CATEGORIES.find((c) => c.id === category);

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        className="relative w-full max-w-md bg-terminal-surface border border-terminal-border rounded-2xl shadow-2xl overflow-hidden"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-terminal-border">
          <span className="font-mono text-sm font-bold text-terminal-text tracking-wider">SEND US A MESSAGE</span>
          <button onClick={onClose} className="text-terminal-dim hover:text-terminal-text transition-colors">
            <X size={16} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              className="flex flex-col items-center justify-center gap-3 py-12 px-5"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <CheckCircle size={36} className="text-terminal-green" />
              <p className="font-mono text-sm text-terminal-green">Received. Thank you!</p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              className="p-5 flex flex-col gap-4"
              onSubmit={handleSubmit}
              initial={{ opacity: 1 }}
            >
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border transition-all duration-150 ${
                        isActive ? `${cat.border} ${cat.bg}` : "border-terminal-border hover:border-terminal-muted"
                      }`}
                    >
                      <Icon size={15} className={isActive ? cat.color : "text-terminal-dim"} />
                      <span className={`font-mono text-[10px] tracking-wide ${isActive ? cat.color : "text-terminal-dim"}`}>
                        {cat.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="Name (optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 bg-terminal-card border border-terminal-border rounded-lg px-3 py-2 font-mono text-xs text-terminal-text placeholder:text-terminal-dim/50 focus:outline-none focus:border-terminal-accent/50"
                />
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-terminal-card border border-terminal-border rounded-lg px-3 py-2 font-mono text-xs text-terminal-text placeholder:text-terminal-dim/50 focus:outline-none focus:border-terminal-accent/50"
                />
              </div>

              <textarea
                required
                rows={5}
                placeholder={
                  category === "bug"
                    ? "Describe the bug — what happened and what you expected..."
                    : category === "feature"
                    ? "Describe the feature you'd like to see..."
                    : "Share your thoughts or suggestions..."
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="bg-terminal-card border border-terminal-border rounded-lg px-3 py-2 font-mono text-xs text-terminal-text placeholder:text-terminal-dim/50 focus:outline-none focus:border-terminal-accent/50 resize-none"
              />

              <button
                type="submit"
                disabled={submitting || !message.trim()}
                className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-mono text-xs tracking-wider font-bold transition-all duration-150 disabled:opacity-40 ${active.bg} ${active.border} border ${active.color} hover:brightness-125`}
              >
                <Send size={12} />
                {submitting ? "SENDING···" : "SEND"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
