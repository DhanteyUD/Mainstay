import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const DB_ENABLED = supabase !== null
const TABLE = 'recipients'

export function useSavedAddresses(walletAddress) {
  const [addresses, setAddresses] = useState([])

  useEffect(() => {
    if (!walletAddress || !DB_ENABLED) { setAddresses([]); return }
    supabase
      .from(TABLE)
      .select('id, address, label, last_used_at')
      .eq('wallet_address', walletAddress)
      .order('last_used_at', { ascending: false })
      .limit(10)
      .then(({ data }) => setAddresses(data || []))
  }, [walletAddress])

  const save = useCallback(async (address, label = null) => {
    if (!walletAddress || !DB_ENABLED || !address) return
    const { data } = await supabase
      .from(TABLE)
      .upsert(
        {
          wallet_address: walletAddress,
          address,
          label: label || null,
          last_used_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,wallet_address,address' }
      )
      .select('id, address, label, last_used_at')
      .single()
    if (data) setAddresses(prev =>
      [data, ...prev.filter(a => a.address !== address)].slice(0, 10)
    )
  }, [walletAddress])

  const remove = useCallback(async (address) => {
    if (!walletAddress || !DB_ENABLED) return
    await supabase
      .from(TABLE)
      .delete()
      .eq('wallet_address', walletAddress)
      .eq('address', address)
    setAddresses(prev => prev.filter(a => a.address !== address))
  }, [walletAddress])

  return { addresses, save, remove }
}
