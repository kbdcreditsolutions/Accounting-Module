import React, { useMemo, useState } from 'react'
import { useStore } from '../store.jsx'
import { Card, PageHeader, Button } from '../components/ui.jsx'
import {
  fmtINR, fmtINR0, today, fyStartYear, fyLabel, fyMonths, computeInvoiceTotals, round2,
} from '../utils/format'

export default function Reports() {
  const { state } = useStore()
  const currentFY = fyStartYear(today())
  const [fy, setFy] = useState(currentFY)

  const fyYears = useMemo(() => {
    const ys = new Set([
      ...state.invoices.map((i) => fyStartYear(i.date)),
      ...state.expenses.map((e) => fyStartYear(e.date)),
    ])
    ys.add(currentFY)
    return [...ys].sort((a, b) => b - a)
  }, [state, currentFY])

  const report = useMemo(() => {
    const enriched = state.invoices
      .filter((i) => i.status !== 'draft' && fyStartYear(i.date) === fy)
      .map((inv) => {
        const client = state.clients.find((c) => c.id === inv.clientId)
        const interState = client ? client.stateCode !== state.company.stateCode : false
        return { ...inv, client, totals: computeInvoiceTotals(inv.items, interState) }
      })

    const months = fyMonths(fy).map((m) => {
      const invs = enriched.filter((i) => i.date.startsWith(m.key))
      const exps = state.expenses.filter((e) => e.date.startsWith(m.key))
      const taxable = round2(invs.reduce((s, i) => s + i.totals.taxable, 0))
      const cgst = round2(invs.reduce((s, i) => s + i.totals.cgst, 0))
      const sgst = round2(invs.reduce((s, i) => s + i.totals.sgst, 0))
      const igst = round2(invs.reduce((s, i) => s + i.totals.igst, 0))
      const output = round2(cgst + sgst + igst)
      const itc = round2(exps.reduce((s, e) => s + (Number(e.gstAmount) || 0), 0))
      return { ...m, count: invs.length, taxable, cgst, sgst, igst, output, itc, net: round2(output - itc) }
    })

    const totals = months.reduce(
      (a, m) => ({
        count: a.count + m.count,
        taxable: round2(a.taxable + m.taxable),
        cgst: round2(a.cgst + m.cgst),
        sgst: round2(a.sgst + m.sgst),
        igst: round2(a.igst + m.igst),
        output: round2(a.output + m.output),
        itc: round2(a.itc + m.itc),
        net: round2(a.net + m.net),
      }),
      { count: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, output: 0, itc: 0, net: 0 })

    // Client-wise summary
    const byClient = new Map()
    for (const i of enriched) {
      const key = i.client?.name || 'Unknown'
      const cur = byClient.get(key) || { name: key, gstin: i.client?.gstin || '—', count: 0, taxable: 0, tax: 0, total: 0 }
      cur.count += 1
      cur.taxable = round2(cur.taxable + i.totals.taxable)
      cur.tax = round2(cur.tax + i.totals.totalTax)
      cur.total = round2(cur.total + i.totals.grandTotal)
      byClient.set(key, cur)
    }
    const clients = [...byClient.values()].sort((a, b) => b.total - a.total)

    return { months, totals, clients }
  }, [state, fy])

  const exportCSV = () => {
    const head = 'Month,Invoices,Taxable Value,CGST,SGST,IGST,Output Tax,Input Credit (ITC),Net GST Payable'
    const lines = report.months.map((m) =>
      [`${m.label} ${m.key.slice(0, 4)}`, m.count, m.taxable, m.cgst, m.sgst, m.igst, m.output, m.itc, m.net].join(','))
    const csv = [head, ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `gst-summary-${fyLabel(fy).replace(' ', '-')}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div>
      <PageHeader
        title="GST & Reports"
        subtitle="Month-wise GST liability and client-wise sales for filing support"
        actions={
          <>
            <select value={fy} onChange={(e) => setFy(Number(e.target.value))}
              className="rounded-lg border border-baseline bg-surface-1 px-3 py-2 text-sm">
              {fyYears.map((y) => <option key={y} value={y}>{fyLabel(y)}</option>)}
            </select>
            <Button variant="secondary" onClick={exportCSV}>Export CSV</Button>
          </>
        }
      />

      <Card className="overflow-x-auto">
        <div className="border-b border-grid px-5 py-3.5">
          <h3 className="text-sm font-semibold">GST Summary — {fyLabel(fy)}</h3>
          <p className="mt-0.5 text-xs text-ink-muted">Output tax from finalised invoices; ITC from expense records. Use alongside your GSTR-1 / GSTR-3B working.</p>
        </div>
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="text-left text-xs text-ink-muted">
              <th className="px-5 py-3 font-medium">Month</th>
              <th className="px-3 py-3 text-right font-medium">Invoices</th>
              <th className="px-3 py-3 text-right font-medium">Taxable Value</th>
              <th className="px-3 py-3 text-right font-medium">CGST</th>
              <th className="px-3 py-3 text-right font-medium">SGST</th>
              <th className="px-3 py-3 text-right font-medium">IGST</th>
              <th className="px-3 py-3 text-right font-medium">Output Tax</th>
              <th className="px-3 py-3 text-right font-medium">ITC</th>
              <th className="px-5 py-3 text-right font-medium">Net Payable</th>
            </tr>
          </thead>
          <tbody>
            {report.months.map((m) => (
              <tr key={m.key} className={`border-t border-grid ${m.count === 0 && m.itc === 0 ? 'text-ink-muted' : ''}`}>
                <td className="px-5 py-2.5">{m.label} {m.key.slice(0, 4)}</td>
                <td className="tnum px-3 py-2.5 text-right">{m.count || '—'}</td>
                <td className="tnum px-3 py-2.5 text-right">{fmtINR(m.taxable)}</td>
                <td className="tnum px-3 py-2.5 text-right">{fmtINR(m.cgst)}</td>
                <td className="tnum px-3 py-2.5 text-right">{fmtINR(m.sgst)}</td>
                <td className="tnum px-3 py-2.5 text-right">{fmtINR(m.igst)}</td>
                <td className="tnum px-3 py-2.5 text-right font-medium">{fmtINR(m.output)}</td>
                <td className="tnum px-3 py-2.5 text-right">{fmtINR(m.itc)}</td>
                <td className={`tnum px-5 py-2.5 text-right font-medium ${m.net < 0 ? 'text-good-text' : ''}`}>{fmtINR(m.net)}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-baseline bg-gray-50 font-semibold">
              <td className="px-5 py-3">Total</td>
              <td className="tnum px-3 py-3 text-right">{report.totals.count}</td>
              <td className="tnum px-3 py-3 text-right">{fmtINR(report.totals.taxable)}</td>
              <td className="tnum px-3 py-3 text-right">{fmtINR(report.totals.cgst)}</td>
              <td className="tnum px-3 py-3 text-right">{fmtINR(report.totals.sgst)}</td>
              <td className="tnum px-3 py-3 text-right">{fmtINR(report.totals.igst)}</td>
              <td className="tnum px-3 py-3 text-right">{fmtINR(report.totals.output)}</td>
              <td className="tnum px-3 py-3 text-right">{fmtINR(report.totals.itc)}</td>
              <td className="tnum px-5 py-3 text-right">{fmtINR(report.totals.net)}</td>
            </tr>
          </tbody>
        </table>
      </Card>

      <Card className="mt-4 overflow-x-auto">
        <div className="border-b border-grid px-5 py-3.5">
          <h3 className="text-sm font-semibold">Client-wise Sales — {fyLabel(fy)}</h3>
        </div>
        {report.clients.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-ink-muted">No finalised invoices in {fyLabel(fy)}.</p>
        ) : (
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-muted">
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-3 py-3 font-medium">GSTIN</th>
                <th className="px-3 py-3 text-right font-medium">Invoices</th>
                <th className="px-3 py-3 text-right font-medium">Taxable Value</th>
                <th className="px-3 py-3 text-right font-medium">GST</th>
                <th className="px-5 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {report.clients.map((c) => (
                <tr key={c.name} className="border-t border-grid">
                  <td className="px-5 py-2.5 font-medium">{c.name}</td>
                  <td className="tnum px-3 py-2.5 text-xs">{c.gstin}</td>
                  <td className="tnum px-3 py-2.5 text-right">{c.count}</td>
                  <td className="tnum px-3 py-2.5 text-right">{fmtINR(c.taxable)}</td>
                  <td className="tnum px-3 py-2.5 text-right">{fmtINR(c.tax)}</td>
                  <td className="tnum px-5 py-2.5 text-right font-medium">{fmtINR0(c.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
