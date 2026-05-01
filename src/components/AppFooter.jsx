import React, { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { useNetwork } from '../contexts/NetworkContext'
import { AnimatePresence } from 'framer-motion'
import logo from "../assets/mainstay-logo.png"
import FeedbackModal from './FeedbackModal'

export default function AppFooter() {
  const { isDevnet } = useNetwork()
  const [feedbackOpen, setFeedbackOpen] = useState(false)

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

      <AnimatePresence>
        {feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} />}
      </AnimatePresence>
    </>
  )
}
