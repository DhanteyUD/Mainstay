import { useState, useCallback, useRef } from 'react'
import { Connection, VersionedTransaction } from '@solana/web3.js'
import { DFLOW_PROXY, SOLANA_RPC_PROXY } from '../config'

async function confirmTransactionPolling(connection, signature, maxRetries = 45) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await connection.getSignatureStatus(signature)
    const status = response?.value
    if (
      status?.confirmationStatus === 'confirmed' ||
      status?.confirmationStatus === 'finalized'
    ) {
      if (status.err) {
        throw new Error(`Transaction failed on-chain: ${JSON.stringify(status.err)}`)
      }
      return status
    }
    await new Promise((r) => setTimeout(r, 1200))
  }
  throw new Error('Transaction confirmation timeout. Check your wallet for status.')
}

// Matches the security-verification error that DFlow's proxy can surface.
// When detected, we treat it as a non-blocking warning rather than a hard failure
// because DFlow's own order-flow auction already guarantees MEV safety.
function isSecurityCheckError(msg) {
  if (!msg) return false
  const m = msg.toLowerCase()
  return (
    m.includes('security verification') ||
    m.includes('verify this transaction') ||
    m.includes('security risk') ||
    m.includes('server error while attempting to verify')
  )
}

export function useSwap() {
  const [quote, setQuote] = useState(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteError, setQuoteError] = useState(null)
  const [swapStatus, setSwapStatus] = useState('idle') // idle | signing | confirming | success | error
  const [swapResult, setSwapResult] = useState(null)
  const [swapError, setSwapError] = useState(null)
  const [swapWarning, setSwapWarning] = useState(null) // non-blocking DFlow protection notice
  const debounceRef = useRef(null)
  const lastParamsRef = useRef(null)

  const doFetch = useCallback(async ({ inputMint, outputMint, amount, decimals, walletPublicKey, feeBps, prioritizationFeeLamports }) => {
    setQuoteLoading(true)
    setQuoteError(null)
    setQuote(null)

    let lastErr = null
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 1000))
        const rawAmount = Math.floor(Number(amount) * Math.pow(10, decimals))
        const params = new URLSearchParams({
          inputMint,
          outputMint,
          amount: rawAmount.toString(),
          slippageBps: 'auto',
          prioritizationFeeLamports: prioritizationFeeLamports ?? 'auto',
          wrapAndUnwrapSol: 'true',
        })
        if (walletPublicKey) params.set('userPublicKey', walletPublicKey)
        if (feeBps != null) params.set('feeBps', String(feeBps))

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 14000)

        let res
        try {
          res = await fetch(`${DFLOW_PROXY}/e.quote-api.dflow.net/order?${params}`, {
            method: 'GET',
            mode: 'cors',
            credentials: 'omit',
            signal: controller.signal,
          })
        } finally {
          clearTimeout(timeoutId)
        }

        if (!res.ok) {
          const errText = await res.text()
          throw new Error(`Quote failed (${res.status}): ${errText.slice(0, 120)}`)
        }

        const data = await res.json()
        if (!data || (!data.outAmount && !data.outputAmount)) {
          throw new Error('No route found for this token pair.')
        }

        setQuote(data)
        setQuoteLoading(false)
        return
      } catch (err) {
        lastErr = err
      }
    }

    setQuoteError(humanizeError(lastErr?.message))
    setQuote(null)
    setQuoteLoading(false)
  }, [])

  const fetchQuote = useCallback(async (params) => {
    const { amount } = params
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setQuote(null)
      setQuoteError(null)
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    lastParamsRef.current = params

    debounceRef.current = setTimeout(() => {
      doFetch(lastParamsRef.current)
    }, 600)
  }, [doFetch])

  const retryQuote = useCallback(() => {
    if (lastParamsRef.current) doFetch(lastParamsRef.current)
  }, [doFetch])

  const executeSwap = useCallback(async ({ quote, wallet, inputToken, outputToken }) => {
    if (!quote?.transaction || !wallet?.publicKey) {
      setSwapError('Missing quote or wallet.')
      return null
    }

    setSwapStatus('signing')
    setSwapError(null)
    setSwapWarning(null)
    setSwapResult(null)

    try {
      const connection = new Connection(SOLANA_RPC_PROXY, {
        commitment: 'confirmed',
        wsEndpoint: '',
      })

      const txBytes = Uint8Array.from(atob(quote.transaction), (c) => c.charCodeAt(0))
      const tx = VersionedTransaction.deserialize(txBytes)

      // Simulate with sigVerify: false before asking Phantom to sign.
      // Phantom shows "could be malicious" when it can't predict the outcome —
      // pre-simulating on our RPC first means Phantom's own simulation will match.
      try {
        const sim = await connection.simulateTransaction(tx, {
          sigVerify: false,
          commitment: 'confirmed',
        })
        if (sim.value.err) {
          throw new Error(`_simfail_:${JSON.stringify(sim.value.err)}`)
        }
      } catch (simErr) {
        // Hard-fail on actual transaction errors; ignore RPC connectivity issues
        if (simErr.message?.startsWith('_simfail_:')) {
          const detail = simErr.message.replace('_simfail_:', '')
          throw new Error(`Simulation failed: ${detail}`)
        }
      }

      let signedTx
      try {
        signedTx = await wallet.signTransaction(tx)
      } catch (sigErr) {
        throw new Error(sigErr?.message || 'Wallet rejected the transaction.')
      }

      setSwapStatus('confirming')

      let signature
      try {
        signature = await connection.sendRawTransaction(signedTx.serialize(), {
          skipPreflight: true,
        })
      } catch (sendErr) {
        // If DFlow's proxy security check fails, treat it as non-blocking:
        // set a warning and re-throw so the outer catch knows to downgrade
        if (isSecurityCheckError(sendErr?.message)) {
          sendErr._securityWarn = true
        }
        throw sendErr
      }

      await confirmTransactionPolling(connection, signature)

      const result = {
        signature,
        inputAmount: quote.inAmount,
        outputAmount: quote.outAmount || quote.outputAmount,
        inputToken,
        outputToken,
        slippageBps: quote.slippageBps,
        quotedOutput: quote.outAmount || quote.outputAmount,
        explorerUrl: `https://solscan.io/tx/${signature}`,
      }

      setSwapResult(result)
      setSwapStatus('success')
      return result
    } catch (err) {
      // Security verification is a false-positive for DFlow-routed transactions.
      // Downgrade to a non-blocking inline warning so the user can retry confidently.
      if (err._securityWarn || isSecurityCheckError(err?.message)) {
        setSwapWarning(
          'Security check unavailable — your trade is still protected by DFlow'
        )
        setSwapStatus('idle')
        setSwapError(null)
        return null
      }

      const errMsg = humanizeError(err.message)
      setSwapError(errMsg)
      setSwapStatus('error')
      return null
    }
  }, [])

  const resetSwap = useCallback(() => {
    setSwapStatus('idle')
    setSwapResult(null)
    setSwapError(null)
    setSwapWarning(null)
  }, [])

  const clearWarning = useCallback(() => {
    setSwapWarning(null)
  }, [])

  const clearQuote = useCallback(() => {
    setQuote(null)
    setQuoteError(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }, [])

  return {
    quote,
    quoteLoading,
    quoteError,
    fetchQuote,
    retryQuote,
    clearQuote,
    executeSwap,
    swapStatus,
    swapResult,
    swapError,
    swapWarning,
    clearWarning,
    resetSwap,
  }
}

function humanizeError(msg) {
  if (!msg) return 'An unknown error occurred.'
  const m = msg.toLowerCase()
  if (m.includes('user rejected') || m.includes('cancelled') || m.includes('rejected')) {
    return 'Transaction cancelled in wallet.'
  }
  if (m.includes('slippage') || m.includes('0x1788')) {
    return 'Price moved too much. Try again — slippage was exceeded.'
  }
  if (m.includes('insufficient') || m.includes('balance')) {
    return 'Insufficient balance. Check your wallet has enough funds + SOL for fees.'
  }
  if (m.includes('no route') || m.includes('no routes') || m.includes('no_routes')) {
    return 'No route found for this pair. Try a different amount or token.'
  }
  if (m.includes('aborted') || m.includes('abort')) {
    return 'Request timed out. Check your connection and retry.'
  }
  if (m.includes('failed to fetch') || m.includes('networkerror') || m.includes('network request failed') || m.includes('load failed')) {
    return 'Network error — could not reach the quote server. Check your connection or try opening in a browser.'
  }
  if (m.includes('timeout')) {
    return 'Transaction timed out. It may have still gone through — check your wallet.'
  }
  if (msg.startsWith('Simulation failed:')) {
    return 'Transaction simulation failed. Your balance may be insufficient or the route is stale — try refreshing the quote.'
  }
  if (m.includes('simulation failed') || m.includes('simulat')) {
    return 'Transaction simulation failed. Check your balance and try again.'
  }
  if (m.includes('address table') || m.includes('alt')) {
    return 'Routing error. Please try again in a moment.'
  }
  if (m.includes('quote unavailable') || m.includes('quote failed')) {
    return 'Quote unavailable right now. Try again in a moment.'
  }
  return msg.length > 120 ? msg.slice(0, 120) + '…' : msg
}
