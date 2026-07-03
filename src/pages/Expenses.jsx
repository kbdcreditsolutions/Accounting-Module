import React, { useMemo, useState } from 'react'
import { useStore } from '../store.jsx'
import { Card, Button, PageHeader, Field, Input, Select, Modal, Empty } from '../components/ui.jsx'
import { fmtINR, fmtINR0, fmtDate, today, fyStartYear, fyLabel } from '../utils/format'

const CATEGORIES = ['Rent', 'Salaries', 'Utilities', 'Software', 'Travel', 'Office Supplies', 'Professional Fees', 'Marketing', 'Telephone & Internet', 'Bank Charges', 'Other']
const MODES = ['Bank Transfer', 'UPI', 'Card', 'Cash', 'Cheque']

const blank = () => ({ date: today(), category: 'Other', vendor: '', description: '', amount: '', gstAmount: '', paymentMode: 'Bank Transfer' })

export default function Expenses() {
  const { state, saveExpense, deleteExpense } = useStore()
  const [editing, setEditing] = useState(null)
  const currentFY = fyStartYear(today())
  const [fy, setFy] = useState(currentFY)

  const fyYears = useMemo(() => {
    const ys = new Set(state.expenses.map((e) => fyStartYear(e.date)))
    ys.add(currentFY)
    return [...ys].sort((a, b) => b - a)
  }, [state.expenses, currentFY])

  const rows = useMemo(
    () => state.expenses
      .filter((e) => fyStartYear(e.date) === fy)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [state.expenses, fy])

  const total = rows.reduce((s, e) => s + (Number(e.amount) || 0), 0)
  const itc = rows.reduce((s, e) => s + (Number(e.gstAmount) || 0), 0)

  return (
    <div>
      <PageHeader
        title="Expenses"
        subtitle="Record business spends and GST input tax credit"
        actions={
          <>
            <select value={fy} onChange={(e) => setFy(Number(e.target.value))}
              className="rounded-lg border border-baseline bg-surface-1 px-3 py-2 text-sm">
              {fyYears.map((y) => <option key={y} value={y}>{fyLabel(y)}</option>)}
            </select>
            <Button onClick={() => setEditing(blank())}>+ Add Expense</Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 md:w-1/2">
        <Card className="border-l-4 border-l-status-serious p-4">
          <div className="text-xs font-medium text-ink-2">Total Expenses — {fyLabel(fy)}</div>
          <div className="mt-1 text-xl font-semibold">{fmtINR0(total)}</div>
        </Card>
        <Card className="border-l-4 border-l-series-2 p-4">
          <div className="text-xs font-medium text-ink-2">GST Input Credit (ITC)</div>
          <div className="mt-1 text-xl font-semibold">{fmtINR0(itc)}</div>
        </Card>
      </div>

      <Card>
        {rows.length === 0 ? (
          <Empty>No expenses recorded for {fyLabel(fy)}.</Empty>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-muted">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-3 py-3 font-medium">Category</th>
                <th className="px-3 py-3 font-medium">Vendor</th>
                <th className="px-3 py-3 font-medium">Description</th>
                <th className="px-3 py-3 font-medium">Mode</th>
                <th className="px-3 py-3 text-right font-medium">GST (ITC)</th>
                <th className="px-3 py-3 text-right font-medium">Amount</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} className="border-t border-grid hover:bg-gray-50">
                  <td className="px-5 py-3 text-ink-2">{fmtDate(e.date)}</td>
                  <td className="px-3 py-3">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-ink-2">{e.category}</span>
                  </td>
                  <td className="px-3 py-3">{e.vendor || '—'}</td>
                  <td className="px-3 py-3 text-ink-2">{e.description || '—'}</td>
                  <td className="px-3 py-3 text-ink-2">{e.paymentMode}</td>
                  <td className="tnum px-3 py-3 text-right">{Number(e.gstAmount) ? fmtINR(e.gstAmount) : '—'}</td>
                  <td className="tnum px-3 py-3 text-right font-medium">{fmtINR(e.amount)}</td>
                  <td className="px-5 py-3 text-right">
                    <button className="mr-3 text-xs font-medium text-brand hover:underline" onClick={() => setEditing({ ...e })}>Edit</button>
                    <button className="text-xs font-medium text-status-critical hover:underline"
                      onClick={() => confirm('Delete this expense?') && deleteExpense(e.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit Expense' : 'Add Expense'} wide>
        {editing && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Date" required>
              <Input type="date" value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} />
            </Field>
            <Field label="Category">
              <Select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Vendor">
              <Input value={editing.vendor} onChange={(e) => setEditing({ ...editing, vendor: e.target.value })} />
            </Field>
            <Field label="Payment Mode">
              <Select value={editing.paymentMode} onChange={(e) => setEditing({ ...editing, paymentMode: e.target.value })}>
                {MODES.map((m) => <option key={m}>{m}</option>)}
              </Select>
            </Field>
            <Field label="Description" className="md:col-span-2">
              <Input value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            </Field>
            <Field label="Total Amount (₹, incl. GST)" required>
              <Input type="number" min="0" value={editing.amount} onChange={(e) => setEditing({ ...editing, amount: e.target.value })} />
            </Field>
            <Field label="GST portion — claimable ITC (₹)">
              <Input type="number" min="0" value={editing.gstAmount} onChange={(e) => setEditing({ ...editing, gstAmount: e.target.value })} />
            </Field>
            <div className="flex justify-end gap-2 md:col-span-2">
              <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
              <Button
                disabled={!editing.date || !(Number(editing.amount) > 0)}
                onClick={() => {
                  saveExpense({ ...editing, amount: Number(editing.amount) || 0, gstAmount: Number(editing.gstAmount) || 0 })
                  setEditing(null)
                }}
              >
                Save Expense
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
