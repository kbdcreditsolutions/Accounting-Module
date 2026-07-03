import React, { useEffect } from 'react'
import { displayStatus } from '../store.jsx'

// ---------- Status badge (icon + label, never color alone) ----------

const STATUS_META = {
  paid: { label: 'Paid', icon: '✓', cls: 'bg-green-50 text-good-text border-green-200' },
  partial: { label: 'Partial', icon: '◐', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  sent: { label: 'Unpaid', icon: '●', cls: 'bg-blue-50 text-brand border-blue-200' },
  overdue: { label: 'Overdue', icon: '!', cls: 'bg-red-50 text-status-critical border-red-200' },
  draft: { label: 'Draft', icon: '✎', cls: 'bg-gray-100 text-ink-2 border-gray-200' },
}

export function StatusBadge({ invoice, status }) {
  const s = status || displayStatus(invoice)
  const m = STATUS_META[s] || STATUS_META.draft
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${m.cls}`}>
      <span aria-hidden>{m.icon}</span>{m.label}
    </span>
  )
}

// ---------- Cards, page chrome ----------

export function Card({ children, className = '' }) {
  return (
    <div className={`rounded-xl border border-grid bg-surface-1 shadow-sm ${className}`}>
      {children}
    </div>
  )
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

// ---------- Buttons ----------

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: 'bg-brand text-white hover:bg-brand-deep',
    secondary: 'border border-grid bg-surface-1 text-ink hover:bg-gray-50',
    danger: 'border border-red-200 bg-surface-1 text-status-critical hover:bg-red-50',
    ghost: 'text-ink-2 hover:bg-gray-100',
  }
  return (
    <button
      className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

// ---------- Form fields ----------

export function Field({ label, required, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium text-ink-2">
        {label}{required && <span className="text-status-critical"> *</span>}
      </span>
      {children}
    </label>
  )
}

export const inputCls =
  'w-full rounded-lg border border-baseline bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-series-1 focus:ring-2 focus:ring-blue-100'

export function Input(props) {
  return <input className={inputCls} {...props} />
}

export function Select({ children, ...props }) {
  return <select className={inputCls} {...props}>{children}</select>
}

export function Textarea(props) {
  return <textarea className={inputCls} rows={3} {...props} />
}

// ---------- Modal ----------

export function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-16" onMouseDown={onClose}>
      <div
        className={`w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} rounded-xl border border-grid bg-surface-1 shadow-xl`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-grid px-5 py-3.5">
          <h2 className="text-base font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-ink-muted hover:bg-gray-100 hover:text-ink" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

// ---------- Empty state ----------

export function Empty({ children }) {
  return <div className="py-12 text-center text-sm text-ink-muted">{children}</div>
}
