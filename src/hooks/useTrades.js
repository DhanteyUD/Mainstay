import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// Whether trade persistence is available in this deployment
const DB_ENABLED = supabase !== null

/**
 * Persist and fetch trade records for a connected wallet.
 * Uses the public `trades` table — no auth required.
 * Gracefully degrades when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are absent.
 */
export function useTrades(walletAddress) {
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const saveTrade = useCallback(async (payload) => {
    if (!walletAddress || !DB_ENABLED) return
    const row = {
      wallet_address: walletAddress,
      // 'spot' for normal swaps, 'prediction' for prediction market outcome token trades.
      // Requires a `trade_type TEXT DEFAULT 'spot'` column in the trades table.
      trade_type: payload.tradeType || 'spot',
      input_token_symbol: payload.inputToken?.symbol || '?',
      output_token_symbol: payload.outputToken?.symbol || '?',
      input_amount_raw: String(payload.result?.inputAmount || '0'),
      output_amount_raw: String(payload.result?.outputAmount || '0'),
      input_decimals: payload.inputToken?.decimals ?? 9,
      output_decimals: payload.outputToken?.decimals ?? 6,
      execution_grade: payload.grade?.label || null,
      mev_saved_usd: payload.mevSaved != null ? Number(payload.mevSaved) : null,
      slippage_pct: payload.slippagePct != null ? Number(payload.slippagePct) : null,
      signature: payload.result?.signature || null,
      explorer_url: payload.result?.explorerUrl || null,
    }
    const { error: err } = await supabase.from('trades').insert(row)
    if (err) console.warn('[useTrades] save failed:', err.message)
  }, [walletAddress])

  const fetchTrades = useCallback(async () => {
    if (!walletAddress) {
      setTrades([])
      return
    }
    if (!DB_ENABLED) {
      // Trade history unavailable — env vars not configured in this deployment
      setTrades([])
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('trades')
        .select('*')
        .eq('wallet_address', walletAddress)
        .order('created_at', { ascending: false })
        .limit(100)
      if (err) throw err
      setTrades(data || [])
    } catch (e) {
      setError(e.message)
      setTrades([])
    } finally {
      setLoading(false)
    }
  }, [walletAddress])

  return { trades, loading, error, saveTrade, fetchTrades, dbEnabled: DB_ENABLED }
}
