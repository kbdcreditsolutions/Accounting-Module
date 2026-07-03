import React, { useMemo, useState } from 'react'
import { useStore } from '../store.jsx'
import { Card, Button, PageHeader, Field, Input, Select, Modal, Empty } from '../components/ui.jsx'
import { INDIAN_STATES, stateName } from '../data/states.js'
import { fmtINR0, computeInvoiceTotals, isValidGSTIN } from '../utils/format'

const blank = { name: '', gstin: '', email: '', phone: '', address: '', city: '', stateCode: '07', pincode: '' }

export default function Clients() {
  const { state, saveClient, deleteClient } = useStore()
  const [editing, setEditing] = useState(null)
  const [q, setQ] = useState('')

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase()
    return state.clients
      .filter((c) => !t || c.name.toLowerCase().includes(t) || (c.gstin || '').toLowerCase().includes(t))
      .map((c) => {
        const invs = state.invoices.filter((i) => i.clientId === c.id && i.status !== 'draft')
        const billed = invs.reduce((s, i) => {
          const inter = c.stateCode !== state.company.stateCode
          return s + computeInvoiceTotals(i.items, inter).grandTotal
        }, 0)
        const received = invs.reduce((s, i) => s + (Number(i.amountPaid) || 0), 0)
        return { ...c, invoiceCount: invs.length, billed, due: Math.max(billed - received, 0) }
      })
  }, [state, q])

  const gstinOk = !editing?.gstin || isValidGSTIN(editing.gstin)

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle="Manage your customers and their GST details"
        actions={<Button onClick={() => setEditing({ ...blank })}>+ Add Client</Button>}
      />

      <div className="mb-4 w-72">
        <Input placeholder="Search name or GSTIN…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <Card>
        {rows.length === 0 ? (
          <Empty>No clients yet. Add your first client to start invoicing.</Empty>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-muted">
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-3 py-3 font-medium">GSTIN</th>
                <th className="px-3 py-3 font-medium">State</th>
                <th className="px-3 py-3 text-right font-medium">Invoices</th>
                <th className="px-3 py-3 text-right font-medium">Total Billed</th>
                <th className="px-3 py-3 text-right font-medium">Balance Due</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-t border-grid hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-ink-muted">{c.city}{c.email ? ` · ${c.email}` : ''}</div>
                  </td>
                  <td className="tnum px-3 py-3 text-xs">{c.gstin || '—'}</td>
                  <td className="px-3 py-3 text-ink-2">{stateName(c.stateCode)}</td>
                  <td className="tnum px-3 py-3 text-right">{c.invoiceCount}</td>
                  <td className="tnum px-3 py-3 text-right font-medium">{fmtINR0(c.billed)}</td>
                  <td className="tnum px-3 py-3 text-right">{c.due > 0 ? fmtINR0(c.due) : '—'}</td>
                  <td className="px-5 py-3 text-right">
                    <button className="mr-3 text-xs font-medium text-brand hover:underline" onClick={() => setEditing({ ...c })}>Edit</button>
                    <button
                      className="text-xs font-medium text-status-critical hover:underline"
                      onClick={() => {
                        if (state.invoices.some((i) => i.clientId === c.id)) {
                          alert('This client has invoices and cannot be deleted.')
                          return
                        }
                        if (confirm(`Delete ${c.name}?`)) deleteClient(c.id)
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit Client' : 'Add Client'} wide>
        {editing && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Business / Client Name" required className="md:col-span-2">
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </Field>
            <Field label="GSTIN">
              <Input
                value={editing.gstin}
                placeholder="e.g. 07AAACS1234F1Z5"
                onChange={(e) => {
                  const gstin = e.target.value.toUpperCase()
                  const patch = { gstin }
                  // auto-pick state from the GSTIN's first two digits
                  const code = gstin.slice(0, 2)
                  if (isValidGSTIN(gstin) && INDIAN_STATES.some((s) => s.code === code)) patch.stateCode = code
                  setEditing({ ...editing, ...patch })
                }}
              />
              {!gstinOk && <span className="mt-1 block text-xs text-status-critical">GSTIN format looks invalid</span>}
            </Field>
            <Field label="State (Place of Supply)" required>
              <Select value={editing.stateCode} onChange={(e) => setEditing({ ...editing, stateCode: e.target.value })}>
                {INDIAN_STATES.map((s) => <option key={s.code} value={s.code}>{s.name} ({s.code})</option>)}
              </Select>
            </Field>
            <Field label="Email">
              <Input type="email" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
            </Field>
            <Field label="Phone">
              <Input value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
            </Field>
            <Field label="Address" className="md:col-span-2">
              <Input value={editing.address} onChange={(e) => setEditing({ ...editing, address: e.target.value })} />
            </Field>
            <Field label="City">
              <Input value={editing.city} onChange={(e) => setEditing({ ...editing, city: e.target.value })} />
            </Field>
            <Field label="PIN Code">
              <Input value={editing.pincode} onChange={(e) => setEditing({ ...editing, pincode: e.target.value })} />
            </Field>
            <div className="flex justify-end gap-2 md:col-span-2">
              <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
              <Button
                disabled={!editing.name.trim() || !gstinOk}
                onClick={() => { saveClient(editing); setEditing(null) }}
              >
                Save Client
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
