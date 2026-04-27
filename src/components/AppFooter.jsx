import React from 'react'
import { Shield } from 'lucide-react'

export default function AppFooter() {
  return (
    <footer className="border-t border-terminal-border mt-8 py-4">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Shield size={12} className="text-terminal-accent" />
            <span className="font-mono text-xs text-terminal-dim">Mainstay — Powered by DFlow Protocol</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-terminal-dim/40">v1.0.0</span>
            <div className="w-1 h-1 rounded-full bg-terminal-border" />
            <span className="font-mono text-xs text-terminal-dim/40">Solana Mainnet</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
