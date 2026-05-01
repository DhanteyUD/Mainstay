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

  const saveReceived = useCallback(async (item) => {
    if (!walletAddress || !DB_ENABLED || !item.signature) return
    const table = isDevnet ? 'devTrades' : 'trades'
    const { data: existing } = await supabase
      .from(table)
      .select('id')
      .eq('wallet_address', walletAddress)
      .eq('signature', item.signature)
      .maybeSingle()
    if (existing) return
    const row = {
      wallet_address: walletAddress,
      trade_type: 'received',
      input_token_symbol: item.input_token_symbol,
      output_token_symbol: item.sender || null,
      input_amount_raw: item.input_amount_raw,
      output_amount_raw: '0',
      input_decimals: item.input_decimals ?? 9,
      output_decimals: 9,
      execution_grade: null,
      slippage_pct: null,
      mev_saved_usd: null,
      signature: item.signature,
      explorer_url: item.explorer_url || null,
    }
    const { data, error: err } = await supabase.from(table).insert(row).select().single()
    if (err) { console.warn('[useTrades] saveReceived failed:', err.message); return }
    if (data) setTrades(prev =>
      prev.some(t => t.signature === data.signature) ? prev : [data, ...prev]
    )
  }, [walletAddress, isDevnet])

  const saveTransfer = useCallback(async (payload) => {
    if (!walletAddress || !DB_ENABLED) return
    const table = isDevnet ? 'devTrades' : 'trades'
    const decimals = payload.token?.decimals ?? 9
    const raw = String(Math.round(Number(payload.amount) * Math.pow(10, decimals)))
    const row = {
      wallet_address: walletAddress,
      trade_type: 'sent',
      input_token_symbol: payload.token?.symbol || 'SOL',
      output_token_symbol: payload.recipient || null,
      input_amount_raw: raw,
      output_amount_raw: '0',
      input_decimals: decimals,
      output_decimals: 9,
      execution_grade: null,
      slippage_pct: null,
      mev_saved_usd: null,
      signature: payload.signature || null,
      explorer_url: payload.explorerUrl || null,
    }
    const { data, error: err } = await supabase.from(table).insert(row).select().single()
    if (err) {
      console.warn(`[useTrades] saveTransfer failed:`, err.message)
      return
    }
    if (data) setTrades(prev => [data, ...prev])
  }, [walletAddress, isDevnet])

  return { trades, loading, error, saveTrade, saveTransfer, saveReceived, fetchTrades, dbEnabled: DB_ENABLED }
}
