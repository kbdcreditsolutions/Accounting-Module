// Data access for the serverless API.
// Two drivers behind one interface:
//  - PostgREST driver → talks to Supabase using the secret key (server-side only)
//  - Memory driver    → used automatically when no Supabase key is configured,
//                       so local development and CI work without the real DB.
import crypto from 'node:crypto'

const SUPABASE_URL =
  process.env.SUPABASE_URL || 'https://rrqrxgvyydywwielitgs.supabase.co'
const SUPABASE_KEY =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  ''

export const usingMemoryDb = !SUPABASE_KEY || process.env.MEMORY_DB === '1'

// On Vercel the memory DB would silently lose data between cold starts —
// fail loudly instead so the misconfiguration is obvious.
export const missingProdConfig = usingMemoryDb && !!process.env.VERCEL
export const PROD_CONFIG_HINT =
  'Database is not configured. In Vercel → Project → Settings → Environment Variables, add SUPABASE_SECRET_KEY (the sb_secret_… key from Supabase → Project Settings → API keys), then redeploy.'

// ---------- password hashing (scrypt) ----------

export function hashPassword(password) {
  const salt = crypto.randomBytes(16)
  const hash = crypto.scryptSync(password, salt, 32)
  return `s2$${salt.toString('base64')}$${hash.toString('base64')}`
}

export function verifyPassword(password, stored) {
  try {
    const [tag, saltB64, hashB64] = stored.split('$')
    if (tag !== 's2') return false
    const salt = Buffer.from(saltB64, 'base64')
    const expected = Buffer.from(hashB64, 'base64')
    const actual = crypto.scryptSync(password, salt, expected.length)
    return crypto.timingSafeEqual(actual, expected)
  } catch {
    return false
  }
}

// ---------- PostgREST driver ----------

function sbHeaders() {
  const h = {
    apikey: SUPABASE_KEY,
    'Content-Type': 'application/json',
  }
  // Legacy JWT keys also want an Authorization header; new sb_secret_ keys don't.
  if (SUPABASE_KEY.split('.').length === 3) h.Authorization = `Bearer ${SUPABASE_KEY}`
  return h
}

async function sb(method, path, body, extraHeaders = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: { ...sbHeaders(), ...extraHeaders },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Supabase ${method} ${path} → ${res.status}: ${text.slice(0, 300)}`)
  }
  if (res.status === 204) return null
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

const pgDriver = {
  async getUserByUsername(username) {
    // usernames are case-insensitive
    const rows = await sb('GET', `app_users?username=ilike.${encodeURIComponent(username)}&limit=1`)
    return rows?.[0] || null
  },
  async getUserById(id) {
    const rows = await sb('GET', `app_users?id=eq.${id}&limit=1`)
    return rows?.[0] || null
  },
  async listUsers() {
    return (await sb('GET', 'app_users?select=id,company_id,username,display_name,role,active,created_at&order=created_at.asc')) || []
  },
  async createUser(user) {
    const rows = await sb('POST', 'app_users', user, { Prefer: 'return=representation' })
    return rows?.[0]
  },
  async updateUser(id, patch) {
    const rows = await sb('PATCH', `app_users?id=eq.${id}`, patch, { Prefer: 'return=representation' })
    return rows?.[0]
  },
  async listCompanies() {
    return (await sb('GET', 'companies?order=created_at.asc')) || []
  },
  async getCompanyById(id) {
    const rows = await sb('GET', `companies?id=eq.${id}&limit=1`)
    return rows?.[0] || null
  },
  async createCompany(company) {
    const rows = await sb('POST', 'companies', company, { Prefer: 'return=representation' })
    return rows?.[0]
  },
  async createSession(session) {
    const rows = await sb('POST', 'sessions', session, { Prefer: 'return=representation' })
    return rows?.[0]
  },
  async getSession(token) {
    const rows = await sb('GET', `sessions?token=eq.${token}&limit=1`)
    return rows?.[0] || null
  },
  async deleteSession(token) {
    await sb('DELETE', `sessions?token=eq.${token}`)
  },
  async getState(companyId) {
    const rows = await sb('GET', `company_state?company_id=eq.${companyId}&limit=1`)
    return rows?.[0] || null
  },
  async upsertState(companyId, data) {
    await sb('POST', 'company_state', { company_id: companyId, data, updated_at: new Date().toISOString() }, {
      Prefer: 'resolution=merge-duplicates',
    })
  },
}

// ---------- Memory driver (local dev / tests) ----------

const KBD_ID = '6d6c00f1-b16a-47bb-b55f-16164a42a759'
const SRI_ID = '0023ceee-dcd6-48a7-83f7-11127a939ba8'

const g = globalThis
if (!g.__memdb) {
  g.__memdb = {
    companies: [
      { id: KBD_ID, name: 'KBD Credit Solutions', code: 'kbd', created_at: new Date().toISOString() },
      { id: SRI_ID, name: 'SRIDATRI PHYSIO CARE', code: 'sridatri', created_at: new Date().toISOString() },
    ],
    users: [
      { id: 'ad45e87b-e75b-426a-8edf-3ef7dd1674ff', company_id: KBD_ID, username: 'Admin', password_hash: hashPassword('Admin@2026'), display_name: 'KBD Admin', role: 'superadmin', active: true, created_at: new Date().toISOString() },
      { id: 'd09b4090-0c3f-476a-9820-7575c2e7af09', company_id: SRI_ID, username: 'Sridatri', password_hash: hashPassword('Sridatri@2026'), display_name: 'Sridatri Physio Care', role: 'user', active: true, created_at: new Date().toISOString() },
    ],
    sessions: [],
    state: new Map(),
  }
}
const mem = g.__memdb

const memDriver = {
  async getUserByUsername(username) {
    return mem.users.find((u) => u.username.toLowerCase() === String(username).toLowerCase()) || null
  },
  async getUserById(id) {
    return mem.users.find((u) => u.id === id) || null
  },
  async listUsers() {
    return mem.users.map(({ password_hash, ...u }) => u)
  },
  async createUser(user) {
    const rec = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...user }
    mem.users.push(rec)
    return rec
  },
  async updateUser(id, patch) {
    const u = mem.users.find((x) => x.id === id)
    if (u) Object.assign(u, patch)
    return u || null
  },
  async listCompanies() {
    return mem.companies
  },
  async getCompanyById(id) {
    return mem.companies.find((c) => c.id === id) || null
  },
  async createCompany(company) {
    const rec = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...company }
    mem.companies.push(rec)
    return rec
  },
  async createSession(session) {
    const rec = { token: crypto.randomUUID(), created_at: new Date().toISOString(), ...session }
    mem.sessions.push(rec)
    return rec
  },
  async getSession(token) {
    return mem.sessions.find((s) => s.token === token) || null
  },
  async deleteSession(token) {
    mem.sessions = mem.sessions.filter((s) => s.token !== token)
  },
  async getState(companyId) {
    return mem.state.has(companyId) ? { company_id: companyId, data: mem.state.get(companyId) } : null
  },
  async upsertState(companyId, data) {
    mem.state.set(companyId, data)
  },
}

export const db = usingMemoryDb ? memDriver : pgDriver

// ---------- request helpers ----------

export async function readBody(req) {
  if (req.body !== undefined && req.body !== null) {
    return typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body
  }
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? JSON.parse(raw) : {}
}

export function send(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

// Returns {user, company, session} or sends 401 and returns null.
export async function requireAuth(req, res) {
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) {
    send(res, 401, { error: 'Not signed in' })
    return null
  }
  const session = await db.getSession(token)
  if (!session || new Date(session.expires_at) < new Date()) {
    send(res, 401, { error: 'Session expired — please sign in again' })
    return null
  }
  const user = await db.getUserById(session.user_id)
  if (!user || !user.active) {
    send(res, 401, { error: 'Account disabled' })
    return null
  }
  const company = await db.getCompanyById(user.company_id)
  return { user, company, session }
}

export function publicUser(u, company) {
  return {
    id: u.id,
    username: u.username,
    displayName: u.display_name,
    role: u.role,
    companyId: u.company_id,
    companyName: company?.name || '',
    companyCode: company?.code || '',
  }
}
