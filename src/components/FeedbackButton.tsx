import React, { useState, useEffect } from "react";
import { Bug, MessageSquare, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import FeedbackModal from "./FeedbackModal";

interface FloatState {
  icon: React.ComponentType<{ size?: number | string }>;
  label: string;
  color: string;
  border: string;
}

const FLOAT_STATES: FloatState[] = [
  {
    icon: Bug,
    label: "Report a Bug",
    color: "text-terminal-red",
    border: "border-terminal-red/30",
  },
  {
    icon: MessageSquare,
    label: "Share Feedback",
    color: "text-terminal-accent",
    border: "border-terminal-accent/30",
  },
  {
    icon: Lightbulb,
    label: "Request a Feature",
    color: "text-terminal-yellow",
    border: "border-terminal-yellow/30",
  },
];

export default function FeedbackButton() {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [cycleIdx, setCycleIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setCycleIdx((i) => (i + 1) % FLOAT_STATES.length),
      5000,
    );
    return () => clearInterval(id);
  }, []);

  const current = FLOAT_STATES[cycleIdx];
  const Icon = current.icon;

  return (
    <>
      <div className="hidden sm:block fixed bottom-6 right-6 z-[1500]">
        <motion.button
          onClick={() => setFeedbackOpen(true)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full border shadow-lg backdrop-blur-sm bg-terminal-surface/90 overflow-hidden ${current.border}`}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={cycleIdx}
              className={`flex items-center gap-2 ${current.color}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <Icon size={13} />
              <span className="font-mono text-xs tracking-wide whitespace-nowrap">
                {current.label}
              </span>
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>

      <AnimatePresence>
        {feedbackOpen && (
          <FeedbackModal onClose={() => setFeedbackOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
