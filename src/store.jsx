import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { api, useAuth } from './auth.jsx'
import { seedForCompany } from './data/seeds.js'
import { today } from './utils/format'

const uid = () => Math.random().toString(36).slice(2, 10)

// ---------------- Store (server-synced, one dataset per company) ----------------

const StoreCtx = createContext(null)

export function StoreProvider({ children }) {
  const { user, sessionExpired } = useAuth()
  const [state, setState] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [syncState, setSyncState] = useState('idle') // idle | saving | error
  const saveTimer = useRef(null)
  const skipNextSave = useRef(true)

  // initial load for the signed-in company
  useEffect(() => {
    let cancelled = false
    setState(null)
    setLoadError('')
    skipNextSave.current = true
    api('state')
      .then((out) => { if (!cancelled) setState(out.data) })
      .catch((err) => {
        if (cancelled) return
        if (err.status === 401) sessionExpired()
        else setLoadError(err.message)
      })
    return () => { cancelled = true }
  }, [user?.id])

  // debounced save on every change
  useEffect(() => {
    if (state === null) return
    if (skipNextSave.current) { skipNextSave.current = false; return }
    setSyncState('saving')
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      api('state', { method: 'PUT', body: { data: state } })
        .then(() => setSyncState('idle'))
        .catch((err) => {
          if (err.status === 401) sessionExpired()
          else setSyncState('error')
        })
    }, 600)
    return () => clearTimeout(saveTimer.current)
  }, [state])

  const apiActions = useMemo(() => {
    const upsert = (list) => (record) =>
      setState((s) => {
        const arr = s[list]
        const idx = record.id ? arr.findIndex((x) => x.id === record.id) : -1
        const next = idx >= 0
          ? arr.map((x, i) => (i === idx ? { ...x, ...record } : x))
          : [{ ...record, id: record.id || uid() }, ...arr]
        return { ...s, [list]: next }
      })
    const remove = (list) => (id) =>
      setState((s) => ({ ...s, [list]: s[list].filter((x) => x.id !== id) }))

    return {
      saveClient: upsert('clients'),
      deleteClient: remove('clients'),
      saveItem: upsert('items'),
      deleteItem: remove('items'),
      saveExpense: upsert('expenses'),
      deleteExpense: remove('expenses'),
      deleteInvoice: remove('invoices'),

      saveInvoice(inv) {
        setState((s) => {
          let { nextSeq } = s
          let number = inv.number
          if (!inv.id && !number) {
            const fy = fyCode(inv.date || today())
            number = `${s.company.invoicePrefix}/${fy}/${String(nextSeq).padStart(4, '0')}`
            nextSeq += 1
          }
          const record = { ...inv, id: inv.id || uid(), number }
          const idx = s.invoices.findIndex((x) => x.id === record.id)
          const invoices = idx >= 0
            ? s.invoices.map((x, i) => (i === idx ? record : x))
            : [record, ...s.invoices]
          return { ...s, invoices, nextSeq }
        })
      },

      setInvoiceStatus(id, status, amountPaid) {
        setState((s) => ({
          ...s,
          invoices: s.invoices.map((x) =>
            x.id === id ? { ...x, status, ...(amountPaid !== undefined ? { amountPaid } : {}) } : x),
        }))
      },

      saveCompany(company) {
        setState((s) => ({ ...s, company: { ...s.company, ...company } }))
      },

      resetDemo() {
        setState(seedForCompany(user?.companyCode, user?.companyName))
      },
    }
  }, [user?.companyCode, user?.companyName])

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page px-4">
        <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-medium text-status-critical">Could not load your books</p>
          <p className="mt-2 text-sm text-ink-2">{loadError}</p>
          <button className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (state === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page">
        <div className="flex items-center gap-3 text-sm text-ink-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-grid border-t-brand" />
          Loading your books…
        </div>
      </div>
    )
  }

  return <StoreCtx.Provider value={{ state, syncState, ...apiActions }}>{children}</StoreCtx.Provider>
}

function fyCode(iso) {
  const d = new Date(iso + 'T00:00:00')
  const start = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1
  return `${start % 100}-${String((start + 1) % 100).padStart(2, '0')}`
}

export const useStore = () => useContext(StoreCtx)

// Display status: overdue is derived, not stored
export function displayStatus(inv) {
  if (inv.status === 'paid') return 'paid'
  if (inv.status === 'draft') return 'draft'
  if (inv.dueDate && inv.dueDate < today()) return 'overdue'
  return inv.status // sent | partial
}
