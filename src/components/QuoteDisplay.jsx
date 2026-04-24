import React from 'react'
import { TrendingDown, Zap, Route, AlertTriangle, RefreshCw } from 'lucide-react'

function formatAmount(raw, decimals, maxDecimals = 6) {
  if (!raw) return '—'
  const val = Number(raw) / Math.pow(10, decimals)
  if (val === 0) return '0'
  if (val < 0.000001) return val.toExponential(4)
  if (val < 1) return val.toFixed(Math.min(maxDecimals, 6))
  if (val >= 1000000) return (val / 1000000).toFixed(2) + 'M'
  if (val >= 1000) return val.toLocaleString('en-US', { maximumFractionDigits: 2 })
  return val.toFixed(Math.min(maxDecimals, 4))
}

function formatPrice(inputAmount, inputDecimals, outputAmount, outputDecimals, inputSymbol, outputSymbol) {
  if (!inputAmount || !outputAmount) return '—'
  const inputVal = Number(inputAmount) / Math.pow(10, inputDecimals)
  const outputVal = Number(outputAmount) / Math.pow(10, outputDecimals)
  if (!inputVal || !outputVal) return '—'
  const rate = outputVal / inputVal
  return `1 ${inputSymbol} = ${formatAmount(rate * Math.pow(10, outputDecimals), outputDecimals, 4)} ${outputSymbol}`
}

export default function QuoteDisplay({ quote, inputToken, outputToken, loading, error, onRetry }) {
  if (error) {
    return (
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-terminal-red/10 border border-terminal-red/30 animate-fade-in">
        <AlertTriangle size={13} className="text-terminal-red mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-terminal-red text-xs font-mono leading-relaxed">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-1.5 flex items-center gap-1 text-terminal-red/60 hover:text-terminal-red text-xs font-mono transition-colors"
            >
              <RefreshCw size={10} />
              <span>Retry quote</span>
            </button>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-2 animate-fade-in">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between items-center">
            <div className="h-3 bg-terminal-border rounded w-28 animate-pulse" />
            <div className="h-3 bg-terminal-border rounded w-20 animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  if (!quote) return null

  const outFormatted = formatAmount(quote.outAmount || quote.outputAmount, outputToken?.decimals || 6)
  const slippageBps = quote.slippageBps
  const slippagePercent = slippageBps !== undefined && slippageBps !== null
    ? (Number(slippageBps) / 100).toFixed(2)
    : '—'

  const priceImpact = quote.priceImpactPct !== undefined
    ? (Number(quote.priceImpactPct) * 100).toFixed(3)
    : null

  const priceStr = formatPrice(
    quote.inAmount,
    inputToken?.decimals || 9,
    quote.outAmount || quote.outputAmount,
    outputToken?.decimals || 6,
    inputToken?.symbol,
    outputToken?.symbol
  )

  return (
    <div className="space-y-2.5 animate-slide-up">
      {/* Output amount highlight */}
      <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-terminal-green/8 border border-terminal-green/20">
        <div className="flex items-center gap-2">
          {outputToken && (
            <img
              src={outputToken.logo}
              alt={outputToken.symbol}
              className="w-5 h-5 rounded-full"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          )}
          <span className="text-terminal-dim text-xs font-mono">You receive</span>
        </div>
        <span className="text-terminal-green font-mono font-bold text-base">
          {outFormatted} {outputToken?.symbol}
        </span>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 gap-1.5">
        <QuoteRow
          icon={<TrendingDown size={11} className="text-terminal-dim" />}
          label="Exchange rate"
          value={priceStr}
          valueClass="text-terminal-text"
        />
        <QuoteRow
          icon={<Route size={11} className="text-terminal-dim" />}
          label="Slippage tolerance"
          value={slippageBps !== undefined ? `${slippagePercent}%` : 'Auto'}
          valueClass={Number(slippageBps) > 100 ? 'text-terminal-yellow' : 'text-terminal-text'}
        />
        {priceImpact !== null && (
          <QuoteRow
            icon={<Zap size={11} className="text-terminal-dim" />}
            label="Price impact"
            value={`${priceImpact}%`}
            valueClass={
              Number(priceImpact) > 1
                ? Number(priceImpact) > 3
                  ? 'text-terminal-red'
                  : 'text-terminal-yellow'
                : 'text-terminal-green'
            }
          />
        )}
        <QuoteRow
          label="Route"
          value="DFlow JIT Routing"
          valueClass="text-terminal-accent text-xs"
        />
      </div>
    </div>
  )
}

function QuoteRow({ icon, label, value, valueClass = 'text-terminal-text' }) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 rounded-md hover:bg-terminal-surface/50 transition-colors">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-terminal-dim text-xs font-mono">{label}</span>
      </div>
      <span className={`text-xs font-mono font-medium ${valueClass}`}>{value}</span>
    </div>
  )
}
