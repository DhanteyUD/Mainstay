import React, { useEffect, useMemo, useState } from 'react'
import { useNetwork } from '../contexts/NetworkContext'
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
  Target,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react'
import { RiTokenSwapLine } from "react-icons/ri";
import { LuCoins } from "react-icons/lu";
import { IoShieldCheckmarkOutline } from "react-icons/io5";
import { MdOutlineGrade } from "react-icons/md";
import { motion, AnimatePresence } from 'framer-motion'

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
  'A':  { text: 'text-terminal-green', border: 'border-terminal-green/40', bg: 'bg-terminal-green/10' },
  'B':  { text: 'text-terminal-accent', border: 'border-terminal-accent/40', bg: 'bg-terminal-accent/10' },
  'C':  { text: 'text-yellow-400', border: 'border-yellow-400/40', bg: 'bg-yellow-400/10' },
  'D':  { text: 'text-orange-400', border: 'border-orange-400/40', bg: 'bg-orange-400/10' },
  'F':  { text: 'text-terminal-red', border: 'border-terminal-red/40', bg: 'bg-terminal-red/10' },
}

const GRADE_ORDER = ['A+', 'A', 'B', 'C', 'D', 'F']
function gradeScore(label) {
  const i = GRADE_ORDER.indexOf(label)
  return i === -1 ? 99 : i
}

function isSpot(t) { return !t.trade_type || t.trade_type === 'spot' }
function isPredict(t) { return t.trade_type === 'prediction' }
function isTransfer(t) { return t.trade_type === 'sent' || t.trade_type === 'received' }

function sortByDate(items) {
  return [...items].sort((a, b) => {
    const da = a.created_at ? new Date(a.created_at) : new Date(0)
    const db = b.created_at ? new Date(b.created_at) : new Date(0)
    return db - da
  })
}

// ─── summary stats ─────────────────────────────────────────────────────────

function computeStats(trades) {
  const n = trades.length
  if (n === 0) return { count: 0, totalMev: 0, avgGrade: null, topPair: '—' }

  const totalMev = trades.reduce((sum, t) => sum + (Number(t.mev_saved_usd) || 0), 0)

  const graded = trades.filter((t) => t.execution_grade)
  let avgGrade = null
  if (graded.length) {
    const avg = graded.reduce((sum, t) => sum + gradeScore(t.execution_grade), 0) / graded.length
    avgGrade = GRADE_ORDER[Math.min(Math.round(avg), GRADE_ORDER.length - 1)]
  }

  const pairCounts = {}
  trades.forEach((t) => {
    if (isTransfer(t)) return
    const key = `${t.input_token_symbol}/${t.output_token_symbol}`
    pairCounts[key] = (pairCounts[key] || 0) + 1
  })
  const topPair = Object.entries(pairCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'

  return { count: n, totalMev, avgGrade, topPair }
}

// ─── sub-components ─────────────────────────────────────────────────────────

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

function StatCard({ icon, label, value, sub, valueClass = 'text-terminal-text', delay = 0 }) {
  return (
    <motion.div
      className="bg-terminal-surface border border-terminal-border rounded-xl p-3 flex flex-col gap-1"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <div className="flex items-center gap-1.5 text-terminal-dim/60">
        {icon}
        <span className="font-mono text-xs tracking-widest">{label}</span>
      </div>
      <div className={`font-mono font-bold text-lg leading-tight ${valueClass}`}>{value}</div>
      {sub && <div className="font-mono text-xs text-terminal-dim/50">{sub}</div>}
    </motion.div>
  )
}

function FilterToggle({ value, onChange }) {
  const opts = [
    { key: 'all', label: 'All' },
    { key: 'spot', label: 'Spot' },
    { key: 'prediction', label: 'Prediction' },
    { key: 'transfers', label: 'Transfers' },
  ]
  return (
    <div className="flex gap-1 bg-terminal-surface border border-terminal-border rounded-lg p-0.5">
      {opts.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={`px-2.5 py-1 rounded-md font-mono text-xs font-bold tracking-wider transition-all duration-150 border ${
            value === o.key
              ? "bg-terminal-card border border-terminal-border text-terminal-text"
              : "border-transparent text-terminal-dim hover:text-terminal-text"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function EmptyState({ walletAddress, filter }) {
  const msg =
    filter === 'prediction'
      ? 'No prediction trades yet'
      : filter === 'spot'
      ? 'No spot trades yet'
      : filter === 'transfers'
      ? 'No transfers yet'
      : walletAddress
      ? 'No history yet'
      : 'Connect your wallet'
  const sub =
    filter === 'transfers'
      ? 'Send or receive tokens to see your transfer history here.'
      : filter !== 'all'
      ? 'Try switching to "All" or complete a trade.'
      : walletAddress
      ? 'Complete a swap to see your trade history here.'
      : 'Your swap history will appear here after connecting.'

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-12 gap-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-12 h-12 rounded-full border border-terminal-border flex items-center justify-center">
        <Inbox size={20} className="text-terminal-dim/40" />
      </div>
      <div className="text-center">
        <div className="font-mono text-sm text-terminal-dim/60">{msg}</div>
        <div className="font-mono text-xs text-terminal-dim/40 mt-1">{sub}</div>
      </div>
    </motion.div>
  )
}

function DbDisabledState() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-12 gap-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
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
    </motion.div>
  )
}

// ─── main component ──────────────────────────────────────────────────────────

export default function TradeHistory({ walletAddress, trades, transfers = [], loading, error, onRefresh, dbEnabled = true }) {
  const { isDevnet } = useNetwork()
  const [typeFilter, setTypeFilter] = useState('all')

  const filteredTrades = useMemo(() => {
    const tradeSigSet = new Set(trades.map(t => t.signature).filter(Boolean))
    const uniqueTransfers = transfers.filter(t => !t.signature || !tradeSigSet.has(t.signature))

    if (typeFilter === 'spot') return trades.filter(isSpot)
    if (typeFilter === 'prediction') return trades.filter(isPredict)
    if (typeFilter === 'transfers') return sortByDate([...trades.filter(isTransfer), ...uniqueTransfers])
    return sortByDate([...trades, ...uniqueTransfers])
  }, [trades, transfers, typeFilter])

  const stats = useMemo(() => computeStats(filteredTrades), [filteredTrades])

  useEffect(() => {
    if (walletAddress) onRefresh?.()
  }, [walletAddress]) // eslint-disable-line react-hooks/exhaustive-deps

  const gradeC = stats.avgGrade ? (GRADE_COLORS[stats.avgGrade] || GRADE_COLORS['C']) : null

  return (
    <div className="space-y-4">
      {/* Summary dashboard */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard
          icon={<LuCoins size={11} />}
          label="TOTAL TRADES"
          value={stats.count}
          sub={isDevnet ? "devnet swaps" : "protected swaps"}
          valueClass="text-terminal-text"
          delay={0}
        />
        <StatCard
          icon={<IoShieldCheckmarkOutline size={11} />}
          label="MEV SAVED"
          value={isDevnet ? "N/A" : fmtUSD(stats.totalMev)}
          sub={isDevnet ? "no MEV protection" : "est. from routing"}
          valueClass={isDevnet ? "text-terminal-dim" : "text-terminal-green"}
          delay={0.05}
        />
        <StatCard
          icon={<MdOutlineGrade size={11} />}
          label="AVG GRADE"
          value={stats.avgGrade || "—"}
          sub={stats.avgGrade ? "execution quality" : "no graded trades"}
          valueClass={gradeC?.text || "text-terminal-dim"}
          delay={0.1}
        />
        <StatCard
          icon={<RiTokenSwapLine size={11} />}
          label="TOP PAIR"
          value={stats.topPair || "—"}
          sub="most traded"
          valueClass="text-terminal-accent"
          delay={0.15}
        />
      </div>

      {/* Trade list header with filter */}
      <div className="flex items-center justify-between gap-2">
        <FilterToggle value={typeFilter} onChange={setTypeFilter} />
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 font-mono text-xs text-terminal-dim hover:text-terminal-accent transition-colors disabled:opacity-40"
        >
          <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
          <span className='hidden sm:flex'>Refresh</span>
        </button>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="text-xs font-mono text-terminal-red/70 px-1"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      {loading && filteredTrades.length === 0 ? (
        <div className="flex items-center justify-center py-8 gap-2 text-terminal-dim/40">
          <RefreshCw size={14} className="animate-spin" />
          <span className="font-mono text-xs">Loading trades…</span>
        </div>
      ) : !dbEnabled && filteredTrades.length === 0 ? (
        <DbDisabledState />
      ) : filteredTrades.length === 0 ? (
        <EmptyState walletAddress={walletAddress} filter={typeFilter} />
      ) : (
        <div className="overflow-y-auto max-h-[360px] pr-1 scrollbar-thin scrollbar-thumb-terminal-border scrollbar-track-transparent">
          <motion.div className="space-y-2">
            <AnimatePresence initial={false}>
              {filteredTrades.map((t, i) =>
                isTransfer(t) ? (
                  <TransferRow key={t.id} item={t} index={i} isDevnet={isDevnet} />
                ) : (
                  <TradeRow key={t.id} trade={t} index={i} isDevnet={isDevnet} />
                )
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function TransferRow({ item: t, index, isDevnet }) {
  const isSent = t.trade_type === 'sent'
  const amount = fmtAmount(t.input_amount_raw, t.input_decimals)
  const token = t.input_token_symbol

  const truncate = (addr) => addr ? `${addr.slice(0, 4)}…${addr.slice(-4)}` : "—"
  const counterparty = isSent ? truncate(t.output_token_symbol) : truncate(t.wallet_address)

  return (
    <motion.div
      className={`bg-terminal-surface border rounded-xl px-4 py-3 flex items-center gap-3 hover:border-terminal-accent/30 transition-colors ${
        isSent ? 'border-terminal-accent/20' : 'border-terminal-green/20'
      }`}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12, transition: { duration: 0.15 } }}
      transition={{ delay: index * 0.05 }}
      layout
    >
      {/* Icon */}
      <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center border ${
        isSent
          ? 'bg-terminal-accent/10 border-terminal-accent/30 text-terminal-accent'
          : 'bg-terminal-green/10 border-terminal-green/30 text-terminal-green'
      }`}>
        {isSent ? <ArrowUpRight size={13} /> : <ArrowDownLeft size={13} />}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded ${
            isSent
              ? 'bg-terminal-accent/10 text-terminal-accent'
              : 'bg-terminal-green/10 text-terminal-green'
          }`}>
            {isSent ? 'SENT' : 'RECEIVED'}
          </span>
          <span className="font-mono text-sm font-bold text-terminal-text">{token}</span>
          {isDevnet && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-terminal-yellow/10 border border-terminal-yellow/25 font-mono text-xs font-bold text-terminal-yellow leading-none">
              DEVNET
            </span>
          )}
        </div>
        <div className="font-mono text-xs text-terminal-dim/60 mt-0.5 truncate">
          {isSent ? 'to' : 'from'} {counterparty}
        </div>
      </div>

      {/* Amount */}
      <div className="shrink-0 text-right hidden sm:block mr-2">
        <div className={`font-mono text-xs font-semibold ${isSent ? 'text-terminal-accent' : 'text-terminal-green'}`}>
          {isSent ? '-' : '+'}{amount} {token}
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
    </motion.div>
  )
}

function TradeRow({ trade: t, index, isDevnet }) {
  const inAmt = fmtAmount(t.input_amount_raw, t.input_decimals)
  const outAmt = fmtAmount(t.output_amount_raw, t.output_decimals)
  const slip = t.slippage_pct != null ? Number(t.slippage_pct) : null
  const isPrediction = t.trade_type === 'prediction'

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
    <motion.div
      className={`bg-terminal-surface border rounded-xl px-4 py-3 flex items-center gap-3 hover:border-terminal-accent/30 transition-colors ${
        isPrediction ? 'border-terminal-yellow/20' : 'border-terminal-border'
      }`}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12, transition: { duration: 0.15 } }}
      transition={{ delay: index * 0.05 }}
      layout
    >
      {/* Grade */}
      <div className="shrink-0">
        <GradeBadge label={t.execution_grade} />
      </div>

      {/* Pair + amounts */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono text-sm font-bold text-terminal-text">
            {t.input_token_symbol}
          </span>
          <span className="text-terminal-dim/40 text-xs">→</span>
          <span className="font-mono text-sm font-bold text-terminal-green">
            {t.output_token_symbol}
          </span>
          {isPrediction && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-400/10 border border-amber-400/25 font-mono text-xs font-bold text-amber-400 leading-none">
              <Target size={9} />
              Prediction
            </span>
          )}
          {isDevnet && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-terminal-yellow/10 border border-terminal-yellow/25 font-mono text-xs font-bold text-terminal-yellow leading-none">
              DEVNET
            </span>
          )}
        </div>
        <div className="font-mono text-xs text-terminal-dim/60 mt-0.5 truncate">
          {inAmt} → {outAmt}
        </div>
      </div>

      {/* Slippage delta */}
      <div className="shrink-0 text-right hidden sm:block mr-2">
        <div className={`flex items-center gap-1 justify-end font-mono text-xs ${slipColor}`}>
          <SlipIcon size={10} />
          {slip != null ? (slip >= 0 ? '+' : '') + slip.toFixed(3) + '%' : '—'}
        </div>
        {!isDevnet && (
          <div className="font-mono text-xs text-terminal-dim/40 mt-0.5">
            {t.mev_saved_usd != null ? fmtUSD(Number(t.mev_saved_usd)) + ' saved' : '—'}
          </div>
        )}
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
    </motion.div>
  )
}
