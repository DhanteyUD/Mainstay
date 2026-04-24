import React, { useEffect, useRef, useState } from 'react'
import {
  CheckCircle2,
  ExternalLink,
  X,
  Shield,
  Share2,
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  Zap,
  Download,
} from 'lucide-react'
import { DIALECT_PROXY } from '../config'

// ─── helpers ────────────────────────────────────────────────────────────────

function fmt(raw, decimals) {
  if (!raw) return '—'
  const v = Number(raw) / Math.pow(10, decimals)
  if (v < 0.000001) return v.toExponential(4)
  if (v < 1) return v.toFixed(6)
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(2) + 'M'
  if (v >= 1_000) return v.toLocaleString('en-US', { maximumFractionDigits: 2 })
  return v.toFixed(4)
}

function fmtUSD(n) {
  if (n == null || isNaN(n)) return '—'
  if (n < 0.01) return '<$0.01'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n)
}

/**
 * Calculate execution grade from slippage delta (%).
 * Positive = better than quote; negative = worse.
 */
function getGrade(slippagePct) {
  if (slippagePct == null) return null
  const d = Number(slippagePct)
  if (d >= 0) return { label: 'A+', color: '#00ff88', bg: 'rgba(0,255,136,0.12)', desc: 'Better than quoted' }
  if (d >= -0.05) return { label: 'A', color: '#00ff88', bg: 'rgba(0,255,136,0.10)', desc: 'Excellent fill' }
  if (d >= -0.15) return { label: 'B', color: '#00d4ff', bg: 'rgba(0,212,255,0.10)', desc: 'Good fill' }
  if (d >= -0.3) return { label: 'C', color: '#ffd700', bg: 'rgba(255,215,0,0.10)', desc: 'Average fill' }
  if (d >= -0.5) return { label: 'D', color: '#ff8c00', bg: 'rgba(255,140,0,0.10)', desc: 'Below average' }
  return { label: 'F', color: '#ff4444', bg: 'rgba(255,68,68,0.10)', desc: 'Poor fill' }
}

/**
 * Estimate MEV saved vs an unprotected DEX route.
 * Benchmark: unprotected trades suffer ~0.5% average MEV tax on Solana.
 * DFlow's order flow auction eliminates this via competitive market makers.
 */
function estimateMevSaved(inputUSD, slippagePct) {
  if (inputUSD == null || isNaN(inputUSD) || inputUSD <= 0) return null
  const UNPROTECTED_MEV_TAX = 0.5 // 0.5 % benchmark
  const actualLoss = Math.min(0, Number(slippagePct || 0))
  const savedPct = UNPROTECTED_MEV_TAX + actualLoss // actualLoss is ≤ 0
  return Math.max(0, (savedPct / 100) * inputUSD)
}

// ─── canvas share card ────────────────────────────────────────────────────────

async function generateShareImage({ grade, mevSaved, slippagePct, inputToken, outputToken, actualOutput }) {
  const W = 800, H = 418
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')

  // Background
  ctx.fillStyle = '#0d1117'
  ctx.fillRect(0, 0, W, H)

  // Subtle grid lines
  ctx.strokeStyle = 'rgba(0,255,136,0.04)'
  ctx.lineWidth = 1
  for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
  for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }

  // Top glow
  const grd = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, 280)
  grd.addColorStop(0, 'rgba(0,255,136,0.12)')
  grd.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = grd
  ctx.fillRect(0, 0, W, H)

  // Border
  ctx.strokeStyle = 'rgba(0,255,136,0.25)'
  ctx.lineWidth = 1.5
  ctx.strokeRect(1, 1, W - 2, H - 2)

  // Shield icon area (draw a simple shield shape in text)
  ctx.fillStyle = '#00ff88'
  ctx.font = 'bold 28px monospace'
  ctx.fillText('⬡', 48, 68)

  // Brand
  ctx.fillStyle = '#00ff88'
  ctx.font = 'bold 18px monospace'
  ctx.fillText('MEV SHIELD', 84, 58)
  ctx.fillStyle = 'rgba(0,255,136,0.5)'
  ctx.font = '11px monospace'
  ctx.fillText('PROTECTED BY DFLOW', 84, 74)

  // Divider
  ctx.strokeStyle = 'rgba(0,255,136,0.15)'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(40, 90); ctx.lineTo(W - 40, 90); ctx.stroke()

  // Grade circle
  const grade_ = grade || { label: '?', color: '#888', bg: 'rgba(136,136,136,0.1)', desc: '' }
  const cx = W - 100, cy = 180
  ctx.beginPath()
  ctx.arc(cx, cy, 52, 0, Math.PI * 2)
  ctx.fillStyle = grade_.bg
  ctx.fill()
  ctx.strokeStyle = grade_.color
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.fillStyle = grade_.color
  ctx.font = `bold 40px monospace`
  ctx.textAlign = 'center'
  ctx.fillText(grade_.label, cx, cy + 14)
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.font = '10px monospace'
  ctx.fillText('GRADE', cx, cy + 34)
  ctx.textAlign = 'left'

  // Main headline
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 34px monospace'
  ctx.fillText('Swap Protected ✓', 48, 150)

  // Pair
  const pair = `${inputToken?.symbol || '?'} → ${outputToken?.symbol || '?'}`
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.font = '14px monospace'
  ctx.fillText(pair, 48, 175)

  // Stats row
  const stats = [
    { label: 'MEV SAVED', val: mevSaved != null ? fmtUSD(mevSaved) : '—' },
    { label: 'SLIPPAGE DELTA', val: slippagePct != null ? (Number(slippagePct) >= 0 ? '+' : '') + Number(slippagePct).toFixed(3) + '%' : '—' },
    { label: 'RECEIVED', val: actualOutput || '—' },
  ]

  const statX = [48, 300, 540]
  stats.forEach((s, i) => {
    const x = statX[i]
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.font = '10px monospace'
    ctx.fillText(s.label, x, 230)
    ctx.fillStyle = '#00ff88'
    ctx.font = 'bold 20px monospace'
    ctx.fillText(s.val, x, 255)
  })

  // Divider 2
  ctx.strokeStyle = 'rgba(0,255,136,0.08)'
  ctx.beginPath(); ctx.moveTo(40, 280); ctx.lineTo(W - 40, 280); ctx.stroke()

  // Caption
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.font = '12px monospace'
  ctx.fillText("Swapped with MEV protection via DFlow's order flow auction.", 48, 310)
  ctx.fillText('Front-running and sandwich attacks blocked at the routing layer.', 48, 330)

  // Footer
  ctx.fillStyle = 'rgba(0,255,136,0.3)'
  ctx.font = '11px monospace'
  ctx.textAlign = 'right'
  ctx.fillText('mevshield.xyz • @DFlowProtocol', W - 40, H - 22)
  ctx.textAlign = 'left'

  return canvas.toDataURL('image/png')
}

// ─── main component ───────────────────────────────────────────────────────────

export default function PostTradeCard({
  result,
  inputToken,
  outputToken,
  quotedOutput,
  onClose,
  onNewSwap,
  onSaveTrade,
}) {
  const [inputUSD, setInputUSD] = useState(null)
  const [sharing, setSharing] = useState(false)
  const [shareImgUrl, setShareImgUrl] = useState(null)
  const savedRef = useRef(false)

  if (!result) return null

  const actualNum = Number(result.outputAmount) / Math.pow(10, outputToken?.decimals || 6)
  const quotedNum = Number(quotedOutput) / Math.pow(10, outputToken?.decimals || 6)
  const actualFmt = fmt(result.outputAmount, outputToken?.decimals || 6)
  const quotedFmt = fmt(quotedOutput, outputToken?.decimals || 6)

  // slippage delta in %
  let slippagePct = null
  if (quotedNum > 0) {
    slippagePct = ((actualNum - quotedNum) / quotedNum * 100)
  }

  const grade = getGrade(slippagePct)
  const mevSaved = estimateMevSaved(inputUSD, slippagePct)

  // Quoted price per output unit
  const inputAmt = Number(result.inputAmount) / Math.pow(10, inputToken?.decimals || 9)
  const quotedPrice = quotedNum > 0 ? inputAmt / quotedNum : null
  const actualPrice = actualNum > 0 ? inputAmt / actualNum : null

  const shortSig = result.signature
    ? result.signature.slice(0, 8) + '…' + result.signature.slice(-6)
    : '—'

  // Fetch USD price for MEV estimation, then persist the trade record once
  useEffect(() => {
    if (!inputToken?.mint) return
    let cancelled = false
    ;(async () => {
      let resolvedInputUSD = null
      try {
        const res = await fetch(
          `${DIALECT_PROXY}/api.jup.ag/price/v3?ids=${inputToken.mint}`
        )
        if (!res.ok) throw new Error('price fetch failed')
        const data = await res.json()
        const usdPrice = data?.[inputToken.mint]?.usdPrice
        if (!cancelled && usdPrice) {
          resolvedInputUSD = inputAmt * usdPrice
          setInputUSD(resolvedInputUSD)
        }
      } catch { /* silent */ }

      // Save trade exactly once, after price is known (or failed)
      if (!cancelled && !savedRef.current && onSaveTrade) {
        savedRef.current = true
        const resolvedMev = estimateMevSaved(resolvedInputUSD, slippagePct)
        onSaveTrade({
          result,
          inputToken,
          outputToken,
          grade: getGrade(slippagePct),
          mevSaved: resolvedMev,
          slippagePct,
        })
      }
    })()
    return () => { cancelled = true }
  }, [inputToken?.mint])

  const handleShare = async () => {
    setSharing(true)
    try {
      const imgDataUrl = await generateShareImage({
        grade,
        mevSaved,
        slippagePct,
        inputToken,
        outputToken,
        actualOutput: `${actualFmt} ${outputToken?.symbol || ''}`,
      })
      setShareImgUrl(imgDataUrl)

      // Build tweet text
      const gradeLabel = grade?.label || '?'
      const savedStr = mevSaved != null ? fmtUSD(mevSaved) : 'N/A'
      const slipStr = slippagePct != null
        ? (Number(slippagePct) >= 0 ? '+' : '') + Number(slippagePct).toFixed(3) + '%'
        : 'N/A'
      const tweetText = encodeURIComponent(
        `🛡️ Just swapped ${inputToken?.symbol} → ${outputToken?.symbol} with MEV Shield!\n\n` +
        `✅ Execution Grade: ${gradeLabel}\n` +
        `💰 Est. MEV Saved: ${savedStr}\n` +
        `📊 Slippage Delta: ${slipStr}\n\n` +
        `Protected by @DFlowProtocol's order flow auction.\n#MEVShield #Solana #DeFi`
      )
      window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank', 'noopener')
    } finally {
      setSharing(false)
    }
  }

  const handleDownload = () => {
    if (!shareImgUrl) return
    const a = document.createElement('a')
    a.href = shareImgUrl
    a.download = 'mev-shield-trade.png'
    a.click()
  }

  const SlippageIcon = slippagePct == null
    ? Minus
    : Number(slippagePct) >= 0 ? TrendingUp : TrendingDown

  const slippageColor = slippagePct == null
    ? 'text-terminal-dim'
    : Number(slippagePct) >= 0 ? 'text-terminal-green' : Number(slippagePct) < -0.3 ? 'text-terminal-red' : 'text-yellow-400'

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-terminal-card border border-terminal-border rounded-2xl w-full max-w-md shadow-2xl animate-slide-up overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-terminal-border">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-terminal-green" />
            <span className="font-mono font-bold text-terminal-green text-sm tracking-widest">
              TRADE EXECUTED
            </span>
          </div>
          <button onClick={onClose} className="text-terminal-dim hover:text-terminal-text transition-colors p-1">
            <X size={15} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="p-5 space-y-3 max-h-[80vh] overflow-y-auto">

          {/* Execution grade badge */}
          {grade && (
            <div
              className="flex items-center justify-between px-4 py-3 rounded-xl border"
              style={{ background: grade.bg, borderColor: grade.color + '40' }}
            >
              <div className="flex items-center gap-2.5">
                <Award size={16} style={{ color: grade.color }} />
                <div>
                  <div className="font-mono text-xs text-white/50 tracking-widest">EXECUTION GRADE</div>
                  <div className="font-mono font-bold text-sm" style={{ color: grade.color }}>
                    {grade.desc}
                  </div>
                </div>
              </div>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center border-2 font-mono font-black text-xl"
                style={{ borderColor: grade.color, color: grade.color, background: grade.bg }}
              >
                {grade.label}
              </div>
            </div>
          )}

          {/* Price comparison grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-terminal-surface border border-terminal-border rounded-xl p-3">
              <div className="font-mono text-xs text-terminal-dim/70 tracking-widest mb-1">QUOTED PRICE</div>
              <div className="font-mono text-sm font-bold text-terminal-text">
                {quotedPrice != null ? quotedPrice.toFixed(6) : '—'}
              </div>
              <div className="font-mono text-xs text-terminal-dim/50 mt-0.5">
                {inputToken?.symbol} per {outputToken?.symbol}
              </div>
            </div>
            <div className="bg-terminal-surface border border-terminal-border rounded-xl p-3">
              <div className="font-mono text-xs text-terminal-dim/70 tracking-widest mb-1">ACTUAL PRICE</div>
              <div className="font-mono text-sm font-bold text-terminal-green">
                {actualPrice != null ? actualPrice.toFixed(6) : '—'}
              </div>
              <div className="font-mono text-xs text-terminal-dim/50 mt-0.5">
                {inputToken?.symbol} per {outputToken?.symbol}
              </div>
            </div>
          </div>

          {/* Slippage delta */}
          <div className="flex items-center justify-between bg-terminal-surface border border-terminal-border rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <SlippageIcon size={14} className={slippageColor} />
              <span className="font-mono text-xs text-terminal-dim">Slippage Delta</span>
            </div>
            <div className="text-right">
              <div className={`font-mono text-sm font-bold ${slippageColor}`}>
                {slippagePct != null
                  ? (Number(slippagePct) >= 0 ? '+' : '') + Number(slippagePct).toFixed(3) + '%'
                  : '—'}
              </div>
              <div className="font-mono text-xs text-terminal-dim/50">
                Quoted {quotedFmt} → Got {actualFmt} {outputToken?.symbol}
              </div>
            </div>
          </div>

          {/* MEV saved */}
          <div className="flex items-center justify-between bg-terminal-surface border border-terminal-green/20 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-terminal-green" />
              <div>
                <div className="font-mono text-xs text-terminal-dim">Est. MEV Saved</div>
                <div className="font-mono text-xs text-terminal-dim/50">vs unprotected DEX route</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm font-bold text-terminal-green">
                {mevSaved != null ? fmtUSD(mevSaved) : 'Calculating…'}
              </div>
              <div className="font-mono text-xs text-terminal-dim/50">~0.5% MEV tax avoided</div>
            </div>
          </div>

          {/* Tx link */}
          <div className="flex items-center justify-between px-1">
            <span className="font-mono text-xs text-terminal-dim/60">Transaction</span>
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

          {/* Share image preview */}
          {shareImgUrl && (
            <div className="relative rounded-xl overflow-hidden border border-terminal-border">
              <img src={shareImgUrl} alt="Trade card" className="w-full" />
              <button
                onClick={handleDownload}
                className="absolute bottom-2 right-2 flex items-center gap-1 px-3 py-1.5 bg-black/70 border border-terminal-border rounded-lg font-mono text-xs text-terminal-text hover:text-terminal-accent transition-colors"
              >
                <Download size={11} />
                Save
              </button>
            </div>
          )}

          {/* Share button */}
          <button
            onClick={handleShare}
            disabled={sharing}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-mono font-bold text-sm border border-terminal-accent/40 text-terminal-accent bg-terminal-accent/5 hover:bg-terminal-accent/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sharing ? (
              <span className="animate-pulse">Generating card…</span>
            ) : (
              <>
                <Share2 size={14} />
                Share your savings
                <span className="text-xs font-normal text-terminal-dim">/ 𝕏</span>
              </>
            )}
          </button>

          {/* New swap */}
          <button
            onClick={onNewSwap}
            className="w-full py-3 rounded-xl font-mono font-bold text-sm bg-terminal-surface border border-terminal-border text-terminal-text hover:border-terminal-accent/40 hover:text-terminal-accent transition-all duration-200"
          >
            New Swap
          </button>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-center gap-1.5 py-3 border-t border-terminal-border bg-terminal-surface/40">
          <Shield size={11} className="text-terminal-accent" />
          <span className="font-mono text-xs text-terminal-accent/70 tracking-wider">
            Protected by DFlow
          </span>
        </div>
      </div>
    </div>
  )
}
