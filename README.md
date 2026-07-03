# KBD Books — Accounting & GST Billing for Indian Clients

A complete accounting dashboard with built-in GST billing, made for Indian businesses.
Create tax invoices, print them as PDF, track receivables and expenses, and get
month-wise GST summaries for filing support.

## Features

**Dashboard**
- Revenue, collections, outstanding and expense KPIs for the selected financial year (April–March)
- Monthly revenue chart, invoice-status breakdown, net GST payable at a glance
- Recent invoices and top clients

**GST Billing (built-in)**
- GST-compliant tax invoices with HSN/SAC codes, per-line discounts and GST rates (0/5/12/18/28%)
- **Automatic CGST + SGST vs IGST** based on the client's state (place of supply)
- Auto invoice numbering per financial year (e.g. `KBD/26-27/0012`)
- Amount in words in the Indian system (lakh / crore)
- HSN-wise tax summary, round-off, bank & UPI details, authorised-signatory block
- **Print / Save as PDF** — one click opens the browser print dialog with a clean A4 layout
- Record full or partial payments; overdue status is derived from due dates

**Masters & books**
- Clients with GSTIN (validated, state auto-detected from GSTIN)
- Item/service catalog with HSN/SAC, units and default GST rates
- Expense tracking with GST input-credit (ITC) capture

**Reports**
- Month-wise GST summary: taxable value, CGST, SGST, IGST, output tax, ITC, net payable — CSV export
- Client-wise sales for the financial year

All amounts use Indian digit grouping (₹1,23,45,678.90). Data is stored in the
browser's localStorage — no server required. A demo dataset loads on first run;
replace your business profile under **Settings** (and use "Reset to demo data"
any time).

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build in dist/
```

The production build in `dist/` is fully static — host it on any static host
(GitHub Pages, Netlify, Vercel, a shared server).

## Printing invoices as PDF

Open any invoice → **Print / Save as PDF** → choose "Save as PDF" as the
destination in the browser dialog. The layout is tuned for A4 with the app
chrome hidden.

## Tech

Vite + React + Tailwind CSS 4. No backend; state persists to localStorage.
