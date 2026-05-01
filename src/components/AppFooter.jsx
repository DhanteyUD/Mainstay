import React, { useState, useEffect } from 'react'
import { MessageSquare, Bug, Lightbulb } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNetwork } from '../contexts/NetworkContext'
import logo from "../assets/mainstay-logo.png"
import FeedbackModal from './FeedbackModal'

const FLOAT_STATES = [
  { icon: Bug,           label: "Report a Bug",      color: "text-terminal-red",    border: "border-terminal-red/30",    bg: "bg-terminal-red/10"    },
  { icon: MessageSquare, label: "Share Feedback",     color: "text-terminal-accent", border: "border-terminal-accent/30", bg: "bg-terminal-accent/10" },
  { icon: Lightbulb,     label: "Request a Feature",  color: "text-terminal-yellow", border: "border-terminal-yellow/30", bg: "bg-terminal-yellow/10" },
]

export default function AppFooter() {
  const { isDevnet } = useNetwork()
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [cycleIdx, setCycleIdx] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setCycleIdx((i) => (i + 1) % FLOAT_STATES.length), 5000)
    return () => clearInterval(id)
  }, [])

  const current = FLOAT_STATES[cycleIdx]
  const Icon = current.icon

  return (
    <>
      <footer className="border-t border-terminal-border mt-8 py-4">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <img src={logo} alt="Mainstay Logo" className="w-6 h-6" />
              <span className="font-mono text-xs text-terminal-dim">Mainstay — Powered by DFlow Protocol</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setFeedbackOpen(true)}
                className="flex items-center gap-1 font-mono text-xs text-terminal-dim/60 hover:text-terminal-accent transition-colors duration-150 sm:hidden"
              >
                <MessageSquare size={11} />
                Feedback
              </button>
              <div className="w-1 h-1 rounded-full bg-terminal-border" />
              <span className="font-mono text-xs text-terminal-dim/40">v1.0.0</span>
              <div className="w-1 h-1 rounded-full bg-terminal-border" />
              <span className={`font-mono text-xs ${isDevnet ? 'text-terminal-yellow/60' : 'text-terminal-dim/40'}`}>
                Solana {isDevnet ? 'Devnet' : 'Mainnet'}
              </span>
            </div>
          </div>
        </div>
      </footer>

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
              <span className="font-mono text-xs tracking-wide whitespace-nowrap">{current.label}</span>
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>

      <AnimatePresence>
        {feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} />}
      </AnimatePresence>
    </>
  )
}
