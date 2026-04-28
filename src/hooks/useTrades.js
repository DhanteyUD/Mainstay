import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useNetwork } from '../contexts/NetworkContext'

const DB_ENABLED = supabase !== null

function buildRow(walletAddress, payload) {
  return {
    wallet_address: walletAddress,
    trade_type: payload.tradeType || 'spot',
    input_token_symbol: payload.inputToken?.symbol || '?',
    output_token_symbol: payload.outputToken?.symbol || '?',
    input_amount_raw: String(payload.result?.inputAmount || '0'),
    output_amount_raw: String(payload.result?.outputAmount || '0'),
    input_decimals: payload.inputToken?.decimals ?? 9,
    output_decimals: payload.outputToken?.decimals ?? 6,
    execution_grade: payload.grade?.label || null,
    slippage_pct: payload.slippagePct != null ? Number(payload.slippagePct) : null,
    signature: payload.result?.signature || null,
    explorer_url: payload.result?.explorerUrl || null,
  }
}

export function useTrades(walletAddress) {
  const { isDevnet } = useNetwork()
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const saveTrade = useCallback(async (payload) => {
    if (!walletAddress || !DB_ENABLED) return
    const table = isDevnet ? 'devTrades' : 'trades'
    const row = {
      ...buildRow(walletAddress, payload),
      // MEV data is only meaningful on mainnet
      mev_saved_usd: isDevnet ? null : (payload.mevSaved != null ? Number(payload.mevSaved) : null),
    }
    const { data, error: err } = await supabase.from(table).insert(row).select().single()
    if (err) {
      console.warn(`[useTrades] save to ${table} failed:`, err.message)
      return
    }
    if (data) setTrades(prev => [data, ...prev])
  }, [walletAddress, isDevnet])

  const fetchTrades = useCallback(async () => {
    if (!walletAddress) {
      setTrades([])
      return
    }
    if (!DB_ENABLED) {
      setTrades([])
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    const table = isDevnet ? 'devTrades' : 'trades'
    try {
      const { data, error: err } = await supabase
        .from(table)
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
  }, [walletAddress, isDevnet])

  return { trades, loading, error, saveTrade, fetchTrades, dbEnabled: DB_ENABLED }
}
