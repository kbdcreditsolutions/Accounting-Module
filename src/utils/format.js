// ---------- Currency (Indian digit grouping: 1,23,45,678.90) ----------

const inrFmt = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const inrFmt0 = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export const fmtINR = (n) => inrFmt.format(Number(n) || 0)
export const fmtINR0 = (n) => inrFmt0.format(Number(n) || 0)

// Compact display for dashboard tiles: ₹1.24 L, ₹2.3 Cr
export function fmtCompactINR(n) {
  const v = Number(n) || 0
  const abs = Math.abs(v)
  const sign = v < 0 ? '-' : ''
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(2)} Cr`
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(2)} L`
  if (abs >= 1e3) return `${sign}₹${(abs / 1e3).toFixed(1)}K`
  return `${sign}₹${abs.toFixed(0)}`
}

// ---------- Amount in words (Indian numbering: crore / lakh) ----------

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
  'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen',
  'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty',
  'Seventy', 'Eighty', 'Ninety']

function twoDigits(n) {
  if (n < 20) return ONES[n]
  return `${TENS[Math.floor(n / 10)]}${n % 10 ? ' ' + ONES[n % 10] : ''}`
}

function threeDigits(n) {
  const h = Math.floor(n / 100)
  const rest = n % 100
  let out = ''
  if (h) out += `${ONES[h]} Hundred`
  if (rest) out += `${out ? ' ' : ''}${twoDigits(rest)}`
  return out
}

function integerInWords(n) {
  if (n === 0) return 'Zero'
  let out = ''
  const crore = Math.floor(n / 1e7)
  const lakh = Math.floor((n % 1e7) / 1e5)
  const thousand = Math.floor((n % 1e5) / 1e3)
  const rest = n % 1e3
  if (crore) out += `${integerInWords(crore)} Crore`
  if (lakh) out += `${out ? ' ' : ''}${twoDigits(lakh)} Lakh`
  if (thousand) out += `${out ? ' ' : ''}${twoDigits(thousand)} Thousand`
  if (rest) out += `${out ? ' ' : ''}${threeDigits(rest)}`
  return out
}

export function amountInWords(amount) {
  const v = Math.abs(Number(amount) || 0)
  const rupees = Math.floor(v)
  const paise = Math.round((v - rupees) * 100)
  let out = `${integerInWords(rupees)} Rupees`
  if (paise) out += ` and ${twoDigits(paise)} Paise`
  return `${out} Only`
}

// ---------- Dates & financial year (April–March) ----------

export const today = () => new Date().toISOString().slice(0, 10)

export function fmtDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function addDays(iso, days) {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

// FY start year for a date: Apr 2026 → 2026, Feb 2026 → 2025
export function fyStartYear(iso) {
  const d = new Date(iso + 'T00:00:00')
  return d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1
}

export function fyLabel(startYear) {
  return `FY ${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`
}

// Months of a financial year, Apr..Mar, as {key: 'YYYY-MM', label: 'Apr'}
export function fyMonths(startYear) {
  const out = []
  for (let i = 0; i < 12; i++) {
    const m = (3 + i) % 12
    const y = m >= 3 ? startYear : startYear + 1
    const d = new Date(y, m, 1)
    out.push({
      key: `${y}-${String(m + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-IN', { month: 'short' }),
    })
  }
  return out
}

// ---------- GST math ----------

export function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100
}

// Compute one line: taxable value after discount, plus tax split.
// interState=true → IGST; false → CGST+SGST halves.
export function computeLine(item, interState) {
  const qty = Number(item.qty) || 0
  const rate = Number(item.rate) || 0
  const discountPct = Number(item.discountPct) || 0
  const gstRate = Number(item.gstRate) || 0
  const gross = qty * rate
  const discount = round2(gross * (discountPct / 100))
  const taxable = round2(gross - discount)
  const tax = round2(taxable * (gstRate / 100))
  return {
    gross: round2(gross),
    discount,
    taxable,
    tax,
    cgst: interState ? 0 : round2(tax / 2),
    sgst: interState ? 0 : round2(tax / 2),
    igst: interState ? tax : 0,
  }
}

// Totals across all lines, with round-off to the nearest rupee.
export function computeInvoiceTotals(items, interState) {
  const lines = items.map((it) => computeLine(it, interState))
  const taxable = round2(lines.reduce((s, l) => s + l.taxable, 0))
  const discount = round2(lines.reduce((s, l) => s + l.discount, 0))
  const cgst = round2(lines.reduce((s, l) => s + l.cgst, 0))
  const sgst = round2(lines.reduce((s, l) => s + l.sgst, 0))
  const igst = round2(lines.reduce((s, l) => s + l.igst, 0))
  const beforeRound = round2(taxable + cgst + sgst + igst)
  const grandTotal = Math.round(beforeRound)
  const roundOff = round2(grandTotal - beforeRound)
  return { lines, taxable, discount, cgst, sgst, igst, totalTax: round2(cgst + sgst + igst), roundOff, grandTotal }
}

// GSTIN checksum-light validation (format only)
export const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/
export const isValidGSTIN = (g) => GSTIN_RE.test((g || '').toUpperCase())
