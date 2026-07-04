import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore, displayStatus } from '../store.jsx'
import { Card, StatusBadge, Button, PageHeader } from '../components/ui.jsx'
import { BarChart, Donut } from '../components/charts.jsx'
import {
  fmtINR0, fmtCompactINR, fmtDate, today, fyStartYear, fyLabel, fyMonths,
  computeInvoiceTotals,
} from '../utils/format'
import { getConfig } from '../data/companyConfig.js'

export default function Dashboard() {
  const { state } = useStore()
  const navigate = useNavigate()
  const cfg = getConfig(state.company)
  const lc = cfg.labels
  const currentFY = fyStartYear(today())
  const [fy, setFy] = useState(currentFY)

  const fyYears = useMemo(() => {
    const ys = new Set(state.invoices.map((i) => fyStartYear(i.date)))
    ys.add(currentFY)
    return [...ys].sort((a, b) => b - a)
  }, [state.invoices, currentFY])

  const data = useMemo(() => {
    const enriched = state.invoices.map((inv) => {
      const client = state.clients.find((c) => c.id === inv.clientId)
      const interState = client ? client.stateCode !== state.company.stateCode : false
      const totals = computeInvoiceTotals(inv.items, interState)
      return { ...inv, client, totals, ds: displayStatus(inv) }
    })

    const inFY = enriched.filter((i) => fyStartYear(i.date) === fy && i.status !== 'draft')
    const revenue = inFY.reduce((s, i) => s + i.totals.grandTotal, 0)
    const received = inFY.reduce((s, i) => s + (Number(i.amountPaid) || 0), 0)
    const outstanding = inFY.reduce(
      (s, i) => s + Math.max(i.totals.grandTotal - (Number(i.amountPaid) || 0), 0), 0)
    const overdueAmt = inFY.filter((i) => i.ds === 'overdue').reduce(
      (s, i) => s + Math.max(i.totals.grandTotal - (Number(i.amountPaid) || 0), 0), 0)
    const gstCollected = inFY.reduce((s, i) => s + i.totals.totalTax, 0)

    const fyExpenses = state.expenses.filter((e) => fyStartYear(e.date) === fy)
    const expensesTotal = fyExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)
    const gstPaid = fyExpenses.reduce((s, e) => s + (Number(e.gstAmount) || 0), 0)

    const months = fyMonths(fy).map((m) => ({
      key: m.key,
      label: m.label,
      full: `${m.label} ${m.key.slice(0, 4)}`,
      value: inFY.filter((i) => i.date.startsWith(m.key)).reduce((s, i) => s + i.totals.grandTotal, 0),
    }))

    const byStatus = (s) => inFY.filter((i) => i.ds === s)
    const donut = [
      { label: 'Paid', value: byStatus('paid').reduce((a, i) => a + i.totals.grandTotal, 0), color: 'var(--color-status-good)' },
      { label: 'Unpaid', value: byStatus('sent').reduce((a, i) => a + Math.max(i.totals.grandTotal - (i.amountPaid || 0), 0), 0), color: 'var(--color-status-warn)' },
      { label: 'Partially paid', value: byStatus('partial').reduce((a, i) => a + Math.max(i.totals.grandTotal - (i.amountPaid || 0), 0), 0), color: 'var(--color-status-serious)' },
      { label: 'Overdue', value: byStatus('overdue').reduce((a, i) => a + Math.max(i.totals.grandTotal - (i.amountPaid || 0), 0), 0), color: 'var(--color-status-critical)' },
    ]

    const clientTotals = new Map()
    for (const i of inFY) {
      const key = i.client?.name || 'Unknown'
      clientTotals.set(key, (clientTotals.get(key) || 0) + i.totals.grandTotal)
    }
    const topClients = [...clientTotals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)

    const recent = [...enriched].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)

    return {
      revenue, received, outstanding, overdueAmt, gstCollected, gstPaid,
      expensesTotal, months, donut, topClients, recent,
      invoiceCount: inFY.length,
    }
  }, [state, fy])

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Business overview for ${fyLabel(fy)}`}
        actions={
          <>
            <select
              value={fy}
              onChange={(e) => setFy(Number(e.target.value))}
              className="rounded-lg border border-baseline bg-surface-1 px-3 py-2 text-sm"
            >
              {fyYears.map((y) => <option key={y} value={y}>{fyLabel(y)}</option>)}
            </select>
            <Button onClick={() => navigate('/invoices/new')}>+ New Invoice</Button>
          </>
        }
      />

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Kpi label="Total Revenue" value={fmtCompactINR(data.revenue)} sub={`${data.invoiceCount} invoices • ${fyLabel(fy)}`} accent="border-l-series-1" />
        <Kpi label="Amount Received" value={fmtCompactINR(data.received)} sub={data.revenue ? `${Math.round((data.received / data.revenue) * 100)}% collected` : '—'} accent="border-l-status-good" />
        <Kpi label="Outstanding" value={fmtCompactINR(data.outstanding)} sub={`${fmtCompactINR(data.overdueAmt)} overdue`} accent="border-l-status-warn" />
        <Kpi label="Expenses" value={fmtCompactINR(data.expensesTotal)} sub={`Net: ${fmtCompactINR(data.revenue - data.expensesTotal)}`} accent="border-l-status-serious" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Revenue chart */}
        <Card className="p-5 xl:col-span-2">
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="text-sm font-semibold">Monthly Revenue</h3>
            <span className="text-xs text-ink-muted">Invoiced value incl. GST, {fyLabel(fy)}</span>
          </div>
          <BarChart data={data.months} />
        </Card>

        {/* Receivables donut */}
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold">Invoice Status</h3>
          <Donut
            segments={data.donut}
            centerValue={fmtCompactINR(data.donut.reduce((s, x) => s + x.value, 0))}
            centerLabel="Total"
          />
          <div className="mt-5 space-y-2 border-t border-grid pt-4 text-sm">
            <div className="flex justify-between"><span className="text-ink-2">GST collected (output)</span><span className="tnum font-medium">{fmtINR0(data.gstCollected)}</span></div>
            <div className="flex justify-between"><span className="text-ink-2">GST paid on expenses (ITC)</span><span className="tnum font-medium">{fmtINR0(data.gstPaid)}</span></div>
            <div className="flex justify-between"><span className="text-ink-2">Net GST payable</span><span className="tnum font-semibold">{fmtINR0(Math.max(data.gstCollected - data.gstPaid, 0))}</span></div>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Recent invoices */}
        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between border-b border-grid px-5 py-3.5">
            <h3 className="text-sm font-semibold">Recent Invoices</h3>
            <Link to="/invoices" className="text-xs font-medium text-brand hover:underline">View all →</Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-muted">
                <th className="px-5 py-2.5 font-medium">Invoice</th>
                <th className="px-3 py-2.5 font-medium">{lc.client}</th>
                <th className="px-3 py-2.5 font-medium">Date</th>
                <th className="px-3 py-2.5 text-right font-medium">Amount</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recent.map((inv) => (
                <tr
                  key={inv.id}
                  className="cursor-pointer border-t border-grid hover:bg-gray-50"
                  onClick={() => navigate(`/invoices/${inv.id}/print`)}
                >
                  <td className="px-5 py-3 font-medium text-brand">{inv.number}</td>
                  <td className="px-3 py-3 text-ink-2">{inv.client?.name || '—'}</td>
                  <td className="px-3 py-3 text-ink-2">{fmtDate(inv.date)}</td>
                  <td className="tnum px-3 py-3 text-right font-medium">{fmtINR0(inv.totals.grandTotal)}</td>
                  <td className="px-5 py-3"><StatusBadge invoice={inv} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Top clients */}
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold">Top {lc.clients} — {fyLabel(fy)}</h3>
          {data.topClients.length === 0 && <p className="text-sm text-ink-muted">No invoices this year yet.</p>}
          <ul className="space-y-3">
            {data.topClients.map(([name, amt], i) => {
              const max = data.topClients[0][1] || 1
              return (
                <li key={name}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="truncate pr-3 text-ink-2">{i + 1}. {name}</span>
                    <span className="tnum shrink-0 font-medium">{fmtCompactINR(amt)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-series-1" style={{ width: `${(amt / max) * 100}%` }} />
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>
    </div>
  )
}

function Kpi({ label, value, sub, accent }) {
  return (
    <Card className={`border-l-4 p-4 ${accent}`}>
      <div className="text-xs font-medium text-ink-2">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 text-xs text-ink-muted">{sub}</div>
    </Card>
  )
}
