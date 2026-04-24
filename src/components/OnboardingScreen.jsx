import React, { useState } from 'react'
import { Shield, ArrowRight, Zap, ChevronRight } from 'lucide-react'

const STORAGE_KEY = 'mev_shield_onboarding_v1'

export function useOnboarding() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true')
    } catch { /* silent */ }
    setDismissed(true)
  }

  return { dismissed, dismiss }
}

export default function OnboardingScreen({ onDismiss }) {
  const [step, setStep] = useState(0) // 0 = what is MEV, 1 = sandwich diagram, 2 = DFlow protection

  const next = () => {
    if (step < 2) {
      setStep(s => s + 1)
    } else {
      onDismiss()
    }
  }

  return (
    <div className="fixed inset-0 bg-terminal-bg z-50 flex flex-col items-center justify-center p-4 overflow-y-auto">
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,229,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Glow */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center top, rgba(0,229,255,0.08) 0%, transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="relative">
            <Shield size={24} className="text-terminal-accent" />
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-terminal-green animate-pulse" />
          </div>
          <span className="font-mono font-bold text-xl text-terminal-text tracking-wider">
            MEV <span className="text-terminal-accent">SHIELD</span>
          </span>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="h-1 rounded-full transition-all duration-300"
              style={{
                width: i === step ? 24 : 8,
                background: i === step ? '#00e5ff' : i < step ? 'rgba(0,229,255,0.4)' : 'rgba(255,255,255,0.1)',
              }}
            />
          ))}
        </div>

        {/* Step 0 — What is MEV */}
        {step === 0 && (
          <div className="bg-terminal-card border border-terminal-border rounded-2xl p-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-terminal-accent/10 border border-terminal-accent/30 flex items-center justify-center">
                <span className="font-mono font-black text-sm text-terminal-accent">?</span>
              </div>
              <h2 className="font-mono font-bold text-terminal-text text-lg tracking-wide">
                What is MEV?
              </h2>
            </div>

            <p className="font-mono text-sm text-terminal-dim leading-relaxed mb-4">
              <span className="text-terminal-text font-semibold">Maximal Extractable Value (MEV)</span> is
              profit extracted by bots that reorder, insert, or censor transactions before yours
              is confirmed — effectively taxing every trade you make.
            </p>
            <p className="font-mono text-sm text-terminal-dim leading-relaxed">
              On Solana, MEV bots monitor the mempool in real time and can
              steal value from your swap before it even lands on-chain —
              often costing retail traders <span className="text-terminal-red font-semibold">0.1%–1%</span> per transaction.
            </p>

            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                { label: 'Front-running', desc: 'Bot copies your trade and executes first' },
                { label: 'Sandwiching', desc: 'Bot buys before and sells after your swap' },
                { label: 'Back-running', desc: 'Bot exploits the price you moved' },
              ].map(({ label, desc }) => (
                <div
                  key={label}
                  className="rounded-lg border border-terminal-red/20 bg-terminal-red/5 p-3"
                >
                  <div className="font-mono text-xs font-bold text-terminal-red mb-1">{label}</div>
                  <div className="font-mono text-xs text-terminal-dim leading-snug">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 1 — Sandwich attack diagram */}
        {step === 1 && (
          <div className="bg-terminal-card border border-terminal-border rounded-2xl p-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-terminal-red/10 border border-terminal-red/30 flex items-center justify-center">
                <span className="text-base">🥪</span>
              </div>
              <h2 className="font-mono font-bold text-terminal-text text-lg tracking-wide">
                How a Sandwich Attack Works
              </h2>
            </div>

            <p className="font-mono text-xs text-terminal-dim leading-relaxed mb-5">
              A sandwich attack wraps your swap between two bot transactions, forcing
              you to buy at a worse price while the attacker pockets the difference.
            </p>

            {/* Diagram */}
            <div className="space-y-2">
              {/* Step 1 */}
              <SandwichStep
                number="1"
                actor="attacker"
                actorLabel="BOT"
                color="#ff4444"
                action="Front-run buy"
                detail="Bot detects your pending swap, buys the token first at the current price, pushing the price UP."
                icon="⬆"
                priceLabel="Price: $1.00 → $1.03"
              />

              {/* Arrow */}
              <div className="flex items-center justify-center py-0.5">
                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-px h-3 bg-terminal-border" />
                  <ChevronRight size={12} className="text-terminal-dim rotate-90" />
                </div>
              </div>

              {/* Step 2 */}
              <SandwichStep
                number="2"
                actor="victim"
                actorLabel="YOU"
                color="#ffd700"
                action="Your swap executes"
                detail="Your transaction lands at the inflated price — you pay more than expected."
                icon="💸"
                priceLabel="You pay: $1.03 (not $1.00)"
              />

              {/* Arrow */}
              <div className="flex items-center justify-center py-0.5">
                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-px h-3 bg-terminal-border" />
                  <ChevronRight size={12} className="text-terminal-dim rotate-90" />
                </div>
              </div>

              {/* Step 3 */}
              <SandwichStep
                number="3"
                actor="attacker"
                actorLabel="BOT"
                color="#ff4444"
                action="Back-run sell"
                detail="Bot immediately sells at the now-higher price, locking in risk-free profit."
                icon="⬇"
                priceLabel="Bot profit: ~$0.03 per token"
              />
            </div>

            <div className="mt-4 rounded-lg border border-terminal-red/20 bg-terminal-red/5 px-3 py-2">
              <p className="font-mono text-xs text-terminal-red">
                ⚠ This happens in milliseconds, entirely automated, and is nearly impossible
                to avoid on public mempools — <span className="font-semibold">without MEV protection.</span>
              </p>
            </div>
          </div>
        )}

        {/* Step 2 — DFlow protection */}
        {step === 2 && (
          <div className="bg-terminal-card border border-terminal-border rounded-2xl p-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-terminal-green/10 border border-terminal-green/30 flex items-center justify-center">
                <Shield size={15} className="text-terminal-green" />
              </div>
              <h2 className="font-mono font-bold text-terminal-text text-lg tracking-wide">
                How DFlow Protects You
              </h2>
            </div>

            <p className="font-mono text-sm text-terminal-dim leading-relaxed mb-5">
              MEV Shield routes every swap through{' '}
              <span className="text-terminal-accent font-semibold">DFlow's order flow auction</span> —
              a private network where professional market makers compete to fill your order
              at the best possible price, completely bypassing the public mempool.
            </p>

            {/* Protection flow */}
            <div className="space-y-3 mb-5">
              {[
                {
                  icon: '🔒',
                  title: 'Private order routing',
                  desc: 'Your order never touches the public mempool — bots cannot see or front-run it.',
                },
                {
                  icon: '⚡',
                  title: 'JIT auction (Just-In-Time)',
                  desc: 'Market makers compete in a sealed-bid auction to fill your order at the best price.',
                },
                {
                  icon: '✅',
                  title: 'Guaranteed execution',
                  desc: 'Winning market maker executes at the agreed price — no bait-and-switch.',
                },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-lg bg-terminal-green/10 border border-terminal-green/20 flex items-center justify-center text-base shrink-0">
                    {icon}
                  </div>
                  <div>
                    <div className="font-mono text-xs font-bold text-terminal-text mb-0.5">{title}</div>
                    <div className="font-mono text-xs text-terminal-dim leading-snug">{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Before/After comparison */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-terminal-red/20 bg-terminal-red/5 p-3">
                <div className="font-mono text-xs font-bold text-terminal-red mb-2">Without protection</div>
                <div className="space-y-1">
                  {['Visible in mempool', 'Bots front-run', 'Worse fill price', '~0.5% MEV tax'].map(t => (
                    <div key={t} className="flex items-center gap-1.5">
                      <span className="text-terminal-red text-xs">✗</span>
                      <span className="font-mono text-xs text-terminal-dim">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-terminal-green/20 bg-terminal-green/5 p-3">
                <div className="font-mono text-xs font-bold text-terminal-green mb-2">MEV Shield</div>
                <div className="space-y-1">
                  {['Private routing', 'Bots blocked', 'Best fill price', 'MEV saved'].map(t => (
                    <div key={t} className="flex items-center gap-1.5">
                      <span className="text-terminal-green text-xs">✓</span>
                      <span className="font-mono text-xs text-terminal-dim">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CTA button */}
        <button
          onClick={next}
          className="mt-5 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-mono font-bold text-sm bg-terminal-accent/10 border border-terminal-accent/40 text-terminal-accent hover:bg-terminal-accent/20 transition-all duration-200 group"
        >
          {step < 2 ? (
            <>
              <span>Next</span>
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </>
          ) : (
            <>
              <Zap size={14} />
              <span>Got it, start trading</span>
            </>
          )}
        </button>

        {/* Skip link */}
        {step < 2 && (
          <button
            onClick={onDismiss}
            className="mt-3 w-full text-center font-mono text-xs text-terminal-dim/50 hover:text-terminal-dim transition-colors"
          >
            Skip intro
          </button>
        )}
      </div>
    </div>
  )
}

function SandwichStep({ number, actorLabel, color, action, detail, icon, priceLabel }) {
  return (
    <div
      className="rounded-xl border p-3 flex gap-3"
      style={{ borderColor: color + '30', background: color + '08' }}
    >
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center font-mono font-black text-xs shrink-0 mt-0.5 border"
        style={{ color, borderColor: color + '60', background: color + '15' }}
      >
        {number}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span
            className="font-mono text-xs font-black tracking-widest px-1.5 py-0.5 rounded border"
            style={{ color, borderColor: color + '50', background: color + '15' }}
          >
            {actorLabel}
          </span>
          <span className="font-mono text-xs font-bold text-terminal-text">{action}</span>
          <span className="text-sm">{icon}</span>
        </div>
        <p className="font-mono text-xs text-terminal-dim leading-snug">{detail}</p>
        <div
          className="mt-1.5 font-mono text-xs font-semibold"
          style={{ color }}
        >
          {priceLabel}
        </div>
      </div>
    </div>
  )
}
