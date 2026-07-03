import React, { useState } from 'react'
import { useStore } from '../store.jsx'
import { Card, Button, PageHeader, Field, Input, Select, Modal, Empty } from '../components/ui.jsx'
import { GST_RATES } from '../data/states.js'
import { fmtINR } from '../utils/format'

const blank = { name: '', description: '', hsn: '', unit: 'Nos', rate: '', gstRate: 18, type: 'service' }

export default function Items() {
  const { state, saveItem, deleteItem } = useStore()
  const [editing, setEditing] = useState(null)

  return (
    <div>
      <PageHeader
        title="Items & Services"
        subtitle="Your catalog with HSN/SAC codes and default GST rates"
        actions={<Button onClick={() => setEditing({ ...blank })}>+ Add Item</Button>}
      />

      <Card>
        {state.items.length === 0 ? (
          <Empty>No items in your catalog yet.</Empty>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-muted">
                <th className="px-5 py-3 font-medium">Item / Service</th>
                <th className="px-3 py-3 font-medium">Type</th>
                <th className="px-3 py-3 font-medium">HSN/SAC</th>
                <th className="px-3 py-3 font-medium">Unit</th>
                <th className="px-3 py-3 text-right font-medium">Rate</th>
                <th className="px-3 py-3 text-right font-medium">GST</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.items.map((it) => (
                <tr key={it.id} className="border-t border-grid hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="font-medium">{it.name}</div>
                    {it.description && <div className="text-xs text-ink-muted">{it.description}</div>}
                  </td>
                  <td className="px-3 py-3 capitalize text-ink-2">{it.type}</td>
                  <td className="tnum px-3 py-3">{it.hsn || '—'}</td>
                  <td className="px-3 py-3 text-ink-2">{it.unit}</td>
                  <td className="tnum px-3 py-3 text-right font-medium">{fmtINR(it.rate)}</td>
                  <td className="tnum px-3 py-3 text-right">{it.gstRate}%</td>
                  <td className="px-5 py-3 text-right">
                    <button className="mr-3 text-xs font-medium text-brand hover:underline" onClick={() => setEditing({ ...it })}>Edit</button>
                    <button
                      className="text-xs font-medium text-status-critical hover:underline"
                      onClick={() => confirm(`Delete "${it.name}" from catalog?`) && deleteItem(it.id)}
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

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit Item' : 'Add Item'} wide>
        {editing && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Name" required className="md:col-span-2">
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </Field>
            <Field label="Description" className="md:col-span-2">
              <Input value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            </Field>
            <Field label="Type">
              <Select value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value })}>
                <option value="service">Service (SAC)</option>
                <option value="goods">Goods (HSN)</option>
              </Select>
            </Field>
            <Field label={editing.type === 'goods' ? 'HSN Code' : 'SAC Code'}>
              <Input value={editing.hsn} onChange={(e) => setEditing({ ...editing, hsn: e.target.value })} />
            </Field>
            <Field label="Unit">
              <Input value={editing.unit} placeholder="Nos / Hrs / Mth / Kg" onChange={(e) => setEditing({ ...editing, unit: e.target.value })} />
            </Field>
            <Field label="Default Rate (₹)" required>
              <Input type="number" min="0" value={editing.rate} onChange={(e) => setEditing({ ...editing, rate: e.target.value })} />
            </Field>
            <Field label="GST Rate">
              <Select value={editing.gstRate} onChange={(e) => setEditing({ ...editing, gstRate: Number(e.target.value) })}>
                {GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}
              </Select>
            </Field>
            <div className="flex justify-end gap-2 md:col-span-2">
              <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
              <Button
                disabled={!editing.name.trim()}
                onClick={() => { saveItem({ ...editing, rate: Number(editing.rate) || 0 }); setEditing(null) }}
              >
                Save Item
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
