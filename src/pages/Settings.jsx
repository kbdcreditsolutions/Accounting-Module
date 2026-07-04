import React, { useState } from 'react'
import { useStore } from '../store.jsx'
import { Card, Button, PageHeader, Field, Input, Select, Textarea } from '../components/ui.jsx'
import { INDIAN_STATES } from '../data/states.js'
import { isValidGSTIN } from '../utils/format'
import { INDUSTRY_PRESETS, DEFAULT_CONFIG } from '../data/companyConfig.js'

export default function Settings() {
  const { state, saveCompany, resetDemo } = useStore()
  const [form, setForm] = useState(() => ({
    ...state.company,
    config: state.company.config ? { ...DEFAULT_CONFIG, ...state.company.config } : { ...DEFAULT_CONFIG },
  }))
  const [saved, setSaved] = useState(false)

  const set = (patch) => { setForm((f) => ({ ...f, ...patch })); setSaved(false) }
  const setCfg = (patch) => set({ config: { ...form.config, ...patch } })
  const setCfgLabels = (patch) => setCfg({ labels: { ...form.config.labels, ...patch } })
  const setCfgFeatures = (patch) => setCfg({ features: { ...form.config.features, ...patch } })
  const setCfgTemplate = (patch) => setCfg({ invoiceTemplate: { ...form.config.invoiceTemplate, ...patch } })

  const applyPreset = (industry) => {
    const preset = (INDUSTRY_PRESETS[industry] || INDUSTRY_PRESETS.general).config
    setCfg({ industry, ...preset })
  }

  const addCustomField = (entity) => {
    const fields = [...(form.config.customFields?.[entity] || []), { key: `field_${Date.now()}`, label: '', type: 'text' }]
    setCfg({ customFields: { ...form.config.customFields, [entity]: fields } })
  }
  const updateCustomField = (entity, idx, patch) => {
    const fields = (form.config.customFields?.[entity] || []).map((f, i) => i === idx ? { ...f, ...patch } : f)
    setCfg({ customFields: { ...form.config.customFields, [entity]: fields } })
  }
  const removeCustomField = (entity, idx) => {
    const fields = (form.config.customFields?.[entity] || []).filter((_, i) => i !== idx)
    setCfg({ customFields: { ...form.config.customFields, [entity]: fields } })
  }
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

      <Card className="mt-4 p-5">
        <h3 className="mb-4 text-sm font-semibold">Industry & Customisation</h3>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

          {/* Industry preset picker */}
          <Field label="Industry Preset" className="md:col-span-2">
            <Select
              value={form.config.industry || 'general'}
              onChange={(e) => applyPreset(e.target.value)}
            >
              {Object.entries(INDUSTRY_PRESETS).map(([key, p]) => (
                <option key={key} value={key}>{p.label}</option>
              ))}
            </Select>
            <span className="mt-1 block text-xs text-ink-muted">
              Selecting a preset fills in sensible defaults — you can override anything below.
            </span>
          </Field>

          {/* Terminology */}
          <Field label={`${form.config.labels?.client || 'Client'} — Singular label`}>
            <Input
              value={form.config.labels?.client || ''}
              placeholder="e.g. Client, Patient, Student, Guest"
              onChange={(e) => setCfgLabels({ client: e.target.value })}
            />
          </Field>
          <Field label="Plural label">
            <Input
              value={form.config.labels?.clients || ''}
              placeholder="e.g. Clients, Patients, Students, Guests"
              onChange={(e) => setCfgLabels({ clients: e.target.value })}
            />
          </Field>

          {/* Invoice column toggles */}
          <div className="md:col-span-2">
            <div className="mb-2 text-xs font-medium text-ink-2">Invoice columns</div>
            <div className="flex flex-wrap gap-5">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!form.config.invoiceTemplate?.showHsn}
                  onChange={(e) => setCfgTemplate({ showHsn: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-brand"
                />
                Show HSN / SAC column
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!form.config.invoiceTemplate?.showDiscount}
                  onChange={(e) => setCfgTemplate({ showDiscount: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-brand"
                />
                Show Discount % column
              </label>
            </div>
          </div>

          {/* Nav toggles */}
          <div className="md:col-span-2">
            <div className="mb-2 text-xs font-medium text-ink-2">Navigation sections</div>
            <div className="flex flex-wrap gap-5">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!form.config.features?.expenses}
                  onChange={(e) => setCfgFeatures({ expenses: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-brand"
                />
                Show Expenses
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!form.config.features?.reports}
                  onChange={(e) => setCfgFeatures({ reports: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-brand"
                />
                Show GST &amp; Reports
              </label>
            </div>
          </div>

          {/* Client custom fields */}
          <div className="md:col-span-2">
            <div className="mb-2 text-xs font-medium text-ink-2">
              Custom fields on {form.config.labels?.client || 'Client'} form
            </div>
            {(form.config.customFields?.client || []).map((f, idx) => (
              <div key={idx} className="mb-2 flex items-center gap-2">
                <Input
                  className="flex-1"
                  placeholder="Field label"
                  value={f.label}
                  onChange={(e) => updateCustomField('client', idx, { label: e.target.value })}
                />
                <Select
                  className="w-28"
                  value={f.type}
                  onChange={(e) => updateCustomField('client', idx, { type: e.target.value })}
                >
                  <option value="text">Text</option>
                  <option value="date">Date</option>
                </Select>
                <button
                  onClick={() => removeCustomField('client', idx)}
                  className="shrink-0 rounded p-1.5 text-ink-muted hover:bg-red-50 hover:text-status-critical"
                  title="Remove field"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                </button>
              </div>
            ))}
            <Button variant="secondary" onClick={() => addCustomField('client')}>
              + Add {form.config.labels?.client || 'Client'} field
            </Button>
          </div>

          {/* Invoice custom fields */}
          <div className="md:col-span-2">
            <div className="mb-2 text-xs font-medium text-ink-2">
              Custom fields on Invoice header
            </div>
            {(form.config.customFields?.invoice || []).map((f, idx) => (
              <div key={idx} className="mb-2 flex items-center gap-2">
                <Input
                  className="flex-1"
                  placeholder="Field label"
                  value={f.label}
                  onChange={(e) => updateCustomField('invoice', idx, { label: e.target.value })}
                />
                <Select
                  className="w-28"
                  value={f.type}
                  onChange={(e) => updateCustomField('invoice', idx, { type: e.target.value })}
                >
                  <option value="text">Text</option>
                  <option value="date">Date</option>
                </Select>
                <button
                  onClick={() => removeCustomField('invoice', idx)}
                  className="shrink-0 rounded p-1.5 text-ink-muted hover:bg-red-50 hover:text-status-critical"
                  title="Remove field"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                </button>
              </div>
            ))}
            <Button variant="secondary" onClick={() => addCustomField('invoice')}>
              + Add Invoice field
            </Button>
          </div>

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
