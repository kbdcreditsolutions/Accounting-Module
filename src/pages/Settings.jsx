import React, { useState } from 'react'
import { useStore } from '../store.jsx'
import { Card, Button, PageHeader, Field, Input, Select, Textarea } from '../components/ui.jsx'
import { INDIAN_STATES } from '../data/states.js'
import { isValidGSTIN } from '../utils/format'

export default function Settings() {
  const { state, saveCompany, resetDemo } = useStore()
  const [form, setForm] = useState({ ...state.company })
  const [saved, setSaved] = useState(false)

  const set = (patch) => { setForm((f) => ({ ...f, ...patch })); setSaved(false) }
  const gstinOk = !form.gstin || isValidGSTIN(form.gstin)

  const onLogo = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => set({ logo: reader.result })
    reader.readAsDataURL(file)
  }

  const save = () => {
    saveCompany(form)
    setSaved(true)
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" subtitle="Your business profile — printed on every invoice" />

      <Card className="p-5">
        <h3 className="mb-4 text-sm font-semibold">Business Details</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Business Name" required className="md:col-span-2">
            <Input value={form.name} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <Field label="Tagline (shown under name)" className="md:col-span-2">
            <Input value={form.tagline} onChange={(e) => set({ tagline: e.target.value })} />
          </Field>
          <Field label="GSTIN">
            <Input value={form.gstin} onChange={(e) => set({ gstin: e.target.value.toUpperCase() })} />
            {!gstinOk && <span className="mt-1 block text-xs text-status-critical">GSTIN format looks invalid</span>}
          </Field>
          <Field label="PAN">
            <Input value={form.pan} onChange={(e) => set({ pan: e.target.value.toUpperCase() })} />
          </Field>
          <Field label="Address" className="md:col-span-2">
            <Input value={form.address} onChange={(e) => set({ address: e.target.value })} />
          </Field>
          <Field label="City">
            <Input value={form.city} onChange={(e) => set({ city: e.target.value })} />
          </Field>
          <Field label="State" required>
            <Select value={form.stateCode} onChange={(e) => set({ stateCode: e.target.value })}>
              {INDIAN_STATES.map((s) => <option key={s.code} value={s.code}>{s.name} ({s.code})</option>)}
            </Select>
          </Field>
          <Field label="PIN Code">
            <Input value={form.pincode} onChange={(e) => set({ pincode: e.target.value })} />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
          </Field>
          <Field label="Email" className="md:col-span-2">
            <Input type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} />
          </Field>
          <Field label="Logo (printed on invoice)">
            <input type="file" accept="image/*" onChange={onLogo}
              className="block w-full text-sm text-ink-2 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand hover:file:bg-blue-100" />
          </Field>
          {form.logo && (
            <div className="flex items-end gap-3">
              <img src={form.logo} alt="Logo preview" className="h-14 w-14 rounded border border-grid object-contain" />
              <Button variant="secondary" onClick={() => set({ logo: '' })}>Remove</Button>
            </div>
          )}
        </div>
      </Card>

      <Card className="mt-4 p-5">
        <h3 className="mb-4 text-sm font-semibold">Bank & Payment Details</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Bank Name"><Input value={form.bankName} onChange={(e) => set({ bankName: e.target.value })} /></Field>
          <Field label="Account Number"><Input value={form.bankAccount} onChange={(e) => set({ bankAccount: e.target.value })} /></Field>
          <Field label="IFSC"><Input value={form.bankIfsc} onChange={(e) => set({ bankIfsc: e.target.value.toUpperCase() })} /></Field>
          <Field label="Branch"><Input value={form.bankBranch} onChange={(e) => set({ bankBranch: e.target.value })} /></Field>
          <Field label="UPI ID"><Input value={form.upiId} onChange={(e) => set({ upiId: e.target.value })} /></Field>
        </div>
      </Card>

      <Card className="mt-4 p-5">
        <h3 className="mb-4 text-sm font-semibold">Invoice Preferences</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Invoice Number Prefix">
            <Input value={form.invoicePrefix} onChange={(e) => set({ invoicePrefix: e.target.value })} />
            <span className="mt-1 block text-xs text-ink-muted">Numbers look like {form.invoicePrefix || 'KBD'}/26-27/0012</span>
          </Field>
          <Field label="Default Terms & Conditions" className="md:col-span-2">
            <Textarea rows={4} value={form.terms} onChange={(e) => set({ terms: e.target.value })} />
          </Field>
        </div>
      </Card>

      <div className="mt-5 flex items-center justify-between">
        <Button
          variant="danger"
          onClick={() => {
            if (confirm('Reset ALL data back to the demo dataset? Your clients, invoices and expenses will be replaced.')) resetDemo()
          }}
        >
          Reset to demo data
        </Button>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm font-medium text-good-text">✓ Saved</span>}
          <Button disabled={!form.name.trim() || !gstinOk} onClick={save}>Save Settings</Button>
        </div>
      </div>
    </div>
  )
}
