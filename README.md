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

All amounts use Indian digit grouping (₹1,23,45,678.90).

**Multi-company with logins**
- Company-level sign-in: every login belongs to one company and sees only that
  company's books (clients, invoices, expenses, settings)
- **Admin Portal** (superadmin only): create companies, create logins for
  testers, reset passwords, disable accounts
- Data lives in Supabase (Postgres); the browser never talks to the database
  directly — Vercel serverless functions in `api/` hold the secret key

## Setup

1. **Supabase (one time):** open your project's SQL Editor and run
   `supabase/setup.sql`. It creates the tables (`companies`, `app_users`,
   `sessions`, `company_state`, all with RLS locked down) and seeds the
   companies and logins.
2. **Vercel:** in Project → Settings → Environment Variables, make sure a
   Supabase key is available as `SUPABASE_SECRET_KEY` (the `sb_secret_…` key)
   or `SUPABASE_SERVICE_ROLE_KEY` (legacy). `SUPABASE_URL` is optional — the
   project URL is the default. Redeploy after adding variables.
3. Each company's books are initialised automatically on first login.

## Run locally

```bash
npm install
node scripts/dev-api.mjs   # API on :3011 (in-memory DB unless SUPABASE_SECRET_KEY is set)
npm run dev                # app on http://localhost:3000 (proxies /api)
```

Without a Supabase key the local API uses an in-memory database with the same
seed logins — handy for offline development; nothing is persisted.

## Printing invoices as PDF

Open any invoice → **Print / Save as PDF** → choose "Save as PDF" as the
destination in the browser dialog. The layout is tuned for A4 with the app
chrome hidden.

## Tech

Vite + React + Tailwind CSS 4. No backend; state persists to localStorage.
