import React, { useState, useEffect, useRef } from 'react'
import { Target, CheckCircle2, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'

export default function PredictionComingSoon() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(null)
  const [error, setError] = useState('')
  const timerRef = useRef(null)

  useEffect(() => {
    if (!submitted) return
    setCountdown(5)
    const tick = setInterval(() => {
      setCountdown((c) => (c > 1 ? c - 1 : null))
    }, 1000)
    const reset = setTimeout(() => {
      clearInterval(tick)
      setSubmitted(false)
      setEmail('')
      setCountdown(null)
    }, 5000)
    return () => {
      clearInterval(tick)
      clearTimeout(reset)
    }
  }, [submitted])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Enter a valid email address.')
      return
    }
    setError('')
    setLoading(true)
    if (supabase) {
      const { error: dbErr } = await supabase.from('waitingList').insert({ email: trimmed })
      if (dbErr && !dbErr.message?.includes('duplicate') && !dbErr.code?.includes('23505')) {
        setLoading(false)
        setError('Something went wrong. Please try again.')
        return
      }
      fetch('/api/send-waitlist-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      }).catch(() => {})
    }
    setLoading(false)
    setSubmitted(true)
  }

  return (
    <motion.div
      className="w-full mx-auto"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <div className="bg-terminal-card border border-terminal-border rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-terminal-border flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-terminal-dim/30" />
          <span className="font-mono font-bold text-terminal-dim text-sm tracking-wider">PREDICTION MARKETS</span>
          <span className="font-mono text-xs text-terminal-dim/40 tracking-widest hidden sm:inline">/ COMING SOON</span>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          <div className="rounded-xl border border-terminal-accent/20 bg-terminal-accent/5 p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <Target size={15} className="text-terminal-accent shrink-0" />
              <span className="font-mono font-bold text-xs tracking-wider text-terminal-accent">DFLOW PREDICTION MARKETS</span>
            </div>
            <p className="font-mono text-sm text-terminal-text leading-relaxed">
              Prediction market execution via DFlow — coming soon.
            </p>
            <p className="font-mono text-xs text-terminal-dim leading-relaxed mt-3">
              Spot traders get MEV-protected swaps today. Prediction market traders get the same protection next.
            </p>
          </div>

          <div className="space-y-2.5">
            {[
              'JIT auction routing for outcome token trades',
              'Front-running and sandwich attack prevention',
              'Same DFlow MEV protection as spot swaps',
              'Live market resolution feeds on-chain',
            ].map((item) => (
              <div key={item} className="flex items-start gap-2.5">
                <div className="w-1 h-1 rounded-full bg-terminal-dim/40 shrink-0 mt-1.5" />
                <span className="font-mono text-xs text-terminal-dim leading-relaxed">{item}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-terminal-border" />

          {submitted ? (
            <motion.div
              className="flex items-center gap-2.5 px-4 py-3.5 rounded-xl bg-terminal-green/10 border border-terminal-green/30"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <CheckCircle2 size={15} className="text-terminal-green shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-mono text-xs font-bold text-terminal-green">You're on the list.</p>
                <p className="font-mono text-xs text-terminal-dim mt-0.5">We'll email you when prediction markets go live.</p>
              </div>
              {countdown !== null && (
                <span className="font-mono text-xs text-terminal-dim/50 shrink-0">{countdown}s</span>
              )}
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-2.5">
              <p className="font-mono text-xs text-terminal-dim">Get notified when prediction markets launch:</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  className="flex-1 bg-terminal-surface border border-terminal-border focus:border-terminal-accent/50 outline-none rounded-lg px-3 py-2.5 font-mono text-sm text-terminal-text placeholder-terminal-dim/30 transition-colors min-w-0"
                />
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2.5 rounded-lg bg-terminal-accent text-black font-mono text-xs font-bold tracking-wider hover:bg-terminal-accentDim transition-colors shrink-0 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-1.5"
                  whileHover={loading ? {} : { scale: 1.02 }}
                  whileTap={loading ? {} : { scale: 0.97 }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      <span>Queuing...</span>
                    </>
                  ) : (
                    'Notify me'
                  )}
                </motion.button>
              </div>
              {error && <p className="font-mono text-xs text-terminal-red">{error}</p>}
            </form>
          )}
        </div>
      </div>
    </motion.div>
  )
}
