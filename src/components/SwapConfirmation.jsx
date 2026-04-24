import React from 'react'
import { CheckCircle2, ExternalLink, ArrowRight, X, Shield } from 'lucide-react'

function formatAmount(raw, decimals) {
  if (!raw) return '—'
  const val = Number(raw) / Math.pow(10, decimals)
  if (val < 0.000001) return val.toExponential(4)
  if (val < 1) return val.toFixed(6)
  if (val >= 1000000) return (val / 1000000).toFixed(2) + 'M'
  if (val >= 1000) return val.toLocaleString('en-US', { maximumFractionDigits: 2 })
  return val.toFixed(4)
}

export default function SwapConfirmation({ result, inputToken, outputToken, quotedOutput, onClose, onNewSwap }) {
  if (!result) return null

  const actualOutput = formatAmount(result.outputAmount, outputToken?.decimals || 6)
  const quotedOutputFmt = formatAmount(quotedOutput, outputToken?.decimals || 6)

  const actualNum = Number(result.outputAmount) / Math.pow(10, outputToken?.decimals || 6)
  const quotedNum = Number(quotedOutput) / Math.pow(10, outputToken?.decimals || 6)

  let priceDiff = null
  let diffClass = 'text-terminal-green'
  if (quotedNum > 0) {
    priceDiff = ((actualNum - quotedNum) / quotedNum * 100).toFixed(3)
    if (Number(priceDiff) < -0.1) diffClass = 'text-terminal-red'
    else if (Number(priceDiff) < 0) diffClass = 'text-terminal-yellow'
    else diffClass = 'text-terminal-green'
  }

  const shortSig = result.signature
    ? result.signature.slice(0, 8) + '…' + result.signature.slice(-6)
    : '—'

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-terminal-card border border-terminal-border rounded-2xl w-full max-w-sm shadow-2xl glow-green animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-terminal-border">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-terminal-green" />
            <span className="font-mono font-bold text-terminal-green text-sm tracking-wide">
              SWAP EXECUTED
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-terminal-dim hover:text-terminal-text transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Trade summary */}
          <div className="flex items-center justify-center gap-3 py-4 bg-terminal-surface rounded-xl border border-terminal-border">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                {inputToken?.logo && (
                  <img
                    src={inputToken.logo}
                    alt={inputToken.symbol}
                    className="w-5 h-5 rounded-full"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                )}
                <span className="font-mono font-bold text-terminal-text text-sm">
                  {inputToken?.symbol}
                </span>
              </div>
              <div className="font-mono text-xs text-terminal-dim">Sold</div>
            </div>

            <ArrowRight size={16} className="text-terminal-accent" />

            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                {outputToken?.logo && (
                  <img
                    src={outputToken.logo}
                    alt={outputToken.symbol}
                    className="w-5 h-5 rounded-full"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                )}
                <span className="font-mono font-bold text-terminal-green text-sm">
                  {outputToken?.symbol}
                </span>
              </div>
              <div className="font-mono text-lg font-bold text-terminal-green">
                {actualOutput}
              </div>
              <div className="font-mono text-xs text-terminal-dim">Received</div>
            </div>
          </div>

          {/* Price comparison */}
          {priceDiff !== null && (
            <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-terminal-surface border border-terminal-border">
              <span className="text-terminal-dim text-xs font-mono">Actual vs Quoted</span>
              <div className="text-right">
                <div className="font-mono text-xs text-terminal-dim">
                  Quoted: <span className="text-terminal-text">{quotedOutputFmt} {outputToken?.symbol}</span>
                </div>
                <div className={`font-mono text-xs font-semibold ${diffClass}`}>
                  {Number(priceDiff) >= 0 ? '+' : ''}{priceDiff}% vs quote
                </div>
              </div>
            </div>
          )}

          {/* Tx details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-terminal-dim text-xs font-mono">Transaction</span>
              <a
                href={result.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 font-mono text-xs text-terminal-accent hover:underline"
              >
                {shortSig}
                <ExternalLink size={10} />
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-terminal-dim text-xs font-mono">Status</span>
              <span className="font-mono text-xs text-terminal-green font-semibold">Confirmed</span>
            </div>
          </div>

          {/* DFlow badge */}
          <div className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-terminal-accent/5 border border-terminal-accent/20">
            <Shield size={12} className="text-terminal-accent" />
            <span className="font-mono text-xs text-terminal-accent tracking-wider">
              Protected by DFlow
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <button
            onClick={onNewSwap}
            className="w-full py-3 rounded-xl font-mono font-bold text-sm bg-terminal-surface border border-terminal-border text-terminal-text hover:border-terminal-accent/50 hover:text-terminal-accent transition-all duration-200"
          >
            New Swap
          </button>
        </div>
      </div>
    </div>
  )
}
