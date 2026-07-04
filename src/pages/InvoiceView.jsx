import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store.jsx'
import { Button } from '../components/ui.jsx'
import { stateName } from '../data/states.js'
import { fmtINR, fmtDate, computeInvoiceTotals, amountInWords, round2 } from '../utils/format'
import { getConfig } from '../data/companyConfig.js'

export default function InvoiceView() {
  const { state } = useStore()
  const { id } = useParams()
  const navigate = useNavigate()
  const inv = state.invoices.find((i) => i.id === id)

  if (!inv) {
    return (
      <div className="p-10 text-center">
        <p className="text-ink-2">Invoice not found.</p>
        <Button className="mt-4" onClick={() => navigate('/invoices')}>Back to Invoices</Button>
      </div>
    )
  }

  const co = state.company
  const client = state.clients.find((c) => c.id === inv.clientId)
  const interState = client ? client.stateCode !== co.stateCode : false
  const totals = computeInvoiceTotals(inv.items, interState)
  const balance = Math.max(totals.grandTotal - (Number(inv.amountPaid) || 0), 0)
  const cfg = getConfig(co)
  const invoiceFields = cfg.customFields.invoice || []
  const { showHsn, showDiscount } = cfg.invoiceTemplate

  // HSN-wise tax summary (required on GST invoices)
  const hsnSummary = (() => {
    const map = new Map()
    inv.items.forEach((it, i) => {
      const line = totals.lines[i]
      const key = `${it.hsn || '—'}|${it.gstRate}`
      const cur = map.get(key) || { hsn: it.hsn || '—', gstRate: Number(it.gstRate) || 0, taxable: 0, cgst: 0, sgst: 0, igst: 0 }
      cur.taxable = round2(cur.taxable + line.taxable)
      cur.cgst = round2(cur.cgst + line.cgst)
      cur.sgst = round2(cur.sgst + line.sgst)
      cur.igst = round2(cur.igst + line.igst)
      map.set(key, cur)
    })
    return [...map.values()]
  })()

  return (
    <div className="print-root mx-auto max-w-4xl px-6 py-8">
      <div className="no-print mb-5 flex items-center justify-between">
        <Button variant="secondary" onClick={() => navigate('/invoices')}>← Back to Invoices</Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate(`/invoices/${inv.id}/edit`)}>Edit</Button>
          <Button onClick={() => window.print()}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M19 8H5a3 3 0 0 0-3 3v6h4v4h12v-4h4v-6a3 3 0 0 0-3-3zm-3 11H8v-5h8v5zm3-7a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm-1-9H6v4h12V3z"/></svg>
            Print / Save as PDF
          </Button>
        </div>
      </div>

      <div className="invoice-sheet rounded-lg border border-gray-300 bg-white p-8 text-[13px] leading-snug text-black shadow-sm">
        {/* Header */}
        <div className="text-center">
          <div className="text-lg font-bold uppercase tracking-wide">Tax Invoice</div>
        </div>
        <div className="mt-3 flex items-start justify-between gap-6 border-b-2 border-black pb-4">
          <div className="flex items-start gap-3">
            {co.logo ? (
              <img src={co.logo} alt="" className="h-14 w-14 rounded object-contain" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded bg-blue-900 text-2xl font-bold text-white">₹</div>
            )}
            <div>
              <div className="text-xl font-bold text-blue-900">{co.name}</div>
              {co.tagline && <div className="text-xs text-gray-600">{co.tagline}</div>}
              <div className="mt-1 text-xs">
                {co.address}, {co.city}, {stateName(co.stateCode)} – {co.pincode}<br />
                Phone: {co.phone} · Email: {co.email}
              </div>
            </div>
          </div>
          <div className="shrink-0 text-right text-xs">
            <div><span className="text-gray-600">GSTIN:</span> <span className="font-semibold">{co.gstin}</span></div>
            {co.pan && <div><span className="text-gray-600">PAN:</span> <span className="font-semibold">{co.pan}</span></div>}
            <div><span className="text-gray-600">State:</span> {stateName(co.stateCode)} ({co.stateCode})</div>
          </div>
        </div>

        {/* Meta + Bill To */}
        <div className="mt-4 grid grid-cols-2 gap-6">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Bill To</div>
            <div className="mt-1 font-semibold">{client?.name || '—'}</div>
            {client && (
              <div className="text-xs">
                {client.address}, {client.city},<br />
                {stateName(client.stateCode)} – {client.pincode}<br />
                {client.gstin && <>GSTIN: <span className="font-medium">{client.gstin}</span><br /></>}
                {client.phone && <>Phone: {client.phone}</>}
              </div>
            )}
          </div>
          <div className="text-xs">
            <table className="ml-auto">
              <tbody>
                <MetaRow k="Invoice No." v={<span className="font-semibold">{inv.number}</span>} />
                <MetaRow k="Invoice Date" v={fmtDate(inv.date)} />
                <MetaRow k="Due Date" v={fmtDate(inv.dueDate)} />
                <MetaRow k="Place of Supply" v={`${stateName(client?.stateCode || co.stateCode)} (${client?.stateCode || co.stateCode})`} />
                <MetaRow k="Supply Type" v={interState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'} />
                {invoiceFields.map((f) => inv.customData?.[f.key]
                  ? <MetaRow key={f.key} k={f.label} v={inv.customData[f.key]} />
                  : null
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Items table */}
        <table className="mt-5 w-full border-collapse text-xs">
          <thead>
            <tr className="bg-blue-900 text-white">
              <Th>#</Th>
              <Th className="text-left">Item &amp; Description</Th>
              {showHsn && <Th>HSN/SAC</Th>}
              <Th>Qty</Th>
              <Th>Rate (₹)</Th>
              {showDiscount && <Th>Disc.</Th>}
              <Th>Taxable (₹)</Th>
              {interState ? <Th>IGST</Th> : <><Th>CGST</Th><Th>SGST</Th></>}
              <Th>Total (₹)</Th>
            </tr>
          </thead>
          <tbody>
            {inv.items.map((it, i) => {
              const l = totals.lines[i]
              const half = (Number(it.gstRate) || 0) / 2
              return (
                <tr key={i} className="border-b border-gray-300 align-top">
                  <Td center>{i + 1}</Td>
                  <Td>
                    <div className="font-medium">{it.name}</div>
                    {it.description && <div className="text-[11px] text-gray-600">{it.description}</div>}
                  </Td>
                  {showHsn && <Td center>{it.hsn || '—'}</Td>}
                  <Td center>{it.qty} {it.unit}</Td>
                  <Td right>{fmtINR(it.rate).replace('₹', '')}</Td>
                  {showDiscount && <Td center>{Number(it.discountPct) > 0 ? `${it.discountPct}%` : '—'}</Td>}
                  <Td right>{fmtINR(l.taxable).replace('₹', '')}</Td>
                  {interState ? (
                    <Td right>
                      {fmtINR(l.igst).replace('₹', '')}
                      <div className="text-[10px] text-gray-500">@{it.gstRate}%</div>
                    </Td>
                  ) : (
                    <>
                      <Td right>
                        {fmtINR(l.cgst).replace('₹', '')}
                        <div className="text-[10px] text-gray-500">@{half}%</div>
                      </Td>
                      <Td right>
                        {fmtINR(l.sgst).replace('₹', '')}
                        <div className="text-[10px] text-gray-500">@{half}%</div>
                      </Td>
                    </>
                  )}
                  <Td right className="font-medium">{fmtINR(round2(l.taxable + l.tax)).replace('₹', '')}</Td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-4 flex items-start justify-between gap-8">
          <div className="max-w-[55%] text-xs">
            <div className="font-semibold">Amount in words:</div>
            <div className="italic">{amountInWords(totals.grandTotal)}</div>

            <table className="mt-4 w-full border-collapse border border-gray-300 text-[11px]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1 text-left">HSN/SAC</th>
                  <th className="border border-gray-300 px-2 py-1 text-right">Taxable (₹)</th>
                  {interState ? (
                    <th className="border border-gray-300 px-2 py-1 text-right">IGST (₹)</th>
                  ) : (
                    <>
                      <th className="border border-gray-300 px-2 py-1 text-right">CGST (₹)</th>
                      <th className="border border-gray-300 px-2 py-1 text-right">SGST (₹)</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {hsnSummary.map((h) => (
                  <tr key={`${h.hsn}-${h.gstRate}`}>
                    <td className="border border-gray-300 px-2 py-1">{h.hsn} ({h.gstRate}%)</td>
                    <td className="tnum border border-gray-300 px-2 py-1 text-right">{fmtINR(h.taxable).replace('₹', '')}</td>
                    {interState ? (
                      <td className="tnum border border-gray-300 px-2 py-1 text-right">{fmtINR(h.igst).replace('₹', '')}</td>
                    ) : (
                      <>
                        <td className="tnum border border-gray-300 px-2 py-1 text-right">{fmtINR(h.cgst).replace('₹', '')}</td>
                        <td className="tnum border border-gray-300 px-2 py-1 text-right">{fmtINR(h.sgst).replace('₹', '')}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <table className="w-64 shrink-0 text-xs">
            <tbody>
              <TotRow k="Taxable Value" v={fmtINR(totals.taxable)} />
              {totals.discount > 0 && <TotRow k="Discount" v={`− ${fmtINR(totals.discount)}`} />}
              {interState ? (
                <TotRow k="IGST" v={fmtINR(totals.igst)} />
              ) : (
                <>
                  <TotRow k="CGST" v={fmtINR(totals.cgst)} />
                  <TotRow k="SGST" v={fmtINR(totals.sgst)} />
                </>
              )}
              <TotRow k="Round Off" v={fmtINR(totals.roundOff)} />
              <tr className="border-t-2 border-black text-sm font-bold">
                <td className="py-1.5">Grand Total</td>
                <td className="tnum py-1.5 text-right">{fmtINR(totals.grandTotal)}</td>
              </tr>
              {Number(inv.amountPaid) > 0 && (
                <>
                  <TotRow k="Amount Received" v={fmtINR(inv.amountPaid)} />
                  <tr className="font-semibold">
                    <td className="py-1">Balance Due</td>
                    <td className="tnum py-1 text-right">{fmtINR(balance)}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer: bank, terms, signature */}
        <div className="mt-6 grid grid-cols-2 gap-6 border-t border-gray-300 pt-4 text-xs">
          <div>
            <div className="font-semibold">Bank Details</div>
            <table className="mt-1">
              <tbody>
                <MetaRow k="Bank" v={co.bankName} />
                <MetaRow k="A/c No." v={co.bankAccount} />
                <MetaRow k="IFSC" v={co.bankIfsc} />
                <MetaRow k="Branch" v={co.bankBranch} />
                {co.upiId && <MetaRow k="UPI" v={co.upiId} />}
              </tbody>
            </table>
            {inv.notes && <div className="mt-3 text-gray-700">{inv.notes}</div>}
          </div>
          <div className="flex flex-col justify-between">
            <div>
              <div className="font-semibold">Terms &amp; Conditions</div>
              <p className="mt-1 whitespace-pre-line text-[11px] text-gray-700">{co.terms}</p>
            </div>
            <div className="mt-8 text-right">
              <div className="font-semibold">For {co.name}</div>
              <div className="mt-10 border-t border-gray-400 pt-1 text-gray-600">Authorised Signatory</div>
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-gray-200 pt-2 text-center text-[10px] text-gray-500">
          This is a computer-generated invoice.
        </div>
      </div>
    </div>
  )
}

const Th = ({ children, className = '' }) => (
  <th className={`border border-blue-900 px-2 py-1.5 text-center font-semibold ${className}`}>{children}</th>
)
const Td = ({ children, center, right, className = '' }) => (
  <td className={`tnum px-2 py-1.5 ${center ? 'text-center' : ''} ${right ? 'text-right' : ''} ${className}`}>{children}</td>
)
const MetaRow = ({ k, v }) => (
  <tr>
    <td className="pr-3 text-gray-600">{k}</td>
    <td>{v}</td>
  </tr>
)
const TotRow = ({ k, v }) => (
  <tr>
    <td className="py-1 text-gray-700">{k}</td>
    <td className="tnum py-1 text-right font-medium">{v}</td>
  </tr>
)
