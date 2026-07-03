import { db, readBody, send, requireAuth } from './_lib/db.js'
import { seedForCompany } from '../src/data/seeds.js'

export default async function handler(req, res) {
  try {
    const auth = await requireAuth(req, res)
    if (!auth) return
    const { user, company } = auth

    if (req.method === 'GET') {
      let row = await db.getState(user.company_id)
      if (!row) {
        const data = seedForCompany(company?.code, company?.name)
        await db.upsertState(user.company_id, data)
        row = { data }
      }
      return send(res, 200, { data: row.data })
    }

    if (req.method === 'PUT') {
      const body = await readBody(req)
      if (!body || typeof body.data !== 'object') return send(res, 400, { error: 'Missing data' })
      await db.upsertState(user.company_id, body.data)
      return send(res, 200, { ok: true })
    }

    return send(res, 405, { error: 'Method not allowed' })
  } catch (err) {
    console.error('state error:', err)
    return send(res, 500, { error: 'Server error while syncing data' })
  }
}
