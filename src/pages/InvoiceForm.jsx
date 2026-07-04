import React, { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store.jsx'
import { Card, Button, PageHeader, Field, Input, Select, Textarea } from '../components/ui.jsx'
import { GST_RATES, stateName } from '../data/states.js'
import { fmtINR, today, addDays, computeInvoiceTotals, amountInWords } from '../utils/format'
import { getConfig } from '../data/companyConfig.js'

const emptyLine = () => ({ name: '', description: '', hsn: '', unit: 'Nos', qty: 1, rate: '', discountPct: 0, gstRate: 18 })

export default function InvoiceForm() {
  const { state, saveInvoice } = useStore()
  const { id } = useParams()
  const navigate = useNavigate()
  const existing = id ? state.invoices.find((i) => i.id === id) : null

  const [inv, setInv] = useState(() =>
    existing
      ? { ...existing, items: existing.items.map((it) => ({ ...it })) }
      : {
          clientId: state.clients[0]?.id || '',
          date: today(),
          dueDate: addDays(today(), 30),
          items: [emptyLine()],
          status: 'draft',
          amountPaid: 0,
          notes: 'Thank you for your business.',
        })

  const client = state.clients.find((c) => c.id === inv.clientId)
  const interState = client ? client.stateCode !== state.company.stateCode : false
  const totals = useMemo(() => computeInvoiceTotals(inv.items, interState), [inv.items, interState])
  const cfg = getConfig(state.company)
  const lc = cfg.labels
  const invoiceFields = cfg.customFields.invoice || []
  const { showHsn, showDiscount } = cfg.invoiceTemplate

  const set = (patch) => setInv((v) => ({ ...v, ...patch }))
  const setLine = (i, patch) =>
    setInv((v) => ({ ...v, items: v.items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) }))
  const removeLine = (i) =>
    setInv((v) => ({ ...v, items: v.items.filter((_, idx) => idx !== i) }))

  const pickCatalogItem = (i, itemId) => {
    const it = state.items.find((x) => x.id === itemId)
    if (!it) return
    setLine(i, { name: it.name, description: it.description, hsn: it.hsn, unit: it.unit, rate: it.rate, gstRate: it.gstRate })
  }

  const valid = inv.clientId && inv.date && inv.items.length > 0 &&
    inv.items.every((it) => it.name.trim() && Number(it.qty) > 0 && Number(it.rate) >= 0)

  const save = (statusOverride) => {
    const record = { ...inv, status: statusOverride || inv.status }
    saveInvoice(record)
    navigate('/invoices')
  }

  return (
    <div className="max-w-5xl">
      <PageHeader
        title={existing ? `Edit ${existing.number}` : 'New Invoice'}
        subtitle={interState
          ? `Inter-state supply — IGST applies (${stateName(client?.stateCode)})`
          : `Intra-state supply — CGST + SGST apply (${stateName(state.company.stateCode)})`}
        actions={<Button variant="secondary" onClick={() => navigate('/invoices')}>← Back</Button>}
      />

      <Card className="p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label={`Bill To (${lc.client})`} required>
            <Select value={inv.clientId} onChange={(e) => set({ clientId: e.target.value })}>
              <option value="">Select {lc.client.toLowerCase()}…</option>
              {state.clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {stateName(c.stateCode)}</option>
              ))}
            </Select>
          </Field>
          <Field label="Invoice Date" required>
            <Input type="date" value={inv.date} onChange={(e) => set({ date: e.target.value })} />
          </Field>
          <Field label="Due Date">
            <Input type="date" value={inv.dueDate} onChange={(e) => set({ dueDate: e.target.value })} />
          </Field>
        </div>

        {client && (
          <div className="mt-3 rounded-lg bg-gray-50 px-4 py-3 text-xs text-ink-2">
            <span className="font-medium text-ink">{client.name}</span>
            {' · '}{client.address}, {client.city}, {stateName(client.stateCode)} – {client.pincode}
            {client.gstin && <> · GSTIN: <span className="tnum font-medium">{client.gstin}</span></>}
          </div>
        )}
        {invoiceFields.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            {invoiceFields.map((f) => (
              <Field key={f.key} label={f.label}>
                <Input
                  type={f.type === 'date' ? 'date' : 'text'}
                  value={inv.customData?.[f.key] || ''}
                  onChange={(e) => set({ customData: { ...(inv.customData || {}), [f.key]: e.target.value } })}
                />
              </Field>
            ))}
          </div>
        )}
      </Card>

      {/* Line items */}
      <Card className="mt-4 overflow-x-auto p-5">
        <h3 className="mb-3 text-sm font-semibold">Items</h3>
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="text-left text-xs text-ink-muted">
              <th className="w-[30%] pb-2 font-medium">Item / Service</th>
              {showHsn && <th className="w-24 pb-2 font-medium">HSN/SAC</th>}
              <th className="w-16 pb-2 font-medium">Qty</th>
              <th className="w-16 pb-2 font-medium">Unit</th>
              <th className="w-28 pb-2 font-medium">Rate (₹)</th>
              {showDiscount && <th className="w-20 pb-2 font-medium">Disc %</th>}
              <th className="w-24 pb-2 font-medium">GST %</th>
              <th className="w-28 pb-2 text-right font-medium">Amount</th>
              <th className="w-8 pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {inv.items.map((it, i) => (
              <tr key={i} className="align-top">
                <td className="py-1.5 pr-2">
                  <Input
                    list="item-catalog"
                    placeholder="Type or pick from catalog"
                    value={it.name}
                    onChange={(e) => {
                      const match = state.items.find((x) => x.name === e.target.value)
                      if (match) pickCatalogItem(i, match.id)
                      else setLine(i, { name: e.target.value })
                    }}
                  />
                </td>
                {showHsn && <td className="py-1.5 pr-2"><Input value={it.hsn} onChange={(e) => setLine(i, { hsn: e.target.value })} /></td>}
                <td className="py-1.5 pr-2"><Input type="number" min="0" value={it.qty} onChange={(e) => setLine(i, { qty: e.target.value })} /></td>
                <td className="py-1.5 pr-2"><Input value={it.unit} onChange={(e) => setLine(i, { unit: e.target.value })} /></td>
                <td className="py-1.5 pr-2"><Input type="number" min="0" value={it.rate} onChange={(e) => setLine(i, { rate: e.target.value })} /></td>
                {showDiscount && <td className="py-1.5 pr-2"><Input type="number" min="0" max="100" value={it.discountPct} onChange={(e) => setLine(i, { discountPct: e.target.value })} /></td>}
                <td className="py-1.5 pr-2">
                  <Select value={it.gstRate} onChange={(e) => setLine(i, { gstRate: Number(e.target.value) })}>
                    {GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}
                  </Select>
                </td>
                <td className="tnum py-3 pr-2 text-right font-medium">{fmtINR(totals.lines[i]?.taxable || 0)}</td>
                <td className="py-2.5">
                  <button
                    onClick={() => removeLine(i)}
                    disabled={inv.items.length === 1}
                    className="rounded p-1 text-ink-muted hover:bg-red-50 hover:text-status-critical disabled:opacity-30"
                    title="Remove line"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <datalist id="item-catalog">
          {state.items.map((it) => <option key={it.id} value={it.name} />)}
        </datalist>
        <Button variant="secondary" className="mt-3" onClick={() => setInv((v) => ({ ...v, items: [...v.items, emptyLine()] }))}>
          + Add Line
        </Button>
      </Card>

      {/* Totals + notes */}
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="p-5">
          <Field label="Notes (shown on invoice)">
            <Textarea value={inv.notes} onChange={(e) => set({ notes: e.target.value })} />
          </Field>
        </Card>
        <Card className="p-5">
          <div className="space-y-2 text-sm">
            <Row label="Taxable value" value={fmtINR(totals.taxable)} />
            {totals.discount > 0 && <Row label="Discount applied" value={`− ${fmtINR(totals.discount)}`} />}
            {interState ? (
              <Row label="IGST" value={fmtINR(totals.igst)} />
            ) : (
              <>
                <Row label="CGST" value={fmtINR(totals.cgst)} />
                <Row label="SGST" value={fmtINR(totals.sgst)} />
              </>
            )}
            <Row label="Round off" value={fmtINR(totals.roundOff)} />
            <div className="flex justify-between border-t border-grid pt-2 text-base font-semibold">
              <span>Grand Total</span>
              <span className="tnum">{fmtINR(totals.grandTotal)}</span>
            </div>
            <p className="pt-1 text-xs italic text-ink-muted">{amountInWords(totals.grandTotal)}</p>
          </div>
        </Card>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={() => navigate('/invoices')}>Cancel</Button>
        <Button variant="secondary" disabled={!valid} onClick={() => save('draft')}>Save as Draft</Button>
        <Button disabled={!valid} onClick={() => save(existing && existing.status !== 'draft' ? undefined : 'sent')}>
          Save &amp; Finalise
        </Button>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-2">{label}</span>
      <span className="tnum font-medium">{value}</span>
    </div>
  )
}
