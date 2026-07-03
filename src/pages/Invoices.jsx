import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, displayStatus } from '../store.jsx'
import { Card, StatusBadge, Button, PageHeader, Select, Input, Empty, Modal, Field } from '../components/ui.jsx'
import { fmtINR, fmtDate, computeInvoiceTotals } from '../utils/format'

const STATUS_FILTERS = [
  { value: 'all', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Unpaid' },
  { value: 'partial', label: 'Partially paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'paid', label: 'Paid' },
]

export default function Invoices() {
  const { state, deleteInvoice, setInvoiceStatus } = useStore()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [payFor, setPayFor] = useState(null) // invoice being marked paid
  const [payAmt, setPayAmt] = useState('')

  const rows = useMemo(() => {
    return state.invoices
      .map((inv) => {
        const client = state.clients.find((c) => c.id === inv.clientId)
        const interState = client ? client.stateCode !== state.company.stateCode : false
        const totals = computeInvoiceTotals(inv.items, interState)
        return { ...inv, client, totals, ds: displayStatus(inv) }
      })
      .filter((r) => status === 'all' || r.ds === status)
      .filter((r) => {
        const t = q.trim().toLowerCase()
        if (!t) return true
        return r.number.toLowerCase().includes(t) || (r.client?.name || '').toLowerCase().includes(t)
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.number.localeCompare(a.number))
  }, [state, q, status])

  const openPayModal = (inv) => {
    setPayFor(inv)
    setPayAmt(String(inv.totals.grandTotal))
  }

  const recordPayment = () => {
    const amt = Number(payAmt) || 0
    const total = payFor.totals.grandTotal
    const newPaid = Math.min((Number(payFor.amountPaid) || 0) + amt, total)
    setInvoiceStatus(payFor.id, newPaid >= total ? 'paid' : 'partial', newPaid)
    setPayFor(null)
  }

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Create, track and print GST invoices"
        actions={<Button onClick={() => navigate('/invoices/new')}>+ New Invoice</Button>}
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="w-72">
          <Input placeholder="Search invoice no. or client…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="w-48">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_FILTERS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
        </div>
      </div>

      <Card>
        {rows.length === 0 ? (
          <Empty>No invoices found. Create your first invoice to get started.</Empty>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-muted">
                <th className="px-5 py-3 font-medium">Invoice No.</th>
                <th className="px-3 py-3 font-medium">Client</th>
                <th className="px-3 py-3 font-medium">Date</th>
                <th className="px-3 py-3 font-medium">Due</th>
                <th className="px-3 py-3 text-right font-medium">Total</th>
                <th className="px-3 py-3 text-right font-medium">Balance</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((inv) => {
                const balance = Math.max(inv.totals.grandTotal - (Number(inv.amountPaid) || 0), 0)
                return (
                  <tr key={inv.id} className="border-t border-grid hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-brand">
                      <button className="hover:underline" onClick={() => navigate(`/invoices/${inv.id}/print`)}>{inv.number}</button>
                    </td>
                    <td className="px-3 py-3">{inv.client?.name || '—'}</td>
                    <td className="px-3 py-3 text-ink-2">{fmtDate(inv.date)}</td>
                    <td className="px-3 py-3 text-ink-2">{fmtDate(inv.dueDate)}</td>
                    <td className="tnum px-3 py-3 text-right font-medium">{fmtINR(inv.totals.grandTotal)}</td>
                    <td className="tnum px-3 py-3 text-right">{balance > 0 ? fmtINR(balance) : '—'}</td>
                    <td className="px-3 py-3"><StatusBadge invoice={inv} /></td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <IconBtn title="Print / PDF" onClick={() => navigate(`/invoices/${inv.id}/print`)}>
                          <path d="M19 8H5a3 3 0 0 0-3 3v6h4v4h12v-4h4v-6a3 3 0 0 0-3-3zm-3 11H8v-5h8v5zm3-7a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm-1-9H6v4h12V3z" />
                        </IconBtn>
                        <IconBtn title="Edit" onClick={() => navigate(`/invoices/${inv.id}/edit`)}>
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                        </IconBtn>
                        {inv.ds !== 'paid' && inv.ds !== 'draft' && (
                          <IconBtn title="Record payment" onClick={() => openPayModal(inv)}>
                            <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1H6.32c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
                          </IconBtn>
                        )}
                        <IconBtn title="Delete" danger onClick={() => {
                          if (confirm(`Delete invoice ${inv.number}? This cannot be undone.`)) deleteInvoice(inv.id)
                        }}>
                          <path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                        </IconBtn>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={!!payFor} onClose={() => setPayFor(null)} title={`Record payment — ${payFor?.number || ''}`}>
        {payFor && (
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-3 text-sm">
              <div className="flex justify-between"><span className="text-ink-2">Invoice total</span><span className="tnum font-medium">{fmtINR(payFor.totals.grandTotal)}</span></div>
              <div className="mt-1 flex justify-between"><span className="text-ink-2">Already received</span><span className="tnum">{fmtINR(payFor.amountPaid || 0)}</span></div>
              <div className="mt-1 flex justify-between font-medium"><span>Balance due</span><span className="tnum">{fmtINR(Math.max(payFor.totals.grandTotal - (payFor.amountPaid || 0), 0))}</span></div>
            </div>
            <Field label="Amount received now (₹)" required>
              <Input type="number" min="0" value={payAmt} onChange={(e) => setPayAmt(e.target.value)} />
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setPayFor(null)}>Cancel</Button>
              <Button onClick={recordPayment}>Save Payment</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function IconBtn({ children, title, danger, onClick }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`rounded-md p-1.5 transition-colors ${danger ? 'text-ink-muted hover:bg-red-50 hover:text-status-critical' : 'text-ink-muted hover:bg-blue-50 hover:text-brand'}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>{children}</svg>
    </button>
  )
}
