import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import {
  ArrowUpDown,
  Shield,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Clock,
  Info,
  RefreshCw,
  X,
} from 'lucide-react'
import TokenSelector from './TokenSelector'
import QuoteDisplay from './QuoteDisplay'
import PostTradeCard from './PostTradeCard'
import MevRiskBadge from './MevRiskBadge'
import { useSwap } from '../hooks/useSwap'
import { useMevRisk } from '../hooks/useMevRisk'
import { useWalletBalance } from '../hooks/useWalletBalance'
import { TOKENS } from '../config'

export default function SwapInterface({ onSaveTrade }) {
  const wallet = useWallet()
  const { publicKey, connected } = wallet

  const [inputToken, setInputToken] = useState(TOKENS.SOL)
  const [outputToken, setOutputToken] = useState(TOKENS.USDC)
  const [inputAmount, setInputAmount] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [savedQuote, setSavedQuote] = useState(null)
  // Post-swap cooldown: prevents stale-account errors (DFlow Custom:15001)
  const [postSwapCooldown, setPostSwapCooldown] = useState(false)
  const cooldownTimerRef = useRef(null)
  const lastFetchParamsRef = useRef(null)

  const {
    quote,
    quoteLoading,
    quoteError,
    fetchQuote,
    clearQuote,
    executeSwap,
    swapStatus,
    swapResult,
    swapError,
    swapWarning,
    clearWarning,
    resetSwap,
  } = useSwap()

  // Balance hook — used for post-swap refresh
  const { refresh: refreshBalance } = useWalletBalance()

  const { risk: mevRisk, loading: mevRiskLoading } = useMevRisk({
    quote,
    inputToken,
    outputToken,
  })

  // Fetch quote when inputs change, store params for retry
  useEffect(() => {
    if (inputToken && outputToken && inputToken.mint !== outputToken.mint && inputAmount) {
      const params = {
        inputMint: inputToken.mint,
        outputMint: outputToken.mint,
        amount: inputAmount,
        decimals: inputToken.decimals,
        walletPublicKey: publicKey?.toBase58() || null,
      }
      lastFetchParamsRef.current = params
      fetchQuote(params)
    } else {
      clearQuote()
      lastFetchParamsRef.current = null
    }
  }, [inputToken, outputToken, inputAmount, publicKey])

  // Clear swap state when wallet disconnects
  useEffect(() => {
    if (!connected) {
      clearQuote()
      resetSwap()
      setInputAmount('')
      setSavedQuote(null)
      setShowConfirm(false)
      setPostSwapCooldown(false)
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current)
    }
  }, [connected])

  // On success: show modal, refresh balance, enforce 3-second cooldown + fresh quote
  useEffect(() => {
    if (swapStatus === 'success' && swapResult) {
      setShowConfirm(true)
      setPostSwapCooldown(true)

      // Refresh balance immediately so on-chain state is current
      refreshBalance()

      // After 3s re-enable the button and fetch a fresh quote
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current)
      cooldownTimerRef.current = setTimeout(() => {
        setPostSwapCooldown(false)
        // Re-fetch a fresh quote so the next swap uses a non-stale transaction
        if (lastFetchParamsRef.current) {
          fetchQuote(lastFetchParamsRef.current)
        }
      }, 3000)
    }
    return () => {} // cleanup handled per-timer above
  }, [swapStatus, swapResult])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current) }
  }, [])

  const handleFlip = useCallback(() => {
    setInputToken(outputToken)
    setOutputToken(inputToken)
    setInputAmount('')
    clearQuote()
  }, [inputToken, outputToken, clearQuote])

  const handleInputTokenChange = (token) => {
    if (token.mint === outputToken?.mint) {
      setOutputToken(inputToken)
    }
    setInputToken(token)
    clearQuote()
    setInputAmount('')
  }

  const handleOutputTokenChange = (token) => {
    if (token.mint === inputToken?.mint) {
      setInputToken(outputToken)
    }
    setOutputToken(token)
    clearQuote()
  }

  const handleSwap = async () => {
    if (!quote || !connected || postSwapCooldown) return
    setSavedQuote(quote)
    await executeSwap({ quote, wallet, inputToken, outputToken })
  }

  const handleRetryQuote = useCallback(() => {
    if (lastFetchParamsRef.current) fetchQuote(lastFetchParamsRef.current)
  }, [fetchQuote])

  const handleNewSwap = () => {
    setShowConfirm(false)
    setInputAmount('')
    clearQuote()
    resetSwap()
    setSavedQuote(null)
  }

  const isSwapping = swapStatus === 'signing' || swapStatus === 'confirming'
  const canSwap = connected && quote && !isSwapping && !quoteLoading && inputAmount && !postSwapCooldown

  const getButtonContent = () => {
    if (!connected) {
      return { text: 'Connect Wallet', disabled: true, variant: 'secondary' }
    }
    if (!inputAmount) {
      return { text: 'Enter Amount', disabled: true, variant: 'secondary' }
    }
    if (!inputToken || !outputToken) {
      return { text: 'Select Tokens', disabled: true, variant: 'secondary' }
    }
    if (postSwapCooldown) {
      return { text: 'Refreshing balance…', disabled: true, variant: 'loading' }
    }
    if (quoteLoading) {
      return { text: 'Fetching Quote…', disabled: true, variant: 'loading' }
    }
    if (quoteError) {
      return { text: 'No Route Available', disabled: true, variant: 'error' }
    }
    if (swapStatus === 'signing') {
      return { text: 'Waiting for Signature…', disabled: true, variant: 'loading' }
    }
    if (swapStatus === 'confirming') {
      return { text: 'Confirming on Solana…', disabled: true, variant: 'loading' }
    }
    if (!quote) {
      return { text: 'Review Quote', disabled: true, variant: 'secondary' }
    }
    return { text: 'Swap', disabled: false, variant: 'primary' }
  }

  const btn = getButtonContent()

  return (
    <>
      <div className="w-full max-w-md mx-auto">
        <div className="bg-terminal-card border border-terminal-border rounded-2xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="px-5 py-4 border-b border-terminal-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-terminal-green animate-pulse" />
                <span className="font-mono font-bold text-terminal-text text-base tracking-wider">
                  SWAP
                </span>
                <span className="font-mono text-xs text-terminal-dim tracking-widest">/ MAINNET</span>
              </div>
              <WalletMultiButton />
            </div>
          </div>

          <div className="p-5 space-y-3">
            {/* Input token */}
            <div className="rounded-xl bg-terminal-surface border border-terminal-border focus-within:border-terminal-accent/40 transition-colors">
              <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <span className="text-terminal-dim text-xs font-mono">You pay</span>
                {connected && (
                  <span className="text-terminal-dim text-xs font-mono">
                    Wallet connected
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 px-4 pb-3">
                <input
                  type="number"
                  placeholder="0.00"
                  value={inputAmount}
                  onChange={(e) => setInputAmount(e.target.value)}
                  className="flex-1 bg-transparent outline-none font-mono text-2xl font-bold text-terminal-text placeholder-terminal-muted/40 min-w-0"
                  min="0"
                />
                <TokenSelector
                  selected={inputToken}
                  onChange={handleInputTokenChange}
                  exclude={outputToken}
                />
              </div>
            </div>

            {/* Flip button */}
            <div className="flex justify-center -my-1">
              <button
                onClick={handleFlip}
                className="w-9 h-9 rounded-full bg-terminal-surface border border-terminal-border flex items-center justify-center hover:border-terminal-accent/50 hover:bg-terminal-card text-terminal-dim hover:text-terminal-accent transition-all duration-200 active:scale-90"
              >
                <ArrowUpDown size={14} />
              </button>
            </div>

            {/* Output token */}
            <div className="rounded-xl bg-terminal-surface border border-terminal-border">
              <div className="px-4 pt-3 pb-1">
                <span className="text-terminal-dim text-xs font-mono">You receive</span>
              </div>
              <div className="flex items-center gap-3 px-4 pb-3">
                <div className="flex-1 font-mono text-2xl font-bold text-terminal-green min-w-0">
                  {quoteLoading ? (
                    <div className="h-8 w-32 rounded-lg bg-terminal-border animate-pulse" />
                  ) : quote ? (
                    <span>
                      {formatOutputAmount(
                        quote.outAmount || quote.outputAmount,
                        outputToken?.decimals || 6
                      )}
                    </span>
                  ) : (
                    <span className="text-terminal-muted/40">0.00</span>
                  )}
                </div>
                <TokenSelector
                  selected={outputToken}
                  onChange={handleOutputTokenChange}
                  exclude={inputToken}
                />
              </div>
            </div>

            {/* Quote details */}
            {(quote || quoteLoading || quoteError) && (
              <div className="rounded-xl bg-terminal-surface/50 border border-terminal-border p-3">
                <QuoteDisplay
                  quote={quote}
                  inputToken={inputToken}
                  outputToken={outputToken}
                  loading={quoteLoading}
                  error={quoteError}
                  onRetry={handleRetryQuote}
                />
              </div>
            )}

            {/* MEV risk indicator */}
            {(mevRisk || mevRiskLoading) && (
              <MevRiskBadge risk={mevRisk} loading={mevRiskLoading} />
            )}

            {/* Swap error */}
            {swapError && swapStatus === 'error' && (
              <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-terminal-red/10 border border-terminal-red/30 animate-fade-in">
                <AlertCircle size={14} className="text-terminal-red mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-terminal-red text-xs font-mono leading-relaxed">{swapError}</p>
                  {swapError !== 'Transaction cancelled in wallet.' && (
                    <button
                      onClick={() => { resetSwap(); handleRetryQuote() }}
                      className="mt-1.5 flex items-center gap-1 text-terminal-red/70 hover:text-terminal-red text-xs font-mono transition-colors"
                    >
                      <RefreshCw size={10} />
                      <span>Refresh & retry</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Security check warning — non-blocking, swap can still proceed */}
            {swapWarning && (
              <div className="flex items-start gap-2.5 px-3 py-3 rounded-lg bg-terminal-yellow/10 border border-terminal-yellow/30 animate-fade-in">
                <Shield size={13} className="text-terminal-yellow mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-terminal-yellow text-xs font-mono leading-relaxed">
                    {swapWarning}
                  </p>
                  <div className="mt-1.5 flex items-center gap-3">
                    <button
                      onClick={handleSwap}
                      className="flex items-center gap-1 text-terminal-yellow/80 hover:text-terminal-yellow text-xs font-mono transition-colors"
                    >
                      <RefreshCw size={10} />
                      <span>Try again</span>
                    </button>
                    <button
                      onClick={clearWarning}
                      className="flex items-center gap-1 text-terminal-dim hover:text-terminal-text text-xs font-mono transition-colors"
                    >
                      <X size={10} />
                      <span>Dismiss</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Solflare false-positive notice — shown while wallet popup is open */}
            {swapStatus === 'signing' && (
              <div className="flex items-start gap-2.5 px-3 py-3 rounded-lg border animate-fade-in"
                style={{ background: 'rgba(251,191,36,0.07)', borderColor: 'rgba(251,191,36,0.35)' }}>
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  className="w-4 h-4 mt-0.5 shrink-0"
                  style={{ color: '#fbbf24' }}
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 6a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                    fill="currentColor"
                  />
                </svg>
                <p className="font-mono text-xs leading-relaxed" style={{ color: '#fde68a' }}>
                  You may see a Solflare security warning — this is a known false positive for
                  DFlow-routed transactions. Click{' '}
                  <span className="font-bold text-amber-300">Confirm</span> to proceed safely.
                </p>
              </div>
            )}

            {/* Status bar */}
            {isSwapping && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-terminal-accent/10 border border-terminal-accent/30 animate-fade-in">
                {swapStatus === 'signing' ? (
                  <Clock size={14} className="text-terminal-accent shrink-0 animate-pulse" />
                ) : (
                  <Loader2 size={14} className="text-terminal-accent shrink-0 animate-spin" />
                )}
                <p className="text-terminal-accent text-xs font-mono">
                  {swapStatus === 'signing'
                    ? 'Approve the transaction in your wallet…'
                    : 'Broadcasting to Solana validators…'}
                </p>
              </div>
            )}

            {/* Swap button */}
            <SwapButton
              label={btn.text}
              variant={btn.variant}
              disabled={btn.disabled || !canSwap}
              onClick={handleSwap}
              isLoading={isSwapping || quoteLoading}
            />

            {/* Info footer */}
            <div className="flex items-center gap-1.5 justify-center pt-1">
              <Info size={10} className="text-terminal-dim/60" />
              <span className="text-terminal-dim/60 text-xs font-mono">
                Orders routed through DFlow's MEV-resistant network
              </span>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <StatsStrip />
      </div>

      {/* Post-trade analytics modal */}
      {showConfirm && swapResult && (
        <PostTradeCard
          result={swapResult}
          inputToken={inputToken}
          outputToken={outputToken}
          quotedOutput={savedQuote?.outAmount || savedQuote?.outputAmount}
          onClose={() => setShowConfirm(false)}
          onNewSwap={handleNewSwap}
          onSaveTrade={onSaveTrade}
        />
      )}
    </>
  )
}

function SwapButton({ label, variant, disabled, onClick, isLoading }) {
  const base =
    'w-full py-4 rounded-xl font-mono font-bold text-sm tracking-wider transition-all duration-200 flex items-center justify-center gap-2.5 relative overflow-hidden'

  const variants = {
    primary:
      'bg-terminal-accent text-black hover:bg-terminal-accentDim active:scale-[0.98] glow-cyan disabled:opacity-60 disabled:cursor-not-allowed',
    secondary:
      'bg-terminal-surface border border-terminal-border text-terminal-dim cursor-not-allowed',
    loading:
      'bg-terminal-surface border border-terminal-accent/30 text-terminal-accent cursor-not-allowed',
    error:
      'bg-terminal-red/10 border border-terminal-red/30 text-terminal-red cursor-not-allowed',
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant] || variants.secondary}`}
    >
      {isLoading && <Loader2 size={15} className="animate-spin shrink-0" />}
      {!isLoading && variant === 'primary' && (
        <Shield size={15} className="shrink-0" />
      )}
      <span>{label}</span>
      {variant === 'primary' && !isLoading && (
        <span className="absolute right-4 text-xs font-mono text-black/60 tracking-widest">
          DFLOW
        </span>
      )}
    </button>
  )
}

function StatsStrip() {
  const stats = [
    { label: 'MEV Protection', value: 'Active', color: 'text-terminal-green' },
    { label: 'Routing', value: 'JIT', color: 'text-terminal-accent' },
    { label: 'Network', value: 'Mainnet', color: 'text-terminal-dim' },
  ]

  return (
    <div className="mt-3 grid grid-cols-3 gap-2">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-terminal-card border border-terminal-border rounded-xl p-3 text-center"
        >
          <div className={`font-mono text-xs font-semibold ${s.color}`}>{s.value}</div>
          <div className="font-mono text-xs text-terminal-dim/60 mt-0.5">{s.label}</div>
        </div>
      ))}
    </div>
  )
}

function formatOutputAmount(raw, decimals) {
  if (!raw) return '—'
  const val = Number(raw) / Math.pow(10, decimals)
  if (val < 0.000001) return val.toExponential(4)
  if (val < 1) return val.toFixed(6)
  if (val >= 1000000) return (val / 1000000).toFixed(2) + 'M'
  if (val >= 1000) return val.toLocaleString('en-US', { maximumFractionDigits: 2 })
  return val.toFixed(4)
}
