import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { today } from './utils/format'

const KEY = 'kbd-books-v1'

const uid = () => Math.random().toString(36).slice(2, 10)

// ---------------- Seed data (demo) ----------------

function seedData() {
  const clients = [
    { id: 'c1', name: 'Sharma Textiles Pvt Ltd', gstin: '07AAACS1234F1Z5', email: 'accounts@sharmatextiles.in', phone: '+91 98110 22334', address: '14, Karol Bagh Market', city: 'New Delhi', stateCode: '07', pincode: '110005' },
    { id: 'c2', name: 'Nexus Infotech Solutions LLP', gstin: '29AABFN5678K1Z2', email: 'finance@nexusinfotech.co.in', phone: '+91 99450 66778', address: '2nd Floor, 80 Ft Road, Indiranagar', city: 'Bengaluru', stateCode: '29', pincode: '560038' },
    { id: 'c3', name: 'Patel & Associates', gstin: '24AAEFP9012L1Z8', email: 'office@patelassociates.in', phone: '+91 98250 11223', address: 'B-204, Titanium City Centre', city: 'Ahmedabad', stateCode: '24', pincode: '380015' },
    { id: 'c4', name: 'Meridian Exports Pvt Ltd', gstin: '27AADCM3456J1Z6', email: 'ap@meridianexports.com', phone: '+91 98200 44556', address: '501, Trade Link, Lower Parel', city: 'Mumbai', stateCode: '27', pincode: '400013' },
    { id: 'c5', name: 'Annapurna Foods & Beverages', gstin: '08AABCA7890M1Z3', email: 'billing@annapurnafoods.in', phone: '+91 94140 77889', address: 'G-12, Sitapura Industrial Area', city: 'Jaipur', stateCode: '08', pincode: '302022' },
    { id: 'c6', name: 'Kaveri Agro Industries', gstin: '33AACCK2468P1Z9', email: 'accounts@kaveriagro.in', phone: '+91 98400 33445', address: '45, Mount Road, Guindy', city: 'Chennai', stateCode: '33', pincode: '600032' },
  ]

  const items = [
    { id: 'i1', name: 'Credit Advisory Services', description: 'Business credit profile assessment and advisory', hsn: '997156', unit: 'Nos', rate: 25000, gstRate: 18, type: 'service' },
    { id: 'i2', name: 'Loan Documentation & Processing', description: 'End-to-end loan file preparation and follow-up', hsn: '997159', unit: 'Nos', rate: 15000, gstRate: 18, type: 'service' },
    { id: 'i3', name: 'CIBIL Report Analysis', description: 'Detailed credit report review with improvement plan', hsn: '998399', unit: 'Nos', rate: 5000, gstRate: 18, type: 'service' },
    { id: 'i4', name: 'Accounting & Bookkeeping (Monthly)', description: 'Monthly books maintenance and reconciliation', hsn: '998222', unit: 'Mth', rate: 12000, gstRate: 18, type: 'service' },
    { id: 'i5', name: 'GST Return Filing (GSTR-1 + 3B)', description: 'Monthly GST returns preparation and filing', hsn: '998231', unit: 'Mth', rate: 3500, gstRate: 18, type: 'service' },
    { id: 'i6', name: 'Financial Statement Preparation', description: 'Annual P&L, balance sheet and schedules', hsn: '998221', unit: 'Nos', rate: 20000, gstRate: 18, type: 'service' },
  ]

  // Invoices across FY 2025-26 and FY 2026-27 (today: Jul 2026)
  const mk = (n, clientId, date, dueDays, lines, status, amountPaid = 0) => ({
    id: uid(),
    number: n,
    clientId,
    date,
    dueDate: addDaysISO(date, dueDays),
    items: lines,
    status,
    amountPaid,
    notes: 'Thank you for your business.',
  })
  const L = (itemId, qty, over = {}) => {
    const it = items.find((x) => x.id === itemId)
    return { name: it.name, description: it.description, hsn: it.hsn, unit: it.unit, qty, rate: it.rate, discountPct: 0, gstRate: it.gstRate, ...over }
  }

  const invoices = [
    mk('KBD/25-26/0148', 'c1', '2026-01-12', 15, [L('i4', 3), L('i5', 3)], 'paid', 54870),
    mk('KBD/25-26/0152', 'c2', '2026-02-05', 30, [L('i1', 1), L('i3', 2)], 'paid', 41300),
    mk('KBD/25-26/0159', 'c4', '2026-03-18', 30, [L('i2', 2)], 'paid', 35400),
    mk('KBD/25-26/0161', 'c3', '2026-03-27', 15, [L('i6', 1)], 'paid', 23600),
    mk('KBD/26-27/0001', 'c1', '2026-04-06', 15, [L('i4', 1), L('i5', 1)], 'paid', 18290),
    mk('KBD/26-27/0002', 'c5', '2026-04-14', 30, [L('i1', 1, { discountPct: 10 })], 'paid', 26550),
    mk('KBD/26-27/0003', 'c2', '2026-04-22', 30, [L('i2', 3)], 'paid', 53100),
    mk('KBD/26-27/0004', 'c6', '2026-05-04', 30, [L('i3', 4), L('i5', 2)], 'paid', 31860),
    mk('KBD/26-27/0005', 'c1', '2026-05-11', 15, [L('i4', 1), L('i5', 1)], 'paid', 18290),
    mk('KBD/26-27/0006', 'c4', '2026-05-20', 45, [L('i1', 2), L('i6', 1)], 'partial', 40000),
    mk('KBD/26-27/0007', 'c3', '2026-05-28', 15, [L('i2', 1), L('i3', 1)], 'sent'),
    mk('KBD/26-27/0008', 'c1', '2026-06-08', 15, [L('i4', 1), L('i5', 1)], 'paid', 18290),
    mk('KBD/26-27/0009', 'c5', '2026-06-16', 30, [L('i6', 1), L('i3', 2)], 'sent'),
    mk('KBD/26-27/0010', 'c2', '2026-06-25', 30, [L('i1', 1), L('i2', 1)], 'sent'),
    mk('KBD/26-27/0011', 'c6', '2026-07-01', 30, [L('i5', 3)], 'draft'),
  ]

  const expenses = [
    { id: uid(), date: '2026-04-03', category: 'Rent', vendor: 'Gupta Properties', description: 'Office rent — April', amount: 35000, gstAmount: 0, paymentMode: 'Bank Transfer' },
    { id: uid(), date: '2026-04-10', category: 'Software', vendor: 'Tally Solutions', description: 'TallyPrime annual licence', amount: 21240, gstAmount: 3240, paymentMode: 'Card' },
    { id: uid(), date: '2026-04-21', category: 'Utilities', vendor: 'BSES Rajdhani', description: 'Electricity bill', amount: 6800, gstAmount: 0, paymentMode: 'UPI' },
    { id: uid(), date: '2026-05-02', category: 'Rent', vendor: 'Gupta Properties', description: 'Office rent — May', amount: 35000, gstAmount: 0, paymentMode: 'Bank Transfer' },
    { id: uid(), date: '2026-05-15', category: 'Travel', vendor: 'MakeMyTrip', description: 'Client visit — Mumbai', amount: 14160, gstAmount: 2160, paymentMode: 'Card' },
    { id: uid(), date: '2026-05-24', category: 'Office Supplies', vendor: 'Om Stationers', description: 'Printer paper, files, toner', amount: 5310, gstAmount: 810, paymentMode: 'UPI' },
    { id: uid(), date: '2026-06-01', category: 'Rent', vendor: 'Gupta Properties', description: 'Office rent — June', amount: 35000, gstAmount: 0, paymentMode: 'Bank Transfer' },
    { id: uid(), date: '2026-06-12', category: 'Professional Fees', vendor: 'Verma & Co.', description: 'Internal audit support', amount: 11800, gstAmount: 1800, paymentMode: 'Bank Transfer' },
    { id: uid(), date: '2026-06-27', category: 'Marketing', vendor: 'Google India', description: 'Google Ads — June', amount: 17700, gstAmount: 2700, paymentMode: 'Card' },
    { id: uid(), date: '2026-07-01', category: 'Rent', vendor: 'Gupta Properties', description: 'Office rent — July', amount: 35000, gstAmount: 0, paymentMode: 'Bank Transfer' },
  ]

  return {
    company: {
      name: 'KBD Credit Solutions',
      tagline: 'Credit Advisory • Accounting • GST Services',
      gstin: '07AAKCK4321R1Z7',
      pan: 'AAKCK4321R',
      address: '803, Vikas Deep Building, Laxmi Nagar District Centre',
      city: 'New Delhi',
      stateCode: '07',
      pincode: '110092',
      phone: '+91 98991 00234',
      email: 'kbdcreditsolutions@gmail.com',
      bankName: 'HDFC Bank',
      bankAccount: '50200045678912',
      bankIfsc: 'HDFC0000356',
      bankBranch: 'Laxmi Nagar, New Delhi',
      upiId: 'kbdcredit@hdfcbank',
      invoicePrefix: 'KBD',
      terms: 'Payment is due within the due date mentioned above. Interest @18% p.a. will be charged on delayed payments. All disputes subject to Delhi jurisdiction.',
      logo: '',
    },
    nextSeq: 12,
    clients,
    items,
    invoices,
    expenses,
  }
}

function addDaysISO(iso, days) {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

// ---------------- Store ----------------

const StoreCtx = createContext(null)

export function StoreProvider({ children }) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) return JSON.parse(raw)
    } catch { /* corrupted storage falls through to seed */ }
    return seedData()
  })

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* quota exceeded — keep working in memory */ }
  }, [state])

  const api = useMemo(() => {
    const upsert = (list) => (record) =>
      setState((s) => {
        const arr = s[list]
        const idx = record.id ? arr.findIndex((x) => x.id === record.id) : -1
        const next = idx >= 0
          ? arr.map((x, i) => (i === idx ? { ...x, ...record } : x))
          : [{ ...record, id: record.id || uid() }, ...arr]
        return { ...s, [list]: next }
      })
    const remove = (list) => (id) =>
      setState((s) => ({ ...s, [list]: s[list].filter((x) => x.id !== id) }))

    return {
      saveClient: upsert('clients'),
      deleteClient: remove('clients'),
      saveItem: upsert('items'),
      deleteItem: remove('items'),
      saveExpense: upsert('expenses'),
      deleteExpense: remove('expenses'),
      deleteInvoice: remove('invoices'),

      saveInvoice(inv) {
        setState((s) => {
          let { nextSeq } = s
          let number = inv.number
          if (!inv.id && !number) {
            const fy = fyCode(inv.date || today())
            number = `${s.company.invoicePrefix}/${fy}/${String(nextSeq).padStart(4, '0')}`
            nextSeq += 1
          }
          const record = { ...inv, id: inv.id || uid(), number }
          const idx = s.invoices.findIndex((x) => x.id === record.id)
          const invoices = idx >= 0
            ? s.invoices.map((x, i) => (i === idx ? record : x))
            : [record, ...s.invoices]
          return { ...s, invoices, nextSeq }
        })
      },

      setInvoiceStatus(id, status, amountPaid) {
        setState((s) => ({
          ...s,
          invoices: s.invoices.map((x) =>
            x.id === id ? { ...x, status, ...(amountPaid !== undefined ? { amountPaid } : {}) } : x),
        }))
      },

      saveCompany(company) {
        setState((s) => ({ ...s, company: { ...s.company, ...company } }))
      },

      resetDemo() {
        setState(seedData())
      },
    }
  }, [])

  return <StoreCtx.Provider value={{ state, ...api }}>{children}</StoreCtx.Provider>
}

function fyCode(iso) {
  const d = new Date(iso + 'T00:00:00')
  const start = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1
  return `${start % 100}-${String((start + 1) % 100).padStart(2, '0')}`
}

export const useStore = () => useContext(StoreCtx)

// Display status: overdue is derived, not stored
export function displayStatus(inv) {
  if (inv.status === 'paid') return 'paid'
  if (inv.status === 'draft') return 'draft'
  if (inv.dueDate && inv.dueDate < today()) return 'overdue'
  return inv.status // sent | partial
}
