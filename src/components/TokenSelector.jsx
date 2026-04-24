import React, { useState, useRef, useEffect, useCallback } from 'react'
import ReactDOM from 'react-dom'
import { ChevronDown, Search, X } from 'lucide-react'
import { TOKEN_LIST } from '../config'

export default function TokenSelector({ selected, onChange, exclude }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 })
  const buttonRef = useRef(null)
  const inputRef = useRef(null)
  const panelRef = useRef(null)

  const filtered = TOKEN_LIST.filter(
    (t) =>
      t.mint !== exclude?.mint &&
      (t.symbol.toLowerCase().includes(search.toLowerCase()) ||
        t.name.toLowerCase().includes(search.toLowerCase()))
  )

  const calcPosition = useCallback(() => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const PANEL_W = 264
    const PANEL_H_APPROX = 320
    const vw = window.innerWidth
    const vh = window.innerHeight

    // Vertical: prefer below, fall back to above
    let top = rect.bottom + 8
    if (top + PANEL_H_APPROX > vh - 8 && rect.top - PANEL_H_APPROX - 8 > 0) {
      top = rect.top - PANEL_H_APPROX - 8
    }

    // Horizontal: align right edge, clamp to viewport
    let left = rect.right - PANEL_W
    if (left < 8) left = 8
    if (left + PANEL_W > vw - 8) left = vw - 8 - PANEL_W

    setPanelPos({ top, left })
  }, [])

  useEffect(() => {
    if (open) {
      calcPosition()
      setTimeout(() => inputRef.current?.focus(), 60)
    }
  }, [open, calcPosition])

  useEffect(() => {
    if (!open) return
    const handleOutside = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target)
      ) {
        setOpen(false)
        setSearch('')
      }
    }
    const handleResize = () => { setOpen(false); setSearch('') }
    // Only dismiss on scroll if the scroll target is NOT inside the panel itself
    const handleScroll = (e) => {
      if (panelRef.current && panelRef.current.contains(e.target)) return
      setOpen(false)
      setSearch('')
    }
    document.addEventListener('mousedown', handleOutside)
    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [open])

  const handleSelect = (token) => {
    onChange(token)
    setOpen(false)
    setSearch('')
  }

  const portal = open ? ReactDOM.createPortal(
    <>
      {/* Full-screen semi-transparent backdrop */}
      <div
        className="fixed inset-0 z-[998] bg-black/40"
        style={{ backdropFilter: 'blur(1px)' }}
        onMouseDown={(e) => {
          e.preventDefault()
          setOpen(false)
          setSearch('')
        }}
      />

      {/* Floating panel */}
      <div
        ref={panelRef}
        className="fixed z-[999] w-64 bg-terminal-card border border-terminal-border rounded-xl shadow-2xl overflow-hidden"
        style={{ top: panelPos.top, left: panelPos.left, animation: 'slideUp 0.15s ease-out' }}
      >
        {/* Header */}
        <div className="px-3 pt-3 pb-2 border-b border-terminal-border">
          <div className="font-mono text-xs text-terminal-dim tracking-widest mb-2">SELECT TOKEN</div>
          <div className="flex items-center gap-2 bg-terminal-surface rounded-lg px-3 py-2 border border-terminal-border focus-within:border-terminal-accent/50 transition-colors">
            <Search size={13} className="text-terminal-dim shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search tokens..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none text-terminal-text text-xs font-mono w-full placeholder-terminal-dim/60"
            />
            {search && (
              <button onMouseDown={(e) => { e.preventDefault(); setSearch('') }}>
                <X size={12} className="text-terminal-dim hover:text-terminal-text" />
              </button>
            )}
          </div>
        </div>

        {/* Token list */}
        <div className="max-h-56 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-terminal-dim text-xs font-mono">
              No tokens found
            </div>
          ) : (
            filtered.map((token) => (
              <button
                key={token.mint}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(token) }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-terminal-surface transition-colors ${
                  selected?.mint === token.mint ? 'bg-terminal-accent/10 text-terminal-accent' : 'text-terminal-text'
                }`}
              >
                <img
                  src={token.logo}
                  alt={token.symbol}
                  className="w-7 h-7 rounded-full shrink-0"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
                <div className="text-left">
                  <div className="font-mono font-semibold text-sm">{token.symbol}</div>
                  <div className="font-mono text-xs text-terminal-dim">{token.name}</div>
                </div>
                {selected?.mint === token.mint && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-terminal-accent" />
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </>,
    document.body
  ) : null

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-terminal-surface border border-terminal-border hover:border-terminal-accent/50 transition-all duration-200 group min-w-[120px]"
      >
        {selected ? (
          <>
            <img
              src={selected.logo}
              alt={selected.symbol}
              className="w-6 h-6 rounded-full"
              onError={(e) => { e.target.style.display = 'none' }}
            />
            <span className="font-mono font-semibold text-terminal-text text-sm">
              {selected.symbol}
            </span>
          </>
        ) : (
          <span className="text-terminal-dim text-sm font-mono">Select</span>
        )}
        <ChevronDown
          size={14}
          className={`text-terminal-dim ml-auto transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {portal}
    </>
  )
}
