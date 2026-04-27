import React from 'react'

export function InfoCard({ title, icon, children, accentColor, borderColor, bgColor }) {
  return (
    <div className={`rounded-xl border ${borderColor} ${bgColor} p-4`}>
      <div className={`flex items-center gap-2 mb-3 ${accentColor}`}>
        {icon}
        <span className="font-mono font-bold text-xs tracking-wider">{title.toUpperCase()}</span>
      </div>
      {children}
    </div>
  )
}

export function Feature({ label }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-1 h-1 rounded-full bg-terminal-green" />
      <span className="font-mono text-xs text-terminal-dim">{label}</span>
    </div>
  )
}

export function Step({ number, title, description }) {
  return (
    <div className="flex gap-3">
      <div className="w-5 h-5 rounded-full border border-terminal-green/40 flex items-center justify-center shrink-0 mt-0.5">
        <span className="font-mono text-xs font-bold text-terminal-green">{number}</span>
      </div>
      <div>
        <div className="font-mono text-xs font-semibold text-terminal-text">{title}</div>
        <div className="font-mono text-xs text-terminal-dim leading-relaxed mt-0.5">{description}</div>
      </div>
    </div>
  )
}
