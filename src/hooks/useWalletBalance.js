import { useState, useEffect, useCallback } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'

/**
 * Fetches the SOL balance of the connected wallet.
 * Uses the Connection from wallet adapter context (Helius RPC).
 * Refreshes every 30 seconds while wallet is connected.
 */
export function useWalletBalance() {
  const { publicKey, connected } = useWallet()
  const { connection } = useConnection()
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchBalance = useCallback(async () => {
    if (!publicKey || !connected) {
      setBalance(null)
      return
    }
    setLoading(true)
    try {
      const lamports = await connection.getBalance(publicKey, 'confirmed')
      setBalance(lamports / 1e9)
    } catch (err) {
      console.warn('[useWalletBalance] failed:', err)
      setBalance(null)
    } finally {
      setLoading(false)
    }
  }, [publicKey, connected, connection])

  // Fetch on mount / wallet change
  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  // Poll every 30s while connected
  useEffect(() => {
    if (!connected) return
    const id = setInterval(fetchBalance, 30_000)
    return () => clearInterval(id)
  }, [connected, fetchBalance])

  return { balance, loading, refresh: fetchBalance }
}
