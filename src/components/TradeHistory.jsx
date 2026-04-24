import React, { useEffect, useMemo } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  Shield,
  Zap,
  BarChart2,
  RefreshCw,
  Clock,
  Inbox,
} from 'lucide-react'

// ─── helpers ────────────────────────────────────────────────────────────────

function fmtUSD(n) {
  if (n == null || isNaN(n)) return '—'
  if (n < 0.01) return '<$0.01'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(n)
}

function fmtAmount(raw, decimals) {
  if (!raw) return '—'
  const v = Number(raw) / Math.pow(10, decimals)
  if (v < 0.000001) return v.toExponential(4)
  if (v < 1) return v.toFixed(4)
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(2) + 'M'
  if (v >= 1_000) return v.toLocaleString('en-US', { maximumFractionDigits: 2 })
  return v.toFixed(4)
}

function fmtTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now - d
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const GRADE_COLORS = {
  'A+': { text: 'text-terminal-green', border: 'border-terminal-green/40', bg: 'bg-terminal-green/10' },
  'A': { text: 'text-terminal-green', border: 'border-terminal-green/40', bg: 'bg-terminal-green/10' },
  'B': { text: 'text-terminal-accent', border: 'border-terminal-accent/40', bg: 'bg-terminal-accent/10' },
  'C': { text: 'text-yellow-400', border: 'border-yellow-400/40', bg: 'bg-yellow-400/10' },
  'D': { text: 'text-orange-400', border: 'border-orange-400/40', bg: 'bg-orange-400/10' },
  'F': { text: 'text-terminal-red', border: 'border-terminal-red/40', bg: 'bg-terminal-red/10' },
}

const GRADE_ORDER = ['A+', 'A', 'B', 'C', 'D', 'F']
function gradeScore(label) {
  const i = GRADE_ORDER.indexOf(label)
  return i === -1 ? 99 : i
}

// ─── summary stats ────────────────────────────────────────────────────────────

function computeStats(trades) {
  const n = trades.length
  if (n === 0) return { count: 0, totalMev: 0, avgGrade: null, volumeLabels: [] }

  const totalMev = trades.reduce((sum, t) => sum + (Number(t.mev_saved_usd) || 0), 0)

  const graded = trades.filter((t) => t.execution_grade)
  let avgGrade = null
  if (graded.length) {
    const avg = graded.reduce((sum, t) => sum + gradeScore(t.execution_grade), 0) / graded.length
    avgGrade = GRADE_ORDER[Math.min(Math.round(avg), GRADE_ORDER.length - 1)]
  }

  // Rough volume: just count pairs
  const pairCounts = {}
  trades.forEach((t) => {
    const key = `${t.input_token_symbol}/${t.output_token_symbol}`
    pairCounts[key] = (pairCounts[key] || 0) + 1
  })
  const topPair = Object.entries(pairCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'

  return { count: n, totalMev, avgGrade, topPair }
}

// ─── components ──────────────────────────────────────────────────────────────

function GradeBadge({ label }) {
  if (!label) return <span className="text-terminal-dim/40 font-mono text-xs">—</span>
  const c = GRADE_COLORS[label] || GRADE_COLORS['C']
  return (
    <span
      className={`inline-flex items-center justify-center w-7 h-7 rounded-full border font-mono font-bold text-xs ${c.text} ${c.border} ${c.bg}`}
    >
      {label}
    </span>
  )
}

function StatCard({ icon, label, value, sub, valueClass = 'text-terminal-text' }) {
  return (
    <div className="bg-terminal-surface border border-terminal-border rounded-xl p-3 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-terminal-dim/60">
        {icon}
        <span className="font-mono text-xs tracking-widest">{label}</span>
      </div>
      <div className={`font-mono font-bold text-lg leading-tight ${valueClass}`}>{value}</div>
      {sub && <div className="font-mono text-xs text-terminal-dim/50">{sub}</div>}
    </div>
  )
}

function EmptyState({ walletAddress }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="w-12 h-12 rounded-full border border-terminal-border flex items-center justify-center">
        <Inbox size={20} className="text-terminal-dim/40" />
      </div>
      <div className="text-center">
        <div className="font-mono text-sm text-terminal-dim/60">
          {walletAddress ? 'No swaps recorded yet' : 'Connect your wallet'}
        </div>
        <div className="font-mono text-xs text-terminal-dim/40 mt-1">
          {walletAddress
            ? 'Complete a swap to see your trade history here.'
            : 'Your swap history will appear here after connecting.'}
        </div>
      </div>
    </div>
  )
}

function DbDisabledState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="w-12 h-12 rounded-full border border-terminal-yellow/30 bg-terminal-yellow/5 flex items-center justify-center">
        <Shield size={18} className="text-terminal-yellow/60" />
      </div>
      <div className="text-center px-2">
        <div className="font-mono text-sm text-terminal-dim/60">Trade history unavailable</div>
        <div className="font-mono text-xs text-terminal-dim/40 mt-1 leading-relaxed">
          Add <span className="text-terminal-accent/70">VITE_SUPABASE_URL</span> and{' '}
          <span className="text-terminal-accent/70">VITE_SUPABASE_ANON_KEY</span> as Vercel
          environment variables to enable trade persistence.
        </div>
      </div>
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

export default function TradeHistory({ walletAddress, trades, loading, error, onRefresh, dbEnabled = true }) {
  const stats = useMemo(() => computeStats(trades), [trades])

  useEffect(() => {
    if (walletAddress && dbEnabled) onRefresh?.()
  }, [walletAddress])

  const gradeC = stats.avgGrade ? (GRADE_COLORS[stats.avgGrade] || GRADE_COLORS['C']) : null

  // When database is not configured, show a helpful notice and skip stats
  if (!dbEnabled) {
    return <DbDisabledState />
  }

  return (
    <div className="space-y-4">
      {/* Summary dashboard */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard
          icon={<BarChart2 size={11} />}
          label="TOTAL TRADES"
          value={stats.count}
          sub="protected swaps"
          valueClass="text-terminal-text"
        />
        <StatCard
          icon={<Zap size={11} />}
          label="MEV SAVED"
          value={fmtUSD(stats.totalMev)}
          sub="est. from routing"
          valueClass="text-terminal-green"
        />
        <StatCard
          icon={<Shield size={11} />}
          label="AVG GRADE"
          value={stats.avgGrade || '—'}
          sub={stats.avgGrade ? 'execution quality' : 'no graded trades'}
          valueClass={gradeC?.text || 'text-terminal-dim'}
        />
        <StatCard
          icon={<TrendingUp size={11} />}
          label="TOP PAIR"
          value={stats.topPair || '—'}
          sub="most traded"
          valueClass="text-terminal-accent"
        />
      </div>

      {/* Trade list header */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-terminal-dim/60 tracking-widest">RECENT TRADES</span>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 font-mono text-xs text-terminal-dim hover:text-terminal-accent transition-colors disabled:opacity-40"
        >
          <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="text-xs font-mono text-terminal-red/70 px-1">{error}</div>
      )}

      {/* Content */}
      {loading && trades.length === 0 ? (
        <div className="flex items-center justify-center py-8 gap-2 text-terminal-dim/40">
          <RefreshCw size={14} className="animate-spin" />
          <span className="font-mono text-xs">Loading trades…</span>
        </div>
      ) : trades.length === 0 ? (
        <EmptyState walletAddress={walletAddress} />
      ) : (
        <div className="space-y-2">
          {trades.map((t) => (
            <TradeRow key={t.id} trade={t} />
          ))}
        </div>
      )}
    </div>
  )
}

function TradeRow({ trade: t }) {
  const inAmt = fmtAmount(t.input_amount_raw, t.input_decimals)
  const outAmt = fmtAmount(t.output_amount_raw, t.output_decimals)
  const slip = t.slippage_pct != null ? Number(t.slippage_pct) : null

  const SlipIcon = slip == null ? Minus : slip >= 0 ? TrendingUp : TrendingDown
  const slipColor =
    slip == null
      ? 'text-terminal-dim/40'
      : slip >= 0
      ? 'text-terminal-green'
      : slip < -0.3
      ? 'text-terminal-red'
      : 'text-yellow-400'

  return (
    <div className="bg-terminal-surface border border-terminal-border rounded-xl px-4 py-3 flex items-center gap-3 hover:border-terminal-accent/30 transition-colors">
      {/* Grade */}
      <div className="shrink-0">
        <GradeBadge label={t.execution_grade} />
      </div>

      {/* Pair + amounts */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-sm font-bold text-terminal-text">
            {t.input_token_symbol}
          </span>
          <span className="text-terminal-dim/40 text-xs">→</span>
          <span className="font-mono text-sm font-bold text-terminal-green">
            {t.output_token_symbol}
          </span>
        </div>
        <div className="font-mono text-xs text-terminal-dim/60 mt-0.5 truncate">
          {inAmt} → {outAmt}
        </div>
      </div>

      {/* Slippage delta */}
      <div className="shrink-0 text-right hidden sm:block">
        <div className={`flex items-center gap-1 justify-end font-mono text-xs ${slipColor}`}>
          <SlipIcon size={10} />
          {slip != null
            ? (slip >= 0 ? '+' : '') + slip.toFixed(3) + '%'
            : '—'}
        </div>
        <div className="font-mono text-xs text-terminal-dim/40 mt-0.5">
          {t.mev_saved_usd != null ? fmtUSD(Number(t.mev_saved_usd)) + ' saved' : '—'}
        </div>
      </div>

      {/* Time + link */}
      <div className="shrink-0 text-right">
        <div className="flex items-center gap-1 justify-end text-terminal-dim/50">
          <Clock size={9} />
          <span className="font-mono text-xs">{fmtTime(t.created_at)}</span>
        </div>
        {t.explorer_url && (
          <a
            href={t.explorer_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 font-mono text-xs text-terminal-accent/60 hover:text-terminal-accent transition-colors mt-0.5"
          >
            <ExternalLink size={9} />
            <span>tx</span>
          </a>
        )}
      </div>
    </div>
  )
}
