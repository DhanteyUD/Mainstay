import { useEffect, useRef } from 'react'

const CONTAINER_ID = 'mainstay_sol_chart'
const SYMBOL = 'BINANCE:SOLUSDT'

export default function PriceChart({ solPrice }) {
  const containerRef = useRef(null)
  const widgetReady = useRef(false)
  const firstPrice = useRef(null)
  const sessionHigh = useRef(null)
  const sessionLow = useRef(null)

  if (solPrice != null) {
    if (firstPrice.current === null) firstPrice.current = solPrice
    if (sessionHigh.current === null || solPrice > sessionHigh.current) sessionHigh.current = solPrice
    if (sessionLow.current === null || solPrice < sessionLow.current) sessionLow.current = solPrice
  }

  const change =
    firstPrice.current != null && solPrice != null && firstPrice.current !== 0
      ? ((solPrice - firstPrice.current) / firstPrice.current) * 100
      : 0
  const isUp = change >= 0

  const fmt = (n) =>
    n != null
      ? `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : '—'

  useEffect(() => {
    if (!containerRef.current) return

    const createWidget = () => {
      if (!window.TradingView || !document.getElementById(CONTAINER_ID)) return
      if (widgetReady.current) return

      new window.TradingView.widget({
        autosize: true,
        symbol: SYMBOL,
        interval: '15',
        timezone: 'Etc/UTC',
        theme: 'dark',
        style: '1',
        container_id: CONTAINER_ID,
        toolbar_bg: '#0d1117',
        hide_top_toolbar: true,
        hide_side_toolbar: true,
        hide_legend: true,
        allow_symbol_change: false,
        save_image: false,
        details: false,
        hotlist: false,
        calendar: false,
        withdateranges: false,
        enable_publishing: false,
        backgroundColor: '#0d1117',
        gridColor: 'rgba(255,255,255,0.04)',
        overrides: {
          'paneProperties.background': '#0d1117',
          'paneProperties.backgroundType': 'solid',
          'paneProperties.vertGridProperties.color': 'rgba(255,255,255,0.04)',
          'paneProperties.horzGridProperties.color': 'rgba(255,255,255,0.04)',
          'scalesProperties.backgroundColor': '#0d1117',
          'scalesProperties.textColor': '#4b5563',
          'mainSeriesProperties.candleStyle.upColor': '#22c55e',
          'mainSeriesProperties.candleStyle.downColor': '#ef4444',
          'mainSeriesProperties.candleStyle.borderUpColor': '#22c55e',
          'mainSeriesProperties.candleStyle.borderDownColor': '#ef4444',
          'mainSeriesProperties.candleStyle.wickUpColor': '#22c55e',
          'mainSeriesProperties.candleStyle.wickDownColor': '#ef4444',
        },
      })

      widgetReady.current = true
    }

    if (window.TradingView) {
      createWidget()
    } else {
      const script = document.createElement('script')
      script.src = 'https://s3.tradingview.com/tv.js'
      script.async = true
      script.onload = createWidget
      document.head.appendChild(script)
    }

    return () => {
      const el = document.getElementById(CONTAINER_ID)
      if (el) el.innerHTML = ''
      widgetReady.current = false
    }
  }, [])

  return (
    <div className="rounded-xl border border-terminal-border bg-terminal-card overflow-hidden mb-6">
      <div className="flex items-center justify-between px-4 py-3 border-b border-terminal-border">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-terminal-dim flex items-center gap-1.5">
            <span className="text-terminal-accent">◇</span> SOL / USD
          </span>
          {solPrice != null && (
            <span className="font-mono text-[13px] font-bold text-terminal-text">
              ${solPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] uppercase tracking-wider text-terminal-dim font-mono">15m</span>
          {solPrice != null && (
            <span
              className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded ${
                isUp
                  ? 'text-green-400 bg-green-400/10'
                  : 'text-red-400 bg-red-400/10'
              }`}
            >
              {isUp ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
            </span>
          )}
        </div>
      </div>

      <div className="h-64">
        <div id={CONTAINER_ID} ref={containerRef} className="w-full h-full" />
      </div>

      <div className="grid grid-cols-4 divide-x divide-terminal-border border-t border-terminal-border bg-terminal-card/60">
        {[
          { label: 'OPEN', value: fmt(firstPrice.current) },
          { label: 'HIGH', value: fmt(sessionHigh.current), color: 'text-green-400' },
          { label: 'LOW',  value: fmt(sessionLow.current),  color: 'text-red-400'   },
          { label: 'CHG',  value: solPrice != null ? `${isUp ? '+' : ''}${change.toFixed(2)}%` : '—', color: isUp ? 'text-green-400' : 'text-red-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex flex-col items-center py-2 gap-0.5">
            <span className="text-[8px] font-mono uppercase tracking-widest text-terminal-dim">{label}</span>
            <span className={`text-[11px] font-mono font-bold ${color ?? 'text-terminal-text'}`}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
