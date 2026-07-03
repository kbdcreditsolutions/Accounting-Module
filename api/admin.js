import { db, hashPassword, readBody, send, requireAuth } from './_lib/db.js'

// Superadmin-only management endpoint.
// GET  → { companies, users }
// POST → { action: 'createCompany' | 'createUser' | 'setUserActive' | 'resetPassword', ... }

export default async function handler(req, res) {
  try {
    const auth = await requireAuth(req, res)
    if (!auth) return
    if (auth.user.role !== 'superadmin') return send(res, 403, { error: 'Admin access required' })

    if (req.method === 'GET') {
      const [companies, users] = await Promise.all([db.listCompanies(), db.listUsers()])
      return send(res, 200, { companies, users })
    }

    if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' })
    const body = await readBody(req)

    if (body.action === 'createCompany') {
      const name = String(body.name || '').trim()
      if (!name) return send(res, 400, { error: 'Company name is required' })
      const code = (String(body.code || '').trim() || name)
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30)
      const existing = (await db.listCompanies()).find((c) => c.code === code)
      if (existing) return send(res, 400, { error: `Company code "${code}" already exists` })
      const company = await db.createCompany({ name, code })
      return send(res, 200, { company })
    }

    if (body.action === 'createUser') {
      const username = String(body.username || '').trim()
      const password = String(body.password || '')
      const companyId = String(body.companyId || '')
      const role = body.role === 'superadmin' ? 'superadmin' : 'user'
      if (!username || !password || !companyId) {
        return send(res, 400, { error: 'Username, password and company are required' })
      }
      if (password.length < 6) return send(res, 400, { error: 'Password must be at least 6 characters' })
      if (await db.getUserByUsername(username)) return send(res, 400, { error: `Username "${username}" is taken` })
      const company = await db.getCompanyById(companyId)
      if (!company) return send(res, 400, { error: 'Company not found' })
      const user = await db.createUser({
        company_id: companyId,
        username,
        password_hash: hashPassword(password),
        display_name: String(body.displayName || username),
        role,
        active: true,
      })
      const { password_hash, ...safe } = user
      return send(res, 200, { user: safe })
    }

    if (body.action === 'setUserActive') {
      if (body.userId === auth.user.id) return send(res, 400, { error: 'You cannot disable your own account' })
      const user = await db.updateUser(String(body.userId), { active: !!body.active })
      if (!user) return send(res, 404, { error: 'User not found' })
      return send(res, 200, { ok: true })
    }

    if (body.action === 'resetPassword') {
      const password = String(body.password || '')
      if (password.length < 6) return send(res, 400, { error: 'Password must be at least 6 characters' })
      const user = await db.updateUser(String(body.userId), { password_hash: hashPassword(password) })
      if (!user) return send(res, 404, { error: 'User not found' })
      return send(res, 200, { ok: true })
    }

    return send(res, 400, { error: 'Unknown action' })
  } catch (err) {
    console.error('admin error:', err)
    return send(res, 500, { error: 'Server error in admin action' })
  }
}
