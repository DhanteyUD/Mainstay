import React, { useState } from 'react'
import { Shield, Activity, Zap, Clock, Info, Wallet, RefreshCw } from 'lucide-react'
import { useWallet } from '@solana/wallet-adapter-react'
import SwapInterface from './components/SwapInterface'
import TradeHistory from './components/TradeHistory'
import OnboardingScreen, { useOnboarding } from './components/OnboardingScreen'
import { useTrades } from './hooks/useTrades'
import { useWalletBalance } from './hooks/useWalletBalance'

// Tab IDs
const TAB_INFO = 'info'
const TAB_HISTORY = 'history'

export default function App() {
  const { publicKey, connected } = useWallet()
  const walletAddress = publicKey?.toBase58() || null
  const { balance, loading: balLoading, refresh: refreshBalance } = useWalletBalance()

  const { trades, loading, error, saveTrade, fetchTrades, dbEnabled } = useTrades(walletAddress)
  const [rightTab, setRightTab] = useState(TAB_INFO)
  const { dismissed, dismiss } = useOnboarding()

  if (!dismissed) {
    return <OnboardingScreen onDismiss={dismiss} />
  }

  return (
    <div className="min-h-screen bg-terminal-bg relative">
      {/* Scan line effect */}
      <div className="scan-line" />

      {/* Grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,229,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top nav */}
      <header className="border-b border-terminal-border bg-terminal-surface/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Shield size={20} className="text-terminal-accent" />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-terminal-green animate-pulse" />
            </div>
            <div>
              <span className="font-mono font-bold text-terminal-text text-base tracking-wider">
                MEV
              </span>
              <span className="font-mono font-bold text-terminal-accent text-base tracking-wider ml-1">
                SHIELD
              </span>
            </div>
          </div>

          {/* Center tagline */}
          <div className="hidden sm:flex items-center gap-2 text-terminal-dim text-xs font-mono">
            <Zap size={11} className="text-terminal-accent" />
            <span>Protected DEX swaps on Solana</span>
          </div>

          {/* Right side: balance chip + ONLINE */}
          <div className="flex items-center gap-2">
            {connected && (
              <div className="flex items-center gap-1.5 bg-terminal-card border border-terminal-green/25 rounded-lg px-3 py-1.5 group">
                <Wallet size={11} className="text-terminal-green shrink-0" />
                {balLoading && balance === null ? (
                  <span className="font-mono text-xs text-terminal-dim tracking-wider">···</span>
                ) : balance != null ? (
                  <span className="font-mono text-xs text-terminal-green tracking-wider">
                    {balance < 0.001
                      ? balance.toFixed(6)
                      : balance < 100
                      ? balance.toFixed(4)
                      : balance.toFixed(2)}{' '}
                    <span className="text-terminal-dim">SOL</span>
                  </span>
                ) : (
                  <span className="font-mono text-xs text-terminal-dim tracking-wider">— SOL</span>
                )}
                <button
                  onClick={refreshBalance}
                  title="Refresh balance"
                  className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity ml-0.5 text-terminal-dim hover:text-terminal-green"
                >
                  <RefreshCw size={9} className={balLoading ? 'animate-spin' : ''} />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 bg-terminal-card border border-terminal-border rounded-lg px-3 py-1.5">
              <Activity size={11} className="text-terminal-green animate-pulse" />
              <span className="font-mono text-xs text-terminal-green tracking-wider">ONLINE</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
          {/* Swap panel */}
          <div className="w-full max-w-md mx-auto lg:mx-0 shrink-0">
            <SwapInterface onSaveTrade={saveTrade} />
          </div>

          {/* Right panel — tabbed */}
          <div className="w-full max-w-sm mx-auto lg:mx-0">
            {/* Tab bar */}
            <div className="flex gap-1 mb-4 bg-terminal-card border border-terminal-border rounded-xl p-1">
              <TabBtn
                active={rightTab === TAB_INFO}
                onClick={() => setRightTab(TAB_INFO)}
                icon={<Info size={12} />}
                label="Protection"
              />
              <TabBtn
                active={rightTab === TAB_HISTORY}
                onClick={() => {
                  setRightTab(TAB_HISTORY)
                  fetchTrades()
                }}
                icon={<Clock size={12} />}
                label="History"
                badge={trades.length > 0 ? trades.length : null}
              />
            </div>

            {/* Tab content */}
            {rightTab === TAB_INFO && (
              <div className="space-y-4">
                {/* DFlow protection card */}
                <InfoCard
                  title="DFlow MEV Protection"
                  accentColor="text-terminal-accent"
                  borderColor="border-terminal-accent/20"
                  bgColor="bg-terminal-accent/5"
                  icon={<Shield size={14} className="text-terminal-accent" />}
                >
                  <p className="text-terminal-dim text-xs font-mono leading-relaxed">
                    DFlow routes your orders through a network of market makers competing
                    for your flow via Just-In-Time (JIT) auctions. This eliminates
                    front-running and sandwich attacks — common MEV vectors on Solana.
                  </p>
                  <div className="mt-3 space-y-1.5">
                    <Feature label="Front-running protection" />
                    <Feature label="Sandwich attack prevention" />
                    <Feature label="JIT liquidity routing" />
                    <Feature label="Best execution price" />
                  </div>
                </InfoCard>

                {/* How it works */}
                <InfoCard
                  title="How It Works"
                  accentColor="text-terminal-green"
                  borderColor="border-terminal-green/20"
                  bgColor="bg-terminal-green/5"
                  icon={<Zap size={14} className="text-terminal-green" />}
                >
                  <div className="space-y-3">
                    <Step number="1" title="Quote" description="DFlow fetches a live quote from its order flow auction network." />
                    <Step number="2" title="Sign" description="You sign the transaction in your wallet — no order leaves without your approval." />
                    <Step number="3" title="Execute" description="Market makers compete in a sealed-bid auction for your order." />
                    <Step number="4" title="Confirm" description="Transaction is confirmed on-chain with a verified execution report." />
                  </div>
                </InfoCard>

                {/* Warning */}
                <div className="rounded-xl border border-terminal-yellow/20 bg-terminal-yellow/5 p-4">
                  <div className="flex items-start gap-2">
                    <span className="text-terminal-yellow text-base leading-none">⚠</span>
                    <div>
                      <div className="font-mono text-xs font-semibold text-terminal-yellow mb-1">
                        Mainnet Trading
                      </div>
                      <p className="font-mono text-xs text-terminal-dim leading-relaxed">
                        This interface executes real transactions on Solana mainnet.
                        Only connect a wallet you control and trade amounts you're comfortable with.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {rightTab === TAB_HISTORY && (
              <div className="bg-terminal-card border border-terminal-border rounded-2xl p-5">
                <TradeHistory
                  walletAddress={walletAddress}
                  trades={trades}
                  loading={loading}
                  error={error}
                  onRefresh={fetchTrades}
                  dbEnabled={dbEnabled}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-terminal-border mt-8 py-4">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Shield size={12} className="text-terminal-accent" />
              <span className="font-mono text-xs text-terminal-dim">
                MEV Shield — Powered by DFlow Protocol
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs text-terminal-dim/40">v1.0.0</span>
              <div className="w-1 h-1 rounded-full bg-terminal-border" />
              <span className="font-mono text-xs text-terminal-dim/40">Solana Mainnet</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function InfoCard({ title, icon, children, accentColor, borderColor, bgColor }) {
  return (
    <div className={`rounded-xl border ${borderColor} ${bgColor} p-4`}>
      <div className={`flex items-center gap-2 mb-3 ${accentColor}`}>
        {icon}
        <span className="font-mono font-bold text-xs tracking-wider">{title.toUpperCase()}</span>
      </div>
      {children}
    </div>
  )
}

function Feature({ label }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-1 h-1 rounded-full bg-terminal-green" />
      <span className="font-mono text-xs text-terminal-dim">{label}</span>
    </div>
  )
}

function Step({ number, title, description }) {
  return (
    <div className="flex gap-3">
      <div className="w-5 h-5 rounded-full border border-terminal-green/40 flex items-center justify-center shrink-0 mt-0.5">
        <span className="font-mono text-xs font-bold text-terminal-green">{number}</span>
      </div>
      <div>
        <div className="font-mono text-xs font-semibold text-terminal-text">{title}</div>
        <div className="font-mono text-xs text-terminal-dim leading-relaxed mt-0.5">{description}</div>
      </div>
    </div>
  )
}

function TabBtn({ active, onClick, icon, label, badge }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-mono text-xs font-bold tracking-wider transition-all duration-150 relative ${
        active
          ? 'bg-terminal-surface border border-terminal-border text-terminal-text'
          : 'text-terminal-dim hover:text-terminal-text'
      }`}
    >
      {icon}
      <span>{label}</span>
      {badge != null && (
        <span className="ml-1 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-terminal-accent/20 text-terminal-accent text-xs font-bold leading-none">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  )
}
