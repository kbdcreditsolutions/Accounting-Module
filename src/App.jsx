import React from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { useStore } from './store.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Invoices from './pages/Invoices.jsx'
import InvoiceForm from './pages/InvoiceForm.jsx'
import InvoiceView from './pages/InvoiceView.jsx'
import Clients from './pages/Clients.jsx'
import Items from './pages/Items.jsx'
import Expenses from './pages/Expenses.jsx'
import Reports from './pages/Reports.jsx'
import Settings from './pages/Settings.jsx'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' },
  { to: '/invoices', label: 'Invoices', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zM8 13h8v2H8v-2zm0 4h8v2H8v-2z' },
  { to: '/clients', label: 'Clients', icon: 'M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' },
  { to: '/items', label: 'Items & Services', icon: 'M20 6h-4V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zM10 4h4v2h-4V4z' },
  { to: '/expenses', label: 'Expenses', icon: 'M21 18v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1h-9a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h9zm-9-2h10V8H12v8zm4-2.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z' },
  { to: '/reports', label: 'GST & Reports', icon: 'M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z' },
  { to: '/settings', label: 'Settings', icon: 'M19.14 12.94a7.07 7.07 0 0 0 0-1.88l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.61-.22l-2.39.96a7.03 7.03 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.59.24-1.13.56-1.63.94l-2.39-.96a.5.5 0 0 0-.61.22L2.63 8.84a.5.5 0 0 0 .12.64l2.03 1.58a7.07 7.07 0 0 0 0 1.88l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.13.23.4.32.61.22l2.39-.96c.5.38 1.04.7 1.63.94l.36 2.54c.04.24.25.42.5.42h3.84c.25 0 .46-.18.5-.42l.36-2.54a7.03 7.03 0 0 0 1.63-.94l2.39.96c.22.1.48 0 .61-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z' },
]

export default function App() {
  const { state } = useStore()
  const location = useLocation()
  const printMode = /^\/invoices\/[^/]+\/print/.test(location.pathname)

  if (printMode) {
    return (
      <Routes>
        <Route path="/invoices/:id/print" element={<InvoiceView />} />
      </Routes>
    )
  }

  return (
    <div className="flex min-h-screen">
      <aside className="no-print fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-brand-deep text-white">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-lg font-bold">₹</div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold leading-tight">{state.company.name || 'My Business'}</div>
            <div className="text-[11px] text-blue-200">GST Billing &amp; Accounts</div>
          </div>
        </div>
        <nav className="mt-2 flex-1 space-y-0.5 px-3">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive ? 'bg-white/15 font-medium text-white' : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d={n.icon} /></svg>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-5 py-4 text-[11px] text-blue-200">
          GSTIN: {state.company.gstin || '—'}
        </div>
      </aside>

      <main className="ml-60 min-w-0 flex-1 px-8 py-7">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/invoices/new" element={<InvoiceForm />} />
          <Route path="/invoices/:id/edit" element={<InvoiceForm />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/items" element={<Items />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </main>
    </div>
  )
}
