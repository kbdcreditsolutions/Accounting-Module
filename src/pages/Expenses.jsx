import React, { useMemo, useRef, useState } from 'react'
import { useStore } from '../store.jsx'
import { Card, Button, PageHeader, Field, Input, Select, Modal, Empty } from '../components/ui.jsx'
import { fmtINR, fmtINR0, fmtDate, today, fyStartYear, fyLabel } from '../utils/format'

const CATEGORIES = ['Rent', 'Salaries', 'Utilities', 'Software', 'Travel', 'Office Supplies', 'Professional Fees', 'Marketing', 'Telephone & Internet', 'Bank Charges', 'Other']
const MODES = ['Bank Transfer', 'UPI', 'Card', 'Cash', 'Cheque']

const blank = () => ({ date: today(), category: 'Other', vendor: '', description: '', amount: '', gstAmount: '', paymentMode: 'Bank Transfer', receiptUrl: '' })

// Resize image to max 1200 px wide, JPEG 0.82 quality → keeps uploads under ~400 KB
function resizeImage(file) {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) { resolve(null); return }
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 1200
      const scale = Math.min(1, MAX / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(objectUrl)
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.82)
    }
    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(null) }
    img.src = objectUrl
  })
}

function fileToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export default function Expenses() {
  const { state, saveExpense, deleteExpense } = useStore()
  const [editing, setEditing] = useState(null)
  const [pendingFile, setPendingFile] = useState(null)   // { preview, file } — selected but not yet uploaded
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()
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

  const openEdit = (exp) => {
    setEditing({ ...exp })
    setPendingFile(null)
  }

  const onFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const preview = URL.createObjectURL(file)
    setPendingFile({ preview, file, name: file.name, type: file.type })
    // reset input so same file can be re-selected after removal
    e.target.value = ''
  }

  const handleSave = async () => {
    let receiptUrl = editing.receiptUrl || ''

    if (pendingFile) {
      setUploading(true)
      try {
        let payload = pendingFile.file
        // Resize images; leave PDFs as-is
        if (pendingFile.type.startsWith('image/')) {
          const resized = await resizeImage(pendingFile.file)
          if (resized) payload = resized
        }
        const base64 = await fileToBase64(payload)
        const token = localStorage.getItem('kbd-books-session') || ''
        const uploadMime = pendingFile.type.startsWith('image/') ? 'image/jpeg' : pendingFile.type
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ fileBase64: base64, mimeType: uploadMime, filename: pendingFile.name }),
        })
        const json = await res.json()
        if (json.url) receiptUrl = json.url
      } catch (err) {
        console.error('Receipt upload failed:', err)
      } finally {
        setUploading(false)
      }
    }

    saveExpense({ ...editing, amount: Number(editing.amount) || 0, gstAmount: Number(editing.gstAmount) || 0, receiptUrl })
    setEditing(null)
    setPendingFile(null)
  }

  const removeReceipt = () => {
    setPendingFile(null)
    setEditing((v) => ({ ...v, receiptUrl: '' }))
  }

  // The preview to show in the modal: pending selection wins over saved URL
  const previewSrc = pendingFile?.preview || editing?.receiptUrl || null
  const previewIsPdf = pendingFile
    ? pendingFile.type === 'application/pdf'
    : editing?.receiptUrl?.toLowerCase().includes('.pdf')

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
            <Button onClick={() => { setEditing(blank()); setPendingFile(null) }}>+ Add Expense</Button>
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
                <th className="px-3 py-3 font-medium">Receipt</th>
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
                  <td className="px-3 py-3">
                    {e.receiptUrl ? (
                      <a href={e.receiptUrl} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                        title="View receipt">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zM8 13h8v2H8v-2zm0 4h5v2H8v-2z"/>
                        </svg>
                        View
                      </a>
                    ) : (
                      <span className="text-xs text-ink-muted">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button className="mr-3 text-xs font-medium text-brand hover:underline" onClick={() => openEdit(e)}>Edit</button>
                    <button className="text-xs font-medium text-status-critical hover:underline"
                      onClick={() => confirm('Delete this expense?') && deleteExpense(e.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={!!editing} onClose={() => { setEditing(null); setPendingFile(null) }} title={editing?.id ? 'Edit Expense' : 'Add Expense'} wide>
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

            {/* Receipt upload */}
            <div className="md:col-span-2">
              <div className="mb-1 text-xs font-medium text-ink-2">Receipt / Bill (image or PDF)</div>
              {previewSrc && !previewIsPdf && (
                <div className="mb-2">
                  <img src={previewSrc} alt="Receipt preview"
                    className="max-h-48 rounded-lg border border-grid object-contain" />
                </div>
              )}
              {previewSrc && previewIsPdf && (
                <div className="mb-2">
                  <a href={previewSrc} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-grid px-3 py-2 text-sm text-brand hover:underline">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z"/>
                    </svg>
                    View PDF
                  </a>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={onFileChange}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="rounded-lg border border-grid bg-gray-50 px-3 py-2 text-sm font-medium text-ink hover:bg-gray-100"
                >
                  {previewSrc ? 'Replace receipt' : 'Attach receipt'}
                </button>
                {previewSrc && (
                  <button type="button" onClick={removeReceipt}
                    className="text-xs font-medium text-status-critical hover:underline">
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 md:col-span-2">
              <Button variant="secondary" onClick={() => { setEditing(null); setPendingFile(null) }}>Cancel</Button>
              <Button
                disabled={!editing.date || !(Number(editing.amount) > 0) || uploading}
                onClick={handleSave}
              >
                {uploading ? 'Uploading…' : 'Save Expense'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
