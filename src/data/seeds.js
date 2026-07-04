// Per-company starting datasets. Shared by the frontend (reset-to-demo)
// and the API (first-login initialisation), so keep this file free of JSX.
import { DEFAULT_CONFIG, INDUSTRY_PRESETS } from './companyConfig.js'

const uid = () => Math.random().toString(36).slice(2, 10)

function addDaysISO(iso, days) {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function kbdSeed() {
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

  const mk = (n, clientId, date, dueDays, lines, status, amountPaid = 0) => ({
    id: uid(), number: n, clientId, date, dueDate: addDaysISO(date, dueDays),
    items: lines, status, amountPaid, notes: 'Thank you for your business.',
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
      config: { industry: 'credit-finance', ...INDUSTRY_PRESETS['credit-finance'].config },
    },
    nextSeq: 12,
    clients,
    items,
    invoices,
    expenses,
  }
}

export function sridatriSeed() {
  return {
    company: {
      name: 'SRIDATRI PHYSIO CARE',
      tagline: 'Physiotherapy • Rehabilitation • Home Care',
      gstin: '',
      pan: '',
      address: '',
      city: '',
      stateCode: '07',
      pincode: '',
      phone: '',
      email: '',
      bankName: '',
      bankAccount: '',
      bankIfsc: '',
      bankBranch: '',
      upiId: '',
      invoicePrefix: 'SPC',
      terms: 'Payment is due on receipt of this invoice. Health care services provided by a clinical establishment are exempt from GST (Notification 12/2017-CT(R)).',
      logo: '',
      config: { industry: 'healthcare', ...INDUSTRY_PRESETS['healthcare'].config },
    },
    nextSeq: 1,
    clients: [],
    items: [
      { id: 'p1', name: 'Physiotherapy Session (Clinic)', description: '45-minute assessment and treatment session at clinic', hsn: '999312', unit: 'Nos', rate: 800, gstRate: 0, type: 'service' },
      { id: 'p2', name: 'Physiotherapy Home Visit', description: 'Treatment session at patient’s residence', hsn: '999312', unit: 'Nos', rate: 1200, gstRate: 0, type: 'service' },
      { id: 'p3', name: 'Rehabilitation Package (10 sessions)', description: 'Post-surgery / sports injury rehabilitation programme', hsn: '999312', unit: 'Pkg', rate: 7500, gstRate: 0, type: 'service' },
      { id: 'p4', name: 'Ergonomic Assessment (Corporate)', description: 'Workplace ergonomic evaluation and report', hsn: '998399', unit: 'Nos', rate: 5000, gstRate: 18, type: 'service' },
    ],
    invoices: [],
    expenses: [],
  }
}

export function silaaSeed() {
  const clients = [
    { id: 's1', name: 'Trendy Boutique & Co', gstin: '27AABCT1122K1Z4', email: 'orders@trendyboutique.in', phone: '+91 98200 11223', address: '301, Fashion Street, Linking Road', city: 'Mumbai', stateCode: '27', pincode: '400050' },
    { id: 's2', name: 'Style Hub Retail Pvt Ltd', gstin: '07AACCS5566P1Z8', email: 'purchase@stylehub.in', phone: '+91 98110 33445', address: '12, Sarojini Nagar Market', city: 'New Delhi', stateCode: '07', pincode: '110023' },
    { id: 's3', name: 'Ethnic Weaves LLP', gstin: '24AACCE3344N1Z2', email: 'accounts@ethnicweaves.in', phone: '+91 98250 55667', address: '45, Law Garden, Navrangpura', city: 'Ahmedabad', stateCode: '24', pincode: '380009' },
    { id: 's4', name: 'Glamour Garments Exports', gstin: '33AABCG7788Q1Z6', email: 'billing@glamourgarments.com', phone: '+91 98400 77889', address: '18, Anna Salai, T. Nagar', city: 'Chennai', stateCode: '33', pincode: '600017' },
    { id: 's5', name: 'Runway Ready Stores', gstin: '29AAACR9900S1Z3', email: 'finance@runwayready.in', phone: '+91 99450 99001', address: '56, Koramangala 5th Block', city: 'Bengaluru', stateCode: '29', pincode: '560095' },
  ]

  const items = [
    { id: 'sl1', name: 'Cotton Fabric (per metre)', description: 'Premium cotton woven fabric, 44-inch width', hsn: '5208', unit: 'Mtr', rate: 350, gstRate: 5, type: 'goods' },
    { id: 'sl2', name: 'Synthetic Fabric (per metre)', description: 'Polyester/viscose blend fabric, 60-inch width', hsn: '5407', unit: 'Mtr', rate: 420, gstRate: 5, type: 'goods' },
    { id: 'sl3', name: "Men's Formal Shirt", description: 'Full-sleeve cotton formal shirt, assorted sizes', hsn: '6205', unit: 'Nos', rate: 1200, gstRate: 12, type: 'goods' },
    { id: 'sl4', name: "Men's Trousers", description: 'Formal/casual trousers, cotton-polyester blend', hsn: '6203', unit: 'Nos', rate: 1800, gstRate: 12, type: 'goods' },
    { id: 'sl5', name: "Women's Kurti (basic)", description: 'Printed cotton kurti, sizes XS–3XL', hsn: '6211', unit: 'Nos', rate: 850, gstRate: 5, type: 'goods' },
    { id: 'sl6', name: 'Salwar Kameez Set', description: 'Kurta + churidar + dupatta set, ethnic prints', hsn: '6211', unit: 'Set', rate: 2200, gstRate: 12, type: 'goods' },
    { id: 'sl7', name: 'Designer Lehenga Set', description: 'Embroidered lehenga + choli + dupatta, bridal/festive', hsn: '6204', unit: 'Set', rate: 8500, gstRate: 12, type: 'goods' },
    { id: 'sl8', name: 'Silk Saree', description: 'Pure silk saree with blouse piece, 6.3 metres', hsn: '6211', unit: 'Nos', rate: 5500, gstRate: 12, type: 'goods' },
    { id: 'sl9', name: 'Embroidered Dupatta', description: 'Georgette dupatta with zari embroidery', hsn: '6214', unit: 'Nos', rate: 950, gstRate: 5, type: 'goods' },
    { id: 'sl10', name: "Casual T-Shirt", description: 'Round-neck cotton jersey t-shirt, unisex', hsn: '6205', unit: 'Nos', rate: 599, gstRate: 5, type: 'goods' },
    { id: 'sl11', name: 'Stole / Shawl', description: 'Woollen / silk-blend stole, assorted prints', hsn: '6214', unit: 'Nos', rate: 1100, gstRate: 12, type: 'goods' },
    { id: 'sl12', name: 'Custom Stitching Charges', description: 'Tailoring & alterations per garment', hsn: '998821', unit: 'Nos', rate: 500, gstRate: 5, type: 'service' },
  ]

  const mk = (n, clientId, date, dueDays, lines, status, amountPaid = 0) => ({
    id: uid(), number: n, clientId, date, dueDate: addDaysISO(date, dueDays),
    items: lines, status, amountPaid, notes: 'Thank you for shopping with Silaa. Goods once sold will not be taken back unless defective.',
  })
  const L = (itemId, qty, over = {}) => {
    const it = items.find((x) => x.id === itemId)
    return { name: it.name, description: it.description, hsn: it.hsn, unit: it.unit, qty, rate: it.rate, discountPct: 0, gstRate: it.gstRate, ...over }
  }

  const invoices = [
    mk('SLA/26-27/0001', 's1', '2026-04-08', 30, [L('sl3', 24), L('sl4', 12)], 'paid', 63168),
    mk('SLA/26-27/0002', 's2', '2026-04-15', 15, [L('sl5', 50), L('sl10', 30)], 'paid', 69825),
    mk('SLA/26-27/0003', 's3', '2026-04-22', 30, [L('sl1', 200), L('sl2', 150)], 'paid', 107100),
    mk('SLA/26-27/0004', 's4', '2026-05-05', 45, [L('sl8', 10), L('sl7', 4)], 'paid', 99660),
    mk('SLA/26-27/0005', 's5', '2026-05-12', 30, [L('sl6', 20), L('sl9', 20)], 'paid', 72010),
    mk('SLA/26-27/0006', 's1', '2026-05-20', 30, [L('sl3', 36), L('sl10', 60)], 'partial', 60000),
    mk('SLA/26-27/0007', 's2', '2026-06-03', 15, [L('sl11', 15), L('sl12', 30)], 'sent'),
    mk('SLA/26-27/0008', 's3', '2026-06-15', 30, [L('sl1', 300), L('sl2', 200)], 'sent'),
    mk('SLA/26-27/0009', 's4', '2026-06-25', 45, [L('sl7', 6), L('sl8', 8)], 'draft'),
  ]

  const expenses = [
    { id: uid(), date: '2026-04-05', category: 'Rent', vendor: 'Mehta Properties', description: 'Showroom rent — April', amount: 55000, gstAmount: 0, paymentMode: 'Bank Transfer' },
    { id: uid(), date: '2026-04-10', category: 'Raw Materials', vendor: 'Tiruppur Fabrics Mart', description: 'Cotton fabric purchase (bolt stock)', amount: 145600, gstAmount: 6933, paymentMode: 'Bank Transfer' },
    { id: uid(), date: '2026-04-18', category: 'Labour', vendor: 'S. Lakshmanan Tailors', description: 'Contract stitching — April batch', amount: 28000, gstAmount: 0, paymentMode: 'Bank Transfer' },
    { id: uid(), date: '2026-05-02', category: 'Rent', vendor: 'Mehta Properties', description: 'Showroom rent — May', amount: 55000, gstAmount: 0, paymentMode: 'Bank Transfer' },
    { id: uid(), date: '2026-05-08', category: 'Packaging', vendor: 'PrintXcel', description: 'Branded bags, tags, tissue paper', amount: 18880, gstAmount: 2880, paymentMode: 'Card' },
    { id: uid(), date: '2026-05-20', category: 'Marketing', vendor: 'Meta India', description: 'Instagram / Facebook Ads — May', amount: 23600, gstAmount: 3600, paymentMode: 'Card' },
    { id: uid(), date: '2026-06-02', category: 'Rent', vendor: 'Mehta Properties', description: 'Showroom rent — June', amount: 55000, gstAmount: 0, paymentMode: 'Bank Transfer' },
    { id: uid(), date: '2026-06-10', category: 'Raw Materials', vendor: 'Surat Textile House', description: 'Silk & synthetic fabric stock', amount: 212400, gstAmount: 10114, paymentMode: 'Bank Transfer' },
    { id: uid(), date: '2026-06-22', category: 'Utilities', vendor: 'MSEDCL', description: 'Electricity bill — showroom', amount: 9440, gstAmount: 0, paymentMode: 'UPI' },
    { id: uid(), date: '2026-07-01', category: 'Rent', vendor: 'Mehta Properties', description: 'Showroom rent — July', amount: 55000, gstAmount: 0, paymentMode: 'Bank Transfer' },
  ]

  return {
    company: {
      name: 'Silaa',
      tagline: 'Apparel & Fashion • Ethnic Wear • Ready-to-Wear',
      gstin: '',
      pan: '',
      address: '',
      city: '',
      stateCode: '27',
      pincode: '',
      phone: '',
      email: '',
      bankName: '',
      bankAccount: '',
      bankIfsc: '',
      bankBranch: '',
      upiId: '',
      invoicePrefix: 'SLA',
      terms: 'Goods once sold will not be taken back unless defective. Claims for shortage or damage must be raised within 48 hours of delivery. All disputes subject to Mumbai jurisdiction.',
      logo: '',
      config: { industry: 'apparel-fashion', ...INDUSTRY_PRESETS['apparel-fashion'].config },
    },
    nextSeq: 10,
    clients,
    items,
    invoices,
    expenses,
  }
}

export function blankSeed(companyName) {
  return {
    company: {
      name: companyName || 'My Business',
      tagline: '', gstin: '', pan: '', address: '', city: '', stateCode: '07', pincode: '',
      phone: '', email: '', bankName: '', bankAccount: '', bankIfsc: '', bankBranch: '', upiId: '',
      invoicePrefix: (companyName || 'INV').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'INV',
      terms: 'Payment is due within the due date mentioned above.',
      logo: '',
      config: { ...DEFAULT_CONFIG },
    },
    nextSeq: 1,
    clients: [],
    items: [],
    invoices: [],
    expenses: [],
  }
}

export function seedForCompany(code, name) {
  if (code === 'kbd') return kbdSeed()
  if (code === 'sridatri') return sridatriSeed()
  if (code === 'silaa') return silaaSeed()
  return blankSeed(name)
}
