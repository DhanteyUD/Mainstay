import { useState, useEffect } from 'react'
import { Connection } from '@solana/web3.js'
import { DIALECT_PROXY, SOLANA_RPC_PROXY } from '../config'

/**
 * Computes an MEV risk score from three signals:
 *   - Order size in USD        (0–40 pts)
 *   - Pool liquidity           (0–40 pts)
 *   - Network congestion (TPS) (0–20 pts)
 *
 * Returns { risk: { level, score, explanation } | null, loading: bool }
 */
export function useMevRisk({ quote, inputToken, outputToken }) {
  const [risk, setRisk] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!quote || !inputToken || !outputToken) {
      setRisk(null)
      return
    }

    let cancelled = false
    setLoading(true)

    async function compute() {
      try {
        // ── 1. Order size in USD ─────────────────────────────────────────
        const rawIn = Number(quote.inAmount || 0)
        const inputAmountHuman = rawIn / Math.pow(10, inputToken.decimals)

        // Fetch live prices + liquidity for both legs
        const mints = [inputToken.mint, outputToken.mint].join(',')
        let priceData = {}
        try {
          const priceRes = await fetch(
            `${DIALECT_PROXY}/api.jup.ag/price/v3?ids=${mints}`
          )
          if (priceRes.ok) priceData = await priceRes.json()
        } catch {
          // Non-fatal — fall back to 0
        }

        const inputPrice = priceData[inputToken.mint]?.usdPrice || 0
        const inputLiquidity = priceData[inputToken.mint]?.liquidity || 0
        const outputLiquidity = priceData[outputToken.mint]?.liquidity || 0
        // Use the shallower side of the pool as the binding liquidity
        const poolLiquidity =
          inputLiquidity && outputLiquidity
            ? Math.min(inputLiquidity, outputLiquidity)
            : inputLiquidity || outputLiquidity || 0

        const orderUSD = inputAmountHuman * inputPrice

        // ── 2. Size score (0–40) ────────────────────────────────────────
        let sizeScore
        if (orderUSD > 10_000) sizeScore = 40
        else if (orderUSD > 1_000) sizeScore = 27
        else if (orderUSD > 100) sizeScore = 14
        else sizeScore = 4

        // ── 3. Liquidity score (0–40) ───────────────────────────────────
        let liquidityScore
        if (poolLiquidity === 0) {
          liquidityScore = 20 // unknown — treat as neutral
        } else if (poolLiquidity < 50_000) {
          liquidityScore = 40
        } else if (poolLiquidity < 500_000) {
          liquidityScore = 27
        } else if (poolLiquidity < 5_000_000) {
          liquidityScore = 14
        } else {
          liquidityScore = 4
        }

        // ── 4. Network congestion score (0–20) ─────────────────────────
        let congestionScore = 10 // sensible default if RPC call fails
        try {
          const connection = new Connection(SOLANA_RPC_PROXY, {
            commitment: 'confirmed',
            wsEndpoint: '',
          })
          const samples = await connection.getRecentPerformanceSamples(1)
          if (samples?.length > 0) {
            const tps = samples[0].numTransactions / samples[0].samplePeriodSecs
            if (tps > 3_000) congestionScore = 20
            else if (tps > 1_500) congestionScore = 13
            else congestionScore = 5
          }
        } catch {
          // Keep default
        }

        if (cancelled) return

        const totalScore = sizeScore + liquidityScore + congestionScore

        // ── 5. Derive level + explanation ───────────────────────────────
        let level, explanation
        if (totalScore >= 60) {
          level = 'HIGH'
          if (poolLiquidity > 0 && poolLiquidity < 50_000 && orderUSD > 1_000) {
            explanation =
              'High risk: large order in a low-liquidity pool — prime sandwich target.'
          } else if (poolLiquidity > 0 && poolLiquidity < 50_000) {
            explanation =
              'High risk: low-liquidity pool makes this order easy to front-run.'
          } else {
            explanation =
              'High risk: large orders in low-liquidity pools are sandwich targets.'
          }
        } else if (totalScore >= 35) {
          level = 'MEDIUM'
          if (congestionScore >= 16) {
            explanation =
              'Medium risk: network congestion increases MEV opportunity windows.'
          } else if (poolLiquidity > 0 && poolLiquidity < 500_000) {
            explanation =
              'Medium risk: thin liquidity may attract front-running on larger sizes.'
          } else {
            explanation =
              'Medium risk: moderate order size or liquidity may attract MEV bots.'
          }
        } else {
          level = 'LOW'
          explanation =
            'Low risk: small order in a liquid pool — minimal MEV exposure.'
        }

        setRisk({ level, score: totalScore, explanation })
      } catch {
        setRisk(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    compute()
    return () => {
      cancelled = true
    }
  }, [quote, inputToken, outputToken])

  return { risk, loading }
}
